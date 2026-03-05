import { useState } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ChevronDown, Calendar, Brain, RefreshCw } from 'lucide-react';

interface DayTabsProps {
  selectedDay: Date;
  onSelectDay: (day: Date) => void;
  onAICenter?: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function DayTabs({ selectedDay, onSelectDay, onAICenter, onRefresh, isLoading }: DayTabsProps) {
  const [open, setOpen] = useState(false);
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const days = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

  const selectedLabel = format(selectedDay, "EEE dd MMM", { locale: es });

  return (
    <div className="relative flex items-center justify-center gap-2 w-full bg-slate-900/80 border-y border-slate-700/50 py-1 px-3">
      {/* Date pill */}
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] rounded-full bg-slate-800/60 border border-slate-700/40">
        <Calendar className="w-3 h-3 text-cyan-400" />
        <span className="capitalize text-white/90 font-medium">{selectedLabel}</span>
        <ChevronDown className={cn(
          'w-3 h-3 text-slate-400 transition-transform duration-200',
          open && 'rotate-180'
        )} />
      </button>

      {/* AI Center */}
      {onAICenter && (
        <button onClick={onAICenter} className="p-1.5 rounded-full bg-slate-800/60 border border-slate-700/40 active:scale-95 transition-transform" title="Centro IA">
          <Brain className="w-3.5 h-3.5 text-purple-400" />
        </button>
      )}

      {/* Refresh */}
      {onRefresh && (
        <button onClick={onRefresh} disabled={isLoading} className="p-1.5 rounded-full bg-slate-800/60 border border-slate-700/40 active:scale-95 transition-transform" title="Refrescar">
          <RefreshCw className={cn('w-3.5 h-3.5 text-cyan-400', isLoading && 'animate-spin')} />
        </button>
      )}

      {open && (
        <div className="absolute z-50 left-0 right-0 top-full bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 shadow-lg">
          {days.map((day) => {
            const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDay, 'yyyy-MM-dd');
            const isToday = format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
            const dayName = format(day, 'EEEE', { locale: es });
            const dayNumber = format(day, 'dd');
            return (
              <button
                key={format(day, 'yyyy-MM-dd')}
                onClick={() => { onSelectDay(day); setOpen(false); }}
                className={cn(
                  'flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors',
                  isSelected ? 'bg-cyan-500/15 text-cyan-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                )}>
                <span className="w-7 text-center font-bold">{dayNumber}</span>
                <span className="capitalize">{dayName}</span>
                {isToday && <span className="ml-auto text-[10px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded">Hoy</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}