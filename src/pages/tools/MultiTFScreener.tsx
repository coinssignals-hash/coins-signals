import { useState, useEffect } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ArrowLeft, ScanSearch, RefreshCw, TrendingUp, TrendingDown, Minus, Info, Wifi, WifiOff } from 'lucide-react';
import { useMultiTFScreener, type PairAnalysis } from '@/hooks/useMultiTFScreener';
import { Skeleton } from '@/components/ui/skeleton';

type Signal = 'bullish' | 'bearish' | 'neutral';
type Timeframe = 'M5' | 'M15' | 'H1' | 'H4' | 'D1' | 'W1';

const TIMEFRAMES: Timeframe[] = ['M5', 'M15', 'H1', 'H4', 'D1', 'W1'];
const INDICATORS = ['Tendencia', 'RSI', 'MACD', 'EMA', 'Bollinger'];

const SignalIcon = ({ signal, size = 'sm' }: { signal: Signal; size?: 'sm' | 'md' }) => {
  const cls = size === 'md' ? 'w-4 h-4' : 'w-3 h-3';
  if (signal === 'bullish') return <TrendingUp className={cn(cls, 'text-emerald-400')} />;
  if (signal === 'bearish') return <TrendingDown className={cn(cls, 'text-rose-400')} />;
  return <Minus className={cn(cls, 'text-muted-foreground')} />;
};

const SignalDot = ({ signal }: { signal: Signal }) => (
  <div className={cn(
    'w-2.5 h-2.5 rounded-full',
    signal === 'bullish' && 'bg-emerald-400',
    signal === 'bearish' && 'bg-rose-400',
    signal === 'neutral' && 'bg-muted-foreground/40',
  )} />
);

const PairCardSkeleton = () => (
  <Card className="bg-card border-border">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-4 h-4 rounded" />
          <div>
            <Skeleton className="h-4 w-16 mb-1" />
            <Skeleton className="h-2.5 w-10" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {TIMEFRAMES.map(tf => <Skeleton key={tf} className="w-2.5 h-2.5 rounded-full" />)}
          </div>
          <div className="text-right">
            <Skeleton className="h-4 w-10 mb-1" />
            <Skeleton className="h-2 w-14" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function MultiTFScreener() {
  const { data, loading, error, fetchData } = useMultiTFScreener();
  const [expandedPair, setExpandedPair] = useState<string | null>(null);
  const [filterBias, setFilterBias] = useState<Signal | 'all'>('all');

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = filterBias === 'all' ? data : data.filter(d => d.overallBias === filterBias);

  return (
    <PageShell>
      <Header />
      <main className="container py-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/tools" className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </Link>
            <div className="flex items-center gap-2">
              <ScanSearch className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-bold text-foreground">Multi-Timeframe</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {data.length > 0 && (
              <span className="flex items-center gap-1 text-[9px] text-emerald-400">
                <Wifi className="w-3 h-3" /> Live
              </span>
            )}
            {error && (
              <span className="flex items-center gap-1 text-[9px] text-amber-400">
                <WifiOff className="w-3 h-3" /> Offline
              </span>
            )}
            <Button variant="ghost" size="icon" onClick={() => fetchData(true)} disabled={loading}>
              <RefreshCw className={cn('w-4 h-4 text-muted-foreground', loading && 'animate-spin')} />
            </Button>
          </div>
        </div>

        {/* Bias Filter */}
        <div className="flex gap-1 p-1 rounded-lg bg-muted/50">
          {([
            { id: 'all', label: 'Todos' },
            { id: 'bullish', label: '🟢 Alcista' },
            { id: 'bearish', label: '🔴 Bajista' },
            { id: 'neutral', label: '⚪ Neutral' },
          ] as const).map(f => (
            <button
              key={f.id}
              onClick={() => setFilterBias(f.id)}
              className={cn(
                'flex-1 py-2 rounded-md text-xs font-medium transition-all',
                filterBias === f.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && !loading && data.length === 0 && (
          <Card className="bg-card border-destructive/30">
            <CardContent className="p-4 text-center space-y-2">
              <p className="text-sm text-destructive">Error al obtener datos del mercado</p>
              <p className="text-xs text-muted-foreground">{error}</p>
              <Button size="sm" variant="outline" onClick={() => fetchData(true)}>Reintentar</Button>
            </CardContent>
          </Card>
        )}

        {/* Loading skeletons */}
        {loading && data.length === 0 && (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <PairCardSkeleton key={i} />)}
          </div>
        )}

        {/* Pair Cards */}
        <div className="space-y-2">
          {filtered.map(pair => (
            <Card key={pair.pair} className="bg-card border-border">
              <CardContent className="p-0">
                <button
                  className="w-full flex items-center justify-between p-4"
                  onClick={() => setExpandedPair(expandedPair === pair.pair ? null : pair.pair)}
                >
                  <div className="flex items-center gap-3">
                    <SignalIcon signal={pair.overallBias} size="md" />
                    <div className="text-left">
                      <p className="text-sm font-bold text-foreground">{pair.pair}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">
                        {pair.overallBias === 'bullish' ? 'Alcista' : pair.overallBias === 'bearish' ? 'Bajista' : 'Neutral'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {TIMEFRAMES.map(tf => (
                        <SignalDot key={tf} signal={pair.timeframes[tf]?.trend || 'neutral'} />
                      ))}
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        'text-sm font-bold tabular-nums',
                        pair.confluence >= 70 ? 'text-emerald-400' : pair.confluence >= 50 ? 'text-amber-400' : 'text-muted-foreground'
                      )}>
                        {pair.confluence}%
                      </p>
                      <p className="text-[9px] text-muted-foreground">Confluencia</p>
                    </div>
                  </div>
                </button>

                {expandedPair === pair.pair && (
                  <div className="border-t border-border px-4 pb-4">
                    <div className="overflow-x-auto">
                      <table className="w-full mt-3">
                        <thead>
                          <tr>
                            <th className="text-[9px] text-muted-foreground text-left pb-2 w-16">TF</th>
                            {INDICATORS.map(ind => (
                              <th key={ind} className="text-[9px] text-muted-foreground text-center pb-2">{ind}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {TIMEFRAMES.map(tf => {
                            const d = pair.timeframes[tf];
                            if (!d) return null;
                            const rsiSignal: Signal = d.rsi < 30 ? 'bullish' : d.rsi > 70 ? 'bearish' : 'neutral';
                            return (
                              <tr key={tf} className="border-t border-border/20">
                                <td className="py-2 text-xs font-medium text-foreground">{tf}</td>
                                <td className="text-center"><SignalDot signal={d.trend} /></td>
                                <td className="text-center">
                                  <span className={cn('text-[10px] font-bold tabular-nums', rsiSignal === 'bullish' ? 'text-emerald-400' : rsiSignal === 'bearish' ? 'text-rose-400' : 'text-muted-foreground')}>
                                    {d.rsi}
                                  </span>
                                </td>
                                <td className="text-center"><SignalDot signal={d.macd} /></td>
                                <td className="text-center"><SignalDot signal={d.ema} /></td>
                                <td className="text-center"><SignalDot signal={d.bb} /></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex gap-3 mt-3 text-[9px] text-muted-foreground">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Alcista</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400" /> Bajista</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground/40" /> Neutral</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Datos en tiempo real de Yahoo Finance. Analiza la confluencia de indicadores técnicos (RSI, MACD, EMA, Bollinger) en 6 temporalidades. Caché de 5 minutos.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </PageShell>
  );
}
