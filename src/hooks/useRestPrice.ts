import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PriceQuote {
  price: number;
  timestamp: number;
  isLive?: boolean;
}

const priceCache = new Map<string, { quote: PriceQuote; ts: number }>();
const CACHE_TTL = 30_000; // 30s
const FETCH_TIMEOUT = 8_000; // 8s max wait

/**
 * Fetches current price via signal-market-data (Alpha Vantage + Finnhub + FMP).
 * Falls back to entryPrice quickly when market is closed or API is slow.
 */
export function useRestPrice(symbol: string, pollIntervalMs = 30_000, fallbackPrice?: number) {
  const [quote, setQuote] = useState<PriceQuote | null>(() => {
    // Instant cache check on mount
    const cached = priceCache.get(symbol);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return cached.quote;
    }
    return null;
  });
  const [loading, setLoading] = useState(!priceCache.has(symbol));
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      // Race between fetch and timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

      const { data, error: fnError } = await supabase.functions.invoke('signal-market-data', {
        body: { symbol },
      });

      clearTimeout(timeoutId);

      if (fnError) throw new Error(fnError.message);

      let price: number | null = null;

      if (data?.price && typeof data.price === 'number') {
        price = data.price;
      } else if (data?.bid && data?.ask) {
        price = (data.bid + data.ask) / 2;
      }

      if (price !== null) {
        const q: PriceQuote = { price, timestamp: Date.now(), isLive: true };
        priceCache.set(symbol, { quote: q, ts: Date.now() });
        setQuote(q);
        setError(null);
      } else if (fallbackPrice) {
        // API returned but no price (market closed) — use fallback
        const q: PriceQuote = { price: fallbackPrice, timestamp: Date.now(), isLive: false };
        priceCache.set(symbol, { quote: q, ts: Date.now() });
        setQuote(q);
        setError(null);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Price fetch error';
      console.error(`useRestPrice(${symbol}):`, msg);
      setError(msg);
      // On error, use fallback price so we don't stay in "loading" forever
      if (fallbackPrice && !quote) {
        const q: PriceQuote = { price: fallbackPrice, timestamp: Date.now(), isLive: false };
        setQuote(q);
      }
    } finally {
      setLoading(false);
    }
  }, [symbol, fallbackPrice]);

  // Set a fast fallback timer: if after 3s we still have no quote, show fallback
  useEffect(() => {
    if (quote || !fallbackPrice || pollIntervalMs <= 0) return;
    fallbackTimerRef.current = setTimeout(() => {
      if (!priceCache.has(symbol) && fallbackPrice) {
        const q: PriceQuote = { price: fallbackPrice, timestamp: Date.now(), isLive: false };
        setQuote(q);
        setLoading(false);
      }
    }, 3000);
    return () => {
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    };
  }, [symbol, fallbackPrice, quote, pollIntervalMs]);

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
