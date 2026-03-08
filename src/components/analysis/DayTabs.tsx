import { useState } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { ChevronDown, Calendar, Brain, RefreshCw } from 'lucide-react';
import { useTranslation } from '@/i18n/LanguageContext';
import { useDateLocale } from '@/hooks/useDateLocale';

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
    <div className="relative flex items-center justify-between w-full bg-gradient-to-r from-slate-900/90 via-slate-800/70 to-slate-900/90 border-y border-cyan-900/20 py-1.5 px-3">

      {/* Date pill - centered */}
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 px-4 py-1.5 text-[11px] rounded-full bg-gradient-to-r from-cyan-950/40 to-slate-800/60 border border-cyan-800/30 shadow-[0_0_8px_-2px_rgba(6,182,212,0.15)] hover:border-cyan-700/40 transition-all duration-200 active:scale-[0.97]">
        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/15">
          <Calendar className="w-3 h-3 text-cyan-400" />
        </div>
        <span className="capitalize text-white/90 font-semibold tracking-wide">{selectedLabel}</span>
        <ChevronDown className={cn(
          'w-3 h-3 text-cyan-400/60 transition-transform duration-300',
          open && 'rotate-180 text-cyan-400'
        )} />
      </button>

      {/* Right action buttons */}
      <div className="flex items-center gap-1.5">
        {onAICenter && (
          <button
            onClick={onAICenter}
            className="flex items-center justify-center gap-1.5 px-3 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/30 active:scale-90 transition-all duration-200 shadow-[0_0_8px_-3px_rgba(168,85,247,0.2)]"
            title="Central AI">
            <Brain className="w-4 h-4 text-purple-400" />
            <span className="text-[10px] font-semibold text-purple-300 tracking-wide">Central AI</span>
          </button>
        )}

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 hover:border-cyan-500/30 active:scale-90 transition-all duration-200 shadow-[0_0_8px_-3px_rgba(6,182,212,0.2)] disabled:opacity-50"
            title="Refrescar">
            <RefreshCw className={cn('w-4 h-4 text-cyan-400', isLoading && 'animate-spin')} />
          </button>
        )}
      </div>

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