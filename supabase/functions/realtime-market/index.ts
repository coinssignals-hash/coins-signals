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

// Polygon.io WebSocket endpoint
const POLYGON_WS_URL = 'wss://socket.polygon.io';
const YAHOO_CHART_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';

function mapToYahooSymbol(symbol: string) {
  if (symbol.includes('/')) {
    const [base, quote] = symbol.split('/');
    return `${base}${quote}=X`;
  }
  if (symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('USDT')) {
    return symbol.replace('/', '-');
  }
  return symbol;
}

async function fetchYahooPrice(symbol: string) {
  const yahooSymbol = mapToYahooSymbol(symbol);
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
    const previousClose = chartResult?.meta?.previousClose;

    logUsage('realtime-market', 'yahoo_finance', 200, latency, { symbol, fallback: true });

    if (typeof regularMarketPrice === 'number') {
      return { provider: 'yahoo', symbol, price: regularMarketPrice, timestamp: Date.now() };
    }
    if (typeof previousClose === 'number') {
      return { provider: 'yahoo', symbol, results: [{ c: previousClose }], timestamp: Date.now() };
    }
  } else {
    logUsage('realtime-market', 'yahoo_finance', yahooResponse.status, latency, { symbol, fallback: true });
  }

  const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');
  if (!RAPIDAPI_KEY) {
    throw new Error(`Yahoo Finance request failed (${yahooResponse.status}) and RAPIDAPI_KEY is not configured`);
  }

  const rapidUrl = `https://apidojo-yahoo-finance-v1.p.rapidapi.com/market/v2/get-quotes?region=US&symbols=${encodeURIComponent(yahooSymbol)}`;
  const t1 = Date.now();
  const rapidResponse = await fetch(rapidUrl, {
    headers: {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'apidojo-yahoo-finance-v1.p.rapidapi.com',
    },
  });
  const rapidLatency = Date.now() - t1;

  if (!rapidResponse.ok) {
    const rapidErrorText = await rapidResponse.text();
    logUsage('realtime-market', 'rapidapi_yahoo', rapidResponse.status, rapidLatency, { symbol });
    throw new Error(`Yahoo RapidAPI request failed (${rapidResponse.status}): ${rapidErrorText}`);
  }

  const rapidData = await rapidResponse.json();
  const rapidQuote = rapidData?.quoteResponse?.result?.[0];
  const rapidPrice = rapidQuote?.regularMarketPrice;

  logUsage('realtime-market', 'rapidapi_yahoo', 200, rapidLatency, { symbol });

  if (typeof rapidPrice === 'number') {
    return { provider: 'yahoo_rapidapi', symbol, price: rapidPrice, timestamp: Date.now() };
  }

  throw new Error('Yahoo Finance returned no usable price');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { headers } = req;
  const upgradeHeader = headers.get('upgrade') || '';

  // WebSocket upgrade request
  if (upgradeHeader.toLowerCase() === 'websocket') {
    const POLYGON_API_KEY = Deno.env.get('POLYGON_API_KEY');
    if (!POLYGON_API_KEY) {
      return new Response(JSON.stringify({ error: 'POLYGON_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { socket: clientSocket, response } = Deno.upgradeWebSocket(req);
    const polygonSocket = new WebSocket(`${POLYGON_WS_URL}/forex`);

    polygonSocket.onopen = () => {
      console.log('Connected to Polygon.io');
      polygonSocket.send(JSON.stringify({ action: 'auth', params: POLYGON_API_KEY }));
    };

    polygonSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Polygon message:', data);
      if (Array.isArray(data)) {
        for (const msg of data) {
          if (msg.ev === 'status' && msg.status === 'auth_success') {
            console.log('Polygon authenticated');
            clientSocket.send(JSON.stringify({ type: 'connected', status: 'authenticated' }));
          } else if (msg.ev === 'C' || msg.ev === 'CA' || msg.ev === 'CAS') {
            const rawPair = msg.p || '';
            const mappedSymbol = rawPair ? `C:${rawPair}` : rawPair;
            clientSocket.send(JSON.stringify({ type: 'quote', symbol: mappedSymbol, price: msg.c || msg.a, bid: msg.b, ask: msg.a, timestamp: msg.t }));
          } else if (msg.ev === 'XQ') {
            clientSocket.send(JSON.stringify({ type: 'crypto_quote', symbol: msg.pair, price: msg.lp, bid: msg.bp, ask: msg.ap, timestamp: msg.t }));
          } else if (msg.ev === 'T' || msg.ev === 'Q') {
            clientSocket.send(JSON.stringify({ type: 'stock_quote', symbol: msg.sym, price: msg.p || msg.bp, size: msg.s, timestamp: msg.t }));
          }
        }
      }
    };

    polygonSocket.onerror = (error) => {
      console.error('Polygon WebSocket error:', error);
      clientSocket.send(JSON.stringify({ type: 'error', message: 'Polygon connection error' }));
    };

    polygonSocket.onclose = () => {
      console.log('Polygon WebSocket closed');
      clientSocket.send(JSON.stringify({ type: 'disconnected' }));
    };

    clientSocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Client message:', message);
        if (message.action === 'subscribe') {
          const symbols = message.symbols || [];
          const normalized = symbols.map((s: string) => {
            if (s.startsWith('C:')) {
              const clean = s.slice(2);
              return { original: s, normalized: `${clean.slice(0, 3)}/${clean.slice(3)}`, type: 'forex' };
            }
            if (s.includes('/') && !s.includes('BTC') && !s.includes('ETH')) return { original: s, normalized: s, type: 'forex' };
            if (s.includes('BTC') || s.includes('ETH') || s.includes('USDT')) return { original: s, normalized: s, type: 'crypto' };
            return { original: s, normalized: s, type: 'stock' };
          });
          const forexSymbols = normalized.filter((s: any) => s.type === 'forex');
          if (forexSymbols.length > 0) {
            polygonSocket.send(JSON.stringify({ action: 'subscribe', params: forexSymbols.map((s: any) => `C.${s.normalized.replace('/', '')}`).join(',') }));
          }
          const cryptoSymbols = normalized.filter((s: any) => s.type === 'crypto');
          if (cryptoSymbols.length > 0) {
            polygonSocket.send(JSON.stringify({ action: 'subscribe', params: cryptoSymbols.map((s: any) => `XQ.${s.normalized.replace('/', '-')}`).join(',') }));
          }
          const stockSymbols = normalized.filter((s: any) => s.type === 'stock');
          if (stockSymbols.length > 0) {
            polygonSocket.send(JSON.stringify({ action: 'subscribe', params: stockSymbols.map((s: any) => `Q.${s.normalized}`).join(',') }));
          }
        }
        if (message.action === 'unsubscribe') {
          polygonSocket.send(JSON.stringify({ action: 'unsubscribe', params: message.symbols.join(',') }));
        }
      } catch (error) {
        console.error('Error processing client message:', error);
      }
    };

    clientSocket.onclose = () => {
      console.log('Client disconnected');
      polygonSocket.close();
    };

    return response;
  }

  // REST API fallback
  try {
    const body = await req.json();
    let symbol = body.symbol || '';
    const type = body.type || 'quote';
    const POLYGON_API_KEY = Deno.env.get('POLYGON_API_KEY');
    if (!POLYGON_API_KEY) {
      return new Response(JSON.stringify({ error: 'POLYGON_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (symbol.startsWith('C:')) {
      const clean = symbol.slice(2);
      symbol = `${clean.slice(0, 3)}/${clean.slice(3)}`;
    }

    let url = '';
    if (symbol.includes('/')) {
      const [base, quote] = symbol.split('/');
      url = type === 'aggregates'
        ? `https://api.polygon.io/v2/aggs/ticker/C:${base}${quote}/prev?apiKey=${POLYGON_API_KEY}`
        : `https://api.polygon.io/v1/last_quote/currencies/${base}/${quote}?apiKey=${POLYGON_API_KEY}`;
    } else if (symbol.includes('BTC') || symbol.includes('ETH')) {
      const pair = symbol.replace('/', '-');
      url = `https://api.polygon.io/v1/last/crypto/${pair}?apiKey=${POLYGON_API_KEY}`;
    } else {
      url = `https://api.polygon.io/v2/last/trade/${symbol}?apiKey=${POLYGON_API_KEY}`;
    }

    const t0 = Date.now();
    const response = await fetch(url);
    const latency = Date.now() - t0;
    const data = await response.json();

    console.log('Polygon REST response:', data);

    const polygonError = String(data?.error || data?.message || '').toLowerCase();
    const polygonStatus = String(data?.status || '').toUpperCase();
    const polygonUnauthorized = 
      (polygonStatus === 'ERROR' || polygonStatus === 'NOT_AUTHORIZED') &&
      (polygonError.includes('unknown api key') || polygonError.includes('not authorized') || polygonError.includes('not entitled'));

    logUsage('realtime-market', 'polygon', polygonUnauthorized ? 401 : 200, latency, { symbol, type });

    if (polygonUnauthorized) {
      console.log('Polygon unauthorized. Falling back to Yahoo Finance for:', symbol);
      try {
        const yahooFallback = await fetchYahooPrice(symbol);
        return new Response(JSON.stringify(yahooFallback), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (yahooError) {
        console.error('Yahoo fallback also failed:', yahooError);
        return new Response(JSON.stringify({ error: 'All price providers failed', polygon_status: polygonStatus }), {
          status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in realtime-market:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
