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
  // Technical indicators
  rsi14: number | null;
  atr14: number | null;
  atrPercent: number | null;
  sma20: number | null;
  sma50: number | null;
  ema20: number | null;
  macdValue: number | null;
  macdSignal: number | null;
  macdHistogram: number | null;
  // Momentum
  momentum: string | null; // 'strong_bullish' | 'bullish' | 'neutral' | 'bearish' | 'strong_bearish'
  volatility: string | null; // 'low' | 'moderate' | 'high' | 'extreme'
  trendStrength: string | null; // 'weak' | 'moderate' | 'strong'
  // Sentiment from news
  newsSentiment: number | null; // -1 to 1
  newsSentimentLabel: string | null;
  // Sources used
  sources: string[];
  timestamp: number;
}

function toForexSymbol(pair: string): { av: string; fh: string; fmp: string } {
  const clean = pair.replace("/", "").replace("-", "").toUpperCase();
  const base = clean.slice(0, 3);
  const quote = clean.slice(3, 6);
  return {
    av: `${base}${quote}`,
    fh: `OANDA:${base}_${quote}`,
    fmp: `${base}${quote}`,
  };
}

async function fetchAlphaVantage(pair: string, apiKey: string): Promise<Partial<MarketDataResult>> {
  const result: Partial<MarketDataResult> = {};
  const symbols = toForexSymbol(pair);

  try {
    // Fetch quote + RSI + ATR + MACD in parallel
    const [quoteRes, rsiRes, atrRes, macdRes, smaRes] = await Promise.allSettled([
      fetch(`https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${symbols.av.slice(0,3)}&to_currency=${symbols.av.slice(3)}&apikey=${apiKey}`),
      fetch(`https://www.alphavantage.co/query?function=RSI&symbol=${symbols.av}&interval=60min&time_period=14&series_type=close&apikey=${apiKey}`),
      fetch(`https://www.alphavantage.co/query?function=ATR&symbol=${symbols.av}&interval=daily&time_period=14&apikey=${apiKey}`),
      fetch(`https://www.alphavantage.co/query?function=MACD&symbol=${symbols.av}&interval=60min&series_type=close&apikey=${apiKey}`),
      fetch(`https://www.alphavantage.co/query?function=SMA&symbol=${symbols.av}&interval=daily&time_period=20&series_type=close&apikey=${apiKey}`),
    ]);

    // Parse quote
    if (quoteRes.status === 'fulfilled') {
      const data = await quoteRes.value.json();
      const rate = data?.["Realtime Currency Exchange Rate"];
      if (rate) {
        const price = parseFloat(rate["5. Exchange Rate"]);
        const open = parseFloat(rate["8. Bid Price"]) || null;
        result.price = price;
        result.sources = ['alpha_vantage'];
      }
    }

    // Parse RSI
    if (rsiRes.status === 'fulfilled') {
      const data = await rsiRes.value.json();
      const key = "Technical Analysis: RSI";
      if (data?.[key]) {
        const dates = Object.keys(data[key]);
        if (dates.length > 0) {
          result.rsi14 = parseFloat(data[key][dates[0]].RSI);
        }
      }
    }

    // Parse ATR
    if (atrRes.status === 'fulfilled') {
      const data = await atrRes.value.json();
      const key = "Technical Analysis: ATR";
      if (data?.[key]) {
        const dates = Object.keys(data[key]);
        if (dates.length > 0) {
          result.atr14 = parseFloat(data[key][dates[0]].ATR);
        }
      }
    }

    // Parse MACD
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

    // Parse SMA
    if (smaRes.status === 'fulfilled') {
      const data = await smaRes.value.json();
      const key = "Technical Analysis: SMA";
      if (data?.[key]) {
        const dates = Object.keys(data[key]);
        if (dates.length > 0) {
          result.sma20 = parseFloat(data[key][dates[0]].SMA);
        }
      }
    }
  } catch (e) {
    console.error("[signal-market-data] Alpha Vantage error:", e);
  }

  return result;
}

