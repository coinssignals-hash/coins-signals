import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

interface SignalPayload {
  currency_pair: string;
  datetime?: string;
  status?: 'active' | 'pending' | 'completed' | 'cancelled';
  probability: number;
  trend: 'bullish' | 'bearish';
  action: 'BUY' | 'SELL';
  entry_price: number;
  take_profit: number;
  stop_loss: number;
  support?: number;
  resistance?: number;
  session_data?: { session: string; volume: string; volatility: string }[];
  analysis_data?: { label: string; value: number }[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify API key
    const apiKey = req.headers.get('x-api-key');
    const expectedApiKey = Deno.env.get('SIGNALS_API_KEY');

    if (!apiKey || apiKey !== expectedApiKey) {
      console.error('Invalid or missing API key');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: SignalPayload = await req.json();
    console.log('Received signal payload:', JSON.stringify(payload));

    // Validate required fields
    if (!payload.currency_pair || !payload.entry_price || !payload.take_profit || !payload.stop_loss) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields', 
          required: ['currency_pair', 'entry_price', 'take_profit', 'stop_loss', 'probability', 'trend', 'action'] 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert signal into database
    const { data, error } = await supabase
      .from('trading_signals')
      .insert({
        currency_pair: payload.currency_pair,
        datetime: payload.datetime || new Date().toISOString(),
        status: payload.status || 'active',
        probability: payload.probability,
        trend: payload.trend,
        action: payload.action,
        entry_price: payload.entry_price,
        take_profit: payload.take_profit,
        stop_loss: payload.stop_loss,
        support: payload.support,
        resistance: payload.resistance,
        session_data: payload.session_data || [],
        analysis_data: payload.analysis_data || [],
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to insert signal', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Signal inserted successfully:', data.id);

    // Send push notification to all subscribers
    try {
      const actionText = payload.action === 'BUY' ? 'COMPRAR' : 'VENDER';
      const notificationResponse = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': expectedApiKey,
        },
        body: JSON.stringify({
          title: `📈 ${payload.currency_pair} - ${actionText}`,
          body: `Nueva señal: ${actionText} a ${payload.entry_price} | Probabilidad: ${payload.probability}%`,
          url: '/',
          signalId: data.id,
          tag: `signal-${data.id}`,
        }),
      });

      const notificationResult = await notificationResponse.json();
      console.log('Push notification result:', notificationResult);
    } catch (notifError) {
      console.error('Failed to send push notification:', notifError);
      // Don't fail the request if notification fails
    }

    return new Response(
      JSON.stringify({ success: true, signal: data }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in insert-signal function:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});