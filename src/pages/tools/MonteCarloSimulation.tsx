import { useState, useMemo } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ArrowLeft, PieChart, Play, RotateCcw, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useTranslation } from '@/i18n/LanguageContext';

interface SimResult {
  paths: number[][];
  finalValues: number[];
  median: number;
  p5: number;
  p25: number;
  p75: number;
  p95: number;
  maxDrawdown: number;
  probProfit: number;
  probRuin: number;
}

function runSimulation(
  capital: number,
  winRate: number,
  avgWin: number,
  avgLoss: number,
  tradesPerMonth: number,
  months: number,
  simulations: number,
  riskPerTrade: number
): SimResult {
  const totalTrades = tradesPerMonth * months;
  const paths: number[][] = [];
  const finalValues: number[] = [];

  for (let s = 0; s < simulations; s++) {
    let balance = capital;
    const path = [capital];
    for (let t = 0; t < totalTrades; t++) {
      const riskAmount = balance * (riskPerTrade / 100);
      if (Math.random() < winRate / 100) {
        balance += riskAmount * (avgWin / avgLoss);
      } else {
        balance -= riskAmount;
      }
      balance = Math.max(0, balance);
      if (t % tradesPerMonth === 0 || t === totalTrades - 1) {
        path.push(balance);
      }
    }
    paths.push(path);
    finalValues.push(balance);
  }

  finalValues.sort((a, b) => a - b);
  const percentile = (arr: number[], p: number) => arr[Math.floor(arr.length * p / 100)];

  // Max drawdown from median path
  const medianPath = paths[Math.floor(paths.length / 2)];
  let peak = medianPath[0];
  let maxDD = 0;
  for (const v of medianPath) {
    if (v > peak) peak = v;
    const dd = (peak - v) / peak;
    if (dd > maxDD) maxDD = dd;
  }

  return {
    paths,
    finalValues,
    median: percentile(finalValues, 50),
    p5: percentile(finalValues, 5),
    p25: percentile(finalValues, 25),
    p75: percentile(finalValues, 75),
    p95: percentile(finalValues, 95),
    maxDrawdown: maxDD,
    probProfit: finalValues.filter(v => v > capital).length / simulations * 100,
    probRuin: finalValues.filter(v => v <= capital * 0.1).length / simulations * 100,
  };
}

