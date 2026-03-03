import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Gauge, BarChart3, Waves, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IndicatorsSummaryChartProps {
  priceData?: Array<{time: string;price: number;high: number;low: number;open: number;}>;
  rsiData?: Array<{time: string;rsi: number;}>;
  macdData?: Array<{time: string;macd: number;signal: number;histogram: number;}>;
  smaData?: {
    sma20: Array<{datetime: string;sma: number;}>;
    sma50: Array<{datetime: string;sma: number;}>;
  };
  loading?: boolean;
}

interface Indicator {
  name: string;
  signal: 'buy' | 'sell' | 'neutral';
  value: string;
  icon: React.ElementType;
  weight: number;
  score: number;
}

export function IndicatorsSummaryChart({ priceData, rsiData, macdData, smaData, loading }: IndicatorsSummaryChartProps) {
  const indicators = useMemo((): Indicator[] => {
    const results: Indicator[] = [];

    // RSI
    const latestRSI = rsiData?.length ? rsiData[rsiData.length - 1].rsi : null;
    if (latestRSI !== null) {
      const sig = latestRSI < 30 ? 'buy' : latestRSI > 70 ? 'sell' : 'neutral';
      const sc = sig === 'buy' ? (30 - latestRSI) / 30 * 100 : sig === 'sell' ? -(latestRSI - 70) / 30 * 100 : (50 - latestRSI) / 20 * -30;
      results.push({ name: 'RSI', signal: sig, value: latestRSI.toFixed(1), icon: Gauge, weight: 1, score: sc });
    } else {
      results.push({ name: 'RSI', signal: 'neutral', value: '—', icon: Gauge, weight: 1, score: 0 });
    }

    // MACD
    if (macdData && macdData.length > 1) {
      const latest = macdData[macdData.length - 1];
      const prev = macdData[macdData.length - 2];
      let sig: 'buy' | 'sell' | 'neutral' = 'neutral';
      let sc = 0;
      if (prev.macd < prev.signal && latest.macd > latest.signal) {sig = 'buy';sc = 80;} else
      if (prev.macd > prev.signal && latest.macd < latest.signal) {sig = 'sell';sc = -80;} else
      if (latest.histogram > 0) {sig = 'buy';sc = Math.min(50, latest.histogram * 1000);} else
      {sig = 'sell';sc = Math.max(-50, latest.histogram * 1000);}
      results.push({ name: 'MACD', signal: sig, value: (latest.histogram >= 0 ? '+' : '') + latest.histogram.toFixed(5), icon: BarChart3, weight: 1.2, score: sc });
    } else {
      results.push({ name: 'MACD', signal: 'neutral', value: '—', icon: BarChart3, weight: 1.2, score: 0 });
    }

    // Bollinger
    if (priceData && priceData.length >= 20) {
      const prices = priceData.slice(-20).map((p) => p.price);
      const sma = prices.reduce((a, b) => a + b, 0) / 20;
      const stdDev = Math.sqrt(prices.reduce((a, b) => a + Math.pow(b - sma, 2), 0) / 20);
      const upper = sma + 2 * stdDev;
      const lower = sma - 2 * stdDev;
      const current = priceData[priceData.length - 1].price;
      const pB = (current - lower) / (upper - lower) * 100;
      const sig = pB < 20 ? 'buy' : pB > 80 ? 'sell' : 'neutral';
      const sc = sig === 'buy' ? 80 - pB * 4 : sig === 'sell' ? -(pB - 80) * 4 - 20 : (50 - pB) * 0.6;
      results.push({ name: 'BB', signal: sig, value: `${pB.toFixed(0)}%B`, icon: Waves, weight: 0.8, score: sc });
    } else {
      results.push({ name: 'BB', signal: 'neutral', value: '—', icon: Waves, weight: 0.8, score: 0 });
    }

    // Stochastic
    if (priceData && priceData.length >= 14) {
      const slice = priceData.slice(-14);
      const hh = Math.max(...slice.map((p) => p.high));
      const ll = Math.min(...slice.map((p) => p.low));
      const current = priceData[priceData.length - 1].price;
      const k = (current - ll) / (hh - ll) * 100;
      const sig = k < 20 ? 'buy' : k > 80 ? 'sell' : 'neutral';
      const sc = sig === 'buy' ? 80 - k * 4 : sig === 'sell' ? -(k - 80) * 4 - 20 : (50 - k) * 0.5;
      results.push({ name: 'STOCH', signal: sig, value: `${k.toFixed(0)}%K`, icon: Percent, weight: 0.9, score: sc });
    } else {
      results.push({ name: 'STOCH', signal: 'neutral', value: '—', icon: Percent, weight: 0.9, score: 0 });
    }

    // SMA
    if (smaData?.sma20?.length && smaData?.sma50?.length && priceData?.length) {
      const price = priceData[priceData.length - 1].price;
      const sma20 = smaData.sma20[smaData.sma20.length - 1].sma;
      const sma50 = smaData.sma50[smaData.sma50.length - 1].sma;
      const above20 = price > sma20;
      const above50 = price > sma50;
      const golden = sma20 > sma50;
      let sig: 'buy' | 'sell' | 'neutral' = 'neutral';
      let sc = 0;
      if (above20 && above50 && golden) {sig = 'buy';sc = 70;} else
      if (!above20 && !above50 && !golden) {sig = 'sell';sc = -70;} else
      if (above20 || golden) {sig = 'buy';sc = 30;} else
      {sig = 'sell';sc = -30;}
      results.push({ name: 'SMA', signal: sig, value: golden ? 'Golden' : 'Death', icon: TrendingUp, weight: 1, score: sc });
    } else {
      results.push({ name: 'SMA', signal: 'neutral', value: '—', icon: TrendingUp, weight: 1, score: 0 });
    }

    return results;
  }, [priceData, rsiData, macdData, smaData]);

  const { overallScore, overallSignal, buyCount, sellCount } = useMemo(() => {
    const totalW = indicators.reduce((s, i) => s + i.weight, 0);
    const weightedSum = indicators.reduce((s, i) => s + i.score * i.weight, 0);
    const score = totalW > 0 ? weightedSum / totalW : 0;
    return {
      overallScore: score,
      overallSignal: score > 25 ? 'buy' as const : score < -25 ? 'sell' as const : 'neutral' as const,
      buyCount: indicators.filter((i) => i.signal === 'buy').length,
      sellCount: indicators.filter((i) => i.signal === 'sell').length
    };
  }, [indicators]);

  if (loading) {
    return (
      <div className="bg-[#0a1628] border border-cyan-900/20 rounded-xl p-3">
        <div className="animate-pulse flex gap-2">
          {[1, 2, 3, 4, 5].map((i) =>
          <div key={i} className="flex-1 h-10 bg-cyan-900/10 rounded-lg" />
          )}
        </div>
      </div>);

  }

  const signalLabel = overallSignal === 'buy' ? 'COMPRA' : overallSignal === 'sell' ? 'VENTA' : 'NEUTRAL';
  const OverallIcon = overallSignal === 'buy' ? TrendingUp : overallSignal === 'sell' ? TrendingDown : Minus;

  return;


















































}