import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const NEWS_MODEL = 'google/gemini-2.5-flash';

async function logAIUsage(supabase: any, status: number, latencyMs: number, usage?: any, meta?: Record<string, unknown>) {
  try {
    await supabase.from('api_usage_logs').insert({
      function_name: 'news-ai-analysis', provider: 'lovable_ai', model: NEWS_MODEL,
      response_status: status, latency_ms: latencyMs,
      tokens_input: usage?.prompt_tokens || 0, tokens_output: usage?.completion_tokens || 0,
      tokens_total: usage?.total_tokens || 0,
      estimated_cost: ((usage?.prompt_tokens || 0) * 0.15 + (usage?.completion_tokens || 0) * 0.6) / 1e6,
      metadata: meta || {},
    });
  } catch { /* fire-and-forget */ }
}

interface NewsAnalysisRequest {
  newsId: string;
  title: string;
  summary: string;
  source: string;
  category: string;
  affectedCurrencies: string[];
  sentiment: string;
  language?: string;
}

interface KeyPoint {
  icon: string;
  text: string;
  importance: 'high' | 'medium' | 'low';
}

interface TraderConclusion {
  bias: 'bullish' | 'bearish' | 'neutral';
  biasStrength: 'strong' | 'moderate' | 'weak';
  summary: string;
  recommendedPairs: string[];
  riskLevel: 'high' | 'medium' | 'low';
  timeHorizon: 'short_term' | 'medium_term' | 'long_term';
}

interface NewsAnalysisResponse {
  aiSummary: string;
  keyPoints: KeyPoint[];
  traderConclusion: TraderConclusion;
  marketImpact: string;
  tradingStrategy: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration is missing');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { newsId, title, summary, source, category, affectedCurrencies, sentiment, language }: NewsAnalysisRequest = await req.json();
    const lang = language || 'es';

    if (!newsId) {
      throw new Error('newsId is required');
    }

    console.log('[news-ai-analysis] Checking cache for news:', newsId);

    const cacheId = lang === 'es' ? newsId : `${newsId}_${lang}`;

    // Check cache first
    const { data: cachedAnalysis, error: cacheError } = await supabase
      .from('news_ai_analysis_cache')
      .select('analysis_data, expires_at')
      .eq('news_id', cacheId)
      .single();

