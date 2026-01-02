import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface AnalysisRequest {
  type: 'sentiment' | 'prediction' | 'conclusions' | 'recommendations' | 'technical_levels';
  symbol: string;
  marketData?: {
    currentPrice: number;
    previousClose: number;
    high: number;
    low: number;
    volume?: number;
  };
  newsContext?: string[];
  technicalIndicators?: {
    rsi?: number;
    macd?: { value: number; signal: number; histogram: number };
    sma20?: number;
    sma50?: number;
  };
  forceRefresh?: boolean;
}

const SYSTEM_PROMPTS: Record<string, string> = {
  sentiment: `Eres un analista de mercados financieros experto. Analiza el sentimiento del mercado para el par de divisas proporcionado.
Responde SIEMPRE en formato JSON con esta estructura exacta:
{
  "overall": "bullish" | "bearish" | "neutral",
  "score": número entre -1 y 1,
  "retail_sentiment": número entre 0 y 1,
  "institutional_sentiment": número entre 0 y 1,
  "news_sentiment": número entre 0 y 1,
  "technical_sentiment": número entre 0 y 1,
  "reasoning": "breve explicación"
}`,

  prediction: `Eres un analista técnico experto en forex. Genera una predicción de precio basada en los datos proporcionados.
Responde SIEMPRE en formato JSON con esta estructura exacta:
{
  "direction": "up" | "down" | "sideways",
  "predicted_high": número,
  "predicted_low": número,
  "predicted_close": número,
  "confidence": número entre 0 y 100,
  "summary": "resumen de 1-2 oraciones sobre la perspectiva del día"
}`,

  conclusions: `Eres un estratega de mercados financieros. Genera conclusiones y perspectivas de mercado.
Responde SIEMPRE en formato JSON con esta estructura exacta:
{
  "summary": "resumen de 2-3 oraciones",
  "key_drivers": ["array de 3-5 factores principales"],
  "risks": ["array de 3-5 riesgos"],
  "opportunities": ["array de 3-5 oportunidades"],
  "outlook": "perspectiva general en una oración"
}`,

  recommendations: `Eres un asesor de trading profesional. Genera recomendaciones estratégicas de trading.
Responde SIEMPRE en formato JSON con esta estructura exacta:
{
  "short_term": {
    "action": "buy" | "sell" | "hold",
    "entry_price": número,
    "stop_loss": número,
    "take_profit": número,
    "risk_reward": número,
    "confidence": número entre 0 y 1,
    "timeframe": "1-3 days",
    "reasoning": "explicación breve"
  },
  "medium_term": { mismo formato },
  "long_term": { mismo formato }
}`,

  technical_levels: `Eres un analista técnico experto especializado en soportes y resistencias. Calcula niveles técnicos precisos.
Responde SIEMPRE en formato JSON con esta estructura exacta:
{
  "pivot": número (punto pivote calculado),
  "resistances": [
    {"level": número, "strength": "strong" | "moderate" | "weak", "description": "breve descripción"},
    {"level": número, "strength": "strong" | "moderate" | "weak", "description": "breve descripción"},
    {"level": número, "strength": "strong" | "moderate" | "weak", "description": "breve descripción"}
  ],
  "supports": [
    {"level": número, "strength": "strong" | "moderate" | "weak", "description": "breve descripción"},
    {"level": número, "strength": "strong" | "moderate" | "weak", "description": "breve descripción"},
    {"level": número, "strength": "strong" | "moderate" | "weak", "description": "breve descripción"}
  ],
  "fibonacci": [
    {"level": "23.6%", "price": número},
    {"level": "38.2%", "price": número},
    {"level": "50.0%", "price": número},
    {"level": "61.8%", "price": número}
  ]
}`
};

// Cache expiration times per analysis type (in minutes)
const CACHE_EXPIRATION: Record<string, number> = {
  sentiment: 30,
  prediction: 60,
  conclusions: 60,
  recommendations: 60,
  technical_levels: 30
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { type, symbol, marketData, newsContext, technicalIndicators, forceRefresh }: AnalysisRequest = await req.json();

    if (!type || !symbol) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: type and symbol' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = SYSTEM_PROMPTS[type];
    if (!systemPrompt) {
      return new Response(
        JSON.stringify({ error: `Invalid analysis type: ${type}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check cache first (unless forceRefresh is true)
    if (!forceRefresh) {
      const { data: cachedData } = await supabase
        .from('ai_analysis_cache')
        .select('*')
        .eq('symbol', symbol)
        .eq('analysis_type', type)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (cachedData) {
        console.log(`Cache hit for ${symbol} (${type})`);
        return new Response(
          JSON.stringify({
            type,
            symbol,
            analysis: cachedData.analysis_data,
            generated_at: cachedData.created_at,
            cached: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log(`AI Analysis request: ${type} for ${symbol}${forceRefresh ? ' (force refresh)' : ''}`);

    // Build context message
    let userMessage = `Analiza el par ${symbol}.\n\n`;

    if (marketData) {
      userMessage += `Datos de mercado actuales:
- Precio actual: ${marketData.currentPrice}
- Cierre anterior: ${marketData.previousClose}
- Máximo: ${marketData.high}
- Mínimo: ${marketData.low}
- Cambio: ${((marketData.currentPrice - marketData.previousClose) / marketData.previousClose * 100).toFixed(2)}%\n\n`;
    }

    if (technicalIndicators) {
      userMessage += `Indicadores técnicos:\n`;
      if (technicalIndicators.rsi !== undefined) userMessage += `- RSI(14): ${technicalIndicators.rsi}\n`;
      if (technicalIndicators.macd) {
        userMessage += `- MACD: ${technicalIndicators.macd.value.toFixed(5)} (Signal: ${technicalIndicators.macd.signal.toFixed(5)})\n`;
      }
      if (technicalIndicators.sma20) userMessage += `- SMA(20): ${technicalIndicators.sma20}\n`;
      if (technicalIndicators.sma50) userMessage += `- SMA(50): ${technicalIndicators.sma50}\n`;
      userMessage += '\n';
    }

    if (newsContext && newsContext.length > 0) {
      userMessage += `Contexto de noticias recientes:\n${newsContext.map((n, i) => `${i + 1}. ${n}`).join('\n')}\n\n`;
    }

    userMessage += `Genera el análisis de tipo "${type}" para ${symbol}.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error('Rate limit exceeded');
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        console.error('Payment required');
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse JSON from response
    let analysisResult;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonStr = jsonMatch[1].trim();
      analysisResult = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', content);
      analysisResult = { raw_response: content };
    }

    // Save to cache
    const expirationMinutes = CACHE_EXPIRATION[type] || 60;
    const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000).toISOString();
    
    const { error: upsertError } = await supabase
      .from('ai_analysis_cache')
      .upsert({
        symbol,
        analysis_type: type,
        analysis_data: analysisResult,
        current_price: marketData?.currentPrice,
        expires_at: expiresAt
      }, {
        onConflict: 'symbol,analysis_type'
      });

    if (upsertError) {
      console.error('Failed to cache analysis:', upsertError);
    } else {
      console.log(`Cached ${type} analysis for ${symbol} (expires in ${expirationMinutes}min)`);
    }

    console.log(`AI Analysis completed for ${symbol} (${type})`);

    return new Response(
      JSON.stringify({
        type,
        symbol,
        analysis: analysisResult,
        generated_at: new Date().toISOString(),
        cached: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-analysis function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
