import { CurrencyImpact, Currency, CURRENCIES } from '@/types/news';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ImpactChartProps {
  impacts: CurrencyImpact[];
  className?: string;
}

export function ImpactChart({ impacts, className }: ImpactChartProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Impacto según la noticia
      </h3>
      <div className="grid gap-3">
        {impacts.map((impact) => (
          <ImpactRow key={impact.currency} impact={impact} />
        ))}
      </div>
    </div>
  );
}

interface ImpactRowProps {
  impact: CurrencyImpact;
}

function ImpactRow({ impact }: ImpactRowProps) {
  const currencyInfo = CURRENCIES[impact.currency];
  const DirectionIcon = impact.expected_direction === 'bullish' 
    ? TrendingUp 
    : impact.expected_direction === 'bearish' 
      ? TrendingDown 
      : Minus;
  
  const directionColor = impact.expected_direction === 'bullish'
    ? 'text-bullish'
    : impact.expected_direction === 'bearish'
      ? 'text-bearish'
      : 'text-neutral';
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{currencyInfo.flag}</span>
          <span className="font-mono font-semibold text-foreground">{impact.currency}</span>
          <DirectionIcon className={cn('w-4 h-4', directionColor)} />
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {Math.round(impact.confidence * 100)}% confidence
        </span>
      </div>
      
      {/* Stacked bar chart */}
      <div className="h-4 rounded-full overflow-hidden flex bg-muted">
        {/* Positive */}
        <div 
          className="h-full bg-bullish transition-all duration-500"
          style={{ width: `${impact.positive_percentage}%` }}
        />
        {/* Neutral */}
        <div 
          className="h-full bg-neutral transition-all duration-500"
          style={{ width: `${impact.neutral_percentage}%` }}
        />
        {/* Negative */}
        <div 
          className="h-full bg-bearish transition-all duration-500"
          style={{ width: `${impact.negative_percentage}%` }}
        />
      </div>
      
      {/* Legend */}
      <div className="flex justify-between text-xs">
        <span className="text-bullish font-mono">{impact.positive_percentage}% ↑</span>
        <span className="text-neutral font-mono">{impact.neutral_percentage}% →</span>
        <span className="text-bearish font-mono">{impact.negative_percentage}% ↓</span>
      </div>
    </div>
  );
}

// Compact version for cards
interface ImpactChartCompactProps {
  impacts: CurrencyImpact[];
  className?: string;
}

export function ImpactChartCompact({ impacts, className }: ImpactChartCompactProps) {
  return (
    <div className={cn('flex gap-2', className)}>
      {impacts.slice(0, 3).map((impact) => {
        const currencyInfo = CURRENCIES[impact.currency];
        const isPositive = impact.positive_percentage > impact.negative_percentage;
        const color = isPositive ? 'bg-bullish' : 'bg-bearish';
        const percentage = isPositive ? impact.positive_percentage : impact.negative_percentage;
        
        return (
          <div key={impact.currency} className="flex items-center gap-1">
            <span className="text-xs">{currencyInfo.flag}</span>
            <div className="w-8 h-1.5 rounded-full bg-muted overflow-hidden">
              <div 
                className={cn('h-full rounded-full', color)}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
