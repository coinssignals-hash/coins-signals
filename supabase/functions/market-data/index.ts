import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const ALPHA_VANTAGE_KEY = Deno.env.get('ALPHA_VANTAGE_API_KEY');
const FMP_API_KEY = Deno.env.get('FMP_API_KEY');
const FINNHUB_KEY = Deno.env.get('FINNHUB_API_KEY');
const TWELVE_DATA_KEY = Deno.env.get('TWELVE_DATA_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function logUsage(provider: string, status: number, latencyMs: number, meta?: Record<string, unknown>) {
  try {
    await supabaseAdmin.from('api_usage_logs').insert({
      function_name: 'market-data',
      provider,
      response_status: status,
      latency_ms: latencyMs,
      metadata: meta || {},
    });
  } catch { /* fire-and-forget */ }
}

// ─── In-memory cache (fast, per-instance) ───
interface CacheEntry { data: unknown; ts: number }
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 90_000; // 90s

function cacheKey(sym: string, interval: string, ind?: string) { return `${sym}:${interval}:${ind || 'price'}`; }
function fromCache(k: string) { const e = cache.get(k); if (!e || Date.now() - e.ts > CACHE_TTL) { if (e) cache.delete(k); return null; } return e.data; }
function toCache(k: string, d: unknown) { if (cache.size > 100) { const f = cache.keys().next().value; if (f) cache.delete(f); } cache.set(k, { data: d, ts: Date.now() }); }

// ─── DB cache (persistent, survives restarts) ───
const DB_CACHE_TTL: Record<string, number> = {
  'price': 3,    // 3 min for OHLC
  'rsi': 5, 'macd': 5, 'sma': 5, 'stochastic': 5,
  'atr': 5, 'adx': 5, 'adx_full': 5, 'bbands': 5,
  'ichimoku': 10, 'willr': 5,
};

async function fromDBCache(ck: string): Promise<unknown | null> {
  try {
    const { data } = await supabaseAdmin
      .from('market_data_cache')
      .select('data, source')
      .eq('cache_key', ck)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
    if (data) {
      console.log(`[market-data] DB cache HIT: ${ck}`);
      return { ...data.data as object, cached: true, cache_source: 'db' };
    }
  } catch (e) { console.warn('[market-data] DB cache read error:', e); }
  return null;
}

async function toDBCache(ck: string, symbol: string, interval: string, indicator: string, result: unknown, source?: string) {
  try {
    const ttlMinutes = DB_CACHE_TTL[indicator] || 5;
    const expires_at = new Date(Date.now() + ttlMinutes * 60_000).toISOString();
    await supabaseAdmin
      .from('market_data_cache')
      .upsert({
        cache_key: ck, symbol, interval, indicator,
        data: result, source: source || 'unknown',
        created_at: new Date().toISOString(), expires_at,
      }, { onConflict: 'cache_key' });
  } catch (e) { console.warn('[market-data] DB cache write error:', e); }
}

// ─── Symbol helpers ───
function normalize(s: string): string {
  let f = s.trim().toUpperCase().replace(/\s+/g, '').replace(/[-_]/g, '/');
  if (/^[A-Z]{6}$/.test(f)) f = `${f.slice(0, 3)}/${f.slice(3)}`;
  return f;
}

function avInterval(interval: string): string {
  const m: Record<string, string> = { '5min': '5min', '15min': '15min', '30min': '30min', '1h': '60min', '4h': '60min', '1day': 'daily', '1week': 'weekly' };
  return m[interval] || '60min';
}

