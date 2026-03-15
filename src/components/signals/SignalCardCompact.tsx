import { memo } from 'react';
import { TradingSignal } from '@/hooks/useSignals';
import { TrendingUp, TrendingDown, Heart, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRestPrice } from '@/hooks/useRestPrice';
import { TargetProgressBar } from '@/components/signals/TargetProgressBar';
import { useSignalAutoClose } from '@/hooks/useSignalAutoClose';

interface SignalCardCompactProps {
  signal: TradingSignal;
  isFavorite?: boolean;
  onToggleFavorite?: (signalId: string) => void;
  onExpand?: () => void;
}

// Currency flag component (simplified)
const FlagIcon = ({ currency, size = 'sm' }: { currency: string; size?: 'sm' | 'md' }) => {
  const flags: Record<string, { bg: string; content: React.ReactNode }> = {
    'EUR': { bg: 'bg-blue-600', content: <span className="text-yellow-400 font-bold text-[8px]">€</span> },
    'USD': { bg: 'bg-gradient-to-b from-red-500 via-white to-blue-600', content: null },
    'GBP': { bg: 'bg-blue-700', content: <span className="text-red-500 font-bold text-[8px]">£</span> },
    'JPY': { bg: 'bg-white', content: <div className="w-2 h-2 bg-red-600 rounded-full" /> },
    'AUD': { bg: 'bg-blue-800', content: <span className="text-white text-[6px]">★</span> },
    'CAD': { bg: 'bg-red-600', content: <span className="text-white text-[8px]">🍁</span> },
    'CHF': { bg: 'bg-red-600', content: <span className="text-white font-bold text-[8px]">+</span> },
    'NZD': { bg: 'bg-blue-900', content: <span className="text-white text-[6px]">★</span> },
    'XAU': { bg: 'bg-gradient-to-br from-yellow-400 to-yellow-600', content: null },
    'BTC': { bg: 'bg-orange-500', content: <span className="text-white font-bold text-[8px]">₿</span> },
  };

  const flag = flags[currency] || { bg: 'bg-gray-500', content: <span className="text-white text-[8px]">{currency.charAt(0)}</span> };
  const sizeClass = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8';

  return (
    <div className={cn(
      "rounded-full flex items-center justify-center border border-white/20 shadow-sm",
      flag.bg,
      sizeClass
    )}>
      {flag.content}
    </div>
  );
};