export default function MonteCarloSimulation() {
  const { t } = useTranslation();
  const [capital, setCapital] = useState(10000);
  const [winRate, setWinRate] = useState(55);
  const [avgWin, setAvgWin] = useState(2);
  const [avgLoss, setAvgLoss] = useState(1);
  const [tradesPerMonth, setTradesPerMonth] = useState(20);
  const [months, setMonths] = useState(12);
  const [riskPerTrade, setRiskPerTrade] = useState(2);
  const [simulations] = useState(500);
  const [result, setResult] = useState<SimResult | null>(null);
  const [running, setRunning] = useState(false);

  function handleRun() {
    setRunning(true);
    setTimeout(() => {
      const r = runSimulation(capital, winRate, avgWin, avgLoss, tradesPerMonth, months, simulations, riskPerTrade);
      setResult(r);
      setRunning(false);
    }, 300);
  }

  const chartData = useMemo(() => {
    if (!result) return [];
    const numPoints = result.paths[0].length;
    return Array.from({ length: numPoints }, (_, i) => {
      const vals = result.paths.map(p => p[i]).sort((a, b) => a - b);
      const pct = (p: number) => vals[Math.floor(vals.length * p / 100)];
      return {
        month: i,
        p5: Math.round(pct(5)),
        p25: Math.round(pct(25)),
        median: Math.round(pct(50)),
        p75: Math.round(pct(75)),
        p95: Math.round(pct(95)),
      };
    });
  }, [result]);

  const distributionData = useMemo(() => {
    if (!result) return [];
    const min = Math.min(...result.finalValues);
    const max = Math.max(...result.finalValues);
    const buckets = 30;
    const step = (max - min) / buckets;
    const bins = Array.from({ length: buckets }, (_, i) => ({
      range: Math.round(min + i * step),
      count: 0,
    }));
    for (const v of result.finalValues) {
      const idx = Math.min(Math.floor((v - min) / step), buckets - 1);
      bins[idx].count++;
    }
    return bins;
  }, [result]);

  return (
    <PageShell>
      <Header />
      <main className="container py-6 space-y-5">
        <div className="flex items-center gap-3">
          <Link to="/tools" className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </Link>
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground">{t('tools_monte_carlo_title')}</h1>
          </div>
        </div>

        {/* Parameters */}
        <Card className="bg-card border-border">
          <CardContent className="p-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{t('tp_monte_carlo_params')}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">{t('tp_initial_capital')}</Label>
                <Input type="number" value={capital} onChange={e => setCapital(+e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">{t('tp_win_rate')}</Label>
                <Input type="number" value={winRate} onChange={e => setWinRate(+e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">{t('tp_gain_ratio')}</Label>
                <Input type="number" step="0.1" value={avgWin} onChange={e => setAvgWin(+e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">{t('tp_loss_ratio')}</Label>
                <Input type="number" step="0.1" value={avgLoss} onChange={e => setAvgLoss(+e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">{t('tp_trades_month')}</Label>
                <Input type="number" value={tradesPerMonth} onChange={e => setTradesPerMonth(+e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">{t('tp_months')}</Label>
                <Input type="number" value={months} onChange={e => setMonths(+e.target.value)} className="mt-1" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground">{t('tp_risk_per_trade')}</Label>
                <Input type="number" step="0.5" value={riskPerTrade} onChange={e => setRiskPerTrade(+e.target.value)} className="mt-1" />
              </div>
            </div>
            <Button onClick={handleRun} disabled={running} className="w-full gap-2">
              <Play className="w-4 h-4" />
              {running ? t('tp_simulating') : t('tp_run_simulations').replace('{count}', String(simulations))}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            {/* Equity Projection Chart */}
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Proyección de Capital</h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} label={{ value: 'Mes', position: 'bottom', fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
                      <Area type="monotone" dataKey="p5" stackId="1" fill="hsl(var(--destructive) / 0.1)" stroke="none" />
                      <Area type="monotone" dataKey="p25" stackId="2" fill="hsl(var(--primary) / 0.1)" stroke="none" />
                      <Area type="monotone" dataKey="p75" stackId="3" fill="hsl(var(--primary) / 0.1)" stroke="none" />
                      <Area type="monotone" dataKey="p95" stackId="4" fill="hsl(var(--primary) / 0.05)" stroke="none" />
                      <Line type="monotone" dataKey="median" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-2 text-[9px] text-muted-foreground">
                  <span>━ Mediana</span>
                  <span className="text-primary/60">■ P25-P75</span>
                  <span className="text-primary/30">■ P5-P95</span>
                </div>
              </CardContent>
            </Card>

            {/* Distribution */}
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Distribución de Resultados Finales</h3>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={distributionData}>
                      <XAxis dataKey="range" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                      <YAxis hide />
                      <Area type="monotone" dataKey="count" fill="hsl(var(--primary) / 0.3)" stroke="hsl(var(--primary))" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className="bg-card border-border">
              <CardContent className="p-4 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Estadísticas Clave</h3>
                {[
                  { label: 'Capital Mediano Final', value: `$${result.median.toLocaleString()}`, color: result.median > capital ? 'text-emerald-400' : 'text-rose-400' },
                  { label: 'Mejor Escenario (P95)', value: `$${result.p95.toLocaleString()}`, color: 'text-emerald-400' },
                  { label: 'Peor Escenario (P5)', value: `$${result.p5.toLocaleString()}`, color: 'text-rose-400' },
                  { label: 'Max Drawdown (mediana)', value: `${(result.maxDrawdown * 100).toFixed(1)}%`, color: 'text-rose-400' },
                  { label: 'Probabilidad de Ganancia', value: `${result.probProfit.toFixed(1)}%`, color: result.probProfit > 50 ? 'text-emerald-400' : 'text-rose-400' },
                  { label: 'Probabilidad de Ruina (<10%)', value: `${result.probRuin.toFixed(1)}%`, color: result.probRuin < 5 ? 'text-emerald-400' : 'text-rose-400' },
                ].map(s => (
                  <div key={s.label} className="flex justify-between items-center py-1.5 border-b border-border/30 last:border-0">
                    <span className="text-xs text-muted-foreground">{s.label}</span>
                    <span className={cn('text-sm font-bold tabular-nums', s.color)}>{s.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    La simulación Monte Carlo genera múltiples escenarios aleatorios basados en tus parámetros de trading para proyectar resultados probabilísticos. Úsala para evaluar la robustez de tu estrategia antes de arriesgar capital real.
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </PageShell>
  );
}
