import { TrendingUp, TrendingDown, Minus, Loader2, Activity, BarChart3, Shield, Zap, Eye } from 'lucide-react';
import { useMarketSentiment } from '@/hooks/useAnalysisData';
import { AnalysisError } from './AnalysisError';
import { useTranslation } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface MarketSentimentProps {
  symbol: string;
  highPrice: number;
  lowPrice: number;
  dailyChange: number;
  pipsChange: number;
  realtimePrice?: number;
  isRealtimeConnected?: boolean;
}

/* ─── Professional Radial Gauge ─── */
function ProGauge({ value, size = 160 }: { value: number; size?: number }) {
  const r = (size - 24) / 2;
  const cx = size / 2;
  const cy = size / 2 + 8;
  const startA = -220;
  const endA = 40;
  const totalA = endA - startA;
  const valA = startA + (value / 100) * totalA;

  const ptc = (a: number, rad: number) => {
    const rn = (a * Math.PI) / 180;
    return { x: cx + rad * Math.cos(rn), y: cy + rad * Math.sin(rn) };
  };
  const arc = (s: number, e: number, rad: number) => {
    const sp = ptc(s, rad);
    const ep = ptc(e, rad);
    return `M ${sp.x} ${sp.y} A ${rad} ${rad} 0 ${e - s > 180 ? 1 : 0} 1 ${ep.x} ${ep.y}`;
  };

  const needle = ptc(valA, r - 14);
  const label = value >= 65 ? t('analysis_sent_bullish_label') : value >= 45 ? t('analysis_sent_neutral_label') : t('analysis_sent_bearish_label');
  const color = value >= 65 ? '#22c55e' : value >= 45 ? '#f59e0b' : '#ef4444';
  const { t } = useTranslation();

  // Tick marks
  const ticks = Array.from({ length: 11 }, (_, i) => {
    const a = startA + (i / 10) * totalA;
    const inner = ptc(a, r - 6);
    const outer = ptc(a, r + 2);
    return { x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y, major: i % 5 === 0 };
  });

  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size * 0.68} viewBox={`0 0 ${size} ${size * 0.68}`}>
        <defs>
          <linearGradient id="proGaugeGrad" x1="0%" y1="0%" x2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="35%" stopColor="#f97316" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="65%" stopColor="#84cc16" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
          <filter id="proGlow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="needleShadow">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={color} floodOpacity="0.6" />
          </filter>
        </defs>

        {/* Outer ring glow */}
        <path d={arc(startA, endA, r)} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="14" strokeLinecap="round" />
        {/* Track */}
        <path d={arc(startA, endA, r)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" strokeLinecap="round" />
        {/* Active arc */}
        <path d={arc(startA, valA, r)} fill="none" stroke="url(#proGaugeGrad)" strokeWidth="8" strokeLinecap="round" filter="url(#proGlow)" />

        {/* Ticks */}
        {ticks.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke={t.major ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'} strokeWidth={t.major ? 1.5 : 0.8} />
        ))}

        {/* Needle */}
        <line x1={cx} y1={cy} x2={needle.x} y2={needle.y} stroke={color} strokeWidth="2" strokeLinecap="round" filter="url(#needleShadow)" />
        {/* Center hub */}
        <circle cx={cx} cy={cy} r="6" fill="#0a1628" stroke={color} strokeWidth="2" />
        <circle cx={cx} cy={cy} r="2.5" fill={color} />

        {/* Labels */}
        <text x={ptc(startA, r + 14).x + 4} y={ptc(startA, r + 14).y} fill="#ef4444" fontSize="7" fontFamily="monospace" fontWeight="600">0</text>
        <text x={cx} y={ptc(startA + totalA / 2, r + 14).y - 2} textAnchor="middle" fill="#f59e0b" fontSize="7" fontFamily="monospace" fontWeight="600">50</text>
        <text x={ptc(endA, r + 14).x - 12} y={ptc(endA, r + 14).y} fill="#22c55e" fontSize="7" fontFamily="monospace" fontWeight="600">100</text>
      </svg>

      {/* Center value */}
      <div className="absolute bottom-0 flex flex-col items-center">
        <span className="text-2xl font-black font-mono tabular-nums" style={{ color, textShadow: `0 0 20px ${color}40` }}>
          {value}
        </span>
        <span className="text-[9px] font-bold tracking-[0.2em] uppercase mt-0.5" style={{ color: color + 'aa' }}>
          {label}
        </span>
      </div>
    </div>
  );
}

