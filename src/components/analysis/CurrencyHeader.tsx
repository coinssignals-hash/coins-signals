import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

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
        {/* Currency Info */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">€</span>
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
