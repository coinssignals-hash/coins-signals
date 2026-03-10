import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Rough cost estimation per 1M tokens (USD)
function estimateAICost(model: string, inputTokens: number, outputTokens: number): number {
  const rates: Record<string, { input: number; output: number }> = {
    'google/gemini-2.5-pro': { input: 1.25, output: 10.0 },
    'google/gemini-2.5-flash': { input: 0.15, output: 0.6 },
    'google/gemini-2.5-flash-lite': { input: 0.075, output: 0.3 },
    'google/gemini-3-flash-preview': { input: 0.15, output: 0.6 },
    'google/gemini-3.1-pro-preview': { input: 1.25, output: 10.0 },
    'openai/gpt-5': { input: 2.5, output: 10.0 },
    'openai/gpt-5-mini': { input: 0.4, output: 1.6 },
    'openai/gpt-5-nano': { input: 0.1, output: 0.4 },
  };
  const rate = rates[model] || { input: 0.5, output: 2.0 };
  return (inputTokens * rate.input + outputTokens * rate.output) / 1000000;
}

interface AnalysisRequest {
  type: 'sentiment' | 'prediction' | 'conclusions' | 'recommendations' | 'technical_levels' | 'indicator_interpretation' | 'advanced_prediction';
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
    bollingerBands?: { upper: number; middle: number; lower: number };
    stochastic?: { k: number; d: number };
    adx?: number;
    atr?: number;
  };
  forceRefresh?: boolean;
  language?: string;
}

