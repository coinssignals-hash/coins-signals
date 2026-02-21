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
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = await req.json();

    // Validate required fields
    if (!payload.currency_pair || !payload.entry_price || !payload.take_profit || !payload.stop_loss) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('trading_signals')
      .insert({
        currency_pair: payload.currency_pair,
        datetime: new Date().toISOString(),
        status: payload.status || 'active',
        probability: payload.probability || 50,
        trend: payload.trend || 'bullish',
        action: payload.action || 'BUY',
        entry_price: payload.entry_price,
        take_profit: payload.take_profit,
        stop_loss: payload.stop_loss,
        support: payload.support,
        resistance: payload.resistance,
        session_data: [],
        analysis_data: [],
      })
      .select()
      .single();

    if (error) {
      console.error('DB error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Trigger push notification via existing function
    try {
      const apiKey = Deno.env.get('SIGNALS_API_KEY');
      const actionText = payload.action === 'BUY' ? 'COMPRAR' : 'VENDER';
      await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey || '' },
        body: JSON.stringify({
          title: `📈 ${payload.currency_pair} - ${actionText}`,
          body: `Nueva señal: ${actionText} a ${payload.entry_price} | Probabilidad: ${payload.probability}%`,
          url: '/',
          signalId: data.id,
          tag: `signal-${data.id}`,
        }),
      });
    } catch (e) {
      console.error('Push notification failed:', e);
    }

    return new Response(JSON.stringify({ success: true, signal: data }), {
      status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
