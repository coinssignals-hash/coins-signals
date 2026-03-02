import { TrendingUp, TrendingDown, Wifi, WifiOff, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState, useRef } from 'react';

// Currency code to country flag code (same as SignalCardV2)
const CURRENCY_FLAGS: Record<string, string> = {
  USD: "us", EUR: "eu", GBP: "gb", JPY: "jp", AUD: "au", CAD: "ca",
  CHF: "ch", NZD: "nz", CNY: "cn", SGD: "sg", HKD: "hk", SEK: "se",
  NOK: "no", MXN: "mx", ZAR: "za", BRL: "br", INR: "in", KRW: "kr",
  TRY: "tr", PLN: "pl", CZK: "cz", HUF: "hu", ILS: "il", THB: "th",
  PHP: "ph", IDR: "id", MYR: "my", CLP: "cl", COP: "co", ARS: "ar",
  PEN: "pe", SAR: "sa", AED: "ae", KWD: "kw", QAR: "qa", OMR: "om",
  BHD: "bh", JOD: "jo", EGP: "eg", NGN: "ng", KES: "ke", RUB: "ru",
  DKK: "dk",
};

// Crypto symbols fallback
const CRYPTO_SYMBOLS: Record<string, string> = {
  BTC: '₿', ETH: 'Ξ', XRP: '✕', SOL: '◎', BNB: '◆', ADA: '₳',
  DOGE: 'Ð', DOT: '●', AVAX: 'A', MATIC: '⬡', LINK: '⬡', LTC: 'Ł',
  SHIB: '🐕', PEPE: '🐸', XAU: '🥇', XAG: '🥈',
};

const CRYPTO_COLORS: Record<string, string> = {
  BTC: 'bg-orange-500', ETH: 'bg-indigo-600', XRP: 'bg-gray-800',
  SOL: 'bg-purple-500', BNB: 'bg-yellow-500', ADA: 'bg-blue-500',
  DOGE: 'bg-yellow-500', DOT: 'bg-pink-600', LTC: 'bg-gray-500',
  XAU: 'bg-yellow-500', XAG: 'bg-gray-400',
};

// Animated currency icon using FlagCDN (like signal cards)
const CurrencyIcon = ({ code, isAnimating, delay = 0, position }: { code: string; isAnimating: boolean; delay?: number; position: 'base' | 'quote' }) => {
  const [show, setShow] = useState(!isAnimating);
  const flagCode = CURRENCY_FLAGS[code?.toUpperCase()];
  const cryptoSymbol = CRYPTO_SYMBOLS[code?.toUpperCase()];
  const cryptoColor = CRYPTO_COLORS[code?.toUpperCase()] || 'bg-gray-600';
  
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
        "absolute w-14 h-14 rounded-full overflow-hidden shadow-xl transition-all",
        !flagCode && cryptoColor,
        !flagCode && "flex items-center justify-center",
        position === 'base' ? "bottom-0 left-0 z-10" : "top-0 right-0",
        show ? "opacity-100" : "opacity-0",
        isAnimating && show && position === 'base' && "animate-scale-bounce",
        isAnimating && show && position === 'quote' && "animate-flip-in"
      )}
      style={{ 
        borderWidth: '2px', 
        borderColor: 'hsla(0, 0%, 100%, 0.2)',
        animationDelay: `${delay}ms`,
      }}
    >
      {flagCode ? (
        <img 
          src={`https://flagcdn.com/w160/${flagCode}.png`} 
          alt={code} 
          className="w-full h-full object-cover" 
        />
      ) : (
        <span className="text-2xl text-white font-bold">
          {cryptoSymbol || code?.slice(0, 2)}
        </span>
      )}
    </div>
  );
};

// TradingView-style currency pair icon with FlagCDN
const CurrencyPairIcon = ({ base, quote, animate }: { base: string; quote: string; animate?: boolean }) => {
  return (
    <div className={cn(
      "relative w-20 h-16 transition-all duration-500",
      animate && "animate-scale-in"
    )}>
      <CurrencyIcon code={base} isAnimating={!!animate} delay={200} position="base" />
      <CurrencyIcon code={quote} isAnimating={!!animate} delay={100} position="quote" />
    </div>
  );
};

