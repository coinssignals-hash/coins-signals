import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TimeSeriesValue {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
}

interface RSIValue {
  datetime: string;
  rsi: string;
}

interface MACDValue {
  datetime: string;
  macd: string;
  macd_signal: string;
  macd_hist: string;
}

interface SMAValue {
  datetime: string;
  sma: string;
}

interface MarketData {
  priceData: Array<{
    time: string;
    price: number;
    open: number;
    high: number;
    low: number;
  }>;
  smaData: {
    sma20: Array<{ datetime: string; sma: number }>;
    sma50: Array<{ datetime: string; sma: number }>;
  };
  rsiData: Array<{ time: string; rsi: number }>;
  macdData: Array<{
    time: string;
    macd: number;
    signal: number;
    histogram: number;
  }>;
}

const timeframeMap: Record<string, string> = {
  '1H': '1h',
  '4H': '4h',
  '1D': '1day',
  '1W': '1week',
};

export function useMarketData(symbol: string, timeframe: string) {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const interval = timeframeMap[timeframe] || '4h';

    try {
      // Fetch price data
      const priceResponse = await supabase.functions.invoke('market-data', {
        body: { symbol, interval, outputsize: 50 },
      });

      if (priceResponse.error) {
        throw new Error(priceResponse.error.message);
      }

      const priceResult = priceResponse.data;
      
      if (priceResult.status === 'error') {
        throw new Error(priceResult.error || 'Error fetching price data');
      }

      // Fetch RSI
      const rsiResponse = await supabase.functions.invoke('market-data', {
        body: { symbol, interval, indicator: 'rsi', outputsize: 50 },
      });

      // Fetch MACD
      const macdResponse = await supabase.functions.invoke('market-data', {
        body: { symbol, interval, indicator: 'macd', outputsize: 50 },
      });

      // Fetch SMA
      const smaResponse = await supabase.functions.invoke('market-data', {
        body: { symbol, interval, indicator: 'sma', outputsize: 50 },
      });

      // Process price data
      const priceValues: TimeSeriesValue[] = priceResult.values || [];
      const processedPrice = priceValues.map((v) => ({
        time: v.datetime,
        price: parseFloat(v.close),
        open: parseFloat(v.open),
        high: parseFloat(v.high),
        low: parseFloat(v.low),
      })).reverse();

      // Process RSI data
      const rsiValues: RSIValue[] = rsiResponse.data?.values || [];
      const processedRSI = rsiValues.map((v) => ({
        time: v.datetime,
        rsi: parseFloat(v.rsi),
      })).reverse();

      // Process MACD data
      const macdValues: MACDValue[] = macdResponse.data?.values || [];
      const processedMACD = macdValues.map((v) => ({
        time: v.datetime,
        macd: parseFloat(v.macd),
        signal: parseFloat(v.macd_signal),
        histogram: parseFloat(v.macd_hist),
      })).reverse();

      // Process SMA data
      const sma20Values: SMAValue[] = smaResponse.data?.sma20 || [];
      const sma50Values: SMAValue[] = smaResponse.data?.sma50 || [];
      
      const processedSMA = {
        sma20: sma20Values.map((v) => ({
          datetime: v.datetime,
          sma: parseFloat(v.sma),
        })).reverse(),
        sma50: sma50Values.map((v) => ({
          datetime: v.datetime,
          sma: parseFloat(v.sma),
        })).reverse(),
      };

      setData({
        priceData: processedPrice,
        smaData: processedSMA,
        rsiData: processedRSI,
        macdData: processedMACD,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error fetching market data';
      console.error('Market data error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe]);

  useEffect(() => {
    fetchData();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}