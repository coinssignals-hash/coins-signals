import { useMemo } from 'react';
import { Gauge, BarChart3, TrendingUp, TrendingDown, Activity, Minus, Zap } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { useTranslation } from '@/i18n/LanguageContext';

interface IndicatorsSummaryProps {
  pair: string;
  timeframe: string;
  priceData?: Array<{ price: number; high?: number; low?: number }>;
  smaData?: {
    sma20: Array<{ sma: number }>;
    sma50: Array<{ sma: number }>;
  };
  rsiData?: Array<{ rsi: number }>;
  macdData?: Array<{ macd: number; signal: number; histogram?: number }>;
  loading?: boolean;
}

interface CardData {
  title: string;
  value: string;
  subValue: string;
  signal: 'buy' | 'sell' | 'neutral';
  strength: number; // 0-100
  icon: React.ElementType;
  sparkline?: number[];
}

export function IndicatorsSummary({
  pair, timeframe, priceData, smaData, rsiData, macdData, loading,
}: IndicatorsSummaryProps) {
  const { t } = useTranslation();

  const cards = useMemo((): CardData[] => {
    const result: CardData[] = [];

    // ─── RSI Card ───
    const rsiValues = rsiData?.map(r => r.rsi) || [];
    const currentRSI = rsiValues[rsiValues.length - 1] ?? 50;
    const rsiSignal: 'buy' | 'sell' | 'neutral' = currentRSI >= 70 ? 'sell' : currentRSI <= 30 ? 'buy' : 'neutral';
    const rsiStrength = rsiSignal === 'sell' ? Math.min(100, (currentRSI - 70) / 30 * 100)
      : rsiSignal === 'buy' ? Math.min(100, (30 - currentRSI) / 30 * 100)
      : Math.abs(50 - currentRSI) / 20 * 30;
    result.push({
      title: 'RSI (14)',
      value: currentRSI.toFixed(1),
      subValue: rsiSignal === 'sell' ? t('analysis_ind_overbought') : rsiSignal === 'buy' ? t('analysis_ind_oversold') : t('analysis_ind_neutral'),
      signal: rsiSignal,
      strength: rsiStrength,
      icon: Gauge,
      sparkline: rsiValues.slice(-10),
    });

    // ─── MACD Card ───
    const latestMACD = macdData?.[macdData.length - 1];
    const prevMACD = macdData?.[macdData.length - 2];
    let macdSignal: 'buy' | 'sell' | 'neutral' = 'neutral';
    let macdLabel = 'Neutral';
    let macdStrength = 30;
    let crossLabel = '';

    if (latestMACD && prevMACD) {
      const isBullishCross = prevMACD.macd <= prevMACD.signal && latestMACD.macd > latestMACD.signal;
      const isBearishCross = prevMACD.macd >= prevMACD.signal && latestMACD.macd < latestMACD.signal;

      if (isBullishCross) { macdSignal = 'buy'; macdLabel = t('analysis_ind_cross_up'); macdStrength = 85; crossLabel = '⚡'; }
      else if (isBearishCross) { macdSignal = 'sell'; macdLabel = t('analysis_ind_cross_down'); macdStrength = 85; crossLabel = '⚡'; }
      else if (latestMACD.macd > latestMACD.signal) { macdSignal = 'buy'; macdLabel = t('analysis_ind_bullish'); macdStrength = 55; }
      else { macdSignal = 'sell'; macdLabel = t('analysis_ind_bearish'); macdStrength = 55; }
    }
    const histValues = macdData?.map(m => m.histogram ?? (m.macd - m.signal)) || [];
    result.push({
      title: `MACD ${crossLabel}`,
      value: macdLabel,
      subValue: latestMACD ? `H: ${(latestMACD.histogram ?? (latestMACD.macd - latestMACD.signal)).toFixed(5)}` : '—',
      signal: macdSignal,
      strength: macdStrength,
      icon: BarChart3,
      sparkline: histValues.slice(-10),
    });

    // ─── Medias Móviles Card ───
    const currentPrice = priceData?.[priceData.length - 1]?.price ?? 0;
    const sma20 = smaData?.sma20?.[smaData.sma20.length - 1]?.sma;
    const sma50 = smaData?.sma50?.[smaData.sma50.length - 1]?.sma;
    let maSignal: 'buy' | 'sell' | 'neutral' = 'neutral';
    let maLabel = 'Neutral';
    let maStrength = 30;
    let maDetail = '—';

    if (sma20 && sma50 && currentPrice) {
      const aboveBoth = currentPrice > sma20 && currentPrice > sma50;
      const belowBoth = currentPrice < sma20 && currentPrice < sma50;
      const golden = sma20 > sma50;

      if (aboveBoth && golden) { maSignal = 'buy'; maLabel = 'Alcista'; maStrength = 80; maDetail = 'Golden Cross'; }
      else if (belowBoth && !golden) { maSignal = 'sell'; maLabel = 'Bajista'; maStrength = 80; maDetail = 'Death Cross'; }
      else if (aboveBoth) { maSignal = 'buy'; maLabel = 'Por encima'; maStrength = 55; maDetail = `SMA20: ${formatPrice(sma20, pair)}`; }
      else if (belowBoth) { maSignal = 'sell'; maLabel = 'Por debajo'; maStrength = 55; maDetail = `SMA20: ${formatPrice(sma20, pair)}`; }
      else { maLabel = 'Mixto'; maDetail = `SMA20: ${formatPrice(sma20, pair)}`; }
    }
    result.push({
      title: 'Medias Móviles',
      value: maLabel,
      subValue: maDetail,
      signal: maSignal,
      strength: maStrength,
      icon: Activity,
    });

    // ─── Señal General Card ───
    let buyPts = 0, sellPts = 0;
    if (rsiSignal === 'buy') buyPts += 2; else if (rsiSignal === 'sell') sellPts += 2;
    if (macdSignal === 'buy') buyPts += 2.4; else if (macdSignal === 'sell') sellPts += 2.4;
    if (maSignal === 'buy') buyPts += 2; else if (maSignal === 'sell') sellPts += 2;

    const total = buyPts + sellPts;
    const overallSignal: 'buy' | 'sell' | 'neutral' = buyPts > sellPts + 1.5 ? 'buy' : sellPts > buyPts + 1.5 ? 'sell' : 'neutral';
    const overallStrength = total > 0 ? Math.round((Math.max(buyPts, sellPts) / total) * 100) : 50;
    result.push({
      title: 'Señal General',
      value: overallSignal === 'buy' ? 'COMPRA' : overallSignal === 'sell' ? 'VENTA' : 'NEUTRAL',
      subValue: `Fuerza: ${overallStrength}%`,
      signal: overallSignal,
      strength: overallStrength,
      icon: overallSignal === 'buy' ? TrendingUp : overallSignal === 'sell' ? TrendingDown : Minus,
    });

    return result;
  }, [priceData, smaData, rsiData, macdData]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-[#0a1628] border border-cyan-900/20 rounded-xl p-3 h-[100px] animate-pulse">
            <div className="h-3 w-12 bg-cyan-900/20 rounded mb-3" />
            <div className="h-5 w-16 bg-cyan-900/15 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const signalColors = {
          buy: { border: 'border-green-500/20', bg: 'bg-green-500', text: 'text-green-400', glow: 'shadow-[0_0_8px_rgba(34,197,94,0.15)]', iconBg: 'bg-green-500/10' },
          sell: { border: 'border-red-500/20', bg: 'bg-red-500', text: 'text-red-400', glow: 'shadow-[0_0_8px_rgba(239,68,68,0.15)]', iconBg: 'bg-red-500/10' },
          neutral: { border: 'border-gray-500/15', bg: 'bg-gray-500', text: 'text-gray-400', glow: '', iconBg: 'bg-gray-500/10' },
        };
        const c = signalColors[card.signal];

        return (
          <div
            key={idx}
            className={cn(
              "relative bg-[#0a1628] border rounded-xl p-3 overflow-hidden transition-all",
              c.border, c.glow,
            )}
          >
            {/* Top: title + icon */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">{card.title}</span>
              <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", c.iconBg)}>
                <Icon className={cn("w-3.5 h-3.5", c.text)} />
              </div>
            </div>

            {/* Value */}
            <div className={cn("text-base font-bold font-mono mb-0.5", c.text)}>
              {card.value}
            </div>

            {/* Sub value */}
            <div className="text-[10px] text-gray-500 mb-2 truncate">
              {card.subValue}
            </div>

            {/* Strength bar */}
            <div className="h-1 bg-gray-800/60 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-700", c.bg)}
                style={{ width: `${card.strength}%`, opacity: 0.7 }}
              />
            </div>

            {/* Mini sparkline (if available) */}
            {card.sparkline && card.sparkline.length > 2 && (
              <div className="absolute bottom-1 right-2 opacity-15">
                <svg width="40" height="16" viewBox={`0 0 ${card.sparkline.length - 1} 16`}>
                  <polyline
                    fill="none"
                    stroke={card.signal === 'buy' ? '#22c55e' : card.signal === 'sell' ? '#ef4444' : '#6b7280'}
                    strokeWidth="1.2"
                    points={card.sparkline.map((v, i) => {
                      const min = Math.min(...card.sparkline!);
                      const max = Math.max(...card.sparkline!);
                      const range = max - min || 1;
                      const y = 16 - ((v - min) / range) * 14;
                      return `${i},${y}`;
                    }).join(' ')}
                  />
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