// Animated number display with rolling effect
const AnimatedPrice = ({ value, decimals = 5, isAnimating, flash }: { value: number; decimals?: number; isAnimating: boolean; flash: 'up' | 'down' | null }) => {
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
      {priceString.split('').map((char, i) => (
        <span 
          key={`${i}-${char}`}
          className={cn(
            "inline-block transition-transform",
            isRolling && "animate-number-roll"
          )}
          style={{ animationDelay: `${i * 20}ms` }}
        >
          {char}
        </span>
      ))}
    </span>
  );
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

  if (loading) {
    return (
      <div className="p-5 overflow-hidden">
        <div className="flex items-center gap-4 animate-pulse">
          <div className="w-20 h-20 rounded-full bg-slate-800/60" />
          <div className="space-y-3 flex-1">
            <div className="h-8 bg-slate-800/40 rounded w-40" />
            <div className="h-4 bg-slate-800/40 rounded w-32" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "relative p-5 transition-all duration-500 overflow-hidden",
      isAnimating && "animate-border-glow",
      !isAnimating && flash === 'up' && "",
      !isAnimating && flash === 'down' && "",
      !isAnimating && !flash && ""
    )}>
      {/* Animated background particles when changing */}
      {isAnimating && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-cyan-500/30 rounded-full animate-ping"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 2) * 40}%`,
                animationDelay: `${i * 100}ms`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
      )}
      
      <div className="relative flex items-center justify-between flex-wrap gap-4">
        {/* Currency Pair Icons */}
        <div className="flex items-center gap-5">
          <CurrencyPairIcon base={base} quote={quote} animate={isAnimating} />
          
          <div className={cn(
            "transition-all duration-500",
            isAnimating && "animate-slide-in-right"
          )}>
            <div className="flex items-baseline gap-3 flex-wrap">
              <AnimatedPrice 
                value={displayPrice} 
                decimals={realtimePrice ? 5 : 4}
                isAnimating={isAnimating}
                flash={flash}
              />
              
              <span className={cn(
                "text-gray-400 text-sm font-medium",
                isAnimating && "animate-fade-in"
              )} style={{ animationDelay: '300ms' }}>
                {displaySymbol}
              </span>
              
              {/* Realtime indicator */}
              <div className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                isRealtimeConnected 
                  ? "bg-green-500/20 text-green-400" 
                  : "bg-gray-500/20 text-gray-400",
                isAnimating && "animate-pop-in"
              )} style={{ animationDelay: '400ms' }}>
                {isRealtimeConnected ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="hidden sm:inline">LIVE</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3" />
                    <span className="hidden sm:inline">DELAYED</span>
                  </>
                )}
              </div>
            </div>
            
            <div className={cn(
              "flex items-center gap-2 text-sm mt-1",
              isPositive ? "text-green-400" : "text-red-400",
              isAnimating && "animate-slide-up"
            )} style={{ animationDelay: '350ms' }}>
              {isPositive ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              <span className="font-medium tabular-nums">{isPositive ? '+' : ''}{change.toFixed(5)}</span>
              <span className={cn(
                "px-1.5 py-0.5 rounded text-xs font-bold",
                isPositive ? "bg-green-500/20" : "bg-red-500/20"
              )}>
                {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* High/Low with animations */}
        <div className={cn(
          "flex items-center gap-6",
          isAnimating && "animate-slide-in-left"
        )} style={{ animationDelay: '250ms' }}>
          <div className="hidden sm:block">
            <svg width="70" height="35" viewBox="0 0 70 35" className="text-green-500/50">
              <defs>
                <linearGradient id="sparklineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="1" />
                </linearGradient>
              </defs>
              <path
                d="M0 30 Q10 28, 15 22 T30 18 T45 12 T55 8 T70 10"
                fill="none"
                stroke="url(#sparklineGrad)"
                strokeWidth="2"
                strokeLinecap="round"
                className={cn(isAnimating && "animate-fade-in")}
              />
            </svg>
          </div>
          
          <div className={cn(
            "text-right transition-all",
            isAnimating && "animate-pop-in"
          )} style={{ animationDelay: '400ms' }}>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">High</div>
            <div className="text-green-400 font-mono text-sm font-semibold tabular-nums">{high.toFixed(4)}</div>
          </div>
          
          <div className={cn(
            "text-right transition-all",
            isAnimating && "animate-pop-in"
          )} style={{ animationDelay: '450ms' }}>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Low</div>
            <div className="text-red-400 font-mono text-sm font-semibold tabular-nums">{low.toFixed(4)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