// ─── Alpha Vantage: OHLC ───
async function fetchAV_OHLC(symbol: string, interval: string, outputsize: number) {
  if (!ALPHA_VANTAGE_KEY) throw new Error('AV_KEY_MISSING');
  const [from, to] = symbol.split('/');
  const avi = avInterval(interval);
  const url = ['daily', 'weekly'].includes(avi)
    ? `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=${from}&to_symbol=${to}&outputsize=compact&apikey=${ALPHA_VANTAGE_KEY}`
    : `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=${from}&to_symbol=${to}&interval=${avi}&outputsize=compact&apikey=${ALPHA_VANTAGE_KEY}`;

  const t0 = Date.now();
  const res = await fetch(url);
  const latency = Date.now() - t0;
  if (!res.ok) { logUsage('alpha_vantage', res.status, latency, { symbol, type: 'OHLC' }); throw new Error(`AV HTTP ${res.status}`); }
  const data = await res.json();
  if (data['Note'] || data['Information']) { logUsage('alpha_vantage', 429, latency, { symbol, type: 'OHLC' }); throw new Error('AV_RATE_LIMIT'); }
  if (data['Error Message']) throw new Error(data['Error Message']);

  logUsage('alpha_vantage', 200, latency, { symbol, type: 'OHLC' });

  const tsKey = Object.keys(data).find(k => k.startsWith('Time Series'));
  if (!tsKey || !data[tsKey]) throw new Error('No AV OHLC data');

  const entries = Object.entries(data[tsKey]).slice(0, outputsize);
  const values = entries.map(([dt, bar]: [string, any]) => ({
    datetime: dt, open: bar['1. open'], high: bar['2. high'], low: bar['3. low'], close: bar['4. close'], volume: '0',
  })).reverse();

  return { meta: { symbol, interval, type: 'Forex' }, values, status: 'ok', source: 'alpha_vantage' };
}

