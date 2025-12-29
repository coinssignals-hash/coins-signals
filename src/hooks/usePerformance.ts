import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, format, eachDayOfInterval, getWeek } from 'date-fns';
import { es } from 'date-fns/locale';

export interface PerformanceSignal {
  id: string;
  currency_pair: string;
  datetime: string;
  action: string;
  entry_price: number;
  take_profit: number;
  stop_loss: number;
  probability: number;
  status: string;
  trend: string;
  resistance: number | null;
  support: number | null;
  session_data: any;
  created_at: string;
}

export interface DailyPerformance {
  day: string;
  date: string;
  fullDate: Date;
  totalSignals: number;
  positivas: number;
  negativos: number;
  pipsWins: number;
  pipsLoss: number;
  signals: PerformanceSignal[];
}

export interface WeeklyPerformance {
  weekNumber: number;
  totalSignals: number;
  successfulSignals: number;
  lostSignals: number;
  pipsGained: number;
  pipsLost: number;
  successRate: number;
  dailyData: DailyPerformance[];
  weekTotal: {
    day: string;
    date: string;
    totalSignals: number;
    positivas: number;
    negativos: number;
    pipsWins: number;
    pipsLoss: number;
  };
}

export interface SessionPerformance {
  name: string;
  percentage: number;
  pips: number;
  isPositive: boolean;
}

export interface CurrencyPairPerformance {
  pair: string;
  currentPrice: number;
  change: number;
  highPrice: number;
  lowPrice: number;
  totalSignals: number;
}

const dayNames: Record<number, string> = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miercoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sabado',
};

// Calculate pips based on action and prices
const calculatePips = (signal: PerformanceSignal): number => {
  const entryPrice = signal.entry_price;
  const takeProfit = signal.take_profit;
  const stopLoss = signal.stop_loss;
  
  // Estimate pips based on status
  if (signal.status === 'completed' || signal.status === 'won') {
    // Calculate potential pips to take profit
    const pips = Math.abs(takeProfit - entryPrice) * 10000;
    return Math.round(pips);
  } else if (signal.status === 'lost' || signal.status === 'stopped') {
    // Calculate pips lost to stop loss
    const pips = Math.abs(stopLoss - entryPrice) * 10000;
    return -Math.round(pips);
  }
  
  // For pending/active signals, estimate based on probability
  const potentialPips = Math.abs(takeProfit - entryPrice) * 10000;
  return Math.round(potentialPips * (signal.probability / 100));
};

// Determine if signal was successful
const isSignalSuccessful = (signal: PerformanceSignal): boolean => {
  if (signal.status === 'completed' || signal.status === 'won') return true;
  if (signal.status === 'lost' || signal.status === 'stopped') return false;
  // For active/pending signals, use probability > 50% as success indicator
  return signal.probability >= 50;
};

// Get session from datetime
const getSession = (datetime: string): string => {
  const hour = new Date(datetime).getUTCHours();
  
  // Asia: 00:00 - 09:00 UTC
  if (hour >= 0 && hour < 9) return 'Asia';
  // London: 08:00 - 17:00 UTC
  if (hour >= 8 && hour < 17) return 'Londres';
  // New York: 13:00 - 22:00 UTC
  if (hour >= 13 && hour < 22) return 'New York';
  
  return 'Asia';
};

export function usePerformance(selectedWeek: Date, dateRange?: { from?: Date; to?: Date }) {
  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });
  
  // Use date range if provided, otherwise use week range
  const startDate = dateRange?.from || weekStart;
  const endDate = dateRange?.to || weekEnd;

  return useQuery({
    queryKey: ['performance', startDate.toISOString(), endDate.toISOString()],
    queryFn: async (): Promise<WeeklyPerformance> => {
      const { data: signals, error } = await supabase
        .from('trading_signals')
        .select('*')
        .gte('datetime', startDate.toISOString())
        .lte('datetime', endDate.toISOString())
        .order('datetime', { ascending: false });

      if (error) throw error;

      const typedSignals = (signals || []) as PerformanceSignal[];
      
      // Calculate daily performance
      const daysInRange = eachDayOfInterval({ start: startDate, end: endDate });
      const weekDays = daysInRange.filter(d => d.getDay() !== 0 && d.getDay() !== 6); // Exclude weekends
      
      const dailyData: DailyPerformance[] = weekDays.map(day => {
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);
        
        const daySignals = typedSignals.filter(s => {
          const signalDate = new Date(s.datetime);
          return signalDate >= dayStart && signalDate <= dayEnd;
        });

        const positivas = daySignals.filter(s => isSignalSuccessful(s)).length;
        const negativos = daySignals.length - positivas;
        
        const pipsWins = daySignals
          .filter(s => isSignalSuccessful(s))
          .reduce((acc, s) => acc + Math.abs(calculatePips(s)), 0);
        
        const pipsLoss = daySignals
          .filter(s => !isSignalSuccessful(s))
          .reduce((acc, s) => acc + Math.abs(calculatePips(s)), 0);

        return {
          day: dayNames[day.getDay()],
          date: format(day, 'dd-MMM', { locale: es }),
          fullDate: day,
          totalSignals: daySignals.length,
          positivas,
          negativos,
          pipsWins,
          pipsLoss,
          signals: daySignals,
        };
      }).reverse(); // Most recent first

      // Calculate totals
      const totalSignals = typedSignals.length;
      const successfulSignals = typedSignals.filter(s => isSignalSuccessful(s)).length;
      const lostSignals = totalSignals - successfulSignals;
      const successRate = totalSignals > 0 ? Math.round((successfulSignals / totalSignals) * 100) : 0;
      
      const pipsGained = typedSignals
        .filter(s => isSignalSuccessful(s))
        .reduce((acc, s) => acc + Math.abs(calculatePips(s)), 0);
      
      const pipsLost = typedSignals
        .filter(s => !isSignalSuccessful(s))
        .reduce((acc, s) => acc + Math.abs(calculatePips(s)), 0);

      const weekNumber = getWeek(selectedWeek, { weekStartsOn: 1 });

      const weekTotal = {
        day: weekNumber.toString(),
        date: `${format(startDate, 'dd/MM', { locale: es })}-${format(endDate, 'dd/MM', { locale: es })}`,
        totalSignals: dailyData.reduce((acc, d) => acc + d.totalSignals, 0),
        positivas: dailyData.reduce((acc, d) => acc + d.positivas, 0),
        negativos: dailyData.reduce((acc, d) => acc + d.negativos, 0),
        pipsWins: dailyData.reduce((acc, d) => acc + d.pipsWins, 0),
        pipsLoss: dailyData.reduce((acc, d) => acc + d.pipsLoss, 0),
      };

      return {
        weekNumber,
        totalSignals,
        successfulSignals,
        lostSignals,
        pipsGained,
        pipsLost: -pipsLost,
        successRate,
        dailyData,
        weekTotal,
      };
    },
  });
}

