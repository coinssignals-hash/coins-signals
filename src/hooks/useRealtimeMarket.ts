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
  subscribe: (symbols: string[]) => void;
  unsubscribe: (symbols: string[]) => void;
  getQuote: (symbol: string) => RealtimeQuote | null;
}

/**
 * Uses REST polling via the realtime-market edge function as a reliable fallback.
 * WebSocket connections to Polygon require POLYGON_API_KEY which may not be configured.
 */
export function useRealtimeMarket(initialSymbols: string[] = []): UseRealtimeMarketReturn {
  const [quotes, setQuotes] = useState<Map<string, RealtimeQuote>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting] = useState(false);
  const [reconnectAttempt] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const subscribedSymbolsRef = useRef<Set<string>>(new Set(initialSymbols));
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

  useEffect(() => {
    if (initialSymbols.length === 0) return;

    initialSymbols.forEach(s => subscribedSymbolsRef.current.add(s));
    
    // Initial fetch
    pollSymbols();
    setIsConnected(true);

    // Poll every 5 seconds for real-time updates
    intervalRef.current = setInterval(pollSymbols, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsConnected(false);
    };
  }, [initialSymbols.join(','), pollSymbols]);

  return {
    quotes,
    isConnected,
    isReconnecting,
    reconnectAttempt,
    error,
    subscribe,
    unsubscribe,
    getQuote,
  };
}