const SYSTEM_PROMPTS: Record<string, string> = {
  sentiment: `Eres un analista de mercados financieros de élite con 20+ años de experiencia. Analiza el sentimiento del mercado combinando análisis técnico, fundamental y de flujo de capitales.
Responde SIEMPRE en formato JSON con esta estructura exacta:
{
  "overall": "bullish" | "bearish" | "neutral",
  "score": número entre -1 y 1 (precisión de 2 decimales),
  "retail_sentiment": número entre 0 y 1,
  "institutional_sentiment": número entre 0 y 1,
  "news_sentiment": número entre 0 y 1,
  "technical_sentiment": número entre 0 y 1,
  "momentum_score": número entre -1 y 1,
  "fear_greed_index": número entre 0 y 100,
  "reasoning": "análisis detallado de 2-3 oraciones explicando los factores clave",
  "key_factors": ["factor1", "factor2", "factor3"],
  "divergences": ["divergencia encontrada si existe"]
}`,

  prediction: `Eres un analista cuantitativo experto en forex con acceso a modelos estadísticos avanzados. Genera predicciones de precio basadas en patrones históricos, análisis técnico multiframe y contexto macroeconómico.
Responde SIEMPRE en formato JSON con esta estructura exacta:
{
  "direction": "up" | "down" | "sideways",
  "predicted_high": número (preciso a 5 decimales para forex),
  "predicted_low": número,
  "predicted_close": número,
  "confidence": número entre 0 y 100,
  "volatility_expected": "low" | "medium" | "high",
  "key_levels": {
    "immediate_resistance": número,
    "immediate_support": número,
    "breakout_level": número,
    "breakdown_level": número
  },
  "probability_scenarios": {
    "bullish_target": número,
    "bullish_probability": número entre 0 y 100,
    "bearish_target": número,
    "bearish_probability": número entre 0 y 100,
    "sideways_probability": número entre 0 y 100
  },
  "summary": "resumen técnico preciso de 2-3 oraciones con niveles específicos",
  "timeframe": "intraday" | "swing" | "position"
}`,

  conclusions: `Eres un estratega macro de mercados financieros. Genera conclusiones profundas combinando análisis técnico, fundamental, geopolítico y de flujo de capitales.
Responde SIEMPRE en formato JSON con esta estructura exacta:
{
  "summary": "resumen ejecutivo de 3-4 oraciones con datos específicos",
  "key_drivers": ["array de 4-6 factores principales con datos concretos"],
  "risks": ["array de 3-5 riesgos con probabilidad estimada"],
  "opportunities": ["array de 3-5 oportunidades con potencial R:R"],
  "outlook": "perspectiva general detallada",
  "market_regime": "trending" | "ranging" | "volatile" | "transitioning",
  "correlation_analysis": "análisis de correlación con otros activos relevantes",
  "upcoming_catalysts": ["evento1 con fecha estimada", "evento2"]
}`,

  recommendations: `Eres un asesor de trading institucional. Genera recomendaciones estratégicas precisas con niveles exactos, gestión de riesgo y timing.
Responde SIEMPRE en formato JSON con esta estructura exacta:
{
  "short_term": {
    "action": "buy" | "sell" | "hold",
    "entry_price": número,
    "stop_loss": número,
    "take_profit": número,
    "take_profit_2": número,
    "risk_reward": número,
    "confidence": número entre 0 y 1,
    "timeframe": "1-3 days",
    "position_size_pct": número entre 0.5 y 3,
    "reasoning": "explicación técnica precisa",
    "entry_triggers": ["condición1", "condición2"],
    "invalidation": "condición que invalida el setup"
  },
  "medium_term": {
    "action": "buy" | "sell" | "hold",
    "entry_price": número,
    "stop_loss": número,
    "take_profit": número,
    "take_profit_2": número,
    "risk_reward": número,
    "confidence": número entre 0 y 1,
    "timeframe": "1-2 weeks",
    "position_size_pct": número entre 0.5 y 3,
    "reasoning": "explicación técnica precisa",
    "entry_triggers": ["condición1", "condición2"],
    "invalidation": "condición que invalida el setup"
  },
  "long_term": {
    "action": "buy" | "sell" | "hold",
    "entry_price": número,
    "stop_loss": número,
    "take_profit": número,
    "take_profit_2": número,
    "risk_reward": número,
    "confidence": número entre 0 y 1,
    "timeframe": "1-3 months",
    "position_size_pct": número entre 0.5 y 3,
    "reasoning": "explicación técnica precisa",
    "entry_triggers": ["condición1", "condición2"],
    "invalidation": "condición que invalida el setup"
  },
  "overall_bias": "bullish" | "bearish" | "neutral",
  "risk_management": "nota sobre gestión de riesgo global"
}`,

  technical_levels: `Eres un analista técnico experto especializado en acción del precio, soportes/resistencias y Fibonacci. Calcula niveles técnicos precisos usando múltiples métodos.
Responde SIEMPRE en formato JSON con esta estructura exacta:
{
  "pivot": número (punto pivote calculado),
  "resistances": [
    {"level": número, "strength": "strong" | "moderate" | "weak", "description": "descripción con método de cálculo"},
    {"level": número, "strength": "strong" | "moderate" | "weak", "description": "descripción"},
    {"level": número, "strength": "strong" | "moderate" | "weak", "description": "descripción"}
  ],
  "supports": [
    {"level": número, "strength": "strong" | "moderate" | "weak", "description": "descripción"},
    {"level": número, "strength": "strong" | "moderate" | "weak", "description": "descripción"},
    {"level": número, "strength": "strong" | "moderate" | "weak", "description": "descripción"}
  ],
  "fibonacci": [
    {"level": "23.6%", "price": número},
    {"level": "38.2%", "price": número},
    {"level": "50.0%", "price": número},
    {"level": "61.8%", "price": número}
  ],
  "key_zone": {"from": número, "to": número, "type": "support" | "resistance", "description": "zona más importante"}
}`,

  indicator_interpretation: `Eres un analista técnico experto. Interpreta los indicadores técnicos proporcionados con precisión profesional, identificando señales de trading, divergencias y confluencias.
Responde SIEMPRE en formato JSON con esta estructura exacta:
{
  "overall_signal": "strong_buy" | "buy" | "neutral" | "sell" | "strong_sell",
  "confidence": número entre 0 y 100,
  "indicators": {
    "rsi": {
      "signal": "overbought" | "oversold" | "neutral" | "bullish_divergence" | "bearish_divergence",
      "interpretation": "explicación detallada",
      "action": "buy" | "sell" | "hold"
    },
    "macd": {
      "signal": "bullish_crossover" | "bearish_crossover" | "bullish_momentum" | "bearish_momentum" | "neutral",
      "interpretation": "explicación detallada",
      "action": "buy" | "sell" | "hold"
    },
    "moving_averages": {
      "signal": "golden_cross" | "death_cross" | "bullish_trend" | "bearish_trend" | "neutral",
      "interpretation": "explicación detallada",
      "action": "buy" | "sell" | "hold"
    },
    "bollinger": {
      "signal": "squeeze" | "expansion" | "upper_touch" | "lower_touch" | "neutral",
      "interpretation": "explicación detallada",
      "action": "buy" | "sell" | "hold"
    },
    "stochastic": {
      "signal": "overbought" | "oversold" | "bullish_crossover" | "bearish_crossover" | "neutral",
      "interpretation": "explicación detallada",
      "action": "buy" | "sell" | "hold"
    },
    "adx": {
      "signal": "strong_trend" | "weak_trend" | "no_trend",
      "interpretation": "explicación detallada",
      "trend_strength": número entre 0 y 100
    }
  },
  "confluences": ["confluencia encontrada entre indicadores"],
  "divergences": ["divergencia encontrada si existe"],
  "summary": "resumen ejecutivo de 2-3 oraciones con recomendación clara",
  "best_entry_timing": "descripción de cuándo entrar basado en los indicadores"
}`,

  advanced_prediction: `Eres un quant trader de élite. Genera una predicción avanzada combinando análisis técnico, patrones de velas, estructura de mercado y análisis estadístico.
Responde SIEMPRE en formato JSON con esta estructura exacta:
{
  "prediction": {
    "1h": {"direction": "up" | "down" | "sideways", "target": número, "confidence": número},
    "4h": {"direction": "up" | "down" | "sideways", "target": número, "confidence": número},
    "1d": {"direction": "up" | "down" | "sideways", "target": número, "confidence": número},
    "1w": {"direction": "up" | "down" | "sideways", "target": número, "confidence": número}
  },
  "pattern_detected": "nombre del patrón si se detecta",
  "market_structure": "uptrend" | "downtrend" | "consolidation" | "reversal",
  "volatility_forecast": {"current": "low" | "medium" | "high", "expected": "low" | "medium" | "high"},
  "optimal_strategy": {
    "type": "scalping" | "day_trading" | "swing" | "position",
    "direction": "long" | "short" | "neutral",
    "entry": número,
    "targets": [número, número, número],
    "stop": número,
    "risk_reward": número
  },
  "ai_confidence": número entre 0 y 100,
  "reasoning": "explicación detallada del análisis"
}`
};

