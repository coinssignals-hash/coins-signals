import { TrendingUp, TrendingDown, Wifi, WifiOff, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState, useRef } from 'react';

// Currency/Asset visual mapping with flags and logos
const symbolVisuals: Record<string, { flag?: string; symbol?: string; bgColor: string; textColor?: string }> = {
  // Fiat currencies with flag emojis
  EUR: { flag: '🇪🇺', bgColor: 'bg-blue-600' },
  USD: { flag: '🇺🇸', bgColor: 'bg-blue-700' },
  GBP: { flag: '🇬🇧', bgColor: 'bg-blue-800' },
  JPY: { flag: '🇯🇵', bgColor: 'bg-white', textColor: 'text-red-600' },
  CHF: { flag: '🇨🇭', bgColor: 'bg-red-600' },
  AUD: { flag: '🇦🇺', bgColor: 'bg-blue-900' },
  CAD: { flag: '🇨🇦', bgColor: 'bg-red-600' },
  NZD: { flag: '🇳🇿', bgColor: 'bg-blue-800' },
  CNY: { flag: '🇨🇳', bgColor: 'bg-red-600' },
  HKD: { flag: '🇭🇰', bgColor: 'bg-red-500' },
  SGD: { flag: '🇸🇬', bgColor: 'bg-red-600' },
  SEK: { flag: '🇸🇪', bgColor: 'bg-blue-500' },
  NOK: { flag: '🇳🇴', bgColor: 'bg-red-600' },
  DKK: { flag: '🇩🇰', bgColor: 'bg-red-500' },
  MXN: { flag: '🇲🇽', bgColor: 'bg-green-700' },
  ZAR: { flag: '🇿🇦', bgColor: 'bg-green-600' },
  TRY: { flag: '🇹🇷', bgColor: 'bg-red-600' },
  RUB: { flag: '🇷🇺', bgColor: 'bg-blue-600' },
  INR: { flag: '🇮🇳', bgColor: 'bg-orange-500' },
  BRL: { flag: '🇧🇷', bgColor: 'bg-green-500' },
  PLN: { flag: '🇵🇱', bgColor: 'bg-red-600' },
  CZK: { flag: '🇨🇿', bgColor: 'bg-blue-600' },
  HUF: { flag: '🇭🇺', bgColor: 'bg-red-600' },
  ILS: { flag: '🇮🇱', bgColor: 'bg-blue-500' },
  THB: { flag: '🇹🇭', bgColor: 'bg-blue-600' },
  KRW: { flag: '🇰🇷', bgColor: 'bg-white', textColor: 'text-red-600' },
  PHP: { flag: '🇵🇭', bgColor: 'bg-blue-600' },
  IDR: { flag: '🇮🇩', bgColor: 'bg-red-600' },
  MYR: { flag: '🇲🇾', bgColor: 'bg-blue-600' },
  CLP: { flag: '🇨🇱', bgColor: 'bg-blue-600' },
  COP: { flag: '🇨🇴', bgColor: 'bg-yellow-500' },
  ARS: { flag: '🇦🇷', bgColor: 'bg-blue-400' },
  PEN: { flag: '🇵🇪', bgColor: 'bg-red-600' },
  SAR: { flag: '🇸🇦', bgColor: 'bg-green-600' },
  AED: { flag: '🇦🇪', bgColor: 'bg-green-600' },
  KWD: { flag: '🇰🇼', bgColor: 'bg-green-600' },
  QAR: { flag: '🇶🇦', bgColor: 'bg-purple-800' },
  OMR: { flag: '🇴🇲', bgColor: 'bg-red-600' },
  BHD: { flag: '🇧🇭', bgColor: 'bg-red-600' },
  JOD: { flag: '🇯🇴', bgColor: 'bg-green-600' },
  EGP: { flag: '🇪🇬', bgColor: 'bg-red-600' },
  NGN: { flag: '🇳🇬', bgColor: 'bg-green-600' },
  KES: { flag: '🇰🇪', bgColor: 'bg-black' },
  
  // Cryptocurrencies with symbols
  BTC: { symbol: '₿', bgColor: 'bg-orange-500' },
  ETH: { symbol: 'Ξ', bgColor: 'bg-indigo-600' },
  XRP: { symbol: '✕', bgColor: 'bg-gray-800' },
  SOL: { symbol: '◎', bgColor: 'bg-gradient-to-br from-purple-500 to-teal-400' },
  BNB: { symbol: '◆', bgColor: 'bg-yellow-500', textColor: 'text-black' },
  ADA: { symbol: '₳', bgColor: 'bg-blue-500' },
  DOGE: { symbol: 'Ð', bgColor: 'bg-yellow-500', textColor: 'text-black' },
  DOT: { symbol: '●', bgColor: 'bg-pink-600' },
  AVAX: { symbol: 'A', bgColor: 'bg-red-600' },
  MATIC: { symbol: '⬡', bgColor: 'bg-purple-600' },
  POL: { symbol: '⬡', bgColor: 'bg-purple-600' },
  LINK: { symbol: '⬡', bgColor: 'bg-blue-600' },
  UNI: { symbol: '🦄', bgColor: 'bg-pink-500' },
  ATOM: { symbol: '⚛', bgColor: 'bg-indigo-700' },
  LTC: { symbol: 'Ł', bgColor: 'bg-gray-500' },
  XLM: { symbol: '✦', bgColor: 'bg-black' },
  SHIB: { symbol: '🐕', bgColor: 'bg-orange-600' },
  PEPE: { symbol: '🐸', bgColor: 'bg-green-600' },
  ARB: { symbol: 'A', bgColor: 'bg-blue-500' },
  OP: { symbol: 'O', bgColor: 'bg-red-500' },
  APT: { symbol: 'A', bgColor: 'bg-teal-500' },
  SUI: { symbol: 'S', bgColor: 'bg-blue-400' },
  FTM: { symbol: '👻', bgColor: 'bg-blue-600' },
  NEAR: { symbol: 'N', bgColor: 'bg-black' },
  INJ: { symbol: '💉', bgColor: 'bg-blue-500' },
  TIA: { symbol: '◐', bgColor: 'bg-purple-500' },
  SEI: { symbol: 'S', bgColor: 'bg-red-500' },
  AAVE: { symbol: '👻', bgColor: 'bg-purple-600' },
  MKR: { symbol: 'M', bgColor: 'bg-teal-600' },
  CRV: { symbol: '↺', bgColor: 'bg-red-500' },
  SNX: { symbol: 'S', bgColor: 'bg-blue-600' },
  COMP: { symbol: 'C', bgColor: 'bg-green-500' },
  SUSHI: { symbol: '🍣', bgColor: 'bg-pink-500' },
  YFI: { symbol: 'Y', bgColor: 'bg-blue-500' },
  CAKE: { symbol: '🥞', bgColor: 'bg-yellow-600' },
  GMX: { symbol: 'G', bgColor: 'bg-blue-600' },
  USDT: { symbol: '₮', bgColor: 'bg-green-500' },
  USDC: { symbol: '$', bgColor: 'bg-blue-500' },
  DAI: { symbol: '◈', bgColor: 'bg-yellow-500', textColor: 'text-black' },
  FRAX: { symbol: 'F', bgColor: 'bg-gray-800' },
  TUSD: { symbol: 'T', bgColor: 'bg-blue-600' },
  BUSD: { symbol: 'B', bgColor: 'bg-yellow-500', textColor: 'text-black' },
  HBAR: { symbol: 'ℏ', bgColor: 'bg-black' },
  FIL: { symbol: '⌘', bgColor: 'bg-blue-500' },
  LDO: { symbol: 'L', bgColor: 'bg-blue-400' },
  RNDR: { symbol: 'R', bgColor: 'bg-red-500' },
  IMX: { symbol: 'I', bgColor: 'bg-blue-600' },
  GRT: { symbol: 'G', bgColor: 'bg-purple-600' },
  STX: { symbol: 'S', bgColor: 'bg-orange-500' },
  ALGO: { symbol: 'A', bgColor: 'bg-black' },
  VET: { symbol: 'V', bgColor: 'bg-blue-500' },
  SAND: { symbol: 'S', bgColor: 'bg-blue-400' },
  MANA: { symbol: 'M', bgColor: 'bg-red-500' },
  AXS: { symbol: 'A', bgColor: 'bg-blue-600' },
  ENJ: { symbol: 'E', bgColor: 'bg-purple-500' },
  
  // Commodities & Indices
  XAU: { symbol: '🥇', bgColor: 'bg-yellow-500' },
  XAG: { symbol: '🥈', bgColor: 'bg-gray-400' },
  OIL: { symbol: '🛢️', bgColor: 'bg-black' },
  BRENT: { symbol: '🛢️', bgColor: 'bg-gray-800' },
  WTI: { symbol: '🛢️', bgColor: 'bg-black' },
  NATGAS: { symbol: '🔥', bgColor: 'bg-blue-500' },
  COPPER: { symbol: '🟤', bgColor: 'bg-orange-700' },
  WHEAT: { symbol: '🌾', bgColor: 'bg-yellow-600' },
  CORN: { symbol: '🌽', bgColor: 'bg-yellow-500' },
  
  // Major Stocks
  AAPL: { symbol: '', bgColor: 'bg-gray-800' },
  GOOGL: { symbol: 'G', bgColor: 'bg-blue-500' },
  MSFT: { symbol: '⊞', bgColor: 'bg-blue-600' },
  AMZN: { symbol: 'a', bgColor: 'bg-orange-500' },
  TSLA: { symbol: 'T', bgColor: 'bg-red-600' },
  NVDA: { symbol: 'NV', bgColor: 'bg-green-600' },
  META: { symbol: '∞', bgColor: 'bg-blue-600' },
};

