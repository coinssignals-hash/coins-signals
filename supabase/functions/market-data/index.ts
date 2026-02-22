import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const TWELVE_DATA_API_KEY = Deno.env.get('TWELVE_DATA_API_KEY');
const POLYGON_API_KEY = Deno.env.get('POLYGON_API_KEY');
const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');

// Simple in-memory cache with TTL
interface CacheEntry {
  data: unknown;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000;

function getCacheKey(symbol: string, interval: string, indicator?: string): string {
  return `${symbol}:${interval}:${indicator || 'price'}`;
}

function getFromCache(key: string): unknown | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: unknown): void {
  if (cache.size > 100) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }
  cache.set(key, { data, timestamp: Date.now() });
}

// Normalize symbol
function normalizeSymbol(symbol: string): string {
  let formatted = symbol.trim().toUpperCase().replace(/\s+/g, "").replace(/[-_]/g, "/");
  if (/^[A-Z]{6}$/.test(formatted)) {
    formatted = `${formatted.slice(0, 3)}/${formatted.slice(3)}`;
  }
  return formatted;
}

// Convert to Polygon format: EUR/USD -> C:EURUSD
function toPolygonTicker(symbol: string): string {
  return `C:${symbol.replace('/', '')}`;
}

// Map interval to Polygon multiplier/timespan
function toPolygonParams(interval: string): { multiplier: number; timespan: string; daysBack: number } {
  const map: Record<string, { multiplier: number; timespan: string; daysBack: number }> = {
    '5min': { multiplier: 5, timespan: 'minute', daysBack: 1 },
    '15min': { multiplier: 15, timespan: 'minute', daysBack: 3 },
    '30min': { multiplier: 30, timespan: 'minute', daysBack: 5 },
    '1h': { multiplier: 1, timespan: 'hour', daysBack: 14 },
    '4h': { multiplier: 4, timespan: 'hour', daysBack: 60 },
    '1day': { multiplier: 1, timespan: 'day', daysBack: 180 },
    '1week': { multiplier: 1, timespan: 'week', daysBack: 730 },
  };
  return map[interval] || { multiplier: 1, timespan: 'hour', daysBack: 14 };
}

// Calculate RSI
function calculateRSI(prices: number[], period = 14): number[] {
  const rsi: number[] = [];
  if (prices.length < period + 1) return prices.map(() => 50);
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) avgGain += change; else avgLoss += Math.abs(change);
  }
  avgGain /= period; avgLoss /= period;
  for (let i = 0; i < period; i++) rsi.push(50);
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  rsi.push(100 - 100 / (1 + rs));
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    avgGain = (avgGain * (period - 1) + (change > 0 ? change : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (change < 0 ? Math.abs(change) : 0)) / period;
    rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
  }
  return rsi;
}

