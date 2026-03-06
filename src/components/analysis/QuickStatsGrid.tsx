import { TrendingUp, TrendingDown, ArrowUpDown, BarChart3, Target, Shield } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';

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
  const displayPrice = realtimePrice ?? currentPrice;
  const isPositive = change >= 0;
  const range = high - low;
  const rangePips = Math.round(range * 10000);
  const midpoint = (high + low) / 2;
  const bias = displayPrice > midpoint ? 'Alcista' : displayPrice < midpoint ? 'Bajista' : 'Neutral';
  const biasColor = bias === 'Alcista' ? 'text-green-400' : bias === 'Bajista' ? 'text-red-400' : 'text-gray-400';

  const stats = [
    {
      label: 'Cambio',
      value: `${isPositive ? '+' : ''}${changePercent.toFixed(2)}%`,
      subValue: `${isPositive ? '+' : ''}${(pips).toFixed(1)}p`,
      icon: isPositive ? TrendingUp : TrendingDown,
      color: isPositive ? 'text-green-400' : 'text-red-400',
      bgColor: isPositive ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20',
    },
    {
      label: 'High / Low',
      value: high.toFixed(4),
      subValue: low.toFixed(4),
      icon: ArrowUpDown,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10 border-cyan-500/20',
      dualLine: true,
    },
    {
      label: 'Resistencia',
      value: resistance.toFixed(4),
      subValue: `${((resistance - displayPrice) * 10000).toFixed(0)}p`,
      icon: Target,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10 border-red-500/20',
    },
    {
      label: 'Soporte',
      value: support.toFixed(4),
      subValue: `${((displayPrice - support) * 10000).toFixed(0)}p`,
      icon: Shield,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10 border-green-500/20',
    },
    {
      label: 'Rango diario',
      value: `${rangePips}p`,
      subValue: `Vol ${rangePips > 80 ? 'Alto' : rangePips > 40 ? 'Medio' : 'Bajo'}`,
      icon: BarChart3,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      label: 'Sesgo',
      value: bias,
      subValue: `Pos: ${((displayPrice - low) / (range || 1) * 100).toFixed(0)}%`,
      icon: isPositive ? TrendingUp : TrendingDown,
      color: biasColor,
      bgColor: bias === 'Alcista' ? 'bg-green-500/10 border-green-500/20' : bias === 'Bajista' ? 'bg-red-500/10 border-red-500/20' : 'bg-gray-500/10 border-gray-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={cn(
            "p-2 rounded-lg border transition-all hover:scale-[1.02]",
            stat.bgColor
          )}
        >
          <div className="flex items-center gap-1 mb-1">
            <stat.icon className={cn("w-3 h-3", stat.color)} />
            <span className="text-[9px] text-gray-500 uppercase tracking-wider truncate">{stat.label}</span>
          </div>
          <div className={cn("text-xs font-bold font-mono tabular-nums", stat.color)}>
            {stat.value}
          </div>
          {stat.dualLine ? (
            <div className="text-[9px] font-mono text-red-400 tabular-nums">{stat.subValue}</div>
          ) : (
            <div className="text-[9px] text-gray-500 tabular-nums">{stat.subValue}</div>
          )}
        </div>
      ))}
    </div>
  );
}
