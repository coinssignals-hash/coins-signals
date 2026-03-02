import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const AV_BASE = 'https://www.alphavantage.co/query';

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

  const apiKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'ALPHA_VANTAGE_API_KEY not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json();
    const { action, symbol, symbols, interval, from_currency, to_currency, time_period, series_type, tickers, topics, sort, limit } = body;

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Action required. Options: news-sentiment, forex-rate, forex-intraday, forex-daily, crypto-rate, crypto-daily, time-series-intraday, time-series-daily, overview, income-statement, balance-sheet, cash-flow, earnings, rsi, macd, sma, ema, bbands, stoch, adx, atr' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cacheKey = JSON.stringify(body);
    const cached = getCached(cacheKey);
    if (cached) {
      console.log(`[alpha-vantage] Cache hit: ${action}`);
      return new Response(JSON.stringify(cached), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' }
      });
    }

    let url: string;
    const params = new URLSearchParams({ apikey: apiKey });

    switch (action) {
      // ---- NEWS SENTIMENT ----
      case 'news-sentiment':
        params.set('function', 'NEWS_SENTIMENT');
        if (tickers) params.set('tickers', tickers);
        if (topics) params.set('topics', topics);
        if (sort) params.set('sort', sort);
        if (limit) params.set('limit', String(limit));
        url = `${AV_BASE}?${params}`;
        break;

      // ---- FOREX ----
      case 'forex-rate':
        params.set('function', 'CURRENCY_EXCHANGE_RATE');
        params.set('from_currency', from_currency || symbol?.split('/')?.[0] || 'EUR');
        params.set('to_currency', to_currency || symbol?.split('/')?.[1] || 'USD');
        url = `${AV_BASE}?${params}`;
        break;

      case 'forex-intraday':
        params.set('function', 'FX_INTRADAY');
        params.set('from_symbol', from_currency || symbol?.split('/')?.[0] || 'EUR');
        params.set('to_symbol', to_currency || symbol?.split('/')?.[1] || 'USD');
        params.set('interval', interval || '60min');
        params.set('outputsize', 'compact');
        url = `${AV_BASE}?${params}`;
        break;

      case 'forex-daily':
        params.set('function', 'FX_DAILY');
        params.set('from_symbol', from_currency || symbol?.split('/')?.[0] || 'EUR');
        params.set('to_symbol', to_currency || symbol?.split('/')?.[1] || 'USD');
        params.set('outputsize', 'compact');
        url = `${AV_BASE}?${params}`;
        break;

      // ---- CRYPTO ----
      case 'crypto-rate':
        params.set('function', 'CURRENCY_EXCHANGE_RATE');
        params.set('from_currency', from_currency || 'BTC');
        params.set('to_currency', to_currency || 'USD');
        url = `${AV_BASE}?${params}`;
        break;

      case 'crypto-daily':
        params.set('function', 'DIGITAL_CURRENCY_DAILY');
        params.set('symbol', symbol || 'BTC');
        params.set('market', to_currency || 'USD');
        url = `${AV_BASE}?${params}`;
        break;

      // ---- STOCKS TIME SERIES ----
      case 'time-series-intraday':
        params.set('function', 'TIME_SERIES_INTRADAY');
        params.set('symbol', symbol);
        params.set('interval', interval || '60min');
        params.set('outputsize', 'compact');
        url = `${AV_BASE}?${params}`;
        break;

      case 'time-series-daily':
        params.set('function', 'TIME_SERIES_DAILY');
        params.set('symbol', symbol);
        params.set('outputsize', 'compact');
        url = `${AV_BASE}?${params}`;
        break;

      // ---- FUNDAMENTALS ----
      case 'overview':
        params.set('function', 'OVERVIEW');
        params.set('symbol', symbol);
        url = `${AV_BASE}?${params}`;
        break;

      case 'income-statement':
        params.set('function', 'INCOME_STATEMENT');
        params.set('symbol', symbol);
        url = `${AV_BASE}?${params}`;
        break;

      case 'balance-sheet':
        params.set('function', 'BALANCE_SHEET');
        params.set('symbol', symbol);
        url = `${AV_BASE}?${params}`;
        break;

      case 'cash-flow':
        params.set('function', 'CASH_FLOW');
        params.set('symbol', symbol);
        url = `${AV_BASE}?${params}`;
        break;

      case 'earnings':
        params.set('function', 'EARNINGS');
        params.set('symbol', symbol);
        url = `${AV_BASE}?${params}`;
        break;

      // ---- TECHNICAL INDICATORS ----
      case 'rsi':
        params.set('function', 'RSI');
        params.set('symbol', symbol);
        params.set('interval', interval || '60min');
        params.set('time_period', String(time_period || 14));
        params.set('series_type', series_type || 'close');
        url = `${AV_BASE}?${params}`;
        break;

      case 'macd':
        params.set('function', 'MACD');
        params.set('symbol', symbol);
        params.set('interval', interval || '60min');
        params.set('series_type', series_type || 'close');
        url = `${AV_BASE}?${params}`;
        break;

      case 'sma':
        params.set('function', 'SMA');
        params.set('symbol', symbol);
        params.set('interval', interval || '60min');
        params.set('time_period', String(time_period || 20));
        params.set('series_type', series_type || 'close');
        url = `${AV_BASE}?${params}`;
        break;

      case 'ema':
        params.set('function', 'EMA');
        params.set('symbol', symbol);
        params.set('interval', interval || '60min');
        params.set('time_period', String(time_period || 20));
        params.set('series_type', series_type || 'close');
        url = `${AV_BASE}?${params}`;
        break;

      case 'bbands':
        params.set('function', 'BBANDS');
        params.set('symbol', symbol);
        params.set('interval', interval || '60min');
        params.set('time_period', String(time_period || 20));
        params.set('series_type', series_type || 'close');
        url = `${AV_BASE}?${params}`;
        break;

      case 'stoch':
        params.set('function', 'STOCH');
        params.set('symbol', symbol);
        params.set('interval', interval || '60min');
        url = `${AV_BASE}?${params}`;
        break;

      case 'adx':
        params.set('function', 'ADX');
        params.set('symbol', symbol);
        params.set('interval', interval || '60min');
        params.set('time_period', String(time_period || 14));
        url = `${AV_BASE}?${params}`;
        break;

      case 'atr':
        params.set('function', 'ATR');
        params.set('symbol', symbol);
        params.set('interval', interval || '60min');
        params.set('time_period', String(time_period || 14));
        url = `${AV_BASE}?${params}`;
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log(`[alpha-vantage] Fetching: ${action} ${symbol || tickers || ''}`);
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[alpha-vantage] API error ${response.status}:`, errorText.slice(0, 300));
      return new Response(
        JSON.stringify({ error: `Alpha Vantage API error: ${response.status}`, details: errorText.slice(0, 200) }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    // Check for AV rate limit / error messages
    if (data['Note'] || data['Information']) {
      const msg = data['Note'] || data['Information'];
      console.warn(`[alpha-vantage] Rate limit/info: ${msg}`);
      return new Response(
        JSON.stringify({ error: 'rate_limit', message: msg }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (data['Error Message']) {
      return new Response(
        JSON.stringify({ error: data['Error Message'] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    cache.set(cacheKey, { data, ts: Date.now() });

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' }
    });

  } catch (error) {
    console.error('[alpha-vantage] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
