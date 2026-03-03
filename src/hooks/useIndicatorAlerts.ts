import { useEffect, useRef, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AlertConfig {
  rsiOverbought: number;
  rsiOversold: number;
  enableRSI: boolean;
  enableMACD: boolean;
  enableSMACross: boolean;
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

interface Alert {
  id: string;
  type: 'rsi' | 'macd' | 'sma';
  title: string;
  message: string;
  level: 'warning' | 'critical';
  timestamp: Date;
  symbol: string;
}

const DEFAULT_CONFIG: AlertConfig = {
  rsiOverbought: 70,
  rsiOversold: 30,
  enableRSI: true,
  enableMACD: true,
  enableSMACross: true,
};

export function useIndicatorAlerts(
  data: MarketData | null,
  symbol: string,
  config: Partial<AlertConfig> = {}
) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const lastAlerts = useRef<Record<string, number>>({});
  const previousData = useRef<MarketData | null>(null);

  const sendPushNotification = useCallback(async (alert: Alert) => {
    try {
      const response = await supabase.functions.invoke('indicator-alerts', {
        body: {
          title: alert.title,
          body: alert.message,
          type: alert.type,
          symbol: alert.symbol,
          level: alert.level,
        },
      });
      
      if (response.error) {
        console.error('Failed to send push notification:', response.error);
      }
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }, []);

  const showToastAlert = useCallback((alert: Alert) => {
    const alertKey = `${alert.type}-${alert.level}`;
    const now = Date.now();
    const lastTime = lastAlerts.current[alertKey] || 0;
    
    // Prevent duplicate alerts within 30 seconds
    if (now - lastTime < 30000) return;
    lastAlerts.current[alertKey] = now;

    const variant = alert.level === 'critical' ? 'destructive' : 'default';
    
    toast({
      title: alert.title,
      description: alert.message,
      variant,
    });
  }, []);

  const triggerAlert = useCallback((_alert: Alert) => {
    // Toast and push notifications disabled
  }, []);

  const checkRSIAlerts = useCallback((rsiData: Array<{ time: string; rsi: number }>) => {
    if (!mergedConfig.enableRSI || rsiData.length < 2) return;

    const currentRSI = rsiData[rsiData.length - 1].rsi;
    const previousRSI = rsiData[rsiData.length - 2].rsi;

    // RSI Overbought
    if (currentRSI >= mergedConfig.rsiOverbought && previousRSI < mergedConfig.rsiOverbought) {
      triggerAlert({
        id: `rsi-overbought-${Date.now()}`,
        type: 'rsi',
        title: `⚠️ RSI Sobrecompra - ${symbol}`,
        message: `RSI alcanzó ${currentRSI.toFixed(2)} (>${mergedConfig.rsiOverbought}). Posible corrección a la baja.`,
        level: 'warning',
        timestamp: new Date(),
        symbol,
      });
    }

    // RSI Oversold
    if (currentRSI <= mergedConfig.rsiOversold && previousRSI > mergedConfig.rsiOversold) {
      triggerAlert({
        id: `rsi-oversold-${Date.now()}`,
        type: 'rsi',
        title: `⚠️ RSI Sobreventa - ${symbol}`,
        message: `RSI cayó a ${currentRSI.toFixed(2)} (<${mergedConfig.rsiOversold}). Posible rebote al alza.`,
        level: 'warning',
        timestamp: new Date(),
        symbol,
      });
    }

    // Extreme RSI levels (critical)
    if (currentRSI >= 80) {
      triggerAlert({
        id: `rsi-extreme-high-${Date.now()}`,
        type: 'rsi',
        title: `🚨 RSI Extremo - ${symbol}`,
        message: `RSI en nivel crítico: ${currentRSI.toFixed(2)}. Alta probabilidad de reversión.`,
        level: 'critical',
        timestamp: new Date(),
        symbol,
      });
    } else if (currentRSI <= 20) {
      triggerAlert({
        id: `rsi-extreme-low-${Date.now()}`,
        type: 'rsi',
        title: `🚨 RSI Extremo - ${symbol}`,
        message: `RSI en nivel crítico: ${currentRSI.toFixed(2)}. Alta probabilidad de rebote.`,
        level: 'critical',
        timestamp: new Date(),
        symbol,
      });
    }
  }, [mergedConfig, symbol, triggerAlert]);

  const checkMACDAlerts = useCallback((
    macdData: Array<{ time: string; macd: number; signal: number; histogram: number }>
  ) => {
    if (!mergedConfig.enableMACD || macdData.length < 2) return;

    const current = macdData[macdData.length - 1];
    const previous = macdData[macdData.length - 2];

    // Bullish crossover (MACD crosses above signal)
    if (current.macd > current.signal && previous.macd <= previous.signal) {
      triggerAlert({
        id: `macd-bullish-${Date.now()}`,
        type: 'macd',
        title: `📈 Cruce MACD Alcista - ${symbol}`,
        message: `MACD cruzó por encima de la señal. Posible inicio de tendencia alcista.`,
        level: 'warning',
        timestamp: new Date(),
        symbol,
      });
    }

    // Bearish crossover (MACD crosses below signal)
    if (current.macd < current.signal && previous.macd >= previous.signal) {
      triggerAlert({
        id: `macd-bearish-${Date.now()}`,
        type: 'macd',
        title: `📉 Cruce MACD Bajista - ${symbol}`,
        message: `MACD cruzó por debajo de la señal. Posible inicio de tendencia bajista.`,
        level: 'warning',
        timestamp: new Date(),
        symbol,
      });
    }

    // Strong momentum (histogram divergence)
    if (Math.abs(current.histogram) > Math.abs(previous.histogram) * 1.5) {
      const direction = current.histogram > 0 ? 'alcista' : 'bajista';
      triggerAlert({
        id: `macd-momentum-${Date.now()}`,
        type: 'macd',
        title: `🔥 Momentum Fuerte - ${symbol}`,
        message: `El histograma MACD muestra momentum ${direction} creciente.`,
        level: 'warning',
        timestamp: new Date(),
        symbol,
      });
    }
  }, [mergedConfig, symbol, triggerAlert]);

  const checkSMACrossAlerts = useCallback((
    priceData: Array<{ time: string; price: number }>,
    smaData: { sma20: Array<{ datetime: string; sma: number }>; sma50: Array<{ datetime: string; sma: number }> }
  ) => {
    if (!mergedConfig.enableSMACross) return;
    if (priceData.length < 2 || smaData.sma20.length < 2 || smaData.sma50.length < 2) return;

    const currentPrice = priceData[priceData.length - 1].price;
    const previousPrice = priceData[priceData.length - 2].price;
    const currentSMA20 = smaData.sma20[smaData.sma20.length - 1]?.sma;
    const previousSMA20 = smaData.sma20[smaData.sma20.length - 2]?.sma;
    const currentSMA50 = smaData.sma50[smaData.sma50.length - 1]?.sma;
    const previousSMA50 = smaData.sma50[smaData.sma50.length - 2]?.sma;

    if (!currentSMA20 || !previousSMA20 || !currentSMA50 || !previousSMA50) return;

    // Price crossing SMA20
    if (currentPrice > currentSMA20 && previousPrice <= previousSMA20) {
      triggerAlert({
        id: `sma-price-above-20-${Date.now()}`,
        type: 'sma',
        title: `📊 Precio sobre SMA20 - ${symbol}`,
        message: `El precio cruzó por encima de la SMA de 20 períodos. Señal alcista.`,
        level: 'warning',
        timestamp: new Date(),
        symbol,
      });
    } else if (currentPrice < currentSMA20 && previousPrice >= previousSMA20) {
      triggerAlert({
        id: `sma-price-below-20-${Date.now()}`,
        type: 'sma',
        title: `📊 Precio bajo SMA20 - ${symbol}`,
        message: `El precio cruzó por debajo de la SMA de 20 períodos. Señal bajista.`,
        level: 'warning',
        timestamp: new Date(),
        symbol,
      });
    }

    // Golden Cross (SMA20 crosses above SMA50)
    if (currentSMA20 > currentSMA50 && previousSMA20 <= previousSMA50) {
      triggerAlert({
        id: `sma-golden-cross-${Date.now()}`,
        type: 'sma',
        title: `✨ Cruz Dorada - ${symbol}`,
        message: `SMA20 cruzó por encima de SMA50. Señal alcista fuerte (Golden Cross).`,
        level: 'critical',
        timestamp: new Date(),
        symbol,
      });
    }

    // Death Cross (SMA20 crosses below SMA50)
    if (currentSMA20 < currentSMA50 && previousSMA20 >= previousSMA50) {
      triggerAlert({
        id: `sma-death-cross-${Date.now()}`,
        type: 'sma',
        title: `💀 Cruz de la Muerte - ${symbol}`,
        message: `SMA20 cruzó por debajo de SMA50. Señal bajista fuerte (Death Cross).`,
        level: 'critical',
        timestamp: new Date(),
        symbol,
      });
    }
  }, [mergedConfig, symbol, triggerAlert]);

  useEffect(() => {
    if (!data || data === previousData.current) return;
    
    previousData.current = data;

    // Check all alerts
    checkRSIAlerts(data.rsiData);
    checkMACDAlerts(data.macdData);
    checkSMACrossAlerts(data.priceData, data.smaData);
  }, [data, checkRSIAlerts, checkMACDAlerts, checkSMACrossAlerts]);

  return {
    config: mergedConfig,
  };
}
