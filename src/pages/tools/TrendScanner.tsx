import { useState, useEffect, useMemo } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, TrendingUp, TrendingDown, Minus, RefreshCw,
  Activity, BarChart3, Clock, Zap
} from 'lucide-react';

interface PairTrend {
  pair: string;
  trend: 'bullish' | 'bearish' | 'neutral';
  strength: number; // 0-100
  change24h: number;
  volume: 'high' | 'medium' | 'low';
}

const FOREX_PAIRS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD',
  'NZD/USD', 'USD/CAD', 'EUR/GBP', 'EUR/JPY', 'GBP/JPY',
  'AUD/JPY', 'XAU/USD',
];

function generateTrendData(): PairTrend[] {
  return FOREX_PAIRS.map(pair => {
    const change = (Math.random() - 0.48) * 2.5;
    const strength = Math.min(100, Math.max(10, Math.abs(change) * 40 + Math.random() * 30));
    const trend: PairTrend['trend'] =
      change > 0.3 ? 'bullish' : change < -0.3 ? 'bearish' : 'neutral';
    const volumes: PairTrend['volume'][] = ['high', 'medium', 'low'];
    return {
      pair,
      trend,
      strength: Math.round(strength),
      change24h: parseFloat(change.toFixed(3)),
      volume: volumes[Math.floor(Math.random() * 3)],
    };
  });
}

type FilterType = 'all' | 'bullish' | 'bearish' | 'neutral';

export default function TrendScanner() {
  const [data, setData] = useState<PairTrend[]>(generateTrendData);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  function refresh() {
    setLoading(true);
    setTimeout(() => {
      setData(generateTrendData());
      setLastUpdate(new Date());
      setLoading(false);
    }, 800);
  }

  const filtered = useMemo(() => {
    if (filter === 'all') return data;
    return data.filter(d => d.trend === filter);
  }, [data, filter]);

  const summary = useMemo(() => ({
    bullish: data.filter(d => d.trend === 'bullish').length,
    bearish: data.filter(d => d.trend === 'bearish').length,
    neutral: data.filter(d => d.trend === 'neutral').length,
  }), [data]);

  const trendIcon = (trend: PairTrend['trend']) => {
    if (trend === 'bullish') return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    if (trend === 'bearish') return <TrendingDown className="w-4 h-4 text-rose-400" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const volumeBadge = (vol: PairTrend['volume']) => {
    const styles = {
      high: 'bg-emerald-500/15 text-emerald-400',
      medium: 'bg-amber-500/15 text-amber-400',
      low: 'bg-muted text-muted-foreground',
    };
    return (
      <span className={cn('text-[9px] px-1.5 py-0.5 rounded font-medium uppercase', styles[vol])}>
        {vol === 'high' ? 'Alto' : vol === 'medium' ? 'Medio' : 'Bajo'}
      </span>
    );
  };

  return (
    <PageShell>
      <Header />
      <main className="container py-6 space-y-5">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/tools" className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </Link>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-bold text-foreground">Escáner de Tendencias</h1>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={refresh} disabled={loading} className="text-muted-foreground">
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Alcistas', value: summary.bullish, icon: TrendingUp, color: 'text-emerald-400' },
            { label: 'Bajistas', value: summary.bearish, icon: TrendingDown, color: 'text-rose-400' },
            { label: 'Neutrales', value: summary.neutral, icon: Minus, color: 'text-muted-foreground' },
          ].map(s => (
            <Card key={s.label} className="bg-card border-border">
              <CardContent className="p-3 text-center">
                <s.icon className={cn('w-4 h-4 mx-auto mb-1', s.color)} />
                <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 p-1 rounded-lg bg-muted/50">
          {([
            { id: 'all' as FilterType, label: 'Todos' },
            { id: 'bullish' as FilterType, label: '🟢 Alcista' },
            { id: 'bearish' as FilterType, label: '🔴 Bajista' },
            { id: 'neutral' as FilterType, label: '⚪ Neutral' },
          ]).map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'flex-1 py-2 rounded-md text-xs font-medium transition-all',
                filter === f.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >{f.label}</button>
          ))}
        </div>

        {/* Pairs List */}
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-4 py-2.5 border-b border-border">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Par</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider text-right w-14">24h</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider text-center w-14">Fuerza</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider text-center w-12">Vol</span>
            </div>

            {filtered.map((item, i) => (
              <div
                key={item.pair}
                className={cn(
                  'grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center px-4 py-3',
                  i !== filtered.length - 1 && 'border-b border-border/50'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    item.trend === 'bullish' ? 'bg-emerald-500/15' :
                    item.trend === 'bearish' ? 'bg-rose-500/15' : 'bg-muted'
                  )}>
                    {trendIcon(item.trend)}
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-foreground">{item.pair}</span>
                    <span className={cn(
                      'block text-[10px] font-medium capitalize',
                      item.trend === 'bullish' ? 'text-emerald-400' :
                      item.trend === 'bearish' ? 'text-rose-400' : 'text-muted-foreground'
                    )}>
                      {item.trend === 'bullish' ? 'Alcista' : item.trend === 'bearish' ? 'Bajista' : 'Neutral'}
                    </span>
                  </div>
                </div>

                <span className={cn(
                  'text-xs font-bold tabular-nums text-right w-14',
                  item.change24h > 0 ? 'text-emerald-400' :
                  item.change24h < 0 ? 'text-rose-400' : 'text-muted-foreground'
                )}>
                  {item.change24h > 0 ? '+' : ''}{item.change24h}%
                </span>

                {/* Strength bar */}
                <div className="w-14 flex flex-col items-center gap-0.5">
                  <span className="text-[10px] font-bold text-foreground tabular-nums">{item.strength}%</span>
                  <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        item.trend === 'bullish' ? 'bg-emerald-400' :
                        item.trend === 'bearish' ? 'bg-rose-400' : 'bg-muted-foreground'
                      )}
                      style={{ width: `${item.strength}%` }}
                    />
                  </div>
                </div>

                <div className="w-12 flex justify-center">
                  {volumeBadge(item.volume)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Last update */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
          <Clock className="w-3 h-3" />
          Actualizado: {lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
        </div>

        {/* Info */}
        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                El escáner analiza la dirección general del mercado usando indicadores de momentum y precio.
                Los datos se actualizan periódicamente. La fuerza indica la intensidad de la tendencia actual.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </PageShell>
  );
}
