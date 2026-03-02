import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
