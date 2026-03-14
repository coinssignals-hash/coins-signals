import { useEffect, useState, useRef } from 'react';
interface CurrencyHeaderProps {
  symbol: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  loading?: boolean;
  realtimePrice?: number | null;
  isRealtimeConnected?: boolean;
}

export function CurrencyHeader({
  symbol,
  currentPrice,
  change,
  changePercent,
  high,
  low,
  loading,
  realtimePrice,
  isRealtimeConnected = false
}: CurrencyHeaderProps) {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const displayPrice = realtimePrice ?? currentPrice;
  const isPositive = change >= 0;
  const [base, quote] = symbol.split('/');
  const [isAnimating, setIsAnimating] = useState(false);
  const [displaySymbol, setDisplaySymbol] = useState(symbol);
  const prevSymbolRef = useRef(symbol);

  // Flash animation when price changes
  useEffect(() => {
    if (realtimePrice !== null && lastPrice !== null && realtimePrice !== lastPrice) {
      const direction = realtimePrice > lastPrice ? 'up' : 'down';
      setFlash(direction);
      const timer = setTimeout(() => setFlash(null), 500);
      return () => clearTimeout(timer);
    }
    if (realtimePrice !== null) {
      setLastPrice(realtimePrice);
    }
  }, [realtimePrice, lastPrice]);

  // Elaborate animation when symbol changes
  useEffect(() => {
    if (symbol !== prevSymbolRef.current) {
      setIsAnimating(true);
      prevSymbolRef.current = symbol;

      // Staggered update for smooth transition
      const timer1 = setTimeout(() => setDisplaySymbol(symbol), 150);
      const timer2 = setTimeout(() => setIsAnimating(false), 800);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [symbol]);

  return null;
}