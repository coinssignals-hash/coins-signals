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

// ── FCM v1 Auth: generate OAuth2 access token from Service Account ──

function base64UrlEncode(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64UrlEncodeStr(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function getAccessToken(serviceAccount: { client_email: string; private_key: string; project_id: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncodeStr(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claimSet = base64UrlEncodeStr(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));

  const unsignedToken = `${header}.${claimSet}`;

  // Import RSA private key
  const pemBody = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  const keyBuffer = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', keyBuffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const jwt = `${unsignedToken}.${base64UrlEncode(new Uint8Array(signature))}`;

  // Exchange JWT for access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`OAuth2 token exchange failed: ${err}`);
  }

  const { access_token } = await tokenRes.json();
  return access_token;
}

// ── Send via FCM v1 ──

async function sendFCMv1(
  fcmToken: string,
  title: string,
  body: string,
  data: Record<string, string>,
  accessToken: string,
  projectId: string
): Promise<boolean> {
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      message: {
        token: fcmToken,
        notification: { title, body },
        data,
        android: {
          priority: 'HIGH',
          notification: { sound: 'default', click_action: 'FCM_PLUGIN_ACTIVITY' },
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('FCM v1 error:', response.status, errorText);
    // Token invalid / unregistered
    if (response.status === 404 || errorText.includes('UNREGISTERED')) {
      return false;
    }
    throw new Error(`FCM v1 ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  console.log('FCM v1 result:', JSON.stringify(result));
  return true;
}

// ── VAPID for Web Push ──

async function generateVapidAuthorizationHeader(
  audience: string, subject: string, publicKey: string, privateKey: string
): Promise<string> {
  const b64url = (data: string) =>
    btoa(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  const header = b64url(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = b64url(JSON.stringify({ aud: audience, exp: now + 12 * 3600, sub: subject }));
  const unsigned = `${header}.${payload}`;

  const pkBuf = Uint8Array.from(
    atob(privateKey.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)
  );
  const key = await crypto.subtle.importKey(
    'raw', pkBuf, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(unsigned)
  );
  const sigB64 = b64url(String.fromCharCode(...new Uint8Array(sig)));
  return `vapid t=${unsigned}.${sigB64}, k=${publicKey}`;
}

// ── Main handler ──

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
    const fcmServiceAccountJson = Deno.env.get('FCM_SERVICE_ACCOUNT');

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

    const notificationData: Record<string, string> = {
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

    // ── Native FCM v1 Push ──
    if (fcmServiceAccountJson && nativeSubs.length > 0) {
      try {
        const serviceAccount = JSON.parse(fcmServiceAccountJson);
        const accessToken = await getAccessToken(serviceAccount);

        for (const subscription of nativeSubs) {
          if (!subscription.fcm_token) continue;
          try {
            const sent = await sendFCMv1(
              subscription.fcm_token, payload.title, payload.body,
              notificationData, accessToken, serviceAccount.project_id
            );

            if (sent) {
              results.native.success++;
            } else {
              results.native.failed++;
              await supabase.from('push_subscriptions').delete().eq('id', subscription.id);
              results.errors.push('FCM v1: token unregistered and removed');
            }
          } catch (error: unknown) {
            results.native.failed++;
            results.errors.push(error instanceof Error ? error.message : 'Unknown FCM error');
          }
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'FCM auth error';
        results.errors.push(`FCM v1 auth: ${msg}`);
      }
    } else if (!fcmServiceAccountJson && nativeSubs.length > 0) {
      results.errors.push('FCM_SERVICE_ACCOUNT not configured — skipped native notifications');
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
