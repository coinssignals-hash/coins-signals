import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldAlert, TrendingDown, BarChart3, Activity,
  AlertTriangle, Target, Percent, DollarSign,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PageShell } from '@/components/layout/PageShell';
import { ToolPageHeader } from '@/components/tools/ToolCard';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useImportedTrades } from '@/hooks/useImportedTrades';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function calcRiskMetrics(trades: ReturnType<typeof useImportedTrades>['trades']) {
  const closed = trades
    .filter(t => t.status === 'closed')
    .sort((a, b) => new Date(a.exit_time || a.entry_time).getTime() - new Date(b.exit_time || b.entry_time).getTime());

  if (closed.length === 0) return null;

  const profits = closed.map(t => t.net_profit);
  const totalReturn = profits.reduce((s, p) => s + p, 0);
  const avgReturn = totalReturn / profits.length;
  const variance = profits.reduce((s, p) => s + Math.pow(p - avgReturn, 2), 0) / profits.length;
  const stdDev = Math.sqrt(variance);

  // Equity curve & drawdown
  let peak = 0, cumulative = 0;
  const equityCurve = closed.map((t, i) => {
    cumulative += t.net_profit;
    if (cumulative > peak) peak = cumulative;
    const drawdown = peak > 0 ? ((peak - cumulative) / peak) * 100 : 0;
    return {
      trade: i + 1,
      equity: +cumulative.toFixed(2),
      drawdown: +drawdown.toFixed(2),
      date: format(new Date(t.exit_time || t.entry_time), 'dd/MM', { locale: es }),
    };
  });

  // Max drawdown
  let maxDDValue = 0, maxDDPercent = 0;
  let peakVal = 0;
  cumulative = 0;
  closed.forEach(t => {
    cumulative += t.net_profit;
    if (cumulative > peakVal) peakVal = cumulative;
    const dd = peakVal - cumulative;
    if (dd > maxDDValue) {
      maxDDValue = dd;
      maxDDPercent = peakVal > 0 ? (dd / peakVal) * 100 : 0;
    }
  });

  // VaR (95% confidence) - Historical method
  const sortedProfits = [...profits].sort((a, b) => a - b);
  const var95Index = Math.floor(sortedProfits.length * 0.05);
  const var95 = sortedProfits[var95Index] || 0;

  // Recovery factor
  const recoveryFactor = maxDDValue > 0 ? totalReturn / maxDDValue : Infinity;

  // Calmar ratio
  const calmarRatio = maxDDPercent > 0 ? ((totalReturn / profits.length) * 252) / maxDDPercent : 0;

  // Risk of ruin (simplified)
  const winRate = profits.filter(p => p > 0).length / profits.length;
  const avgWin = profits.filter(p => p > 0).reduce((s, p) => s + p, 0) / (profits.filter(p => p > 0).length || 1);
  const avgLoss = Math.abs(profits.filter(p => p < 0).reduce((s, p) => s + p, 0) / (profits.filter(p => p < 0).length || 1));
  const edge = (winRate * avgWin) - ((1 - winRate) * avgLoss);
  const rorSimple = edge <= 0 ? 100 : Math.max(0, Math.min(100, ((1 - winRate) / winRate) * 100 * (avgLoss / avgWin)));

  // Exposure by symbol
  const symbolStats = new Map<string, { count: number; pnl: number; wins: number }>();
  closed.forEach(t => {
    const s = symbolStats.get(t.symbol) || { count: 0, pnl: 0, wins: 0 };
    s.count++;
    s.pnl += t.net_profit;
    if (t.net_profit > 0) s.wins++;
    symbolStats.set(t.symbol, s);
  });
  const topSymbols = [...symbolStats.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 6)
    .map(([symbol, data]) => ({
      symbol,
      ...data,
      winRate: (data.wins / data.count) * 100,
      concentration: (data.count / closed.length) * 100,
    }));

  return {
    totalReturn,
    stdDev,
    var95,
    maxDDValue,
    maxDDPercent,
    recoveryFactor,
    calmarRatio,
    rorSimple,
    equityCurve,
    topSymbols,
    totalTrades: closed.length,
  };
}

