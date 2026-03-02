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
  bid: number | null;
  ask: number | null;
  spread: number | null;
  spreadPips: number | null;
  // Technical indicators
  rsi14: number | null;
  atr14: number | null;
  atrPercent: number | null;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  ema9: number | null;
  ema20: number | null;
  ema50: number | null;
  macdValue: number | null;
  macdSignal: number | null;
  macdHistogram: number | null;
  stochK: number | null;
  stochD: number | null;
  williamsR: number | null;
  adx14: number | null;
  bollingerUpper: number | null;
  bollingerMiddle: number | null;
  bollingerLower: number | null;
  bollingerWidth: number | null;
  // Moving average signals
  smaSignal: string | null;
  emaSignal: string | null;
  // Derived
  momentum: string | null;
  volatility: string | null;
  trendStrength: string | null;
  overallSignal: string | null;
  // Sentiment
  newsSentiment: number | null;
  newsSentimentLabel: string | null;
  newsHeadlines: string[];
  // Economic
  upcomingEvents: EconomicEvent[];
  // Meta
  sources: string[];
  timestamp: number;
}

interface EconomicEvent {
  event: string;
  country: string;
  impact: string;
  date: string;
  actual?: string;
  estimate?: string;
  previous?: string;
}

function parseForexPair(pair: string): { base: string; quote: string } {
  const clean = pair.replace("/", "").replace("-", "").toUpperCase();
  return { base: clean.slice(0, 3), quote: clean.slice(3, 6) };
}

function pipMultiplier(quote: string): number {
  return quote === "JPY" ? 100 : 10000;
}

