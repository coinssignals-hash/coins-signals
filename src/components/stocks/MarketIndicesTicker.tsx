import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IndexData {
  symbol: string;
  label: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  loading: boolean;
}

const INDICES = [
  { symbol: '^GSPC', label: 'S&P 500', fmpSymbol: '^GSPC' },
  { symbol: '^IXIC', label: 'NASDAQ', fmpSymbol: '^IXIC' },
  { symbol: '^DJI', label: 'DOW', fmpSymbol: '^DJI' },
  { symbol: '^RUT', label: 'Russell 2K', fmpSymbol: '^RUT' },
];

export function MarketIndicesTicker() {
  const [indices, setIndices] = useState<IndexData[]>(
    INDICES.map(i => ({ symbol: i.symbol, label: i.label, price: null, change: null, changePercent: null, loading: true }))
  );

  const fetchIndices = useCallback(async () => {
    try {
      const symbols = INDICES.map(i => i.fmpSymbol).join(',');
      const { data, error } = await supabase.functions.invoke('fmp-data', {
        body: { action: 'quote', symbol: symbols },
      });
      if (error || !Array.isArray(data)) return;

      setIndices(prev =>
        prev.map(idx => {
          const match = data.find((d: any) => d.symbol === idx.symbol);
          if (!match) return { ...idx, loading: false };
          return {
            ...idx,
            price: match.price ?? null,
            change: match.change ?? null,
            changePercent: match.changesPercentage ?? null,
            loading: false,
          };
        })
      );
    } catch {
      setIndices(prev => prev.map(i => ({ ...i, loading: false })));
    }
  }, []);

  useEffect(() => {
    fetchIndices();
    const interval = setInterval(fetchIndices, 30_000);
    return () => clearInterval(interval);
  }, [fetchIndices]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-cyan-800/25 bg-[hsl(210,40%,8%)]">
      {/* Top glow line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

      <div className="flex items-center gap-1 px-2 py-1.5">
        <div className="flex items-center gap-1 pr-2 border-r border-cyan-800/25">
          <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
          <span className="text-[9px] font-bold text-cyan-400/70 uppercase tracking-wider">Live</span>
        </div>

        <div className="flex-1 flex items-center gap-0.5 overflow-x-auto scrollbar-none">
          {indices.map((idx) => {
            const isPositive = (idx.change ?? 0) >= 0;
            return (
              <div
                key={idx.symbol}
                className="flex-1 min-w-[70px] flex flex-col items-center px-1.5 py-1 rounded-lg hover:bg-cyan-500/5 transition-colors"
              >
                <span className="text-[9px] font-semibold text-slate-400 truncate">{idx.label}</span>
                {idx.loading ? (
                  <div className="h-3.5 w-12 rounded bg-slate-800/60 animate-pulse mt-0.5" />
                ) : idx.price !== null ? (
                  <>
                    <span className="text-[11px] font-bold text-white tabular-nums">
                      {idx.price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                    <div className={cn("flex items-center gap-0.5", isPositive ? "text-emerald-400" : "text-red-400")}>
                      {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                      <span className="text-[9px] font-semibold tabular-nums">
                        {isPositive ? '+' : ''}{(idx.changePercent ?? 0).toFixed(2)}%
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="text-[10px] text-slate-600">—</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
