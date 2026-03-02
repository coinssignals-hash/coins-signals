import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EconomicEvent {
  event: string;
  country: string;
  impact: string;
  date: string;
  actual?: string;
  estimate?: string;
  previous?: string;
}

export interface SignalMarketData {
  symbol: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  dailyHigh: number | null;
  dailyLow: number | null;
  dailyOpen: number | null;
  dailyRange: number | null;
  dailyRangePercent: number | null;
  previousClose: number | null;
  volume: number | null;
  bid: number | null;
  ask: number | null;
  spread: number | null;
  spreadPips: number | null;
  rsi14: number | null;
  atr14: number | null;
  atrPercent: number | null;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  ema9: number | null;
  ema20: number | null;
  ema50: number | null;
  macdValue: number | null;
  macdSignal: number | null;
  macdHistogram: number | null;
  stochK: number | null;
  stochD: number | null;
  williamsR: number | null;
  adx14: number | null;
  bollingerUpper: number | null;
  bollingerMiddle: number | null;
  bollingerLower: number | null;
  bollingerWidth: number | null;
  smaSignal: string | null;
  emaSignal: string | null;
  momentum: string | null;
  volatility: string | null;
  trendStrength: string | null;
  overallSignal: string | null;
  newsSentiment: number | null;
  newsSentimentLabel: string | null;
  newsHeadlines: string[];
  upcomingEvents: EconomicEvent[];
  sources: string[];
  timestamp: number;
  cached?: boolean;
}

const memCache = new Map<string, { data: SignalMarketData; ts: number }>();
const CACHE_TTL = 3 * 60_000;

export function useSignalMarketData(symbol: string | null, enabled = true) {
  const [data, setData] = useState<SignalMarketData | null>(null);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!symbol || !enabled) return;

    const key = symbol.toUpperCase();
    if (fetchedRef.current === key) return;

    const cached = memCache.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setData(cached.data);
      fetchedRef.current = key;
      return;
    }

    fetchedRef.current = key;
    setLoading(true);

    const fetchData = async () => {
      try {
        const { data: result, error } = await supabase.functions.invoke('signal-market-data', {
          body: { symbol },
        });

        if (error) {
          console.error('[useSignalMarketData] Error:', error);
          return;
        }

        if (result && !result.error) {
          setData(result as SignalMarketData);
          memCache.set(key, { data: result as SignalMarketData, ts: Date.now() });
        }
      } catch (e) {
        console.error('[useSignalMarketData] Fetch error:', e);
        fetchedRef.current = null;
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol, enabled]);

  return { data, loading };
}