export function useSessionPerformance(selectedWeek: Date, dateRange?: { from?: Date; to?: Date }) {
  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });
  
  const startDate = dateRange?.from || weekStart;
  const endDate = dateRange?.to || weekEnd;

  return useQuery({
    queryKey: ['session-performance', startDate.toISOString(), endDate.toISOString()],
    queryFn: async (): Promise<SessionPerformance[]> => {
      const { data: signals, error } = await supabase
        .from('trading_signals')
        .select('*')
        .gte('datetime', startDate.toISOString())
        .lte('datetime', endDate.toISOString());

      if (error) throw error;

      const typedSignals = (signals || []) as PerformanceSignal[];
      
      const sessions = ['New York', 'Londres', 'Asia'];
      
      return sessions.map(sessionName => {
        const sessionSignals = typedSignals.filter(s => getSession(s.datetime) === sessionName);
        const totalPips = sessionSignals.reduce((acc, s) => acc + calculatePips(s), 0);
        const successCount = sessionSignals.filter(s => isSignalSuccessful(s)).length;
        const percentage = sessionSignals.length > 0 
          ? ((successCount / sessionSignals.length) * 100 - 50) * 0.3 // Normalized percentage
          : 0;
        
        return {
          name: sessionName,
          percentage: Math.round(percentage * 100) / 100,
          pips: totalPips,
          isPositive: totalPips >= 0,
        };
      });
    },
  });
}

export function useCurrencyPairPerformance(selectedWeek: Date, dateRange?: { from?: Date; to?: Date }) {
  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });
  
  const startDate = dateRange?.from || weekStart;
  const endDate = dateRange?.to || weekEnd;

  return useQuery({
    queryKey: ['currency-pair-performance', startDate.toISOString(), endDate.toISOString()],
    queryFn: async (): Promise<CurrencyPairPerformance[]> => {
      const { data: signals, error } = await supabase
        .from('trading_signals')
        .select('*')
        .gte('datetime', startDate.toISOString())
        .lte('datetime', endDate.toISOString());

      if (error) throw error;

      const typedSignals = (signals || []) as PerformanceSignal[];
      
      // Group by currency pair
      const pairMap = new Map<string, PerformanceSignal[]>();
      typedSignals.forEach(signal => {
        const pair = signal.currency_pair;
        if (!pairMap.has(pair)) {
          pairMap.set(pair, []);
        }
        pairMap.get(pair)!.push(signal);
      });

      // Get top 2 most active pairs
      const sortedPairs = Array.from(pairMap.entries())
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 2);

      return sortedPairs.map(([pair, pairSignals]) => {
        const totalPips = pairSignals.reduce((acc, s) => acc + calculatePips(s), 0);
        const prices = pairSignals.map(s => s.entry_price);
        const latestPrice = pairSignals[0]?.entry_price || 0;
        
        return {
          pair: pair.replace('/', ' '),
          currentPrice: latestPrice,
          change: totalPips,
          highPrice: Math.max(...prices, latestPrice),
          lowPrice: Math.min(...prices, latestPrice),
          totalSignals: pairSignals.length,
        };
      });
    },
  });
}

export function useDailyActivityData(selectedWeek: Date, dateRange?: { from?: Date; to?: Date }) {
  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });
  
  const startDate = dateRange?.from || weekStart;
  const endDate = dateRange?.to || weekEnd;

  return useQuery({
    queryKey: ['daily-activity', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const { data: signals, error } = await supabase
        .from('trading_signals')
        .select('*')
        .gte('datetime', startDate.toISOString())
        .lte('datetime', endDate.toISOString());

      if (error) throw error;

      const typedSignals = (signals || []) as PerformanceSignal[];
      const days = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];
      
      return days.map(dayName => {
        const dayIndex = Object.entries(dayNames).find(([, name]) => name === dayName)?.[0];
        if (!dayIndex) return { day: dayName, pips: 0 };
        
        const daySignals = typedSignals.filter(s => {
          const signalDay = new Date(s.datetime).getDay();
          return signalDay === parseInt(dayIndex);
        });
        
        const totalPips = daySignals.reduce((acc, s) => acc + Math.abs(calculatePips(s)), 0);
        
        return { day: dayName, pips: totalPips };
      });
    },
  });
}