const getSymbolVisual = (code: string): { flag?: string; symbol?: string; bgColor: string; textColor?: string } => {
  const upperCode = code?.toUpperCase() || '';
  return symbolVisuals[upperCode] || { symbol: upperCode.slice(0, 2), bgColor: 'bg-gray-600' };
};

// Animated currency icon with elaborate entrance
const CurrencyIcon = ({ code, isAnimating, delay = 0, position }: { code: string; isAnimating: boolean; delay?: number; position: 'base' | 'quote' }) => {
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
      }}
    >
      <span className={cn(
        "text-2xl transition-all duration-300",
        visual.textColor || "text-white",
        isAnimating && show && "animate-pop-in"
      )} style={{ animationDelay: `${delay + 100}ms` }}>
        {visual.flag || visual.symbol}
      </span>
    </div>
  );
};

// TradingView-style currency pair icon with elaborate animations
const CurrencyPairIcon = ({ base, quote, animate }: { base: string; quote: string; animate?: boolean }) => {
  return (
    <div className={cn(
      "relative w-20 h-20 transition-all duration-500",
      animate && "animate-scale-in"
    )}>
      {/* Glow effect when animating */}
      {animate && (
        <div className="absolute inset-0 rounded-full bg-green-500/20 blur-xl animate-pulse" />
      )}
      
      <CurrencyIcon code={quote} isAnimating={!!animate} delay={100} position="quote" />
      <CurrencyIcon code={base} isAnimating={!!animate} delay={200} position="base" />
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
      <div className="bg-gradient-to-r from-[#0a1a0a] to-[#0d2a0d] border border-green-900/50 rounded-xl p-5 overflow-hidden">
        <div className="flex items-center gap-4 animate-pulse">
          <div className="w-20 h-20 rounded-full bg-green-900/30" />
          <div className="space-y-3 flex-1">
            <div className="h-8 bg-green-900/20 rounded w-40" />
            <div className="h-4 bg-green-900/20 rounded w-32" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "relative bg-gradient-to-r from-[#0a1a0a] to-[#0d2a0d] border rounded-xl p-5 transition-all duration-500 overflow-hidden",
      isAnimating && "border-green-500/70 animate-border-glow shadow-glow-green",
      !isAnimating && flash === 'up' && "border-green-500/50",
      !isAnimating && flash === 'down' && "border-red-500/50",
      !isAnimating && !flash && "border-green-900/50"
    )}>
      {/* Animated background particles when changing */}
      {isAnimating && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-green-500/30 rounded-full animate-ping"
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
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Máximo</div>
            <div className="text-green-400 font-mono text-sm font-semibold tabular-nums">{high.toFixed(4)}</div>
          </div>
          
          <div className={cn(
            "text-right transition-all",
            isAnimating && "animate-pop-in"
          )} style={{ animationDelay: '450ms' }}>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Mínimo</div>
            <div className="text-red-400 font-mono text-sm font-semibold tabular-nums">{low.toFixed(4)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
