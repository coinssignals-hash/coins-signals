import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const CURRENCY_PAIR_REGEX = /^[A-Z]{2,6}\/[A-Z]{2,6}$/;

function validateSignalPayload(p: Record<string, unknown>): string | null {
  if (typeof p.currency_pair !== 'string' || !CURRENCY_PAIR_REGEX.test(p.currency_pair)) {
    return 'currency_pair must match format like EUR/USD';
  }
  if (typeof p.entry_price !== 'number' || !isFinite(p.entry_price) || p.entry_price <= 0) {
    return 'entry_price must be a positive finite number';
  }
  if (typeof p.take_profit !== 'number' || !isFinite(p.take_profit) || p.take_profit <= 0) {
    return 'take_profit must be a positive finite number';
  }
  if (typeof p.stop_loss !== 'number' || !isFinite(p.stop_loss) || p.stop_loss <= 0) {
    return 'stop_loss must be a positive finite number';
  }
  if (p.probability !== undefined && (typeof p.probability !== 'number' || p.probability < 0 || p.probability > 100)) {
    return 'probability must be 0-100';
  }
  if (p.trend !== undefined && !['bullish', 'bearish'].includes(p.trend as string)) {
    return 'trend must be bullish or bearish';
  }
  if (p.action !== undefined && !['BUY', 'SELL'].includes(p.action as string)) {
    return 'action must be BUY or SELL';
  }
  if (p.status !== undefined && !['active', 'pending', 'completed', 'cancelled'].includes(p.status as string)) {
    return 'status must be active, pending, completed, or cancelled';
  }
  if (p.take_profit_2 !== undefined && (typeof p.take_profit_2 !== 'number' || !isFinite(p.take_profit_2) || p.take_profit_2 <= 0)) {
    return 'take_profit_2 must be a positive finite number';
  }
  if (p.take_profit_3 !== undefined && (typeof p.take_profit_3 !== 'number' || !isFinite(p.take_profit_3) || p.take_profit_3 <= 0)) {
    return 'take_profit_3 must be a positive finite number';
  }
  if (p.support !== undefined && p.support !== null && (typeof p.support !== 'number' || !isFinite(p.support))) {
    return 'support must be a finite number';
  }
  if (p.resistance !== undefined && p.resistance !== null && (typeof p.resistance !== 'number' || !isFinite(p.resistance))) {
    return 'resistance must be a finite number';
  }
  if (p.notes !== undefined && typeof p.notes !== 'string') {
    return 'notes must be a string';
  }
  if (typeof p.notes === 'string' && p.notes.length > 2000) {
    return 'notes must be 2000 characters or fewer';
  }
  return null;
}

async function generateAndUploadChart(
  supabaseUrl: string,
  supabase: ReturnType<typeof createClient>,
  signalId: string,
  currencyPair: string,
  support: number | null,
  resistance: number | null,
): Promise<string | null> {
  try {
    const pair = currencyPair.replace('/', '');
    const params = new URLSearchParams({ pair, hd: '1' });
    if (support !== null) params.set('support', String(support));
    if (resistance !== null) params.set('resistance', String(resistance));

    const chartUrl = `${supabaseUrl}/functions/v1/candlestick-chart?${params.toString()}`;
    const res = await fetch(chartUrl);
    if (!res.ok) {
      console.error('Chart fetch failed:', res.status);
      return null;
    }

    const svgContent = await res.text();
    const filePath = `${signalId}.svg`;

    const { error: uploadError } = await supabase.storage
      .from('signal-charts')
      .upload(filePath, svgContent, {
        contentType: 'image/svg+xml',
        upsert: true,
      });

    if (uploadError) {
      console.error('Chart upload error:', uploadError);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('signal-charts')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (e) {
    console.error('Chart generation failed:', e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Auth: accept x-api-key OR valid Supabase JWT with admin role
    const apiKey = req.headers.get('x-api-key');
    const expectedApiKey = Deno.env.get('SIGNALS_API_KEY');
    const authHeader = req.headers.get('authorization');
    
    let isAuthed = false;
    
    if (apiKey && expectedApiKey && apiKey === expectedApiKey) {
      isAuthed = true;
    }
    
    if (!isAuthed && authHeader) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const authClient = createClient(supabaseUrl, supabaseServiceKey);
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await authClient.auth.getUser(token);
      if (user && !authError) {
        const { data: hasAdmin } = await authClient
          .from('user_roles')
          .select('id')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();
        if (hasAdmin) {
          isAuthed = true;
        }
      }
    }
    
    if (!isAuthed) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = await req.json();

    // Validate input
    const validationError = validateSignalPayload(payload);
    if (validationError) {
      return new Response(JSON.stringify({ error: validationError }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const insertData: Record<string, unknown> = {
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
      source: payload.source || 'server',
      session_data: [],
      analysis_data: [],
    };

    if (payload.take_profit_2 !== undefined) insertData.take_profit_2 = payload.take_profit_2;
    if (payload.take_profit_3 !== undefined) insertData.take_profit_3 = payload.take_profit_3;
    if (payload.notes !== undefined) insertData.notes = payload.notes;

    const { data, error } = await supabase
      .from('trading_signals')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('DB error:', error);
      return new Response(JSON.stringify({ error: 'Failed to insert signal' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const chartImageUrl = await generateAndUploadChart(
      supabaseUrl,
      supabase,
      data.id,
      payload.currency_pair,
      payload.support ?? payload.stop_loss,
      payload.resistance ?? payload.take_profit,
    );

    if (chartImageUrl) {
      await supabase
        .from('trading_signals')
        .update({ chart_image_url: chartImageUrl })
        .eq('id', data.id);
      data.chart_image_url = chartImageUrl;
    }

    // Trigger push notification
    try {
      const notifApiKey = Deno.env.get('SIGNALS_API_KEY');
      const actionText = payload.action === 'BUY' ? 'COMPRAR' : 'VENDER';
      await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': notifApiKey || '' },
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
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