// ── Alpha Vantage ──────────────────────────────────────────────
async function fetchAlphaVantage(pair: string, apiKey: string): Promise<Partial<MarketDataResult>> {
  const result: Partial<MarketDataResult> = {};
  const { base, quote } = parseForexPair(pair);
  const sym = `${base}${quote}`;

  try {
    const [quoteRes, rsiRes, atrRes, macdRes, sma20Res, sma50Res, sma200Res, ema9Res, ema20Res, stochRes, adxRes, bbRes, williamsRes] = await Promise.allSettled([
      fetch(`https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${base}&to_currency=${quote}&apikey=${apiKey}`),
      fetch(`https://www.alphavantage.co/query?function=RSI&symbol=${sym}&interval=60min&time_period=14&series_type=close&apikey=${apiKey}`),
      fetch(`https://www.alphavantage.co/query?function=ATR&symbol=${sym}&interval=daily&time_period=14&apikey=${apiKey}`),
      fetch(`https://www.alphavantage.co/query?function=MACD&symbol=${sym}&interval=60min&series_type=close&apikey=${apiKey}`),
      fetch(`https://www.alphavantage.co/query?function=SMA&symbol=${sym}&interval=daily&time_period=20&series_type=close&apikey=${apiKey}`),
      fetch(`https://www.alphavantage.co/query?function=SMA&symbol=${sym}&interval=daily&time_period=50&series_type=close&apikey=${apiKey}`),
      fetch(`https://www.alphavantage.co/query?function=SMA&symbol=${sym}&interval=daily&time_period=200&series_type=close&apikey=${apiKey}`),
      fetch(`https://www.alphavantage.co/query?function=EMA&symbol=${sym}&interval=60min&time_period=9&series_type=close&apikey=${apiKey}`),
      fetch(`https://www.alphavantage.co/query?function=EMA&symbol=${sym}&interval=60min&time_period=20&series_type=close&apikey=${apiKey}`),
      fetch(`https://www.alphavantage.co/query?function=STOCH&symbol=${sym}&interval=60min&apikey=${apiKey}`),
      fetch(`https://www.alphavantage.co/query?function=ADX&symbol=${sym}&interval=daily&time_period=14&apikey=${apiKey}`),
      fetch(`https://www.alphavantage.co/query?function=BBANDS&symbol=${sym}&interval=60min&time_period=20&series_type=close&apikey=${apiKey}`),
      fetch(`https://www.alphavantage.co/query?function=WILLR&symbol=${sym}&interval=60min&time_period=14&apikey=${apiKey}`),
    ]);

    const getFirst = (res: PromiseSettledResult<Response>, key: string) => {
      if (res.status !== 'fulfilled') return null;
      return res.value.json().then((data: Record<string, Record<string, Record<string, string>>>) => {
        if (data?.[key]) {
          const dates = Object.keys(data[key]);
          return dates.length > 0 ? data[key][dates[0]] : null;
        }
        return null;
      }).catch(() => null);
    };

    // Quote
    if (quoteRes.status === 'fulfilled') {
      const data = await quoteRes.value.json();
      const rate = data?.["Realtime Currency Exchange Rate"];
      if (rate) {
        result.price = parseFloat(rate["5. Exchange Rate"]);
        result.bid = parseFloat(rate["8. Bid Price"]) || null;
        result.ask = parseFloat(rate["9. Ask Price"]) || null;
        if (result.bid && result.ask) {
          result.spread = result.ask - result.bid;
          result.spreadPips = result.spread * pipMultiplier(quote);
        }
      }
    }

    // RSI
    const rsiData = await getFirst(rsiRes, "Technical Analysis: RSI");
    if (rsiData) result.rsi14 = parseFloat(rsiData.RSI);

    // ATR
    const atrData = await getFirst(atrRes, "Technical Analysis: ATR");
    if (atrData) result.atr14 = parseFloat(atrData.ATR);

    // MACD
    const macdData = await getFirst(macdRes, "Technical Analysis: MACD");
    if (macdData) {
      result.macdValue = parseFloat(macdData.MACD);
      result.macdSignal = parseFloat(macdData.MACD_Signal);
      result.macdHistogram = parseFloat(macdData.MACD_Hist);
    }

    // SMAs
    const sma20Data = await getFirst(sma20Res, "Technical Analysis: SMA");
    if (sma20Data) result.sma20 = parseFloat(sma20Data.SMA);

    const sma50Data = await getFirst(sma50Res, "Technical Analysis: SMA");
    if (sma50Data) result.sma50 = parseFloat(sma50Data.SMA);

    const sma200Data = await getFirst(sma200Res, "Technical Analysis: SMA");
    if (sma200Data) result.sma200 = parseFloat(sma200Data.SMA);

    // EMAs
    const ema9Data = await getFirst(ema9Res, "Technical Analysis: EMA");
    if (ema9Data) result.ema9 = parseFloat(ema9Data.EMA);

    const ema20Data = await getFirst(ema20Res, "Technical Analysis: EMA");
    if (ema20Data) result.ema20 = parseFloat(ema20Data.EMA);

    // Stochastic
    const stochData = await getFirst(stochRes, "Technical Analysis: STOCH");
    if (stochData) {
      result.stochK = parseFloat(stochData.SlowK);
      result.stochD = parseFloat(stochData.SlowD);
    }

    // ADX
    const adxData = await getFirst(adxRes, "Technical Analysis: ADX");
    if (adxData) result.adx14 = parseFloat(adxData.ADX);

    // Bollinger Bands
    const bbData = await getFirst(bbRes, "Technical Analysis: BBANDS");
    if (bbData) {
      result.bollingerUpper = parseFloat(bbData["Real Upper Band"]);
      result.bollingerMiddle = parseFloat(bbData["Real Middle Band"]);
      result.bollingerLower = parseFloat(bbData["Real Lower Band"]);
      if (result.bollingerUpper && result.bollingerLower && result.bollingerMiddle) {
        result.bollingerWidth = ((result.bollingerUpper - result.bollingerLower) / result.bollingerMiddle) * 100;
      }
    }

    // Williams %R
    const willData = await getFirst(williamsRes, "Technical Analysis: WILLR");
    if (willData) result.williamsR = parseFloat(willData["Williams' %R"]);

    console.log(`[signal-market-data] AV OK: ${sym}, price=${result.price}, rsi=${result.rsi14}, atr=${result.atr14}, stochK=${result.stochK}, adx=${result.adx14}, bb=${result.bollingerMiddle}, willR=${result.williamsR}`);
  } catch (e) {
    console.error("[signal-market-data] Alpha Vantage error:", e);
  }

  return result;
}

