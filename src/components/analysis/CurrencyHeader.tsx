import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

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

// Currency pair icon component with overlapping circles
const CurrencyPairIcon = ({ base, quote }: { base: string; quote: string }) => {
  const baseVisual = getSymbolVisual(base);
  const quoteVisual = getSymbolVisual(quote);
  
  return (
    <div className="relative flex items-center">
      {/* Base currency (front) */}
      <div 
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center z-10 border-2 border-background shadow-lg",
          baseVisual.bgColor
        )}
      >
        <span className={cn("text-lg", baseVisual.textColor || "text-white")}>
          {baseVisual.flag || baseVisual.symbol}
        </span>
      </div>
      {/* Quote currency (back, offset) */}
      <div 
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center -ml-4 border-2 border-background shadow-lg",
          quoteVisual.bgColor
        )}
      >
        <span className={cn("text-lg", quoteVisual.textColor || "text-white")}>
          {quoteVisual.flag || quoteVisual.symbol}
        </span>
      </div>
    </div>
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
}

export function CurrencyHeader({
  symbol,
  currentPrice,
  change,
  changePercent,
  high,
  low,
  loading
}: CurrencyHeaderProps) {
  const isPositive = change >= 0;
  const [base, quote] = symbol.split('/');

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-[#0a1a0a] to-[#0d2a0d] border border-green-900/50 rounded-lg p-4 animate-pulse">
        <div className="h-12 bg-green-900/20 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-[#0a1a0a] to-[#0d2a0d] border border-green-900/50 rounded-lg p-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Currency Pair Icons */}
        <div className="flex items-center gap-4">
          <CurrencyPairIcon base={base} quote={quote} />
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-white">
                {currentPrice.toFixed(4)}
              </span>
              <span className="text-gray-400 text-sm">{symbol}</span>
            </div>
            <div className={cn(
              "flex items-center gap-2 text-sm",
              isPositive ? "text-green-400" : "text-red-400"
            )}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{isPositive ? '+' : ''}{change.toFixed(5)}</span>
              <span>({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)</span>
            </div>
          </div>
        </div>

        {/* Mini sparkline placeholder + High/Low */}
        <div className="flex items-center gap-6">
          <div className="hidden sm:block">
            <svg width="60" height="30" viewBox="0 0 60 30" className="text-green-500">
              <path
                d="M0 25 Q15 20, 20 15 T35 10 T50 5 T60 8"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">Alto Alcanzado</div>
            <div className="text-green-400 font-mono text-sm">{high.toFixed(4)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">Bajo Alcanzado</div>
            <div className="text-red-400 font-mono text-sm">{low.toFixed(4)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
