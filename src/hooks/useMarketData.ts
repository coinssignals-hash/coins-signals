import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TimeSeriesValue {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
}

interface RSIValue {
  datetime: string;
  rsi: string;
}

interface MACDValue {
  datetime: string;
  macd: string;
  macd_signal: string;
  macd_hist: string;
}

interface SMAValue {
  datetime: string;
  sma: string;
}

interface MarketData {
  priceData: Array<{
    time: string;
    price: number;
    open: number;
    high: number;
    low: number;
  }>;
  smaData: {
    sma20: Array<{ datetime: string; sma: number }>;
    sma50: Array<{ datetime: string; sma: number }>;
  };
  rsiData: Array<{ time: string; rsi: number }>;
  macdData: Array<{
    time: string;
    macd: number;
    signal: number;
    histogram: number;
  }>;
  cached?: boolean;
}

const timeframeMap: Record<string, string> = {
  '5min': '5min',
  '15min': '15min',
  '30min': '30min',
  '1h': '1h',
  '4h': '4h',
  '1day': '1day',
  '1week': '1week',
  // Legacy mappings
  '1H': '1h',
  '4H': '4h',
  '1D': '1day',
  '1W': '1week',
};

// Client-side cache to reduce API calls
interface CacheEntry {
  data: MarketData;
  timestamp: number;
}

const clientCache = new Map<string, CacheEntry>();
const CLIENT_CACHE_TTL = 60 * 1000; // 60 seconds

function getCacheKey(symbol: string, interval: string): string {
  return `${symbol}:${interval}`;
}

function getFromClientCache(key: string): MarketData | null {
  const entry = clientCache.get(key);
  if (!entry) return null;
  
  if (Date.now() - entry.timestamp > CLIENT_CACHE_TTL) {
    clientCache.delete(key);
    return null;
  }
  
  return entry.data;
}

function setClientCache(key: string, data: MarketData): void {
  if (clientCache.size > 20) {
    const oldestKey = clientCache.keys().next().value;
    if (oldestKey) clientCache.delete(oldestKey);
  }
  clientCache.set(key, { data, timestamp: Date.now() });
}

// Rate limiting helper
const lastRequestTime = { value: 0 };
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between full refreshes

export function useMarketData(symbol: string, timeframe: string) {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    const interval = timeframeMap[timeframe] || '4h';
    const cacheKey = getCacheKey(symbol, interval);

    // Check client cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedData = getFromClientCache(cacheKey);
      if (cachedData) {
        setData({ ...cachedData, cached: true });
        setLoading(false);
        setError(null);
        return;
      }
    }

    // Rate limiting check
    const now = Date.now();
    if (now - lastRequestTime.value < MIN_REQUEST_INTERVAL && !forceRefresh) {
      console.log('Rate limited on client side, using existing data');
      setLoading(false);
      return;
    }
    lastRequestTime.value = now;

    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);
    setIsRateLimited(false);

    try {
      // Fetch all data in parallel to reduce time window
      const [priceResponse, rsiResponse, macdResponse, smaResponse] = await Promise.all([
        supabase.functions.invoke('market-data', {
          body: { symbol, interval, outputsize: 50 },
        }),
        supabase.functions.invoke('market-data', {
          body: { symbol, interval, indicator: 'rsi', outputsize: 50 },
        }),
        supabase.functions.invoke('market-data', {
          body: { symbol, interval, indicator: 'macd', outputsize: 50 },
        }),
        supabase.functions.invoke('market-data', {
          body: { symbol, interval, indicator: 'sma', outputsize: 50 },
        }),
      ]);

      // Check for subscription/billing and rate limit errors
      const responses = [priceResponse, rsiResponse, macdResponse, smaResponse];
      for (const response of responses) {
        const errData = response.data;
        if (errData?.error === 'api_subscription_expired') {
          setIsRateLimited(true);
          throw new Error('Suscripción de datos expirada. Contacta al administrador para renovar el acceso.');
        }
        if (errData?.error?.includes?.('API credits') || errData?.error?.includes?.('rate limit')) {
          setIsRateLimited(true);
          throw new Error('Límite de API alcanzado. Los datos se actualizarán en 1 minuto.');
        }
      }

      if (priceResponse.error) {
        throw new Error(priceResponse.error.message);
      }

      const priceResult = priceResponse.data;
      
      if (priceResult.status === 'error') {
        if (priceResult.error?.includes('API credits')) {
          setIsRateLimited(true);
          throw new Error('Límite de API alcanzado. Los datos se actualizarán en 1 minuto.');
        }
        throw new Error(priceResult.error || 'Error fetching price data');
      }

      // Process price data
      const priceValues: TimeSeriesValue[] = priceResult.values || [];
      const processedPrice = priceValues.map((v) => ({
        time: v.datetime,
        price: parseFloat(v.close),
        open: parseFloat(v.open),
        high: parseFloat(v.high),
        low: parseFloat(v.low),
      })).reverse();

      // Process RSI data
      const rsiValues: RSIValue[] = rsiResponse.data?.values || [];
      const processedRSI = rsiValues.map((v) => ({
        time: v.datetime,
        rsi: parseFloat(v.rsi),
      })).reverse();

      // Process MACD data
      const macdValues: MACDValue[] = macdResponse.data?.values || [];
      const processedMACD = macdValues.map((v) => ({
        time: v.datetime,
        macd: parseFloat(v.macd),
        signal: parseFloat(v.macd_signal),
        histogram: parseFloat(v.macd_hist),
      })).reverse();

      // Process SMA data
      const sma20Values: SMAValue[] = smaResponse.data?.sma20 || [];
      const sma50Values: SMAValue[] = smaResponse.data?.sma50 || [];
      
      const processedSMA = {
        sma20: sma20Values.map((v) => ({
          datetime: v.datetime,
          sma: parseFloat(v.sma),
        })).reverse(),
        sma50: sma50Values.map((v) => ({
          datetime: v.datetime,
          sma: parseFloat(v.sma),
        })).reverse(),
      };

      const marketData: MarketData = {
        priceData: processedPrice,
        smaData: processedSMA,
        rsiData: processedRSI,
        macdData: processedMACD,
        cached: priceResult.cached || false,
      };

      // Cache the result
      setClientCache(cacheKey, marketData);
      setData(marketData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error fetching market data';
      console.error('Market data error:', errorMessage);
      setError(errorMessage);
      
      // If rate limited, keep showing existing data
      if (isRateLimited && data) {
        setError('Límite de API alcanzado. Mostrando últimos datos disponibles.');
      }
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe, data, isRateLimited]);

  useEffect(() => {
    fetchData();
    
    // Refresh every 2 minutes (instead of 5) but rely on cache
    const intervalId = setInterval(() => fetchData(false), 2 * 60 * 1000);
    return () => {
      clearInterval(intervalId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  const refetch = useCallback(() => fetchData(true), [fetchData]);

  return { data, loading, error, refetch, isRateLimited };
}
