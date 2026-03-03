import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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

    // Auth: accept x-api-key OR valid Supabase JWT
    const apiKey = req.headers.get('x-api-key');
    const expectedApiKey = Deno.env.get('SIGNALS_API_KEY');
    const authHeader = req.headers.get('authorization');
    
    let isAuthed = false;
    
    // Method 1: API key
    if (apiKey && expectedApiKey && apiKey === expectedApiKey) {
      isAuthed = true;
    }
    
    // Method 2: Supabase JWT (for frontend calls) — must be admin
    if (!isAuthed && authHeader) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const authClient = createClient(supabaseUrl, supabaseServiceKey);
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await authClient.auth.getUser(token);
      if (user && !authError) {
        // Check admin role
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

    if (!payload.currency_pair || !payload.entry_price || !payload.take_profit || !payload.stop_loss) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert signal first
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
      session_data: [],
      analysis_data: [],
    };

    // Optional new fields
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
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate HD chart and upload to storage (non-blocking for response but we await it)
    const chartImageUrl = await generateAndUploadChart(
      supabaseUrl,
      supabase,
      data.id,
      payload.currency_pair,
      payload.support ?? payload.stop_loss,
      payload.resistance ?? payload.take_profit,
    );

    // Update signal with chart URL if generated
    if (chartImageUrl) {
      await supabase
        .from('trading_signals')
        .update({ chart_image_url: chartImageUrl })
        .eq('id', data.id);
      data.chart_image_url = chartImageUrl;
    }

    // Trigger push notification
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
