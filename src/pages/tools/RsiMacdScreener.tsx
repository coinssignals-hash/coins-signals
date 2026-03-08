import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { SignalStyleCard } from '@/components/ui/signal-style-card';
import { ArrowLeft, Activity, Loader2, RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SCAN_PAIRS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'NZD/USD',
  'USD/CAD', 'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'AUD/JPY', 'EUR/AUD',
];

const INTERVALS = [
  { value: '1h', label: '1H' },
  { value: '4h', label: '4H' },
  { value: '1day', label: 'Diario' },
];

type Signal = 'overbought' | 'oversold' | 'bullish' | 'bearish' | 'neutral';

interface PairResult {
  symbol: string;
  rsi: number | null;
  macd: number | null;
  macdSignal: number | null;
  macdHist: number | null;
  rsiSignal: Signal;
  macdTrend: Signal;
  loading: boolean;
  error: string | null;
}

function getRsiSignal(rsi: number): Signal {
  if (rsi >= 70) return 'overbought';
  if (rsi <= 30) return 'oversold';
  return 'neutral';
}

function getMacdSignal(hist: number): Signal {
  if (hist > 0) return 'bullish';
  if (hist < 0) return 'bearish';
  return 'neutral';
}

const SIGNAL_CONFIG: Record<Signal, { label: string; color: string; bg: string }> = {
  overbought: { label: 'Sobrecompra', color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30' },
  oversold: { label: 'Sobreventa', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
  bullish: { label: 'Alcista', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
  bearish: { label: 'Bajista', color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30' },
  neutral: { label: 'Neutral', color: 'text-muted-foreground', bg: 'bg-muted/30 border-border/30' },
};

async function fetchPairData(symbol: string, interval: string): Promise<PairResult> {
  const base: PairResult = {
    symbol, rsi: null, macd: null, macdSignal: null, macdHist: null,
    rsiSignal: 'neutral', macdTrend: 'neutral', loading: false, error: null,
  };

  try {
    const [rsiRes, macdRes] = await Promise.allSettled([
      supabase.functions.invoke('market-data', {
        body: { symbol, interval, indicator: 'rsi', outputsize: 5 },
      }),
      supabase.functions.invoke('market-data', {
        body: { symbol, interval, indicator: 'macd', outputsize: 5 },
      }),
    ]);

    if (rsiRes.status === 'fulfilled' && rsiRes.value.data?.values?.length) {
      const lastRsi = parseFloat(rsiRes.value.data.values[rsiRes.value.data.values.length - 1]?.rsi);
      if (!isNaN(lastRsi)) {
        base.rsi = lastRsi;
        base.rsiSignal = getRsiSignal(lastRsi);
      }
    }

    if (macdRes.status === 'fulfilled' && macdRes.value.data?.values?.length) {
      const last = macdRes.value.data.values[macdRes.value.data.values.length - 1];
      const m = parseFloat(last?.macd);
      const s = parseFloat(last?.macd_signal);
      const h = parseFloat(last?.macd_hist);
      if (!isNaN(m)) base.macd = m;
      if (!isNaN(s)) base.macdSignal = s;
      if (!isNaN(h)) {
        base.macdHist = h;
        base.macdTrend = getMacdSignal(h);
      }
    }

    return base;
  } catch (err: any) {
    return { ...base, error: err.message || 'Error' };
  }
}

export default function RsiMacdScreener() {
  const [interval, setInterval] = useState('4h');
  const [filter, setFilter] = useState<'all' | 'overbought' | 'oversold' | 'bullish' | 'bearish'>('all');

  const { data: results = [], isLoading, refetch, isFetching } = useQuery<PairResult[]>({
    queryKey: ['rsi-macd-screener', interval],
    queryFn: async () => {
      // Fetch in batches of 3 to avoid rate limits
      const batchSize = 3;
      const allResults: PairResult[] = [];
      for (let i = 0; i < SCAN_PAIRS.length; i += batchSize) {
        const batch = SCAN_PAIRS.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(p => fetchPairData(p, interval)));
        allResults.push(...batchResults);
      }
      return allResults;
    },
    staleTime: 3 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const filtered = results.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'overbought' || filter === 'oversold') return r.rsiSignal === filter;
    return r.macdTrend === filter;
  });

  const stats = {
    overbought: results.filter(r => r.rsiSignal === 'overbought').length,
    oversold: results.filter(r => r.rsiSignal === 'oversold').length,
    bullish: results.filter(r => r.macdTrend === 'bullish').length,
    bearish: results.filter(r => r.macdTrend === 'bearish').length,
  };

  return (
    <PageShell>
      <div className="px-4 py-4 pb-24 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to="/tools" className="w-9 h-9 rounded-lg bg-card/80 border border-border/50 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 flex items-center justify-center">
            <Activity className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Screener RSI/MACD</h1>
            <p className="text-xs text-muted-foreground">{SCAN_PAIRS.length} pares escaneados</p>
          </div>
          <button onClick={() => refetch()} className="w-8 h-8 rounded-lg bg-card/80 border border-border/50 flex items-center justify-center">
            <RefreshCw className={cn("w-3.5 h-3.5 text-muted-foreground", isFetching && "animate-spin")} />
          </button>
        </div>

        {/* Interval selector */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Temporalidad:</span>
          <div className="flex gap-1.5">
            {INTERVALS.map(iv => (
              <button
                key={iv.value}
                onClick={() => setInterval(iv.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border",
                  interval === iv.value
                    ? "bg-primary/15 border-primary/40 text-foreground"
                    : "bg-card/60 border-border/50 text-muted-foreground"
                )}
              >
                {iv.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats summary */}
        {!isLoading && results.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {([
              { key: 'overbought', label: 'Sobrecompra', count: stats.overbought, color: 'text-red-400' },
              { key: 'oversold', label: 'Sobreventa', count: stats.oversold, color: 'text-emerald-400' },
              { key: 'bullish', label: 'MACD+', count: stats.bullish, color: 'text-emerald-400' },
              { key: 'bearish', label: 'MACD-', count: stats.bearish, color: 'text-red-400' },
            ] as const).map(s => (
              <button
                key={s.key}
                onClick={() => setFilter(filter === s.key ? 'all' : s.key)}
                className={cn(
                  "p-2 rounded-xl border text-center transition-all",
                  filter === s.key ? "bg-primary/10 border-primary/40" : "bg-card/60 border-border/50"
                )}
              >
                <span className={cn("text-lg font-bold font-mono block", s.color)}>{s.count}</span>
                <span className="text-[9px] text-muted-foreground">{s.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Escaneando {SCAN_PAIRS.length} pares...</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(r => {
              const rsiConf = SIGNAL_CONFIG[r.rsiSignal];
              const macdConf = SIGNAL_CONFIG[r.macdTrend];
              return (
                <SignalStyleCard key={r.symbol} className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-16 shrink-0">
                      <span className="text-sm font-bold text-foreground">{r.symbol.replace('/', '')}</span>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      {/* RSI */}
                      <div>
                        <span className="text-[9px] text-muted-foreground block">RSI (14)</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={cn("text-sm font-mono font-bold", rsiConf.color)}>
                            {r.rsi !== null ? r.rsi.toFixed(1) : '—'}
                          </span>
                          <span className={cn("text-[8px] px-1.5 py-0.5 rounded-full border font-semibold", rsiConf.bg)}>
                            {rsiConf.label}
                          </span>
                        </div>
                      </div>
                      {/* MACD */}
                      <div>
                        <span className="text-[9px] text-muted-foreground block">MACD Hist</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={cn("text-sm font-mono font-bold", macdConf.color)}>
                            {r.macdHist !== null ? r.macdHist.toFixed(5) : '—'}
                          </span>
                          {r.macdTrend === 'bullish' ? (
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                          ) : r.macdTrend === 'bearish' ? (
                            <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                          ) : (
                            <Minus className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  {r.error && (
                    <p className="text-[10px] text-red-400/70 mt-1">{r.error}</p>
                  )}
                </SignalStyleCard>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}
