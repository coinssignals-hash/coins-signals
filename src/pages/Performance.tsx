import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  TrendingUp, 
  Target, 
  Zap, 
  BarChart3, 
  Award,
  Activity,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/i18n/LanguageContext';
import { WeeklySummary } from '@/components/performance/WeeklySummary';
import { WeekFilter } from '@/components/performance/WeekFilter';
import { DailyBreakdownTable } from '@/components/performance/DailyBreakdownTable';
import { SignalsList, type SignalData } from '@/components/performance/SignalsList';
import { DailyActivityChart } from '@/components/performance/DailyActivityChart';
import { CurrencyPairCard } from '@/components/performance/CurrencyPairCard';
import { PrecisionGauge } from '@/components/performance/PrecisionGauge';
import { StreakWidget } from '@/components/performance/StreakWidget';
import { 
  usePerformance, 
  useSessionPerformance, 
  useCurrencyPairPerformance,
  useDailyActivityData,
  type PerformanceSignal 
} from '@/hooks/usePerformance';

const transformSignal = (signal: PerformanceSignal): SignalData => {
  const datetime = new Date(signal.datetime);
  const pips = Math.round(Math.abs(signal.take_profit - signal.entry_price) * 10000);
  const isSuccessful = signal.status === 'completed' || signal.status === 'won' || signal.probability >= 50;
  
  return {
    id: signal.id,
    time: format(datetime, 'hh:mm a'),
    action: signal.action,
    currencyPair: signal.currency_pair.replace('/', ' '),
    pips: isSuccessful ? pips : -pips,
    percentage: signal.probability,
    isSuccessful,
    entryPrice: signal.entry_price,
    takeProfit: signal.take_profit,
    stopLoss: signal.stop_loss,
    signalTime: format(datetime, 'hh:mm a'),
    endTime: format(new Date(datetime.getTime() + 6 * 60 * 60 * 1000), 'hh:mm a'),
    executionTime: format(new Date(datetime.getTime() + 30 * 60 * 1000), 'hh:mm a'),
    totalOperationTime: '06:00',
  };
};

const defaultSessionData = [
  { name: 'New York', percentage: 0, pips: 0, isPositive: true },
  { name: 'Londres', percentage: 0, pips: 0, isPositive: true },
  { name: 'Asia', percentage: 0, pips: 0, isPositive: true },
];

const defaultDailyActivityData = [
  { day: 'Lun', pips: 0 },
  { day: 'Mar', pips: 0 },
  { day: 'Mie', pips: 0 },
  { day: 'Jue', pips: 0 },
  { day: 'Vie', pips: 0 },
];

const defaultCurrencyPairs = [
  { pair: 'EUR USD', currentPrice: 1.0850, change: 0, highPrice: 1.0900, lowPrice: 1.0800, totalSignals: 0 },
  { pair: 'GBP USD', currentPrice: 1.2650, change: 0, highPrice: 1.2700, lowPrice: 1.2600, totalSignals: 0 },
];

