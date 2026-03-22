import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';

import { ToolCard, ToolPageHeader } from '@/components/tools/ToolCard';
import { ArrowLeft, Activity, Loader2, RefreshCw, TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/i18n/LanguageContext';

const SCAN_PAIRS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'NZD/USD',
  'USD/CAD', 'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'AUD/JPY', 'EUR/AUD',
];

const INTERVALS = [
  { value: '1h', label: '1H' },
  { value: '4h', label: '4H' },
  { value: '1day', labelKey: 'tp_rsi_daily' },
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

const ACCENT = '80 85% 52%';

export default function RsiMacdScreener() {
  const { t } = useTranslation();
  const [interval, setInterval] = useState('4h');
  const [filter, setFilter] = useState<'all' | 'overbought' | 'oversold' | 'bullish' | 'bearish'>('all');

  const signalConfig: Record<Signal, { label: string; color: string; bg: string }> = {
    overbought: { label: t('tp_overbought'), color: 'text-rose-400', bg: 'bg-rose-500/15 border-rose-500/30' },
    oversold: { label: t('tp_oversold'), color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
    bullish: { label: t('tp_trend_bullish'), color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
    bearish: { label: t('tp_trend_bearish'), color: 'text-rose-400', bg: 'bg-rose-500/15 border-rose-500/30' },
    neutral: { label: t('tp_trend_neutral'), color: 'text-muted-foreground', bg: 'bg-muted/30 border-border' },
  };

  const { data: results = [], isLoading, refetch, isFetching } = useQuery<PairResult[]>({
    queryKey: ['rsi-macd-screener', interval],
    queryFn: async () => {
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
      <Header />
      <main className="container py-3 max-w-lg mx-auto px-3 space-y-3">
        {/* Navigation */}
        <ToolPageHeader
          icon={<Activity className="w-5 h-5" style={{ color: `hsl(${ACCENT})` }} />}
          title={t('tools_rsi_screener_title')}
          accent={ACCENT}
        />

        {/* Interval Selector */}
        <ToolCard accent={ACCENT}>
          <div className="p-3 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{t('tp_rsi_timeframe')}</span>
            <div className="flex gap-1.5">
              {INTERVALS.map(iv => (
                <button
                  key={iv.value}
                  onClick={() => setInterval(iv.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-semibold transition-colors",
                    interval === iv.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  {iv.labelKey ? t(iv.labelKey) : iv.label}
                </button>
              ))}
            </div>
          </div>
        </ToolCard>

        {/* Stats Summary */}
        {!isLoading && results.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {([
              { key: 'overbought' as const, label: t('tp_overbought'), count: stats.overbought, icon: TrendingDown, color: 'text-rose-400' },
              { key: 'oversold' as const, label: t('tp_oversold'), count: stats.oversold, icon: TrendingUp, color: 'text-emerald-400' },
              { key: 'bullish' as const, label: 'MACD+', count: stats.bullish, icon: TrendingUp, color: 'text-emerald-400' },
              { key: 'bearish' as const, label: 'MACD−', count: stats.bearish, icon: TrendingDown, color: 'text-rose-400' },
            ]).map(s => (
              <button
                key={s.key}
                onClick={() => setFilter(filter === s.key ? 'all' : s.key)}
              >
                <div className={cn('rounded-xl overflow-hidden',
                  "border transition-colors",
                  filter === s.key ? "bg-primary/10 border-primary/40" : "bg-card border-border"
                )}>
                  <div className="p-3 text-center">
                    <s.icon className={cn('w-4 h-4 mx-auto mb-1', s.color)} />
                    <p className={cn('text-lg font-bold tabular-nums', s.color)}>{s.count}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Scan Info */}
        <ToolCard accent={ACCENT}>
          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">{t('tp_pairs_scanned')}</span>
            </div>
            <span className="text-sm font-bold text-primary tabular-nums">{SCAN_PAIRS.length}</span>
          </div>
        </ToolCard>

        {/* Results */}
        {isLoading ? (
          <ToolCard accent={ACCENT}>
            <div className="p-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">{t('tp_scanning').replace('{count}', String(SCAN_PAIRS.length))}</p>
            </div>
          </ToolCard>
        ) : filtered.length === 0 ? (
          <ToolCard accent={ACCENT}>
            <div className="p-8 text-center">
              <Activity className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-sm text-muted-foreground">{t('tp_no_results_filter')}</p>
            </div>
          </ToolCard>
        ) : (
          <ToolCard accent={ACCENT}>
            <div className="p-0">
              {filtered.map((r, i) => {
                const rsiConf = signalConfig[r.rsiSignal];
                const macdConf = signalConfig[r.macdTrend];
                return (
                  <div
                    key={r.symbol}
                    className={cn(
                      'p-3 flex items-center gap-3',
                      i !== filtered.length - 1 && 'border-b border-border'
                    )}
                  >
                    <div className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                      r.macdTrend === 'bullish' ? 'bg-emerald-500/15' :
                      r.macdTrend === 'bearish' ? 'bg-rose-500/15' : 'bg-muted'
                    )}>
                      {r.macdTrend === 'bullish' ? <TrendingUp className="w-4 h-4 text-emerald-400" /> :
                       r.macdTrend === 'bearish' ? <TrendingDown className="w-4 h-4 text-rose-400" /> :
                       <Minus className="w-4 h-4 text-muted-foreground" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">{r.symbol}</span>
                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-semibold", rsiConf.bg, rsiConf.color)}>
                          {rsiConf.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <div>
                          <span className="text-[10px] text-muted-foreground">RSI </span>
                          <span className={cn("text-xs font-bold tabular-nums", rsiConf.color)}>
                            {r.rsi !== null ? r.rsi.toFixed(1) : '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground">MACD </span>
                          <span className={cn("text-xs font-bold tabular-nums", macdConf.color)}>
                            {r.macdHist !== null ? r.macdHist.toFixed(5) : '—'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {r.error && (
                      <span className="text-[9px] text-rose-400/70">Error</span>
                    )}
                  </div>
                );
              })}
            </div>
          </ToolCard>
        )}
      </main>
    </PageShell>
  );
}