// ── Finnhub ──────────────────────────────────────────────────
async function fetchFinnhub(pair: string, apiKey: string): Promise<Partial<MarketDataResult>> {
  const result: Partial<MarketDataResult> = {};
  const { base, quote } = parseForexPair(pair);

  try {
    // Fetch rates + economic calendar in parallel
    const now = new Date();
    const from = now.toISOString().split('T')[0];
    const toDate = new Date(now.getTime() + 7 * 86400000).toISOString().split('T')[0];

    const [ratesRes, calendarRes] = await Promise.allSettled([
      fetch(`https://finnhub.io/api/v1/forex/rates?base=${base}&token=${apiKey}`),
      fetch(`https://finnhub.io/api/v1/calendar/economic?from=${from}&to=${toDate}&token=${apiKey}`),
    ]);

    // Rates
    if (ratesRes.status === 'fulfilled') {
      const data = await ratesRes.value.json();
      if (data?.quote && data.quote[quote]) {
        result.price = data.quote[quote];
        console.log(`[signal-market-data] Finnhub rates OK: ${base}/${quote}, price=${result.price}`);
      }
    }

    // Economic Calendar - filter for relevant countries
    if (calendarRes.status === 'fulfilled') {
      const data = await calendarRes.value.json();
      if (data?.economicCalendar?.length > 0) {
        const currencyCountries: Record<string, string[]> = {
          USD: ['US'], EUR: ['DE', 'FR', 'IT', 'ES', 'EU'], GBP: ['GB'],
          JPY: ['JP'], CHF: ['CH'], AUD: ['AU'], NZD: ['NZ'], CAD: ['CA'],
        };
        const relevantCountries = [...(currencyCountries[base] || []), ...(currencyCountries[quote] || [])];
        
        const events: EconomicEvent[] = data.economicCalendar
          .filter((e: { country: string }) => relevantCountries.includes(e.country))
          .slice(0, 10)
          .map((e: { event: string; country: string; impact: string; time: string; actual: number; estimate: number; prev: number }) => ({
            event: e.event,
            country: e.country,
            impact: e.impact === '3' ? 'high' : e.impact === '2' ? 'medium' : 'low',
            date: e.time || from,
            actual: e.actual?.toString() ?? undefined,
            estimate: e.estimate?.toString() ?? undefined,
            previous: e.prev?.toString() ?? undefined,
          }));

        if (events.length > 0) {
          result.upcomingEvents = events;
          console.log(`[signal-market-data] Finnhub calendar: ${events.length} events for ${base}/${quote}`);
        }
      }
    }
  } catch (e) {
    console.error("[signal-market-data] Finnhub error:", e);
  }

  return result;
}

