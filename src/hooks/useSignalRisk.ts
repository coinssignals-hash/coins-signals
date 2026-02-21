import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/i18n/LanguageContext';

export interface SignalRisk {
  score: number;
  level: 'low' | 'medium' | 'high' | 'extreme';
  explanation: string;
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

const riskCache = new Map<string, { risk: SignalRisk; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000;

function getCacheKey(signal: SignalInput): string {
  return `risk-${signal.currencyPair}-${signal.entryPrice}-${signal.takeProfit}-${signal.stopLoss}`;
}

export function useSignalRisk(signal: SignalInput | null) {
  const [risk, setRisk] = useState<SignalRisk | null>(null);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef<string | null>(null);
  const { language } = useTranslation();

  const fetchRisk = useCallback(async () => {
    if (!signal) return;

    const key = getCacheKey(signal) + `-${language}`;
    if (fetchedRef.current === key) return;

    const cached = riskCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setRisk(cached.risk);
      fetchedRef.current = key;
      return;
    }

    setLoading(true);
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
          mode: 'risk',
          language,
        },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      const r = data.risk as SignalRisk;
      setRisk(r);
      riskCache.set(key, { risk: r, timestamp: Date.now() });
    } catch (e) {
      console.error('[useSignalRisk] Error:', e);
      fetchedRef.current = null;
    } finally {
      setLoading(false);
    }
  }, [signal, language]);

  useEffect(() => {
    if (signal) {
      fetchRisk();
    }
  }, [fetchRisk, signal]);

  return { risk, loading };
}
