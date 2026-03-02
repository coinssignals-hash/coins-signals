import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MarketData {
  priceData: Array<{ time: string; price: number; open: number; high: number; low: number }>;
  smaData: { sma20: Array<{ datetime: string; sma: number }>; sma50: Array<{ datetime: string; sma: number }> };
  rsiData: Array<{ time: string; rsi: number }>;
  macdData: Array<{ time: string; macd: number; signal: number; histogram: number }>;
  stochasticData: Array<{ time: string; slowK: number; slowD: number }>;
  atrData: Array<{ time: string; atr: number }>;
  adxData: Array<{ time: string; adx: number; pdi: number; mdi: number }>;
  bbandsData: Array<{ time: string; upper: number; middle: number; lower: number }>;
  cached?: boolean;
}

const timeframeMap: Record<string, string> = {
  '5min': '5min', '15min': '15min', '30min': '30min', '1h': '1h', '4h': '4h',
  '1day': '1day', '1week': '1week', '1H': '1h', '4H': '4h', '1D': '1day', '1W': '1week',
};

interface CacheEntry { data: MarketData; timestamp: number }
const clientCache = new Map<string, CacheEntry>();
const CLIENT_CACHE_TTL = 60_000;

function getCK(s: string, i: string) { return `${s}:${i}`; }
function getCC(k: string) { const e = clientCache.get(k); if (!e || Date.now() - e.timestamp > CLIENT_CACHE_TTL) { if (e) clientCache.delete(k); return null; } return e.data; }
function setCC(k: string, d: MarketData) { if (clientCache.size > 20) { const f = clientCache.keys().next().value; if (f) clientCache.delete(f); } clientCache.set(k, { data: d, timestamp: Date.now() }); }

const lastReq = { v: 0 };
const MIN_INTERVAL = 2000;

export function useMarketData(symbol: string, timeframe: string) {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (force = false) => {
    const interval = timeframeMap[timeframe] || '4h';
    const ck = getCK(symbol, interval);

    if (!force) {
      const cached = getCC(ck);
      if (cached) { setData({ ...cached, cached: true }); setLoading(false); setError(null); return; }
    }

    const now = Date.now();
    if (now - lastReq.v < MIN_INTERVAL && !force) { setLoading(false); return; }
    lastReq.v = now;

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true); setError(null); setIsRateLimited(false);

    try {
      // Fetch all 7 data types in parallel
      const [priceR, rsiR, macdR, smaR, stochR, atrR, adxR, bbandsR] = await Promise.all([
        supabase.functions.invoke('market-data', { body: { symbol, interval, outputsize: 50 } }),
        supabase.functions.invoke('market-data', { body: { symbol, interval, indicator: 'rsi', outputsize: 50 } }),
        supabase.functions.invoke('market-data', { body: { symbol, interval, indicator: 'macd', outputsize: 50 } }),
        supabase.functions.invoke('market-data', { body: { symbol, interval, indicator: 'sma', outputsize: 50 } }),
        supabase.functions.invoke('market-data', { body: { symbol, interval, indicator: 'stochastic', outputsize: 50 } }),
        supabase.functions.invoke('market-data', { body: { symbol, interval, indicator: 'atr', outputsize: 50 } }),
        supabase.functions.invoke('market-data', { body: { symbol, interval, indicator: 'adx_full', outputsize: 50 } }),
        supabase.functions.invoke('market-data', { body: { symbol, interval, indicator: 'bbands', outputsize: 50 } }),
      ]);

      if (priceR.error) throw new Error(priceR.error.message);
      const priceResult = priceR.data;
      if (priceResult.status === 'error') throw new Error(priceResult.error || 'Error fetching price data');

      const priceValues = priceResult.values || [];
      const processedPrice = priceValues.map((v: any) => ({
        time: v.datetime, price: parseFloat(v.close), open: parseFloat(v.open), high: parseFloat(v.high), low: parseFloat(v.low),
      })).reverse();

      const rsiValues = rsiR.data?.values || [];
      const processedRSI = rsiValues.map((v: any) => ({ time: v.datetime, rsi: parseFloat(v.rsi) })).reverse();

      const macdValues = macdR.data?.values || [];
      const processedMACD = macdValues.map((v: any) => ({
        time: v.datetime, macd: parseFloat(v.macd), signal: parseFloat(v.macd_signal), histogram: parseFloat(v.macd_hist),
      })).reverse();

      const sma20V = smaR.data?.sma20 || [];
      const sma50V = smaR.data?.sma50 || [];
      const processedSMA = {
        sma20: sma20V.map((v: any) => ({ datetime: v.datetime, sma: parseFloat(v.sma) })).reverse(),
        sma50: sma50V.map((v: any) => ({ datetime: v.datetime, sma: parseFloat(v.sma) })).reverse(),
      };

      const stochValues = stochR.data?.values || [];
      const processedStoch = stochValues.map((v: any) => ({ time: v.datetime, slowK: parseFloat(v.slowK), slowD: parseFloat(v.slowD) })).reverse();

      const atrValues = atrR.data?.values || [];
      const processedATR = atrValues.map((v: any) => ({ time: v.datetime, atr: parseFloat(v.atr) })).reverse();

      const adxValues = adxR.data?.values || [];
      const processedADX = adxValues.map((v: any) => ({ time: v.datetime, adx: parseFloat(v.adx), pdi: parseFloat(v.pdi || '0'), mdi: parseFloat(v.mdi || '0') })).reverse();

      const bbandsValues = bbandsR.data?.values || [];
      const processedBBands = bbandsValues.map((v: any) => ({ time: v.datetime, upper: parseFloat(v.upper), middle: parseFloat(v.middle), lower: parseFloat(v.lower) })).reverse();

      const marketData: MarketData = {
        priceData: processedPrice, smaData: processedSMA, rsiData: processedRSI, macdData: processedMACD,
        stochasticData: processedStoch, atrData: processedATR, adxData: processedADX, bbandsData: processedBBands,
        cached: priceResult.cached || false,
      };

      setCC(ck, marketData);
      setData(marketData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error fetching market data';
      console.error('Market data error:', msg);
      setError(msg);
      if (isRateLimited && data) setError('Límite de API alcanzado. Mostrando últimos datos.');
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe, data, isRateLimited]);

  useEffect(() => {
    fetchData();
    const id = setInterval(() => fetchData(false), 2 * 60_000);
    return () => { clearInterval(id); abortRef.current?.abort(); };
  }, [fetchData]);

  const refetch = useCallback(() => fetchData(true), [fetchData]);
  return { data, loading, error, refetch, isRateLimited };
}
