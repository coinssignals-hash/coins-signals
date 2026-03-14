import { cn, formatPrice, getDecimals } from '@/lib/utils';
import { useEffect, useState, useRef } from 'react';

// Animated currency icon with elaborate entrance
const CurrencyIcon = ({ code, isAnimating, delay = 0, position }: {code: string;isAnimating: boolean;delay?: number;position: 'base' | 'quote';}) => {
  const visual = getSymbolVisual(code);
  const [show, setShow] = useState(!isAnimating);

  useEffect(() => {
    if (isAnimating) {
      setShow(false);
      const timer = setTimeout(() => setShow(true), delay);
      return () => clearTimeout(timer);
    } else {
      setShow(true);
    }
  }, [isAnimating, delay]);

  return (
    <div
      className={cn(
        "absolute w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all",
        visual.bgColor,
        position === 'base' ? "bottom-0 left-0 z-10" : "top-0 right-0",
        show ? "opacity-100" : "opacity-0",
        isAnimating && show && position === 'base' && "animate-scale-bounce",
        isAnimating && show && position === 'quote' && "animate-flip-in"
      )}
      style={{
        borderWidth: '3px',
        borderColor: 'hsl(var(--background))',
        animationDelay: `${delay}ms`,
        perspective: '1000px'
      }}>

      <span className={cn(
        "text-2xl transition-all duration-300",
        visual.textColor || "text-white",
        isAnimating && show && "animate-pop-in"
      )} style={{ animationDelay: `${delay + 100}ms` }}>
        {visual.flag || visual.symbol}
      </span>
    </div>);

};

// TradingView-style currency pair icon with elaborate animations
const CurrencyPairIcon = ({ base, quote, animate }: {base: string;quote: string;animate?: boolean;}) => {
  return (
    <div className={cn(
      "relative w-20 h-20 transition-all duration-500",
      animate && "animate-scale-in"
    )}>
      {/* Glow effect when animating */}
      {animate &&
      <div className="absolute inset-0 rounded-full bg-green-500/20 blur-xl animate-pulse" />
      }
      
      <CurrencyIcon code={quote} isAnimating={!!animate} delay={100} position="quote" />
      <CurrencyIcon code={base} isAnimating={!!animate} delay={200} position="base" />
    </div>);

};

// Animated number display with rolling effect
const AnimatedPrice = ({ value, decimals = 5, isAnimating, flash }: {value: number;decimals?: number;isAnimating: boolean;flash: 'up' | 'down' | null;}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isRolling, setIsRolling] = useState(false);

  useEffect(() => {
    if (isAnimating) {
      setIsRolling(true);
      const timer = setTimeout(() => {
        setDisplayValue(value);
        setIsRolling(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setDisplayValue(value);
    }
  }, [value, isAnimating]);

  const priceString = displayValue.toFixed(decimals);

  return (
    <span className={cn(
      "text-2xl sm:text-3xl font-bold tabular-nums transition-colors duration-300 inline-flex overflow-hidden",
      flash === 'up' && "text-green-400",
      flash === 'down' && "text-red-400",
      !flash && "text-white"
    )}>
      {priceString.split('').map((char, i) =>
      <span
        key={`${i}-${char}`}
        className={cn(
          "inline-block transition-transform",
          isRolling && "animate-number-roll"
        )}
        style={{ animationDelay: `${i * 20}ms` }}>

          {char}
        </span>
      )}
    </span>);

};

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