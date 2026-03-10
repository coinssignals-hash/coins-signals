import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const SMS_MODEL = "google/gemini-2.5-flash";

async function logAIUsage(status: number, latencyMs: number, usage?: any, meta?: Record<string, unknown>) {
  try {
    await supabaseAdmin.from('api_usage_logs').insert({
      function_name: 'signal-market-sentiment', provider: 'lovable_ai', model: SMS_MODEL,
      response_status: status, latency_ms: latencyMs,
      tokens_input: usage?.prompt_tokens || 0, tokens_output: usage?.completion_tokens || 0,
      tokens_total: usage?.total_tokens || 0,
      estimated_cost: ((usage?.prompt_tokens || 0) * 0.15 + (usage?.completion_tokens || 0) * 0.6) / 1e6,
      metadata: meta || {},
    });
  } catch { /* fire-and-forget */ }
}
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 15 * 60 * 1000;

// ── helpers ──────────────────────────────────────────────
function splitPair(pair: string): { base: string; quote: string } {
  const clean = pair.replace("C:", "").replace("/", "");
  return { base: clean.slice(0, 3), quote: clean.slice(3, 6) };
}

async function safeFetch(url: string, timeout = 8000): Promise<any | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ── data fetchers ────────────────────────────────────────
async function fetchAlphaVantageTechnicals(pair: string) {
  const key = Deno.env.get("ALPHA_VANTAGE_API_KEY");
  if (!key) return null;
  const { base, quote } = splitPair(pair);
  const symbol = `${base}${quote}`;

  const [rsiData, macdData, smaData, bbData, newsData] = await Promise.all([
    safeFetch(`https://www.alphavantage.co/query?function=RSI&symbol=${symbol}&interval=60min&time_period=14&series_type=close&apikey=${key}&datatype=json`),
    safeFetch(`https://www.alphavantage.co/query?function=MACD&symbol=${symbol}&interval=60min&series_type=close&apikey=${key}&datatype=json`),
    safeFetch(`https://www.alphavantage.co/query?function=SMA&symbol=${symbol}&interval=60min&time_period=20&series_type=close&apikey=${key}&datatype=json`),
    safeFetch(`https://www.alphavantage.co/query?function=BBANDS&symbol=${symbol}&interval=60min&time_period=20&series_type=close&apikey=${key}&datatype=json`),
    safeFetch(`https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=FOREX:${symbol}&sort=LATEST&limit=5&apikey=${key}`),
  ]);

  const result: any = {};

  // RSI
  const rsiSeries = rsiData?.["Technical Analysis: RSI"];
  if (rsiSeries) {
    const latest = Object.values(rsiSeries)[0] as any;
    result.rsi = parseFloat(latest?.RSI ?? "50");
  }

  // MACD
  const macdSeries = macdData?.["Technical Analysis: MACD"];
  if (macdSeries) {
    const latest = Object.values(macdSeries)[0] as any;
    result.macd = parseFloat(latest?.MACD ?? "0");
    result.macdSignalLine = parseFloat(latest?.MACD_Signal ?? "0");
    result.macdHist = parseFloat(latest?.MACD_Hist ?? "0");
  }

  // SMA
  const smaSeries = smaData?.["Technical Analysis: SMA"];
  if (smaSeries) {
    const latest = Object.values(smaSeries)[0] as any;
    result.sma20 = parseFloat(latest?.SMA ?? "0");
  }

  // Bollinger
  const bbSeries = bbData?.["Technical Analysis: BBANDS"];
  if (bbSeries) {
    const latest = Object.values(bbSeries)[0] as any;
    result.bbUpper = parseFloat(latest?.["Real Upper Band"] ?? "0");
    result.bbMiddle = parseFloat(latest?.["Real Middle Band"] ?? "0");
    result.bbLower = parseFloat(latest?.["Real Lower Band"] ?? "0");
  }

  // News Sentiment
  if (newsData?.feed && Array.isArray(newsData.feed)) {
    result.newsHeadlines = newsData.feed.slice(0, 3).map((item: any) => ({
      title: item.title,
      url: item.url,
      source: item.source,
      sentiment: item.overall_sentiment_score ?? null,
    }));
  }

  return Object.keys(result).length > 0 ? result : null;
}

