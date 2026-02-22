import { format, startOfWeek, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DayTabsProps {
  selectedDay: Date;
  onSelectDay: (day: Date) => void;
}

export function DayTabs({ selectedDay, onSelectDay }: DayTabsProps) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });

  const days = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="flex w-full bg-slate-900/80 border-y border-slate-700/50">
      {days.map((day) => {
        const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDay, 'yyyy-MM-dd');
        const dayName = format(day, 'EEEE', { locale: es });
        const dayNumber = format(day, 'dd');

        return (
          <button
            key={format(day, 'yyyy-MM-dd')}
            onClick={() => onSelectDay(day)}
            className={cn(
              'flex-1 py-2.5 text-center transition-colors',
              isSelected
                ? 'bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            )}
          >
            <div className="text-[10px] capitalize">{dayName}</div>
            <div className="text-sm font-bold">{dayNumber}</div>
          </button>
        );









      })}
    </div>);
}