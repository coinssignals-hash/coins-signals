import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { startOfWeek, endOfWeek, format, getWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { WeeklySummary } from '@/components/performance/WeeklySummary';
import { WeekFilter } from '@/components/performance/WeekFilter';
import { DayTabs } from '@/components/performance/DayTabs';
import { MarketTabs } from '@/components/performance/MarketTabs';
import { DailyBreakdownTable, type DailyData } from '@/components/performance/DailyBreakdownTable';
import { SignalsList, type SignalData } from '@/components/performance/SignalsList';
import { DailyActivityChart } from '@/components/performance/DailyActivityChart';
import { CurrencyPairCard } from '@/components/performance/CurrencyPairCard';

// Helper to get week number
const getWeekNumber = (date: Date) => {
  return getWeek(date, { weekStartsOn: 1 });
};

// Generate mock data based on selected week
const generateWeeklyData = (weekDate: Date) => {
  const weekNum = getWeekNumber(weekDate);
  // Simulate different data for different weeks
  const baseSignals = 20 + (weekNum % 10);
  const successRate = 70 + (weekNum % 15);
  const successful = Math.round(baseSignals * (successRate / 100));
  const lost = baseSignals - successful;
  
  return {
    weekNumber: weekNum,
    totalSignals: baseSignals,
    successfulSignals: successful,
    lostSignals: lost,
    pipsGained: 100 + (weekNum * 3),
    pipsLost: -(30 + (weekNum % 20)),
    successRate: successRate,
  };
};

const dailyData: DailyData[] = [
  { day: 'Viernes', date: '19-Nov', totalSignals: 6, positivas: 5, negativos: 1, pipsWins: 75, pipsLoss: 15 },
  { day: 'Jueves', date: '18-Nov', totalSignals: 7, positivas: 5, negativos: 2, pipsWins: 153, pipsLoss: 45 },
  { day: 'Miercoles', date: '17-Nov', totalSignals: 5, positivas: 5, negativos: 1, pipsWins: 87, pipsLoss: 24 },
  { day: 'Martes', date: '16-Nov', totalSignals: 4, positivas: 4, negativos: 0, pipsWins: 75, pipsLoss: 0 },
  { day: 'Lunes', date: '15-Nov', totalSignals: 4, positivas: 2, negativos: 2, pipsWins: 75, pipsLoss: 55 },
];

const weekTotal: DailyData = {
  day: '46',
  date: '15/11-19/11',
  totalSignals: 26,
  positivas: 21,
  negativos: 5,
  pipsWins: 465,
  pipsLoss: 139,
};

const signalsData: SignalData[] = [
  {
    id: '1',
    time: '06:25 AM',
    action: 'Vender',
    currencyPair: 'EUR USD',
    pips: 58,
    percentage: 85,
    isSuccessful: true,
    entryPrice: 156.100,
    takeProfit: 157.100,
    stopLoss: 155.700,
    signalTime: '05:10 Am',
    endTime: '11:45 Am',
    executionTime: '05:48 Am',
    totalOperationTime: '06:00 Horas',
  },
  {
    id: '2',
    time: '08:42 AM',
    action: 'Comprar',
    currencyPair: 'AUD CAD',
    pips: -23,
    percentage: 35,
    isSuccessful: false,
    entryPrice: 0.9100,
    takeProfit: 0.9150,
    stopLoss: 0.9050,
    signalTime: '08:30 Am',
    endTime: '10:15 Am',
    executionTime: '08:35 Am',
    totalOperationTime: '01:45 Horas',
  },
  {
    id: '3',
    time: '11:05 AM',
    action: 'Vender',
    currencyPair: 'USD CHF',
    pips: 75,
    percentage: 85,
    isSuccessful: true,
    entryPrice: 0.8850,
    takeProfit: 0.8775,
    stopLoss: 0.8900,
    signalTime: '11:00 Am',
    endTime: '14:30 Pm',
    executionTime: '11:05 Am',
    totalOperationTime: '03:30 Horas',
  },
  {
    id: '4',
    time: '06:25 AM',
    action: 'Vender',
    currencyPair: 'EUR USD',
    pips: 58,
    percentage: 85,
    isSuccessful: true,
    entryPrice: 1.0750,
    takeProfit: 1.0690,
    stopLoss: 1.0800,
    signalTime: '06:20 Am',
    endTime: '09:45 Am',
    executionTime: '06:25 Am',
    totalOperationTime: '03:25 Horas',
  },
  {
    id: '5',
    time: '08:42 AM',
    action: 'Comprar',
    currencyPair: 'AUD CAD',
    pips: -23,
    percentage: 35,
    isSuccessful: false,
    entryPrice: 0.9120,
    takeProfit: 0.9170,
    stopLoss: 0.9070,
    signalTime: '08:35 Am',
    endTime: '11:00 Am',
    executionTime: '08:42 Am',
    totalOperationTime: '02:25 Horas',
  },
  {
    id: '6',
    time: '11:05 AM',
    action: 'Vender',
    currencyPair: 'USD CHF',
    pips: 75,
    percentage: 85,
    isSuccessful: true,
    entryPrice: 0.8860,
    takeProfit: 0.8785,
    stopLoss: 0.8910,
    signalTime: '11:00 Am',
    endTime: '15:00 Pm',
    executionTime: '11:05 Am',
    totalOperationTime: '04:00 Horas',
  },
];

const dailyActivityData = [
  { day: 'Lunes', pips: 45 },
  { day: 'Martes', pips: 75 },
  { day: 'Miercoles', pips: 60 },
  { day: 'Jueves', pips: 120 },
  { day: 'Viernes', pips: 95 },
];

const sessionData = [
  { name: 'New York', percentage: 7.3, pips: 153, isPositive: true },
  { name: 'Londres', percentage: -1.5, pips: -85, isPositive: false },
  { name: 'Asia', percentage: 4.26, pips: 118, isPositive: true },
];

const currencyPairs = [
  { pair: 'GBP USD', currentPrice: 1.3375, change: -28, highPrice: 1.3405, lowPrice: 1.3301 },
  { pair: 'USD CAD', currentPrice: 1.173, change: 125, highPrice: 1.173, lowPrice: 1.101 },
];

export default function Performance() {
  const [selectedDay, setSelectedDay] = useState('Viernes');
  const [selectedMarket, setSelectedMarket] = useState('Forex');
  const [expandedDay, setExpandedDay] = useState<string | null>('Viernes');
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  // Generate data based on selected week
  const weeklyData = useMemo(() => generateWeeklyData(selectedWeek), [selectedWeek]);

  // Generate daily data based on selected week
  const dailyData = useMemo(() => {
    const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
    const days = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];
    
    return days.map((day, index) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + index);
      const signals = 4 + Math.floor(Math.random() * 4);
      const positivas = Math.floor(signals * 0.7);
      
      return {
        day,
        date: format(date, 'dd-MMM', { locale: es }),
        totalSignals: signals,
        positivas,
        negativos: signals - positivas,
        pipsWins: 50 + Math.floor(Math.random() * 100),
        pipsLoss: 10 + Math.floor(Math.random() * 50),
      };
    }).reverse(); // Most recent first
  }, [selectedWeek]);

  const weekTotal = useMemo(() => {
    const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });
    
    return {
      day: getWeekNumber(selectedWeek).toString(),
      date: `${format(weekStart, 'dd/MM', { locale: es })}-${format(weekEnd, 'dd/MM', { locale: es })}`,
      totalSignals: dailyData.reduce((acc, d) => acc + d.totalSignals, 0),
      positivas: dailyData.reduce((acc, d) => acc + d.positivas, 0),
      negativos: dailyData.reduce((acc, d) => acc + d.negativos, 0),
      pipsWins: dailyData.reduce((acc, d) => acc + d.pipsWins, 0),
      pipsLoss: dailyData.reduce((acc, d) => acc + d.pipsLoss, 0),
    };
  }, [dailyData, selectedWeek]);

  const handleToggleDay = (day: string) => {
    setExpandedDay(expandedDay === day ? null : day);
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
        </div>

        {/* Week Filter */}
        <WeekFilter 
          selectedWeek={selectedWeek}
          onWeekChange={setSelectedWeek}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />

        {/* Weekly Summary */}
        <WeeklySummary {...weeklyData} />

        {/* Day Tabs */}
        <DayTabs selectedDay={selectedDay} onSelectDay={setSelectedDay} />

        {/* Daily Breakdown Table */}
        <DailyBreakdownTable 
          data={dailyData} 
          weekTotal={weekTotal}
          expandedDay={expandedDay}
          onToggleDay={handleToggleDay}
        />

        {/* Signals List (when day is expanded) */}
        {expandedDay && (
          <div className="animate-fade-in">
            <SignalsList signals={signalsData} />
          </div>
        )}

        {/* Market Tabs */}
        <MarketTabs selectedMarket={selectedMarket} onSelectMarket={setSelectedMarket} />

        {/* Daily Activity Chart */}
        <DailyActivityChart 
          data={dailyActivityData} 
          sessions={sessionData}
          market={selectedMarket}
        />

        {/* Currency Pairs Section */}
        <div className="mb-4">
          <h3 className="text-sm font-bold text-foreground text-center mb-3">Moneda Mas Movida</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currencyPairs.map((pair) => (
              <CurrencyPairCard key={pair.pair} {...pair} />
            ))}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
