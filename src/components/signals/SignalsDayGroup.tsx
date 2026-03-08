import { format, isToday, isTomorrow } from 'date-fns';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StaggerList } from '@/components/layout/StaggerList';
import { TodayActivesBadge } from '@/components/signals/today/TodaySignalsGroup';
import { useTranslation } from '@/i18n/LanguageContext';
import { useDateLocale } from '@/hooks/useDateLocale';

interface SignalsDayGroupProps {
  date: string;
  count: number;
  activeCount?: number;
  children: React.ReactNode;
}

export function SignalsDayGroup({ date, count, activeCount = 0, children }: SignalsDayGroupProps) {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const dateObj = new Date(date);
  const today = isToday(dateObj);
  const tomorrow = isTomorrow(dateObj);

  const label = today
    ? t('signals_today')
    : tomorrow
      ? t('signals_tomorrow')
      : format(dateObj, "EEEE d MMMM", { locale: dateLocale });

  return (
    <section className="space-y-3">
      <div className={cn(
        "flex items-center gap-2 px-1 py-2 rounded-lg",
        today
          ? "bg-blue-500/10 border border-blue-500/20"
          : "bg-slate-800/40 border border-slate-700/30"
      )}>
        <div className={cn(
          "flex items-center justify-center w-7 h-7 rounded-md",
          today ? "bg-blue-500/20 text-blue-400" : "bg-slate-700/50 text-slate-400"
        )}>
          <Calendar className="w-4 h-4" />
        </div>
        <span className={cn(
          "text-sm font-semibold capitalize",
          today ? "text-blue-300" : "text-slate-300"
        )}>
          {label}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <TodayActivesBadge count={activeCount} />
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full",
            today
              ? "bg-blue-500/20 text-blue-400"
              : "bg-slate-700/50 text-slate-500"
          )}>
            {count} {count === 1 ? 'señal' : 'señales'}
          </span>
        </div>
      </div>

      <StaggerList className="space-y-4">
        {children}
      </StaggerList>
    </section>
  );
}
