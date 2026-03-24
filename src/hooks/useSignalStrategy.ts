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
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const LS_PREFIX = 'sig-strategy-';

/** Synchronously resolve from memory or localStorage */
function resolveFromCache(signal: SignalInput, language: string): SignalStrategy | null {
  const key = getCacheKey(signal) + `-${language}`;
  const mem = strategyCache.get(key);
  if (mem && Date.now() - mem.timestamp < CACHE_TTL) return mem.strategy;
  return getFromStorage(key);
}

function getCacheKey(signal: SignalInput): string {
  return `${signal.currencyPair}-${signal.entryPrice}-${signal.takeProfit}-${signal.stopLoss}`;
}

/** Try to restore from localStorage */
function getFromStorage(key: string): SignalStrategy | null {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { strategy: SignalStrategy; timestamp: number };
    if (Date.now() - parsed.timestamp < CACHE_TTL) {
      // Also populate in-memory cache
      strategyCache.set(key, parsed);
      return parsed.strategy;
    }
    localStorage.removeItem(LS_PREFIX + key);
  } catch { /* ignore */ }
  return null;
}

/** Persist to localStorage */
function saveToStorage(key: string, strategy: SignalStrategy) {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify({ strategy, timestamp: Date.now() }));
  } catch { /* quota exceeded — ignore */ }
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

    // 1) Check in-memory cache
    const cached = strategyCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setStrategy(cached.strategy);
      fetchedRef.current = key;
      return;
    }

    // 2) Check localStorage
    const stored = getFromStorage(key);
    if (stored) {
      setStrategy(stored);
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
      // Save to both caches
      strategyCache.set(key, { strategy: s, timestamp: Date.now() });
      saveToStorage(key, s);
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
