import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/i18n/LanguageContext';
export interface StrategyField {
  value: string;
  explanation: string;
}

export interface SignalStrategy {
  duration: StrategyField;
  approach: StrategyField;
  session: StrategyField;
  bestTime: StrategyField;
  confirmationCandle: StrategyField;
}

interface SignalInput {
  currencyPair: string;
  action: string;
  trend: string;
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  probability: number;
  support?: number;
  resistance?: number;
}

// In-memory cache keyed by signal fingerprint
const strategyCache = new Map<string, { strategy: SignalStrategy; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 60 min

function getCacheKey(signal: SignalInput): string {
  return `${signal.currencyPair}-${signal.entryPrice}-${signal.takeProfit}-${signal.stopLoss}`;
}

export function useSignalStrategy(signal: SignalInput | null, enabled: boolean) {
  const [strategy, setStrategy] = useState<SignalStrategy | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef<string | null>(null);
  const { language } = useTranslation();

  const fetchStrategy = useCallback(async () => {
    if (!signal || !enabled) return;
    
    const key = getCacheKey(signal) + `-${language}`;
    
    // Already fetched this one
    if (fetchedRef.current === key) return;

    // Check cache
    const cached = strategyCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setStrategy(cached.strategy);
      fetchedRef.current = key;
      return;
    }

    setLoading(true);
    setError(null);
    fetchedRef.current = key;

    try {
      const { data, error: fnError } = await supabase.functions.invoke('analyze-signal', {
        body: {
          signal: {
            currencyPair: signal.currencyPair,
            action: signal.action,
            trend: signal.trend,
            entryPrice: signal.entryPrice,
            takeProfit: signal.takeProfit,
            stopLoss: signal.stopLoss,
            probability: signal.probability,
            support: signal.support,
            resistance: signal.resistance,
          },
          mode: 'strategy',
          language,
        },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      const s = data.strategy as SignalStrategy;
      setStrategy(s);
      strategyCache.set(key, { strategy: s, timestamp: Date.now() });
    } catch (e) {
      console.error('[useSignalStrategy] Error:', e);
      setError(e instanceof Error ? e.message : 'Error');
      fetchedRef.current = null; // allow retry
    } finally {
      setLoading(false);
    }
  }, [signal, enabled, language]);

  useEffect(() => {
    if (enabled && signal) {
      fetchStrategy();
    }
  }, [enabled, fetchStrategy]);

  return { strategy, loading, error };
}
