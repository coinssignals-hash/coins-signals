import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface OHLCVCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ForexDataResult {
  symbol: string;
  interval: string;
  candles: OHLCVCandle[];
}

export function useForexData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ForexDataResult | null>(null);

  const fetchData = useCallback(async (symbol: string, interval = '1d', range = '3mo') => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke('forex-data', {
        body: { symbol, interval, range },
      });
      if (fnError) throw fnError;
      setData(result);
      return result as ForexDataResult;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error fetching forex data';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchData };
}
