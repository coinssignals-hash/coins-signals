import { Bias, BiasStrength } from '@/types/news';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface BiasBadgeProps {
  bias: Bias;
  strength?: BiasStrength;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const biasConfig = {
  bullish: {
    icon: TrendingUp,
    label: 'Bullish',
    bgClass: 'bg-bullish/10',
    textClass: 'text-bullish',
    borderClass: 'border-bullish/30',
  },
  bearish: {
    icon: TrendingDown,
    label: 'Bearish',
    bgClass: 'bg-bearish/10',
    textClass: 'text-bearish',
    borderClass: 'border-bearish/30',
  },
  neutral: {
    icon: Minus,
    label: 'Neutral',
    bgClass: 'bg-neutral/10',
    textClass: 'text-neutral',
    borderClass: 'border-neutral/30',
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5 gap-1',
  md: 'text-sm px-2.5 py-1 gap-1.5',
  lg: 'text-base px-3 py-1.5 gap-2',
};

const iconSizes = {
  sm: 12,
  md: 14,
  lg: 16,
};

export function BiasBadge({ 
  bias, 
  strength,
  showLabel = true,
  size = 'md',
  className 
}: BiasBadgeProps) {
  const config = biasConfig[bias];
  const Icon = config.icon;
  
  return (
    <span 
      className={cn(
        'inline-flex items-center rounded-md font-semibold border',
        config.bgClass,
        config.textClass,
        config.borderClass,
        sizeClasses[size],
        className
      )}
    >
      <Icon size={iconSizes[size]} />
      {showLabel && (
        <span>
          {strength && <span className="capitalize">{strength} </span>}
          {config.label}
        </span>
      )}
    </span>
  );
}
