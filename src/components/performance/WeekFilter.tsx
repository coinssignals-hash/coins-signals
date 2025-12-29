import { useState } from 'react';
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  
  // Get week number
  const getWeekNumber = (date: Date) => {
    const start = new Date(date.getFullYear(), 0, 1);
    const diff = date.getTime() - start.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.ceil((diff / oneWeek) + 1);
  };

  const weekNumber = getWeekNumber(selectedWeek);

  const handlePreviousWeek = () => {
    onWeekChange(subWeeks(selectedWeek, 1));
  };

  const handleNextWeek = () => {
    const nextWeek = addWeeks(selectedWeek, 1);
    if (nextWeek <= new Date()) {
      onWeekChange(nextWeek);
    }
  };

  const handleSelectWeek = (date: Date | undefined) => {
    if (date) {
      onWeekChange(date);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between gap-2">
        {/* Week Navigation */}
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handlePreviousWeek}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-[180px] justify-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                <span className="font-bold text-primary">Semana {weekNumber}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={selectedWeek}
                onSelect={handleSelectWeek}
                disabled={(date) => date > new Date()}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleNextWeek}
            disabled={addWeeks(selectedWeek, 1) > new Date()}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Date Range Display */}
        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
          <span>{format(weekStart, 'dd MMM', { locale: es })}</span>
          <span>-</span>
          <span>{format(weekEnd, 'dd MMM yyyy', { locale: es })}</span>
        </div>

        {/* Custom Range Toggle */}
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant={isRangeMode ? "default" : "outline"} 
              size="sm"
              className="gap-2"
            >
              <CalendarIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Rango</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className="p-3 border-b border-border">
              <h4 className="font-medium text-sm">Seleccionar rango de fechas</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Elige un rango personalizado
              </p>
            </div>
            <Calendar
              mode="range"
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range) => {
                onDateRangeChange({ from: range?.from, to: range?.to });
                if (range?.from && range?.to) {
                  setIsRangeMode(true);
                }
              }}
              disabled={(date) => date > new Date()}
              numberOfMonths={1}
              className="p-3 pointer-events-auto"
            />
            {isRangeMode && dateRange.from && dateRange.to && (
              <div className="p-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {format(dateRange.from, 'dd/MM/yyyy')} - {format(dateRange.to, 'dd/MM/yyyy')}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setIsRangeMode(false);
                      onDateRangeChange({ from: undefined, to: undefined });
                    }}
                  >
                    Limpiar
                  </Button>
                </div>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {/* Mobile Date Range */}
      <div className="sm:hidden mt-2 text-center text-xs text-muted-foreground">
        {format(weekStart, 'dd MMM', { locale: es })} - {format(weekEnd, 'dd MMM yyyy', { locale: es })}
      </div>

      {/* Active Range Indicator */}
      {isRangeMode && dateRange.from && dateRange.to && (
        <div className="mt-2 flex items-center justify-center gap-2 text-xs">
          <span className="px-2 py-1 bg-primary/20 text-primary rounded">
            Rango activo: {format(dateRange.from, 'dd/MM', { locale: es })} - {format(dateRange.to, 'dd/MM/yyyy', { locale: es })}
          </span>
        </div>
      )}
    </div>
  );
}