// ─── Alpha Vantage: Generic Technical Indicator ───
async function fetchAV_Indicator(symbol: string, interval: string, fn: string, params: Record<string, string>, outputsize: number) {
  if (!ALPHA_VANTAGE_KEY) throw new Error('AV_KEY_MISSING');
  const avSym = symbol.replace('/', '');
  const avi = avInterval(interval);
  const qs = new URLSearchParams({ function: fn, symbol: avSym, interval: avi, series_type: 'close', apikey: ALPHA_VANTAGE_KEY, ...params });
  const url = `https://www.alphavantage.co/query?${qs}`;
  console.log(`[AV] ${fn} ${avSym} ${avi}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`AV HTTP ${res.status}`);
  const data = await res.json();
  if (data['Note'] || data['Information']) throw new Error('AV_RATE_LIMIT');
  const tsKey = Object.keys(data).find(k => k.startsWith('Technical Analysis'));
  if (!tsKey || !data[tsKey]) throw new Error(`No AV data for ${fn}`);
  return Object.entries(data[tsKey]).slice(0, outputsize);
}

// ─── RSI ───
async function fetchRSI(symbol: string, interval: string, outputsize: number) {
  const entries = await fetchAV_Indicator(symbol, interval, 'RSI', { time_period: '14' }, outputsize);
  return {
    values: entries.map(([dt, v]: [string, any]) => ({ datetime: dt, rsi: v['RSI'] })).reverse(),
    symbol, source: 'alpha_vantage',
  };
}

// ─── MACD ───
async function fetchMACD(symbol: string, interval: string, outputsize: number) {
  const entries = await fetchAV_Indicator(symbol, interval, 'MACD', {}, outputsize);
  return {
    values: entries.map(([dt, v]: [string, any]) => ({
      datetime: dt, macd: v['MACD'], macd_signal: v['MACD_Signal'], macd_hist: v['MACD_Hist'],
    })).reverse(),
    symbol, source: 'alpha_vantage',
  };
}

// ─── SMA (20 + 50) ───
async function fetchSMA(symbol: string, interval: string, outputsize: number) {
  const [e20, e50] = await Promise.all([
    fetchAV_Indicator(symbol, interval, 'SMA', { time_period: '20' }, outputsize),
    fetchAV_Indicator(symbol, interval, 'SMA', { time_period: '50' }, outputsize),
  ]);
  return {
    sma20: e20.map(([dt, v]: [string, any]) => ({ datetime: dt, sma: v['SMA'] })).reverse(),
    sma50: e50.map(([dt, v]: [string, any]) => ({ datetime: dt, sma: v['SMA'] })).reverse(),
    symbol, source: 'alpha_vantage',
  };
}

// ─── Stochastic ───
async function fetchStochastic(symbol: string, interval: string, outputsize: number) {
  const entries = await fetchAV_Indicator(symbol, interval, 'STOCH', { fastkperiod: '14', slowkperiod: '3', slowdperiod: '3' }, outputsize);
  return {
    values: entries.map(([dt, v]: [string, any]) => ({
      datetime: dt, slowK: v['SlowK'], slowD: v['SlowD'],
    })).reverse(),
    symbol, source: 'alpha_vantage',
  };
}

// ─── ATR ───
async function fetchATR(symbol: string, interval: string, outputsize: number) {
  const entries = await fetchAV_Indicator(symbol, interval, 'ATR', { time_period: '14' }, outputsize);
  return {
    values: entries.map(([dt, v]: [string, any]) => ({ datetime: dt, atr: v['ATR'] })).reverse(),
    symbol, source: 'alpha_vantage',
  };
}

// ─── ADX ───
async function fetchADX(symbol: string, interval: string, outputsize: number) {
  const entries = await fetchAV_Indicator(symbol, interval, 'ADX', { time_period: '14' }, outputsize);
  return {
    values: entries.map(([dt, v]: [string, any]) => ({ datetime: dt, adx: v['ADX'] })).reverse(),
    symbol, source: 'alpha_vantage',
  };
}

// ─── Bollinger Bands ───
async function fetchBBands(symbol: string, interval: string, outputsize: number) {
  const entries = await fetchAV_Indicator(symbol, interval, 'BBANDS', { time_period: '20', nbdevup: '2', nbdevdn: '2' }, outputsize);
  return {
    values: entries.map(([dt, v]: [string, any]) => ({
      datetime: dt,
      upper: v['Real Upper Band'],
      middle: v['Real Middle Band'],
      lower: v['Real Lower Band'],
    })).reverse(),
    symbol, source: 'alpha_vantage',
  };
}

// ─── Williams %R ───
async function fetchWilliamsR(symbol: string, interval: string, outputsize: number) {
  const entries = await fetchAV_Indicator(symbol, interval, 'WILLR', { time_period: '14' }, outputsize);
  return {
    values: entries.map(([dt, v]: [string, any]) => ({ datetime: dt, willr: v['WILLR'] })).reverse(),
    symbol, source: 'alpha_vantage',
  };
}

// ─── Ichimoku Cloud (calculated from OHLC) ───
function calcIchimokuFromOHLC(values: any[], symbol: string) {
  const tenkanP = 9, kijunP = 26, senkouBP = 52, disp = 26;
  if (values.length < senkouBP + disp) throw new Error('Insufficient data for Ichimoku (need 78+ candles)');

  function midpoint(start: number, period: number): number | null {
    if (start < 0 || start + period > values.length) return null;
    const slice = values.slice(start, start + period);
    const high = Math.max(...slice.map((d: any) => parseFloat(d.high)));
    const low = Math.min(...slice.map((d: any) => parseFloat(d.low)));
    return (high + low) / 2;
  }

  const result: any[] = [];
  for (let i = 0; i < values.length; i++) {
    const close = parseFloat(values[i].close);
    const tenkan = i >= tenkanP - 1 ? midpoint(i - tenkanP + 1, tenkanP) : null;
    const kijun = i >= kijunP - 1 ? midpoint(i - kijunP + 1, kijunP) : null;

    // Senkou spans displaced forward
    const srcA = i >= kijunP - 1 + disp ? i - disp : -1;
    let senkouA: number | null = null;
    let senkouB: number | null = null;
    if (srcA >= kijunP - 1) {
      const t = midpoint(srcA - tenkanP + 1, tenkanP);
      const k = midpoint(srcA - kijunP + 1, kijunP);
      if (t !== null && k !== null) senkouA = (t + k) / 2;
    }
    if (i >= senkouBP - 1 + disp) {
      const src = i - disp;
      if (src >= senkouBP - 1) senkouB = midpoint(src - senkouBP + 1, senkouBP);
    }

    const chikou = i >= disp ? parseFloat(values[i - disp].close) : null;

    result.push({
      datetime: values[i].datetime,
      tenkan: tenkan !== null ? tenkan.toFixed(5) : null,
      kijun: kijun !== null ? kijun.toFixed(5) : null,
      senkouA: senkouA !== null ? senkouA.toFixed(5) : null,
      senkouB: senkouB !== null ? senkouB.toFixed(5) : null,
      chikou: chikou !== null ? chikou.toFixed(5) : null,
    });
  }

  return { values: result, symbol, source: 'calculated' };
}

async function fetchIchimoku(symbol: string, interval: string, outputsize: number) {
  // Ichimoku needs 78+ candles for full calculation - get OHLC and calculate
  const ohlcCK = cacheKey(symbol, interval);
  let ohlc: any = fromCache(ohlcCK) as any;
  if (!ohlc || !ohlc.values) {
    // Fetch OHLC with extra data for Ichimoku calculation
    const neededSize = Math.max(outputsize + 60, 120);
    try { ohlc = await fetchAV_OHLC(symbol, interval, neededSize); } catch { /* ignore */ }
    if (!ohlc) try { ohlc = await fetchFMP_OHLC(symbol, interval, neededSize); } catch { /* ignore */ }
    if (!ohlc) try { ohlc = await fetchFinnhub_OHLC(symbol, interval, neededSize); } catch { /* ignore */ }
  }
  if (!ohlc || !ohlc.values || ohlc.values.length < 52) throw new Error('Insufficient OHLC data for Ichimoku');
  return calcIchimokuFromOHLC(ohlc.values, symbol);
}

// ─── Plus/Minus DI for ADX chart ───
async function fetchADXFull(symbol: string, interval: string, outputsize: number) {
  const [adxEntries, pdiEntries, mdiEntries] = await Promise.all([
    fetchAV_Indicator(symbol, interval, 'ADX', { time_period: '14' }, outputsize),
    fetchAV_Indicator(symbol, interval, 'PLUS_DI', { time_period: '14' }, outputsize),
    fetchAV_Indicator(symbol, interval, 'MINUS_DI', { time_period: '14' }, outputsize),
  ]);
  // Merge by datetime
  const pdiMap = new Map(pdiEntries.map(([dt, v]: [string, any]) => [dt, v['PLUS_DI']]));
  const mdiMap = new Map(mdiEntries.map(([dt, v]: [string, any]) => [dt, v['MINUS_DI']]));
  return {
    values: adxEntries.map(([dt, v]: [string, any]) => ({
      datetime: dt, adx: v['ADX'], pdi: pdiMap.get(dt) || '0', mdi: mdiMap.get(dt) || '0',
    })).reverse(),
    symbol, source: 'alpha_vantage',
  };
}

// ─── FMP: OHLC fallback ───
async function fetchFMP_OHLC(symbol: string, interval: string, outputsize: number) {
  if (!FMP_API_KEY) throw new Error('FMP_KEY_MISSING');
  const pair = symbol.replace('/', '');
  // FMP intraday chart
  const tfMap: Record<string, string> = { '5min': '5min', '15min': '15min', '30min': '30min', '1h': '1hour', '4h': '4hour', '1day': 'daily', '1week': 'daily' };
  const tf = tfMap[interval] || '1hour';
  const url = tf === 'daily'
    ? `https://financialmodelingprep.com/api/v3/historical-price-full/${pair}?apikey=${FMP_API_KEY}&timeseries=${outputsize}`
    : `https://financialmodelingprep.com/api/v3/historical-chart/${tf}/${pair}?apikey=${FMP_API_KEY}`;
  console.log(`[FMP] OHLC ${pair} ${tf}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FMP HTTP ${res.status}`);
  const data = await res.json();
  const raw = Array.isArray(data) ? data : data?.historical || [];
  if (raw.length === 0) throw new Error('No FMP data');
  const values = raw.slice(0, outputsize).map((b: any) => ({
    datetime: b.date, open: String(b.open), high: String(b.high), low: String(b.low), close: String(b.close), volume: String(b.volume || 0),
  })).reverse();
  return { meta: { symbol, interval, type: 'Forex' }, values, status: 'ok', source: 'fmp' };
}

// ─── Finnhub: OHLC fallback ───
async function fetchFinnhub_OHLC(symbol: string, interval: string, outputsize: number) {
  if (!FINNHUB_KEY) throw new Error('FINNHUB_KEY_MISSING');
  const pair = `OANDA:${symbol.replace('/', '_')}`;
  const resMap: Record<string, string> = { '5min': '5', '15min': '15', '30min': '30', '1h': '60', '4h': 'D', '1day': 'D', '1week': 'W' };
  const resolution = resMap[interval] || '60';
  const to = Math.floor(Date.now() / 1000);
  const daysBack = ['D', 'W'].includes(resolution) ? 365 : 14;
  const from = to - daysBack * 86400;
  const url = `https://finnhub.io/api/v1/forex/candle?symbol=${encodeURIComponent(pair)}&resolution=${resolution}&from=${from}&to=${to}&token=${FINNHUB_KEY}`;
  console.log(`[Finnhub] OHLC ${pair} ${resolution}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Finnhub HTTP ${res.status}`);
  const data = await res.json();
  if (data.s !== 'ok' || !data.c?.length) throw new Error('No Finnhub data');
  const values = data.t.slice(-outputsize).map((t: number, i: number) => ({
    datetime: new Date(t * 1000).toISOString().replace('T', ' ').slice(0, 19),
    open: String(data.o[data.t.length - outputsize + i] ?? data.o[i]),
    high: String(data.h[data.t.length - outputsize + i] ?? data.h[i]),
    low: String(data.l[data.t.length - outputsize + i] ?? data.l[i]),
    close: String(data.c[data.t.length - outputsize + i] ?? data.c[i]),
    volume: String(data.v?.[data.t.length - outputsize + i] ?? 0),
  }));
  return { meta: { symbol, interval, type: 'Forex' }, values, status: 'ok', source: 'finnhub' };
}

// ─── Client-side calculation fallbacks ───
function calcRSI(prices: number[], period = 14): number[] {
  const r: number[] = [];
  if (prices.length < period + 1) return prices.map(() => 50);
  let ag = 0, al = 0;
  for (let i = 1; i <= period; i++) { const c = prices[i] - prices[i - 1]; if (c > 0) ag += c; else al += Math.abs(c); }
  ag /= period; al /= period;
  for (let i = 0; i < period; i++) r.push(50);
  r.push(al === 0 ? 100 : 100 - 100 / (1 + ag / al));
  for (let i = period + 1; i < prices.length; i++) {
    const c = prices[i] - prices[i - 1];
    ag = (ag * (period - 1) + (c > 0 ? c : 0)) / period;
    al = (al * (period - 1) + (c < 0 ? Math.abs(c) : 0)) / period;
    r.push(al === 0 ? 100 : 100 - 100 / (1 + ag / al));
  }
  return r;
}

function calcEMA(prices: number[], period: number): number[] {
  if (!prices.length) return [];
  const k = 2 / (period + 1);
  const e = [prices.slice(0, Math.min(period, prices.length)).reduce((a, b) => a + b, 0) / Math.min(period, prices.length)];
  for (let i = 1; i < prices.length; i++) e.push(prices[i] * k + e[i - 1] * (1 - k));
  return e;
}

function calcMACD(prices: number[]) {
  const e12 = calcEMA(prices, 12), e26 = calcEMA(prices, 26);
  const ml = e12.map((v, i) => v - e26[i]);
  const sl = calcEMA(ml, 9);
  return ml.map((m, i) => ({ macd: m, signal: sl[i] || 0, histogram: m - (sl[i] || 0) }));
}

function calcSMA(prices: number[], period: number): number[] {
  return prices.map((_, i) => i < period - 1 ? 0 : prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period);
}

// Calculate indicator from OHLC if AV fails
function calcIndicatorFromOHLC(values: any[], indicator: string, symbol: string) {
  const prices = values.map((v: any) => parseFloat(v.close)).filter(p => p > 0);
  const dts = values.map((v: any) => v.datetime);
  if (prices.length < 2) throw new Error('Insufficient data for calculation');

  if (indicator === 'rsi') {
    const rsi = calcRSI(prices);
    return { values: dts.map((dt: string, i: number) => ({ datetime: dt, rsi: String(rsi[i]?.toFixed(4) || '50') })), symbol, source: 'calculated' };
  }
  if (indicator === 'macd') {
    const macd = calcMACD(prices);
    return { values: dts.map((dt: string, i: number) => ({ datetime: dt, macd: String(macd[i]?.macd.toFixed(6) || '0'), macd_signal: String(macd[i]?.signal.toFixed(6) || '0'), macd_hist: String(macd[i]?.histogram.toFixed(6) || '0') })), symbol, source: 'calculated' };
  }
  if (indicator === 'sma') {
    const s20 = calcSMA(prices, 20), s50 = calcSMA(prices, 50);
    return {
      sma20: dts.map((dt: string, i: number) => ({ datetime: dt, sma: String(s20[i]?.toFixed(5) || '0') })).filter((_: any, i: number) => s20[i] > 0),
      sma50: dts.map((dt: string, i: number) => ({ datetime: dt, sma: String(s50[i]?.toFixed(5) || '0') })).filter((_: any, i: number) => s50[i] > 0),
      symbol, source: 'calculated',
    };
  }
  if (indicator === 'stochastic') {
    const highs = values.map((v: any) => parseFloat(v.high));
    const lows = values.map((v: any) => parseFloat(v.low));
    const kValues: number[] = [];
    for (let i = 0; i < prices.length; i++) {
      if (i < 13) { kValues.push(50); continue; }
      const hh = Math.max(...highs.slice(i - 13, i + 1));
      const ll = Math.min(...lows.slice(i - 13, i + 1));
      kValues.push(hh === ll ? 50 : ((prices[i] - ll) / (hh - ll)) * 100);
    }
    // Smooth K → slowK with SMA(3), then slowD with SMA(3)
    const slowK = calcSMA(kValues, 3);
    const slowD = calcSMA(slowK, 3);
    return { values: dts.map((dt: string, i: number) => ({ datetime: dt, slowK: String(slowK[i]?.toFixed(4) || '50'), slowD: String(slowD[i]?.toFixed(4) || '50') })).slice(14), symbol, source: 'calculated' };
  }
  if (indicator === 'atr') {
    const trs: number[] = [0];
    for (let i = 1; i < prices.length; i++) {
      const h = parseFloat(values[i].high), l = parseFloat(values[i].low), pc = prices[i - 1];
      trs.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)));
    }
    const atr: number[] = [];
    for (let i = 0; i < prices.length; i++) {
      if (i < 14) { atr.push(0); continue; }
      if (i === 14) { atr.push(trs.slice(1, 15).reduce((a, b) => a + b, 0) / 14); continue; }
      atr.push((atr[i - 1] * 13 + trs[i]) / 14);
    }
    return { values: dts.map((dt: string, i: number) => ({ datetime: dt, atr: String(atr[i]?.toFixed(6) || '0') })).slice(14), symbol, source: 'calculated' };
  }
  if (indicator === 'adx' || indicator === 'adx_full') {
    // Simplified ADX
    const pdm: number[] = [0], mdm: number[] = [0], trs: number[] = [0];
    for (let i = 1; i < prices.length; i++) {
      const h = parseFloat(values[i].high), l = parseFloat(values[i].low), ph = parseFloat(values[i - 1].high), pl = parseFloat(values[i - 1].low), pc = prices[i - 1];
      pdm.push(Math.max(h - ph, 0)); mdm.push(Math.max(pl - l, 0));
      if (pdm[i] > mdm[i]) mdm[i] = 0; else pdm[i] = 0;
      trs.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)));
    }
    const smoothPDM = calcEMA(pdm, 14), smoothMDM = calcEMA(mdm, 14), smoothTR = calcEMA(trs, 14);
    const pdi = smoothPDM.map((v, i) => smoothTR[i] > 0 ? (v / smoothTR[i]) * 100 : 0);
    const mdi = smoothMDM.map((v, i) => smoothTR[i] > 0 ? (v / smoothTR[i]) * 100 : 0);
    const dx = pdi.map((p, i) => (p + mdi[i]) > 0 ? Math.abs(p - mdi[i]) / (p + mdi[i]) * 100 : 0);
    const adx = calcEMA(dx, 14);
    return { values: dts.map((dt: string, i: number) => ({ datetime: dt, adx: String(adx[i]?.toFixed(4) || '0'), pdi: String(pdi[i]?.toFixed(4) || '0'), mdi: String(mdi[i]?.toFixed(4) || '0') })).slice(28), symbol, source: 'calculated' };
  }
  if (indicator === 'bbands') {
    const sma20 = calcSMA(prices, 20);
    const result = dts.map((dt: string, i: number) => {
      if (i < 19) return { datetime: dt, upper: '0', middle: '0', lower: '0' };
      const slice = prices.slice(i - 19, i + 1);
      const mean = sma20[i];
      const std = Math.sqrt(slice.reduce((a, b) => a + (b - mean) ** 2, 0) / 20);
      return { datetime: dt, upper: String((mean + 2 * std).toFixed(6)), middle: String(mean.toFixed(6)), lower: String((mean - 2 * std).toFixed(6)) };
    }).slice(19);
    return { values: result, symbol, source: 'calculated' };
  }
  throw new Error(`Unknown indicator: ${indicator}`);
}

