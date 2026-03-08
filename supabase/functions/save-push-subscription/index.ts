import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface SubscriptionPayload {
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: SubscriptionPayload = await req.json();
    console.log('Received subscription:', JSON.stringify(payload));

    if (!payload.subscription?.endpoint || !payload.subscription?.keys) {
      return new Response(
        JSON.stringify({ error: 'Invalid subscription data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate endpoint is a valid HTTPS URL
    try {
      const endpointUrl = new URL(payload.subscription.endpoint);
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

    // Validate key lengths
    if (payload.subscription.keys.p256dh.length < 10 || payload.subscription.keys.auth.length < 10) {
      return new Response(
        JSON.stringify({ error: 'Invalid subscription keys' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    // Upsert subscription (update if endpoint exists, insert if not)
    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert({
        endpoint: payload.subscription.endpoint,
        p256dh: payload.subscription.keys.p256dh,
        auth: payload.subscription.keys.auth,
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

    console.log('Subscription saved:', data.id, 'user:', userId);

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
