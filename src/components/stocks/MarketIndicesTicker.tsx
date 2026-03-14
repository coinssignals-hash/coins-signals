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

// US indices via FMP (ETF proxies that work on free plan)
const US_INDICES = [
  { symbol: 'SPY', label: 'S&P 500', fmpSymbol: 'SPY' },
  { symbol: 'QQQ', label: 'NASDAQ', fmpSymbol: 'QQQ' },
  { symbol: 'DIA', label: 'DOW', fmpSymbol: 'DIA' },
  { symbol: 'IWM', label: 'Russell 2K', fmpSymbol: 'IWM' },
];

// International indices via Alpha Vantage (real index symbols)
const INTL_INDICES = [
  { symbol: 'FTSE', label: 'FTSE 100', avSymbol: 'FTSE:IND' },
  { symbol: 'DAX', label: 'DAX', avSymbol: 'DAX:IND' },
  { symbol: 'NIKKEI', label: 'Nikkei 225', avSymbol: 'NIKKEI:IND' },
];

const ALL_SYMBOLS = [
  ...US_INDICES.map(i => ({ symbol: i.symbol, label: i.label })),
  ...INTL_INDICES.map(i => ({ symbol: i.symbol, label: i.label })),
];

const POLL_INTERVAL = 15_000;

export function MarketIndicesTicker() {
  const [indices, setIndices] = useState<IndexData[]>(
    ALL_SYMBOLS.map(i => ({
      symbol: i.symbol, label: i.label, price: null, change: null,
      changePercent: null, loading: true, lastUpdate: null, flash: null,
    }))
  );
  const [isLive, setIsLive] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPricesRef = useRef<Record<string, number>>({});

  // Fetch US indices from FMP
  const fetchUS = useCallback(async (): Promise<any[]> => {
    try {
      const symbols = US_INDICES.map(i => i.fmpSymbol).join(',');
      const { data, error } = await supabase.functions.invoke('fmp-data', {
        body: { action: 'quote', symbol: symbols },
      });
      if (error || !Array.isArray(data)) return [];
      return data.map((d: any) => ({
        symbol: d.symbol,
        price: d.price ?? null,
        change: d.change ?? null,
        changesPercentage: d.changesPercentage ?? null,
      }));
    } catch {
      return [];
    }
  }, []);

  // Fetch international indices from Alpha Vantage via market-data edge function
  const fetchIntl = useCallback(async (): Promise<any[]> => {
    const results: any[] = [];
    // Batch requests with small delay to avoid rate limits
    for (const idx of INTL_INDICES) {
      try {
        const { data } = await supabase.functions.invoke('alpha-vantage', {
          body: { function: 'GLOBAL_QUOTE', symbol: idx.avSymbol },
        });

        const quote = data?.['Global Quote'] ?? data?.data?.['Global Quote'] ?? data?.data ?? data;

        const price = parseFloat(quote?.['05. price'] ?? quote?.price ?? quote?.c ?? '0');
        const change = parseFloat(quote?.['09. change'] ?? quote?.change ?? quote?.d ?? '0');
        const changePercent = parseFloat(
          (quote?.['10. change percent'] ?? quote?.changePercent ?? quote?.dp ?? '0')
            .toString().replace('%', '')
        );

        if (price > 0) {
          results.push({
            symbol: idx.symbol,
            price,
            change,
            changesPercentage: changePercent,
          });
        }
      } catch {
        // Skip this index on error
      }
    }

    // If Alpha Vantage failed, try Finnhub as fallback
    if (results.length < INTL_INDICES.length) {
      const finnhubMap: Record<string, string> = {
        'FTSE': '^FTSE',
        'DAX': '^GDAXI',
        'NIKKEI': '^N225',
      };
      const missing = INTL_INDICES.filter(i => !results.find(r => r.symbol === i.symbol));
      for (const idx of missing) {
        try {
          const { data } = await supabase.functions.invoke('market-data', {
            body: { symbol: finnhubMap[idx.symbol] || idx.symbol, indicator: 'quote', interval: '1d' },
          });
          if (data?.data) {
            const q = data.data;
            const price = q.c ?? q.price ?? 0;
            if (price > 0) {
              results.push({
                symbol: idx.symbol,
                price,
                change: q.d ?? q.change ?? 0,
                changesPercentage: q.dp ?? q.changePercent ?? 0,
              });
            }
          }
        } catch {
          // Skip
        }
      }
    }

    return results;
  }, []);

  const fetchIndices = useCallback(async () => {
    // Fetch US and international in parallel
    const [usData, intlData] = await Promise.all([fetchUS(), fetchIntl()]);
    const allData = [...usData, ...intlData];

    if (allData.length === 0) {
      setIsLive(false);
      setIndices(prev => prev.map(i => ({ ...i, loading: false })));
      return;
    }

    setIsLive(true);
    setLastFetchTime(new Date());

    setIndices(prev =>
      prev.map(idx => {
        const match = allData.find((d: any) => d.symbol === idx.symbol);
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
  }, [fetchUS, fetchIntl]);

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
