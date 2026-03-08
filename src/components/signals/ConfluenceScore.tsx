import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SignalMarketData } from '@/hooks/useSignalMarketData';
import { useTranslation } from '@/i18n/LanguageContext';

interface ConfluenceScoreProps {
  data: SignalMarketData;
}

interface IndicatorVote {
  name: string;
  signal: 'buy' | 'sell' | 'neutral';
  weight: number;
}

export function ConfluenceScore({ data }: ConfluenceScoreProps) {
  const { votes, score, level, buyCount, sellCount, neutralCount } = useMemo(() => {
    const votes: IndicatorVote[] = [];

    // RSI
    if (data.rsi14 !== null) {
      votes.push({
        name: 'RSI',
        signal: data.rsi14 < 30 ? 'buy' : data.rsi14 > 70 ? 'sell' : 'neutral',
        weight: 1,
      });
    }

    // MACD
    if (data.macdHistogram !== null) {
      votes.push({
        name: 'MACD',
        signal: data.macdHistogram > 0 ? 'buy' : data.macdHistogram < 0 ? 'sell' : 'neutral',
        weight: 1.2,
      });
    }

    // Stochastic
    if (data.stochK !== null) {
      votes.push({
        name: 'Stoch',
        signal: data.stochK < 20 ? 'buy' : data.stochK > 80 ? 'sell' : 'neutral',
        weight: 0.9,
      });
    }

    // ADX + trend
    if (data.adx14 !== null && data.adx14 > 20) {
      const trending = data.momentum?.includes('bullish') ? 'buy' : data.momentum?.includes('bearish') ? 'sell' : 'neutral';
      votes.push({ name: 'ADX', signal: trending, weight: 1.1 });
    }

    // SMA signal
    if (data.smaSignal) {
      votes.push({
        name: 'SMA',
        signal: data.smaSignal === 'bullish' ? 'buy' : data.smaSignal === 'bearish' ? 'sell' : 'neutral',
        weight: 1,
      });
    }

    // EMA signal
    if (data.emaSignal) {
      votes.push({
        name: 'EMA',
        signal: data.emaSignal === 'bullish' ? 'buy' : data.emaSignal === 'bearish' ? 'sell' : 'neutral',
        weight: 1,
      });
    }

    // Bollinger
    if (data.bollingerUpper !== null && data.bollingerLower !== null && data.price !== null) {
      const pB = (data.price - data.bollingerLower) / (data.bollingerUpper - data.bollingerLower);
      votes.push({
        name: 'BB',
        signal: pB < 0.2 ? 'buy' : pB > 0.8 ? 'sell' : 'neutral',
        weight: 0.8,
      });
    }

    // Williams %R
    if (data.williamsR !== null) {
      votes.push({
        name: 'W%R',
        signal: data.williamsR < -80 ? 'buy' : data.williamsR > -20 ? 'sell' : 'neutral',
        weight: 0.7,
      });
    }

    // Sentiment
    if (data.newsSentiment !== null) {
      votes.push({
        name: 'Sent',
        signal: data.newsSentiment > 0.15 ? 'buy' : data.newsSentiment < -0.15 ? 'sell' : 'neutral',
        weight: 0.6,
      });
    }

    // Calculate weighted score (-100 to +100)
    let totalWeight = 0;
    let weightedSum = 0;
    const buyCount = votes.filter(v => v.signal === 'buy').length;
    const sellCount = votes.filter(v => v.signal === 'sell').length;
    const neutralCount = votes.filter(v => v.signal === 'neutral').length;

    for (const v of votes) {
      totalWeight += v.weight;
      weightedSum += (v.signal === 'buy' ? 100 : v.signal === 'sell' ? -100 : 0) * v.weight;
    }

    const score = totalWeight > 0 ? weightedSum / totalWeight : 0;

    type Level = 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
    const level: Level = score > 50 ? 'strong_buy' : score > 20 ? 'buy' : score < -50 ? 'strong_sell' : score < -20 ? 'sell' : 'neutral';

    return { votes, score, level, buyCount, sellCount, neutralCount };
  }, [data]);

  // Traffic light colors
  const lightConfig = {
    strong_buy:  { color: 'hsl(135, 70%, 50%)', glow: 'hsl(135, 70%, 50%)', label: 'Compra Fuerte', icon: TrendingUp },
    buy:         { color: 'hsl(135, 60%, 45%)', glow: 'hsl(135, 60%, 45%)', label: 'Compra', icon: TrendingUp },
    neutral:     { color: 'hsl(45, 80%, 55%)',  glow: 'hsl(45, 80%, 55%)',  label: 'Neutral', icon: Minus },
    sell:        { color: 'hsl(0, 70%, 55%)',   glow: 'hsl(0, 70%, 55%)',   label: 'Venta', icon: TrendingDown },
    strong_sell: { color: 'hsl(0, 80%, 50%)',   glow: 'hsl(0, 80%, 50%)',   label: 'Venta Fuerte', icon: TrendingDown },
  };

  const cfg = lightConfig[level];
  const Icon = cfg.icon;
  const gaugePercent = ((score + 100) / 200) * 100; // 0-100

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-lg p-3 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, hsla(210, 100%, 6%, 0.9) 0%, hsla(205, 80%, 10%, 0.9) 100%)',
        border: '1px solid hsla(200, 60%, 35%, 0.3)',
      }}
    >
      {/* Top glow */}
      <div
        className="absolute top-0 left-[10%] right-[10%] h-[1px]"
        style={{ background: `radial-gradient(ellipse at center, ${cfg.color} 0%, transparent 70%)` }}
      />

      <div className="flex items-center gap-3">
        {/* Traffic Light */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div
            className="w-10 rounded-lg flex flex-col items-center gap-1 py-1.5 px-1"
            style={{ background: 'hsla(0, 0%, 5%, 0.8)', border: '1px solid hsla(0, 0%, 30%, 0.3)' }}
          >
            {(['buy', 'neutral', 'sell'] as const).map((l, i) => {
              const isActive =
                (l === 'buy' && (level === 'buy' || level === 'strong_buy')) ||
                (l === 'neutral' && level === 'neutral') ||
                (l === 'sell' && (level === 'sell' || level === 'strong_sell'));
              const c = l === 'buy' ? 'hsl(135, 70%, 50%)' : l === 'neutral' ? 'hsl(45, 80%, 55%)' : 'hsl(0, 70%, 55%)';
              return (
                <motion.div
                  key={l}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: isActive ? 1 : 0.3 }}
                  transition={{ delay: 0.3 + i * 0.12, duration: 0.4, type: 'spring', stiffness: 300, damping: 20 }}
                  className="w-6 h-6 rounded-full"
                  style={{
                    background: isActive ? c : 'hsla(0, 0%, 20%, 0.5)',
                    boxShadow: isActive ? `0 0 12px ${c}, 0 0 4px ${c}` : 'none',
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Score + Label */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Icon className="w-4 h-4" style={{ color: cfg.color }} />
            <span className="text-sm font-bold" style={{ color: cfg.color }}>
              {cfg.label}
            </span>
            <span
              className="text-lg font-bold font-mono tabular-nums ml-auto"
              style={{ color: cfg.color }}
            >
              {score > 0 ? '+' : ''}{score.toFixed(0)}
            </span>
          </div>

          {/* Gauge bar */}
          <div className="h-1.5 rounded-full overflow-hidden relative" style={{ background: 'hsla(0, 0%, 20%, 0.5)' }}>
            <div
              className="absolute inset-y-0 rounded-full transition-all duration-700 ease-out"
              style={{
                background: `linear-gradient(90deg, hsl(0, 70%, 55%), hsl(45, 80%, 55%) 50%, hsl(135, 70%, 50%))`,
                width: `${gaugePercent}%`,
              }}
            />
            {/* Needle */}
            <div
              className="absolute top-0 w-0.5 h-full bg-white rounded-full shadow transition-all duration-700 ease-out"
              style={{ left: `${gaugePercent}%`, transform: 'translateX(-50%)' }}
            />
          </div>

          {/* Vote distribution */}
          <div className="flex items-center gap-3 mt-1.5">
            {[
              { label: 'Compra', count: buyCount, color: 'hsl(135, 70%, 50%)' },
              { label: 'Neutral', count: neutralCount, color: 'hsl(45, 80%, 55%)' },
              { label: 'Venta', count: sellCount, color: 'hsl(0, 70%, 55%)' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1">
                <div
                  className="w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ background: item.color }}
                >
                  {item.count}
                </div>
                <span className="text-[9px]" style={{ color: item.color }}>{item.label}</span>
              </div>
            ))}
            <span className="text-[9px] text-slate-600 ml-auto">{votes.length} indicadores</span>
          </div>
        </div>
      </div>

      {/* Indicator pills */}
      <div className="flex flex-wrap gap-1 mt-2">
        {votes.map((v, i) => (
          <motion.span
            key={v.name}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.05, duration: 0.3 }}
            className={cn(
              'px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border',
              v.signal === 'buy' && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
              v.signal === 'sell' && 'bg-rose-500/10 text-rose-400 border-rose-500/20',
              v.signal === 'neutral' && 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
            )}
          >
            {v.name}
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
}
