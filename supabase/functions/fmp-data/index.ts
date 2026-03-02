import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FMP_BASE = 'https://financialmodelingprep.com/stable';

// In-memory cache (5 min TTL)
const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

function getCached(key: string): any | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  cache.delete(key);
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get('FMP_API_KEY');
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'FMP_API_KEY not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json();
    const { action, symbol, symbols, interval, from, to, limit } = body;

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Action is required. Options: profile, quote, batch-quote, historical, forex-list, forex-quote, forex-historical, crypto-list, crypto-quote, crypto-historical, search' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let url: string;
    const cacheKey = JSON.stringify({ action, symbol, symbols, interval, from, to, limit });
    const cached = getCached(cacheKey);
    if (cached) {
      console.log(`[fmp-data] Cache hit: ${action} ${symbol || symbols || ''}`);
      return new Response(JSON.stringify(cached), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' }
      });
    }

    switch (action) {
      // ---- Company Profile ----
      case 'profile':
        url = `${FMP_BASE}/profile?symbol=${symbol}&apikey=${apiKey}`;
        break;

      // ---- Single Quote ----
      case 'quote':
        url = `${FMP_BASE}/quote?symbol=${symbol}&apikey=${apiKey}`;
        break;

      // ---- Batch Quotes ----
      case 'batch-quote':
        url = `${FMP_BASE}/batch-quote?symbols=${symbols}&apikey=${apiKey}`;
        break;

      // ---- Historical Stock Price (EOD) ----
      case 'historical': {
        const params = new URLSearchParams({ symbol, apikey: apiKey });
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        url = `${FMP_BASE}/historical-price-eod/full?${params}`;
        break;
      }

      // ---- Intraday Historical ----
      case 'intraday': {
        const intv = interval || '1hour';
        const params = new URLSearchParams({ symbol, apikey: apiKey });
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        url = `${FMP_BASE}/historical-chart/${intv}?${params}`;
        break;
      }

      // ---- Forex List ----
      case 'forex-list':
        url = `${FMP_BASE}/forex-list?apikey=${apiKey}`;
        break;

      // ---- Forex Quote ----
      case 'forex-quote':
        url = `${FMP_BASE}/forex-quote?symbol=${symbol}&apikey=${apiKey}`;
        break;

      // ---- Forex Historical ----
      case 'forex-historical': {
        const params = new URLSearchParams({ symbol, apikey: apiKey });
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        url = `${FMP_BASE}/forex-historical-price-eod/full?${params}`;
        break;
      }

      // ---- Forex Intraday ----
      case 'forex-intraday': {
        const intv = interval || '1hour';
        const params = new URLSearchParams({ symbol, apikey: apiKey });
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        url = `${FMP_BASE}/forex-historical-chart/${intv}?${params}`;
        break;
      }

      // ---- Crypto List ----
      case 'crypto-list':
        url = `${FMP_BASE}/crypto-list?apikey=${apiKey}`;
        break;

      // ---- Crypto Quote ----
      case 'crypto-quote':
        url = `${FMP_BASE}/crypto-quote?symbol=${symbol}&apikey=${apiKey}`;
        break;

      // ---- Crypto Historical ----
      case 'crypto-historical': {
        const params = new URLSearchParams({ symbol, apikey: apiKey });
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        url = `${FMP_BASE}/crypto-historical-price-eod/full?${params}`;
        break;
      }

      // ---- Crypto Intraday ----
      case 'crypto-intraday': {
        const intv = interval || '1hour';
        const params = new URLSearchParams({ symbol, apikey: apiKey });
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        url = `${FMP_BASE}/crypto-historical-chart/${intv}?${params}`;
        break;
      }

      // ---- Search symbol ----
      case 'search':
        url = `${FMP_BASE}/search-symbol?query=${symbol}&limit=${limit || 20}&apikey=${apiKey}`;
        break;

      // ---- Company Screener ----
      case 'screener': {
        const params = new URLSearchParams({ apikey: apiKey });
        if (body.marketCapMoreThan) params.set('marketCapMoreThan', body.marketCapMoreThan);
        if (body.marketCapLowerThan) params.set('marketCapLowerThan', body.marketCapLowerThan);
        if (body.sector) params.set('sector', body.sector);
        if (body.exchange) params.set('exchange', body.exchange);
        if (body.country) params.set('country', body.country);
        if (limit) params.set('limit', String(limit));
        url = `${FMP_BASE}/company-screener?${params}`;
        break;
      }

      // ---- Economic Calendar ----
      case 'economic-calendar': {
        const params = new URLSearchParams({ apikey: apiKey });
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        url = `${FMP_BASE}/economic-calendar?${params}`;
        break;
      }

      // ---- Financial Statements ----
      case 'income-statement':
        url = `${FMP_BASE}/income-statement?symbol=${symbol}&limit=${limit || 5}&apikey=${apiKey}`;
        break;
      case 'balance-sheet':
        url = `${FMP_BASE}/balance-sheet-statement?symbol=${symbol}&limit=${limit || 5}&apikey=${apiKey}`;
        break;
      case 'cash-flow':
        url = `${FMP_BASE}/cash-flow-statement?symbol=${symbol}&limit=${limit || 5}&apikey=${apiKey}`;
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log(`[fmp-data] Fetching: ${action} ${symbol || symbols || ''}`);
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[fmp-data] FMP error ${response.status}:`, errorText.slice(0, 300));
      return new Response(
        JSON.stringify({ error: `FMP API error: ${response.status}`, details: errorText.slice(0, 200) }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    cache.set(cacheKey, { data, ts: Date.now() });

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' }
    });

  } catch (error) {
    console.error('[fmp-data] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
