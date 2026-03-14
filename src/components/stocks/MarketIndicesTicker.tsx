import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, Activity, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IndexData {
  symbol: string;
  label: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  loading: boolean;
  lastUpdate: number | null;
  flash: 'up' | 'down' | null;
}

const INDICES = [
  { symbol: 'SPY', label: 'S&P 500', fmpSymbol: 'SPY', finnhubSymbol: 'SPY' },
  { symbol: 'QQQ', label: 'NASDAQ', fmpSymbol: 'QQQ', finnhubSymbol: 'QQQ' },
  { symbol: 'DIA', label: 'DOW', fmpSymbol: 'DIA', finnhubSymbol: 'DIA' },
  { symbol: 'IWM', label: 'Russell 2K', fmpSymbol: 'IWM', finnhubSymbol: 'IWM' },
  { symbol: 'EWU', label: 'FTSE 100', fmpSymbol: 'EWU', finnhubSymbol: 'EWU' },
  { symbol: 'EWG', label: 'DAX', fmpSymbol: 'EWG', finnhubSymbol: 'EWG' },
  { symbol: 'EWJ', label: 'Nikkei 225', fmpSymbol: 'EWJ', finnhubSymbol: 'EWJ' },
];

const POLL_INTERVAL = 15_000;

export function MarketIndicesTicker() {
  const [indices, setIndices] = useState<IndexData[]>(
    INDICES.map(i => ({
      symbol: i.symbol, label: i.label, price: null, change: null,
      changePercent: null, loading: true, lastUpdate: null, flash: null,
    }))
  );
  const [isLive, setIsLive] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPricesRef = useRef<Record<string, number>>({});

  const fetchFromFMP = useCallback(async (): Promise<any[] | null> => {
    try {
      const symbols = INDICES.map(i => i.fmpSymbol).join(',');
      const { data, error } = await supabase.functions.invoke('fmp-data', {
        body: { action: 'quote', symbol: symbols },
      });
      if (error || !Array.isArray(data)) return null;
      return data;
    } catch {
      return null;
    }
  }, []);

  const fetchFromFinnhub = useCallback(async (): Promise<any[] | null> => {
    try {
      const results: any[] = [];
      // Fetch one by one from market-data edge function with Finnhub
      for (const idx of INDICES) {
        const { data } = await supabase.functions.invoke('market-data', {
          body: { symbol: idx.finnhubSymbol, indicator: 'quote', interval: '1d' },
        });
        if (data?.data) {
          const q = data.data;
          results.push({
            symbol: idx.symbol,
            price: q.c ?? q.price ?? null,
            change: q.d ?? q.change ?? null,
            changesPercentage: q.dp ?? q.changePercent ?? null,
          });
        }
      }
      return results.length > 0 ? results : null;
    } catch {
      return null;
    }
  }, []);

  const fetchIndices = useCallback(async () => {
    // Try FMP first, fallback to Finnhub/market-data
    let data = await fetchFromFMP();
    if (!data || data.length === 0) {
      data = await fetchFromFinnhub();
    }

    if (!data || data.length === 0) {
      setIsLive(false);
      setIndices(prev => prev.map(i => ({ ...i, loading: false })));
      return;
    }

    setIsLive(true);
    setLastFetchTime(new Date());

    setIndices(prev =>
      prev.map(idx => {
        const match = data!.find((d: any) => d.symbol === idx.symbol);
        if (!match) return { ...idx, loading: false };

        const newPrice = match.price ?? null;
        const oldPrice = prevPricesRef.current[idx.symbol];
        let flash: 'up' | 'down' | null = null;

        if (oldPrice != null && newPrice != null && newPrice !== oldPrice) {
          flash = newPrice > oldPrice ? 'up' : 'down';
        }
        if (newPrice != null) {
          prevPricesRef.current[idx.symbol] = newPrice;
        }

        return {
          ...idx,
          price: newPrice,
          change: match.change ?? null,
          changePercent: match.changesPercentage ?? null,
          loading: false,
          lastUpdate: Date.now(),
          flash,
        };
      })
    );

    // Clear flash after animation
    setTimeout(() => {
      setIndices(prev => prev.map(i => ({ ...i, flash: null })));
    }, 800);
  }, [fetchFromFMP, fetchFromFinnhub]);

  // Visibility-based polling
  useEffect(() => {
    const startPolling = () => {
      fetchIndices();
      intervalRef.current = setInterval(fetchIndices, POLL_INTERVAL);
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        startPolling();
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchIndices]);

  const timeSinceUpdate = lastFetchTime
    ? `${Math.round((Date.now() - lastFetchTime.getTime()) / 1000)}s`
    : '—';

  return (
    <div className="relative overflow-hidden rounded-xl border border-cyan-800/25 bg-[hsl(210,40%,8%)]">
      {/* Top glow line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

      <div className="flex items-center gap-1 px-2 py-1.5">
        {/* Live indicator */}
        <button
          onClick={fetchIndices}
          className="flex items-center gap-1 pr-2 border-r border-cyan-800/25 group"
          title={`Last update: ${lastFetchTime?.toLocaleTimeString() ?? '—'}`}
        >
          <Activity className={cn(
            "w-3 h-3 transition-colors",
            isLive ? "text-cyan-400 animate-pulse" : "text-amber-400"
          )} />
          <span className={cn(
            "text-[9px] font-bold uppercase tracking-wider",
            isLive ? "text-cyan-400/70" : "text-amber-400/70"
          )}>
            {isLive ? 'Live' : 'Offline'}
          </span>
          <RefreshCw className="w-2.5 h-2.5 text-slate-500 group-hover:text-cyan-300 transition-colors hidden group-hover:block" />
        </button>

        <div className="flex-1 flex items-center gap-0.5 overflow-x-auto scrollbar-none">
          {indices.map((idx) => {
            const isPositive = (idx.change ?? 0) >= 0;
            return (
              <div
                key={idx.symbol}
                className={cn(
                  "flex-1 min-w-[70px] flex flex-col items-center px-1.5 py-1 rounded-lg transition-all duration-300",
                  "hover:bg-cyan-500/5",
                  idx.flash === 'up' && "bg-emerald-500/10",
                  idx.flash === 'down' && "bg-red-500/10",
                )}
              >
                <span className="text-[9px] font-semibold text-slate-400 truncate">{idx.label}</span>
                {idx.loading ? (
                  <div className="h-3.5 w-12 rounded bg-slate-800/60 animate-pulse mt-0.5" />
                ) : idx.price !== null ? (
                  <>
                    <span className={cn(
                      "text-[11px] font-bold tabular-nums transition-colors duration-300",
                      idx.flash === 'up' ? "text-emerald-300" :
                      idx.flash === 'down' ? "text-red-300" :
                      "text-white"
                    )}>
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
