import { useState, useMemo, useEffect } from 'react';
import {
  ShieldAlert, TrendingDown, Activity,
  AlertTriangle, Percent, BarChart3, PieChart as PieChartIcon,
  Info, Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { GlowSection } from '@/components/ui/glow-section';
import { cn } from '@/lib/utils';
import { useImportedTrades, ImportedTrade } from '@/hooks/useImportedTrades';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import { useDateLocale } from '@/hooks/useDateLocale';
import { useTranslation } from '@/i18n/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

const ACCENT = '0 70% 55%';

interface UnifiedTrade {
  symbol: string;
  net_profit: number;
  exit_time: string;
  side: string;
  source: 'imported' | 'journal';
}

function mergeTradeData(
  importedTrades: ImportedTrade[],
  journalTrades: any[]
): UnifiedTrade[] {
  const unified: UnifiedTrade[] = [];

  importedTrades
    .filter(t => t.status === 'closed')
    .forEach(t => {
      unified.push({
        symbol: t.symbol,
        net_profit: t.net_profit,
        exit_time: t.exit_time || t.entry_time,
        side: t.side,
        source: 'imported',
      });
    });

  journalTrades.forEach(t => {
    const pips = Number(t.pips) || 0;
    const lotSize = Number(t.lot_size) || 0.01;
    // Approximate PnL from pips (forex standard: 1 pip = $10 per standard lot)
    const pnl = t.result === 'win' ? Math.abs(pips * lotSize * 10) : t.result === 'loss' ? -Math.abs(pips * lotSize * 10) : 0;
    unified.push({
      symbol: t.pair?.replace('/', '') || t.pair || 'UNKNOWN',
      net_profit: pnl,
      exit_time: t.completed_at || t.trade_date || t.created_at,
      side: t.action?.toLowerCase() || 'buy',
      source: 'journal',
    });
  });

  return unified.sort((a, b) => new Date(a.exit_time).getTime() - new Date(b.exit_time).getTime());
}

function calcRiskMetrics(trades: UnifiedTrade[]) {
  if (trades.length === 0) return null;

  const profits = trades.map(t => t.net_profit);
  const totalReturn = profits.reduce((s, p) => s + p, 0);
  const avgReturn = totalReturn / profits.length;
  const variance = profits.reduce((s, p) => s + Math.pow(p - avgReturn, 2), 0) / profits.length;
  const stdDev = Math.sqrt(variance);

  // Equity curve + drawdown
  let peak = 0, cumulative = 0;
  const equityCurve = trades.map((t, i) => {
    cumulative += t.net_profit;
    if (cumulative > peak) peak = cumulative;
    const drawdown = peak > 0 ? ((peak - cumulative) / peak) * 100 : 0;
    return {
      trade: i + 1,
      equity: +cumulative.toFixed(2),
      drawdown: +drawdown.toFixed(2),
      date: format(new Date(t.exit_time), 'dd/MM'),
      profit: +t.net_profit.toFixed(2),
    };
  });

  // Max drawdown
  let maxDDValue = 0, maxDDPercent = 0, peakVal = 0;
  cumulative = 0;
  trades.forEach(t => {
    cumulative += t.net_profit;
    if (cumulative > peakVal) peakVal = cumulative;
    const dd = peakVal - cumulative;
    if (dd > maxDDValue) {
      maxDDValue = dd;
      maxDDPercent = peakVal > 0 ? (dd / peakVal) * 100 : 0;
    }
  });

  // VaR (95%)
  const sortedProfits = [...profits].sort((a, b) => a - b);
  const var95Index = Math.floor(sortedProfits.length * 0.05);
  const var95 = sortedProfits[var95Index] || 0;

  // Recovery Factor
  const recoveryFactor = maxDDValue > 0 ? totalReturn / maxDDValue : Infinity;

  // Sharpe Ratio (simplified, annualized ~252 trading days)
  const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

  // Win/Loss stats
  const wins = profits.filter(p => p > 0);
  const losses = profits.filter(p => p < 0);
  const winRate = wins.length / profits.length;
  const avgWin = wins.length > 0 ? wins.reduce((s, p) => s + p, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, p) => s + p, 0) / losses.length) : 0;
  const profitFactor = avgLoss > 0 && losses.length > 0
    ? (wins.reduce((s, p) => s + p, 0)) / Math.abs(losses.reduce((s, p) => s + p, 0))
    : Infinity;

  // Expectancy
  const expectancy = (winRate * avgWin) - ((1 - winRate) * avgLoss);

  // Risk of Ruin (simplified Kelly-based)
  const edge = expectancy;
  const rorSimple = edge <= 0 ? 100 : Math.max(0, Math.min(100, ((1 - winRate) / winRate) * 100 * (avgLoss / (avgWin || 1))));

  // Concentration by symbol
  const symbolStats = new Map<string, { count: number; pnl: number; wins: number }>();
  trades.forEach(t => {
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
      concentration: (data.count / trades.length) * 100,
    }));

  // Side distribution
  const buyCount = trades.filter(t => t.side.toLowerCase() === 'buy').length;
  const sellCount = trades.length - buyCount;

  // Source distribution
  const importedCount = trades.filter(t => t.source === 'imported').length;
  const journalCount = trades.filter(t => t.source === 'journal').length;

  // Consecutive losses (max streak)
  let maxLossStreak = 0, currentStreak = 0;
  profits.forEach(p => {
    if (p < 0) { currentStreak++; maxLossStreak = Math.max(maxLossStreak, currentStreak); }
    else currentStreak = 0;
  });

  return {
    totalReturn, stdDev, var95, maxDDValue, maxDDPercent,
    recoveryFactor, sharpeRatio, profitFactor, expectancy,
    rorSimple, equityCurve, topSymbols, totalTrades: trades.length,
    winRate: winRate * 100, wins: wins.length, losses: losses.length,
    avgWin, avgLoss, buyCount, sellCount,
    importedCount, journalCount, maxLossStreak,
  };
}

