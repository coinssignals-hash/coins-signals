import { useState, useMemo } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ArrowLeft, Zap, RefreshCw, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface OrderLevel {
  price: number;
  bidVolume: number;
  askVolume: number;
  delta: number;
}

interface InstitutionalData {
  pair: string;
  longPercent: number;
  shortPercent: number;
  netPosition: 'long' | 'short';
  change: number;
  levels: OrderLevel[];
}

const PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD', 'AUD/USD', 'USD/CAD'];

function generateOrderBook(basePrice: number, isJpy: boolean): OrderLevel[] {
  const levels: OrderLevel[] = [];
  const decimals = isJpy ? 3 : 5;
  const step = isJpy ? 0.05 : 0.0005;

  for (let i = -10; i <= 10; i++) {
    const price = +(basePrice + i * step).toFixed(decimals);
    const bidVol = Math.floor(Math.random() * 500 + 50);
    const askVol = Math.floor(Math.random() * 500 + 50);
    levels.push({
      price,
      bidVolume: bidVol,
      askVolume: askVol,
      delta: bidVol - askVol,
    });
  }
  return levels;
}

function generateData(): InstitutionalData[] {
  const bases: Record<string, number> = {
    'EUR/USD': 1.085, 'GBP/USD': 1.265, 'USD/JPY': 149.5,
    'XAU/USD': 2340, 'AUD/USD': 0.665, 'USD/CAD': 1.365,
  };

  return PAIRS.map(pair => {
    const longPct = Math.floor(Math.random() * 40 + 30);
    return {
      pair,
      longPercent: longPct,
      shortPercent: 100 - longPct,
      netPosition: longPct > 50 ? 'long' : 'short',
      change: +(Math.random() * 10 - 5).toFixed(1),
      levels: generateOrderBook(bases[pair] || 1, pair.includes('JPY')),
    };
  });
}

export default function OrderFlowAnalysis() {
  const [data, setData] = useState(() => generateData());
  const [loading, setLoading] = useState(false);
  const [selectedPair, setSelectedPair] = useState('EUR/USD');

  const refresh = () => {
    setLoading(true);
    setTimeout(() => { setData(generateData()); setLoading(false); }, 600);
  };

  const selected = data.find(d => d.pair === selectedPair)!;

  const volumeChartData = useMemo(() =>
    selected.levels.map(l => ({
      price: l.price,
      bid: l.bidVolume,
      ask: -l.askVolume,
      delta: l.delta,
    }))
  , [selected]);

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
              <Zap className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-bold text-foreground">Flujo de Órdenes</h1>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={refresh} disabled={loading}>
            <RefreshCw className={cn('w-4 h-4 text-muted-foreground', loading && 'animate-spin')} />
          </Button>
        </div>

        {/* Pair Selector */}
        <div className="grid grid-cols-3 gap-2">
          {PAIRS.map(p => (
            <button
              key={p}
              onClick={() => setSelectedPair(p)}
              className={cn(
                'px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all border',
                selectedPair === p
                  ? 'bg-primary/15 border-primary text-primary shadow-sm shadow-primary/10'
                  : 'bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
              )}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Institutional Positioning */}
        <Card className="bg-card border-border">
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Posicionamiento Institucional</h3>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-emerald-500/30 rounded-l-lg h-8 flex items-center justify-end pr-2" style={{ width: `${selected.longPercent}%` }}>
                <span className="text-xs font-bold text-emerald-400">{selected.longPercent}% Long</span>
              </div>
              <div className="flex-1 bg-rose-500/30 rounded-r-lg h-8 flex items-center pl-2" style={{ width: `${selected.shortPercent}%` }}>
                <span className="text-xs font-bold text-rose-400">{selected.shortPercent}% Short</span>
              </div>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-muted-foreground">
                Sesgo neto: <span className={cn('font-bold', selected.netPosition === 'long' ? 'text-emerald-400' : 'text-rose-400')}>
                  {selected.netPosition === 'long' ? 'Alcista' : 'Bajista'}
                </span>
              </span>
              <span className={cn('font-bold tabular-nums', selected.change > 0 ? 'text-emerald-400' : 'text-rose-400')}>
                {selected.change > 0 ? '+' : ''}{selected.change}% cambio
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Volume Profile */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Perfil de Volumen (Bid vs Ask)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeChartData} layout="vertical" barGap={0}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis dataKey="price" type="category" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} width={60} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
                  <Bar dataKey="bid" fill="hsl(142 71% 45% / 0.6)" name="Bid" />
                  <Bar dataKey="ask" fill="hsl(0 84% 60% / 0.6)" name="Ask" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Delta Table */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Delta por Nivel de Precio</h3>
            <div className="space-y-0.5 max-h-60 overflow-y-auto">
              {selected.levels.map((l, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded text-xs">
                  <span className="text-muted-foreground tabular-nums w-20">{l.price}</span>
                  <div className="flex-1 mx-3">
                    <div className="relative h-3 bg-muted/30 rounded overflow-hidden">
                      {l.delta > 0 ? (
                        <div className="absolute left-1/2 h-full bg-emerald-500/50 rounded" style={{ width: `${Math.min(Math.abs(l.delta) / 5, 50)}%` }} />
                      ) : (
                        <div className="absolute right-1/2 h-full bg-rose-500/50 rounded" style={{ width: `${Math.min(Math.abs(l.delta) / 5, 50)}%` }} />
                      )}
                    </div>
                  </div>
                  <span className={cn('font-bold tabular-nums w-12 text-right', l.delta > 0 ? 'text-emerald-400' : 'text-rose-400')}>
                    {l.delta > 0 ? '+' : ''}{l.delta}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* All Pairs Summary */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Resumen Multi-Par</h3>
            {data.map(d => (
              <div key={d.pair} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                <span className="text-xs font-medium text-foreground">{d.pair}</span>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-muted/30 rounded-full overflow-hidden flex">
                    <div className="bg-emerald-500/60 h-full" style={{ width: `${d.longPercent}%` }} />
                    <div className="bg-rose-500/60 h-full" style={{ width: `${d.shortPercent}%` }} />
                  </div>
                  <span className={cn('text-[10px] font-bold w-8 text-right', d.netPosition === 'long' ? 'text-emerald-400' : 'text-rose-400')}>
                    {d.longPercent}%
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                El análisis de flujo de órdenes muestra el volumen institucional y el posicionamiento del mercado. El delta (Bid - Ask) indica presión compradora o vendedora en cada nivel de precio.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </PageShell>
  );
}
