import { cn } from '@/lib/utils';

interface SignalsDayTabsProps {
  days: { label: string; date: string }[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export function SignalsDayTabs({ days, selectedDate, onSelectDate }: SignalsDayTabsProps) {
  return (
    <div className="flex overflow-x-auto gap-1 py-2 px-2 scrollbar-hide">
      {days.map((day) => (
        <button
          key={day.date}
          onClick={() => onSelectDate(day.date)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
            selectedDate === day.date
              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
              : "text-blue-300/70 hover:text-blue-200 hover:bg-blue-900/30"
          )}
        >
          {day.label}
        </button>
      ))}
    </div>
  );
}
