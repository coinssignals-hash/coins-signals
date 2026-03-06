import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/i18n/LanguageContext";

export interface CurrencyImpactAI {
  currency: string;
  positive: number;
  negative: number;
  neutral: number;
  reason: string;
}

interface UseCurrencyImpactAIReturn {
  data: CurrencyImpactAI[] | null;
  loading: boolean;
  error: string | null;
}

// In-memory cache
const cache = new Map<string, { data: CurrencyImpactAI[]; ts: number }>();
const CACHE_TTL = 60 * 60_000; // 60 min

export function useCurrencyImpactAI(signal: {
  currencyPair: string;
  action: string;
  trend: string;
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  probability: number;
} | null): UseCurrencyImpactAIReturn {
  const [data, setData] = useState<CurrencyImpactAI[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { language } = useTranslation();

  const fetchData = useCallback(async () => {
    if (!signal) return;

    const cacheKey = `${signal.currencyPair}_${signal.action}_${signal.entryPrice}_${language}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setData(cached.data);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: result, error: fnError } = await supabase.functions.invoke("currency-impact-ai", {
        body: {
          signal: {
            currencyPair: signal.currencyPair,
            action: signal.action,
            trend: signal.trend,
            entryPrice: signal.entryPrice,
            takeProfit: signal.takeProfit,
            stopLoss: signal.stopLoss,
            probability: signal.probability,
          },
          language,
        },
      });

      if (fnError) throw new Error(fnError.message);
      if (result?.error) throw new Error(result.error);

      const currencies = result?.currencies || [];
      cache.set(cacheKey, { data: currencies, ts: Date.now() });
      setData(currencies);
    } catch (err) {
      console.error("Currency impact AI error:", err);
      setError(err instanceof Error ? err.message : "Error");
      // Fallback to static data
      const clean = signal.currencyPair.replace(/[^A-Z]/gi, "").toUpperCase();
      setData([
        { currency: clean.slice(0, 3), positive: 50, negative: 30, neutral: 20, reason: "" },
        { currency: clean.slice(3, 6), positive: 30, negative: 50, neutral: 20, reason: "" },
      ]);
    } finally {
      setLoading(false);
    }
  }, [signal?.currencyPair, signal?.action, signal?.entryPrice, language]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error };
}
