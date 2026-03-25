import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { Card, CardContent } from '@/components/ui/card';
import { GlowCard } from '@/components/ui/glow-card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  Target, 
  Zap, 
  BarChart3, 
  Award,
  Activity,
  ShieldCheck,
  Calendar,
  ShieldAlert,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/LanguageContext';
import { WeeklySummary } from '@/components/performance/WeeklySummary';
import { WeekFilter } from '@/components/performance/WeekFilter';
import { DailyBreakdownTable } from '@/components/performance/DailyBreakdownTable';
import { SignalsList, type SignalData } from '@/components/performance/SignalsList';
import { DailyActivityChart } from '@/components/performance/DailyActivityChart';
import { CurrencyPairCard } from '@/components/performance/CurrencyPairCard';
import { PrecisionGauge } from '@/components/performance/PrecisionGauge';
import { StreakWidget } from '@/components/performance/StreakWidget';
import { PerformanceReportSection } from '@/components/performance/PerformanceReportSection';
import { RiskDashboardSection } from '@/components/performance/RiskDashboardSection';
import { 
  usePerformance, 
  useSessionPerformance, 
  useCurrencyPairPerformance,
  useDailyActivityData,
  type PerformanceSignal 
} from '@/hooks/usePerformance';

/* ─────────── Tab config (MarketSessions style) ─────────── */

interface TabConfig {
  key: string;
  label: string;
  emoji: string;
  color: string;
  shortLabel: string;
}

const TABS: TabConfig[] = [
  { key: 'signals', label: 'Señales', emoji: '📊', color: '210 80% 55%', shortLabel: 'Señales' },
  { key: 'report', label: 'Reporte', emoji: '📅', color: '30 80% 55%', shortLabel: 'Reporte' },
  { key: 'risk', label: 'Riesgo', emoji: '🛡️', color: '0 70% 55%', shortLabel: 'Riesgo' },
];

/* ─────────── Helpers ─────────── */

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

const SWIPE_THRESHOLD = 50;

