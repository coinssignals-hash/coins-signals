import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { currencyPair, closedResult, closedPrice, signalId } = await req.json();

    if (!currencyPair || !closedResult || !closedPrice) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isTP = closedResult === 'tp_hit';
    const emoji = isTP ? '✅' : '❌';
    const resultLabel = isTP ? 'Take Profit' : 'Stop Loss';

    const title = `${emoji} ${currencyPair} — ${resultLabel}`;
    const body = `La señal ${currencyPair} alcanzó el ${resultLabel} a ${Number(closedPrice).toFixed(3)}`;

    // Get all push subscriptions and send notifications
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: subscriptions, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (fetchError) {
      console.error('Failed to fetch subscriptions:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[signal-closed-notify] Sending to ${subscriptions?.length || 0} subscribers: ${title}`);

    const notificationPayload = JSON.stringify({
      title,
      body,
      url: '/signals',
      signalId,
      tag: `signal-closed-${signalId}`,
    });

    const results = { success: 0, failed: 0 };

    for (const sub of subscriptions || []) {
      try {
        const response = await fetch(sub.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'TTL': '86400',
          },
          body: notificationPayload,
        });

        if (response.ok) {
          results.success++;
        } else {
          results.failed++;
          // Remove invalid subscriptions
          if (response.status === 410 || response.status === 404) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
          }
        }
      } catch {
        results.failed++;
      }
    }

    console.log(`[signal-closed-notify] Results:`, results);

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[signal-closed-notify] Error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