const PIE_COLORS = ['hsl(210, 80%, 55%)', 'hsl(0, 70%, 55%)', 'hsl(45, 80%, 55%)', 'hsl(160, 60%, 50%)', 'hsl(270, 60%, 55%)', 'hsl(30, 80%, 55%)'];

function MetricCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string }) {
  return (
    <div className="rounded-xl p-3 space-y-1" style={{
      background: 'hsl(var(--card) / 0.6)',
      border: '1px solid hsl(var(--border) / 0.5)',
    }}>
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
      </div>
      <p className={cn("text-lg font-bold tabular-nums leading-tight", color)}>{value}</p>
      <p className="text-[9px] text-muted-foreground leading-tight">{sub}</p>
    </div>
  );
}

export function RiskDashboardSection() {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const { trades: importedTrades, loading: importedLoading } = useImportedTrades();
  const { user } = useAuth();
  const [journalTrades, setJournalTrades] = useState<any[]>([]);
  const [journalLoading, setJournalLoading] = useState(true);
  const [chartMode, setChartMode] = useState<'equity' | 'drawdown' | 'pnl'>('equity');

  // Fetch journal trades
  useEffect(() => {
    async function loadJournal() {
      if (!user) { setJournalLoading(false); return; }
      try {
        const { data } = await supabase
          .from('trading_journal')
          .select('*')
          .eq('user_id', user.id)
          .order('trade_date', { ascending: true });
        setJournalTrades(data || []);
      } catch { }
      setJournalLoading(false);
    }
    loadJournal();
  }, [user]);

  const unified = useMemo(() => mergeTradeData(importedTrades, journalTrades), [importedTrades, journalTrades]);
  const metrics = useMemo(() => calcRiskMetrics(unified), [unified]);

  const loading = importedLoading || journalLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <GlowSection color={ACCENT}>
        <div className="p-6 text-center space-y-3">
          <ShieldAlert className="w-12 h-12 mx-auto" style={{ color: `hsl(${ACCENT})` }} />
          <h3 className="text-foreground font-bold text-sm">{t('risk_no_data') || 'Sin datos de riesgo'}</h3>
          <p className="text-muted-foreground text-xs">{t('risk_import_hint') || 'Importa operaciones o registra trades en el Diario para analizar tu riesgo'}</p>
        </div>
      </GlowSection>
    );
  }

  const riskLevel = metrics.rorSimple > 50 ? 'critical' : metrics.rorSimple > 25 ? 'high' : metrics.rorSimple > 10 ? 'moderate' : 'low';
  const riskColors = { critical: 'text-red-500', high: 'text-orange-400', moderate: 'text-amber-400', low: 'text-emerald-400' };
  const riskBg = { critical: 'hsl(0 70% 50% / 0.1)', high: 'hsl(30 80% 50% / 0.1)', moderate: 'hsl(45 80% 50% / 0.08)', low: 'hsl(142 60% 50% / 0.08)' };
  const riskBorder = { critical: 'hsl(0 70% 50% / 0.3)', high: 'hsl(30 80% 50% / 0.3)', moderate: 'hsl(45 80% 50% / 0.2)', low: 'hsl(142 60% 50% / 0.2)' };
  const riskLabels = {
    critical: t('risk_level_critical') || 'Crítico',
    high: t('risk_level_high') || 'Alto',
    moderate: t('risk_level_moderate') || 'Moderado',
    low: t('risk_level_low') || 'Bajo',
  };

  const chartDataKey = chartMode === 'drawdown' ? 'drawdown' : chartMode === 'pnl' ? 'profit' : 'equity';
  const chartColor = chartMode === 'drawdown' ? 'hsl(0, 72%, 51%)' : chartMode === 'pnl' ? 'hsl(210, 80%, 55%)' : 'hsl(var(--primary))';

  const pieData = metrics.topSymbols.map(s => ({ name: s.symbol, value: s.count }));

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{
            background: `linear-gradient(165deg, hsl(${ACCENT} / 0.25), hsl(${ACCENT} / 0.08))`,
            border: `1px solid hsl(${ACCENT} / 0.3)`,
            boxShadow: `0 0 15px hsl(${ACCENT} / 0.1)`,
          }}>
            <ShieldAlert className="w-4.5 h-4.5" style={{ color: `hsl(${ACCENT})` }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">{t('risk_dashboard_title') || 'Dashboard de Riesgo'}</h3>
            <p className="text-[10px] text-muted-foreground">
              {metrics.totalTrades} {t('risk_trades') || 'operaciones'} · {metrics.importedCount} {t('risk_imported') || 'importadas'} · {metrics.journalCount} {t('risk_journal') || 'diario'}
            </p>
          </div>
        </div>
      </div>

      {/* Risk Level Banner */}
      <GlowSection color={riskLevel === 'low' ? '142 60% 50%' : riskLevel === 'moderate' ? '45 80% 55%' : ACCENT}>
        <div className="p-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{
              background: riskBg[riskLevel],
              border: `1px solid ${riskBorder[riskLevel]}`,
            }}>
              <ShieldAlert className={cn("w-7 h-7", riskColors[riskLevel])} />
            </div>
            <div className="flex-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{t('risk_level') || 'Nivel de Riesgo'}</span>
              <p className={cn("text-xl font-bold", riskColors[riskLevel])}>{riskLabels[riskLevel]}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] text-muted-foreground">WR: <span className="text-foreground font-semibold">{metrics.winRate.toFixed(1)}%</span></span>
                <span className="text-[10px] text-muted-foreground">PF: <span className="text-foreground font-semibold">{metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2)}</span></span>
                <span className="text-[10px] text-muted-foreground">Racha: <span className="text-red-400 font-semibold">{metrics.maxLossStreak}</span></span>
              </div>
            </div>
          </div>
        </div>
      </GlowSection>

      {/* Core Metrics Grid */}
      <div className="grid grid-cols-2 gap-2">
        <MetricCard
          icon={<TrendingDown className="w-3.5 h-3.5 text-red-400" />}
          label={t('risk_max_dd') || "Max Drawdown"}
          value={`${metrics.maxDDPercent.toFixed(1)}%`}
          sub={`$${metrics.maxDDValue.toFixed(2)}`}
          color="text-red-400"
        />
        <MetricCard
          icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
          label={t('risk_var95') || "VaR (95%)"}
          value={`$${Math.abs(metrics.var95).toFixed(2)}`}
          sub={t('risk_var_desc') || "Pérdida máx. probable"}
          color="text-amber-400"
        />
        <MetricCard
          icon={<Activity className="w-3.5 h-3.5 text-primary" />}
          label={t('risk_recovery') || "Recovery Factor"}
          value={metrics.recoveryFactor === Infinity ? '∞' : metrics.recoveryFactor.toFixed(2)}
          sub={t('risk_recovery_desc') || "Retorno / Max DD"}
          color="text-primary"
        />
        <MetricCard
          icon={<Percent className="w-3.5 h-3.5 text-purple-400" />}
          label={t('risk_ruin') || "Riesgo de Ruina"}
          value={`${metrics.rorSimple.toFixed(1)}%`}
          sub={t('risk_ruin_desc') || "Probabilidad estimada"}
          color={riskColors[riskLevel]}
        />
      </div>

      {/* Additional Metrics Row */}
      <div className="grid grid-cols-3 gap-2">
        <MetricCard
          icon={<BarChart3 className="w-3.5 h-3.5 text-blue-400" />}
          label="Sharpe"
          value={metrics.sharpeRatio.toFixed(2)}
          sub={t('risk_annualized') || "Anualizado"}
          color="text-blue-400"
        />
        <MetricCard
          icon={<Info className="w-3.5 h-3.5 text-emerald-400" />}
          label={t('risk_expectancy') || "Expectativa"}
          value={`$${metrics.expectancy.toFixed(2)}`}
          sub={t('risk_per_trade') || "Por operación"}
          color={metrics.expectancy >= 0 ? 'text-emerald-400' : 'text-red-400'}
        />
        <MetricCard
          icon={<Activity className="w-3.5 h-3.5 text-cyan-400" />}
          label={t('risk_volatility') || "Volatilidad"}
          value={`$${metrics.stdDev.toFixed(2)}`}
          sub="Std Dev"
          color="text-cyan-400"
        />
      </div>

      {/* Chart Section */}
      <GlowSection color={chartMode === 'drawdown' ? ACCENT : '210 70% 55%'}>
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              {chartMode === 'equity'
                ? (t('risk_equity_curve') || 'Curva de Equity')
                : chartMode === 'drawdown'
                ? 'Drawdown (%)'
                : (t('risk_pnl_distribution') || 'P&L por Trade')}
            </span>
            <div className="flex gap-1">
              {(['equity', 'drawdown', 'pnl'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setChartMode(mode)}
                  className="text-[9px] px-2 py-0.5 rounded-full transition-all"
                  style={{
                    background: chartMode === mode ? `hsl(${ACCENT} / 0.2)` : 'transparent',
                    border: `1px solid ${chartMode === mode ? `hsl(${ACCENT} / 0.4)` : 'hsl(var(--border) / 0.3)'}`,
                    color: chartMode === mode ? `hsl(${ACCENT})` : 'hsl(var(--muted-foreground))',
                  }}
                >
                  {mode === 'equity' ? '📈' : mode === 'drawdown' ? '📉' : '💰'}
                </button>
              ))}
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.equityCurve}>
                <defs>
                  <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={45} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(val: number) => [`$${val.toFixed(2)}`, chartMode === 'drawdown' ? 'DD%' : chartMode === 'pnl' ? 'P&L' : 'Equity']}
                />
                {chartMode !== 'drawdown' && <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" strokeOpacity={0.5} />}
                <Area
                  type="monotone"
                  dataKey={chartDataKey}
                  stroke={chartColor}
                  fill="url(#riskGrad)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3, fill: chartColor }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </GlowSection>

      {/* Win/Loss Summary */}
      <GlowSection color="142 60% 50%">
        <div className="p-3">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2 block">
            {t('risk_win_loss') || 'Resumen Win/Loss'}
          </span>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">{metrics.wins}</p>
              <p className="text-[10px] text-muted-foreground">{t('risk_wins') || 'Ganadas'}</p>
              <p className="text-xs text-emerald-400/70 mt-0.5">{t('risk_avg') || 'Prom'}: ${metrics.avgWin.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">{metrics.losses}</p>
              <p className="text-[10px] text-muted-foreground">{t('risk_losses') || 'Perdidas'}</p>
              <p className="text-xs text-red-400/70 mt-0.5">{t('risk_avg') || 'Prom'}: ${metrics.avgLoss.toFixed(2)}</p>
            </div>
          </div>
          {/* Win rate bar */}
          <div className="mt-3 h-2 rounded-full bg-red-500/20 overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${metrics.winRate}%` }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-emerald-400">{metrics.winRate.toFixed(1)}% Win</span>
            <span className="text-[9px] text-red-400">{(100 - metrics.winRate).toFixed(1)}% Loss</span>
          </div>
        </div>
      </GlowSection>

      {/* Side Distribution */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl p-3" style={{
          background: 'hsl(var(--card) / 0.6)',
          border: '1px solid hsl(var(--border) / 0.5)',
        }}>
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">{t('risk_direction') || 'Dirección'}</span>
          <div className="flex items-center justify-between mt-2">
            <div>
              <p className="text-sm font-bold text-emerald-400">BUY {metrics.buyCount}</p>
              <p className="text-sm font-bold text-red-400">SELL {metrics.sellCount}</p>
            </div>
            <div className="w-12 h-12">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[{ v: metrics.buyCount }, { v: metrics.sellCount }]} dataKey="v" cx="50%" cy="50%" innerRadius={12} outerRadius={22} strokeWidth={0}>
                    <Cell fill="hsl(142, 60%, 50%)" />
                    <Cell fill="hsl(0, 70%, 55%)" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="rounded-xl p-3" style={{
          background: 'hsl(var(--card) / 0.6)',
          border: '1px solid hsl(var(--border) / 0.5)',
        }}>
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">{t('risk_total_return') || 'Retorno Total'}</span>
          <p className={cn("text-xl font-bold mt-2", metrics.totalReturn >= 0 ? 'text-emerald-400' : 'text-red-400')}>
            {metrics.totalReturn >= 0 ? '+' : ''}${metrics.totalReturn.toFixed(2)}
          </p>
          <p className="text-[9px] text-muted-foreground mt-1">
            PF: {metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Concentration Risk */}
      {metrics.topSymbols.length > 0 && (
        <GlowSection color="270 60% 55%">
          <div className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                {t('risk_concentration') || 'Concentración por Activo'}
              </span>
              {pieData.length > 1 && (
                <div className="w-16 h-16">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={16} outerRadius={28} strokeWidth={0}>
                        {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            {metrics.topSymbols.map(s => (
              <div key={s.symbol} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-foreground font-medium">{s.symbol}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {s.count} trades · WR {s.winRate.toFixed(0)}% · {s.pnl >= 0 ? '+' : ''}${s.pnl.toFixed(2)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${s.concentration}%`,
                      background: s.concentration > 40 ? 'hsl(45, 80%, 55%)' : 'hsl(var(--primary))',
                    }}
                  />
                </div>
                {s.concentration > 40 && (
                  <span className="text-[8px] text-amber-400">⚠️ {t('risk_high_concentration') || 'Alta concentración'} ({s.concentration.toFixed(0)}%)</span>
                )}
              </div>
            ))}
          </div>
        </GlowSection>
      )}
    </div>
  );
}
