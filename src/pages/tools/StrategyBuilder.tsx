import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { useTranslation } from '@/i18n/LanguageContext';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Bar, BarChart } from 'recharts';
import {
  Plus, Trash2, Play, Save, TrendingUp, TrendingDown, Layers,
  BarChart3, Zap, GripVertical, ChevronDown, ChevronUp, Copy
} from 'lucide-react';

type ConditionOperator = 'crosses_above' | 'crosses_below' | 'greater_than' | 'less_than' | 'equals';
type LogicGate = 'AND' | 'OR';

interface Condition { id: string; indicator: string; operator: ConditionOperator; value: string; timeframe: string; }
interface StrategyRule { id: string; name: string; conditions: Condition[]; logic: LogicGate; action: 'BUY' | 'SELL'; collapsed: boolean; }
interface Strategy { name: string; pairs: string[]; rules: StrategyRule[]; riskPerTrade: number; stopLossType: 'fixed_pips' | 'atr' | 'percentage'; stopLossValue: number; takeProfitRatio: number; trailingStop: boolean; trailingStopPips: number; }

const INDICATORS = [
  { value: 'sma', label: 'SMA' }, { value: 'ema', label: 'EMA' }, { value: 'rsi', label: 'RSI' },
  { value: 'macd', label: 'MACD' }, { value: 'macd_signal', label: 'MACD Signal' },
  { value: 'bollinger_upper', label: 'Bollinger Upper' }, { value: 'bollinger_lower', label: 'Bollinger Lower' },
  { value: 'stochastic_k', label: 'Stochastic %K' }, { value: 'stochastic_d', label: 'Stochastic %D' },
  { value: 'atr', label: 'ATR' }, { value: 'adx', label: 'ADX' }, { value: 'price', label: 'Price' }, { value: 'volume', label: 'Volume' },
];
const OPERATORS: { value: ConditionOperator; label: string }[] = [
  { value: 'crosses_above', label: '↗ Cruza arriba' }, { value: 'crosses_below', label: '↘ Cruza abajo' },
  { value: 'greater_than', label: '> Mayor que' }, { value: 'less_than', label: '< Menor que' }, { value: 'equals', label: '= Igual a' },
];
const TIMEFRAMES = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1'];
const PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CHF', 'NZD/USD', 'EUR/GBP', 'XAU/USD'];
const uid = () => crypto.randomUUID();
const ACCENT = '160 84% 39%';

const defaultStrategy: Strategy = {
  name: '', pairs: ['EUR/USD'], rules: [], riskPerTrade: 1,
  stopLossType: 'fixed_pips', stopLossValue: 30, takeProfitRatio: 2, trailingStop: false, trailingStopPips: 15,
};

