import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

async function logAIUsage(model: string, status: number, latencyMs: number, usage?: any, meta?: Record<string, unknown>) {
  try {
    const r: Record<string, [number, number]> = { 'google/gemini-2.5-flash': [0.15, 0.6] };
    const [i, o] = r[model] || [0.5, 2];
    await supabaseAdmin.from('api_usage_logs').insert({
      function_name: 'stock-analysis', provider: 'lovable_ai', model,
      response_status: status, latency_ms: latencyMs,
      tokens_input: usage?.prompt_tokens || 0, tokens_output: usage?.completion_tokens || 0,
      tokens_total: usage?.total_tokens || 0,
      estimated_cost: ((usage?.prompt_tokens || 0) * i + (usage?.completion_tokens || 0) * o) / 1e6,
      metadata: meta || {},
    });
  } catch { /* fire-and-forget */ }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

function getCached(key: string): any | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  cache.delete(key);
  return null;
}

async function safeFetch(url: string, label: string): Promise<any | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`[stock-analysis] ${label} error: ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (e) {
    console.error(`[stock-analysis] ${label} fetch failed:`, e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const ALPHA_KEY = Deno.env.get('ALPHA_VANTAGE_API_KEY') || '';
  const FINNHUB_KEY = Deno.env.get('FINNHUB_API_KEY') || '';
  const FMP_KEY = Deno.env.get('FMP_API_KEY') || '';
  const MARKETAUX_KEY = Deno.env.get('MARKETAUX_API_KEY') || '';

  try {
    const { symbol, action } = await req.json();
    if (!symbol) throw new Error('symbol required');

    const cacheKey = `${action}:${symbol}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return new Response(JSON.stringify(cached), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let result: any = {};

    switch (action) {
      // ---- TECHNICALS: RSI, SMA, EMA, MACD from Alpha Vantage ----
      case 'technicals': {
        const avBase = 'https://www.alphavantage.co/query';
        const [rsi, sma20, sma50, ema12, ema26, macd] = await Promise.allSettled([
          safeFetch(`${avBase}?function=RSI&symbol=${symbol}&interval=daily&time_period=14&series_type=close&apikey=${ALPHA_KEY}`, 'RSI'),
          safeFetch(`${avBase}?function=SMA&symbol=${symbol}&interval=daily&time_period=20&series_type=close&apikey=${ALPHA_KEY}`, 'SMA20'),
          safeFetch(`${avBase}?function=SMA&symbol=${symbol}&interval=daily&time_period=50&series_type=close&apikey=${ALPHA_KEY}`, 'SMA50'),
          safeFetch(`${avBase}?function=EMA&symbol=${symbol}&interval=daily&time_period=12&series_type=close&apikey=${ALPHA_KEY}`, 'EMA12'),
          safeFetch(`${avBase}?function=EMA&symbol=${symbol}&interval=daily&time_period=26&series_type=close&apikey=${ALPHA_KEY}`, 'EMA26'),
          safeFetch(`${avBase}?function=MACD&symbol=${symbol}&interval=daily&series_type=close&apikey=${ALPHA_KEY}`, 'MACD'),
        ]);

        const extract = (settled: PromiseSettledResult<any>, key: string) => {
          if (settled.status !== 'fulfilled' || !settled.value) return [];
          const data = settled.value[key];
          if (!data) return [];
          return Object.entries(data).slice(0, 30).map(([date, v]: [string, any]) => ({
            date, ...v
          }));
        };

        result = {
          rsi: extract(rsi, 'Technical Analysis: RSI'),
          sma20: extract(sma20, 'Technical Analysis: SMA'),
          sma50: extract(sma50, 'Technical Analysis: SMA'),
          ema12: extract(ema12, 'Technical Analysis: EMA'),
          ema26: extract(ema26, 'Technical Analysis: EMA'),
          macd: extract(macd, 'Technical Analysis: MACD'),
        };
        break;
      }

      // ---- SENTIMENT: from Alpha Vantage + Finnhub ----
      case 'sentiment': {
        const [avSentiment, finnhubSentiment] = await Promise.allSettled([
          safeFetch(
            `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${symbol}&limit=20&apikey=${ALPHA_KEY}`,
            'AV Sentiment'
          ),
          safeFetch(
            `https://finnhub.io/api/v1/news-sentiment?symbol=${symbol}&token=${FINNHUB_KEY}`,
            'Finnhub Sentiment'
          ),
        ]);

        // Process Alpha Vantage sentiment
        let avData: any = null;
        if (avSentiment.status === 'fulfilled' && avSentiment.value) {
          const feed = avSentiment.value.feed || [];
          const sentiments = feed.map((item: any) => {
            const tickerSentiment = item.ticker_sentiment?.find((t: any) => 
              t.ticker?.toUpperCase() === symbol.toUpperCase()
            );
            return {
              title: item.title,
              url: item.url,
              source: item.source,
              publishedAt: item.time_published,
              overallSentiment: item.overall_sentiment_label,
              overallScore: parseFloat(item.overall_sentiment_score || '0'),
              tickerSentiment: tickerSentiment?.ticker_sentiment_label || 'Neutral',
              tickerScore: parseFloat(tickerSentiment?.ticker_sentiment_score || '0'),
              relevance: parseFloat(tickerSentiment?.relevance_score || '0'),
            };
          });
          
          const avgScore = sentiments.length > 0
            ? sentiments.reduce((s: number, i: any) => s + i.tickerScore, 0) / sentiments.length
            : 0;
          
          avData = { articles: sentiments.slice(0, 10), avgScore, count: sentiments.length };
        }

        // Process Finnhub sentiment
        let fhData: any = null;
        if (finnhubSentiment.status === 'fulfilled' && finnhubSentiment.value) {
          const v = finnhubSentiment.value;
          fhData = {
            buzz: v.buzz,
            sentiment: v.sentiment,
            companyNewsScore: v.companyNewsScore,
            sectorAverageBullishPercent: v.sectorAverageBullishPercent,
            sectorAverageNewsScore: v.sectorAverageNewsScore,
          };
        }

        result = { alphaVantage: avData, finnhub: fhData };
        break;
      }

      // ---- NEWS: from Finnhub + FMP + MarketAux ----
      case 'news': {
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const fromDate = weekAgo.toISOString().split('T')[0];
        const toDate = today.toISOString().split('T')[0];

        const [finnhubNews, fmpNews, marketauxNews] = await Promise.allSettled([
          safeFetch(
            `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${fromDate}&to=${toDate}&token=${FINNHUB_KEY}`,
            'Finnhub News'
          ),
          safeFetch(
            `https://financialmodelingprep.com/stable/stock-news?symbol=${symbol}&limit=15&apikey=${FMP_KEY}`,
            'FMP News'
          ),
          MARKETAUX_KEY ? safeFetch(
            `https://api.marketaux.com/v1/news/all?symbols=${symbol}&filter_entities=true&limit=10&api_token=${MARKETAUX_KEY}`,
            'MarketAux News'
          ) : Promise.resolve(null),
        ]);

        const articles: any[] = [];
        const seen = new Set<string>();

        // Finnhub
        if (finnhubNews.status === 'fulfilled' && Array.isArray(finnhubNews.value)) {
          for (const n of finnhubNews.value.slice(0, 10)) {
            const key = n.headline?.toLowerCase().slice(0, 50);
            if (key && !seen.has(key)) {
              seen.add(key);
              articles.push({
                title: n.headline, url: n.url, source: n.source,
                publishedAt: new Date(n.datetime * 1000).toISOString(),
                image: n.image, summary: n.summary, provider: 'Finnhub'
              });
            }
          }
        }

        // FMP
        if (fmpNews.status === 'fulfilled' && Array.isArray(fmpNews.value)) {
          for (const n of fmpNews.value.slice(0, 10)) {
            const key = n.title?.toLowerCase().slice(0, 50);
            if (key && !seen.has(key)) {
              seen.add(key);
              articles.push({
                title: n.title, url: n.url, source: n.site,
                publishedAt: n.publishedDate, image: n.image,
                summary: n.text?.slice(0, 200), provider: 'FMP'
              });
            }
          }
        }

        // MarketAux
        if (marketauxNews.status === 'fulfilled' && marketauxNews.value?.data) {
          for (const n of marketauxNews.value.data.slice(0, 10)) {
            const key = n.title?.toLowerCase().slice(0, 50);
            if (key && !seen.has(key)) {
              seen.add(key);
              articles.push({
                title: n.title, url: n.url, source: n.source,
                publishedAt: n.published_at, image: n.image_url,
                summary: n.description?.slice(0, 200), provider: 'MarketAux'
              });
            }
          }
        }

        // Sort by date desc
        articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        result = { articles: articles.slice(0, 20) };
        break;
      }

      // ---- AI SUMMARY: Unified recommendation ----
      case 'ai-summary': {
        const AI_CACHE_TTL = 15 * 60 * 1000;
        const aiCacheKey = `ai-summary:${symbol}`;
        const aiCached = getCached(aiCacheKey);
        if (aiCached) {
          return new Response(JSON.stringify(aiCached), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Gather data in parallel
        const avBase = 'https://www.alphavantage.co/query';
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const fromDate = weekAgo.toISOString().split('T')[0];
        const toDate = today.toISOString().split('T')[0];

        const [rsiRes, macdRes, smaRes, sentRes, fhSentRes, newsRes, quoteRes] = await Promise.allSettled([
          safeFetch(`${avBase}?function=RSI&symbol=${symbol}&interval=daily&time_period=14&series_type=close&apikey=${ALPHA_KEY}`, 'RSI'),
          safeFetch(`${avBase}?function=MACD&symbol=${symbol}&interval=daily&series_type=close&apikey=${ALPHA_KEY}`, 'MACD'),
          safeFetch(`${avBase}?function=SMA&symbol=${symbol}&interval=daily&time_period=50&series_type=close&apikey=${ALPHA_KEY}`, 'SMA50'),
          safeFetch(`https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${symbol}&limit=10&apikey=${ALPHA_KEY}`, 'Sentiment'),
          safeFetch(`https://finnhub.io/api/v1/news-sentiment?symbol=${symbol}&token=${FINNHUB_KEY}`, 'FH Sentiment'),
          safeFetch(`https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${fromDate}&to=${toDate}&token=${FINNHUB_KEY}`, 'News'),
          safeFetch(`https://financialmodelingprep.com/stable/quote?symbol=${symbol}&apikey=${FMP_KEY}`, 'Quote'),
        ]);

        const getVal = (r: PromiseSettledResult<any>) => r.status === 'fulfilled' ? r.value : null;

        // Extract latest RSI
        const rsiData = getVal(rsiRes);
        const rsiEntries = rsiData?.['Technical Analysis: RSI'] ? Object.entries(rsiData['Technical Analysis: RSI']).slice(0, 5) : [];
        const latestRsi = rsiEntries.length > 0 ? (rsiEntries[0][1] as any)?.RSI : null;

        // Extract latest MACD
        const macdData = getVal(macdRes);
        const macdEntries = macdData?.['Technical Analysis: MACD'] ? Object.entries(macdData['Technical Analysis: MACD']).slice(0, 5) : [];
        const latestMacd = macdEntries.length > 0 ? macdEntries[0][1] : null;

        // Extract SMA50
        const smaData = getVal(smaRes);
        const smaEntries = smaData?.['Technical Analysis: SMA'] ? Object.entries(smaData['Technical Analysis: SMA']).slice(0, 1) : [];
        const latestSma50 = smaEntries.length > 0 ? (smaEntries[0][1] as any)?.SMA : null;

        // Extract sentiment
        const sentData = getVal(sentRes);
        const sentFeed = sentData?.feed?.slice(0, 5) || [];
        const avgSentScore = sentFeed.length > 0
          ? sentFeed.reduce((s: number, i: any) => s + parseFloat(i.overall_sentiment_score || '0'), 0) / sentFeed.length
          : null;

        const fhSent = getVal(fhSentRes);
        const fhBullish = fhSent?.sentiment?.bullishPercent;

        // News headlines
        const newsData = getVal(newsRes);
        const headlines = Array.isArray(newsData) ? newsData.slice(0, 5).map((n: any) => n.headline) : [];

        // Quote
        const quoteData = getVal(quoteRes);
        const quote = Array.isArray(quoteData) ? quoteData[0] : null;

        // Build context for AI
        const context = `
Acción: ${symbol}
Precio actual: $${quote?.price || 'N/A'} | Cambio: ${quote?.changesPercentage?.toFixed(2) || 'N/A'}%
P/E: ${quote?.pe || 'N/A'} | Market Cap: $${quote?.marketCap ? (quote.marketCap / 1e9).toFixed(1) + 'B' : 'N/A'}

INDICADORES TÉCNICOS:
- RSI(14): ${latestRsi || 'N/A'}
- MACD: ${latestMacd ? `Línea: ${(latestMacd as any).MACD}, Signal: ${(latestMacd as any).MACD_Signal}, Hist: ${(latestMacd as any).MACD_Hist}` : 'N/A'}
- SMA(50): ${latestSma50 || 'N/A'} ${latestSma50 && quote?.price ? (quote.price > parseFloat(latestSma50) ? '(precio ENCIMA)' : '(precio DEBAJO)') : ''}

SENTIMIENTO:
- Alpha Vantage avg score: ${avgSentScore?.toFixed(3) || 'N/A'} (escala -1 a 1)
- Finnhub bullish%: ${fhBullish != null ? (fhBullish * 100).toFixed(0) + '%' : 'N/A'}

TITULARES RECIENTES:
${headlines.length > 0 ? headlines.map((h: string, i: number) => `${i + 1}. ${h}`).join('\n') : 'Sin noticias recientes'}`;

        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
        if (!LOVABLE_API_KEY) {
          result = { error: 'AI not configured' };
          break;
        }

        const stockModel = 'google/gemini-2.5-flash';
        const aiT0 = Date.now();
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: stockModel,
            messages: [
              {
                role: 'system',
                content: `Eres un analista financiero profesional. Genera un resumen ejecutivo en español para traders. Responde SOLO con un JSON válido (sin markdown ni backticks) con esta estructura exacta:
{
  "recommendation": "COMPRAR" | "MANTENER" | "VENDER",
  "confidence": 0-100,
  "summary": "Resumen de 2-3 oraciones máximo con el análisis unificado.",
  "technicalSignal": "ALCISTA" | "NEUTRAL" | "BAJISTA",
  "sentimentSignal": "POSITIVO" | "NEUTRAL" | "NEGATIVO",
  "newsSignal": "POSITIVO" | "NEUTRAL" | "NEGATIVO",
  "keyFactors": ["factor1", "factor2", "factor3"],
  "riskLevel": "BAJO" | "MEDIO" | "ALTO",
  "priceTarget": { "low": number, "mid": number, "high": number }
}`
              },
              { role: 'user', content: `Analiza esta acción y genera la recomendación unificada:\n${context}` }
            ],
          }),
        });
        const aiLatency = Date.now() - aiT0;

        if (!aiResponse.ok) {
          const errStatus = aiResponse.status;
          logAIUsage(stockModel, errStatus, aiLatency, undefined, { symbol });
          console.error(`[stock-analysis] AI gateway error: ${errStatus}`);
          result = { error: errStatus === 429 ? 'Rate limited' : errStatus === 402 ? 'Payment required' : 'AI error' };
          break;
        }

        const aiJson = await aiResponse.json();
        logAIUsage(stockModel, 200, aiLatency, aiJson.usage, { symbol });
        const aiContent = aiJson.choices?.[0]?.message?.content || '';

        try {
          const cleaned = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          result = JSON.parse(cleaned);
        } catch {
          result = { recommendation: 'MANTENER', confidence: 50, summary: aiContent.slice(0, 300), technicalSignal: 'NEUTRAL', sentimentSignal: 'NEUTRAL', newsSignal: 'NEUTRAL', keyFactors: [], riskLevel: 'MEDIO', priceTarget: null };
        }

        cache.set(aiCacheKey, { data: result, ts: Date.now() });
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    cache.set(cacheKey, { data: result, ts: Date.now() });
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[stock-analysis] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
