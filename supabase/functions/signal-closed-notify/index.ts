import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ── FCM v1 helpers ──

function base64UrlEncode(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64UrlEncodeStr(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function getAccessToken(sa: { client_email: string; private_key: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncodeStr(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64UrlEncodeStr(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600,
  }));
  const unsigned = `${header}.${claims}`;

  const pemBody = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  const keyBuf = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    'pkcs8', keyBuf, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
  const jwt = `${unsigned}.${base64UrlEncode(new Uint8Array(sig))}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  if (!res.ok) throw new Error(`OAuth2 failed: ${await res.text()}`);
  return (await res.json()).access_token;
}

async function sendFCMv1(
  token: string, title: string, body: string, data: Record<string, string>,
  accessToken: string, projectId: string
): Promise<boolean> {
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
    body: JSON.stringify({
      message: {
        token,
        notification: { title, body },
        data,
        android: { priority: 'HIGH', notification: { sound: 'default', click_action: 'FCM_PLUGIN_ACTIVITY' } },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('FCM v1 error:', res.status, err);
    return !(res.status === 404 || err.includes('UNREGISTERED'));
  }
  return true;
}

// ── Main ──

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

    const cleanPublic = vapidPublicKey.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_').trim();
    const cleanPrivate = vapidPrivateKey.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_').trim();

    webpush.setVapidDetails('mailto:notifications@ecosignal.app', cleanPublic, cleanPrivate);

    const isTP = closedResult === 'tp_hit';
    const emoji = isTP ? '✅' : '❌';
    const resultLabel = isTP ? 'Take Profit' : 'Stop Loss';

    const title = `${emoji} ${currencyPair} — ${resultLabel}`;
    const body = `La señal ${currencyPair} alcanzó el ${resultLabel} a ${Number(closedPrice).toFixed(3)}`;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: subscriptions, error: fetchError } = await supabase
      .from('push_subscriptions').select('*');

    if (fetchError) {
      console.error('Failed to fetch subscriptions:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const webSubs = (subscriptions || []).filter(s => s.platform === 'web' || (!s.platform && s.endpoint));
    const nativeSubs = (subscriptions || []).filter(s => s.platform === 'android' || s.platform === 'ios');

    console.log(`[signal-closed-notify] Sending to ${webSubs.length} web + ${nativeSubs.length} native: ${title}`);

    const notifData: Record<string, string> = {
      url: '/signals',
      signalId: signalId || '',
      tag: `signal-closed-${signalId}`,
    };

    const notificationPayload = JSON.stringify({ title, body, ...notifData });
    const pushResults = { success: 0, failed: 0 };

    // Web push
    for (const sub of webSubs) {
      if (!sub.endpoint) continue;
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          notificationPayload
        );
        pushResults.success++;
      } catch (err: any) {
        console.error(`Push failed for ${sub.endpoint}:`, err?.statusCode, err?.body);
        pushResults.failed++;
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        }
      }
    }

    // Native FCM v1
    const fcmResults = { success: 0, failed: 0 };
    const fcmServiceAccountJson = Deno.env.get('FCM_SERVICE_ACCOUNT');

    if (fcmServiceAccountJson && nativeSubs.length > 0) {
      try {
        const sa = JSON.parse(fcmServiceAccountJson);
        const accessToken = await getAccessToken(sa);

        for (const sub of nativeSubs) {
          if (!sub.fcm_token) continue;
          try {
            const sent = await sendFCMv1(
              sub.fcm_token, title, body, notifData, accessToken, sa.project_id
            );
            if (sent) {
              fcmResults.success++;
            } else {
              fcmResults.failed++;
              await supabase.from('push_subscriptions').delete().eq('id', sub.id);
            }
          } catch (e: unknown) {
            fcmResults.failed++;
            console.error('FCM v1 send error:', e);
          }
        }
      } catch (e) {
        console.error('FCM v1 auth error:', e);
      }
    }

    console.log(`[signal-closed-notify] Web: ${JSON.stringify(pushResults)}, Native: ${JSON.stringify(fcmResults)}`);

    // --- WhatsApp notifications ---
    const whatsappResults = { success: 0, failed: 0, skipped: 0 };

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_WHATSAPP_FROM');

    if (accountSid && authToken && fromNumber) {
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

        for (const profile of profiles || []) {
          if (!profile.whatsapp_number) { whatsappResults.skipped++; continue; }
          try {
            const toWhatsApp = profile.whatsapp_number.startsWith('whatsapp:')
              ? profile.whatsapp_number : `whatsapp:${profile.whatsapp_number}`;
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

            if (response.ok) { whatsappResults.success++; }
            else {
              const err = await response.json();
              console.error(`WhatsApp failed:`, err?.message);
              whatsappResults.failed++;
            }
          } catch (err) {
            console.error(`WhatsApp error:`, err);
            whatsappResults.failed++;
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, push: pushResults, native: fcmResults, whatsapp: whatsappResults }),
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
