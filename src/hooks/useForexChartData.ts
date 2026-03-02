import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface ForexChartData {
  candles: CandleData[];
  support: number;
  resistance: number;
  date: string;
}

// In-memory cache
const cache = new Map<string, { data: ForexChartData; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export function useForexChartData(symbol: string) {
  const [data, setData] = useState<ForexChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (bypassCache = false) => {
    if (!symbol) return;

    const cacheKey = `forex_chart_${symbol}`;

    if (!bypassCache) {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setData(cached.data);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const { data: result, error: fnError } = await supabase.functions.invoke('forex-data', {
        body: {
          symbol: symbol.replace('/', ''),
          interval: '30min',
          outputsize: '336', // 7 days * 48 half-hours
        },
      });

      if (fnError) throw new Error(fnError.message);

      if (!result?.candles?.length) {
        throw new Error('No candle data returned');
      }

      const candles: CandleData[] = result.candles.map((c: any) => ({
        time: c.time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));

      const chartData: ForexChartData = {
        candles,
        support: result.support ?? Math.min(...candles.slice(-24).map(c => c.low)),
        resistance: result.resistance ?? Math.max(...candles.slice(-24).map(c => c.high)),
        date: new Date().toISOString().slice(0, 10),
      };

      cache.set(cacheKey, { data: chartData, timestamp: Date.now() });
      setData(chartData);
    } catch (err) {
      console.error('[useForexChartData] Error:', err);
      setError(err instanceof Error ? err.message : 'Error fetching forex chart data');
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => fetchData(true), [fetchData]);

  return { data, loading, error, refetch };
}
