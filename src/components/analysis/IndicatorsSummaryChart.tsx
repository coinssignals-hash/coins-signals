import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Gauge, Activity, BarChart3, Waves, Percent, Zap, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface IndicatorResult {
  name: string;
  fullName: string;
  signal: 'buy' | 'sell' | 'neutral';
  value: number;
  weight: number;
  detail: string;
  icon: React.ElementType;
  source: string;
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

/* ─── Professional SVG Speedometer ─── */
function Speedometer({ score }: { score: number }) {
  const size = 120;
  const r = 44;
  const cx = size / 2;
  const cy = 56;
  const startA = -220;
  const endA = 40;
  const totalA = endA - startA;
  const normScore = ((score + 100) / 200) * 100;
  const valA = startA + (normScore / 100) * totalA;

  const ptc = (a: number, rad: number) => {
    const rn = (a * Math.PI) / 180;
    return { x: cx + rad * Math.cos(rn), y: cy + rad * Math.sin(rn) };
  };
  const arc = (s: number, e: number, rad: number) => {
    const sp = ptc(s, rad);
    const ep = ptc(e, rad);
    return `M ${sp.x} ${sp.y} A ${rad} ${rad} 0 ${e - s > 180 ? 1 : 0} 1 ${ep.x} ${ep.y}`;
  };

  const needle = ptc(valA, r - 10);
  const color = score > 25 ? '#22c55e' : score < -25 ? '#ef4444' : '#f59e0b';
  const label = score > 25 ? 'COMPRA' : score < -25 ? 'VENTA' : 'NEUTRAL';

  const segments = 40;
  const segPaths = Array.from({ length: segments }, (_, i) => {
    const sA = startA + (i / segments) * totalA;
    const eA = startA + ((i + 0.7) / segments) * totalA;
    const segNorm = i / segments;
    const active = segNorm <= normScore / 100;
    let segColor: string;
    if (segNorm < 0.35) segColor = '#ef4444';
    else if (segNorm < 0.5) segColor = '#f59e0b';
    else if (segNorm < 0.65) segColor = '#84cc16';
    else segColor = '#22c55e';
    return { path: arc(sA, eA, r), color: segColor, active };
  });

  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={72} viewBox={`0 0 ${size} 72`}>
        <defs>
          <filter id="speedGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Segments */}
        {segPaths.map((seg, i) => (
          <path key={i} d={seg.path} fill="none" stroke={seg.active ? seg.color : 'rgba(255,255,255,0.04)'}
            strokeWidth="5" strokeLinecap="round" opacity={seg.active ? 0.85 : 1}
            filter={seg.active ? 'url(#speedGlow)' : undefined} />
        ))}

        {/* Needle */}
        <line x1={cx} y1={cy} x2={needle.x} y2={needle.y} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="4" fill="#0a1628" stroke={color} strokeWidth="1.5" />
        <circle cx={cx} cy={cy} r="1.5" fill={color} />
      </svg>

      <div className="flex flex-col items-center -mt-1">
        <span className="text-xl font-black font-mono tabular-nums" style={{ color }}>
          {score > 0 ? '+' : ''}{score.toFixed(0)}
        </span>
        <span className="text-[8px] font-bold tracking-[0.2em] uppercase" style={{ color: color + '99' }}>{label}</span>
      </div>
    </div>
  );
}

/* ─── Signal Count Badge ─── */
function CountBadge({ count, label, color, bg }: { count: number; label: string; color: string; bg: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn("w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-black text-white", bg)}>
        {count}
      </div>
      <span className={cn("text-[10px] font-semibold", color)}>{label}</span>
    </div>
  );
}

