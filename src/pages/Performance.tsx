import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useTranslation } from '@/i18n/LanguageContext';
import { WeeklySummary } from '@/components/performance/WeeklySummary';
import { WeekFilter } from '@/components/performance/WeekFilter';
import { DayTabs } from '@/components/performance/DayTabs';
import { MarketTabs } from '@/components/performance/MarketTabs';
import { DailyBreakdownTable } from '@/components/performance/DailyBreakdownTable';
import { SignalsList, type SignalData } from '@/components/performance/SignalsList';
import { DailyActivityChart } from '@/components/performance/DailyActivityChart';
import { CurrencyPairCard } from '@/components/performance/CurrencyPairCard';
import { 
  usePerformance, 
  useSessionPerformance, 
  useCurrencyPairPerformance,
  useDailyActivityData,
  type PerformanceSignal 
} from '@/hooks/usePerformance';

// Transform database signal to UI signal format
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

// Default fallback data
const defaultSessionData = [
  { name: 'New York', percentage: 0, pips: 0, isPositive: true },
  { name: 'Londres', percentage: 0, pips: 0, isPositive: true },
  { name: 'Asia', percentage: 0, pips: 0, isPositive: true },
];

const defaultDailyActivityData = [
  { day: 'Lunes', pips: 0 },
  { day: 'Martes', pips: 0 },
  { day: 'Miercoles', pips: 0 },
  { day: 'Jueves', pips: 0 },
  { day: 'Viernes', pips: 0 },
];

const defaultCurrencyPairs = [
  { pair: 'EUR USD', currentPrice: 1.0850, change: 0, highPrice: 1.0900, lowPrice: 1.0800 },
  { pair: 'GBP USD', currentPrice: 1.2650, change: 0, highPrice: 1.2700, lowPrice: 1.2600 },
];

export default function Performance() {
  const { t } = useTranslation();
  const [selectedDay, setSelectedDay] = useState('Viernes');
  const [selectedMarket, setSelectedMarket] = useState('Forex');
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  // Fetch real data from Supabase
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

  // Get signals for the expanded day
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

  // Use real data or fallbacks
  const weeklyData = performance ? {
    weekNumber: performance.weekNumber,
    totalSignals: performance.totalSignals,
    successfulSignals: performance.successfulSignals,
    lostSignals: performance.lostSignals,
    pipsGained: performance.pipsGained,
    pipsLost: performance.pipsLost,
    successRate: performance.successRate,
  } : {
    weekNumber: 1,
    totalSignals: 0,
    successfulSignals: 0,
    lostSignals: 0,
    pipsGained: 0,
    pipsLost: 0,
    successRate: 0,
  };

  const dailyData = performance?.dailyData || [];
  const weekTotal = performance?.weekTotal || {
    day: '0',
    date: '',
    totalSignals: 0,
    positivas: 0,
    negativos: 0,
    pipsWins: 0,
    pipsLoss: 0,
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      <main className="container py-4">
        {/* Back Button */}
        <div className="flex items-center gap-4 mb-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('perf_loading')}
            </div>
          )}
        </div>

        {/* Week Filter */}
        <WeekFilter 
          selectedWeek={selectedWeek}
          onWeekChange={setSelectedWeek}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />

        {/* Weekly Summary */}
        {isLoadingPerformance ? (
          <div className="mb-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        ) : (
          <WeeklySummary {...weeklyData} />
        )}

        {/* Day Tabs */}
        <DayTabs selectedDay={selectedDay} onSelectDay={setSelectedDay} />

        {/* Daily Breakdown Table */}
        {isLoadingPerformance ? (
          <Skeleton className="h-64 w-full rounded-lg mb-4" />
        ) : dailyData.length > 0 ? (
          <DailyBreakdownTable 
            data={dailyData} 
            weekTotal={weekTotal}
            expandedDay={expandedDay}
            onToggleDay={handleToggleDay}
          />
        ) : (
          <div className="bg-card border border-border rounded-lg p-8 text-center mb-4">
            <p className="text-muted-foreground">{t('perf_no_signals_week')}</p>
          </div>
        )}

        {/* Signals List (when day is expanded) */}
        {expandedDay && expandedDaySignals.length > 0 && (
          <div className="animate-fade-in">
            <SignalsList signals={expandedDaySignals} />
          </div>
        )}

        {/* Market Tabs */}
        <MarketTabs selectedMarket={selectedMarket} onSelectMarket={setSelectedMarket} />

        {/* Daily Activity Chart */}
        {isLoadingActivity || isLoadingSessions ? (
          <Skeleton className="h-48 w-full rounded-lg mb-4" />
        ) : (
          <DailyActivityChart 
            data={dailyActivityData || defaultDailyActivityData} 
            sessions={sessionData || defaultSessionData}
            market={selectedMarket}
          />
        )}

        {/* Currency Pairs Section */}
        <div className="mb-4">
          <h3 className="text-sm font-bold text-foreground text-center mb-3">{t('perf_most_moved')}</h3>
          {isLoadingPairs ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-40 w-full rounded-lg" />
              <Skeleton className="h-40 w-full rounded-lg" />
            </div>
          ) : (currencyPairs && currencyPairs.length > 0) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currencyPairs.map((pair) => (
                <CurrencyPairCard key={pair.pair} {...pair} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {defaultCurrencyPairs.map((pair) => (
                <CurrencyPairCard key={pair.pair} {...pair} />
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