    if (cachedAnalysis && !cacheError) {
      const expiresAt = new Date(cachedAnalysis.expires_at);
      if (expiresAt > new Date()) {
        console.log('[news-ai-analysis] Cache HIT for:', newsId);
        return new Response(
          JSON.stringify({
            success: true,
            data: cachedAnalysis.analysis_data,
            cached: true,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        console.log('[news-ai-analysis] Cache expired for:', newsId);
        // Delete expired cache entry
        await supabase
          .from('news_ai_analysis_cache')
          .delete()
          .eq('news_id', newsId);
      }
    }

    console.log('[news-ai-analysis] Cache MISS - generating analysis for:', title.substring(0, 50) + '...');

    const systemPrompt = `Eres un analista financiero experto especializado en forex y mercados financieros. 
Tu tarea es analizar noticias financieras y proporcionar insights accionables para traders.
Responde SIEMPRE en español.
Sé conciso pero informativo. Enfócate en el impacto práctico para el trading.`;

    const userPrompt = `Analiza la siguiente noticia financiera y proporciona un análisis detallado para traders:

TÍTULO: ${title}
RESUMEN: ${summary}
FUENTE: ${source}
CATEGORÍA: ${category}
DIVISAS AFECTADAS: ${affectedCurrencies.join(', ')}
SENTIMIENTO DETECTADO: ${sentiment}

Responde usando la siguiente función con datos precisos y útiles para traders.`;

    const t0 = Date.now();
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: NEWS_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'provide_news_analysis',
              description: 'Proporciona análisis detallado de una noticia financiera para traders',
              parameters: {
                type: 'object',
                properties: {
                  aiSummary: {
                    type: 'string',
                    description: 'Resumen ejecutivo de 2-3 oraciones explicando el impacto de la noticia en los mercados'
                  },
                  keyPoints: {
                    type: 'array',
                    description: 'Lista de 3-5 puntos clave de la noticia',
                    items: {
                      type: 'object',
                      properties: {
                        icon: { 
                          type: 'string', 
                          description: 'Emoji relevante para el punto (ej: 📈, 💹, ⚠️, 🏦, 💰, 📊)' 
                        },
                        text: { 
                          type: 'string', 
                          description: 'Descripción concisa del punto clave' 
                        },
                        importance: { 
                          type: 'string', 
                          enum: ['high', 'medium', 'low'],
                          description: 'Nivel de importancia del punto'
                        }
                      },
                      required: ['icon', 'text', 'importance']
                    }
                  },
                  traderConclusion: {
                    type: 'object',
                    description: 'Conclusión y recomendación para traders',
                    properties: {
                      bias: { 
                        type: 'string', 
                        enum: ['bullish', 'bearish', 'neutral'],
                        description: 'Sesgo general de la noticia'
                      },
                      biasStrength: { 
                        type: 'string', 
                        enum: ['strong', 'moderate', 'weak'],
                        description: 'Fuerza del sesgo'
                      },
                      summary: { 
                        type: 'string', 
                        description: 'Resumen de la conclusión para traders en 2-3 oraciones'
                      },
                      recommendedPairs: { 
                        type: 'array', 
                        items: { type: 'string' },
                        description: 'Pares de divisas recomendados para operar (ej: EUR/USD, GBP/JPY)'
                      },
                      riskLevel: { 
                        type: 'string', 
                        enum: ['high', 'medium', 'low'],
                        description: 'Nivel de riesgo asociado'
                      },
                      timeHorizon: { 
                        type: 'string', 
                        enum: ['short_term', 'medium_term', 'long_term'],
                        description: 'Horizonte temporal recomendado'
                      }
                    },
                    required: ['bias', 'biasStrength', 'summary', 'recommendedPairs', 'riskLevel', 'timeHorizon']
                  },
                  marketImpact: {
                    type: 'string',
                    description: 'Descripción del impacto esperado en el mercado (1-2 oraciones)'
                  },
                  tradingStrategy: {
                    type: 'string',
                    description: 'Estrategia de trading sugerida basada en esta noticia (1-2 oraciones)'
                  }
                },
                required: ['aiSummary', 'keyPoints', 'traderConclusion', 'marketImpact', 'tradingStrategy']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'provide_news_analysis' } }
      }),
    });
    const latency = Date.now() - t0;

    if (!response.ok) {
      logAIUsage(supabase, response.status, latency, undefined, { newsId });
      if (response.status === 429) {
        console.error('[news-ai-analysis] Rate limit exceeded');
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        console.error('[news-ai-analysis] Payment required');
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('[news-ai-analysis] AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    logAIUsage(supabase, 200, latency, aiResponse.usage, { newsId });
    console.log('[news-ai-analysis] AI response received');

    // Extract the function call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'provide_news_analysis') {
      throw new Error('Invalid AI response format');
    }

    const analysisData: NewsAnalysisResponse = JSON.parse(toolCall.function.arguments);

    // Store in cache (7 days expiration)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error: insertError } = await supabase
      .from('news_ai_analysis_cache')
      .upsert({
        news_id: newsId,
        news_title: title.substring(0, 500), // Limit title length
        analysis_data: analysisData,
        expires_at: expiresAt.toISOString(),
      }, {
        onConflict: 'news_id'
      });

    if (insertError) {
      console.error('[news-ai-analysis] Failed to cache analysis:', insertError);
      // Continue even if caching fails
    } else {
      console.log('[news-ai-analysis] Analysis cached for:', newsId);
    }

    console.log('[news-ai-analysis] Analysis complete for:', title.substring(0, 30) + '...');

    return new Response(
      JSON.stringify({
        success: true,
        data: analysisData,
        cached: false,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[news-ai-analysis] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
