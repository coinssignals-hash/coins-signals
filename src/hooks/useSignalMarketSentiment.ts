import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/i18n/LanguageContext";

export interface SentimentSource {
  score: number;
  label: string;
  detail: string;
  indicators?: {
    rsi: number;
    macdSignal: "bullish" | "bearish" | "neutral";
    trendStrength: "strong" | "moderate" | "weak";
    smaAlignment: "bullish" | "bearish" | "mixed";
  };
  retailPercent?: number;
  institutionalPercent?: number;
}

export interface MarketSentimentData {
  overallScore: number;
  overallLabel: string;
  confidence: number;
  riskLevel: "bajo" | "moderado" | "alto" | "extremo";
  sources: {
    news: SentimentSource;
    technical: SentimentSource;
    signalQuality: SentimentSource;
    macro: SentimentSource;
    flow: SentimentSource;
  };
  recommendation: string;
  keyDrivers: string[];
  currencyPair: string;
  cached?: boolean;
}

interface SignalInput {
  currencyPair: string;
  action: string;
  trend: string;
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  probability: number;
  support?: number | null;
  resistance?: number | null;
}

// In-memory cache
const memCache = new Map<string, { data: MarketSentimentData; ts: number }>();
const CACHE_TTL = 15 * 60_000;

export function useSignalMarketSentiment(
  signal: SignalInput | null,
  currentPrice?: number,
  enabled = true
) {
  const [data, setData] = useState<MarketSentimentData | null>(null);
  const [loading, setLoading] = useState(false);
  const { language } = useTranslation();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!signal || !enabled) return;

    const key = `${signal.currencyPair}-${signal.action}-${language}`;
    const cached = memCache.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setData(cached.data);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const fetchSentiment = async () => {
      setLoading(true);
      try {
        const { data: result, error } = await supabase.functions.invoke(
          "signal-market-sentiment",
          {
            body: {
              ...signal,
              currentPrice,
              language,
            },
          }
        );

        if (controller.signal.aborted) return;

        if (error) {
          console.error("[useSignalMarketSentiment] Error:", error);
          return;
        }

        if (result && !result.error) {
          setData(result);
          memCache.set(key, { data: result, ts: Date.now() });
        }
      } catch (e) {
        if (!controller.signal.aborted) {
          console.error("[useSignalMarketSentiment] Fetch error:", e);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchSentiment();
    return () => controller.abort();
  }, [signal?.currencyPair, signal?.action, currentPrice, language, enabled]);

  return { data, loading };
}