// ── FMP ─────────────────────────────────────────────────────
async function fetchFMP(pair: string, apiKey: string): Promise<Partial<MarketDataResult>> {
  const result: Partial<MarketDataResult> = {};
  const { base, quote } = parseForexPair(pair);
  const fmpPair = `${base}${quote}`;

  try {
    // Stable quote + stable technical indicators
    const [stableRes, forexRes, smaRes, emaRes, rsiRes] = await Promise.allSettled([
      fetch(`https://financialmodelingprep.com/stable/quote?symbol=${fmpPair}&apikey=${apiKey}`),
      fetch(`https://financialmodelingprep.com/api/v3/fx/${fmpPair}?apikey=${apiKey}`),
      fetch(`https://financialmodelingprep.com/stable/technical-indicators/sma?symbol=${fmpPair}&periodLength=50&timeframe=1day&apikey=${apiKey}`),
      fetch(`https://financialmodelingprep.com/stable/technical-indicators/ema?symbol=${fmpPair}&periodLength=50&timeframe=1day&apikey=${apiKey}`),
      fetch(`https://financialmodelingprep.com/stable/technical-indicators/rsi?symbol=${fmpPair}&periodLength=14&timeframe=1day&apikey=${apiKey}`),
    ]);

    // Stable quote
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
          if (q.priceAvg50) result.sma50 = q.priceAvg50;
          if (q.priceAvg200) result.sma200 = q.priceAvg200;
          if (result.dailyHigh && result.dailyLow) {
            result.dailyRange = result.dailyHigh - result.dailyLow;
            if (result.price && result.price > 0) result.dailyRangePercent = (result.dailyRange / result.price) * 100;
          }
          console.log(`[signal-market-data] FMP stable OK: ${fmpPair}, price=${result.price}, sma50=${result.sma50}, sma200=${result.sma200}`);
        }
      } catch { console.warn(`[signal-market-data] FMP stable parse fail`); }
    }

    // Fallback forex endpoint
    if (!result.price && forexRes.status === 'fulfilled') {
      const raw = await forexRes.value.text();
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
        }
      } catch { /* parse error */ }
    }

    // FMP Technical indicators
    const parseFMPIndicator = async (res: PromiseSettledResult<Response>, name: string) => {
      if (res.status !== 'fulfilled') return null;
      try {
        const data = await res.value.json();
        const item = Array.isArray(data) ? data[0] : data;
        return item ?? null;
      } catch {
        console.warn(`[signal-market-data] FMP ${name} parse fail`);
        return null;
      }
    };

    const fmpSma = await parseFMPIndicator(smaRes, 'SMA');
    if (fmpSma?.sma) result.sma50 = result.sma50 ?? fmpSma.sma;

    const fmpEma = await parseFMPIndicator(emaRes, 'EMA');
    if (fmpEma?.ema) result.ema50 = fmpEma.ema;

    const fmpRsi = await parseFMPIndicator(rsiRes, 'RSI');
    if (fmpRsi?.rsi) result.rsi14 = result.rsi14 ?? fmpRsi.rsi;

  } catch (e) {
    console.error("[signal-market-data] FMP error:", e);
  }

  return result;
}

// ── MarketAux ──────────────────────────────────────────────────
async function fetchMarketAux(pair: string, apiKey: string): Promise<Partial<MarketDataResult>> {
  const result: Partial<MarketDataResult> = {};
  const { base, quote } = parseForexPair(pair);

  try {
    const res = await fetch(
      `https://api.marketaux.com/v1/news/all?search=${base}+${quote}&language=en&limit=10&api_token=${apiKey}`
    );
    const data = await res.json();

    if (data?.data?.length > 0) {
      let totalSentiment = 0;
      let count = 0;
      const headlines: string[] = [];

      for (const article of data.data) {
        // Collect headlines
        if (article.title) headlines.push(article.title);

        // Entity-level sentiment
        if (article.entities && Array.isArray(article.entities)) {
          for (const entity of article.entities) {
            const score = entity.sentiment_score ?? entity.score ?? entity.sentiment;
            if (typeof score === 'number') {
              totalSentiment += score;
              count++;
            }
          }
        }

        // Fallback: article-level sentiment
        if (typeof article.sentiment_score === 'number') {
          totalSentiment += article.sentiment_score;
          count++;
        }
      }

      result.newsHeadlines = headlines.slice(0, 5);

      if (count > 0) {
        result.newsSentiment = totalSentiment / count;
        result.newsSentimentLabel =
          result.newsSentiment > 0.3 ? 'Muy Positivo' :
          result.newsSentiment > 0.1 ? 'Positivo' :
          result.newsSentiment > -0.1 ? 'Neutral' :
          result.newsSentiment > -0.3 ? 'Negativo' : 'Muy Negativo';
        console.log(`[signal-market-data] MarketAux OK: sentiment=${result.newsSentiment.toFixed(3)} (${count} scores, ${data.data.length} articles, ${headlines.length} headlines)`);
      } else {
        console.warn(`[signal-market-data] MarketAux: ${data.data.length} articles, 0 sentiment scores`);
      }
    }
  } catch (e) {
    console.error("[signal-market-data] MarketAux error:", e);
  }

  return result;
}