async function fetchFinnhubSentiment(pair: string) {
  const key = Deno.env.get("FINNHUB_API_KEY");
  if (!key) return null;
  const { base, quote } = splitPair(pair);

  const [newsBase, newsQuote] = await Promise.all([
    safeFetch(`https://finnhub.io/api/v1/news?category=forex&token=${key}`),
    safeFetch(`https://finnhub.io/api/v1/forex/rates?base=${base}&token=${key}`),
  ]);

  const result: any = {};

  if (Array.isArray(newsBase)) {
    const relevant = newsBase
      .filter((n: any) => {
        const text = `${n.headline ?? ""} ${n.summary ?? ""}`.toUpperCase();
        return text.includes(base) || text.includes(quote);
      })
      .slice(0, 5);

    result.newsCount = relevant.length;
    result.headlines = relevant.map((n: any) => n.headline).filter(Boolean);
    result.newsUrls = relevant.map((n: any) => n.url).filter(Boolean);
    result.newsSummaries = relevant.map((n: any) => n.summary?.slice(0, 150)).filter(Boolean);
  }

  if (newsQuote?.quote) {
    result.forexRates = newsQuote.quote;
  }

  return Object.keys(result).length > 0 ? result : null;
}

async function fetchFMPData(pair: string) {
  const key = Deno.env.get("FMP_API_KEY");
  if (!key) return null;
  const { base, quote } = splitPair(pair);
  const symbol = `${base}${quote}`;

  const [quoteData, ecoCalendar, fxNews] = await Promise.all([
    safeFetch(`https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${key}`),
    safeFetch(`https://financialmodelingprep.com/api/v3/economic_calendar?apikey=${key}&limit=10`),
    safeFetch(`https://financialmodelingprep.com/api/v4/forex_news?page=0&apikey=${key}`),
  ]);

  const result: any = {};

  if (Array.isArray(quoteData) && quoteData[0]) {
    const q = quoteData[0];
    result.price = q.price;
    result.change = q.change;
    result.changePercent = q.changesPercentage;
    result.dayHigh = q.dayHigh;
    result.dayLow = q.dayLow;
    result.volume = q.volume;
  }

  if (Array.isArray(ecoCalendar)) {
    const relevant = ecoCalendar
      .filter((e: any) => e.country && (e.country.includes(base) || e.country.includes(quote) || ["US", "EU", "JP", "GB", "CH", "AU", "CA", "NZ"].includes(e.country)))
      .slice(0, 5);
    result.economicEvents = relevant.map((e: any) => ({
      event: e.event,
      country: e.country,
      actual: e.actual,
      estimate: e.estimate,
      previous: e.previous,
      impact: e.impact,
    }));
  }

  if (Array.isArray(fxNews)) {
    const relevant = fxNews
      .filter((n: any) => {
        const text = `${n.title ?? ""} ${n.text ?? ""}`.toUpperCase();
        return text.includes(base) || text.includes(quote);
      })
      .slice(0, 3);
    result.fmpNews = relevant.map((n: any) => ({ title: n.title, text: n.text?.slice(0, 200), url: n.url }));
  }

  return Object.keys(result).length > 0 ? result : null;
}

async function fetchMarketAuxNews(pair: string) {
  const key = Deno.env.get("MARKETAUX_API_KEY");
  if (!key) return null;
  const { base, quote } = splitPair(pair);

  const data = await safeFetch(
    `https://api.marketaux.com/v1/news/all?filter_entities=true&language=en&search=${base}+${quote}+forex&api_token=${key}&limit=5`
  );

  if (!data?.data || !Array.isArray(data.data)) return null;

  return {
    articles: data.data.map((a: any) => ({
      title: a.title,
      description: a.description?.slice(0, 200),
      sentiment: a.entities?.[0]?.sentiment_score ?? null,
      source: a.source,
      url: a.url,
    })),
    avgSentiment: data.data.reduce((acc: number, a: any) => {
      const s = a.entities?.[0]?.sentiment_score;
      return s != null ? acc + s : acc;
    }, 0) / (data.data.filter((a: any) => a.entities?.[0]?.sentiment_score != null).length || 1),
  };
}

