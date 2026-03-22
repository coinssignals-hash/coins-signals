import { useState, useMemo } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';

import { ToolCard, ToolPageHeader } from '@/components/tools/ToolCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ArrowLeft, Workflow, Play, Plus, Trash2, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTranslation } from '@/i18n/LanguageContext';

interface Strategy {
  id: string;
  name: string;
  winRate: number;
  avgRR: number;
  tradesPerMonth: number;
  riskPercent: number;
  color: string;
}

interface BacktestResult {
  strategyId: string;
  name: string;
  color: string;
  equityCurve: number[];
  totalReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  profitFactor: number;
  totalTrades: number;
  winningTrades: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(142 71% 45%)', 'hsl(38 92% 50%)', 'hsl(280 65% 60%)'];

function runBacktest(strategy: Strategy, capital: number, months: number): BacktestResult {
  const totalTrades = strategy.tradesPerMonth * months;
  let balance = capital;
  const curve = [capital];
  let wins = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let peak = capital;
  let maxDD = 0;
  const returns: number[] = [];

  for (let i = 0; i < totalTrades; i++) {
    const riskAmt = balance * (strategy.riskPercent / 100);
    const prevBalance = balance;
    if (Math.random() < strategy.winRate / 100) {
      balance += riskAmt * strategy.avgRR;
      wins++;
      grossProfit += riskAmt * strategy.avgRR;
    } else {
      balance -= riskAmt;
      grossLoss += riskAmt;
    }
    balance = Math.max(0, balance);
    returns.push((balance - prevBalance) / prevBalance);
    if (balance > peak) peak = balance;
    const dd = (peak - balance) / peak;
    if (dd > maxDD) maxDD = dd;
    if (i % strategy.tradesPerMonth === 0) curve.push(Math.round(balance));
  }

  const avgReturn = returns.reduce((s, r) => s + r, 0) / returns.length;
  const stdDev = Math.sqrt(returns.reduce((s, r) => s + (r - avgReturn) ** 2, 0) / returns.length);
  const sharpe = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

  return {
    strategyId: strategy.id,
    name: strategy.name,
    color: strategy.color,
    equityCurve: curve,
    totalReturn: ((balance - capital) / capital) * 100,
    maxDrawdown: maxDD * 100,
    sharpeRatio: sharpe,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : 0,
    totalTrades,
    winningTrades: wins,
  };
}

const ACCENT = '280 65% 55%';

export default function BacktestPro() {
  const { t } = useTranslation();
  const [capital, setCapital] = useState(10000);
  const [months, setMonths] = useState(12);
  const [strategies, setStrategies] = useState<Strategy[]>([
    { id: '1', name: 'Tendencia EMA', winRate: 48, avgRR: 2.5, tradesPerMonth: 15, riskPercent: 1.5, color: COLORS[0] },
    { id: '2', name: 'Reversión RSI', winRate: 62, avgRR: 1.2, tradesPerMonth: 25, riskPercent: 1, color: COLORS[1] },
  ]);
  const [results, setResults] = useState<BacktestResult[] | null>(null);
  const [running, setRunning] = useState(false);

  const addStrategy = () => {
    if (strategies.length >= 4) return;
    setStrategies(prev => [...prev, {
      id: Date.now().toString(),
      name: `${t('tp_backtest_strategy')} ${prev.length + 1}`,
      winRate: 55,
      avgRR: 1.5,
      tradesPerMonth: 20,
      riskPercent: 2,
      color: COLORS[prev.length % COLORS.length],
    }]);
  };

  const removeStrategy = (id: string) => setStrategies(prev => prev.filter(s => s.id !== id));

  const updateStrategy = (id: string, field: keyof Strategy, value: string | number) => {
    setStrategies(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleRun = () => {
    setRunning(true);
    setTimeout(() => {
      setResults(strategies.map(s => runBacktest(s, capital, months)));
      setRunning(false);
    }, 500);
  };

  const chartData = useMemo(() => {
    if (!results) return [];
    const maxLen = Math.max(...results.map(r => r.equityCurve.length));
    return Array.from({ length: maxLen }, (_, i) => {
      const point: Record<string, number> = { month: i };
      results.forEach(r => {
        point[r.name] = r.equityCurve[i] ?? r.equityCurve[r.equityCurve.length - 1];
      });
      return point;
    });
  }, [results]);

  return (
    <PageShell>
      <Header />
      <main className="container py-3 max-w-lg mx-auto px-3 space-y-3">
        <div className="flex items-center justify-between">
        <ToolPageHeader
          icon={<Workflow className="w-5 h-5" style={{ color: `hsl(${ACCENT})` }} />}
          title={t('bt_title')}
          accent={ACCENT}
        />
          {strategies.length < 4 && (
            <Button variant="outline" size="sm" onClick={addStrategy} className="gap-1 text-xs">
              <Plus className="w-3 h-3" /> {t('tp_backtest_strategy')}
            </Button>
          )}
        </div>

        {/* Global Config */}
        <ToolCard accent={ACCENT}>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">{t('tp_initial_capital')}</Label>
                <Input type="number" value={capital} onChange={e => setCapital(+e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">{t('tp_period_months')}</Label>
                <Input type="number" value={months} onChange={e => setMonths(+e.target.value)} className="mt-1" />
              </div>
            </div>
          </div>
        </ToolCard>

        {/* Strategy Cards */}
        {strategies.map((strat, idx) => (
          <div key={strat.id} className="rounded-xl overflow-hidden" style={{ background: "hsl(var(--card) / 0.6)", border: "1px solid hsl(var(--border) / 0.5)", borderLeftColor: strat.color, borderLeftWidth: 3 }}>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Input
                  value={strat.name}
                  onChange={e => updateStrategy(strat.id, 'name', e.target.value)}
                  className="h-7 text-sm font-semibold w-44 border-none p-0 bg-transparent"
                />
                {strategies.length > 1 && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => removeStrategy(strat.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground">{t('tp_win_rate')}</Label>
                  <Input type="number" value={strat.winRate} onChange={e => updateStrategy(strat.id, 'winRate', +e.target.value)} className="h-8 text-xs mt-0.5" />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">{t('bt_avg_rr')}</Label>
                  <Input type="number" step="0.1" value={strat.avgRR} onChange={e => updateStrategy(strat.id, 'avgRR', +e.target.value)} className="h-8 text-xs mt-0.5" />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">{t('tp_trades_month')}</Label>
                  <Input type="number" value={strat.tradesPerMonth} onChange={e => updateStrategy(strat.id, 'tradesPerMonth', +e.target.value)} className="h-8 text-xs mt-0.5" />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">{t('tp_risk_per_trade')}</Label>
                  <Input type="number" step="0.5" value={strat.riskPercent} onChange={e => updateStrategy(strat.id, 'riskPercent', +e.target.value)} className="h-8 text-xs mt-0.5" />
                </div>
              </div>
            </div>
          </div>
        ))}

        <Button onClick={handleRun} disabled={running} className="w-full gap-2">
          <Play className="w-4 h-4" />
          {running ? t('tp_running') : t('tp_run_backtest')}
        </Button>

        {results && (
          <>
            {/* Equity Chart */}
            <ToolCard accent={ACCENT}>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">{t('tp_equity_curves')}</h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      {results.map(r => (
                        <Line key={r.strategyId} type="monotone" dataKey={r.name} stroke={r.color} strokeWidth={2} dot={false} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </ToolCard>

            {/* Comparison Table */}
            <ToolCard accent={ACCENT}>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">{t('tp_comparison')}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-[9px] text-muted-foreground text-left pb-2">{t('tp_metric')}</th>
                        {results.map(r => (
                          <th key={r.strategyId} className="text-[9px] text-center pb-2" style={{ color: r.color }}>{r.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {[
                        { label: t('tp_total_return'), key: 'totalReturn', fmt: (v: number) => `${v.toFixed(1)}%`, good: (v: number) => v > 0 },
                        { label: t('tp_max_drawdown'), key: 'maxDrawdown', fmt: (v: number) => `${v.toFixed(1)}%`, good: (v: number) => v < 20 },
                        { label: t('tp_sharpe_ratio'), key: 'sharpeRatio', fmt: (v: number) => v.toFixed(2), good: (v: number) => v > 1 },
                        { label: t('tp_profit_factor'), key: 'profitFactor', fmt: (v: number) => v.toFixed(2), good: (v: number) => v > 1.5 },
                        { label: t('tp_win_rate'), key: 'winningTrades', fmt: (v: number, r: BacktestResult) => `${((r.winningTrades / r.totalTrades) * 100).toFixed(1)}%`, good: (v: number) => v > 50 },
                        { label: t('tp_total_trades'), key: 'totalTrades', fmt: (v: number) => v.toString(), good: () => true },
                      ].map(metric => (
                        <tr key={metric.label} className="border-t border-border/20">
                          <td className="py-2 text-muted-foreground">{metric.label}</td>
                          {results.map(r => {
                            const val = (r as any)[metric.key];
                            return (
                              <td key={r.strategyId} className={cn('py-2 text-center font-bold tabular-nums', metric.good(val) ? 'text-emerald-400' : 'text-rose-400')}>
                                {metric.fmt(val, r)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </ToolCard>
          </>
        )}

        <ToolCard accent={ACCENT}>
          <div className="p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {t('tp_backtest_info')}
              </p>
            </div>
          </div>
        </ToolCard>
      </main>
    </PageShell>
  );
}
