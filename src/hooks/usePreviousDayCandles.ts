import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface PreviousDayData {
  candles: CandleData[];
  resistance: number;
  support: number;
  open: number;
  close: number;
  high: number;
  low: number;
  date: string;
}

interface UsePreviousDayCandlesReturn {
  data: PreviousDayData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Cache for previous day data
const cache = new Map<string, { data: PreviousDayData; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export function usePreviousDayCandles(symbol: string): UsePreviousDayCandlesReturn {
  const [data, setData] = useState<PreviousDayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (bypassCache = false) => {
    if (!symbol) return;

    const cacheKey = `prev_day_${symbol}`;
    
    // Check cache
    if (!bypassCache) {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setData(cached.data);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // Calculate previous trading day (skip weekends for Forex)
      const today = new Date();
      let previousDay = subDays(today, 1);
      
      // Skip to Friday if today is Monday (previous day would be Sunday)
      const dayOfWeek = today.getDay();
      if (dayOfWeek === 1) { // Monday
        previousDay = subDays(today, 3); // Go back to Friday
      } else if (dayOfWeek === 0) { // Sunday
        previousDay = subDays(today, 2); // Go back to Friday
      }

      const dateStr = format(previousDay, 'yyyy-MM-dd');
      
      // Fetch intraday data for the previous day (1-hour candles)
      const { data: result, error: fetchError } = await supabase.functions.invoke('market-data', {
        body: {
          symbol: symbol.replace('/', ''),
          interval: '1h',
          outputsize: 24, // Get 24 hours of data
          date: dateStr,
        },
      });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      // Process the data - filter to only previous day
      let candles: CandleData[] = [];
      
      if (result?.['Time Series (60min)']) {
        const timeSeries = result['Time Series (60min)'];
        const entries = Object.entries(timeSeries);
        
        candles = entries
          .filter(([time]) => time.startsWith(dateStr))
          .map(([time, values]: [string, any]) => ({
            time,
            open: parseFloat(values['1. open']),
            high: parseFloat(values['2. high']),
            low: parseFloat(values['3. low']),
            close: parseFloat(values['4. close']),
          }))
          .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
      }

      // If no real data, generate mock data for the previous day
      if (candles.length === 0) {
        const basePrice = getBasePrice(symbol);
        candles = generateMockPreviousDayCandles(previousDay, basePrice);
      }

      // Calculate high/low for resistance/support
      const allHighs = candles.map(c => c.high);
      const allLows = candles.map(c => c.low);
      const dayHigh = Math.max(...allHighs);
      const dayLow = Math.min(...allLows);
      const dayOpen = candles[0]?.open || 0;
      const dayClose = candles[candles.length - 1]?.close || 0;

      const previousDayData: PreviousDayData = {
        candles,
        resistance: dayHigh,
        support: dayLow,
        open: dayOpen,
        close: dayClose,
        high: dayHigh,
        low: dayLow,
        date: dateStr,
      };

      // Cache the result
      cache.set(cacheKey, { data: previousDayData, timestamp: Date.now() });
      
      setData(previousDayData);
    } catch (err) {
      console.error('Error fetching previous day candles:', err);
      setError(err instanceof Error ? err.message : 'Error fetching data');
      
      // Generate fallback mock data
      const previousDay = subDays(new Date(), 1);
      const basePrice = getBasePrice(symbol);
      const mockCandles = generateMockPreviousDayCandles(previousDay, basePrice);
      const dayHigh = Math.max(...mockCandles.map(c => c.high));
      const dayLow = Math.min(...mockCandles.map(c => c.low));
      
      setData({
        candles: mockCandles,
        resistance: dayHigh,
        support: dayLow,
        open: mockCandles[0]?.open || basePrice,
        close: mockCandles[mockCandles.length - 1]?.close || basePrice,
        high: dayHigh,
        low: dayLow,
        date: format(previousDay, 'yyyy-MM-dd'),
      });
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  return { data, loading, error, refetch };
}

// Helper to get base price for different symbols
function getBasePrice(symbol: string): number {
  const prices: Record<string, number> = {
    'EUR/USD': 1.05,
    'GBP/USD': 1.27,
    'USD/JPY': 157.50,
    'USD/CHF': 0.90,
    'AUD/USD': 0.62,
    'USD/CAD': 1.44,
    'NZD/USD': 0.56,
    'BTC/USD': 95000,
    'ETH/USD': 3400,
    'XRP/USD': 2.30,
  };
  return prices[symbol] || 1.0;
}

// Generate realistic mock candles for a full trading day
function generateMockPreviousDayCandles(date: Date, basePrice: number): CandleData[] {
  const candles: CandleData[] = [];
  const volatility = basePrice * 0.001; // 0.1% volatility per hour
  
  let currentPrice = basePrice;
  
  // Generate 24 hourly candles
  for (let hour = 0; hour < 24; hour++) {
    const time = new Date(date);
    time.setHours(hour, 0, 0, 0);
    
    const open = currentPrice;
    const change = (Math.random() - 0.5) * volatility * 2;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    
    candles.push({
      time: time.toISOString(),
      open: Number(open.toFixed(5)),
      high: Number(high.toFixed(5)),
      low: Number(low.toFixed(5)),
      close: Number(close.toFixed(5)),
    });
    
    currentPrice = close;
  }
  
  return candles;
}
