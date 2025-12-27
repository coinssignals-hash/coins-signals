import { Currency, CURRENCIES } from '@/types/news';
import { cn } from '@/lib/utils';

interface CurrencyBadgeProps {
  currency: Currency;
  showName?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'text-xs px-1.5 py-0.5 gap-1',
  md: 'text-sm px-2 py-1 gap-1.5',
  lg: 'text-base px-3 py-1.5 gap-2',
};

const flagSizes = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export function CurrencyBadge({ 
  currency, 
  showName = false, 
  size = 'md',
  className 
}: CurrencyBadgeProps) {
  const info = CURRENCIES[currency];
  
  return (
    <span 
      className={cn(
        'inline-flex items-center rounded-md font-medium bg-secondary text-secondary-foreground',
        sizeClasses[size],
        className
      )}
    >
      <span className={flagSizes[size]}>{info.flag}</span>
      <span className="font-mono">{info.code}</span>
      {showName && <span className="text-muted-foreground">({info.name})</span>}
    </span>
  );
}

interface CurrencyBadgeListProps {
  currencies: Currency[];
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function CurrencyBadgeList({ 
  currencies, 
  maxVisible = 4,
  size = 'sm',
  className 
}: CurrencyBadgeListProps) {
  const visible = currencies.slice(0, maxVisible);
  const remaining = currencies.length - maxVisible;
  
  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {visible.map(currency => (
        <CurrencyBadge key={currency} currency={currency} size={size} />
      ))}
      {remaining > 0 && (
        <span className={cn(
          'inline-flex items-center rounded-md bg-muted text-muted-foreground font-medium',
          sizeClasses[size]
        )}>
          +{remaining}
        </span>
      )}
    </div>
  );
}
