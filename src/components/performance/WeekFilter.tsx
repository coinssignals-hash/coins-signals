import { useState } from 'react';
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarIcon, CalendarRange } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface WeekFilterProps {
  selectedWeek: Date;
  onWeekChange: (date: Date) => void;
  dateRange: { from: Date | undefined; to: Date | undefined };
  onDateRangeChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
}

export function WeekFilter({ selectedWeek, onWeekChange, dateRange, onDateRangeChange }: WeekFilterProps) {
  const [isRangeMode, setIsRangeMode] = useState(false);

  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });
  
  const getWeekNumber = (date: Date) => {
    const start = new Date(date.getFullYear(), 0, 1);
    const diff = date.getTime() - start.getTime();
    return Math.ceil((diff / (1000 * 60 * 60 * 24 * 7)) + 1);
  };

  const weekNumber = getWeekNumber(selectedWeek);

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-3">
      <div className="flex items-center justify-between gap-2">
        {/* Week Navigation */}
        <div className="flex items-center gap-1">
          <button 
            onClick={() => onWeekChange(subWeeks(selectedWeek, 1))}
            className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors">
                <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-bold text-primary tabular-nums">S{weekNumber}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={selectedWeek}
                onSelect={(date) => date && onWeekChange(date)}
                disabled={(date) => date > new Date()}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <button 
            onClick={() => {
              const nextWeek = addWeeks(selectedWeek, 1);
              if (nextWeek <= new Date()) onWeekChange(nextWeek);
            }}
            disabled={addWeeks(selectedWeek, 1) > new Date()}
            className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-colors disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Date Range */}
        <div className="text-xs text-muted-foreground tabular-nums">
          {format(weekStart, 'dd MMM', { locale: es })} — {format(weekEnd, 'dd MMM', { locale: es })}
        </div>

        {/* Custom Range */}
        <Popover>
          <PopoverTrigger asChild>
            <button className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              isRangeMode ? 'bg-primary/20 text-primary' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
            }`}>
              <CalendarRange className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className="p-3 border-b border-border">
              <h4 className="font-medium text-sm">Rango personalizado</h4>
            </div>
            <Calendar
              mode="range"
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range) => {
                onDateRangeChange({ from: range?.from, to: range?.to });
                if (range?.from && range?.to) setIsRangeMode(true);
              }}
              disabled={(date) => date > new Date()}
              numberOfMonths={1}
              className="p-3 pointer-events-auto"
            />
            {isRangeMode && dateRange.from && dateRange.to && (
              <div className="p-3 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {format(dateRange.from, 'dd/MM')} - {format(dateRange.to, 'dd/MM/yy')}
                </span>
                <Button variant="ghost" size="sm" onClick={() => {
                  setIsRangeMode(false);
                  onDateRangeChange({ from: undefined, to: undefined });
                }}>Limpiar</Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {isRangeMode && dateRange.from && dateRange.to && (
        <div className="mt-2 flex justify-center">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 tabular-nums">
            Rango: {format(dateRange.from, 'dd/MM', { locale: es })} - {format(dateRange.to, 'dd/MM/yy', { locale: es })}
          </span>
        </div>
      )}
    </SignalStyleCard>
  );
}
