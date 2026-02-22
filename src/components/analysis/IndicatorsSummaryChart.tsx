import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Gauge, Activity, BarChart3, Waves, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IndicatorResult {
  name: string;
  fullName: string;
  signal: 'buy' | 'sell' | 'neutral';
  value: number; // -100 to 100
  weight: number;
  detail: string;
  icon: React.ElementType;
}

interface IndicatorsSummaryChartProps {
  priceData?: Array<{ time: string; price: number; high: number; low: number; open: number }>;
  rsiData?: Array<{ time: string; rsi: number }>;
  macdData?: Array<{ time: string; macd: number; signal: number; histogram: number }>;
  smaData?: {
    sma20: Array<{ datetime: string; sma: number }>;
    sma50: Array<{ datetime: string; sma: number }>;
  };
  loading?: boolean;
}

export function IndicatorsSummaryChart({ priceData, rsiData, macdData, smaData, loading }: IndicatorsSummaryChartProps) {
  const indicators = useMemo((): IndicatorResult[] => {
    const results: IndicatorResult[] = [];

    // RSI
    const latestRSI = rsiData && rsiData.length > 0 ? rsiData[rsiData.length - 1].rsi : null;
    if (latestRSI !== null) {
      let sig: 'buy' | 'sell' | 'neutral' = 'neutral';
      let val = 0;
      if (latestRSI < 30) { sig = 'buy'; val = Math.round((30 - latestRSI) / 30 * 100); }
      else if (latestRSI > 70) { sig = 'sell'; val = -Math.round((latestRSI - 70) / 30 * 100); }
      else { val = Math.round((50 - latestRSI) / 20 * -30); }
      results.push({ name: 'RSI', fullName: 'RSI (14)', signal: sig, value: val, weight: 1, detail: latestRSI.toFixed(1), icon: Gauge });
    } else {
      results.push({ name: 'RSI', fullName: 'RSI (14)', signal: 'neutral', value: 0, weight: 1, detail: '—', icon: Gauge });
    }

    // MACD
    if (macdData && macdData.length > 1) {
      const latest = macdData[macdData.length - 1];
      const prev = macdData[macdData.length - 2];
      let sig: 'buy' | 'sell' | 'neutral' = 'neutral';
      let val = 0;
      if (prev.macd < prev.signal && latest.macd > latest.signal) { sig = 'buy'; val = 80; }
      else if (prev.macd > prev.signal && latest.macd < latest.signal) { sig = 'sell'; val = -80; }
      else if (latest.histogram > 0) { sig = latest.histogram > prev.histogram ? 'buy' : 'neutral'; val = Math.min(50, latest.histogram * 1000); }
      else { sig = latest.histogram < prev.histogram ? 'sell' : 'neutral'; val = Math.max(-50, latest.histogram * 1000); }
      results.push({ name: 'MACD', fullName: 'MACD (12,26,9)', signal: sig, value: val, weight: 1.2, detail: latest.histogram >= 0 ? '+' : '−', icon: BarChart3 });
    } else {
      results.push({ name: 'MACD', fullName: 'MACD (12,26,9)', signal: 'neutral', value: 0, weight: 1.2, detail: '—', icon: BarChart3 });
    }

    // Bollinger
    if (priceData && priceData.length >= 20) {
      const prices = priceData.slice(-20).map(p => p.price);
      const sma = prices.reduce((a, b) => a + b, 0) / 20;
      const stdDev = Math.sqrt(prices.reduce((a, b) => a + Math.pow(b - sma, 2), 0) / 20);
      const upper = sma + 2 * stdDev;
      const lower = sma - 2 * stdDev;
      const current = priceData[priceData.length - 1].price;
      const pB = ((current - lower) / (upper - lower)) * 100;
      let sig: 'buy' | 'sell' | 'neutral' = 'neutral';
      let val = 0;
      if (pB < 20) { sig = 'buy'; val = Math.round(80 - pB * 4); }
      else if (pB > 80) { sig = 'sell'; val = -Math.round((pB - 80) * 4 + 20); }
      else { val = Math.round((50 - pB) * 0.6); }
      results.push({ name: 'BB', fullName: 'Bollinger (20,2)', signal: sig, value: val, weight: 0.8, detail: `${pB.toFixed(0)}%B`, icon: Waves });
    } else {
      results.push({ name: 'BB', fullName: 'Bollinger (20,2)', signal: 'neutral', value: 0, weight: 0.8, detail: '—', icon: Waves });
    }

    // Stochastic
    if (priceData && priceData.length >= 14) {
      const slice = priceData.slice(-14);
      const hh = Math.max(...slice.map(p => p.high));
      const ll = Math.min(...slice.map(p => p.low));
      const current = priceData[priceData.length - 1].price;
      const k = ((current - ll) / (hh - ll)) * 100;
      let sig: 'buy' | 'sell' | 'neutral' = 'neutral';
      let val = 0;
      if (k < 20) { sig = 'buy'; val = Math.round(80 - k * 4); }
      else if (k > 80) { sig = 'sell'; val = -Math.round((k - 80) * 4 + 20); }
      else { val = Math.round((50 - k) * 0.5); }
      results.push({ name: 'Stoch', fullName: 'Estocástico (14,3)', signal: sig, value: val, weight: 0.9, detail: `${k.toFixed(0)}%K`, icon: Percent });
    } else {
      results.push({ name: 'Stoch', fullName: 'Estocástico (14,3)', signal: 'neutral', value: 0, weight: 0.9, detail: '—', icon: Percent });
    }

    // SMA Trend
    if (smaData?.sma20?.length && smaData?.sma50?.length && priceData?.length) {
      const price = priceData[priceData.length - 1].price;
      const sma20 = smaData.sma20[smaData.sma20.length - 1].sma;
      const sma50 = smaData.sma50[smaData.sma50.length - 1].sma;
      const aboveSma20 = price > sma20;
      const aboveSma50 = price > sma50;
      const goldenCross = sma20 > sma50;
      let sig: 'buy' | 'sell' | 'neutral' = 'neutral';
      let val = 0;
      if (aboveSma20 && aboveSma50 && goldenCross) { sig = 'buy'; val = 70; }
      else if (!aboveSma20 && !aboveSma50 && !goldenCross) { sig = 'sell'; val = -70; }
      else if (aboveSma20 || goldenCross) { val = 30; sig = 'buy'; }
      else { val = -30; sig = 'sell'; }
      results.push({ name: 'SMA', fullName: 'Medias Móviles', signal: sig, value: val, weight: 1, detail: goldenCross ? 'Golden' : 'Death', icon: TrendingUp });
    } else {
      results.push({ name: 'SMA', fullName: 'Medias Móviles', signal: 'neutral', value: 0, weight: 1, detail: '—', icon: TrendingUp });
    }

    return results;
  }, [priceData, rsiData, macdData, smaData]);

  const { score, overallSignal, buyCount, sellCount, neutralCount } = useMemo(() => {
    const totalWeight = indicators.reduce((s, i) => s + i.weight, 0);
    const weightedSum = indicators.reduce((s, i) => s + i.value * i.weight, 0);
    const score = totalWeight > 0 ? weightedSum / totalWeight : 0;
    const buyCount = indicators.filter(i => i.signal === 'buy').length;
    const sellCount = indicators.filter(i => i.signal === 'sell').length;
    const neutralCount = indicators.filter(i => i.signal === 'neutral').length;
    const overallSignal = score > 25 ? 'buy' as const : score < -25 ? 'sell' as const : 'neutral' as const;
    return { score, overallSignal, buyCount, sellCount, neutralCount };
  }, [indicators]);

  if (loading) {
    return (
      <div className="bg-[#0a1628] border border-cyan-900/30 rounded-xl p-5">
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-cyan-900/20 rounded w-1/3" />
          <div className="h-[180px] bg-cyan-900/10 rounded" />
        </div>
      </div>
    );
  }

  // Gauge rotation: -90 (sell) to +90 (buy)
  const gaugeAngle = (score / 100) * 90;

  return (
    <div className="bg-[#0a1628] border border-cyan-900/30 rounded-xl p-4 space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10">
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-sm font-semibold text-white">Resumen de Indicadores</span>
        </div>
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold",
          overallSignal === 'buy' && "bg-green-500/15 text-green-400 shadow-[0_0_12px_rgba(34,197,94,0.2)]",
          overallSignal === 'sell' && "bg-red-500/15 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.2)]",
          overallSignal === 'neutral' && "bg-gray-500/15 text-gray-400",
        )}>
          {overallSignal === 'buy' && <TrendingUp className="w-3.5 h-3.5" />}
          {overallSignal === 'sell' && <TrendingDown className="w-3.5 h-3.5" />}
          {overallSignal === 'neutral' && <Minus className="w-3.5 h-3.5" />}
          {overallSignal === 'buy' ? 'COMPRA' : overallSignal === 'sell' ? 'VENTA' : 'NEUTRAL'}
        </div>
      </div>

      {/* ── Gauge + Score ── */}
      <div className="flex items-center gap-6">
        {/* SVG Gauge */}
        <div className="relative w-28 h-14 shrink-0">
          <svg viewBox="0 0 100 55" className="w-full h-full">
            <defs>
              <linearGradient id="summaryGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="30%" stopColor="#f97316" />
                <stop offset="50%" stopColor="#6b7280" />
                <stop offset="70%" stopColor="#84cc16" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
            {/* Background arc */}
            <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="url(#summaryGaugeGrad)" strokeWidth="6" strokeLinecap="round" opacity="0.25" />
            {/* Active arc */}
            <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="url(#summaryGaugeGrad)" strokeWidth="6" strokeLinecap="round"
              strokeDasharray="126" strokeDashoffset={126 - (126 * ((score + 100) / 200))}
              className="transition-all duration-700 ease-out" />
            {/* Ticks */}
            {[-90, -45, 0, 45, 90].map((angle, idx) => (
              <line key={idx}
                x1={50 + 34 * Math.cos((angle - 90) * Math.PI / 180)}
                y1={50 + 34 * Math.sin((angle - 90) * Math.PI / 180)}
                x2={50 + 40 * Math.cos((angle - 90) * Math.PI / 180)}
                y2={50 + 40 * Math.sin((angle - 90) * Math.PI / 180)}
                stroke="#4b5563" strokeWidth="0.8" />
            ))}
          </svg>
          {/* Needle */}
          <div className="absolute bottom-0 left-1/2 origin-bottom transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-50%) rotate(${gaugeAngle}deg)` }}>
            <div className="w-0.5 h-10 bg-gradient-to-t from-white to-white/50 rounded-full" />
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white shadow border-2 border-gray-800" />
        </div>

        {/* Score + Counts */}
        <div className="flex-1 space-y-2">
          <div className="flex items-baseline gap-1">
            <span className={cn(
              "text-3xl font-bold font-mono tabular-nums",
              score > 25 ? "text-green-400" : score < -25 ? "text-red-400" : "text-gray-400"
            )}>
              {score > 0 ? '+' : ''}{score.toFixed(0)}
            </span>
            <span className="text-xs text-gray-600">/ 100</span>
          </div>
          <div className="flex gap-2">
            {[
              { label: 'Compra', count: buyCount, bg: 'bg-green-500', text: 'text-green-400' },
              { label: 'Neutral', count: neutralCount, bg: 'bg-gray-500', text: 'text-gray-400' },
              { label: 'Venta', count: sellCount, bg: 'bg-red-500', text: 'text-red-400' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className={cn("w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white", item.bg)}>
                  {item.count}
                </div>
                <span className={cn("text-[10px]", item.text)}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Indicator Cards ── */}
      <div className="space-y-1.5">
        {indicators.map((ind) => {
          const Icon = ind.icon;
          const barWidth = Math.abs(ind.value);
          return (
            <div key={ind.name}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all",
                ind.signal === 'buy' && "bg-green-500/5 border border-green-500/15",
                ind.signal === 'sell' && "bg-red-500/5 border border-red-500/15",
                ind.signal === 'neutral' && "bg-gray-500/5 border border-gray-500/10",
              )}>
              {/* Icon */}
              <div className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                ind.signal === 'buy' && "bg-green-500/15 text-green-400",
                ind.signal === 'sell' && "bg-red-500/15 text-red-400",
                ind.signal === 'neutral' && "bg-gray-500/15 text-gray-400",
              )}>
                <Icon className="w-3.5 h-3.5" />
              </div>

              {/* Name + Detail */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-white">{ind.name}</span>
                  <span className="text-[10px] font-mono text-gray-500">{ind.detail}</span>
                </div>
                {/* Progress bar */}
                <div className="mt-1 h-1 bg-gray-800 rounded-full overflow-hidden relative">
                  <div className="absolute inset-y-0 left-1/2 w-px bg-gray-700/50" />
                  {ind.value >= 0 ? (
                    <div className="absolute inset-y-0 left-1/2 bg-green-500/70 rounded-r-full transition-all duration-500"
                      style={{ width: `${barWidth / 2}%` }} />
                  ) : (
                    <div className="absolute inset-y-0 right-1/2 bg-red-500/70 rounded-l-full transition-all duration-500"
                      style={{ width: `${barWidth / 2}%` }} />
                  )}
                </div>
              </div>

              {/* Signal label */}
              <span className={cn(
                "text-[10px] font-bold uppercase shrink-0 w-12 text-right",
                ind.signal === 'buy' && "text-green-400",
                ind.signal === 'sell' && "text-red-400",
                ind.signal === 'neutral' && "text-gray-500",
              )}>
                {ind.signal === 'buy' ? 'Compra' : ind.signal === 'sell' ? 'Venta' : 'Neutral'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