// ─── Main handler ───
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { symbol, interval = '4h', indicator, outputsize = 50 } = body;
    if (!symbol || typeof symbol !== 'string') {
      return new Response(JSON.stringify({ error: 'Symbol required', status: 'error' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const sym = normalize(symbol);
    const ind = indicator || 'price';
    const ck = cacheKey(sym, interval, indicator);
    
    // Layer 1: in-memory cache
    const cached = fromCache(ck);
    if (cached) return new Response(JSON.stringify({ ...cached as object, cached: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Layer 2: DB persistent cache
    const dbCached = await fromDBCache(ck);
    if (dbCached) {
      toCache(ck, dbCached); // warm in-memory
      return new Response(JSON.stringify(dbCached), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`[market-data] ${sym} interval=${interval} indicator=${indicator || 'price'}`);

    let result: any;

    if (!indicator) {
      // ─── OHLC: try AV → FMP → Finnhub ───
      const errors: string[] = [];
      try { result = await fetchAV_OHLC(sym, interval, outputsize); } catch (e: any) { errors.push(`AV: ${e.message}`); }
      if (!result) try { result = await fetchFMP_OHLC(sym, interval, outputsize); } catch (e: any) { errors.push(`FMP: ${e.message}`); }
      if (!result) try { result = await fetchFinnhub_OHLC(sym, interval, outputsize); } catch (e: any) { errors.push(`Finnhub: ${e.message}`); }
      if (!result) throw new Error(`No OHLC data: ${errors.join('; ')}`);
    } else {
      // ─── Indicators: try AV API first → fallback to OHLC + calculation ───
      try {
        switch (indicator) {
          case 'rsi': result = await fetchRSI(sym, interval, outputsize); break;
          case 'macd': result = await fetchMACD(sym, interval, outputsize); break;
          case 'sma': result = await fetchSMA(sym, interval, outputsize); break;
          case 'stochastic': result = await fetchStochastic(sym, interval, outputsize); break;
          case 'atr': result = await fetchATR(sym, interval, outputsize); break;
          case 'adx': result = await fetchADX(sym, interval, outputsize); break;
          case 'adx_full': result = await fetchADXFull(sym, interval, outputsize); break;
          case 'bbands': result = await fetchBBands(sym, interval, outputsize); break;
          case 'willr': result = await fetchWilliamsR(sym, interval, outputsize); break;
          case 'ichimoku': result = await fetchIchimoku(sym, interval, outputsize); break;
          default: result = await fetchAV_OHLC(sym, interval, outputsize); break;
        }
      } catch (avErr: any) {
        console.log(`[market-data] AV indicator ${indicator} failed: ${avErr.message}, falling back to calculation`);
        
        // Fallback: check cached OHLC first, then fetch
        const ohlcCK = cacheKey(sym, interval);
        let ohlc: any = fromCache(ohlcCK) as any;
        if (!ohlc || !ohlc.values) {
          // Try DB cache for OHLC
          const dbOhlc = await fromDBCache(ohlcCK);
          if (dbOhlc && (dbOhlc as any).values) ohlc = dbOhlc;
        }
        if (!ohlc || !ohlc.values) {
          ohlc = null;
          try { ohlc = await fetchAV_OHLC(sym, interval, Math.max(outputsize + 60, 100)); } catch { /* ignore */ }
          if (!ohlc) try { ohlc = await fetchFMP_OHLC(sym, interval, Math.max(outputsize + 60, 100)); } catch { /* ignore */ }
          if (!ohlc) try { ohlc = await fetchFinnhub_OHLC(sym, interval, Math.max(outputsize + 60, 100)); } catch { /* ignore */ }
        }
        if (!ohlc || !ohlc.values) throw new Error(`No data available for ${indicator}`);
        result = calcIndicatorFromOHLC(ohlc.values, indicator, sym);
      }
    }

    toCache(ck, result);
    // Persist to DB cache (fire-and-forget)
    toDBCache(ck, sym, interval, ind, result, result?.source).catch(() => {});
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[market-data] Error:', msg);
    return new Response(JSON.stringify({ error: msg, status: 'error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
