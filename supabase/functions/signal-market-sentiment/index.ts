import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// In-memory cache (15 min)
const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 15 * 60 * 1000;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      currencyPair,
      action,
      trend,
      entryPrice,
      takeProfit,
      stopLoss,
      probability,
      support,
      resistance,
      currentPrice,
      language = "es",
    } = await req.json();

    if (!currencyPair) {
      return new Response(JSON.stringify({ error: "currencyPair is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check cache
    const cacheKey = `${currencyPair}-${action}-${language}-${currentPrice?.toFixed(2) ?? "na"}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return new Response(JSON.stringify({ ...cached.data, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build R:R ratio
    const rrRatio = stopLoss && entryPrice && takeProfit
      ? (Math.abs(takeProfit - entryPrice) / Math.abs(stopLoss - entryPrice)).toFixed(2)
      : "N/A";

    const priceContext = currentPrice
      ? `Precio actual: ${currentPrice}. Diferencia vs entrada: ${((currentPrice - entryPrice) / entryPrice * 100).toFixed(3)}%.`
      : "";

    const systemPrompt = `Eres un analista financiero profesional especializado en forex y mercados de divisas. 
Analiza TODOS los factores disponibles para generar un dashboard completo de sentimiento del mercado.
Responde SIEMPRE en ${language === "es" ? "español" : language === "pt" ? "portugués" : language === "fr" ? "francés" : "inglés"}.`;

    const userPrompt = `Genera un análisis de sentimiento COMPLETO del mercado para la señal de trading:

**Datos de la señal:**
- Par: ${currencyPair}
- Acción: ${action}
- Tendencia: ${trend}
- Probabilidad: ${probability}%
- Precio de entrada: ${entryPrice}
- Take Profit: ${takeProfit}
- Stop Loss: ${stopLoss}
- Soporte: ${support ?? "N/A"}
- Resistencia: ${resistance ?? "N/A"}
- R:R Ratio: ${rrRatio}
${priceContext}

Analiza combinando:
1. **Sentimiento de noticias** - Evalúa impacto de noticias recientes en las divisas del par
2. **Análisis técnico** - RSI estimado, MACD, medias móviles, niveles clave
3. **Datos de la señal** - Calidad de la configuración basada en R:R, probabilidad, tendencia
4. **Perspectiva macro** - Políticas monetarias, eventos económicos relevantes
5. **Análisis de flujo** - Posicionamiento institucional vs retail estimado`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "market_sentiment_dashboard",
              description: "Return a comprehensive market sentiment dashboard with all analysis sources combined",
              parameters: {
                type: "object",
                properties: {
                  overallScore: {
                    type: "number",
                    description: "Overall sentiment score from -100 (extremely bearish) to +100 (extremely bullish)",
                  },
                  overallLabel: {
                    type: "string",
                    enum: ["Muy Alcista", "Alcista", "Ligeramente Alcista", "Neutral", "Ligeramente Bajista", "Bajista", "Muy Bajista"],
                  },
                  confidence: {
                    type: "number",
                    description: "Confidence level 0-100",
                  },
                  riskLevel: {
                    type: "string",
                    enum: ["bajo", "moderado", "alto", "extremo"],
                  },
                  sources: {
                    type: "object",
                    properties: {
                      news: {
                        type: "object",
                        properties: {
                          score: { type: "number", description: "Score -100 to 100" },
                          label: { type: "string" },
                          detail: { type: "string", description: "Brief explanation in 1-2 sentences" },
                        },
                        required: ["score", "label", "detail"],
                      },
                      technical: {
                        type: "object",
                        properties: {
                          score: { type: "number" },
                          label: { type: "string" },
                          detail: { type: "string" },
                          indicators: {
                            type: "object",
                            properties: {
                              rsi: { type: "number" },
                              macdSignal: { type: "string", enum: ["bullish", "bearish", "neutral"] },
                              trendStrength: { type: "string", enum: ["strong", "moderate", "weak"] },
                              smaAlignment: { type: "string", enum: ["bullish", "bearish", "mixed"] },
                            },
                            required: ["rsi", "macdSignal", "trendStrength", "smaAlignment"],
                          },
                        },
                        required: ["score", "label", "detail", "indicators"],
                      },
                      signalQuality: {
                        type: "object",
                        properties: {
                          score: { type: "number" },
                          label: { type: "string" },
                          detail: { type: "string" },
                        },
                        required: ["score", "label", "detail"],
                      },
                      macro: {
                        type: "object",
                        properties: {
                          score: { type: "number" },
                          label: { type: "string" },
                          detail: { type: "string" },
                        },
                        required: ["score", "label", "detail"],
                      },
                      flow: {
                        type: "object",
                        properties: {
                          retailPercent: { type: "number", description: "Estimated retail sentiment 0-100 (bullish %)" },
                          institutionalPercent: { type: "number", description: "Estimated institutional sentiment 0-100 (bullish %)" },
                          detail: { type: "string" },
                        },
                        required: ["retailPercent", "institutionalPercent", "detail"],
                      },
                    },
                    required: ["news", "technical", "signalQuality", "macro", "flow"],
                  },
                  recommendation: {
                    type: "string",
                    description: "Final actionable recommendation in 2-3 sentences",
                  },
                  keyDrivers: {
                    type: "array",
                    items: { type: "string" },
                    description: "Top 3-4 key drivers affecting this pair right now",
                  },
                },
                required: ["overallScore", "overallLabel", "confidence", "riskLevel", "sources", "recommendation", "keyDrivers"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "market_sentiment_dashboard" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in AI response");
      return new Response(JSON.stringify({ error: "Invalid AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);
    result.currencyPair = currencyPair;
    result.generatedAt = new Date().toISOString();

    // Cache result
    cache.set(cacheKey, { data: result, ts: Date.now() });

    // Cleanup old cache entries
    if (cache.size > 100) {
      const now = Date.now();
      for (const [k, v] of cache) {
        if (now - v.ts > CACHE_TTL) cache.delete(k);
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("signal-market-sentiment error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