function GlowSection({ color = ACCENT, children, className = '' }: { color?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative rounded-2xl overflow-hidden ${className}`} style={{
      background: `linear-gradient(165deg, hsl(${color} / 0.08) 0%, hsl(var(--card)) 40%, hsl(var(--background)) 100%)`,
      border: `1px solid hsl(${color} / 0.2)`,
    }}>
      <div className="absolute top-0 inset-x-0 h-[2px]" style={{
        background: `linear-gradient(90deg, transparent, hsl(${color} / 0.7), transparent)`,
      }} />
      <div className="relative">{children}</div>
    </div>
  );
}

export default function StrategyBuilder() {
  const { t } = useTranslation();
  const [strategy, setStrategy] = useState<Strategy>({ ...defaultStrategy, name: '' });
  const [savedStrategies, setSavedStrategies] = useState<Strategy[]>([]);
  const [backtestResult, setBacktestResult] = useState<null | {
    totalTrades: number; wins: number; losses: number; profitFactor: number;
    maxDrawdown: number; netPnl: number; sharpe: number;
    equityCurve: { trade: number; equity: number; drawdown: number; pnl: number }[];
    monthlyReturns: { month: string; pnl: number }[];
  }>(null);

  const addRule = (action: 'BUY' | 'SELL') => {
    const rule: StrategyRule = {
      id: uid(), name: `${action === 'BUY' ? 'Entrada' : 'Salida'} ${strategy.rules.length + 1}`,
      conditions: [{ id: uid(), indicator: 'rsi', operator: 'less_than', value: '30', timeframe: 'H1' }],
      logic: 'AND', action, collapsed: false,
    };
    setStrategy(s => ({ ...s, rules: [...s.rules, rule] }));
  };
  const removeRule = (ruleId: string) => setStrategy(s => ({ ...s, rules: s.rules.filter(r => r.id !== ruleId) }));
  const toggleCollapse = (ruleId: string) => setStrategy(s => ({ ...s, rules: s.rules.map(r => r.id === ruleId ? { ...r, collapsed: !r.collapsed } : r) }));
  const addCondition = (ruleId: string) => setStrategy(s => ({ ...s, rules: s.rules.map(r => r.id === ruleId ? { ...r, conditions: [...r.conditions, { id: uid(), indicator: 'ema', operator: 'crosses_above', value: 'sma', timeframe: 'H1' }] } : r) }));
  const removeCondition = (ruleId: string, condId: string) => setStrategy(s => ({ ...s, rules: s.rules.map(r => r.id === ruleId ? { ...r, conditions: r.conditions.filter(c => c.id !== condId) } : r) }));
  const updateCondition = (ruleId: string, condId: string, field: keyof Condition, val: string) => setStrategy(s => ({ ...s, rules: s.rules.map(r => r.id === ruleId ? { ...r, conditions: r.conditions.map(c => c.id === condId ? { ...c, [field]: val } : c) } : r) }));

  const runBacktest = () => {
    if (strategy.rules.length === 0) { toast({ title: 'Agrega al menos una regla', variant: 'destructive' }); return; }
    const total = 80 + Math.floor(Math.random() * 120);
    const wr = 0.4 + Math.random() * 0.25;
    const riskAmt = 10000 * (strategy.riskPerTrade / 100);
    const rr = strategy.takeProfitRatio;
    let balance = 10000; let peak = balance; let maxDD = 0; let wins = 0; let losses = 0; let totalWinAmt = 0; let totalLossAmt = 0;
    const equityCurve: { trade: number; equity: number; drawdown: number; pnl: number }[] = [{ trade: 0, equity: 10000, drawdown: 0, pnl: 0 }];
    const monthlyPnl: number[] = Array(12).fill(0);
    for (let i = 0; i < total; i++) {
      const isWin = Math.random() < wr;
      const slippage = (Math.random() - 0.5) * riskAmt * 0.1;
      const pnl = isWin ? riskAmt * rr + slippage : -(riskAmt + slippage * 0.5);
      balance += pnl;
      if (isWin) { wins++; totalWinAmt += pnl; } else { losses++; totalLossAmt += Math.abs(pnl); }
      if (balance > peak) peak = balance;
      const dd = peak > 0 ? ((peak - balance) / peak) * 100 : 0;
      if (dd > maxDD) maxDD = dd;
      equityCurve.push({ trade: i + 1, equity: +balance.toFixed(2), drawdown: +dd.toFixed(2), pnl: +pnl.toFixed(2) });
      monthlyPnl[i % 12] += pnl;
    }
    const pf = totalLossAmt > 0 ? +(totalWinAmt / totalLossAmt).toFixed(2) : 99;
    const net = +(balance - 10000).toFixed(2);
    const returns = equityCurve.slice(1).map(e => e.pnl);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const stdDev = Math.sqrt(returns.reduce((s, r) => s + (r - avgReturn) ** 2, 0) / returns.length);
    const sharpe = stdDev > 0 ? +((avgReturn / stdDev) * Math.sqrt(252)).toFixed(2) : 0;
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthlyReturns = months.map((m, i) => ({ month: m, pnl: +monthlyPnl[i].toFixed(2) }));
    setBacktestResult({ totalTrades: total, wins, losses, profitFactor: pf, maxDrawdown: +maxDD.toFixed(1), netPnl: net, sharpe, equityCurve, monthlyReturns });
    toast({ title: 'Backtest completado' });
  };

  const saveStrategy = () => {
    if (!strategy.name.trim()) { toast({ title: 'Ingresa un nombre para la estrategia', variant: 'destructive' }); return; }
    setSavedStrategies(prev => [...prev.filter(s => s.name !== strategy.name), { ...strategy }]);
    toast({ title: `Estrategia "${strategy.name}" guardada` });
  };

  return (
    <PageShell>
      <Header />
      <div className="max-w-lg mx-auto space-y-4 pb-24 px-4 pt-4">
        {/* Header */}
        <GlowSection color={ACCENT}>
          <div className="p-4 space-y-3">
            <Input placeholder="Nombre de la estrategia..." value={strategy.name} onChange={e => setStrategy(s => ({ ...s, name: e.target.value }))} className="text-lg font-bold bg-background/40 border-border/30" />
            <div className="flex flex-wrap gap-2">
              {PAIRS.map(p => (
                <Badge key={p} className="cursor-pointer transition-all text-xs" style={strategy.pairs.includes(p) ? {
                  background: `hsl(${ACCENT} / 0.2)`, color: `hsl(${ACCENT})`, border: `1px solid hsl(${ACCENT} / 0.4)`,
                } : { background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', border: '1px solid transparent' }}
                  onClick={() => setStrategy(s => ({ ...s, pairs: s.pairs.includes(p) ? s.pairs.filter(x => x !== p) : [...s.pairs, p] }))}>
                  {p}
                </Badge>
              ))}
            </div>
          </div>
        </GlowSection>

        {/* Rules */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Layers className="w-4 h-4" /> REGLAS DE TRADING
            </h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => addRule('BUY')} className="rounded-lg" style={{ color: 'hsl(160 84% 39%)', borderColor: 'hsl(160 84% 39% / 0.3)' }}>
                <TrendingUp className="w-3 h-3 mr-1" /> Buy
              </Button>
              <Button size="sm" variant="outline" onClick={() => addRule('SELL')} className="rounded-lg" style={{ color: 'hsl(0 84% 60%)', borderColor: 'hsl(0 84% 60% / 0.3)' }}>
                <TrendingDown className="w-3 h-3 mr-1" /> Sell
              </Button>
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            {strategy.rules.map(rule => {
              const ruleColor = rule.action === 'BUY' ? '160 84% 39%' : '0 84% 60%';
              return (
                <motion.div key={rule.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -100 }} layout>
                  <div className="relative rounded-2xl overflow-hidden" style={{
                    background: `linear-gradient(165deg, hsl(${ruleColor} / 0.06) 0%, hsl(var(--card)) 50%, hsl(var(--background)) 100%)`,
                    border: `1px solid hsl(${ruleColor} / 0.2)`,
                    borderLeft: `4px solid hsl(${ruleColor})`,
                  }}>
                    <div className="relative">
                      <div className="p-3 pb-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                            <Badge className="text-xs" style={{
                              background: `hsl(${ruleColor} / 0.2)`, color: `hsl(${ruleColor})`,
                            }}>{rule.action}</Badge>
                            <span className="text-sm font-medium text-foreground">{rule.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleCollapse(rule.id)}>
                              {rule.collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeRule(rule.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {!rule.collapsed && (
                        <div className="p-3 space-y-2">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-muted-foreground">Lógica:</span>
                            <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid hsl(var(--border) / 0.3)' }}>
                              {(['AND', 'OR'] as LogicGate[]).map(g => (
                                <button key={g} className="px-3 py-1 text-xs font-bold transition-colors"
                                  style={rule.logic === g ? { background: `hsl(${ruleColor} / 0.2)`, color: `hsl(${ruleColor})` } : { color: 'hsl(var(--muted-foreground))' }}
                                  onClick={() => setStrategy(s => ({ ...s, rules: s.rules.map(r => r.id === rule.id ? { ...r, logic: g } : r) }))}>
                                  {g}
                                </button>
                              ))}
                            </div>
                          </div>

                          {rule.conditions.map((cond, ci) => (
                            <motion.div key={cond.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                              className="flex flex-wrap items-center gap-2 p-2 rounded-xl" style={{
                                background: 'hsl(var(--background) / 0.4)', border: '1px solid hsl(var(--border) / 0.2)',
                              }}>
                              {ci > 0 && <Badge variant="outline" className="text-[10px]">{rule.logic}</Badge>}
                              <Select value={cond.indicator} onValueChange={v => updateCondition(rule.id, cond.id, 'indicator', v)}>
                                <SelectTrigger className="w-[100px] h-8 text-xs bg-background/40 border-border/30"><SelectValue /></SelectTrigger>
                                <SelectContent>{INDICATORS.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectContent>
                              </Select>
                              <Select value={cond.operator} onValueChange={v => updateCondition(rule.id, cond.id, 'operator', v)}>
                                <SelectTrigger className="w-[130px] h-8 text-xs bg-background/40 border-border/30"><SelectValue /></SelectTrigger>
                                <SelectContent>{OPERATORS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                              </Select>
                              <Input className="w-[70px] h-8 text-xs bg-background/40 border-border/30" value={cond.value} onChange={e => updateCondition(rule.id, cond.id, 'value', e.target.value)} />
                              <Select value={cond.timeframe} onValueChange={v => updateCondition(rule.id, cond.id, 'timeframe', v)}>
                                <SelectTrigger className="w-[65px] h-8 text-xs bg-background/40 border-border/30"><SelectValue /></SelectTrigger>
                                <SelectContent>{TIMEFRAMES.map(tf => <SelectItem key={tf} value={tf}>{tf}</SelectItem>)}</SelectContent>
                              </Select>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeCondition(rule.id, cond.id)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </motion.div>
                          ))}
                          <Button size="sm" variant="ghost" className="text-xs" onClick={() => addCondition(rule.id)}>
                            <Plus className="w-3 h-3 mr-1" /> Condición
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {strategy.rules.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Layers className="w-8 h-8 mx-auto mb-2 opacity-40" />
              Agrega reglas de BUY o SELL para construir tu estrategia
            </div>
          )}
        </div>

        {/* Risk Management */}
        <GlowSection color="45 95% 55%">
          <div className="p-3">
            <div className="text-sm font-semibold flex items-center gap-2 mb-3 text-foreground">
              <Zap className="w-4 h-4" style={{ color: 'hsl(45 95% 55%)' }} /> Gestión de Riesgo
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Riesgo/Trade (%)</label>
                <Input type="number" value={strategy.riskPerTrade} onChange={e => setStrategy(s => ({ ...s, riskPerTrade: +e.target.value }))} className="h-8 text-sm bg-background/40 border-border/30" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">TP Ratio</label>
                <Input type="number" value={strategy.takeProfitRatio} step={0.5} onChange={e => setStrategy(s => ({ ...s, takeProfitRatio: +e.target.value }))} className="h-8 text-sm bg-background/40 border-border/30" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Stop Loss</label>
                <div className="flex gap-1">
                  <Select value={strategy.stopLossType} onValueChange={(v: any) => setStrategy(s => ({ ...s, stopLossType: v }))}>
                    <SelectTrigger className="h-8 text-xs w-[80px] bg-background/40 border-border/30"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed_pips">Pips</SelectItem>
                      <SelectItem value="atr">ATR</SelectItem>
                      <SelectItem value="percentage">%</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="number" value={strategy.stopLossValue} onChange={e => setStrategy(s => ({ ...s, stopLossValue: +e.target.value }))} className="h-8 text-sm flex-1 bg-background/40 border-border/30" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={strategy.trailingStop} onCheckedChange={v => setStrategy(s => ({ ...s, trailingStop: v }))} />
                <span className="text-xs text-foreground">Trailing Stop</span>
              </div>
            </div>
          </div>
        </GlowSection>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button className="flex-1 rounded-xl" variant="outline" onClick={saveStrategy} style={{ borderColor: 'hsl(var(--border) / 0.3)' }}>
            <Save className="w-4 h-4 mr-1" /> Guardar
          </Button>
          <Button className="flex-1 rounded-xl" onClick={runBacktest} style={{
            background: `linear-gradient(135deg, hsl(${ACCENT}), hsl(190 90% 50%))`,
            border: `1px solid hsl(${ACCENT} / 0.4)`,
          }}>
            <Play className="w-4 h-4 mr-1" /> Backtest
          </Button>
        </div>

        {/* Backtest Results */}
        <AnimatePresence>
          {backtestResult && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              <GlowSection color={ACCENT}>
                <div className="p-3">
                  <div className="text-sm font-semibold flex items-center gap-2 mb-3 text-foreground">
                    <BarChart3 className="w-4 h-4" style={{ color: `hsl(${ACCENT})` }} /> Resultados Backtest
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Trades', value: backtestResult.totalTrades, color: '' },
                      { label: 'Win Rate', value: `${((backtestResult.wins / backtestResult.totalTrades) * 100).toFixed(1)}%`, color: '160 84% 39%' },
                      { label: 'Profit Factor', value: backtestResult.profitFactor, color: backtestResult.profitFactor > 1 ? '160 84% 39%' : '0 84% 60%' },
                      { label: 'Sharpe', value: backtestResult.sharpe, color: backtestResult.sharpe > 1 ? '160 84% 39%' : '45 95% 55%' },
                      { label: 'Max DD', value: `${backtestResult.maxDrawdown}%`, color: '0 84% 60%' },
                      { label: 'Net P&L', value: `$${backtestResult.netPnl}`, color: backtestResult.netPnl > 0 ? '160 84% 39%' : '0 84% 60%' },
                    ].map(item => (
                      <div key={item.label} className="rounded-xl p-2 text-center" style={{ background: 'hsl(var(--background) / 0.4)', border: '1px solid hsl(var(--border) / 0.2)' }}>
                        <div className="text-[10px] text-muted-foreground">{item.label}</div>
                        <div className="text-sm font-bold" style={item.color ? { color: `hsl(${item.color})` } : {}}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </GlowSection>

              <GlowSection color="210 80% 55%">
                <div className="p-3">
                  <div className="text-xs text-muted-foreground mb-2">Curva de Equity</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={backtestResult.equityCurve} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs><linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.4} /><stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="trade" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(1)}k`} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} formatter={(v: number) => [`$${v.toLocaleString()}`, 'Equity']} labelFormatter={l => `Trade #${l}`} />
                      <ReferenceLine y={10000} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" opacity={0.5} />
                      <Area type="monotone" dataKey="equity" stroke="hsl(160, 84%, 39%)" fill="url(#eqGrad)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </GlowSection>

              <GlowSection color="0 84% 60%">
                <div className="p-3">
                  <div className="text-xs text-muted-foreground mb-2">Drawdown (%)</div>
                  <ResponsiveContainer width="100%" height={120}>
                    <AreaChart data={backtestResult.equityCurve} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs><linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.4} /><stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="trade" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} reversed tickFormatter={v => `-${v}%`} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} formatter={(v: number) => [`-${v.toFixed(2)}%`, 'Drawdown']} labelFormatter={l => `Trade #${l}`} />
                      <Area type="monotone" dataKey="drawdown" stroke="hsl(0, 84%, 60%)" fill="url(#ddGrad)" strokeWidth={1.5} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </GlowSection>

              <GlowSection color="270 70% 60%">
                <div className="p-3">
                  <div className="text-xs text-muted-foreground mb-2">P&L Mensual</div>
                  <ResponsiveContainer width="100%" height={130}>
                    <BarChart data={backtestResult.monthlyReturns} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} formatter={(v: number) => [`$${v.toFixed(2)}`, 'P&L']} />
                      <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" opacity={0.5} />
                      <Bar dataKey="pnl" radius={[4, 4, 0, 0]} shape={(props: any) => {
                        const { x, y, width, height, payload } = props;
                        return <rect x={x} y={y} width={width} height={height} fill={payload.pnl >= 0 ? 'hsl(160, 84%, 39%)' : 'hsl(0, 84%, 60%)'} rx={3} />;
                      }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlowSection>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Saved Strategies */}
        {savedStrategies.length > 0 && (
          <GlowSection color="210 80% 55%">
            <div className="p-3">
              <div className="text-sm font-semibold mb-3 text-foreground">Estrategias Guardadas ({savedStrategies.length})</div>
              <div className="space-y-2">
                {savedStrategies.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-xl" style={{ background: 'hsl(var(--background) / 0.4)', border: '1px solid hsl(var(--border) / 0.2)' }}>
                    <div>
                      <div className="text-sm font-medium text-foreground">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.rules.length} reglas · {s.pairs.join(', ')}</div>
                    </div>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setStrategy({ ...s })}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </GlowSection>
        )}
      </div>
    </PageShell>
  );
}
