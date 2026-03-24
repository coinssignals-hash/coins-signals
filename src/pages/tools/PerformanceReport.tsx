import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, TrendingUp, TrendingDown, BarChart3, Target,
  ChevronLeft, ChevronRight, Trophy, Skull, Activity,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/layout/PageShell';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useImportedTrades, ImportedTrade } from '@/hooks/useImportedTrades';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths, addMonths, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';

type ViewMode = 'monthly' | 'weekly';

function getDailyPnL(trades: ImportedTrade[], month: Date) {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const days = eachDayOfInterval({ start, end });

  const pnlMap = new Map<string, number>();
  trades
    .filter(t => t.status === 'closed' && t.exit_time)
    .forEach(t => {
      const d = format(new Date(t.exit_time!), 'yyyy-MM-dd');
      pnlMap.set(d, (pnlMap.get(d) || 0) + t.net_profit);
    });

  return days.map(day => ({
    date: day,
    dateStr: format(day, 'yyyy-MM-dd'),
    dayNum: day.getDate(),
    dayOfWeek: getDay(day),
    pnl: pnlMap.get(format(day, 'yyyy-MM-dd')) || 0,
    hasTrades: pnlMap.has(format(day, 'yyyy-MM-dd')),
  }));
}

function getWeeklyPnL(trades: ImportedTrade[], month: Date) {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const weeks: { weekNum: number; pnl: number; trades: number; wins: number }[] = [];
  let currentWeek = { weekNum: 1, pnl: 0, trades: 0, wins: 0 };

  const closedTrades = trades.filter(t => t.status === 'closed' && t.exit_time);

  const days = eachDayOfInterval({ start, end });
  days.forEach((day, i) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayTrades = closedTrades.filter(t => format(new Date(t.exit_time!), 'yyyy-MM-dd') === dateStr);
    currentWeek.pnl += dayTrades.reduce((s, t) => s + t.net_profit, 0);
    currentWeek.trades += dayTrades.length;
    currentWeek.wins += dayTrades.filter(t => t.net_profit > 0).length;

    if (getDay(day) === 0 || i === days.length - 1) {
      if (currentWeek.trades > 0 || i === days.length - 1) {
        weeks.push({ ...currentWeek });
      }
      currentWeek = { weekNum: currentWeek.weekNum + 1, pnl: 0, trades: 0, wins: 0 };
    }
  });

  return weeks.filter(w => w.trades > 0);
}

function calcAdvancedStats(trades: ImportedTrade[]) {
  const closed = trades.filter(t => t.status === 'closed');
  if (closed.length === 0) return null;

  const profits = closed.map(t => t.net_profit);
  const wins = profits.filter(p => p > 0);
  const losses = profits.filter(p => p < 0);
  const totalReturn = profits.reduce((s, p) => s + p, 0);
  const avgReturn = totalReturn / profits.length;
  const variance = profits.reduce((s, p) => s + Math.pow(p - avgReturn, 2), 0) / profits.length;
  const stdDev = Math.sqrt(variance);
  const sharpe = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

  // Max drawdown
  let peak = 0, maxDD = 0, cumulative = 0;
  closed.forEach(t => {
    cumulative += t.net_profit;
    if (cumulative > peak) peak = cumulative;
    const dd = peak - cumulative;
    if (dd > maxDD) maxDD = dd;
  });

  // Consecutive wins/losses
  let maxConsecWins = 0, maxConsecLosses = 0, cw = 0, cl = 0;
  closed.forEach(t => {
    if (t.net_profit > 0) { cw++; cl = 0; maxConsecWins = Math.max(maxConsecWins, cw); }
    else { cl++; cw = 0; maxConsecLosses = Math.max(maxConsecLosses, cl); }
  });

  // Expectancy
  const winRate = wins.length / profits.length;
  const avgWin = wins.length > 0 ? wins.reduce((s, p) => s + p, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, p) => s + p, 0) / losses.length) : 0;
  const expectancy = (winRate * avgWin) - ((1 - winRate) * avgLoss);

  return {
    totalReturn,
    winRate: winRate * 100,
    sharpe,
    maxDD,
    maxConsecWins,
    maxConsecLosses,
    expectancy,
    totalTrades: closed.length,
    avgWin,
    avgLoss,
    profitFactor: avgLoss > 0 ? (wins.reduce((s, p) => s + p, 0) / Math.abs(losses.reduce((s, p) => s + p, 0))) : Infinity,
  };
}

