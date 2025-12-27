import { EconomicCategory, CATEGORIES } from '@/types/news';
import { cn } from '@/lib/utils';

interface CategoryBadgeProps {
  category: EconomicCategory;
  showIcon?: boolean;
  className?: string;
}

export function CategoryBadge({ category, showIcon = true, className }: CategoryBadgeProps) {
  const info = CATEGORIES[category];
  
  return (
    <span 
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium',
        'bg-primary/10 text-primary border border-primary/20',
        className
      )}
    >
      {showIcon && <span>{info.icon}</span>}
      <span>{info.label}</span>
    </span>
  );
}
