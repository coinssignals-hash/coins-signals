import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { WeeklySummary } from '@/components/performance/WeeklySummary';
import { DayTabs } from '@/components/performance/DayTabs';
import { MarketTabs } from '@/components/performance/MarketTabs';
import { DailyBreakdownTable, type DailyData } from '@/components/performance/DailyBreakdownTable';
import { SignalsList, type SignalData } from '@/components/performance/SignalsList';
import { DailyActivityChart } from '@/components/performance/DailyActivityChart';
import { CurrencyPairCard } from '@/components/performance/CurrencyPairCard';

// Mock data
const weeklyData = {
  weekNumber: 46,
  totalSignals: 28,
  successfulSignals: 20,
  lostSignals: 8,
  pipsGained: 153,
  pipsLost: -45,
  successRate: 75,
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
