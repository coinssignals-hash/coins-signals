import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// In-memory cache
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 3 * 60_000; // 3 min

interface MarketDataResult {
  symbol: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  dailyHigh: number | null;
  dailyLow: number | null;
  dailyOpen: number | null;
  dailyRange: number | null;
  dailyRangePercent: number | null;
  previousClose: number | null;
  volume: number | null;
  rsi14: number | null;
  atr14: number | null;
  atrPercent: number | null;
  sma20: number | null;
  sma50: number | null;
  ema20: number | null;
  macdValue: number | null;
  macdSignal: number | null;
  macdHistogram: number | null;
  momentum: string | null;
  volatility: string | null;
  trendStrength: string | null;
  newsSentiment: number | null;
  newsSentimentLabel: string | null;
  sources: string[];
  timestamp: number;
}

function parseForexPair(pair: string): { base: string; quote: string } {
  const clean = pair.replace("/", "").replace("-", "").toUpperCase();
  return { base: clean.slice(0, 3), quote: clean.slice(3, 6) };
}

// ── Alpha Vantage ──────────────────────────────────────────────
async function fetchAlphaVantage(pair: string, apiKey: string): Promise<Partial<MarketDataResult>> {
  const result: Partial<MarketDataResult> = {};
  const { base, quote } = parseForexPair(pair);

  try {
    const [quoteRes, rsiRes, atrRes, macdRes, smaRes] = await Promise.allSettled([
      fetch(`https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${base}&to_currency=${quote}&apikey=${apiKey}`),
      fetch(`https://www.alphavantage.co/query?function=RSI&symbol=${base}${quote}&interval=60min&time_period=14&series_type=close&apikey=${apiKey}`),
      fetch(`https://www.alphavantage.co/query?function=ATR&symbol=${base}${quote}&interval=daily&time_period=14&apikey=${apiKey}`),
      fetch(`https://www.alphavantage.co/query?function=MACD&symbol=${base}${quote}&interval=60min&series_type=close&apikey=${apiKey}`),
      fetch(`https://www.alphavantage.co/query?function=SMA&symbol=${base}${quote}&interval=daily&time_period=20&series_type=close&apikey=${apiKey}`),
    ]);

    if (quoteRes.status === 'fulfilled') {
      const data = await quoteRes.value.json();
      const rate = data?.["Realtime Currency Exchange Rate"];
      if (rate) {
        result.price = parseFloat(rate["5. Exchange Rate"]);
        result.sources = ['Alpha Vantage'];
      }
    }

    if (rsiRes.status === 'fulfilled') {
      const data = await rsiRes.value.json();
      const key = "Technical Analysis: RSI";
      if (data?.[key]) {
        const dates = Object.keys(data[key]);
        if (dates.length > 0) result.rsi14 = parseFloat(data[key][dates[0]].RSI);
      }
    }

    if (atrRes.status === 'fulfilled') {
      const data = await atrRes.value.json();
      const key = "Technical Analysis: ATR";
      if (data?.[key]) {
        const dates = Object.keys(data[key]);
        if (dates.length > 0) result.atr14 = parseFloat(data[key][dates[0]].ATR);
      }
    }

    if (macdRes.status === 'fulfilled') {
      const data = await macdRes.value.json();
      const key = "Technical Analysis: MACD";
      if (data?.[key]) {
        const dates = Object.keys(data[key]);
        if (dates.length > 0) {
          const macd = data[key][dates[0]];
          result.macdValue = parseFloat(macd.MACD);
          result.macdSignal = parseFloat(macd.MACD_Signal);
          result.macdHistogram = parseFloat(macd.MACD_Hist);
        }
      }
    }

    if (smaRes.status === 'fulfilled') {
      const data = await smaRes.value.json();
      const key = "Technical Analysis: SMA";
      if (data?.[key]) {
        const dates = Object.keys(data[key]);
        if (dates.length > 0) result.sma20 = parseFloat(data[key][dates[0]].SMA);
      }
    }
  } catch (e) {
    console.error("[signal-market-data] Alpha Vantage error:", e);
  }

  return result;
}

