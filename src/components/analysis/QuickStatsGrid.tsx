import { TrendingUp, TrendingDown, ArrowUpDown, BarChart3, Target, Shield } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { useTranslation } from '@/i18n/LanguageContext';

interface QuickStatsGridProps {
  symbol?: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  resistance: number;
  support: number;
  pips: number;
  realtimePrice?: number;
}

export function QuickStatsGrid({
  symbol,
  currentPrice,
  change,
  changePercent,
  high,
  low,
  resistance,
  support,
  pips,
  realtimePrice,
}: QuickStatsGridProps) {
  const { t } = useTranslation();
  const displayPrice = realtimePrice ?? currentPrice;
  const isPositive = change >= 0;
  const range = high - low;
  const rangePips = Math.round(range * 10000);
  const midpoint = (high + low) / 2;
  const biasKey = displayPrice > midpoint ? 'analysis_ind_bullish' : displayPrice < midpoint ? 'analysis_ind_bearish' : 'analysis_ind_neutral';
  const bias = t(biasKey);
  const biasColor = biasKey === 'analysis_ind_bullish' ? 'text-green-400' : biasKey === 'analysis_ind_bearish' ? 'text-red-400' : 'text-gray-400';

  const stats = [
    {
      label: t('analysis_qs_change'),
      value: `${isPositive ? '+' : ''}${changePercent.toFixed(2)}%`,
      subValue: `${isPositive ? '+' : ''}${(pips).toFixed(1)}p`,
      icon: isPositive ? TrendingUp : TrendingDown,
      color: isPositive ? 'text-green-400' : 'text-red-400',
      bgColor: isPositive ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20',
    },
    {
      label: t('analysis_qs_high_low'),
      value: formatPrice(high, symbol),
      subValue: formatPrice(low, symbol),
      icon: ArrowUpDown,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10 border-cyan-500/20',
      dualLine: true,
    },
    {
      label: t('analysis_qs_resistance'),
      value: formatPrice(resistance, symbol),
      subValue: `${((resistance - displayPrice) * 10000).toFixed(1)}p`,
      icon: Target,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10 border-red-500/20',
    },
    {
      label: t('analysis_qs_support'),
      value: formatPrice(support, symbol),
      subValue: `${((displayPrice - support) * 10000).toFixed(2)}p`,
      icon: Shield,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10 border-green-500/20',
    },
    {
      label: t('analysis_qs_daily_range'),
      value: `${rangePips}p`,
      subValue: `Vol ${rangePips > 80 ? t('analysis_qs_vol_high') : rangePips > 40 ? t('analysis_qs_vol_medium') : t('analysis_qs_vol_low')}`,
      icon: BarChart3,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      label: t('analysis_qs_bias'),
      value: bias,
      subValue: `${t('analysis_qs_pos')}: ${((displayPrice - low) / (range || 1) * 100).toFixed(1)}%`,
      icon: isPositive ? TrendingUp : TrendingDown,
      color: biasColor,
      bgColor: biasKey === 'analysis_ind_bullish' ? 'bg-green-500/10 border-green-500/20' : biasKey === 'analysis_ind_bearish' ? 'bg-red-500/10 border-red-500/20' : 'bg-gray-500/10 border-gray-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={cn(
            "p-2 rounded-lg border transition-all duration-700 ease-in-out hover:scale-[1.02]",
            stat.bgColor
          )}
        >
          <div className="flex items-center gap-1 mb-1">
            <stat.icon className={cn("w-3 h-3 transition-colors duration-700", stat.color)} />
            <span className="text-[9px] text-gray-500 uppercase tracking-wider truncate">{stat.label}</span>
          </div>
          <div className={cn("text-xs font-bold font-mono tabular-nums transition-colors duration-700", stat.color)}>
            {stat.value}
          </div>
          {stat.dualLine ? (
            <div className="text-[9px] font-mono text-red-400 tabular-nums transition-colors duration-700">{stat.subValue}</div>
          ) : (
            <div className="text-[9px] text-gray-500 tabular-nums transition-colors duration-700">{stat.subValue}</div>
          )}
        </div>
      ))}
    </div>
  );
}
