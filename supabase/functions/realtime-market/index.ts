import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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

const AV_BASE = 'https://www.alphavantage.co/query';
const FINNHUB_BASE = 'https://finnhub.io/api/v1';
const YAHOO_CHART_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';

// ─── Symbol helpers ───

function parseForexPair(symbol: string): { base: string; quote: string } | null {
  let s = symbol;
  if (s.startsWith('C:')) s = s.slice(2);
  if (s.includes('/')) {
    const [base, quote] = s.split('/');
    return { base, quote };
  }
  if (s.length === 6 && /^[A-Z]+$/.test(s)) {
    return { base: s.slice(0, 3), quote: s.slice(3) };
  }
  return null;
}

function mapToYahooSymbol(symbol: string) {
  const pair = parseForexPair(symbol);
  if (pair) return `${pair.base}${pair.quote}=X`;
  if (symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('USDT')) {
    return symbol.replace('/', '-');
  }
  return symbol;
}

// ─── Finnhub: real-time forex quote ───

async function fetchFinnhubQuote(base: string, quote: string): Promise<{ price: number; bid: number; ask: number } | null> {
  const FINNHUB_API_KEY = Deno.env.get('FINNHUB_API_KEY');
  if (!FINNHUB_API_KEY) return null;

  // Finnhub uses OANDA format: OANDA:EUR_USD
  const finnhubSymbol = `OANDA:${base}_${quote}`;
  const url = `${FINNHUB_BASE}/quote?symbol=${encodeURIComponent(finnhubSymbol)}&token=${FINNHUB_API_KEY}`;

  const t0 = Date.now();
  try {
    const res = await fetch(url);
    const latency = Date.now() - t0;
    if (!res.ok) {
      logUsage('realtime-market', 'finnhub', res.status, latency, { symbol: `${base}/${quote}`, type: 'quote' });
      return null;
    }
    const data = await res.json();
    logUsage('realtime-market', 'finnhub', 200, latency, { symbol: `${base}/${quote}`, type: 'quote' });

    // Finnhub returns: c (current), h (high), l (low), o (open), pc (previous close)
    if (data?.c && data.c > 0) {
      const price = data.c;
      // Estimate bid/ask from current price
      const isJPY = base === 'JPY' || quote === 'JPY';
      const halfSpread = isJPY ? 0.01 : 0.00008;
      return { price, bid: price - halfSpread, ask: price + halfSpread };
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Alpha Vantage: real-time forex rate ───

async function fetchAVForexRate(base: string, quote: string): Promise<{ price: number; bid: number; ask: number } | null> {
  const AV_KEY = Deno.env.get('ALPHA_VANTAGE_API_KEY');
  if (!AV_KEY) return null;

  const url = `${AV_BASE}?function=CURRENCY_EXCHANGE_RATE&from_currency=${base}&to_currency=${quote}&apikey=${AV_KEY}`;
  const t0 = Date.now();
  try {
    const res = await fetch(url);
    const latency = Date.now() - t0;
    if (!res.ok) {
      logUsage('realtime-market', 'alpha_vantage', res.status, latency, { symbol: `${base}/${quote}`, type: 'quote' });
      return null;
    }
    const data = await res.json();
    logUsage('realtime-market', 'alpha_vantage', 200, latency, { symbol: `${base}/${quote}`, type: 'quote' });

    if (data['Note'] || data['Information']) return null; // rate limited

    const rate = data?.['Realtime Currency Exchange Rate'];
    if (rate) {
      const price = parseFloat(rate['5. Exchange Rate']);
      const bid = parseFloat(rate['8. Bid Price']) || price;
      const ask = parseFloat(rate['9. Ask Price']) || price;
      if (price > 0) return { price, bid, ask };
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Alpha Vantage: daily aggregates (prev day) ───

async function fetchAVDailyAggregates(base: string, quote: string): Promise<{ volume: number; open: number; high: number; low: number; close: number; timestamp: number } | null> {
  const AV_KEY = Deno.env.get('ALPHA_VANTAGE_API_KEY');
  if (!AV_KEY) return null;

  const url = `${AV_BASE}?function=FX_DAILY&from_symbol=${base}&to_symbol=${quote}&outputsize=compact&apikey=${AV_KEY}`;
  const t0 = Date.now();
  try {
    const res = await fetch(url);
    const latency = Date.now() - t0;
    if (!res.ok) {
      logUsage('realtime-market', 'alpha_vantage', res.status, latency, { symbol: `${base}/${quote}`, type: 'aggregates' });
      return null;
    }
    const data = await res.json();
    logUsage('realtime-market', 'alpha_vantage', 200, latency, { symbol: `${base}/${quote}`, type: 'aggregates' });

    if (data['Note'] || data['Information']) return null;

    const timeSeries = data['Time Series FX (Daily)'];
    if (!timeSeries) return null;

    const dates = Object.keys(timeSeries).sort().reverse();
    if (dates.length === 0) return null;

    const latest = timeSeries[dates[0]];
    return {
      open: parseFloat(latest['1. open']),
      high: parseFloat(latest['2. high']),
      low: parseFloat(latest['3. low']),
      close: parseFloat(latest['4. close']),
      volume: 0, // AV FX_DAILY doesn't provide volume
      timestamp: new Date(dates[0]).getTime(),
    };
  } catch {
    return null;
  }
}

// ─── Alpha Vantage: daily range (multiple days) ───

async function fetchAVDailyRange(base: string, quote: string, fromDate: string, toDate: string): Promise<any[] | null> {
  const AV_KEY = Deno.env.get('ALPHA_VANTAGE_API_KEY');
  if (!AV_KEY) return null;

  const url = `${AV_BASE}?function=FX_DAILY&from_symbol=${base}&to_symbol=${quote}&outputsize=compact&apikey=${AV_KEY}`;
  const t0 = Date.now();
  try {
    const res = await fetch(url);
    const latency = Date.now() - t0;
    if (!res.ok) {
      logUsage('realtime-market', 'alpha_vantage', res.status, latency, { symbol: `${base}/${quote}`, type: 'range' });
      return null;
    }
    const data = await res.json();
    logUsage('realtime-market', 'alpha_vantage', 200, latency, { symbol: `${base}/${quote}`, type: 'range' });

    if (data['Note'] || data['Information']) return null;

    const timeSeries = data['Time Series FX (Daily)'];
    if (!timeSeries) return null;

    const fromTs = new Date(fromDate).getTime();
    const toTs = new Date(toDate).getTime() + 86400000; // include toDate

    const results = Object.keys(timeSeries)
      .filter(dateStr => {
        const ts = new Date(dateStr).getTime();
        return ts >= fromTs && ts <= toTs;
      })
      .sort()
      .map(dateStr => {
        const d = timeSeries[dateStr];
        return {
          o: parseFloat(d['1. open']),
          h: parseFloat(d['2. high']),
          l: parseFloat(d['3. low']),
          c: parseFloat(d['4. close']),
          v: 0,
          t: new Date(dateStr).getTime(),
          T: `C:${base}${quote}`,
        };
      });

    return results.length > 0 ? results : null;
  } catch {
    return null;
  }
}

// ─── Finnhub: candles for aggregates/range ───

async function fetchFinnhubCandles(base: string, quote: string, fromTs: number, toTs: number): Promise<any[] | null> {
  const FINNHUB_API_KEY = Deno.env.get('FINNHUB_API_KEY');
  if (!FINNHUB_API_KEY) return null;

  const finnhubSymbol = `OANDA:${base}_${quote}`;
  const url = `${FINNHUB_BASE}/forex/candle?symbol=${encodeURIComponent(finnhubSymbol)}&resolution=D&from=${Math.floor(fromTs / 1000)}&to=${Math.floor(toTs / 1000)}&token=${FINNHUB_API_KEY}`;

  const t0 = Date.now();
  try {
    const res = await fetch(url);
    const latency = Date.now() - t0;
    if (!res.ok) {
      logUsage('realtime-market', 'finnhub', res.status, latency, { symbol: `${base}/${quote}`, type: 'candles' });
      return null;
    }
    const data = await res.json();
    logUsage('realtime-market', 'finnhub', 200, latency, { symbol: `${base}/${quote}`, type: 'candles' });

    if (data.s !== 'ok' || !data.t?.length) return null;

    return data.t.map((t: number, i: number) => ({
      o: data.o[i],
      h: data.h[i],
      l: data.l[i],
      c: data.c[i],
      v: data.v?.[i] || 0,
      t: t * 1000,
      T: `C:${base}${quote}`,
    }));
  } catch {
    return null;
  }
}

// ─── Yahoo Finance fallback ───

async function fetchYahooPrice(symbol: string) {
  const pair = parseForexPair(symbol);
  const yahooSymbol = pair ? `${pair.base}${pair.quote}=X` : mapToYahooSymbol(symbol);
  const yahooUrl = `${YAHOO_CHART_URL}/${encodeURIComponent(yahooSymbol)}?interval=1m&range=1d`;

  const t0 = Date.now();
  const yahooResponse = await fetch(yahooUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; LovableCloud/1.0)',
      'Accept': 'application/json',
    },
  });
  const latency = Date.now() - t0;

  if (yahooResponse.ok) {
    const yahooData = await yahooResponse.json();
    const chartResult = yahooData?.chart?.result?.[0];
    const regularMarketPrice = chartResult?.meta?.regularMarketPrice;

    logUsage('realtime-market', 'yahoo_finance', 200, latency, { symbol, fallback: true });

    if (typeof regularMarketPrice === 'number') {
      return { provider: 'yahoo', symbol: pair ? `${pair.base}/${pair.quote}` : symbol, price: regularMarketPrice, timestamp: Date.now() };
    }
  } else {
    logUsage('realtime-market', 'yahoo_finance', yahooResponse.status, latency, { symbol, fallback: true });
  }

  throw new Error('Yahoo Finance returned no usable price');
}

// ─── Main handler ───

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Skip WebSocket upgrades - not supported with Finnhub/AV approach
  const upgradeHeader = req.headers.get('upgrade') || '';
  if (upgradeHeader.toLowerCase() === 'websocket') {
    return new Response(JSON.stringify({ error: 'WebSocket not supported. Use REST polling.' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const rawSymbol = body.symbol || '';
    const type = body.type || 'quote';
    const from = body.from || '';
    const to = body.to || '';

    const pair = parseForexPair(rawSymbol);

    // ─── QUOTE ───
    if (type === 'quote') {
      if (!pair) {
        return new Response(JSON.stringify({ error: 'Invalid forex symbol' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 1) Finnhub
      const finnhub = await fetchFinnhubQuote(pair.base, pair.quote);
      if (finnhub) {
        return new Response(JSON.stringify({
          provider: 'finnhub',
          symbol: `${pair.base}/${pair.quote}`,
          price: finnhub.price,
          bid: finnhub.bid,
          ask: finnhub.ask,
          timestamp: Date.now(),
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // 2) Alpha Vantage
      const av = await fetchAVForexRate(pair.base, pair.quote);
      if (av) {
        return new Response(JSON.stringify({
          provider: 'alpha_vantage',
          symbol: `${pair.base}/${pair.quote}`,
          price: av.price,
          bid: av.bid,
          ask: av.ask,
          timestamp: Date.now(),
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // 3) Yahoo fallback
      try {
        const yahoo = await fetchYahooPrice(rawSymbol);
        return new Response(JSON.stringify(yahoo), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch {
        return new Response(JSON.stringify({ error: 'All quote providers failed' }), {
          status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // ─── AGGREGATES (prev day) ───
    if (type === 'aggregates') {
      if (!pair) {
        return new Response(JSON.stringify({ error: 'Invalid forex symbol' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 1) Finnhub candles (last 2 days to get prev day)
      const now = Date.now();
      const twoDaysAgo = now - 3 * 86400000;
      const finnhubCandles = await fetchFinnhubCandles(pair.base, pair.quote, twoDaysAgo, now);
      if (finnhubCandles && finnhubCandles.length > 0) {
        const latest = finnhubCandles[finnhubCandles.length - 1];
        return new Response(JSON.stringify({
          ticker: `C:${pair.base}${pair.quote}`,
          queryCount: 1,
          resultsCount: 1,
          adjusted: true,
          results: [{
            T: latest.T,
            v: latest.v,
            vw: (latest.h + latest.l) / 2,
            o: latest.o,
            c: latest.c,
            h: latest.h,
            l: latest.l,
            t: latest.t,
            n: latest.v,
          }],
          status: 'OK',
          request_id: crypto.randomUUID(),
          count: 1,
          provider: 'finnhub',
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // 2) Alpha Vantage daily
      const avAgg = await fetchAVDailyAggregates(pair.base, pair.quote);
      if (avAgg) {
        return new Response(JSON.stringify({
          ticker: `C:${pair.base}${pair.quote}`,
          queryCount: 1,
          resultsCount: 1,
          adjusted: true,
          results: [{
            T: `C:${pair.base}${pair.quote}`,
            v: avAgg.volume,
            vw: (avAgg.high + avAgg.low) / 2,
            o: avAgg.open,
            c: avAgg.close,
            h: avAgg.high,
            l: avAgg.low,
            t: avAgg.timestamp,
            n: 0,
          }],
          status: 'OK',
          request_id: crypto.randomUUID(),
          count: 1,
          provider: 'alpha_vantage',
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      return new Response(JSON.stringify({ error: 'All aggregate providers failed', status: 'ERROR' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── RANGE (historical days) ───
    if (type === 'range') {
      if (!pair || !from || !to) {
        return new Response(JSON.stringify({ error: 'Invalid params for range query' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const fromTs = new Date(from).getTime();
      const toTs = new Date(to).getTime() + 86400000;

      // 1) Finnhub candles
      const finnhubRange = await fetchFinnhubCandles(pair.base, pair.quote, fromTs, toTs);
      if (finnhubRange && finnhubRange.length > 0) {
        return new Response(JSON.stringify({
          ticker: `C:${pair.base}${pair.quote}`,
          queryCount: finnhubRange.length,
          resultsCount: finnhubRange.length,
          adjusted: true,
          results: finnhubRange.map(r => ({
            T: r.T,
            v: r.v,
            vw: (r.h + r.l) / 2,
            o: r.o,
            c: r.c,
            h: r.h,
            l: r.l,
            t: r.t,
            n: r.v,
          })),
          status: 'OK',
          request_id: crypto.randomUUID(),
          count: finnhubRange.length,
          provider: 'finnhub',
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // 2) Alpha Vantage daily range
      const avRange = await fetchAVDailyRange(pair.base, pair.quote, from, to);
      if (avRange && avRange.length > 0) {
        return new Response(JSON.stringify({
          ticker: `C:${pair.base}${pair.quote}`,
          queryCount: avRange.length,
          resultsCount: avRange.length,
          adjusted: true,
          results: avRange.map(r => ({
            T: r.T,
            v: r.v,
            vw: (r.h + r.l) / 2,
            o: r.o,
            c: r.c,
            h: r.h,
            l: r.l,
            t: r.t,
            n: 0,
          })),
          status: 'OK',
          request_id: crypto.randomUUID(),
          count: avRange.length,
          provider: 'alpha_vantage',
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      return new Response(JSON.stringify({ error: 'All range providers failed', status: 'ERROR' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: `Unknown type: ${type}` }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in realtime-market:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
