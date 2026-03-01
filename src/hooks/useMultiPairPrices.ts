import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MultiPairQuote {
  symbol: string;
  price: number;
  prevClose: number;
  change: number;
  changePercent: number;
  loading: boolean;
  error: boolean;
}

const MAJOR_PAIRS = [
  { symbol: 'C:EURUSD', display: 'EUR/USD', prevClose: 1.0850 },
  { symbol: 'C:GBPUSD', display: 'GBP/USD', prevClose: 1.2650 },
  { symbol: 'C:USDJPY', display: 'USD/JPY', prevClose: 149.50 },
  { symbol: 'C:AUDUSD', display: 'AUD/USD', prevClose: 0.6550 },
  { symbol: 'C:USDCAD', display: 'USD/CAD', prevClose: 1.3580 },
  { symbol: 'C:USDCHF', display: 'USD/CHF', prevClose: 0.8780 },
];

const quoteCache = new Map<string, { price: number; ts: number }>();
const CACHE_TTL = 30_000;

export function useMultiPairPrices(pollIntervalMs = 60_000) {
  const [quotes, setQuotes] = useState<MultiPairQuote[]>(
    MAJOR_PAIRS.map(p => ({
      symbol: p.display,
      price: p.prevClose,
      prevClose: p.prevClose,
      change: 0,
      changePercent: 0,
      loading: true,
      error: false,
    }))
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async () => {
    const results = await Promise.allSettled(
      MAJOR_PAIRS.map(async (pair) => {
        // Check cache
        const cached = quoteCache.get(pair.symbol);
        if (cached && Date.now() - cached.ts < CACHE_TTL) {
          return { symbol: pair.display, price: cached.price, prevClose: pair.prevClose };
        }

        try {
          const { data, error } = await supabase.functions.invoke('realtime-market', {
            body: { symbol: pair.symbol, type: 'aggregates' },
          });

          if (error) throw error;

          let price: number | null = null;

          if (data?.last) {
            price = (data.last.ask + data.last.bid) / 2;
          } else if (data?.price) {
            price = data.price;
          } else if (data?.results?.[0]) {
            price = data.results[0].c;
          }

          if (price !== null) {
            quoteCache.set(pair.symbol, { price, ts: Date.now() });
            return { symbol: pair.display, price, prevClose: pair.prevClose };
          }

          throw new Error('No price data');
        } catch {
          // Return cached or fallback
          const fallback = quoteCache.get(pair.symbol);
          return {
            symbol: pair.display,
            price: fallback?.price ?? pair.prevClose,
            prevClose: pair.prevClose,
            error: true,
          };
        }
      })
    );

    setQuotes(
      results.map((r, i) => {
        if (r.status === 'fulfilled') {
          const { symbol, price, prevClose } = r.value;
          const change = price - prevClose;
          const changePercent = (change / prevClose) * 100;
          return {
            symbol,
            price,
            prevClose,
            change,
            changePercent,
            loading: false,
            error: 'error' in r.value && !!r.value.error,
          };
        }
        return {
          ...MAJOR_PAIRS[i],
          symbol: MAJOR_PAIRS[i].display,
          price: MAJOR_PAIRS[i].prevClose,
          prevClose: MAJOR_PAIRS[i].prevClose,
          change: 0,
          changePercent: 0,
          loading: false,
          error: true,
        };
      })
    );
  }, []);

  useEffect(() => {
    fetchAll();
    intervalRef.current = setInterval(fetchAll, pollIntervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchAll, pollIntervalMs]);

  return { quotes, refetch: fetchAll };
}
