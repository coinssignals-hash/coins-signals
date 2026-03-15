import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
  signalId?: string;
  tag?: string;
  filter?: { type: 'country' | 'role'; value: string };
}

async function generateVapidAuthorizationHeader(
  audience: string,
  subject: string,
  publicKey: string,
  privateKey: string
): Promise<string> {
  const header = { typ: 'JWT', alg: 'ES256' };
  const now = Math.floor(Date.now() / 1000);
  const payload = { aud: audience, exp: now + 12 * 60 * 60, sub: subject };

  const base64UrlEncode = (data: string) =>
    btoa(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  const privateKeyBuffer = Uint8Array.from(
    atob(privateKey.replace(/-/g, '+').replace(/_/g, '/')),
    c => c.charCodeAt(0)
  );

  const cryptoKey = await crypto.subtle.importKey(
    'raw', privateKeyBuffer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false, ['sign']
  );

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const signatureB64 = base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
  return `vapid t=${unsignedToken}.${signatureB64}, k=${publicKey}`;
}

/**
 * Send a push notification via Firebase Cloud Messaging (FCM) HTTP v1 API
 */
async function sendFCMNotification(
  fcmToken: string,
  title: string,
  body: string,
  data: Record<string, string>,
  fcmServerKey: string
): Promise<boolean> {
  const response = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `key=${fcmServerKey}`,
    },
    body: JSON.stringify({
      to: fcmToken,
      notification: { title, body, sound: 'default', click_action: 'FCM_PLUGIN_ACTIVITY' },
      data,
      priority: 'high',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('FCM error:', response.status, errorText);
    return false;
  }

  const result = await response.json();
  console.log('FCM result:', JSON.stringify(result));

  // Check for invalid tokens
  if (result.failure > 0 && result.results) {
    for (const r of result.results) {
      if (r.error === 'NotRegistered' || r.error === 'InvalidRegistration') {
        return false; // Token is stale
      }
    }
  }

  return result.success > 0;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth: accept x-api-key OR admin JWT
    const apiKey = req.headers.get('x-api-key');
    const expectedApiKey = Deno.env.get('SIGNALS_API_KEY');
    const authHeader = req.headers.get('authorization');
    let authorized = false;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (apiKey && apiKey === expectedApiKey) {
      authorized = true;
    } else if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        const { data: roleData } = await supabase
          .from('user_roles').select('role')
          .eq('user_id', user.id).eq('role', 'admin').maybeSingle();
        if (roleData) authorized = true;
      }
    }

    if (!authorized) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const payload: NotificationPayload = await req.json();
    console.log('Sending notification:', JSON.stringify(payload));

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');

    // Build filtered user_id list if segmented
    let targetUserIds: string[] | null = null;

    if (payload.filter) {
      const { type, value } = payload.filter;
      if (type === 'country') {
        const { data } = await supabase.from('profiles').select('id').eq('country', value);
        targetUserIds = data?.map(p => p.id) || [];
      } else if (type === 'role') {
        const { data } = await supabase.from('user_roles').select('user_id').eq('role', value);
        targetUserIds = data?.map(r => r.user_id) || [];
      }

      if (targetUserIds && targetUserIds.length === 0) {
        return new Response(JSON.stringify({ success: true, results: { web: { success: 0, failed: 0 }, native: { success: 0, failed: 0 }, errors: ['No users match filter'] } }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Get all subscriptions
    let query = supabase.from('push_subscriptions').select('*');
    if (targetUserIds) {
      query = query.in('user_id', targetUserIds);
    }
    const { data: subscriptions, error: fetchError } = await query;

    if (fetchError) {
      return new Response(JSON.stringify({ error: 'Failed to fetch subscriptions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const webSubs = (subscriptions || []).filter(s => s.platform === 'web' || (!s.platform && s.endpoint));
    const nativeSubs = (subscriptions || []).filter(s => s.platform === 'android' || s.platform === 'ios');

    console.log(`Found ${webSubs.length} web + ${nativeSubs.length} native subscriptions`);

    const notificationData = {
      url: payload.url || '/',
      signalId: payload.signalId || '',
      tag: payload.tag || 'trading-signal',
    };

    const results = {
      web: { success: 0, failed: 0 },
      native: { success: 0, failed: 0 },
      errors: [] as string[],
    };

    // ── Web Push ──
    const webNotificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      ...notificationData,
    });

    for (const subscription of webSubs) {
      if (!subscription.endpoint) continue;
      try {
        const endpoint = new URL(subscription.endpoint);
        const audience = `${endpoint.protocol}//${endpoint.host}`;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'TTL': '86400',
        };

        if (vapidPublicKey && vapidPrivateKey) {
          try {
            headers['Authorization'] = await generateVapidAuthorizationHeader(
              audience, 'mailto:notifications@coinssignals.app', vapidPublicKey, vapidPrivateKey
            );
          } catch { /* send without auth */ }
        }

        const response = await fetch(subscription.endpoint, {
          method: 'POST', headers, body: webNotificationPayload,
        });

        if (response.ok) {
          results.web.success++;
        } else {
          results.web.failed++;
          const errorText = await response.text();
          results.errors.push(`Web ${response.status}: ${errorText}`);
          if (response.status === 410 || response.status === 404) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
          }
        }
      } catch (error: unknown) {
        results.web.failed++;
        results.errors.push(error instanceof Error ? error.message : 'Unknown web error');
      }
    }

    // ── Native FCM Push ──
    if (fcmServerKey && nativeSubs.length > 0) {
      for (const subscription of nativeSubs) {
        if (!subscription.fcm_token) continue;
        try {
          const sent = await sendFCMNotification(
            subscription.fcm_token,
            payload.title,
            payload.body,
            notificationData,
            fcmServerKey
          );

          if (sent) {
            results.native.success++;
          } else {
            results.native.failed++;
            // Remove stale token
            await supabase.from('push_subscriptions').delete().eq('id', subscription.id);
            results.errors.push('FCM: token invalidated and removed');
          }
        } catch (error: unknown) {
          results.native.failed++;
          results.errors.push(error instanceof Error ? error.message : 'Unknown FCM error');
        }
      }
    } else if (!fcmServerKey && nativeSubs.length > 0) {
      results.errors.push('FCM_SERVER_KEY not configured — skipped native notifications');
    }

    console.log('Notification results:', JSON.stringify(results));
    return new Response(JSON.stringify({ success: true, results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
