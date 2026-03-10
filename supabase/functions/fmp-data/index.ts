import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FMP_BASE = 'https://financialmodelingprep.com/stable';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function logUsage(fn: string, provider: string, status: number, latencyMs: number, meta?: Record<string, unknown>) {
  try {
    await supabaseAdmin.from('api_usage_logs').insert({
      function_name: fn,
      provider,
      response_status: status,
      latency_ms: latencyMs,
      metadata: meta || {},
    });
  } catch { /* fire-and-forget */ }
}

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
      case 'profile':
        url = `${FMP_BASE}/profile?symbol=${symbol}&apikey=${apiKey}`;
        break;
      case 'quote':
        url = `${FMP_BASE}/quote?symbol=${symbol}&apikey=${apiKey}`;
        break;
      case 'batch-quote':
        url = `${FMP_BASE}/batch-quote?symbols=${symbols}&apikey=${apiKey}`;
        break;
      case 'historical': {
        const params = new URLSearchParams({ symbol, apikey: apiKey });
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        url = `${FMP_BASE}/historical-price-eod/full?${params}`;
        break;
      }
      case 'intraday': {
        const intv = interval || '1hour';
        const params = new URLSearchParams({ symbol, apikey: apiKey });
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        url = `${FMP_BASE}/historical-chart/${intv}?${params}`;
        break;
      }
      case 'forex-list':
        url = `${FMP_BASE}/forex-list?apikey=${apiKey}`;
        break;
      case 'forex-quote':
        url = `${FMP_BASE}/forex-quote?symbol=${symbol}&apikey=${apiKey}`;
        break;
      case 'forex-historical': {
        const params = new URLSearchParams({ symbol, apikey: apiKey });
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        url = `${FMP_BASE}/forex-historical-price-eod/full?${params}`;
        break;
      }
      case 'forex-intraday': {
        const intv = interval || '1hour';
        const params = new URLSearchParams({ symbol, apikey: apiKey });
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        url = `${FMP_BASE}/forex-historical-chart/${intv}?${params}`;
        break;
      }
      case 'crypto-list':
        url = `${FMP_BASE}/crypto-list?apikey=${apiKey}`;
        break;
      case 'crypto-quote':
        url = `${FMP_BASE}/crypto-quote?symbol=${symbol}&apikey=${apiKey}`;
        break;
      case 'crypto-historical': {
        const params = new URLSearchParams({ symbol, apikey: apiKey });
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        url = `${FMP_BASE}/crypto-historical-price-eod/full?${params}`;
        break;
      }
      case 'crypto-intraday': {
        const intv = interval || '1hour';
        const params = new URLSearchParams({ symbol, apikey: apiKey });
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        url = `${FMP_BASE}/crypto-historical-chart/${intv}?${params}`;
        break;
      }
      case 'search':
        url = `${FMP_BASE}/search-symbol?query=${symbol}&limit=${limit || 20}&apikey=${apiKey}`;
        break;
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
      case 'economic-calendar': {
        const params = new URLSearchParams({ apikey: apiKey });
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        url = `${FMP_BASE}/economic-calendar?${params}`;
        break;
      }
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
    const t0 = Date.now();
    const response = await fetch(url);
    const latency = Date.now() - t0;

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[fmp-data] FMP error ${response.status}:`, errorText.slice(0, 300));
      logUsage('fmp-data', 'fmp', response.status, latency, { action, symbol: symbol || symbols || '' });
      return new Response(
        JSON.stringify({ error: `FMP API error: ${response.status}`, details: errorText.slice(0, 200) }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    cache.set(cacheKey, { data, ts: Date.now() });
    logUsage('fmp-data', 'fmp', 200, latency, { action, symbol: symbol || symbols || '' });

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
