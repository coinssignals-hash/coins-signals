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
    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(JSON.stringify({ error: 'VAPID keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

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
        return new Response(JSON.stringify({ success: true, results: { success: 0, failed: 0, errors: ['No users match filter'] } }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Get subscriptions (filtered or all)
    let query = supabase.from('push_subscriptions').select('*');
    if (targetUserIds) {
      query = query.in('user_id', targetUserIds);
    }
    const { data: subscriptions, error: fetchError } = await query;

    if (fetchError) {
      return new Response(JSON.stringify({ error: 'Failed to fetch subscriptions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`Found ${subscriptions?.length || 0} subscriptions (filter: ${payload.filter?.type || 'none'})`);

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || '/',
      signalId: payload.signalId,
      tag: payload.tag || 'trading-signal',
    });

    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const subscription of subscriptions || []) {
      try {
        const endpoint = new URL(subscription.endpoint);
        const audience = `${endpoint.protocol}//${endpoint.host}`;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'TTL': '86400',
        };

        try {
          headers['Authorization'] = await generateVapidAuthorizationHeader(
            audience, 'mailto:notifications@coinssignals.app', vapidPublicKey, vapidPrivateKey
          );
        } catch { /* send without auth */ }

        const response = await fetch(subscription.endpoint, {
          method: 'POST', headers, body: notificationPayload,
        });

        if (response.ok) {
          results.success++;
        } else {
          results.failed++;
          const errorText = await response.text();
          results.errors.push(`${response.status}: ${errorText}`);
          if (response.status === 410 || response.status === 404) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
          }
        }
      } catch (error: unknown) {
        results.failed++;
        results.errors.push(error instanceof Error ? error.message : 'Unknown error');
      }
    }

    console.log('Notification results:', results);
    return new Response(JSON.stringify({ success: true, results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
