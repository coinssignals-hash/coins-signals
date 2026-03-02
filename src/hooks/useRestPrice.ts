import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PriceQuote {
  price: number;
  timestamp: number;
}

const priceCache = new Map<string, { quote: PriceQuote; ts: number }>();
const CACHE_TTL = 30_000; // 30s

/**
 * Fetches current price via signal-market-data (Alpha Vantage + Finnhub + FMP).
 * Falls back gracefully — no Polygon/WebSocket dependency.
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
      const { data, error: fnError } = await supabase.functions.invoke('signal-market-data', {
        body: { symbol },
      });

      if (fnError) throw new Error(fnError.message);

      let price: number | null = null;

      // signal-market-data returns { price, bid, ask, ... }
      if (data?.price && typeof data.price === 'number') {
        price = data.price;
      } else if (data?.bid && data?.ask) {
        price = (data.bid + data.ask) / 2;
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
    if (pollIntervalMs <= 0) return;
    fetchPrice();
    intervalRef.current = setInterval(fetchPrice, pollIntervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchPrice, pollIntervalMs]);

  return { quote, loading, error, refetch: fetchPrice };
}
