import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

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

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('VAPID keys not configured');
      return new Response(
        JSON.stringify({ error: 'VAPID keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ensure keys are URL-safe base64 without padding
    const cleanPublic = vapidPublicKey.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_').trim();
    const cleanPrivate = vapidPrivateKey.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_').trim();


    webpush.setVapidDetails(
      'mailto:notifications@ecosignal.app',
      cleanPublic,
      cleanPrivate
    );

    const isTP = closedResult === 'tp_hit';
    const emoji = isTP ? '✅' : '❌';
    const resultLabel = isTP ? 'Take Profit' : 'Stop Loss';

    const title = `${emoji} ${currencyPair} — ${resultLabel}`;
    const body = `La señal ${currencyPair} alcanzó el ${resultLabel} a ${Number(closedPrice).toFixed(3)}`;

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
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          notificationPayload
        );
        results.success++;
      } catch (err: any) {
        console.error(`Push failed for ${sub.endpoint}:`, err?.statusCode, err?.body);
        results.failed++;
        // Remove expired/invalid subscriptions
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
          console.log(`Removed expired subscription: ${sub.endpoint}`);
        }
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
