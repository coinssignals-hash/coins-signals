import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find pending notifications that are due
    const { data: pending, error: fetchErr } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(10);

    if (fetchErr) throw fetchErr;
    if (!pending || pending.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing ${pending.length} scheduled notifications`);
    let processed = 0;

    for (const notif of pending) {
      // Mark as sending
      await supabase.from('scheduled_notifications').update({ status: 'sending' }).eq('id', notif.id);

      try {
        const payload: Record<string, unknown> = {
          title: notif.title,
          body: notif.body,
          url: notif.url,
          tag: notif.tag,
        };
        if (notif.filter) payload.filter = notif.filter;

        // Call the existing send-push-notification function
        const response = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        await supabase.from('scheduled_notifications').update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          result: result.results || result,
        }).eq('id', notif.id);

        processed++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        await supabase.from('scheduled_notifications').update({
          status: 'failed',
          result: { error: msg },
        }).eq('id', notif.id);
      }
    }

    return new Response(JSON.stringify({ processed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
