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

    const pushResults = { success: 0, failed: 0 };

    for (const sub of subscriptions || []) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          notificationPayload
        );
        pushResults.success++;
      } catch (err: any) {
        console.error(`Push failed for ${sub.endpoint}:`, err?.statusCode, err?.body);
        pushResults.failed++;
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
          console.log(`Removed expired subscription: ${sub.endpoint}`);
        }
      }
    }

    console.log(`[signal-closed-notify] Push results:`, pushResults);

    // --- WhatsApp notifications ---
    const whatsappResults = { success: 0, failed: 0, skipped: 0 };

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_WHATSAPP_FROM');

    if (accountSid && authToken && fromNumber) {
      // Get users with WhatsApp notifications enabled
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('whatsapp_number')
        .eq('whatsapp_notifications_enabled', true)
        .not('whatsapp_number', 'is', null);

      if (profilesError) {
        console.error('Failed to fetch WhatsApp profiles:', profilesError);
      } else {
        const whatsappMessage = `${emoji} *${currencyPair}* — ${resultLabel}\n\nLa señal alcanzó el ${resultLabel} a *${Number(closedPrice).toFixed(3)}*\n\n📊 Ver señales en la app`;

        const fromWhatsApp = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

        console.log(`[signal-closed-notify] Sending WhatsApp to ${profiles?.length || 0} users`);

        for (const profile of profiles || []) {
          if (!profile.whatsapp_number) {
            whatsappResults.skipped++;
            continue;
          }

          try {
            const toWhatsApp = profile.whatsapp_number.startsWith('whatsapp:')
              ? profile.whatsapp_number
              : `whatsapp:${profile.whatsapp_number}`;

            const formData = new URLSearchParams();
            formData.append('To', toWhatsApp);
            formData.append('From', fromWhatsApp);
            formData.append('Body', whatsappMessage);

            const response = await fetch(twilioUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: formData.toString(),
            });

            if (response.ok) {
              whatsappResults.success++;
            } else {
              const err = await response.json();
              console.error(`WhatsApp failed for ${profile.whatsapp_number}:`, err?.message);
              whatsappResults.failed++;
            }
          } catch (err) {
            console.error(`WhatsApp error:`, err);
            whatsappResults.failed++;
          }
        }
      }
    } else {
      console.log('[signal-closed-notify] Twilio not configured, skipping WhatsApp');
    }

    console.log(`[signal-closed-notify] WhatsApp results:`, whatsappResults);

    return new Response(
      JSON.stringify({ success: true, push: pushResults, whatsapp: whatsappResults }),
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
