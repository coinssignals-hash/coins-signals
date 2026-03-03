import { cn } from '@/lib/utils';

interface SignalsDayTabsProps {
  days: { label: string; date: string }[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export function SignalsDayTabs({ days, selectedDate, onSelectDate }: SignalsDayTabsProps) {
  return (
    <div className="flex overflow-x-auto gap-1 py-2 px-2 scrollbar-hide -mx-2 sm:mx-0">
      {days.map((day) => (
        <button
          key={day.date}
          onClick={() => onSelectDate(day.date)}
          className={cn(
            "px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all active:scale-95",
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