// Calculate EMA
function calculateEMA(prices: number[], period: number): number[] {
  if (prices.length === 0) return [];
  const k = 2 / (period + 1);
  const ema = [prices.slice(0, Math.min(period, prices.length)).reduce((a, b) => a + b, 0) / Math.min(period, prices.length)];
  for (let i = 1; i < prices.length; i++) {
    ema.push(prices[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
}

// Calculate MACD
function calculateMACD(prices: number[]) {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = calculateEMA(macdLine, 9);
  return macdLine.map((m, i) => ({
    macd: m, signal: signalLine[i] || 0, histogram: m - (signalLine[i] || 0),
  }));
}

// Calculate SMA
function calculateSMA(prices: number[], period: number): number[] {
  return prices.map((_, i) => {
    if (i < period - 1) return 0;
    const slice = prices.slice(i - period + 1, i + 1);
    return slice.reduce((a, b) => a + b, 0) / period;
  });
}

// Fetch OHLC from Polygon.io with automatic fallback to daily
async function fetchPolygonOHLC(symbol: string, interval: string, outputsize: number) {
  if (!POLYGON_API_KEY) throw new Error('POLYGON_API_KEY not configured');
  
  const ticker = toPolygonTicker(symbol);
  
  // Try requested interval first, then fallback to daily
  const attempts = [toPolygonParams(interval)];
  // If intraday, add daily as fallback
  if (!['1day', '1week'].includes(interval)) {
    attempts.push({ multiplier: 1, timespan: 'day', daysBack: 180 });
  }
  
  for (const { multiplier, timespan, daysBack } of attempts) {
    const to = new Date();
    const from = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
    const fromStr = from.toISOString().split('T')[0];
    const toStr = to.toISOString().split('T')[0];
    
    const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/${multiplier}/${timespan}/${fromStr}/${toStr}?adjusted=true&sort=asc&limit=${Math.max(outputsize + 60, 200)}&apiKey=${POLYGON_API_KEY}`;
    
    console.log(`Fetching Polygon.io: ${ticker}, ${multiplier}/${timespan}, ${fromStr} to ${toStr}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      const text = await response.text();
      console.error('Polygon error:', response.status, text);
      continue;
    }
    
    const data = await response.json();
    if (data.status !== 'OK' && data.status !== 'DELAYED') continue;
    
    const results = data.results || [];
    if (results.length < 2) {
      console.log(`Polygon ${multiplier}/${timespan} returned only ${results.length} bars, trying next...`);
      continue;
    }
    
    const values = results.map((bar: any) => ({
      datetime: new Date(bar.t).toISOString().replace('T', ' ').slice(0, 19),
      open: String(bar.o),
      high: String(bar.h),
      low: String(bar.l),
      close: String(bar.c),
      volume: String(bar.v || 0),
    }));
    
    console.log(`Polygon returned ${values.length} bars (${multiplier}/${timespan})`);
    
    return {
      meta: { symbol, interval: `${multiplier}${timespan}`, type: 'Forex' },
      values,
      status: 'ok',
      source: 'polygon',
    };
  }
  
  throw new Error('No data available from Polygon');
}

// Fetch indicator data using Polygon + local calculation
async function fetchPolygonIndicator(symbol: string, interval: string, indicator: string, outputsize: number) {
  // Get price data from Polygon (request more for accurate calculations)
  const priceData = await fetchPolygonOHLC(symbol, interval, Math.max(outputsize + 60, 100));
  const prices = priceData.values.map((v: any) => parseFloat(v.close)).filter((p: number) => p > 0);
  const datetimes = priceData.values.map((v: any) => v.datetime);
  
  if (prices.length < 2) throw new Error('Insufficient Polygon data');

  if (indicator === 'rsi') {
    const rsiValues = calculateRSI(prices);
    const values = datetimes.map((dt: string, i: number) => ({
      datetime: dt,
      rsi: String(rsiValues[i]?.toFixed(4) || '50'),
    })).slice(-outputsize);
    return { values, symbol, source: 'polygon_calculated' };
  }

  if (indicator === 'macd') {
    const macdValues = calculateMACD(prices);
    const values = datetimes.map((dt: string, i: number) => ({
      datetime: dt,
      macd: String(macdValues[i]?.macd.toFixed(6) || '0'),
      macd_signal: String(macdValues[i]?.signal.toFixed(6) || '0'),
      macd_hist: String(macdValues[i]?.histogram.toFixed(6) || '0'),
    })).slice(-outputsize);
    return { values, symbol, source: 'polygon_calculated' };
  }

  if (indicator === 'sma') {
    const sma20 = calculateSMA(prices, 20);
    const sma50 = calculateSMA(prices, 50);
    return {
      sma20: datetimes.map((dt: string, i: number) => ({
        datetime: dt, sma: String(sma20[i]?.toFixed(5) || '0'),
      })).filter((_: any, i: number) => sma20[i] > 0).slice(-outputsize),
      sma50: datetimes.map((dt: string, i: number) => ({
        datetime: dt, sma: String(sma50[i]?.toFixed(5) || '0'),
      })).filter((_: any, i: number) => sma50[i] > 0).slice(-outputsize),
      symbol,
      source: 'polygon_calculated',
    };
  }

  // Default: return price data
  return { ...priceData, values: priceData.values.slice(-outputsize) };
}

// Fetch from Twelve Data
async function fetchTwelveData(formattedSymbol: string, interval: string, indicator: string | undefined, outputsize: number) {
  if (!TWELVE_DATA_API_KEY) throw new Error('TWELVE_DATA_EXPIRED');

  const baseUrl = 'https://api.twelvedata.com';
  const encodedSymbol = encodeURIComponent(formattedSymbol);

  if (indicator === 'sma') {
    const [sma20Resp, sma50Resp] = await Promise.all([
      fetch(`${baseUrl}/sma?symbol=${encodedSymbol}&interval=${interval}&time_period=20&outputsize=${outputsize}&apikey=${TWELVE_DATA_API_KEY}`),
      fetch(`${baseUrl}/sma?symbol=${encodedSymbol}&interval=${interval}&time_period=50&outputsize=${outputsize}&apikey=${TWELVE_DATA_API_KEY}`),
    ]);
    const [sma20Data, sma50Data] = await Promise.all([sma20Resp.json(), sma50Resp.json()]);
    if (sma20Data.status === 'error' || sma50Data.status === 'error') {
      const msg = sma20Data.message || sma50Data.message || '';
      if (msg.includes('subscription') || msg.includes('billing') || msg.includes('expired')) throw new Error('TWELVE_DATA_EXPIRED');
      throw new Error(msg);
    }
    return { sma20: sma20Data.values || [], sma50: sma50Data.values || [], symbol: formattedSymbol };
  }

  let url: string;
  if (indicator === 'rsi') url = `${baseUrl}/rsi?symbol=${encodedSymbol}&interval=${interval}&time_period=14&outputsize=${outputsize}&apikey=${TWELVE_DATA_API_KEY}`;
  else if (indicator === 'macd') url = `${baseUrl}/macd?symbol=${encodedSymbol}&interval=${interval}&outputsize=${outputsize}&apikey=${TWELVE_DATA_API_KEY}`;
  else url = `${baseUrl}/time_series?symbol=${encodedSymbol}&interval=${interval}&outputsize=${outputsize}&apikey=${TWELVE_DATA_API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();
  if (data.status === 'error') {
    const msg = data.message || '';
    if (msg.includes('subscription') || msg.includes('billing') || msg.includes('expired') || msg.includes('API credits')) throw new Error('TWELVE_DATA_EXPIRED');
    throw new Error(msg);
  }
  return { ...data, symbol: formattedSymbol };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { symbol, interval = '4h', indicator, outputsize = 50 } = body;

    if (!symbol || typeof symbol !== 'string') {
      return new Response(JSON.stringify({ error: 'Symbol parameter is required', status: 'error' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const formattedSymbol = normalizeSymbol(symbol);
    if (!formattedSymbol) {
      return new Response(JSON.stringify({ error: 'Invalid symbol format', status: 'error' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check cache
    const cacheKey = getCacheKey(formattedSymbol, interval, indicator);
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      return new Response(JSON.stringify({ ...cachedData as object, cached: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Fetching: ${formattedSymbol}, interval=${interval}, indicator=${indicator || 'price'}`);

    let result: any;

    // Try Twelve Data first, fallback to Polygon.io
    try {
      result = await fetchTwelveData(formattedSymbol, interval, indicator, outputsize);
      result.source = 'twelve_data';
    } catch (tdError: any) {
      if (tdError.message === 'TWELVE_DATA_EXPIRED') {
        console.log('Twelve Data expired, falling back to Polygon.io...');

        if (!POLYGON_API_KEY) {
          return new Response(JSON.stringify({
            error: 'api_subscription_expired',
            message: 'La suscripción de datos de mercado ha expirado.',
            status: 'error', retryable: false,
          }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        try {
          if (indicator) {
            result = await fetchPolygonIndicator(formattedSymbol, interval, indicator, outputsize);
          } else {
            result = await fetchPolygonOHLC(formattedSymbol, interval, outputsize);
          }
          console.log(`Polygon.io fallback successful for ${formattedSymbol} (${indicator || 'price'})`);
        } catch (pgError: any) {
          console.error('Polygon fallback failed:', pgError.message);
          return new Response(JSON.stringify({
            error: 'api_subscription_expired',
            message: 'No se pudieron obtener datos de mercado.',
            status: 'error', retryable: true,
          }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      } else {
        throw tdError;
      }
    }

    setCache(cacheKey, result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in market-data function:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage, status: 'error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
