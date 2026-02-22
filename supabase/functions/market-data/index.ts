import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TWELVE_DATA_API_KEY = Deno.env.get('TWELVE_DATA_API_KEY');

// Simple in-memory cache with TTL
interface CacheEntry {
  data: unknown;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

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
  
  console.log(`Cache HIT for: ${key}`);
  return entry.data;
}

function setCache(key: string, data: unknown): void {
  // Limit cache size to prevent memory issues
  if (cache.size > 100) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }
  cache.set(key, { data, timestamp: Date.now() });
  console.log(`Cache SET for: ${key}`);
}

interface TimeSeriesData {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume?: string;
}

interface IndicatorData {
  datetime: string;
  [key: string]: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { symbol, interval = '4h', indicator, outputsize = 50 } = body;
    
    // Validate required parameters
    if (!symbol || typeof symbol !== 'string') {
      console.error('Invalid or missing symbol:', symbol);
      return new Response(JSON.stringify({
        error: 'Symbol parameter is required',
        status: 'error'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Normalize symbol for Twelve Data
    // Accept formats like: "EUR/USD", "EURUSD", "EUR-USD", "EUR_USD"
    const rawSymbol = symbol.trim().toUpperCase();
    let formattedSymbol = rawSymbol.replace(/\s+/g, "");
    formattedSymbol = formattedSymbol.replace(/[-_]/g, "/");

    // If user provides a 6-letter pair (e.g. EURUSD), convert to EUR/USD
    if (/^[A-Z]{6}$/.test(formattedSymbol)) {
      formattedSymbol = `${formattedSymbol.slice(0, 3)}/${formattedSymbol.slice(3)}`;
    }

    if (!formattedSymbol) {
      console.error('Empty symbol after formatting');
      return new Response(JSON.stringify({
        error: 'Invalid symbol format',
        status: 'error'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check cache first
    const cacheKey = getCacheKey(formattedSymbol, interval, indicator);
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      return new Response(JSON.stringify({
        ...cachedData as object,
        cached: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const encodedSymbol = encodeURIComponent(formattedSymbol);

    console.log(`Fetching data for ${formattedSymbol} with interval ${interval}, indicator: ${indicator || 'price'}`);

    if (!TWELVE_DATA_API_KEY) {
      console.error('TWELVE_DATA_API_KEY not configured');
      throw new Error('API key not configured');
    }

    const baseUrl = 'https://api.twelvedata.com';
    let url: string;
    const size = outputsize;

    if (indicator === 'rsi') {
      url = `${baseUrl}/rsi?symbol=${encodedSymbol}&interval=${interval}&time_period=14&outputsize=${size}&apikey=${TWELVE_DATA_API_KEY}`;
    } else if (indicator === 'macd') {
      url = `${baseUrl}/macd?symbol=${encodedSymbol}&interval=${interval}&outputsize=${size}&apikey=${TWELVE_DATA_API_KEY}`;
    } else if (indicator === 'sma') {
      // Fetch multiple SMAs
      const sma20Url = `${baseUrl}/sma?symbol=${encodedSymbol}&interval=${interval}&time_period=20&outputsize=${size}&apikey=${TWELVE_DATA_API_KEY}`;
      const sma50Url = `${baseUrl}/sma?symbol=${encodedSymbol}&interval=${interval}&time_period=50&outputsize=${size}&apikey=${TWELVE_DATA_API_KEY}`;

      console.log('Fetching SMA 20 and SMA 50...');

      const [sma20Response, sma50Response] = await Promise.all([
        fetch(sma20Url),
        fetch(sma50Url)
      ]);

      const sma20Data = await sma20Response.json();
      const sma50Data = await sma50Response.json();

      console.log('SMA 20 response status:', sma20Data.status);
      console.log('SMA 50 response status:', sma50Data.status);

      if (sma20Data.status === 'error' || sma50Data.status === 'error') {
        const smaMsg = sma20Data.message || sma50Data.message || 'Error fetching SMA data';
        if (smaMsg.includes('subscription') || smaMsg.includes('billing') || smaMsg.includes('expired')) {
          return new Response(JSON.stringify({
            error: 'api_subscription_expired',
            message: 'La suscripción de datos de mercado ha expirado. Contacta al administrador para renovar el acceso.',
            status: 'error',
            retryable: false,
          }), {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        throw new Error(smaMsg);
      }

      const smaResult = {
        sma20: sma20Data.values || [],
        sma50: sma50Data.values || [],
        symbol: formattedSymbol
      };
      
      setCache(cacheKey, smaResult);

      return new Response(JSON.stringify(smaResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Default: fetch time series (price data)
      url = `${baseUrl}/time_series?symbol=${encodedSymbol}&interval=${interval}&outputsize=${size}&apikey=${TWELVE_DATA_API_KEY}`;
    }

    console.log('Fetching from URL:', url.replace(TWELVE_DATA_API_KEY!, '***'));
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('API Response status:', data.status);
    
    if (data.status === 'error') {
      console.error('Twelve Data API error:', data.message);
      const msg = data.message || 'Error fetching market data';
      // Detect subscription/billing issues
      if (msg.includes('subscription') || msg.includes('billing') || msg.includes('expired') || msg.includes('API credits') || msg.includes('rate limit')) {
        return new Response(JSON.stringify({
          error: 'api_subscription_expired',
          message: 'La suscripción de datos de mercado ha expirado. Contacta al administrador para renovar el acceso.',
          status: 'error',
          retryable: false,
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(msg);
    }
    
    const result = {
      ...data,
      symbol: formattedSymbol
    };
    
    setCache(cacheKey, result);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in market-data function:', errorMessage);
    return new Response(JSON.stringify({ 
      error: errorMessage,
      status: 'error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});