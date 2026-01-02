import { useState, useEffect, useCallback, useRef } from 'react';

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
  error: string | null;
  subscribe: (symbols: string[]) => void;
  unsubscribe: (symbols: string[]) => void;
  getQuote: (symbol: string) => RealtimeQuote | null;
}

const WS_URL = `wss://fkaziwfwangiwnduxymf.supabase.co/functions/v1/realtime-market`;

export function useRealtimeMarket(initialSymbols: string[] = []): UseRealtimeMarketReturn {
  const [quotes, setQuotes] = useState<Map<string, RealtimeQuote>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subscribedSymbolsRef = useRef<Set<string>>(new Set(initialSymbols));

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      console.log('Connecting to realtime market WebSocket...');
      wsRef.current = new WebSocket(WS_URL);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
        
        // Subscribe to initial symbols
        if (subscribedSymbolsRef.current.size > 0) {
          wsRef.current?.send(JSON.stringify({
            action: 'subscribe',
            symbols: Array.from(subscribedSymbolsRef.current),
          }));
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Realtime data:', data);

          if (data.type === 'quote' || data.type === 'crypto_quote' || data.type === 'stock_quote') {
            setQuotes(prev => {
              const newQuotes = new Map(prev);
              const existingQuote = newQuotes.get(data.symbol);
              const previousPrice = existingQuote?.price || data.price;
              
              newQuotes.set(data.symbol, {
                symbol: data.symbol,
                price: data.price,
                bid: data.bid,
                ask: data.ask,
                timestamp: data.timestamp,
                change: data.price - previousPrice,
                changePercent: ((data.price - previousPrice) / previousPrice) * 100,
              });
              return newQuotes;
            });
          } else if (data.type === 'error') {
            setError(data.message);
          } else if (data.type === 'connected') {
            console.log('Polygon authenticated:', data.status);
          }
        } catch (e) {
          console.error('Error parsing WebSocket message:', e);
        }
      };

      wsRef.current.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('Connection error');
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Attempt to reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          connect();
        }, 5000);
      };
    } catch (e) {
      console.error('Error creating WebSocket:', e);
      setError('Failed to connect');
    }
  }, []);

  const subscribe = useCallback((symbols: string[]) => {
    symbols.forEach(s => subscribedSymbolsRef.current.add(s));
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: 'subscribe',
        symbols,
      }));
    }
  }, []);

  const unsubscribe = useCallback((symbols: string[]) => {
    symbols.forEach(s => subscribedSymbolsRef.current.delete(s));
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: 'unsubscribe',
        symbols,
      }));
    }
  }, []);

  const getQuote = useCallback((symbol: string): RealtimeQuote | null => {
    return quotes.get(symbol) || null;
  }, [quotes]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  // Subscribe to initial symbols when connected
  useEffect(() => {
    if (isConnected && initialSymbols.length > 0) {
      subscribe(initialSymbols);
    }
  }, [isConnected, initialSymbols, subscribe]);

  return {
    quotes,
    isConnected,
    error,
    subscribe,
    unsubscribe,
    getQuote,
  };
}
