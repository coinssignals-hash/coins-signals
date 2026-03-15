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
    const payload = await req.json();
    const sub = payload.subscription;
    console.log('Received subscription:', JSON.stringify(payload));

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract user_id from JWT if present
    let userId: string | null = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) userId = user.id;
    }

    const userAgent = req.headers.get('user-agent') || '';

    // ── Native push (FCM / APNs) ──
    if (sub?.native === true && sub?.token) {
      const platform = sub.platform || 'android'; // 'android' | 'ios'

      const { data, error } = await supabase
        .from('push_subscriptions')
        .upsert({
          fcm_token: sub.token,
          platform,
          user_agent: userAgent,
          ...(userId && { user_id: userId }),
        }, {
          onConflict: 'fcm_token',
        })
        .select()
        .single();

      if (error) {
        console.error('Database error (native):', error);
        return new Response(
          JSON.stringify({ error: 'Failed to save native token', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Native token saved:', data.id, 'platform:', platform, 'user:', userId);
      return new Response(
        JSON.stringify({ success: true, id: data.id }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Web Push ──
    if (!sub?.endpoint || !sub?.keys) {
      return new Response(
        JSON.stringify({ error: 'Invalid subscription data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate endpoint
    try {
      const endpointUrl = new URL(sub.endpoint);
      if (endpointUrl.protocol !== 'https:') {
        return new Response(
          JSON.stringify({ error: 'Endpoint must use HTTPS' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid endpoint URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (sub.keys.p256dh.length < 10 || sub.keys.auth.length < 10) {
      return new Response(
        JSON.stringify({ error: 'Invalid subscription keys' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert({
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        platform: 'web',
        user_agent: userAgent,
        ...(userId && { user_id: userId }),
      }, {
        onConflict: 'endpoint',
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to save subscription', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Web subscription saved:', data.id, 'user:', userId);
    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in save-push-subscription:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