export default function PerformanceReport() {
  const { t } = useTranslation();
  const { trades } = useImportedTrades();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');

  const monthTrades = useMemo(() =>
    trades.filter(tr => {
      const d = new Date(tr.exit_time || tr.entry_time);
      return isSameMonth(d, currentMonth);
    }),
    [trades, currentMonth]
  );

  const dailyData = useMemo(() => getDailyPnL(monthTrades, currentMonth), [monthTrades, currentMonth]);
  const weeklyData = useMemo(() => getWeeklyPnL(monthTrades, currentMonth), [monthTrades, currentMonth]);
  const stats = useMemo(() => calcAdvancedStats(monthTrades), [monthTrades]);

  const maxAbsPnl = useMemo(() => {
    const vals = dailyData.filter(d => d.hasTrades).map(d => Math.abs(d.pnl));
    return Math.max(...vals, 1);
  }, [dailyData]);

  const getHeatColor = (pnl: number, hasTrades: boolean) => {
    if (!hasTrades) return 'bg-muted/30';
    const intensity = Math.min(Math.abs(pnl) / maxAbsPnl, 1);
    if (pnl > 0) return intensity > 0.6 ? 'bg-emerald-500/60' : intensity > 0.3 ? 'bg-emerald-500/35' : 'bg-emerald-500/15';
    return intensity > 0.6 ? 'bg-red-500/60' : intensity > 0.3 ? 'bg-red-500/35' : 'bg-red-500/15';
  };

  const dayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  // Pad start of calendar
  const firstDayOfWeek = (getDay(startOfMonth(currentMonth)) + 6) % 7; // Monday = 0

  const navigate = useNavigate();

  return (
    <PageShell>
      <div className="space-y-4 px-4 pb-24">
        <div className="flex items-center gap-3 pt-4">
          <button onClick={() => navigate('/tools')} className="text-muted-foreground"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-base font-bold text-foreground">{t('performance_report_title') || 'Reporte de Rendimiento'}</h1>
        </div>
        {/* Month navigator */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-sm font-bold text-foreground capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </h2>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* View toggle */}
        <div className="flex gap-1 bg-muted/50 rounded-lg p-0.5">
          {(['monthly', 'weekly'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                "flex-1 text-[10px] py-1.5 rounded-md font-medium transition-colors",
                viewMode === mode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              )}
            >
              {mode === 'monthly' ? '📅 Calendario' : '📊 Semanal'}
            </button>
          ))}
        </div>

        {/* Heatmap Calendar */}
        {viewMode === 'monthly' && (
          <Card className="bg-card border-border">
            <CardContent className="p-3">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                P&L Diario — Heatmap
              </span>
              <div className="grid grid-cols-7 gap-1 mt-2">
                {dayLabels.map(d => (
                  <div key={d} className="text-[8px] text-center text-muted-foreground font-medium">{d}</div>
                ))}
                {/* Empty cells for padding */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                {dailyData.map(day => (
                  <motion.div
                    key={day.dateStr}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={cn(
                      "aspect-square rounded-md flex flex-col items-center justify-center cursor-default transition-colors",
                      getHeatColor(day.pnl, day.hasTrades)
                    )}
                    title={day.hasTrades ? `${day.dateStr}: ${day.pnl >= 0 ? '+' : ''}$${day.pnl.toFixed(2)}` : ''}
                  >
                    <span className="text-[9px] text-foreground/80">{day.dayNum}</span>
                    {day.hasTrades && (
                      <span className={cn("text-[7px] font-bold tabular-nums", day.pnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                        {day.pnl >= 0 ? '+' : ''}{day.pnl.toFixed(0)}
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-3 mt-3">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-red-500/40" />
                  <span className="text-[8px] text-muted-foreground">Pérdida</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-muted/30" />
                  <span className="text-[8px] text-muted-foreground">Sin trades</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-emerald-500/40" />
                  <span className="text-[8px] text-muted-foreground">Ganancia</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weekly view */}
        {viewMode === 'weekly' && (
          <div className="space-y-2">
            {weeklyData.length === 0 && (
              <Card className="bg-card border-border">
                <CardContent className="py-8 text-center">
                  <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Sin trades cerrados este mes</p>
                </CardContent>
              </Card>
            )}
            {weeklyData.map(week => (
              <Card key={week.weekNum} className="bg-card border-border">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                        Semana {week.weekNum}
                      </span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {week.trades} trades · WR {week.trades > 0 ? ((week.wins / week.trades) * 100).toFixed(0) : 0}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-sm font-bold tabular-nums", week.pnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                        {week.pnl >= 0 ? '+' : ''}${week.pnl.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  {/* Mini bar */}
                  <div className="h-1.5 rounded-full bg-muted/40 mt-2 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", week.pnl >= 0 ? 'bg-emerald-500' : 'bg-red-500')}
                      style={{ width: `${week.trades > 0 ? (week.wins / week.trades) * 100 : 0}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Advanced Stats */}
        {stats && (
          <>
            <h3 className="text-xs font-semibold text-primary flex items-center gap-1.5 mt-2">
              <Activity className="w-3.5 h-3.5" /> Métricas Avanzadas
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <StatMini icon={<Target className="w-3.5 h-3.5 text-primary" />} label="Sharpe Ratio" value={stats.sharpe.toFixed(2)} color="text-primary" />
              <StatMini icon={<BarChart3 className="w-3.5 h-3.5 text-emerald-400" />} label="Profit Factor" value={stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)} color="text-emerald-400" />
              <StatMini icon={<TrendingUp className="w-3.5 h-3.5 text-amber-400" />} label="Expectancy" value={`$${stats.expectancy.toFixed(2)}`} color="text-amber-400" />
              <StatMini icon={<Skull className="w-3.5 h-3.5 text-red-400" />} label="Max Drawdown" value={`$${stats.maxDD.toFixed(2)}`} color="text-red-400" />
              <StatMini icon={<Trophy className="w-3.5 h-3.5 text-emerald-400" />} label="Racha Ganadora" value={`${stats.maxConsecWins} trades`} color="text-emerald-400" />
              <StatMini icon={<TrendingDown className="w-3.5 h-3.5 text-red-400" />} label="Racha Perdedora" value={`${stats.maxConsecLosses} trades`} color="text-red-400" />
            </div>

            {/* Monthly Summary */}
            <Card className="bg-card border-border">
              <CardContent className="p-3 space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Resumen del Mes
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Total Trades</span>
                  <span className="text-xs font-bold text-foreground">{stats.totalTrades}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Win Rate</span>
                  <span className="text-xs font-bold text-foreground">{stats.winRate.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Retorno Total</span>
                  <span className={cn("text-xs font-bold", stats.totalReturn >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                    {stats.totalReturn >= 0 ? '+' : ''}${stats.totalReturn.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Avg Win / Loss</span>
                  <span className="text-xs font-bold text-foreground">
                    ${stats.avgWin.toFixed(2)} / ${stats.avgLoss.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {!stats && (
          <Card className="bg-card border-border">
            <CardContent className="py-10 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-foreground font-medium text-sm mb-1">Sin datos este mes</h3>
              <p className="text-muted-foreground text-xs">Importa operaciones para ver tu reporte</p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageShell>
  );
}

function StatMini({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-2.5 space-y-0.5">
        <div className="flex items-center gap-1">
          {icon}
          <span className="text-[8px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
        </div>
        <p className={cn("text-base font-bold tabular-nums", color)}>{value}</p>
      </CardContent>
    </Card>
  );
}