// ── Finnhub (free plan: /forex/rates for prices) ──────────────
async function fetchFinnhub(pair: string, apiKey: string): Promise<Partial<MarketDataResult>> {
  const result: Partial<MarketDataResult> = {};
  const { base, quote } = parseForexPair(pair);

  try {
    // /forex/rates is FREE and returns all forex rates with a given base currency
    const ratesRes = await fetch(
      `https://finnhub.io/api/v1/forex/rates?base=${base}&token=${apiKey}`
    );
    const data = await ratesRes.json();

    if (data?.quote && data.quote[quote]) {
      result.price = data.quote[quote];
      console.log(`[signal-market-data] Finnhub rates OK: ${base}/${quote}, price=${result.price}`);
    } else {
      console.warn(`[signal-market-data] Finnhub rates: no ${quote} in response for base=${base}`);
    }
  } catch (e) {
    console.error("[signal-market-data] Finnhub error:", e);
  }

  return result;
}

// ── FMP (use stable endpoint + forex list) ─────────────────────
async function fetchFMP(pair: string, apiKey: string): Promise<Partial<MarketDataResult>> {
  const result: Partial<MarketDataResult> = {};
  const { base, quote } = parseForexPair(pair);
  const fmpPair = `${base}${quote}`;

  try {
    // Use the stable quote endpoint and the forex list endpoint
    const [stableRes, forexListRes] = await Promise.allSettled([
      fetch(`https://financialmodelingprep.com/stable/quote?symbol=${fmpPair}&apikey=${apiKey}`),
      fetch(`https://financialmodelingprep.com/api/v3/fx/${fmpPair}?apikey=${apiKey}`),
    ]);

    // Try stable quote first
    if (stableRes.status === 'fulfilled') {
      const raw = await stableRes.value.text();
      try {
        const data = JSON.parse(raw);
        const q = Array.isArray(data) ? data[0] : data;
        if (q && (q.price || q.bid)) {
          result.price = q.price ?? ((q.bid + q.ask) / 2) ?? null;
          result.change = q.change ?? q.changes ?? null;
          result.changePercent = q.changesPercentage ?? null;
          result.dailyHigh = q.dayHigh ?? q.high ?? null;
          result.dailyLow = q.dayLow ?? q.low ?? null;
          result.dailyOpen = q.open ?? null;
          result.previousClose = q.previousClose ?? null;
          result.volume = q.volume ?? null;
          if (result.dailyHigh && result.dailyLow) {
            result.dailyRange = result.dailyHigh - result.dailyLow;
            if (result.price && result.price > 0) result.dailyRangePercent = (result.dailyRange / result.price) * 100;
          }
          console.log(`[signal-market-data] FMP stable OK: ${fmpPair}, price=${result.price}`);
        } else {
          console.warn(`[signal-market-data] FMP stable raw: ${raw.slice(0, 200)}`);
        }
      } catch { console.warn(`[signal-market-data] FMP stable parse fail: ${raw.slice(0, 100)}`); }
    }

    // Fallback: /api/v3/fx endpoint (returns real-time forex rates)
    if (!result.price && forexListRes.status === 'fulfilled') {
      const raw = await forexListRes.value.text();
      try {
        const data = JSON.parse(raw);
        const item = Array.isArray(data) ? data[0] : data;
        if (item && (item.bid || item.price)) {
          result.price = item.price ?? ((item.bid + item.ask) / 2);
          result.dailyHigh = item.high ?? null;
          result.dailyLow = item.low ?? null;
          result.dailyOpen = item.open ?? null;
          result.change = item.changes ?? null;
          result.changePercent = item.changesPercentage ?? null;
          console.log(`[signal-market-data] FMP fx OK: ${fmpPair}, price=${result.price}`);
        } else {
          console.warn(`[signal-market-data] FMP fx raw: ${raw.slice(0, 200)}`);
        }
      } catch { /* parse error */ }
    }

    if (!result.price) {
      console.warn(`[signal-market-data] FMP no price for ${fmpPair}`);
    }
  } catch (e) {
    console.error("[signal-market-data] FMP error:", e);
  }

  return result;
}