/* ─── Individual Indicator Row ─── */
function IndicatorRow({ ind, index }: { ind: IndicatorResult; index: number }) {
  const Icon = ind.icon;
  const barWidth = Math.abs(ind.value);
  const isPositive = ind.value >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className={cn(
        "relative flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all group hover:bg-white/[0.02]",
        ind.signal === 'buy' && "bg-green-500/[0.04] border-green-500/15",
        ind.signal === 'sell' && "bg-red-500/[0.04] border-red-500/15",
        ind.signal === 'neutral' && "bg-white/[0.02] border-white/[0.06]",
      )}
    >
      {/* Left signal line */}
      <div className={cn(
        "absolute left-0 top-2 bottom-2 w-[2px] rounded-full",
        ind.signal === 'buy' && "bg-green-500",
        ind.signal === 'sell' && "bg-red-500",
        ind.signal === 'neutral' && "bg-gray-600",
      )} />

      {/* Icon */}
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border",
        ind.signal === 'buy' && "bg-green-500/10 border-green-500/20 text-green-400",
        ind.signal === 'sell' && "bg-red-500/10 border-red-500/20 text-red-400",
        ind.signal === 'neutral' && "bg-white/[0.04] border-white/[0.08] text-gray-400",
      )}>
        <Icon className="w-4 h-4" />
      </div>

      {/* Name + Full name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs font-bold text-white">{ind.name}</span>
            <span className="text-[9px] text-gray-600 font-mono hidden sm:inline">{ind.fullName}</span>
          </div>
          <span className="text-[11px] font-bold font-mono tabular-nums text-white/80">{ind.detail}</span>
        </div>

        {/* Bi-directional bar */}
        <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden relative">
          <div className="absolute inset-y-0 left-1/2 w-px bg-white/[0.08]" />
          {isPositive ? (
            <motion.div
              className="absolute inset-y-0 left-1/2 bg-gradient-to-r from-green-500 to-green-400 rounded-r-full"
              initial={{ width: 0 }}
              animate={{ width: `${barWidth / 2}%` }}
              transition={{ duration: 0.8, delay: index * 0.05 }}
            />
          ) : (
            <motion.div
              className="absolute inset-y-0 right-1/2 bg-gradient-to-l from-red-500 to-red-400 rounded-l-full"
              initial={{ width: 0 }}
              animate={{ width: `${barWidth / 2}%` }}
              transition={{ duration: 0.8, delay: index * 0.05 }}
            />
          )}
        </div>
      </div>

      {/* Signal label */}
      <div className={cn(
        "shrink-0 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md border",
        ind.signal === 'buy' && "text-green-400 bg-green-500/8 border-green-500/20",
        ind.signal === 'sell' && "text-red-400 bg-red-500/8 border-red-500/20",
        ind.signal === 'neutral' && "text-gray-500 bg-white/[0.03] border-white/[0.06]",
      )}>
        {ind.signal === 'buy' ? 'BUY' : ind.signal === 'sell' ? 'SELL' : 'HOLD'}
      </div>
    </motion.div>
  );
}