export default function Performance() {
  const { t } = useTranslation();
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  const { data: performance, isLoading: isLoadingPerformance } = usePerformance(
    selectedWeek, 
    dateRange.from && dateRange.to ? dateRange : undefined
  );
  
  const { data: sessionData, isLoading: isLoadingSessions } = useSessionPerformance(
    selectedWeek,
    dateRange.from && dateRange.to ? dateRange : undefined
  );
  
  const { data: currencyPairs, isLoading: isLoadingPairs } = useCurrencyPairPerformance(
    selectedWeek,
    dateRange.from && dateRange.to ? dateRange : undefined
  );
  
  const { data: dailyActivityData, isLoading: isLoadingActivity } = useDailyActivityData(
    selectedWeek,
    dateRange.from && dateRange.to ? dateRange : undefined
  );

  const expandedDaySignals = useMemo(() => {
    if (!expandedDay || !performance?.dailyData) return [];
    const dayData = performance.dailyData.find(d => d.day === expandedDay);
    if (!dayData?.signals) return [];
    return dayData.signals.map(transformSignal);
  }, [expandedDay, performance?.dailyData]);

  const handleToggleDay = (day: string) => {
    setExpandedDay(expandedDay === day ? null : day);
  };

  const isLoading = isLoadingPerformance || isLoadingSessions || isLoadingPairs || isLoadingActivity;

  const weeklyData = performance ? {
    weekNumber: performance.weekNumber,
    totalSignals: performance.totalSignals,
    successfulSignals: performance.successfulSignals,
    lostSignals: performance.lostSignals,
    pipsGained: performance.pipsGained,
    pipsLost: performance.pipsLost,
    successRate: performance.successRate,
  } : {
    weekNumber: 1, totalSignals: 0, successfulSignals: 0, lostSignals: 0,
    pipsGained: 0, pipsLost: 0, successRate: 0,
  };

  const dailyData = performance?.dailyData || [];
  const weekTotal = performance?.weekTotal || {
    day: '0', date: '', totalSignals: 0, positivas: 0, negativos: 0, pipsWins: 0, pipsLoss: 0,
  };

  // Calculate additional metrics
  const netPips = weeklyData.pipsGained + weeklyData.pipsLost;
  const avgPipsPerSignal = weeklyData.totalSignals > 0 ? Math.round(netPips / weeklyData.totalSignals) : 0;
  const riskRewardRatio = weeklyData.pipsLost !== 0 
    ? Math.abs(weeklyData.pipsGained / weeklyData.pipsLost).toFixed(1) 
    : '∞';

  return (
    <PageShell>
      <Header />
      
      <main className="py-6 px-4 space-y-5">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
            </Link>
            <h1 className="text-xl font-bold text-foreground">Rendimiento</h1>
          </div>
          {isLoading && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs text-primary">Cargando...</span>
            </div>
          )}
        </div>

        {/* Week Filter */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <WeekFilter 
            selectedWeek={selectedWeek}
            onWeekChange={setSelectedWeek}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </motion.div>

        {/* Quick Stats Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.15 }}
          className="grid grid-cols-4 gap-2"
        >
          {[
            { icon: Target, label: 'Señales', value: weeklyData.totalSignals, color: 'text-blue-400', bg: 'bg-blue-400/10' },
            { icon: TrendingUp, label: 'Pips Neto', value: netPips >= 0 ? `+${netPips}` : `${netPips}`, color: netPips >= 0 ? 'text-emerald-400' : 'text-rose-400', bg: netPips >= 0 ? 'bg-emerald-400/10' : 'bg-rose-400/10' },
            { icon: Zap, label: 'Avg/Señal', value: `${avgPipsPerSignal > 0 ? '+' : ''}${avgPipsPerSignal}`, color: avgPipsPerSignal >= 0 ? 'text-emerald-400' : 'text-rose-400', bg: avgPipsPerSignal >= 0 ? 'bg-emerald-400/10' : 'bg-rose-400/10' },
            { icon: ShieldCheck, label: 'R:R Ratio', value: riskRewardRatio, color: 'text-amber-400', bg: 'bg-amber-400/10' },
          ].map((stat, i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="p-3 text-center">
                <div className={`w-8 h-8 rounded-lg ${stat.bg} mx-auto mb-1.5 flex items-center justify-center`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div className={`text-lg font-bold tabular-nums ${stat.color}`}>{stat.value}</div>
                <div className="text-[10px] text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Precision Gauge + Streak */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-3"
        >
          {isLoadingPerformance ? (
            <>
              <Skeleton className="h-44 rounded-xl" />
              <Skeleton className="h-44 rounded-xl" />
            </>
          ) : (
            <>
              <PrecisionGauge 
                successRate={weeklyData.successRate} 
                totalSignals={weeklyData.totalSignals}
                successfulSignals={weeklyData.successfulSignals}
                lostSignals={weeklyData.lostSignals}
              />
              <StreakWidget 
                pipsGained={weeklyData.pipsGained}
                pipsLost={weeklyData.pipsLost}
                successRate={weeklyData.successRate}
                weekNumber={weeklyData.weekNumber}
              />
            </>
          )}
        </motion.div>

        {/* Weekly Summary */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          {isLoadingPerformance ? (
            <Skeleton className="h-36 rounded-xl" />
          ) : (
            <WeeklySummary {...weeklyData} />
          )}
        </motion.div>

        {/* Daily Breakdown Table */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          {isLoadingPerformance ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : dailyData.length > 0 ? (
            <DailyBreakdownTable 
              data={dailyData} 
              weekTotal={weekTotal}
              expandedDay={expandedDay}
              onToggleDay={handleToggleDay}
            />
          ) : (
            <SignalStyleCard className="p-8 text-center">
              <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Sin señales esta semana</p>
            </SignalStyleCard>
          )}
        </motion.div>

        {/* Signals List (when day is expanded) */}
        {expandedDay && expandedDaySignals.length > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
            <SignalsList signals={expandedDaySignals} />
          </motion.div>
        )}

        {/* Daily Activity Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          {isLoadingActivity || isLoadingSessions ? (
            <Skeleton className="h-52 rounded-xl" />
          ) : (
            <DailyActivityChart 
              data={dailyActivityData || defaultDailyActivityData} 
              sessions={sessionData || defaultSessionData}
            />
          )}
        </motion.div>

        {/* Currency Pairs Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-foreground">Pares Más Activos</h3>
          </div>
          {isLoadingPairs ? (
            <div className="grid grid-cols-1 gap-3">
              <Skeleton className="h-44 rounded-xl" />
              <Skeleton className="h-44 rounded-xl" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {(currencyPairs && currencyPairs.length > 0 ? currencyPairs : defaultCurrencyPairs).map((pair) => (
                <CurrencyPairCard key={pair.pair} {...pair} />
              ))}
            </div>
          )}
        </motion.div>

        <div className="h-20" />
      </main>
    </PageShell>
  );
}
