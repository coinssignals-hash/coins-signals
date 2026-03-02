import { TrendingUp, TrendingDown, Minus, Loader2, Activity, BarChart3, Zap } from 'lucide-react';
import { useMarketSentiment } from '@/hooks/useAnalysisData';
import { AnalysisError } from './AnalysisError';
import { useTranslation } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface MarketSentimentProps {
  symbol: string;
  highPrice: number;
  lowPrice: number;
  dailyChange: number;
  pipsChange: number;
  realtimePrice?: number;
  isRealtimeConnected?: boolean;
}

function SentimentGauge({ value, size = 120 }: { value: number; size?: number }) {
  const radius = (size - 16) / 2;
  const cx = size / 2;
  const cy = size / 2 + 10;
  const startAngle = -210;
  const endAngle = 30;
  const totalAngle = endAngle - startAngle;
  const valueAngle = startAngle + (value / 100) * totalAngle;

  const polarToCartesian = (angle: number, r: number) => {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const arcPath = (startA: number, endA: number, r: number) => {
    const s = polarToCartesian(startA, r);
    const e = polarToCartesian(endA, r);
    const largeArc = endA - startA > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  };

  const needleEnd = polarToCartesian(valueAngle, radius - 8);
  const color = value >= 60 ? '#22c55e' : value >= 40 ? '#eab308' : '#ef4444';
  const glowColor = value >= 60 ? 'rgba(34,197,94,0.4)' : value >= 40 ? 'rgba(234,179,8,0.4)' : 'rgba(239,68,68,0.4)';

  return (
    <svg width={size} height={size * 0.75} viewBox={`0 0 ${size} ${size * 0.75}`}>
      <defs>
        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="50%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Background arc */}
      <path d={arcPath(startAngle, endAngle, radius)} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" strokeLinecap="round" />
      {/* Colored arc */}
      <path d={arcPath(startAngle, valueAngle, radius)} fill="none" stroke="url(#gaugeGradient)" strokeWidth="8" strokeLinecap="round" filter="url(#glow)" />
      {/* Needle */}
      <line x1={cx} y1={cy} x2={needleEnd.x} y2={needleEnd.y} stroke={color} strokeWidth="2.5" strokeLinecap="round" filter="url(#glow)" />
      {/* Center dot */}
      <circle cx={cx} cy={cy} r="4" fill={color} filter="url(#glow)" />
      <circle cx={cx} cy={cy} r="2" fill="white" />
      {/* Value text */}
      <text x={cx} y={cy + 20} textAnchor="middle" fill={color} fontSize="16" fontWeight="bold" fontFamily="monospace">{value}%</text>
    </svg>
  );
}

function MiniBar({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon: React.ElementType }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <Icon className="w-3 h-3" style={{ color }} />
        <span className="text-[11px] text-gray-400">{label}</span>
        <span className="text-xs font-bold ml-auto" style={{ color }}>{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function IndicatorChip({ name, signal, t }: { name: string; signal: string; t: (k: string) => string }) {
  const config = {
    buy: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', icon: TrendingUp, label: t('analysis_buy_signal') },
    sell: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', icon: TrendingDown, label: t('analysis_sell_signal') },
    neutral: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', icon: Minus, label: t('analysis_neutral_signal') },
  };
  const c = config[signal as keyof typeof config] || config.neutral;
  const Icon = c.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border", c.bg, c.border)}
    >
      <Icon className={cn("w-3 h-3", c.text)} />
      <div className="flex flex-col">
        <span className="text-[10px] text-gray-500 leading-none">{name}</span>
        <span className={cn("text-[11px] font-semibold leading-tight", c.text)}>{c.label}</span>
      </div>
    </motion.div>
  );
}

function PriceStatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-center">
      <span className="text-[10px] text-gray-500 block uppercase tracking-wider">{label}</span>
      <div className={cn("text-sm font-bold font-mono mt-0.5", color || "text-white")}>{value}</div>
    </div>
  );
}

