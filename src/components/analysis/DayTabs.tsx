import { format, startOfWeek, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DayTabsProps {
  selectedDay: Date;
  onSelectDay: (day: Date) => void;
}

export function DayTabs({ selectedDay, onSelectDay }: DayTabsProps) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday

  const days = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="flex w-full bg-[#0a1a0a] border-y border-green-900/50">
      {days.map((day) => {
        const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDay, 'yyyy-MM-dd');
        const dayName = format(day, 'EEEE', { locale: es });
        const dayNumber = format(day, 'dd');

        return;













      })}
    </div>);

}