export default function RiskDashboard() {
  const { t } = useTranslation();
  const { trades } = useImportedTrades();
  const [showDD, setShowDD] = useState(false);
  const navigate = useNavigate();

  const metrics = useMemo(() => calcRiskMetrics(trades), [trades]);

  if (!metrics) {
    return (
      <PageShell>
        <div className="px-4 pb-24">
          <ToolPageHeader
            icon={<ShieldAlert className="w-5 h-5" style={{ color: 'hsl(0 70% 55%)' }} />}
            title={t('risk_dashboard_title') || 'Dashboard de Riesgo'}
            subtitle="Sin datos importados"
            accent="0 70% 55%"
          />
          <Card className="bg-card border-border">
            <CardContent className="py-10 text-center">
              <ShieldAlert className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-foreground font-medium text-sm mb-1">Sin datos de riesgo</h3>
              <p className="text-muted-foreground text-xs">Importa operaciones para analizar tu riesgo</p>
            </CardContent>
          </Card>
        </div>
      </PageShell>
    );
  }

  const riskLevel = metrics.rorSimple > 50 ? 'critical' : metrics.rorSimple > 25 ? 'high' : metrics.rorSimple > 10 ? 'moderate' : 'low';
  const riskColors = { critical: 'text-red-500', high: 'text-orange-400', moderate: 'text-amber-400', low: 'text-emerald-400' };
  const riskLabels = { critical: 'Crítico', high: 'Alto', moderate: 'Moderado', low: 'Bajo' };

  return (
    <PageShell>
      <div className="space-y-4 px-4 pb-24">
        <div className="flex items-center gap-3 pt-4">
          <button onClick={() => navigate('/tools')} className="text-muted-foreground"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-base font-bold text-foreground">{t('risk_dashboard_title') || 'Dashboard de Riesgo'}</h1>
        </div>
        {/* Risk Level Banner */}
        <Card className={cn("border-border", riskLevel === 'critical' ? 'bg-red-500/5 border-red-500/30' : riskLevel === 'high' ? 'bg-orange-500/5 border-orange-500/30' : 'bg-card')}>
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", riskLevel === 'critical' || riskLevel === 'high' ? 'bg-red-500/15' : 'bg-emerald-500/15')}>
                <ShieldAlert className={cn("w-6 h-6", riskColors[riskLevel])} />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Nivel de Riesgo</span>
                <p className={cn("text-lg font-bold", riskColors[riskLevel])}>{riskLabels[riskLevel]}</p>
                <p className="text-[10px] text-muted-foreground">Basado en {metrics.totalTrades} operaciones</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Risk Metrics */}
        <div className="grid grid-cols-2 gap-2">
          <RiskCard icon={<TrendingDown className="w-3.5 h-3.5 text-red-400" />} label="Max Drawdown" value={`${metrics.maxDDPercent.toFixed(1)}%`} sub={`$${metrics.maxDDValue.toFixed(2)}`} color="text-red-400" />
          <RiskCard icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-400" />} label="VaR (95%)" value={`$${Math.abs(metrics.var95).toFixed(2)}`} sub="Pérdida máx. probable" color="text-amber-400" />
          <RiskCard icon={<Activity className="w-3.5 h-3.5 text-primary" />} label="Recovery Factor" value={metrics.recoveryFactor === Infinity ? '∞' : metrics.recoveryFactor.toFixed(2)} sub="Retorno / Max DD" color="text-primary" />
          <RiskCard icon={<Percent className="w-3.5 h-3.5 text-purple-400" />} label="Riesgo de Ruina" value={`${metrics.rorSimple.toFixed(1)}%`} sub="Probabilidad estimada" color={riskColors[riskLevel]} />
        </div>

        {/* Equity / Drawdown Chart */}
        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                {showDD ? 'Drawdown (%)' : 'Curva de Equity'}
              </span>
              <button
                onClick={() => setShowDD(!showDD)}
                className="text-[9px] px-2 py-0.5 rounded-full border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                {showDD ? '📈 Equity' : '📉 Drawdown'}
              </button>
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.equityCurve}>
                  <defs>
                    <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={showDD ? 'hsl(0, 72%, 51%)' : 'hsl(var(--primary))'} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={showDD ? 'hsl(0, 72%, 51%)' : 'hsl(var(--primary))'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  {!showDD && <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" strokeOpacity={0.5} />}
                  <Area
                    type="monotone"
                    dataKey={showDD ? 'drawdown' : 'equity'}
                    stroke={showDD ? 'hsl(0, 72%, 51%)' : 'hsl(var(--primary))'}
                    fill="url(#eqGrad)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Volatility */}
        <Card className="bg-card border-border">
          <CardContent className="p-3 space-y-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Volatilidad de Resultados</span>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Desviación Estándar</span>
              <span className="text-xs font-bold text-foreground">${metrics.stdDev.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Calmar Ratio</span>
              <span className="text-xs font-bold text-foreground">{metrics.calmarRatio.toFixed(3)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Retorno Total</span>
              <span className={cn("text-xs font-bold", metrics.totalReturn >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                {metrics.totalReturn >= 0 ? '+' : ''}${metrics.totalReturn.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Concentration Risk */}
        {metrics.topSymbols.length > 0 && (
          <Card className="bg-card border-border">
            <CardContent className="p-3 space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Concentración por Activo</span>
              {metrics.topSymbols.map(s => (
                <div key={s.symbol} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-foreground font-medium">{s.symbol}</span>
                    <span className="text-[10px] text-muted-foreground">{s.count} trades · WR {s.winRate.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", s.concentration > 40 ? 'bg-amber-500' : 'bg-primary')}
                      style={{ width: `${s.concentration}%` }}
                    />
                  </div>
                  {s.concentration > 40 && (
                    <span className="text-[8px] text-amber-400">⚠️ Alta concentración ({s.concentration.toFixed(0)}%)</span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </PageShell>
  );
}

function RiskCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string }) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-2.5 space-y-0.5">
        <div className="flex items-center gap-1">
          {icon}
          <span className="text-[8px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
        </div>
        <p className={cn("text-base font-bold tabular-nums", color)}>{value}</p>
        <p className="text-[9px] text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}
