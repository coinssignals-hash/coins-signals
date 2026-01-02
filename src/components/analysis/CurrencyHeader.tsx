import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Currency/Asset symbol mapping
const symbolMap: Record<string, { symbol: string; color: string }> = {
  // Fiat currencies
  EUR: { symbol: '€', color: 'bg-blue-600' },
  USD: { symbol: '$', color: 'bg-green-600' },
  GBP: { symbol: '£', color: 'bg-purple-600' },
  JPY: { symbol: '¥', color: 'bg-red-600' },
  CHF: { symbol: '₣', color: 'bg-red-500' },
  AUD: { symbol: 'A$', color: 'bg-yellow-600' },
  CAD: { symbol: 'C$', color: 'bg-red-600' },
  NZD: { symbol: 'NZ$', color: 'bg-black' },
  CNY: { symbol: '¥', color: 'bg-red-700' },
  HKD: { symbol: 'HK$', color: 'bg-red-500' },
  SGD: { symbol: 'S$', color: 'bg-red-600' },
  SEK: { symbol: 'kr', color: 'bg-blue-500' },
  NOK: { symbol: 'kr', color: 'bg-red-600' },
  DKK: { symbol: 'kr', color: 'bg-red-500' },
  MXN: { symbol: '$', color: 'bg-green-700' },
  ZAR: { symbol: 'R', color: 'bg-green-600' },
  TRY: { symbol: '₺', color: 'bg-red-600' },
  RUB: { symbol: '₽', color: 'bg-blue-600' },
  INR: { symbol: '₹', color: 'bg-orange-600' },
  BRL: { symbol: 'R$', color: 'bg-green-500' },
  PLN: { symbol: 'zł', color: 'bg-red-600' },
  // Cryptocurrencies
  BTC: { symbol: '₿', color: 'bg-orange-500' },
  ETH: { symbol: 'Ξ', color: 'bg-indigo-600' },
  XRP: { symbol: 'XRP', color: 'bg-gray-700' },
  SOL: { symbol: 'SOL', color: 'bg-gradient-to-r from-purple-500 to-teal-400' },
  BNB: { symbol: 'BNB', color: 'bg-yellow-500' },
  ADA: { symbol: 'ADA', color: 'bg-blue-500' },
  DOGE: { symbol: 'Ð', color: 'bg-yellow-600' },
  DOT: { symbol: 'DOT', color: 'bg-pink-600' },
  AVAX: { symbol: 'AVAX', color: 'bg-red-600' },
  MATIC: { symbol: 'MATIC', color: 'bg-purple-600' },
  LINK: { symbol: 'LINK', color: 'bg-blue-600' },
  UNI: { symbol: 'UNI', color: 'bg-pink-500' },
  ATOM: { symbol: 'ATOM', color: 'bg-indigo-700' },
  LTC: { symbol: 'Ł', color: 'bg-gray-500' },
  XLM: { symbol: 'XLM', color: 'bg-black' },
  SHIB: { symbol: 'SHIB', color: 'bg-orange-600' },
  PEPE: { symbol: '🐸', color: 'bg-green-600' },
  // Commodities & Indices
  XAU: { symbol: '🥇', color: 'bg-yellow-500' },
  XAG: { symbol: '🥈', color: 'bg-gray-400' },
  OIL: { symbol: '🛢️', color: 'bg-black' },
  // Stocks (examples)
  AAPL: { symbol: '', color: 'bg-gray-800' },
  GOOGL: { symbol: 'G', color: 'bg-blue-500' },
  MSFT: { symbol: 'M', color: 'bg-blue-600' },
  AMZN: { symbol: 'A', color: 'bg-orange-500' },
  TSLA: { symbol: 'T', color: 'bg-red-600' },
  NVDA: { symbol: 'NV', color: 'bg-green-600' },
  META: { symbol: 'M', color: 'bg-blue-600' },
};

const getSymbolInfo = (code: string): { symbol: string; color: string } => {
  const upperCode = code?.toUpperCase() || '';
  return symbolMap[upperCode] || { symbol: upperCode.slice(0, 2), color: 'bg-gray-600' };
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
  const baseInfo = getSymbolInfo(base);

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
        {/* Currency Info */}
        <div className="flex items-center gap-4">
          <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", baseInfo.color)}>
            <span className="text-white font-bold text-lg">{baseInfo.symbol}</span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-white">
                {currentPrice.toFixed(4)}
              </span>
              <span className="text-gray-400 text-sm">{quote}</span>
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