export const SignalCardCompact = memo(function SignalCardCompact({ signal, isFavorite = false, onToggleFavorite, onExpand }: SignalCardCompactProps) {
  const isBuy = signal.action === 'BUY';
  const formattedTime = format(new Date(signal.datetime), "HH:mm", { locale: es });
  const [base, quote] = signal.currencyPair.split('/');

  const isCompleted = signal.status === 'completed' || signal.status === 'cancelled';
  const symbol = `${base}/${quote}`;
  const { quote: liveQuote } = useRestPrice(symbol, isCompleted ? 0 : 30_000);
  const currentPrice = liveQuote?.price ?? null;

  // Auto-close signal when TP/SL is hit
  useSignalAutoClose({
    signalId: signal.id,
    currencyPair: signal.currencyPair,
    action: signal.action,
    entryPrice: signal.entryPrice,
    takeProfit: signal.takeProfit,
    stopLoss: signal.stopLoss,
    status: signal.status,
    currentPrice,
  });
  const pips = isBuy 
    ? Math.round((signal.takeProfit - signal.entryPrice) * 10000)
    : Math.round((signal.entryPrice - signal.takeProfit) * 10000);

  return (
    <div 
      className={cn(
        "relative bg-slate-900/80 rounded-xl border overflow-hidden transition-all duration-200",
        "hover:bg-slate-800/80 hover:border-slate-600/60 cursor-pointer group",
        isBuy ? "border-emerald-500/30" : "border-rose-500/30"
      )}
      onClick={onExpand}
    >
      {/* Accent line */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-1",
        isBuy ? "bg-emerald-500" : "bg-rose-500"
      )} />
      
      <div className="flex items-center gap-3 px-4 py-3 pl-5">
        {/* Currency Pair with Flags */}
        <div className="flex items-center gap-2 min-w-[100px]">
          <div className="relative">
            <FlagIcon currency={base} size="sm" />
            <FlagIcon currency={quote} size="sm" />
          </div>
          <div>
            <span className="text-white font-bold text-sm">{base}/{quote}</span>
            <div className="flex items-center gap-1 mt-0.5">
              {isBuy ? (
                <TrendingUp className="w-3 h-3 text-emerald-400" />
              ) : (
                <TrendingDown className="w-3 h-3 text-rose-400" />
              )}
              <span className={cn(
                "text-[10px] font-semibold uppercase",
                isBuy ? "text-emerald-400" : "text-rose-400"
              )}>
                {signal.action}
              </span>
            </div>
          </div>
        </div>

        {/* Entry Price */}
        <div className="flex-1 min-w-[80px]">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Entrada</div>
          <div className="text-white font-mono text-sm font-medium tabular-nums">
            {signal.entryPrice}
          </div>
        </div>

        {/* TP/SL Quick View */}
        <div className="flex-1 min-w-[100px] hidden sm:block">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">TP1</div>
              <div className="text-emerald-400 font-mono text-xs tabular-nums">
                {signal.takeProfit}
              </div>
              {signal.takeProfit2 && (
                <div className="text-emerald-400/60 font-mono text-[10px] tabular-nums">
                  TP2: {signal.takeProfit2}
                </div>
              )}
              {signal.takeProfit3 && (
                <div className="text-emerald-400/40 font-mono text-[10px] tabular-nums">
                  TP3: {signal.takeProfit3}
                </div>
              )}
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">SL</div>
              <div className="text-rose-400 font-mono text-xs tabular-nums">
                {signal.stopLoss}
              </div>
            </div>
          </div>
        </div>

        {/* Pips & Probability */}
        <div className="flex items-center gap-3">
          <div className="text-center min-w-[50px]">
            <div className={cn(
              "text-sm font-bold tabular-nums",
              isBuy ? "text-emerald-400" : "text-rose-400"
            )}>
              +{pips}
            </div>
            <div className="text-[9px] text-slate-500 uppercase tabular-nums">Pips</div>
          </div>

          {/* Probability Circle (enhanced) */}
          <div className="relative w-11 h-11 flex-shrink-0">
            {/* Outer glow */}
            <div className={cn(
              "absolute -inset-1 rounded-full opacity-25 blur-md",
              isBuy ? "bg-emerald-500" : "bg-rose-500"
            )} />
            <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90 relative z-10">
              <defs>
                <linearGradient id={`prob-grad-${signal.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  {isBuy ? (
                    <><stop offset="0%" stopColor="hsl(160, 80%, 55%)" /><stop offset="100%" stopColor="hsl(120, 70%, 40%)" /></>
                  ) : (
                    <><stop offset="0%" stopColor="hsl(10, 80%, 60%)" /><stop offset="100%" stopColor="hsl(350, 70%, 45%)" /></>
                  )}
                </linearGradient>
              </defs>
              {/* Track */}
              <circle cx="22" cy="22" r="18" stroke="hsl(225, 20%, 12%)" strokeWidth="3.5" fill="none" />
              {/* Tick marks */}
              <circle cx="22" cy="22" r="18" stroke="hsl(225, 15%, 20%)" strokeWidth="1" fill="none" strokeDasharray="1.2 3.9" opacity="0.5" />
              {/* Progress arc */}
              <circle
                cx="22" cy="22" r="18"
                stroke={`url(#prob-grad-${signal.id})`}
                strokeWidth="3.5"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${(signal.probability / 100) * 113.1} 113.1`}
                className="transition-all duration-700 ease-out"
                style={{ filter: 'drop-shadow(0 0 3px currentColor)' }}
              />
              {/* Center fill */}
              <circle cx="22" cy="22" r="14" fill="hsl(225, 25%, 8%)" fillOpacity="0.85" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
              <span className={cn(
                "text-[11px] font-extrabold font-mono leading-none",
                isBuy ? "text-emerald-400" : "text-rose-400"
              )}
                style={{ textShadow: `0 0 6px ${isBuy ? 'hsl(142, 70%, 45%, 0.4)' : 'hsl(0, 70%, 50%, 0.4)'}` }}
              >
                {signal.probability}%
              </span>
            </div>
          </div>
        </div>

        {/* Time */}
        <div className="text-center min-w-[40px] hidden md:block">
          <div className="text-slate-400 font-mono text-xs">{formattedTime}</div>
          <div className="text-[9px] text-slate-500">UTC+1</div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(signal.id);
              }}
              className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              <Heart
                className={cn(
                  "w-4 h-4 transition-colors",
                  isFavorite ? "fill-rose-500 text-rose-500" : "text-slate-500 hover:text-rose-400"
                )}
              />
            </button>
          )}
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
        </div>
      </div>

      {/* Target Progress Bar */}
      <TargetProgressBar
        entryPrice={signal.entryPrice}
        takeProfit={signal.takeProfit}
        takeProfit2={signal.takeProfit2}
        takeProfit3={signal.takeProfit3}
        stopLoss={signal.stopLoss}
        currentPrice={currentPrice}
        action={signal.action}
        isCompleted={isCompleted}
        closedResult={signal.closedResult}
        closedPrice={signal.closedPrice}
        compact
      />

      {/* Notes section */}
      {signal.notes && (
        <div className="px-5 pb-3 -mt-1">
          <p className="text-[10px] text-slate-400 leading-relaxed bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-700/30 italic line-clamp-2">
            📝 {signal.notes}
          </p>
        </div>
      )}
    </div>
  );
}
