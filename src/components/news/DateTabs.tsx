import { useState } from 'react';
import { cn } from '@/lib/utils';
import { format, addDays, subDays, isToday, isTomorrow, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const days = Array.from({ length: 5 }, (_, i) => addDays(new Date(), -2 + i));
  
  const formatDayLabel = (date: Date) => {
    if (isToday(date)) return 'Hoy';
    if (isYesterday(date)) return 'Ayer';
    if (isTomorrow(date)) return 'Mañana';
    return format(date, 'EEEE', { locale: es });
  };
  
  const formatDayNumber = (date: Date) => {
    return format(date, 'dd', { locale: es });
  };
  
  const isSelected = (date: Date) => {
    return format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
  };
  
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onDateChange(subDays(selectedDate, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div className="flex gap-1 bg-secondary/50 p-1 rounded-lg">
            {days.map((day) => (
              <button
                key={day.toISOString()}
                onClick={() => onDateChange(day)}
                className={cn(
                  'flex flex-col items-center px-3 py-2 rounded-md transition-all duration-200',
                  'text-sm font-medium min-w-[60px]',
                  isSelected(day)
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                <span className="text-[10px] uppercase tracking-wider opacity-80">
                  {formatDayLabel(day)}
                </span>
                <span className="text-lg font-bold font-mono">
                  {formatDayNumber(day)}
                </span>
              </button>
            ))}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onDateChange(addDays(selectedDate, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>
        )}
      </div>
    </div>
  );
}
