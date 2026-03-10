import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

const CURRENCY_PAIR_REGEX = /^[A-Z]{2,6}\/[A-Z]{2,6}$/;

function validateSignalPayload(payload: unknown): { valid: boolean; error?: string; data?: Record<string, unknown> } {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Invalid payload' };
  }

  const p = payload as Record<string, unknown>;

  // Required fields
  if (typeof p.currency_pair !== 'string' || !CURRENCY_PAIR_REGEX.test(p.currency_pair)) {
    return { valid: false, error: 'currency_pair must match format like EUR/USD' };
  }
  if (typeof p.entry_price !== 'number' || !isFinite(p.entry_price) || p.entry_price <= 0) {
    return { valid: false, error: 'entry_price must be a positive finite number' };
  }
  if (typeof p.take_profit !== 'number' || !isFinite(p.take_profit) || p.take_profit <= 0) {
    return { valid: false, error: 'take_profit must be a positive finite number' };
  }
  if (typeof p.stop_loss !== 'number' || !isFinite(p.stop_loss) || p.stop_loss <= 0) {
    return { valid: false, error: 'stop_loss must be a positive finite number' };
  }
  if (typeof p.probability !== 'number' || p.probability < 0 || p.probability > 100) {
    return { valid: false, error: 'probability must be 0-100' };
  }
  if (!['bullish', 'bearish'].includes(p.trend as string)) {
    return { valid: false, error: 'trend must be bullish or bearish' };
  }
  if (!['BUY', 'SELL'].includes(p.action as string)) {
    return { valid: false, error: 'action must be BUY or SELL' };
  }

  // Optional fields
  if (p.status !== undefined && !['active', 'pending', 'completed', 'cancelled'].includes(p.status as string)) {
    return { valid: false, error: 'status must be active, pending, completed, or cancelled' };
  }
  if (p.support !== undefined && (typeof p.support !== 'number' || !isFinite(p.support))) {
    return { valid: false, error: 'support must be a finite number' };
  }
  if (p.resistance !== undefined && (typeof p.resistance !== 'number' || !isFinite(p.resistance))) {
    return { valid: false, error: 'resistance must be a finite number' };
  }

  // Limit JSONB payload sizes
  if (p.session_data !== undefined) {
    const sd = JSON.stringify(p.session_data);
    if (sd.length > 10000) return { valid: false, error: 'session_data too large (max 10KB)' };
  }
  if (p.analysis_data !== undefined) {
    const ad = JSON.stringify(p.analysis_data);
    if (ad.length > 10000) return { valid: false, error: 'analysis_data too large (max 10KB)' };
  }

  return { valid: true, data: p };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify API key
    const apiKey = req.headers.get('x-api-key');
    const expectedApiKey = Deno.env.get('SIGNALS_API_KEY');

    if (!apiKey || apiKey !== expectedApiKey) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rawPayload = await req.json();
    const validation = validateSignalPayload(rawPayload);

    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = validation.data!;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('trading_signals')
      .insert({
        currency_pair: payload.currency_pair,
        datetime: typeof payload.datetime === 'string' ? payload.datetime : new Date().toISOString(),
        status: (payload.status as string) || 'active',
        probability: payload.probability,
        trend: payload.trend,
        action: payload.action,
        entry_price: payload.entry_price,
        take_profit: payload.take_profit,
        stop_loss: payload.stop_loss,
        support: payload.support ?? null,
        resistance: payload.resistance ?? null,
        session_data: payload.session_data || [],
        analysis_data: payload.analysis_data || [],
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to insert signal' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send push notification
    try {
      const actionText = payload.action === 'BUY' ? 'COMPRAR' : 'VENDER';
      await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': expectedApiKey || '' },
        body: JSON.stringify({
          title: `📈 ${payload.currency_pair} - ${actionText}`,
          body: `Nueva señal: ${actionText} a ${payload.entry_price} | Probabilidad: ${payload.probability}%`,
          url: '/',
          signalId: data.id,
          tag: `signal-${data.id}`,
        }),
      });
    } catch (notifError) {
      console.error('Failed to send push notification:', notifError);
    }

    return new Response(
      JSON.stringify({ success: true, signal: data }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in insert-signal function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