async function fetchFinnhub(pair: string, apiKey: string): Promise<Partial<MarketDataResult>> {
  const result: Partial<MarketDataResult> = {};
  const symbols = toForexSymbol(pair);

  try {
    // Fetch candles for daily OHLC
    const now = Math.floor(Date.now() / 1000);
    const dayAgo = now - 86400 * 2;
    
    const [quoteRes, candleRes] = await Promise.allSettled([
      fetch(`https://finnhub.io/api/v1/quote?symbol=${symbols.fh}&token=${apiKey}`),
      fetch(`https://finnhub.io/api/v1/forex/candle?symbol=${symbols.fh}&resolution=D&from=${dayAgo}&to=${now}&token=${apiKey}`),
    ]);

    // Parse quote
    if (quoteRes.status === 'fulfilled') {
      const data = await quoteRes.value.json();
      if (data && data.c > 0) {
        result.price = data.c;
        result.dailyHigh = data.h;
        result.dailyLow = data.l;
        result.dailyOpen = data.o;
        result.previousClose = data.pc;
        result.change = data.d;
        result.changePercent = data.dp;
        
        if (data.h && data.l) {
          result.dailyRange = data.h - data.l;
          if (data.c > 0) {
            result.dailyRangePercent = (result.dailyRange / data.c) * 100;
          }
        }
      }
    }

    // Parse candles for volume
    if (candleRes.status === 'fulfilled') {
      const data = await candleRes.value.json();
      if (data?.s === 'ok' && data.v?.length > 0) {
        result.volume = data.v[data.v.length - 1];
      }
    }
  } catch (e) {
    console.error("[signal-market-data] Finnhub error:", e);
  }

  return result;
}

async function fetchFMP(pair: string, apiKey: string): Promise<Partial<MarketDataResult>> {
  const result: Partial<MarketDataResult> = {};
  const symbols = toForexSymbol(pair);
  const fmpSymbol = `${symbols.fmp.slice(0,3)}/${symbols.fmp.slice(3)}`;

  try {
    const [quoteRes, technicalRes] = await Promise.allSettled([
      fetch(`https://financialmodelingprep.com/api/v3/quote/${fmpSymbol}?apikey=${apiKey}`),
      fetch(`https://financialmodelingprep.com/api/v3/technical_indicator/daily/${fmpSymbol}?period=14&type=rsi&apikey=${apiKey}`),
    ]);

    // Parse quote
    if (quoteRes.status === 'fulfilled') {
      const data = await quoteRes.value.json();
      if (Array.isArray(data) && data.length > 0) {
        const q = data[0];
        result.price = q.price ?? null;
        result.change = q.change ?? null;
        result.changePercent = q.changesPercentage ?? null;
        result.dailyHigh = q.dayHigh ?? null;
        result.dailyLow = q.dayLow ?? null;
        result.dailyOpen = q.open ?? null;
        result.previousClose = q.previousClose ?? null;
        result.volume = q.volume ?? null;
        
        if (q.dayHigh && q.dayLow) {
          result.dailyRange = q.dayHigh - q.dayLow;
          if (q.price > 0) {
            result.dailyRangePercent = (result.dailyRange / q.price) * 100;
          }
        }
      }
    }

    // Parse RSI from FMP technical
    if (technicalRes.status === 'fulfilled') {
      const data = await technicalRes.value.json();
      if (Array.isArray(data) && data.length > 0) {
        result.rsi14 = data[0].rsi ?? null;
      }
    }
  } catch (e) {
    console.error("[signal-market-data] FMP error:", e);
  }

  return result;
}

async function fetchMarketAux(pair: string, apiKey: string): Promise<Partial<MarketDataResult>> {
  const result: Partial<MarketDataResult> = {};
  const symbols = toForexSymbol(pair);
  const base = symbols.av.slice(0, 3);

  try {
    const res = await fetch(
      `https://api.marketaux.com/v1/news/all?symbols=${base}&filter_entities=true&language=en&limit=5&api_token=${apiKey}`
    );
    const data = await res.json();

    if (data?.data?.length > 0) {
      // Calculate average sentiment from recent news
      let totalSentiment = 0;
      let count = 0;
      for (const article of data.data) {
        if (article.entities) {
          for (const entity of article.entities) {
            if (entity.sentiment_score !== undefined) {
              totalSentiment += entity.sentiment_score;
              count++;
            }
          }
        }
      }
      if (count > 0) {
        result.newsSentiment = totalSentiment / count;
        result.newsSentimentLabel =
          result.newsSentiment > 0.2 ? 'Positivo' :
          result.newsSentiment < -0.2 ? 'Negativo' : 'Neutral';
      }
    }
  } catch (e) {
    console.error("[signal-market-data] MarketAux error:", e);
  }

  return result;
}