/* ─── Main Component ─── */
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
      results.push({ name: 'RSI', fullName: 'RSI (14)', signal: sig, value: val, weight: 1, detail: latestRSI.toFixed(1), icon: Gauge, source: 'AlphaVantage' });
    } else {
      results.push({ name: 'RSI', fullName: 'RSI (14)', signal: 'neutral', value: 0, weight: 1, detail: '—', icon: Gauge, source: '' });
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
      results.push({ name: 'MACD', fullName: 'MACD (12,26,9)', signal: sig, value: val, weight: 1.2, detail: latest.histogram >= 0 ? '+' + latest.histogram.toFixed(5) : latest.histogram.toFixed(5), icon: BarChart3, source: 'AlphaVantage' });
    } else {
      results.push({ name: 'MACD', fullName: 'MACD (12,26,9)', signal: 'neutral', value: 0, weight: 1.2, detail: '—', icon: BarChart3, source: '' });
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
      results.push({ name: 'BB', fullName: 'Bollinger (20,2)', signal: sig, value: val, weight: 0.8, detail: `${pB.toFixed(0)}%B`, icon: Waves, source: 'AlphaVantage' });
    } else {
      results.push({ name: 'BB', fullName: 'Bollinger (20,2)', signal: 'neutral', value: 0, weight: 0.8, detail: '—', icon: Waves, source: '' });
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
      results.push({ name: 'STOCH', fullName: 'Estocástico (14,3)', signal: sig, value: val, weight: 0.9, detail: `${k.toFixed(0)}%K`, icon: Percent, source: 'AlphaVantage' });
    } else {
      results.push({ name: 'STOCH', fullName: 'Estocástico (14,3)', signal: 'neutral', value: 0, weight: 0.9, detail: '—', icon: Percent, source: '' });
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
      results.push({ name: 'SMA', fullName: 'Medias Móviles', signal: sig, value: val, weight: 1, detail: goldenCross ? 'Golden' : 'Death', icon: TrendingUp, source: 'AlphaVantage' });
    } else {
      results.push({ name: 'SMA', fullName: 'Medias Móviles', signal: 'neutral', value: 0, weight: 1, detail: '—', icon: TrendingUp, source: '' });
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

  return (
    <div className="bg-[#0a1628] border border-cyan-900/30 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <Shield className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <span className="text-sm font-bold text-white block leading-tight">Resumen de Indicadores</span>
            <span className="text-[9px] text-gray-500 font-mono">5 indicadores · Ponderado</span>
          </div>
        </div>
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black border",
          overallSignal === 'buy' && "bg-green-500/10 text-green-400 border-green-500/25 shadow-[0_0_16px_rgba(34,197,94,0.15)]",
          overallSignal === 'sell' && "bg-red-500/10 text-red-400 border-red-500/25 shadow-[0_0_16px_rgba(239,68,68,0.15)]",
          overallSignal === 'neutral' && "bg-gray-500/10 text-gray-400 border-gray-500/25",
        )}>
          {overallSignal === 'buy' && <TrendingUp className="w-3.5 h-3.5" />}
          {overallSignal === 'sell' && <TrendingDown className="w-3.5 h-3.5" />}
          {overallSignal === 'neutral' && <Minus className="w-3.5 h-3.5" />}
          {overallSignal === 'buy' ? 'COMPRA' : overallSignal === 'sell' ? 'VENTA' : 'NEUTRAL'}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Gauge + Score + Counts */}
        <div className="flex items-center gap-4">
          <Speedometer score={score} />

          <div className="flex-1 space-y-3">
            {/* Score display */}
            <div className="flex items-baseline gap-1.5">
              <span className={cn(
                "text-3xl font-black font-mono tabular-nums",
                score > 25 ? "text-green-400" : score < -25 ? "text-red-400" : "text-gray-400"
              )}>
                {score > 0 ? '+' : ''}{score.toFixed(0)}
              </span>
              <span className="text-[10px] text-gray-600 font-mono">/ 100</span>
            </div>

            {/* Signal counts */}
            <div className="flex gap-3">
              <CountBadge count={buyCount} label="Compra" color="text-green-400" bg="bg-green-600" />
              <CountBadge count={neutralCount} label="Neutral" color="text-gray-400" bg="bg-gray-600" />
              <CountBadge count={sellCount} label="Venta" color="text-red-400" bg="bg-red-600" />
            </div>

            {/* Overall signal bar */}
            <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
              {buyCount > 0 && (
                <motion.div
                  className="bg-green-500 rounded-full"
                  initial={{ flex: 0 }}
                  animate={{ flex: buyCount }}
                  transition={{ duration: 0.8 }}
                />
              )}
              {neutralCount > 0 && (
                <motion.div
                  className="bg-gray-600 rounded-full"
                  initial={{ flex: 0 }}
                  animate={{ flex: neutralCount }}
                  transition={{ duration: 0.8 }}
                />
              )}
              {sellCount > 0 && (
                <motion.div
                  className="bg-red-500 rounded-full"
                  initial={{ flex: 0 }}
                  animate={{ flex: sellCount }}
                  transition={{ duration: 0.8 }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/20 to-transparent" />
          <Zap className="w-3 h-3 text-cyan-500/30" />
          <div className="flex-1 h-px bg-gradient-to-l from-cyan-500/20 to-transparent" />
        </div>

        {/* Indicator Rows */}
        <div className="space-y-1.5">
          {indicators.map((ind, i) => (
            <IndicatorRow key={ind.name} ind={ind} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
