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
const CACHE_TTL_MS = 30 * 1000; // 30 seconds for symbol search

function getCacheKey(query: string, type: string): string {
  return `search:${query.toLowerCase()}:${type}`;
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
  if (cache.size > 50) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }
  cache.set(key, { data, timestamp: Date.now() });
  console.log(`Cache SET for: ${key}`);
}

interface SymbolResult {
  symbol: string;
  instrument_name: string;
  exchange: string;
  mic_code: string;
  exchange_timezone: string;
  instrument_type: string;
  country: string;
  currency: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, type = 'all' } = await req.json();

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return new Response(JSON.stringify({
        data: [],
        status: 'ok',
        message: 'Query must be at least 2 characters'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!TWELVE_DATA_API_KEY) {
      console.error('TWELVE_DATA_API_KEY not configured');
      throw new Error('API key not configured');
    }

    const trimmedQuery = query.trim();
    
    // Check cache first
    const cacheKey = getCacheKey(trimmedQuery, type);
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      return new Response(JSON.stringify({
        ...(cachedData as object),
        cached: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Build the URL based on type filter
    let outputType = '';
    if (type === 'forex') {
      outputType = '&outputtype=forex';
    } else if (type === 'crypto') {
      outputType = '&outputtype=cryptocurrency';
    } else if (type === 'etf') {
      outputType = '&outputtype=etf';
    }

    const url = `https://api.twelvedata.com/symbol_search?symbol=${encodeURIComponent(trimmedQuery)}${outputType}&show_plan=false&apikey=${TWELVE_DATA_API_KEY}`;

    console.log('Searching symbols for:', trimmedQuery, 'type:', type);

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'error') {
      console.error('Twelve Data API error:', data.message);
      throw new Error(data.message || 'Error searching symbols');
    }

    // Return all instrument types when type is 'all'
    const results: SymbolResult[] = (data.data || [])
      .filter((item: SymbolResult) => {
        if (type === 'all') return true;
        const instrumentType = item.instrument_type?.toLowerCase() || '';
        if (type === 'forex') {
          return instrumentType === 'forex' || instrumentType === 'currency';
        }
        if (type === 'crypto') {
          return instrumentType === 'cryptocurrency' || instrumentType === 'digital currency';
        }
        if (type === 'stock') {
          return instrumentType === 'common stock' || instrumentType === 'equity';
        }
        if (type === 'etf') {
          return instrumentType === 'etf';
        }
        if (type === 'index') {
          return instrumentType === 'index';
        }
        return true;
      })
      .slice(0, 30)
      .map((item: SymbolResult) => ({
        symbol: item.symbol,
        name: item.instrument_name,
        exchange: item.exchange,
        type: item.instrument_type,
        country: item.country,
        currency: item.currency
      }));

    console.log(`Found ${results.length} symbols for query: ${trimmedQuery}`);

    const result = {
      data: results,
      status: 'ok'
    };
    
    setCache(cacheKey, result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in symbol-search function:', errorMessage);
    return new Response(JSON.stringify({
      error: errorMessage,
      status: 'error',
      data: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
