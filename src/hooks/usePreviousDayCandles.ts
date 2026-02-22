import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';

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
  /** Date range label e.g. "2026-02-15 → 2026-02-22" */
  dateRange?: string;
}

interface UsePreviousDayCandlesReturn {
  data: PreviousDayData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Cache for week data
const cache = new Map<string, { data: PreviousDayData; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export function usePreviousDayCandles(symbol: string): UsePreviousDayCandlesReturn {
  const [data, setData] = useState<PreviousDayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (bypassCache = false) => {
    if (!symbol) return;

    const cacheKey = `week_${symbol}`;
    
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
      // Fetch 7 days of 30-min candles
      const today = new Date();
      const weekAgo = subDays(today, 7);

      const { data: result, error: fetchError } = await supabase.functions.invoke('market-data', {
        body: {
          symbol: symbol.replace('/', ''),
          interval: '30min',
          outputsize: 336, // 7 days * 24 hours * 2 (30-min)
          date: format(today, 'yyyy-MM-dd'),
        },
      });

      if (fetchError) throw new Error(fetchError.message);

      let candles: CandleData[] = [];
      
      if (result?.['Time Series (60min)']) {
        const timeSeries = result['Time Series (60min)'];
        const entries = Object.entries(timeSeries);
        
        const weekAgoStr = format(weekAgo, 'yyyy-MM-dd');
        
        candles = entries
          .filter(([time]) => time >= weekAgoStr)
          .map(([time, values]: [string, any]) => ({
            time,
            open: parseFloat(values['1. open']),
            high: parseFloat(values['2. high']),
            low: parseFloat(values['3. low']),
            close: parseFloat(values['4. close']),
          }))
          .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
      }

      // If no real data, generate mock data for the week
      if (candles.length === 0) {
        const basePrice = getBasePrice(symbol);
        candles = generateMockWeekCandles(weekAgo, basePrice);
      }

      // Compute S/R from the last 24 hours (last complete trading day)
      const { support: sr_support, resistance: sr_resistance } = computeLast24hSR(candles);

      // Overall week stats
      const allHighs = candles.map(c => c.high);
      const allLows = candles.map(c => c.low);
      const dayOpen = candles[0]?.open || 0;
      const dayClose = candles[candles.length - 1]?.close || 0;

      const weekData: PreviousDayData = {
        candles,
        resistance: sr_resistance,
        support: sr_support,
        open: dayOpen,
        close: dayClose,
        high: Math.max(...allHighs),
        low: Math.min(...allLows),
        date: format(today, 'yyyy-MM-dd'),
        dateRange: `${format(weekAgo, 'dd MMM')} → ${format(today, 'dd MMM yyyy')}`,
      };

      cache.set(cacheKey, { data: weekData, timestamp: Date.now() });
      setData(weekData);
    } catch (err) {
      console.error('Error fetching week candles:', err);
      setError(err instanceof Error ? err.message : 'Error fetching data');
      
      // Fallback mock data
      const weekAgo = subDays(new Date(), 7);
      const basePrice = getBasePrice(symbol);
      const mockCandles = generateMockWeekCandles(weekAgo, basePrice);
      const { support: sr_support, resistance: sr_resistance } = computeLast24hSR(mockCandles);
      
      setData({
        candles: mockCandles,
        resistance: sr_resistance,
        support: sr_support,
        open: mockCandles[0]?.open || basePrice,
        close: mockCandles[mockCandles.length - 1]?.close || basePrice,
        high: Math.max(...mockCandles.map(c => c.high)),
        low: Math.min(...mockCandles.map(c => c.low)),
        date: format(new Date(), 'yyyy-MM-dd'),
        dateRange: `${format(weekAgo, 'dd MMM')} → ${format(new Date(), 'dd MMM yyyy')}`,
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

/**
 * Compute support/resistance from the last 24 candles (last trading day).
 * Support = lowest low, Resistance = highest high.
 */
function computeLast24hSR(candles: CandleData[]): { support: number; resistance: number } {
  if (candles.length === 0) return { support: 0, resistance: 0 };
  
  const last24 = candles.slice(-24);
  const highs = last24.map(c => c.high);
  const lows = last24.map(c => c.low);
  
  return {
    support: Math.min(...lows),
    resistance: Math.max(...highs),
  };
}

function getBasePrice(symbol: string): number {
  const prices: Record<string, number> = {
    'EUR/USD': 1.05, 'GBP/USD': 1.27, 'USD/JPY': 157.50,
    'USD/CHF': 0.90, 'AUD/USD': 0.62, 'USD/CAD': 1.44,
    'NZD/USD': 0.56, 'BTC/USD': 95000, 'ETH/USD': 3400, 'XRP/USD': 2.30,
  };
  return prices[symbol] || 1.0;
}

function generateMockWeekCandles(startDate: Date, basePrice: number): CandleData[] {
  const candles: CandleData[] = [];
  const volatility = basePrice * 0.001;
  let currentPrice = basePrice;
  
  // 7 days * 48 half-hours = 336 candles (30-min timeframe)
  for (let day = 0; day < 7; day++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + day);
    
    // Skip weekends for forex
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue;
    
    for (let slot = 0; slot < 48; slot++) {
      const time = new Date(date);
      time.setHours(Math.floor(slot / 2), (slot % 2) * 30, 0, 0);
      
      const open = currentPrice;
      const change = (Math.random() - 0.5) * volatility * 1.4;
      const close = open + change;
      const high = Math.max(open, close) + Math.random() * volatility * 0.4;
      const low = Math.min(open, close) - Math.random() * volatility * 0.4;
      
      candles.push({
        time: time.toISOString(),
        open: Number(open.toFixed(5)),
        high: Number(high.toFixed(5)),
        low: Number(low.toFixed(5)),
        close: Number(close.toFixed(5)),
      });
      
      currentPrice = close;
    }
  }
  
  return candles;
}