export function MarketSentiment({
  symbol,
  highPrice,
  lowPrice,
  dailyChange,
  pipsChange,
}: MarketSentimentProps) {
  const { t } = useTranslation();
  const { data: sentimentData, isLoading, error } = useMarketSentiment(symbol);

  const bullish = (sentimentData?.bullishPercent || 0) as number;
  const neutral = (sentimentData?.neutralPercent || 0) as number;
  const bearish = (sentimentData?.bearishPercent || 0) as number;

  const dominantValue = Math.max(bullish, neutral, bearish);
  const currentTrend = sentimentData?.overall || (
    bullish >= neutral && bullish >= bearish ? 'bullish' :
    bearish >= neutral && bearish >= bullish ? 'bearish' : 'neutral');

  const trendConfig = {
    bullish: { icon: TrendingUp, label: t('analysis_bullish'), color: '#22c55e', glow: 'shadow-green-500/20' },
    bearish: { icon: TrendingDown, label: t('analysis_bearish'), color: '#ef4444', glow: 'shadow-red-500/20' },
    neutral: { icon: Minus, label: t('analysis_neutral'), color: '#eab308', glow: 'shadow-yellow-500/20' },
  };
  const trend = trendConfig[currentTrend as keyof typeof trendConfig] || trendConfig.neutral;
  const TrendIcon = trend.icon;

  // Gauge value: 0=full bearish, 50=neutral, 100=full bullish
  const gaugeValue = Math.round(bullish + neutral * 0.5);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
          <span className="ml-2 text-gray-400 text-sm">{t('analysis_loading_sentiment')}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <AnalysisError title={t('analysis_market_sentiment')} error={error as Error} compact />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 relative overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-cyan-400" />
        <h3 className="text-white font-semibold text-base">{t('analysis_market_sentiment')}</h3>
        <div
          className={cn("ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shadow-lg", trend.glow)}
          style={{ borderColor: trend.color + '40', backgroundColor: trend.color + '15', color: trend.color }}
        >
          <TrendIcon className="w-3.5 h-3.5" />
          {trend.label}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Gauge + sentiment bars */}
        <div className="lg:col-span-5 flex flex-col items-center gap-3">
          <SentimentGauge value={gaugeValue} size={140} />

          <div className="w-full space-y-2 px-1">
            <MiniBar label={t('analysis_bullish')} value={bullish} color="#22c55e" icon={TrendingUp} />
            <MiniBar label={t('analysis_neutral')} value={neutral} color="#eab308" icon={Minus} />
            <MiniBar label={t('analysis_bearish')} value={bearish} color="#ef4444" icon={TrendingDown} />
          </div>
        </div>

        {/* Right: Price stats + indicators */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          {/* Price stats grid */}
          <div className="grid grid-cols-4 gap-2">
            <PriceStatCard label={t('analysis_high')} value={highPrice.toFixed(4)} color="text-green-400" />
            <PriceStatCard label={t('analysis_low')} value={lowPrice.toFixed(4)} color="text-red-400" />
            <PriceStatCard
              label={t('analysis_change')}
              value={`${dailyChange >= 0 ? '+' : ''}${dailyChange.toFixed(2)}%`}
              color={dailyChange >= 0 ? 'text-green-400' : 'text-red-400'}
            />
            <PriceStatCard
              label={t('analysis_pips')}
              value={`${pipsChange >= 0 ? '+' : ''}${(pipsChange * 10000).toFixed(0)}`}
              color={pipsChange >= 0 ? 'text-green-400' : 'text-red-400'}
            />
          </div>

          {/* Technical indicators */}
          {sentimentData?.indicators && sentimentData.indicators.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <BarChart3 className="w-3.5 h-3.5 text-cyan-400/60" />
                <span className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Indicadores</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sentimentData.indicators.slice(0, 6).map((indicator, i) => (
                  <IndicatorChip key={i} name={indicator.name} signal={indicator.signal} t={t} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