// Cache expiration times per analysis type (in minutes)
const CACHE_EXPIRATION: Record<string, number> = {
  sentiment: 15,
  prediction: 30,
  conclusions: 45,
  recommendations: 30,
  technical_levels: 20,
  indicator_interpretation: 15,
  advanced_prediction: 20,
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
    const { type, symbol, marketData, newsContext, technicalIndicators, forceRefresh, language }: AnalysisRequest = await req.json();

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
            type, symbol,
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
    const lang = language || 'es';
    let userMessage = lang === 'es' 
      ? `Analiza el par ${symbol}. Responde en español.\n\n`
      : `Analyze the pair ${symbol}. Respond in English.\n\n`;

    if (marketData) {
      const changePct = ((marketData.currentPrice - marketData.previousClose) / marketData.previousClose * 100).toFixed(3);
      const range = (marketData.high - marketData.low).toFixed(5);
      const rangeAsPct = ((marketData.high - marketData.low) / marketData.currentPrice * 100).toFixed(2);
      
      userMessage += `Datos de mercado actuales:
- Precio actual: ${marketData.currentPrice}
- Cierre anterior: ${marketData.previousClose}
- Máximo del día: ${marketData.high}
- Mínimo del día: ${marketData.low}
- Cambio: ${changePct}%
- Rango del día: ${range} (${rangeAsPct}%)
- Volumen: ${marketData.volume || 'N/A'}
- Posición en rango: ${((marketData.currentPrice - marketData.low) / (marketData.high - marketData.low) * 100).toFixed(1)}% (0%=mínimo, 100%=máximo)\n\n`;
    }

    if (technicalIndicators) {
      userMessage += `Indicadores técnicos:\n`;
      if (technicalIndicators.rsi !== undefined) userMessage += `- RSI(14): ${technicalIndicators.rsi.toFixed(2)}\n`;
      if (technicalIndicators.macd) {
        userMessage += `- MACD: ${technicalIndicators.macd.value.toFixed(5)} (Signal: ${technicalIndicators.macd.signal.toFixed(5)}, Hist: ${technicalIndicators.macd.histogram.toFixed(5)})\n`;
      }
      if (technicalIndicators.sma20) userMessage += `- SMA(20): ${technicalIndicators.sma20}\n`;
      if (technicalIndicators.sma50) userMessage += `- SMA(50): ${technicalIndicators.sma50}\n`;
      if (technicalIndicators.bollingerBands) {
        userMessage += `- Bollinger Bands: Upper=${technicalIndicators.bollingerBands.upper}, Middle=${technicalIndicators.bollingerBands.middle}, Lower=${technicalIndicators.bollingerBands.lower}\n`;
      }
      if (technicalIndicators.stochastic) {
        userMessage += `- Stochastic: %K=${technicalIndicators.stochastic.k.toFixed(2)}, %D=${technicalIndicators.stochastic.d.toFixed(2)}\n`;
      }
      if (technicalIndicators.adx !== undefined) userMessage += `- ADX: ${technicalIndicators.adx.toFixed(2)}\n`;
      if (technicalIndicators.atr !== undefined) userMessage += `- ATR: ${technicalIndicators.atr}\n`;
      userMessage += '\n';
    }

    if (newsContext && newsContext.length > 0) {
      userMessage += `Contexto de noticias recientes:\n${newsContext.map((n, i) => `${i + 1}. ${n}`).join('\n')}\n\n`;
    }

    userMessage += `Genera el análisis de tipo "${type}" para ${symbol}. Sé preciso con los números y niveles de precio.`;

    // Use gemini-2.5-flash for speed, gemini-2.5-pro for advanced types
    const model = (type === 'advanced_prediction' || type === 'recommendations') 
      ? 'google/gemini-2.5-pro' 
      : 'google/gemini-2.5-flash';

    const startTime = Date.now();
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.2,
      }),
    });
    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      // Log failed request
      try {
        await supabase.from('api_usage_logs').insert({
          provider: 'lovable_ai',
          function_name: 'ai-analysis',
          model,
          response_status: response.status,
          latency_ms: latencyMs,
          metadata: { type, symbol },
        });
      } catch (_) { /* non-blocking */ }

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
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

    // Log usage with token info
    const usage = aiResponse.usage;
    try {
      await supabase.from('api_usage_logs').insert({
        provider: 'lovable_ai',
        function_name: 'ai-analysis',
        model,
        tokens_input: usage?.prompt_tokens || 0,
        tokens_output: usage?.completion_tokens || 0,
        tokens_total: usage?.total_tokens || 0,
        estimated_cost: estimateAICost(model, usage?.prompt_tokens || 0, usage?.completion_tokens || 0),
        response_status: 200,
        latency_ms: latencyMs,
        metadata: { type, symbol },
      });
    } catch (_) { /* non-blocking */ }

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
    }

    console.log(`AI Analysis completed for ${symbol} (${type}) using ${model}`);

    return new Response(
      JSON.stringify({
        type, symbol,
        analysis: analysisResult,
        generated_at: new Date().toISOString(),
        cached: false,
        model_used: model,
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