// ── MarketAux (news sentiment for currency pairs) ──────────────
async function fetchMarketAux(pair: string, apiKey: string): Promise<Partial<MarketDataResult>> {
  const result: Partial<MarketDataResult> = {};
  const { base, quote } = parseForexPair(pair);

  try {
    // Use search without filter_entities to get broader results with sentiment
    const res = await fetch(
      `https://api.marketaux.com/v1/news/all?search=${base}+${quote}&language=en&limit=10&api_token=${apiKey}`
    );
    const data = await res.json();

    if (data?.data?.length > 0) {
      let totalSentiment = 0;
      let count = 0;

      for (const article of data.data) {
        // Check entity-level sentiment
        if (article.entities && Array.isArray(article.entities)) {
          for (const entity of article.entities) {
            if (typeof entity.sentiment_score === 'number') {
              totalSentiment += entity.sentiment_score;
              count++;
            }
          }
        }
      }

      // If no entity sentiment, try to derive from article highlights
      if (count === 0) {
        for (const article of data.data) {
          if (article.entities && Array.isArray(article.entities)) {
            for (const entity of article.entities) {
              // Some responses use different field names
              const score = entity.sentiment_score ?? entity.score ?? entity.sentiment;
              if (typeof score === 'number') {
                totalSentiment += score;
                count++;
              }
            }
          }
        }
      }

      if (count > 0) {
        result.newsSentiment = totalSentiment / count;
        result.newsSentimentLabel =
          result.newsSentiment > 0.2 ? 'Positivo' :
          result.newsSentiment < -0.2 ? 'Negativo' : 'Neutral';
        console.log(`[signal-market-data] MarketAux OK: sentiment=${result.newsSentiment.toFixed(3)} (${count} scores, ${data.data.length} articles)`);
      } else {
        // Still report articles found even without sentiment
        console.warn(`[signal-market-data] MarketAux: ${data.data.length} articles, 0 sentiment scores. First article entities: ${JSON.stringify(data.data[0]?.entities?.slice(0, 2) ?? 'none').slice(0, 300)}`);
      }
    } else {
      console.warn(`[signal-market-data] MarketAux: no articles for ${base} ${quote}. Error: ${JSON.stringify(data?.error ?? 'none')}`);
    }
  } catch (e) {
    console.error("[signal-market-data] MarketAux error:", e);
  }

  return result;
}

// ── Derived indicators ─────────────────────────────────────────
function deriveMomentum(data: MarketDataResult): void {
  if (data.rsi14 !== null) {
    if (data.rsi14 > 70) data.momentum = 'strong_bullish';
    else if (data.rsi14 > 55) data.momentum = 'bullish';
    else if (data.rsi14 > 45) data.momentum = 'neutral';
    else if (data.rsi14 > 30) data.momentum = 'bearish';
    else data.momentum = 'strong_bearish';

    if (data.macdHistogram !== null) {
      if (data.macdHistogram > 0 && data.momentum === 'neutral') data.momentum = 'bullish';
      if (data.macdHistogram < 0 && data.momentum === 'neutral') data.momentum = 'bearish';
    }
  }

  if (data.atr14 !== null && data.price !== null && data.price > 0) {
    data.atrPercent = (data.atr14 / data.price) * 100;
    if (data.atrPercent < 0.3) data.volatility = 'low';
    else if (data.atrPercent < 0.7) data.volatility = 'moderate';
    else if (data.atrPercent < 1.5) data.volatility = 'high';
    else data.volatility = 'extreme';
  }

  if (data.price !== null && data.sma20 !== null) {
    const smaDistance = Math.abs(data.price - data.sma20) / data.price * 100;
    if (smaDistance < 0.2) data.trendStrength = 'weak';
    else if (smaDistance < 0.5) data.trendStrength = 'moderate';
    else data.trendStrength = 'strong';
  }
}

