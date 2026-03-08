import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/LanguageContext';

interface DayTabsProps {
  selectedDay: string;
  onSelectDay: (day: string) => void;
}

export function DayTabs({ selectedDay, onSelectDay }: DayTabsProps) {
  const { t } = useTranslation();
  const days = [t('perf_monday'), t('perf_tuesday'), t('perf_wednesday'), t('perf_thursday'), t('perf_friday')];
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden mb-4">
      <div className="flex">
        {days.map((day) => (
          <button
            key={day}
            onClick={() => onSelectDay(day)}
            className={cn(
              'flex-1 py-3 text-sm font-medium transition-colors',
              selectedDay === day
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {day}
          </button>
        ))}
      </div>
    </div>
  );
}