export default function Performance() {
  const { t } = useTranslation();
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [activeIndex, setActiveIndex] = useState(0);
  const [swipeDir, setSwipeDir] = useState<1 | -1>(1);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  const activeTab = TABS[activeIndex];

  const goNext = () => {
    if (activeIndex < TABS.length - 1) { setSwipeDir(1); setActiveIndex(i => i + 1); }
  };
  const goPrev = () => {
    if (activeIndex > 0) { setSwipeDir(-1); setActiveIndex(i => i - 1); }
  };

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

  const netPips = weeklyData.pipsGained + weeklyData.pipsLost;
  const avgPipsPerSignal = weeklyData.totalSignals > 0 ? Math.round(netPips / weeklyData.totalSignals) : 0;
  const riskRewardRatio = weeklyData.pipsLost !== 0 
    ? Math.abs(weeklyData.pipsGained / weeklyData.pipsLost).toFixed(1) 
    : '∞';

  return (
    <PageShell>
      <Header />
      <main className="container py-3 max-w-lg mx-auto px-3">

        {/* ── MarketSessions-style Tab Grid ── */}
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          {TABS.map((tab, i) => {
            const isSelected = i === activeIndex;
            return (
              <button
                key={tab.key}
                onClick={() => { setSwipeDir(i > activeIndex ? 1 : -1); setActiveIndex(i); }}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-2.5 rounded-xl text-[11px] font-semibold transition-all active:scale-95',
                  isSelected ? 'text-foreground shadow-lg' : 'text-muted-foreground'
                )}
                style={{
                  background: isSelected
                    ? `linear-gradient(135deg, hsl(${tab.color} / 0.2), hsl(${tab.color} / 0.08))`
                    : 'hsl(var(--card) / 0.5)',
                  border: `1px solid ${isSelected ? `hsl(${tab.color} / 0.35)` : 'hsl(var(--border) / 0.3)'}`,
                  boxShadow: isSelected ? `0 2px 8px hsl(${tab.color} / 0.15)` : undefined,
                }}
              >
                <span className="text-base leading-none">{tab.emoji}</span>
                <span className="truncate w-full text-center">{tab.shortLabel}</span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: `hsl(${tab.color})` }} />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Swipeable Content Area ── */}
        <div className="relative overflow-hidden touch-pan-y">
          <AnimatePresence mode="wait" custom={swipeDir}>
            <motion.div
              key={activeTab.key}
              custom={swipeDir}
              initial={{ opacity: 0, x: swipeDir * 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -swipeDir * 60 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.12}
              onDragEnd={(_e, info) => {
                if (info.offset.x < -SWIPE_THRESHOLD && activeIndex < TABS.length - 1) goNext();
                else if (info.offset.x > SWIPE_THRESHOLD && activeIndex > 0) goPrev();
              }}
              style={{ cursor: 'grab' }}
              className="space-y-5"
            >

              {/* ════════════════════════════════════════ */}
              {/* TAB: Señales                             */}
              {/* ════════════════════════════════════════ */}
              {activeTab.key === 'signals' && (
                <>
                  {/* Week Filter */}
                  <WeekFilter 
                    selectedWeek={selectedWeek}
                    onWeekChange={setSelectedWeek}
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                  />

                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { icon: Target, label: t('perf_signals'), value: weeklyData.totalSignals, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                      { icon: TrendingUp, label: t('perf_net_pips'), value: netPips >= 0 ? `+${netPips}` : `${netPips}`, color: netPips >= 0 ? 'text-emerald-400' : 'text-rose-400', bg: netPips >= 0 ? 'bg-emerald-400/10' : 'bg-rose-400/10' },
                      { icon: Zap, label: t('perf_avg_signal'), value: `${avgPipsPerSignal > 0 ? '+' : ''}${avgPipsPerSignal}`, color: avgPipsPerSignal >= 0 ? 'text-emerald-400' : 'text-rose-400', bg: avgPipsPerSignal >= 0 ? 'bg-emerald-400/10' : 'bg-rose-400/10' },
                      { icon: ShieldCheck, label: t('perf_rr_ratio'), value: riskRewardRatio, color: 'text-amber-400', bg: 'bg-amber-400/10' },
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
                  </div>

                  {/* Precision Gauge + Streak */}
                  <div className="grid grid-cols-2 gap-3">
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
                  </div>

                  {/* Weekly Summary */}
                  {isLoadingPerformance ? (
                    <Skeleton className="h-36 rounded-xl" />
                  ) : (
                    <WeeklySummary {...weeklyData} />
                  )}

                  {/* Daily Breakdown Table */}
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
                    <GlowCard>
                      <CardContent className="p-8 text-center">
                        <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">{t('perf_no_signals_this_week')}</p>
                      </CardContent>
                    </GlowCard>
                  )}

                  {/* Signals List (when day is expanded) */}
                  {expandedDay && expandedDaySignals.length > 0 && (
                    <SignalsList signals={expandedDaySignals} />
                  )}

                  {/* Daily Activity Chart */}
                  {isLoadingActivity || isLoadingSessions ? (
                    <Skeleton className="h-52 rounded-xl" />
                  ) : (
                    <DailyActivityChart 
                      data={dailyActivityData || defaultDailyActivityData} 
                      sessions={sessionData || defaultSessionData}
                    />
                  )}

                  {/* Currency Pairs Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Award className="w-4 h-4 text-amber-400" />
                      <h3 className="text-sm font-bold text-foreground">{t('perf_most_active_pairs')}</h3>
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
                  </div>
                </>
              )}

              {/* ════════════════════════════════════════ */}
              {/* TAB: Reporte de Rendimiento               */}
              {/* ════════════════════════════════════════ */}
              {activeTab.key === 'report' && (
                <PerformanceReportSection />
              )}

              {/* ════════════════════════════════════════ */}
              {/* TAB: Dashboard de Riesgo                  */}
              {/* ════════════════════════════════════════ */}
              {activeTab.key === 'risk' && (
                <RiskDashboardSection />
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Dot indicators (MarketSessions style) ── */}
        <div className="flex items-center justify-center gap-1.5 mt-4 pb-2">
          {TABS.map((tab, i) => (
            <button
              key={tab.key}
              onClick={() => { setSwipeDir(i > activeIndex ? 1 : -1); setActiveIndex(i); }}
              className="transition-all rounded-full"
              style={{
                width: i === activeIndex ? 18 : 6,
                height: 6,
                background: i === activeIndex ? `hsl(${tab.color})` : 'hsl(var(--muted-foreground) / 0.2)',
                boxShadow: i === activeIndex ? `0 0 6px hsl(${tab.color} / 0.4)` : undefined,
              }}
            />
          ))}
        </div>

        <div className="h-20" />
      </main>
    </PageShell>
  );
}
