import { cn } from '@/lib/utils';
import { format, addDays, subDays, isToday, isTomorrow, isYesterday } from 'date-fns';
import { useDateLocale } from '@/hooks/useDateLocale';
import { RefreshCw, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/LanguageContext';

interface DateTabsProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

export function DateTabs({ 
  selectedDate, 
  onDateChange, 
  onRefresh,
  isRefreshing = false,
  className 
}: DateTabsProps) {
  const { language } = useTranslation();
  const dateLocale = useDateLocale();
  
  // Generate days: yesterday, today, tomorrow + 4 more days back
  const days = [
    { date: subDays(new Date(), 3), label: format(subDays(new Date(), 3), 'EEE d', { locale: dateLocale }) },
    { date: subDays(new Date(), 2), label: format(subDays(new Date(), 2), 'EEE d', { locale: dateLocale }) },
    { date: subDays(new Date(), 1), label: language === 'es' ? 'Ayer' : 'Yesterday' },
    { date: new Date(), label: language === 'es' ? 'Hoy' : 'Today' },
    { date: addDays(new Date(), 1), label: language === 'es' ? 'Mañana' : 'Tomorrow' },
  ];
  
  const isSelected = (date: Date) => {
    return format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
  };

  const getTabTheme = (date: Date) => {
    if (isToday(date)) return { bg: 'bg-blue-600', text: 'text-white', shadow: 'shadow-blue-500/30', dot: true };
    if (isYesterday(date)) return { bg: 'bg-violet-600', text: 'text-white', shadow: 'shadow-violet-500/30', dot: false };
    if (isTomorrow(date)) return { bg: 'bg-amber-600', text: 'text-white', shadow: 'shadow-amber-500/30', dot: false };
    return { bg: 'bg-slate-600', text: 'text-white', shadow: 'shadow-slate-500/30', dot: false };
  };
  
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        {/* Day Tabs */}
        <div className="flex-1 flex overflow-x-auto gap-1 py-1 px-1 scrollbar-hide">
          {days.map((day) => {
            const selected = isSelected(day.date);
            const theme = getTabTheme(day.date);
            
            return (
              <button
                key={day.date.toISOString()}
                onClick={() => onDateChange(day.date)}
                className={cn(
                  'px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all active:scale-95',
                  selected
                    ? `${theme.bg} ${theme.text} shadow-lg ${theme.shadow}`
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                )}
              >
                <div className="flex items-center gap-1.5">
                  {theme.dot && selected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                  <span className="capitalize">{day.label}</span>
                </div>
              </button>
            );
          })}
        </div>
        
        {/* Refresh */}
        {onRefresh && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-8 w-8 flex-shrink-0"
          >
            <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
          </Button>
        )}
      </div>
    </div>
  );
}
