import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Signal = 'bullish' | 'bearish' | 'neutral';
type Timeframe = 'M5' | 'M15' | 'H1' | 'H4' | 'D1' | 'W1';

export interface CurrencyStrength {
  currency: string;
  strength: number;
  raw: number;
}

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

let cachedResult: { data: PairAnalysis[]; ts: number; key: string; strength: CurrencyStrength[] } | null = null;

export const DEFAULT_PAIRS = [
  "EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CHF",
  "NZD/USD", "USD/CAD", "EUR/GBP", "XAU/USD",
];

export const ALL_AVAILABLE_PAIRS = [
  "EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CHF",
  "NZD/USD", "USD/CAD", "EUR/GBP", "EUR/JPY", "GBP/JPY",
  "AUD/JPY", "CHF/JPY", "EUR/AUD", "GBP/AUD", "EUR/CAD",
  "GBP/CAD", "AUD/CAD", "AUD/NZD", "EUR/NZD", "GBP/NZD",
  "XAU/USD", "XAG/USD",
];

const STORAGE_KEY = 'mtf-screener-pairs';

export function loadSavedPairs(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as string[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_PAIRS;
}

export function savePairs(pairs: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pairs));
}

export function useMultiTFScreener() {
  const [data, setData] = useState<PairAnalysis[]>([]);
  const [currencyStrength, setCurrencyStrength] = useState<CurrencyStrength[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const fetchData = useCallback(async (bypassCache = false, pairs?: string[]) => {
    if (fetchingRef.current) return;

    const pairsKey = (pairs || loadSavedPairs()).join(',');
    if (!bypassCache && cachedResult && Date.now() - cachedResult.ts < CACHE_TTL && cachedResult.key === pairsKey) {
      setData(cachedResult.data);
      setCurrencyStrength(cachedResult.strength);
      return;
    }

    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const { data: result, error: fnError } = await supabase.functions.invoke('multi-tf-screener', {
        body: { pairs: pairs || loadSavedPairs() },
      });

      if (fnError) throw fnError;
      if (result?.error) throw new Error(result.error);

      const items = (result?.data || []) as PairAnalysis[];
      const strength = (result?.currencyStrength || []) as CurrencyStrength[];
      cachedResult = { data: items, ts: Date.now(), key: pairsKey, strength };
      setData(items);
      setCurrencyStrength(strength);
    } catch (err) {
      console.error('[useMultiTFScreener] Error:', err);
      setError(err instanceof Error ? err.message : 'Error fetching screener data');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  return { data, currencyStrength, loading, error, fetchData };
}
