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
    const FMP_API_KEY = Deno.env.get('FMP_API_KEY');
    const SIGNALS_API_KEY = Deno.env.get('SIGNALS_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!FMP_API_KEY) throw new Error('FMP_API_KEY not configured');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get today's date in YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    const nowMs = Date.now();
    const fifteenMinMs = 15 * 60 * 1000;
    const twentyMinMs = 20 * 60 * 1000;

    // Fetch today's economic events from FMP
    const fmpUrl = `https://financialmodelingprep.com/api/v3/economic_calendar?from=${today}&to=${today}&apikey=${FMP_API_KEY}`;
    const fmpRes = await fetch(fmpUrl);
    if (!fmpRes.ok) {
      console.error('FMP fetch failed:', fmpRes.status);
      return new Response(JSON.stringify({ error: 'FMP fetch failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const events = await fmpRes.json();
    console.log(`Fetched ${events.length} events for ${today}`);

    // Filter high-impact events happening in 10-20 minutes from now
    const upcomingHighImpact = (events || []).filter((e: any) => {
      if (e.impact !== 'High') return false;
      if (!e.date) return false;
      
      const eventTime = new Date(e.date).getTime();
      const diff = eventTime - nowMs;
      
      // Event is between 10 and 20 minutes away
      return diff > (fifteenMinMs - 5 * 60 * 1000) && diff <= twentyMinMs;
    });

    if (upcomingHighImpact.length === 0) {
      console.log('No upcoming high-impact events in the next 15-20 minutes');
      return new Response(JSON.stringify({ sent: 0, events: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${upcomingHighImpact.length} high-impact events soon`);

    // Get users who have calendar alerts enabled in their config
    const { data: alertConfigs } = await supabase
      .from('user_alert_configs')
      .select('user_id, config');

    const enabledUserIds = new Set<string>();
    for (const ac of alertConfigs || []) {
      const cfg = ac.config as any;
      if (cfg?.enableCalendarAlerts) {
        enabledUserIds.add(ac.user_id);
      }
    }

    if (enabledUserIds.size === 0) {
      console.log('No users with calendar alerts enabled');
      return new Response(JSON.stringify({ sent: 0, events: upcomingHighImpact.length, users: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get push subscriptions for enabled users
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', Array.from(enabledUserIds));

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No push subscriptions for enabled users');
      return new Response(JSON.stringify({ sent: 0, events: upcomingHighImpact.length, users: enabledUserIds.size }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build notification
    const eventNames = upcomingHighImpact
      .slice(0, 3)
      .map((e: any) => `${e.event} (${e.currency})`)
      .join(', ');

    const title = '⚡ Evento de Alto Impacto en 15 min';
    const body = upcomingHighImpact.length === 1
      ? `${upcomingHighImpact[0].event} (${upcomingHighImpact[0].currency}) se publica pronto`
      : `${upcomingHighImpact.length} eventos: ${eventNames}`;

    // Send push via the send-push-notification function internally
    // Or send directly to avoid circular dependency
    const notificationPayload = JSON.stringify({
      title,
      body,
      url: '/tools/economic-calendar',
      tag: 'economic-event-alert',
    });

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      try {
        const response = await fetch(sub.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'TTL': '300',
          },
          body: notificationPayload,
        });

        if (response.ok) {
          sent++;
        } else {
          failed++;
          if (response.status === 410 || response.status === 404) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
          }
        }
      } catch (err) {
        failed++;
        console.error('Push error:', err);
      }
    }

    console.log(`Sent ${sent} notifications, ${failed} failed for ${upcomingHighImpact.length} events`);

    return new Response(JSON.stringify({
      sent,
      failed,
      events: upcomingHighImpact.length,
      eventNames,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('economic-event-alerts error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