// ── Derived indicators ─────────────────────────────────────────
function deriveIndicators(data: MarketDataResult): void {
  const p = data.price;

  // ATR %
  if (data.atr14 !== null && p !== null && p > 0) {
    data.atrPercent = (data.atr14 / p) * 100;
    if (data.atrPercent < 0.3) data.volatility = 'low';
    else if (data.atrPercent < 0.7) data.volatility = 'moderate';
    else if (data.atrPercent < 1.5) data.volatility = 'high';
    else data.volatility = 'extreme';
  }

  // Momentum from RSI + MACD + Stochastic
  if (data.rsi14 !== null) {
    if (data.rsi14 > 70) data.momentum = 'strong_bullish';
    else if (data.rsi14 > 55) data.momentum = 'bullish';
    else if (data.rsi14 > 45) data.momentum = 'neutral';
    else if (data.rsi14 > 30) data.momentum = 'bearish';
    else data.momentum = 'strong_bearish';

    // Refine with MACD
    if (data.macdHistogram !== null) {
      if (data.macdHistogram > 0 && data.momentum === 'neutral') data.momentum = 'bullish';
      if (data.macdHistogram < 0 && data.momentum === 'neutral') data.momentum = 'bearish';
    }

    // Refine with Stochastic
    if (data.stochK !== null && data.stochD !== null) {
      if (data.stochK > 80 && data.stochD > 80 && data.momentum === 'bullish') data.momentum = 'strong_bullish';
      if (data.stochK < 20 && data.stochD < 20 && data.momentum === 'bearish') data.momentum = 'strong_bearish';
    }
  }

  // Trend strength from ADX
  if (data.adx14 !== null) {
    if (data.adx14 < 20) data.trendStrength = 'weak';
    else if (data.adx14 < 40) data.trendStrength = 'moderate';
    else if (data.adx14 < 60) data.trendStrength = 'strong';
    else data.trendStrength = 'very_strong';
  } else if (p !== null && data.sma20 !== null) {
    const smaDistance = Math.abs(p - data.sma20) / p * 100;
    if (smaDistance < 0.2) data.trendStrength = 'weak';
    else if (smaDistance < 0.5) data.trendStrength = 'moderate';
    else data.trendStrength = 'strong';
  }

  // SMA signal
  if (p !== null && data.sma20 !== null && data.sma50 !== null) {
    if (p > data.sma20 && data.sma20 > data.sma50) data.smaSignal = 'bullish';
    else if (p < data.sma20 && data.sma20 < data.sma50) data.smaSignal = 'bearish';
    else data.smaSignal = 'neutral';
  }

  // EMA signal
  if (data.ema9 !== null && data.ema20 !== null) {
    if (data.ema9 > data.ema20) data.emaSignal = 'bullish';
    else if (data.ema9 < data.ema20) data.emaSignal = 'bearish';
    else data.emaSignal = 'neutral';
  }

  // Overall signal (consensus)
  const signals: number[] = [];
  if (data.momentum === 'strong_bullish') signals.push(2);
  else if (data.momentum === 'bullish') signals.push(1);
  else if (data.momentum === 'neutral') signals.push(0);
  else if (data.momentum === 'bearish') signals.push(-1);
  else if (data.momentum === 'strong_bearish') signals.push(-2);

  if (data.smaSignal === 'bullish') signals.push(1);
  else if (data.smaSignal === 'bearish') signals.push(-1);

  if (data.emaSignal === 'bullish') signals.push(1);
  else if (data.emaSignal === 'bearish') signals.push(-1);

  if (data.newsSentiment !== null) {
    if (data.newsSentiment > 0.2) signals.push(1);
    else if (data.newsSentiment < -0.2) signals.push(-1);
  }

  if (signals.length > 0) {
    const avg = signals.reduce((a, b) => a + b, 0) / signals.length;
    if (avg > 0.8) data.overallSignal = 'strong_buy';
    else if (avg > 0.3) data.overallSignal = 'buy';
    else if (avg > -0.3) data.overallSignal = 'neutral';
    else if (avg > -0.8) data.overallSignal = 'sell';
    else data.overallSignal = 'strong_sell';
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

    // Track sources
    const sources: string[] = [];
    if (av.price || av.rsi14 || av.atr14 || av.macdValue || av.sma20 || av.stochK || av.adx14) sources.push('Alpha Vantage');
    if (fh.price || (fh.upcomingEvents && fh.upcomingEvents.length > 0)) sources.push('Finnhub');
    if (fmp.price || fmp.sma50 || fmp.rsi14 || fmp.ema50) sources.push('FMP');
    if (ma.newsSentiment !== undefined && ma.newsSentiment !== null) sources.push('MarketAux');

    // Merge: prefer FMP for quotes, AV for technicals, Finnhub for calendar, MA for sentiment
    const merged: MarketDataResult = {
      symbol: symbol.toUpperCase(),
      price: fmp.price ?? fh.price ?? av.price ?? null,
      change: fmp.change ?? null,
      changePercent: fmp.changePercent ?? null,
      dailyHigh: fmp.dailyHigh ?? null,
      dailyLow: fmp.dailyLow ?? null,
      dailyOpen: fmp.dailyOpen ?? null,
      dailyRange: fmp.dailyRange ?? null,
      dailyRangePercent: fmp.dailyRangePercent ?? null,
      previousClose: fmp.previousClose ?? null,
      volume: fmp.volume ?? null,
      bid: av.bid ?? null,
      ask: av.ask ?? null,
      spread: av.spread ?? null,
      spreadPips: av.spreadPips ?? null,
      // Technical: prefer AV, fallback FMP
      rsi14: av.rsi14 ?? fmp.rsi14 ?? null,
      atr14: av.atr14 ?? null,
      atrPercent: null,
      sma20: av.sma20 ?? null,
      sma50: av.sma50 ?? fmp.sma50 ?? null,
      sma200: av.sma200 ?? fmp.sma200 ?? null,
      ema9: av.ema9 ?? null,
      ema20: av.ema20 ?? null,
      ema50: fmp.ema50 ?? null,
      macdValue: av.macdValue ?? null,
      macdSignal: av.macdSignal ?? null,
      macdHistogram: av.macdHistogram ?? null,
      stochK: av.stochK ?? null,
      stochD: av.stochD ?? null,
      williamsR: av.williamsR ?? null,
      adx14: av.adx14 ?? null,
      bollingerUpper: av.bollingerUpper ?? null,
      bollingerMiddle: av.bollingerMiddle ?? null,
      bollingerLower: av.bollingerLower ?? null,
      bollingerWidth: av.bollingerWidth ?? null,
      smaSignal: null,
      emaSignal: null,
      momentum: null,
      volatility: null,
      trendStrength: null,
      overallSignal: null,
      newsSentiment: ma.newsSentiment ?? null,
      newsSentimentLabel: ma.newsSentimentLabel ?? null,
      newsHeadlines: ma.newsHeadlines ?? [],
      upcomingEvents: fh.upcomingEvents ?? [],
      sources,
      timestamp: Date.now(),
    };

    deriveIndicators(merged);

    cache.set(cacheKey, { data: merged, ts: Date.now() });

    console.log(`[signal-market-data] ${symbol}: sources=[${sources.join(', ')}], price=${merged.price}, rsi=${merged.rsi14}, atr=${merged.atr14}, stochK=${merged.stochK}, adx=${merged.adx14}, bb=${merged.bollingerMiddle}, sentiment=${merged.newsSentiment}, events=${merged.upcomingEvents.length}, signal=${merged.overallSignal}`);

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
