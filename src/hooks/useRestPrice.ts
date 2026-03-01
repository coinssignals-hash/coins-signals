import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PriceQuote {
  price: number;
  timestamp: number;
}

const priceCache = new Map<string, { quote: PriceQuote; ts: number }>();
const CACHE_TTL = 15_000; // 15s

/**
 * Fetches current price via REST (Polygon) through the realtime-market edge function.
 * Falls back gracefully — no WebSocket dependency.
 */
export function useRestPrice(symbol: string, pollIntervalMs = 30_000) {
  const [quote, setQuote] = useState<PriceQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPrice = useCallback(async () => {
    // Check cache
    const cached = priceCache.get(symbol);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setQuote(cached.quote);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      // Try quote first, then fall back to aggregates (prev day close)
      const { data, error: fnError } = await supabase.functions.invoke('realtime-market', {
        body: { symbol, type: 'quote' },
      });

      if (fnError) throw new Error(fnError.message);

      let price: number | null = null;

      if (data?.last) {
        price = (data.last.ask + data.last.bid) / 2;
      } else if (data?.price) {
        price = data.price;
      }

      // Fallback to aggregates if quote not authorized
      if (price === null && (data?.status === 'NOT_AUTHORIZED' || data?.message?.includes('not entitled'))) {
        const { data: aggData } = await supabase.functions.invoke('realtime-market', {
          body: { symbol, type: 'aggregates' },
        });
        if (aggData?.results?.[0]) {
          price = aggData.results[0].c; // close price
        }
      } else if (data?.results?.[0]) {
        price = data.results[0].c;
      }

      if (price !== null) {
        const q: PriceQuote = { price, timestamp: Date.now() };
        priceCache.set(symbol, { quote: q, ts: Date.now() });
        setQuote(q);
        setError(null);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Price fetch error';
      console.error(`useRestPrice(${symbol}):`, msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    if (pollIntervalMs <= 0) return; // No polling when interval is 0 or negative
    fetchPrice();
    intervalRef.current = setInterval(fetchPrice, pollIntervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchPrice, pollIntervalMs]);

  return { quote, loading, error, refetch: fetchPrice };
}
