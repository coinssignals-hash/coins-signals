import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Signal = 'bullish' | 'bearish' | 'neutral';
type Timeframe = 'M5' | 'M15' | 'H1' | 'H4' | 'D1' | 'W1';

export interface PairAnalysis {
  pair: string;
  timeframes: Record<Timeframe, {
    trend: Signal;
    rsi: number;
    macd: Signal;
    ema: Signal;
    bb: Signal;
  }>;
  confluence: number;
  overallBias: Signal;
}

const memCache: { data: PairAnalysis[]; ts: number } | null = null;
const CACHE_TTL = 5 * 60_000; // 5 min

let cachedResult: { data: PairAnalysis[]; ts: number } | null = null;

export function useMultiTFScreener() {
  const [data, setData] = useState<PairAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const fetchData = useCallback(async (bypassCache = false) => {
    if (fetchingRef.current) return;

    if (!bypassCache && cachedResult && Date.now() - cachedResult.ts < CACHE_TTL) {
      setData(cachedResult.data);
      return;
    }

    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const { data: result, error: fnError } = await supabase.functions.invoke('multi-tf-screener', {
        body: {},
      });

      if (fnError) throw fnError;
      if (result?.error) throw new Error(result.error);

      const pairs = (result?.data || []) as PairAnalysis[];
      cachedResult = { data: pairs, ts: Date.now() };
      setData(pairs);
    } catch (err) {
      console.error('[useMultiTFScreener] Error:', err);
      setError(err instanceof Error ? err.message : 'Error fetching screener data');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  return { data, loading, error, fetchData };
}