function deriveMomentum(data: MarketDataResult): void {
  // Derive momentum from RSI + MACD
  if (data.rsi14 !== null) {
    if (data.rsi14 > 70) data.momentum = 'strong_bullish';
    else if (data.rsi14 > 55) data.momentum = 'bullish';
    else if (data.rsi14 > 45) data.momentum = 'neutral';
    else if (data.rsi14 > 30) data.momentum = 'bearish';
    else data.momentum = 'strong_bearish';

    // Adjust with MACD histogram
    if (data.macdHistogram !== null) {
      if (data.macdHistogram > 0 && data.momentum === 'neutral') data.momentum = 'bullish';
      if (data.macdHistogram < 0 && data.momentum === 'neutral') data.momentum = 'bearish';
    }
  }

  // Derive volatility from ATR
  if (data.atr14 !== null && data.price !== null && data.price > 0) {
    data.atrPercent = (data.atr14 / data.price) * 100;
    if (data.atrPercent < 0.3) data.volatility = 'low';
    else if (data.atrPercent < 0.7) data.volatility = 'moderate';
    else if (data.atrPercent < 1.5) data.volatility = 'high';
    else data.volatility = 'extreme';
  }

  // Derive trend strength from SMA alignment
  if (data.price !== null && data.sma20 !== null) {
    const smaDistance = Math.abs(data.price - data.sma20) / data.price * 100;
    if (smaDistance < 0.2) data.trendStrength = 'weak';
    else if (smaDistance < 0.5) data.trendStrength = 'moderate';
    else data.trendStrength = 'strong';
  }
}

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

    // Merge: prefer FMP/Finnhub for quotes, AV for technicals, MA for sentiment
    const sources: string[] = [];
    if (Object.keys(av).length > 0) sources.push('Alpha Vantage');
    if (Object.keys(fh).length > 0) sources.push('Finnhub');
    if (Object.keys(fmp).length > 0) sources.push('FMP');
    if (Object.keys(ma).length > 0) sources.push('MarketAux');

    const merged: MarketDataResult = {
      symbol: symbol.toUpperCase(),
      // Price: prefer FMP > Finnhub > AV
      price: fmp.price ?? fh.price ?? av.price ?? null,
      change: fmp.change ?? fh.change ?? null,
      changePercent: fmp.changePercent ?? fh.changePercent ?? null,
      // Daily OHLC: prefer FMP > Finnhub
      dailyHigh: fmp.dailyHigh ?? fh.dailyHigh ?? null,
      dailyLow: fmp.dailyLow ?? fh.dailyLow ?? null,
      dailyOpen: fmp.dailyOpen ?? fh.dailyOpen ?? null,
      dailyRange: fmp.dailyRange ?? fh.dailyRange ?? null,
      dailyRangePercent: fmp.dailyRangePercent ?? fh.dailyRangePercent ?? null,
      previousClose: fmp.previousClose ?? fh.previousClose ?? null,
      volume: fmp.volume ?? fh.volume ?? null,
      // Technicals: prefer AV
      rsi14: av.rsi14 ?? fmp.rsi14 ?? null,
      atr14: av.atr14 ?? null,
      atrPercent: null,
      sma20: av.sma20 ?? null,
      sma50: av.sma50 ?? null,
      ema20: null,
      macdValue: av.macdValue ?? null,
      macdSignal: av.macdSignal ?? null,
      macdHistogram: av.macdHistogram ?? null,
      // Derived (will be computed below)
      momentum: null,
      volatility: null,
      trendStrength: null,
      // Sentiment
      newsSentiment: ma.newsSentiment ?? null,
      newsSentimentLabel: ma.newsSentimentLabel ?? null,
      sources,
      timestamp: Date.now(),
    };

    // Derive momentum, volatility, trend strength
    deriveMomentum(merged);

    // Cache result
    cache.set(cacheKey, { data: merged, ts: Date.now() });

    console.log(`[signal-market-data] ${symbol}: sources=${sources.join(',')}, price=${merged.price}, rsi=${merged.rsi14}, atr=${merged.atr14}`);

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