// ── main handler ─────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      currencyPair, action, trend, entryPrice, takeProfit, stopLoss,
      probability, support, resistance, currentPrice, language = "es",
    } = await req.json();

    if (!currencyPair) {
      return new Response(JSON.stringify({ error: "currencyPair is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cacheKey = `${currencyPair}-${action}-${language}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return new Response(JSON.stringify({ ...cached.data, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Fetch real data from all 4 providers in parallel ──
    const [alphaVantage, finnhub, fmp, marketaux] = await Promise.allSettled([
      fetchAlphaVantageTechnicals(currencyPair),
      fetchFinnhubSentiment(currencyPair),
      fetchFMPData(currencyPair),
      fetchMarketAuxNews(currencyPair),
    ]);

    const avData = alphaVantage.status === "fulfilled" ? alphaVantage.value : null;
    const fhData = finnhub.status === "fulfilled" ? finnhub.value : null;
    const fmpData = fmp.status === "fulfilled" ? fmp.value : null;
    const maData = marketaux.status === "fulfilled" ? marketaux.value : null;

    // ── Build data context for AI synthesis ──
    const rrRatio = stopLoss && entryPrice && takeProfit
      ? (Math.abs(takeProfit - entryPrice) / Math.abs(stopLoss - entryPrice)).toFixed(2)
      : "N/A";

    const realDataContext = [
      "=== DATOS REALES DE APIs (NO inventar, usar estos valores exactos) ===",
      "",
      avData ? `**Alpha Vantage - Indicadores Técnicos:**
- RSI (14, 1H): ${avData.rsi ?? "N/A"}
- MACD: ${avData.macd ?? "N/A"}, Signal: ${avData.macdSignalLine ?? "N/A"}, Hist: ${avData.macdHist ?? "N/A"}
- SMA(20): ${avData.sma20 ?? "N/A"}
- Bollinger: Upper=${avData.bbUpper ?? "N/A"}, Middle=${avData.bbMiddle ?? "N/A"}, Lower=${avData.bbLower ?? "N/A"}` : "Alpha Vantage: no disponible",
      "",
      fhData ? `**Finnhub - Noticias Forex (${fhData.newsCount ?? 0} relevantes):**
${(fhData.headlines ?? []).map((h: string) => `- ${h}`).join("\n")}` : "Finnhub: no disponible",
      "",
      fmpData ? `**FMP - Cotización en Tiempo Real:**
- Precio: ${fmpData.price ?? "N/A"}, Cambio: ${fmpData.change ?? "N/A"} (${fmpData.changePercent ?? "N/A"}%)
- Rango día: ${fmpData.dayLow ?? "N/A"} - ${fmpData.dayHigh ?? "N/A"}
${fmpData.economicEvents?.length ? `**Calendario Económico:**\n${fmpData.economicEvents.map((e: any) => `- ${e.country}: ${e.event} (Act: ${e.actual ?? "pend"}, Est: ${e.estimate ?? "-"}, Prev: ${e.previous ?? "-"})`).join("\n")}` : ""}
${fmpData.fmpNews?.length ? `**Noticias FMP:**\n${fmpData.fmpNews.map((n: any) => `- ${n.title}`).join("\n")}` : ""}` : "FMP: no disponible",
      "",
      maData ? `**MarketAux - Análisis de Sentimiento de Noticias:**
- Sentimiento promedio: ${maData.avgSentiment?.toFixed(3) ?? "N/A"} (rango -1 a +1)
${(maData.articles ?? []).map((a: any) => `- [${a.source}] ${a.title} (sentimiento: ${a.sentiment?.toFixed(2) ?? "N/A"})`).join("\n")}` : "MarketAux: no disponible",
    ].join("\n");

    const langLabel = language === "es" ? "español" : language === "pt" ? "portugués" : language === "fr" ? "francés" : "inglés";

    const systemPrompt = `Eres un analista financiero profesional. Tu tarea es SINTETIZAR los datos reales proporcionados por las APIs en un dashboard de sentimiento.
REGLAS CRÍTICAS:
1. USA los valores EXACTOS de los indicadores técnicos de Alpha Vantage (RSI, MACD, SMA, Bollinger) - NO inventes valores diferentes.
2. Basa el análisis de noticias en los titulares REALES de Finnhub, FMP y MarketAux.
3. Usa los precios REALES de FMP para el análisis.
4. Si un dato no está disponible, indica "datos no disponibles" en lugar de inventar.
Responde SIEMPRE en ${langLabel}.`;

    const userPrompt = `Genera un dashboard de sentimiento del mercado para la señal:

**Señal:**
- Par: ${currencyPair}, Acción: ${action}, Tendencia: ${trend}
- Entrada: ${entryPrice}, TP: ${takeProfit}, SL: ${stopLoss}
- Probabilidad: ${probability}%, R:R: ${rrRatio}
- Soporte: ${support ?? "N/A"}, Resistencia: ${resistance ?? "N/A"}
${currentPrice ? `- Precio actual: ${currentPrice}` : ""}

${realDataContext}

Sintetiza TODOS estos datos reales en el dashboard de sentimiento.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "market_sentiment_dashboard",
            description: "Return market sentiment dashboard synthesized from real API data",
            parameters: {
              type: "object",
              properties: {
                overallScore: { type: "number", description: "Overall sentiment -100 to +100" },
                overallLabel: { type: "string", enum: ["Muy Alcista", "Alcista", "Ligeramente Alcista", "Neutral", "Ligeramente Bajista", "Bajista", "Muy Bajista"] },
                confidence: { type: "number", description: "0-100" },
                riskLevel: { type: "string", enum: ["bajo", "moderado", "alto", "extremo"] },
                sources: {
                  type: "object",
                  properties: {
                    news: {
                      type: "object",
                      properties: {
                        score: { type: "number" },
                        label: { type: "string" },
                        detail: { type: "string" },
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
                            rsi: { type: "number", description: "MUST use exact Alpha Vantage RSI value" },
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
                        retailPercent: { type: "number" },
                        institutionalPercent: { type: "number" },
                        detail: { type: "string" },
                      },
                      required: ["retailPercent", "institutionalPercent", "detail"],
                    },
                  },
                  required: ["news", "technical", "signalQuality", "macro", "flow"],
                },
                recommendation: { type: "string" },
                keyDrivers: { type: "array", items: { type: "string" } },
                dataSources: {
                  type: "object",
                  description: "Which APIs provided data",
                  properties: {
                    alphaVantage: { type: "boolean" },
                    finnhub: { type: "boolean" },
                    fmp: { type: "boolean" },
                    marketaux: { type: "boolean" },
                  },
                },
              },
              required: ["overallScore", "overallLabel", "confidence", "riskLevel", "sources", "recommendation", "keyDrivers", "dataSources"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "market_sentiment_dashboard" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in AI response");
      return new Response(JSON.stringify({ error: "Invalid AI response" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);
    result.currencyPair = currencyPair;
    result.generatedAt = new Date().toISOString();
    result.realData = {
      alphaVantage: !!avData,
      finnhub: !!fhData,
      fmp: !!fmpData,
      marketaux: !!maData,
    };
    // Attach real headlines from APIs
    const realHeadlines: { title: string; source: string; sentiment?: number; url?: string }[] = [];
    if (fhData?.headlines) {
      for (let i = 0; i < Math.min(3, fhData.headlines.length); i++) {
        realHeadlines.push({ title: fhData.headlines[i], source: "Finnhub", url: fhData.newsUrls?.[i] });
      }
    }
    if (maData?.articles) {
      for (const a of maData.articles.slice(0, 3)) {
        realHeadlines.push({ title: a.title, source: a.source ?? "MarketAux", sentiment: a.sentiment, url: a.url });
      }
    }
    if (fmpData?.fmpNews) {
      for (const n of fmpData.fmpNews.slice(0, 2)) {
        realHeadlines.push({ title: n.title, source: "FMP", url: n.url });
      }
    }
    if (avData?.newsHeadlines) {
      for (const h of avData.newsHeadlines) {
        realHeadlines.push({ title: h.title, source: h.source ?? "AlphaVantage", sentiment: h.sentiment, url: h.url });
      }
    }
    result.headlines = realHeadlines;

    cache.set(cacheKey, { data: result, ts: Date.now() });
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