/* ─── Sentiment Distribution Bar ─── */
function SentimentDistBar({ bullish, neutral, bearish }: { bullish: number; neutral: number; bearish: number }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2.5">
      {[
        { label: t('analysis_ind_bullish'), value: bullish, color: '#22c55e', icon: TrendingUp },
        { label: t('analysis_ind_neutral'), value: neutral, color: '#f59e0b', icon: Minus },
        { label: t('analysis_ind_bearish'), value: bearish, color: '#ef4444', icon: TrendingDown },
      ].map((item) => (
        <div key={item.label} className="group">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <item.icon className="w-3 h-3" style={{ color: item.color }} />
              <span className="text-[11px] font-medium text-gray-400">{item.label}</span>
            </div>
            <span className="text-xs font-bold font-mono tabular-nums" style={{ color: item.color }}>
              {item.value.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden relative backdrop-blur-sm">
            <motion.div
              className="h-full rounded-full relative"
              style={{ backgroundColor: item.color + 'cc' }}
              initial={{ width: 0 }}
              animate={{ width: `${item.value}%` }}
              transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 rounded-full" />
            </motion.div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Technical Signal Chip ─── */
function SignalChip({ name, signal, t }: { name: string; signal: string; t: (k: string) => string }) {
  const cfg = {
    buy: { bg: 'bg-green-500/8', border: 'border-green-500/20', text: 'text-green-400', glow: 'shadow-[0_0_8px_rgba(34,197,94,0.15)]', icon: TrendingUp, labelKey: 'analysis_sent_buy' },
    sell: { bg: 'bg-red-500/8', border: 'border-red-500/20', text: 'text-red-400', glow: 'shadow-[0_0_8px_rgba(239,68,68,0.15)]', icon: TrendingDown, labelKey: 'analysis_sent_sell' },
    neutral: { bg: 'bg-white/[0.03]', border: 'border-white/[0.08]', text: 'text-gray-400', glow: '', icon: Minus, labelKey: 'analysis_sent_neutral' },
  };
  const c = cfg[signal as keyof typeof cfg] || cfg.neutral;
  const Icon = c.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn("flex items-center gap-2 px-2.5 py-2 rounded-lg border backdrop-blur-sm", c.bg, c.border, c.glow)}
    >
      <div className={cn("w-5 h-5 rounded flex items-center justify-center", c.bg)}>
        <Icon className={cn("w-3 h-3", c.text)} />
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-[9px] text-gray-500 uppercase tracking-wider font-medium">{name}</span>
        <span className={cn("text-[11px] font-bold", c.text)}>{c.label}</span>
      </div>
    </motion.div>
  );
}

/* ─── Price Metric Card ─── */
function MetricCard({ label, value, color, icon: Icon }: { label: string; value: string; color?: string; icon?: React.ElementType }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2.5 relative overflow-hidden group hover:border-white/[0.12] transition-colors">
      <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-white/[0.02] to-transparent rounded-bl-lg" />
      <div className="flex items-center gap-1 mb-1">
        {Icon && <Icon className="w-3 h-3 text-gray-600" />}
        <span className="text-[9px] text-gray-500 uppercase tracking-[0.1em] font-medium">{label}</span>
      </div>
      <div className={cn("text-sm font-bold font-mono tabular-nums", color || "text-white")}>{value}</div>
    </div>
  );
}

/* ─── Main Component ─── */
export function MarketSentiment({
  symbol, highPrice, lowPrice, dailyChange, pipsChange,
}: MarketSentimentProps) {
  const { t } = useTranslation();
  const { data: sentimentData, isLoading, error } = useMarketSentiment(symbol);
  const [expanded, setExpanded] = useState(true);

  const bullish = (sentimentData?.bullishPercent || 0) as number;
  const neutral = (sentimentData?.neutralPercent || 0) as number;
  const bearish = (sentimentData?.bearishPercent || 0) as number;

  const currentTrend = sentimentData?.overall || (
    bullish >= neutral && bullish >= bearish ? 'bullish' :
    bearish >= neutral && bearish >= bullish ? 'bearish' : 'neutral');

  const trendCfg = {
    bullish: { icon: TrendingUp, label: 'ALCISTA', color: '#22c55e' },
    bearish: { icon: TrendingDown, label: 'BAJISTA', color: '#ef4444' },
    neutral: { icon: Minus, label: 'NEUTRAL', color: '#f59e0b' },
  };
  const trend = trendCfg[currentTrend as keyof typeof trendCfg] || trendCfg.neutral;
  const TrendIcon = trend.icon;
  const gaugeValue = Math.round(bullish + neutral * 0.5);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12 gap-3">
          <div className="relative">
            <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
            <div className="absolute inset-0 w-5 h-5 rounded-full bg-cyan-400/20 animate-ping" />
          </div>
          <span className="text-gray-400 text-sm font-medium">{t('analysis_loading_sentiment')}</span>
        </div>
      </div>
    );
  }

  if (error) return <AnalysisError title={t('analysis_market_sentiment')} error={error as Error} compact />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-2.5 p-4 pb-3 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <Activity className="w-4 h-4 text-purple-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-semibold text-sm">{t('analysis_market_sentiment')}</h3>
          <span className="text-[10px] text-gray-500 font-mono">{symbol} · Multi-source</span>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border"
          style={{ borderColor: trend.color + '30', backgroundColor: trend.color + '10', color: trend.color,
            boxShadow: `0 0 16px ${trend.color}15` }}
        >
          <TrendIcon className="w-3.5 h-3.5" />
          {trend.label}
        </div>
        <Eye className={cn("w-4 h-4 transition-colors", expanded ? "text-gray-400" : "text-gray-600")} />
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {/* Gauge + Distribution */}
              <div className="grid grid-cols-12 gap-4 items-start">
                <div className="col-span-5 flex justify-center">
                  <ProGauge value={gaugeValue} size={150} />
                </div>
                <div className="col-span-7 space-y-3">
                  <SentimentDistBar bullish={bullish} neutral={neutral} bearish={bearish} />

                  {/* Source badges */}
                  <div className="flex flex-wrap gap-1">
                    {['Finnhub', 'AlphaV', 'FMP', 'MarketAux'].map(src => (
                      <span key={src} className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/[0.06] text-gray-600 uppercase tracking-wider">
                        {src}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Price Stats Row */}
              <div className="grid grid-cols-4 gap-2">
                <MetricCard label="Máximo" value={highPrice.toFixed(4)} color="text-green-400" icon={TrendingUp} />
                <MetricCard label="Mínimo" value={lowPrice.toFixed(4)} color="text-red-400" icon={TrendingDown} />
                <MetricCard
                  label="Cambio"
                  value={`${dailyChange >= 0 ? '+' : ''}${dailyChange.toFixed(2)}%`}
                  color={dailyChange >= 0 ? 'text-green-400' : 'text-red-400'}
                  icon={Zap}
                />
                <MetricCard
                  label="Pips"
                  value={`${pipsChange >= 0 ? '+' : ''}${(pipsChange * 10000).toFixed(0)}`}
                  color={pipsChange >= 0 ? 'text-green-400' : 'text-red-400'}
                  icon={BarChart3}
                />
              </div>

              {/* Technical Indicators Grid */}
              {sentimentData?.indicators && sentimentData.indicators.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Shield className="w-3.5 h-3.5 text-purple-400/60" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-[0.15em] font-semibold">Señales Técnicas</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-purple-500/20 to-transparent ml-2" />
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {sentimentData.indicators.slice(0, 6).map((indicator, i) => (
                      <SignalChip key={i} name={indicator.name} signal={indicator.signal} t={t} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
