import { useState, useEffect } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ArrowLeft, ScanSearch, RefreshCw, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

type Signal = 'bullish' | 'bearish' | 'neutral';
type Timeframe = 'M5' | 'M15' | 'H1' | 'H4' | 'D1' | 'W1';

interface PairAnalysis {
  pair: string;
  timeframes: Record<Timeframe, {
    trend: Signal;
    rsi: number;
    macd: Signal;
    ema: Signal;
    bb: Signal;
  }>;
  confluence: number;
  overallBias: Signal;
}

const PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CHF', 'NZD/USD', 'USD/CAD', 'EUR/GBP', 'XAU/USD'];
const TIMEFRAMES: Timeframe[] = ['M5', 'M15', 'H1', 'H4', 'D1', 'W1'];
const INDICATORS = ['Tendencia', 'RSI', 'MACD', 'EMA', 'Bollinger'];

function randomSignal(): Signal {
  const r = Math.random();
  return r < 0.35 ? 'bullish' : r < 0.7 ? 'bearish' : 'neutral';
}

function generateAnalysis(): PairAnalysis[] {
  return PAIRS.map(pair => {
    const timeframes: PairAnalysis['timeframes'] = {} as any;
    let bullCount = 0;
    let bearCount = 0;

    TIMEFRAMES.forEach(tf => {
      const trend = randomSignal();
      const macd = randomSignal();
      const ema = randomSignal();
      const bb = randomSignal();
      const rsi = Math.floor(Math.random() * 80) + 10;

      [trend, macd, ema, bb].forEach(s => {
        if (s === 'bullish') bullCount++;
        if (s === 'bearish') bearCount++;
      });
      if (rsi < 30) bullCount++;
      else if (rsi > 70) bearCount++;

      timeframes[tf] = { trend, rsi, macd, ema, bb };
    });

    const total = TIMEFRAMES.length * 5;
    const confluence = Math.round(Math.max(bullCount, bearCount) / total * 100);
    const overallBias: Signal = bullCount > bearCount + 3 ? 'bullish' : bearCount > bullCount + 3 ? 'bearish' : 'neutral';

    return { pair, timeframes, confluence, overallBias };
  });
}

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

export default function MultiTFScreener() {
  const [data, setData] = useState<PairAnalysis[]>(() => generateAnalysis());
  const [loading, setLoading] = useState(false);
  const [expandedPair, setExpandedPair] = useState<string | null>(null);
  const [filterBias, setFilterBias] = useState<Signal | 'all'>('all');

  const refresh = () => {
    setLoading(true);
    setTimeout(() => {
      setData(generateAnalysis());
      setLoading(false);
    }, 800);
  };

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
          <Button variant="ghost" size="icon" onClick={refresh} disabled={loading}>
            <RefreshCw className={cn('w-4 h-4 text-muted-foreground', loading && 'animate-spin')} />
          </Button>
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

        {/* Pair Cards */}
        <div className="space-y-2">
          {filtered.map(pair => (
            <Card key={pair.pair} className="bg-card border-border">
              <CardContent className="p-0">
                {/* Summary Row */}
                <button
                  className="w-full flex items-center justify-between p-4"
                  onClick={() => setExpandedPair(expandedPair === pair.pair ? null : pair.pair)}
                >
                  <div className="flex items-center gap-3">
                    <SignalIcon signal={pair.overallBias} size="md" />
                    <div className="text-left">
                      <p className="text-sm font-bold text-foreground">{pair.pair}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{pair.overallBias === 'bullish' ? 'Alcista' : pair.overallBias === 'bearish' ? 'Bajista' : 'Neutral'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Mini TF dots */}
                    <div className="flex gap-1">
                      {TIMEFRAMES.map(tf => (
                        <SignalDot key={tf} signal={pair.timeframes[tf].trend} />
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

                {/* Expanded Detail */}
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
                    {/* Legend */}
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
                Analiza la confluencia de indicadores técnicos en 6 temporalidades (M5 a W1). Una confluencia alta indica que múltiples marcos de tiempo confirman la misma dirección.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </PageShell>
  );
}
