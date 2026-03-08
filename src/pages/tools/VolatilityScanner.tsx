import { useState, useMemo } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ArrowLeft, Gauge, RefreshCw, TrendingUp, TrendingDown, Minus, Info, Clock, Zap } from 'lucide-react';

interface VolatilityData {
  pair: string;
  atr14: number;
  bollingerWidth: number;
  historicalVol: number;
  level: 'high' | 'medium' | 'low';
  trend: 'expanding' | 'contracting' | 'stable';
}

const PAIRS = ['EUR/USD','GBP/USD','USD/JPY','USD/CHF','AUD/USD','NZD/USD','USD/CAD','EUR/GBP','EUR/JPY','GBP/JPY','AUD/JPY','XAU/USD'];

function generateData(): VolatilityData[] {
  return PAIRS.map(pair => {
    const isGold = pair === 'XAU/USD';
    const isJpy = pair.includes('JPY');
    const base = isGold ? 18 : isJpy ? 0.8 : 0.006;
    const atr14 = base * (0.5 + Math.random());
    const bollingerWidth = 0.5 + Math.random() * 3;
    const historicalVol = 5 + Math.random() * 20;
    const level: VolatilityData['level'] = historicalVol > 17 ? 'high' : historicalVol > 10 ? 'medium' : 'low';
    const trends: VolatilityData['trend'][] = ['expanding', 'contracting', 'stable'];
    return { pair, atr14: parseFloat(atr14.toFixed(isGold ? 1 : isJpy ? 3 : 5)), bollingerWidth: parseFloat(bollingerWidth.toFixed(2)), historicalVol: parseFloat(historicalVol.toFixed(1)), level, trend: trends[Math.floor(Math.random() * 3)] };
  });
}

type FilterLevel = 'all' | 'high' | 'medium' | 'low';

export default function VolatilityScanner() {
  const [data, setData] = useState<VolatilityData[]>(generateData);
  const [filter, setFilter] = useState<FilterLevel>('all');
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  function refresh() {
    setLoading(true);
    setTimeout(() => { setData(generateData()); setLastUpdate(new Date()); setLoading(false); }, 800);
  }

  const filtered = useMemo(() => filter === 'all' ? data : data.filter(d => d.level === filter), [data, filter]);
  const summary = useMemo(() => ({
    high: data.filter(d => d.level === 'high').length,
    medium: data.filter(d => d.level === 'medium').length,
    low: data.filter(d => d.level === 'low').length,
  }), [data]);

  const levelConfig = {
    high: { label: 'Alta', color: 'text-rose-400', bg: 'bg-rose-500/15', icon: Zap },
    medium: { label: 'Media', color: 'text-amber-400', bg: 'bg-amber-500/15', icon: Gauge },
    low: { label: 'Baja', color: 'text-emerald-400', bg: 'bg-emerald-500/15', icon: Minus },
  };

  const trendLabel = (t: VolatilityData['trend']) => t === 'expanding' ? '↑ Expandiendo' : t === 'contracting' ? '↓ Contrayendo' : '→ Estable';
  const trendColor = (t: VolatilityData['trend']) => t === 'expanding' ? 'text-rose-400' : t === 'contracting' ? 'text-emerald-400' : 'text-muted-foreground';

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
              <Gauge className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-bold text-foreground">Escáner de Volatilidad</h1>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={refresh} disabled={loading} className="text-muted-foreground">
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2">
          {([
            { key: 'high' as const, label: 'Alta', count: summary.high, color: 'text-rose-400', Icon: Zap },
            { key: 'medium' as const, label: 'Media', count: summary.medium, color: 'text-amber-400', Icon: Gauge },
            { key: 'low' as const, label: 'Baja', count: summary.low, color: 'text-emerald-400', Icon: Minus },
          ]).map(s => (
            <Card key={s.key} className="bg-card border-border">
              <CardContent className="p-3 text-center">
                <s.Icon className={cn('w-4 h-4 mx-auto mb-1', s.color)} />
                <p className={cn('text-xl font-bold', s.color)}>{s.count}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-1 p-1 rounded-lg bg-muted/50">
          {([
            { id: 'all' as FilterLevel, label: 'Todos' },
            { id: 'high' as FilterLevel, label: '🔴 Alta' },
            { id: 'medium' as FilterLevel, label: '🟡 Media' },
            { id: 'low' as FilterLevel, label: '🟢 Baja' },
          ]).map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={cn(
              'flex-1 py-2 rounded-md text-xs font-medium transition-all',
              filter === f.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}>{f.label}</button>
          ))}
        </div>

        {/* Data Table */}
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-4 py-2.5 border-b border-border">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Par</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider text-right w-14">ATR14</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider text-center w-14">Vol%</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider text-center w-20">Tendencia</span>
            </div>

            {filtered.map((item, i) => {
              const cfg = levelConfig[item.level];
              return (
                <div key={item.pair} className={cn(
                  'grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center px-4 py-3',
                  i !== filtered.length - 1 && 'border-b border-border/50'
                )}>
                  <div className="flex items-center gap-2.5">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', cfg.bg)}>
                      <cfg.icon className={cn('w-4 h-4', cfg.color)} />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-foreground">{item.pair}</span>
                      <span className={cn('block text-[10px] font-medium', cfg.color)}>{cfg.label}</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold tabular-nums text-foreground text-right w-14">{item.atr14}</span>
                  <div className="w-14 flex flex-col items-center gap-0.5">
                    <span className={cn('text-[10px] font-bold tabular-nums', cfg.color)}>{item.historicalVol}%</span>
                    <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all',
                        item.level === 'high' ? 'bg-rose-400' : item.level === 'medium' ? 'bg-amber-400' : 'bg-emerald-400'
                      )} style={{ width: `${Math.min(item.historicalVol * 4, 100)}%` }} />
                    </div>
                  </div>
                  <span className={cn('text-[10px] font-medium w-20 text-center', trendColor(item.trend))}>
                    {trendLabel(item.trend)}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
          <Clock className="w-3 h-3" />
          Actualizado: {lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                ATR14 mide el rango promedio de las últimas 14 velas. Volatilidad alta = más oportunidad pero más riesgo. La tendencia de volatilidad indica si el mercado se está calmando o activando.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </PageShell>
  );
}
