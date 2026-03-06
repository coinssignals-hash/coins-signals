import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RealtimeQuote {
  symbol: string;
  price: number;
  bid?: number;
  ask?: number;
  timestamp: number;
  change?: number;
  changePercent?: number;
}

interface UseRealtimeMarketReturn {
  quotes: Map<string, RealtimeQuote>;
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempt: number;
  error: string | null;
  countdown: number;
  subscribe: (symbols: string[]) => void;
  unsubscribe: (symbols: string[]) => void;
  getQuote: (symbol: string) => RealtimeQuote | null;
}

/**
 * Uses REST polling via the realtime-market edge function as a reliable fallback.
 * WebSocket connections to Polygon require POLYGON_API_KEY which may not be configured.
 */
export function useRealtimeMarket(initialSymbols: string[] = []): UseRealtimeMarketReturn {
  const POLL_INTERVAL = 15000;
  const [quotes, setQuotes] = useState<Map<string, RealtimeQuote>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting] = useState(false);
  const [reconnectAttempt] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(POLL_INTERVAL / 1000);
  const subscribedSymbolsRef = useRef<Set<string>>(new Set(initialSymbols));
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchQuote = useCallback(async (symbol: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('realtime-market', {
        body: { symbol, type: 'quote' },
      });
      if (fnError) throw fnError;

      const price = data?.price ?? data?.last?.price ?? data?.results?.[0]?.c;
      if (typeof price === 'number') {
        setQuotes(prev => {
          const newQuotes = new Map(prev);
          const existing = newQuotes.get(symbol);
          const previousPrice = existing?.price || price;
          newQuotes.set(symbol, {
            symbol,
            price,
            bid: data?.bid ?? data?.last?.bid,
            ask: data?.ask ?? data?.last?.ask,
            timestamp: Date.now(),
            change: price - previousPrice,
            changePercent: previousPrice ? ((price - previousPrice) / previousPrice) * 100 : 0,
          });
          return newQuotes;
        });
      }
    } catch (err) {
      // Silent fail for individual symbol fetch
    }
  }, []);

  const pollSymbols = useCallback(() => {
    const symbols = Array.from(subscribedSymbolsRef.current);
    if (symbols.length === 0) return;
    // Fetch sequentially with small delay to avoid flooding
    symbols.forEach((symbol, i) => {
      setTimeout(() => fetchQuote(symbol), i * 500);
    });
  }, [fetchQuote]);

  const subscribe = useCallback((symbols: string[]) => {
    symbols.forEach(s => subscribedSymbolsRef.current.add(s));
  }, []);

  const unsubscribe = useCallback((symbols: string[]) => {
    symbols.forEach(s => subscribedSymbolsRef.current.delete(s));
  }, []);

  const getQuote = useCallback((symbol: string): RealtimeQuote | null => {
    return quotes.get(symbol) || null;
  }, [quotes]);

  // Start/stop polling based on page visibility
  const startPolling = useCallback(() => {
    if (intervalRef.current) return;
    setCountdown(POLL_INTERVAL / 1000);
    pollSymbols();
    intervalRef.current = setInterval(() => {
      setCountdown(POLL_INTERVAL / 1000);
      pollSymbols();
    }, POLL_INTERVAL);
    // Countdown ticker every second
    countdownRef.current = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1));
    }, 1000);
    setIsConnected(true);
  }, [pollSymbols]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (initialSymbols.length === 0) return;

    initialSymbols.forEach(s => subscribedSymbolsRef.current.add(s));

    // Only poll when page is visible
    if (document.visibilityState === 'visible') {
      startPolling();
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        startPolling();
      } else {
        stopPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      stopPolling();
    };
  }, [initialSymbols.join(','), startPolling, stopPolling]);

  return {
    quotes,
    isConnected,
    isReconnecting,
    reconnectAttempt,
    error,
    countdown,
    subscribe,
    unsubscribe,
    getQuote,
  };
}