// ── Main handler ───────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol } = await req.json();
    if (!symbol) {
      return new Response(JSON.stringify({ error: "symbol is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check cache
    const cacheKey = `market-data:${symbol.toUpperCase()}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return new Response(JSON.stringify({ ...cached.data as object, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const avKey = Deno.env.get("ALPHA_VANTAGE_API_KEY") || "";
    const fhKey = Deno.env.get("FINNHUB_API_KEY") || "";
    const fmpKey = Deno.env.get("FMP_API_KEY") || "";
    const maKey = Deno.env.get("MARKETAUX_API_KEY") || "";

    // Fetch from all sources in parallel
    const [avData, fhData, fmpData, maData] = await Promise.allSettled([
      avKey ? fetchAlphaVantage(symbol, avKey) : Promise.resolve({}),
      fhKey ? fetchFinnhub(symbol, fhKey) : Promise.resolve({}),
      fmpKey ? fetchFMP(symbol, fmpKey) : Promise.resolve({}),
      maKey ? fetchMarketAux(symbol, maKey) : Promise.resolve({}),
    ]);

    const av = avData.status === 'fulfilled' ? avData.value : {};
    const fh = fhData.status === 'fulfilled' ? fhData.value : {};
    const fmp = fmpData.status === 'fulfilled' ? fmpData.value : {};
    const ma = maData.status === 'fulfilled' ? maData.value : {};

    // Track which sources contributed data
    const sources: string[] = [];
    if (av.price || av.rsi14 || av.atr14 || av.macdValue || av.sma20) sources.push('Alpha Vantage');
    if (fh.price || fh.dailyHigh) sources.push('Finnhub');
    if (fmp.price || fmp.rsi14) sources.push('FMP');
    if (ma.newsSentiment !== undefined && ma.newsSentiment !== null) sources.push('MarketAux');

    // Merge: prefer FMP/Finnhub for quotes, AV for technicals, MA for sentiment
    const merged: MarketDataResult = {
      symbol: symbol.toUpperCase(),
      price: fmp.price ?? fh.price ?? av.price ?? null,
      change: fmp.change ?? fh.change ?? null,
      changePercent: fmp.changePercent ?? fh.changePercent ?? null,
      dailyHigh: fmp.dailyHigh ?? fh.dailyHigh ?? null,
      dailyLow: fmp.dailyLow ?? fh.dailyLow ?? null,
      dailyOpen: fmp.dailyOpen ?? fh.dailyOpen ?? null,
      dailyRange: fmp.dailyRange ?? fh.dailyRange ?? null,
      dailyRangePercent: fmp.dailyRangePercent ?? fh.dailyRangePercent ?? null,
      previousClose: fmp.previousClose ?? fh.previousClose ?? null,
      volume: fmp.volume ?? fh.volume ?? null,
      rsi14: av.rsi14 ?? fmp.rsi14 ?? null,
      atr14: av.atr14 ?? null,
      atrPercent: null,
      sma20: av.sma20 ?? null,
      sma50: null,
      ema20: null,
      macdValue: av.macdValue ?? null,
      macdSignal: av.macdSignal ?? null,
      macdHistogram: av.macdHistogram ?? null,
      momentum: null,
      volatility: null,
      trendStrength: null,
      newsSentiment: ma.newsSentiment ?? null,
      newsSentimentLabel: ma.newsSentimentLabel ?? null,
      sources,
      timestamp: Date.now(),
    };

    deriveMomentum(merged);

    cache.set(cacheKey, { data: merged, ts: Date.now() });

    console.log(`[signal-market-data] ${symbol}: sources=[${sources.join(', ')}], price=${merged.price}, rsi=${merged.rsi14}, atr=${merged.atr14}, sentiment=${merged.newsSentiment}`);

    return new Response(JSON.stringify(merged), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[signal-market-data] Error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
