import { useState } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { ChevronDown, Calendar, Brain, RefreshCw, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/i18n/LanguageContext';
import { useDateLocale } from '@/hooks/useDateLocale';

interface DayTabsProps {
  selectedDay: Date;
  onSelectDay: (day: Date) => void;
  onAICenter?: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  symbol?: string;
}

export function DayTabs({ selectedDay, onSelectDay, onAICenter, onRefresh, isLoading, symbol }: DayTabsProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const [open, setOpen] = useState(false);
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const days = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

  const selectedLabel = format(selectedDay, "EEE dd MMM", { locale: dateLocale });

  return (
    <div className="relative flex items-center justify-between w-full bg-gradient-to-r from-slate-900/90 via-slate-800/70 to-slate-900/90 border-y border-cyan-900/20 py-1.5 px-3">

      {/* Date pill - centered */}
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] rounded-full bg-gradient-to-r from-cyan-950/40 to-slate-800/60 border border-cyan-800/30 hover:border-cyan-700/40 transition-all duration-200 active:scale-[0.97] min-w-0">
        <Calendar className="w-3 h-3 text-cyan-400 shrink-0" />
        <span className="capitalize text-white/90 font-semibold tracking-wide truncate">{selectedLabel}</span>
        <ChevronDown className={cn(
          'w-2.5 h-2.5 text-cyan-400/60 transition-transform duration-300 shrink-0',
          open && 'rotate-180 text-cyan-400'
        )} />
      </button>

      {/* Right action buttons */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => navigate(`/tools/market-sessions${symbol ? `?pair=${encodeURIComponent(symbol)}` : ''}`)}
          className="flex items-center justify-center gap-0.5 px-1.5 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/30 active:scale-90 transition-all duration-200"
          title="Market Sessions">
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[9px] font-semibold text-emerald-300 tracking-wide">Sessions</span>
        </button>

        {onAICenter && (
          <button
            onClick={onAICenter}
            className="flex items-center justify-center gap-0.5 px-1.5 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/30 active:scale-90 transition-all duration-200"
            title="Central AI">
            <Brain className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[9px] font-semibold text-purple-300 tracking-wide">AI Center</span>
          </button>
        )}

        <button
          onClick={() => navigate('/tools/strategy-builder')}
          className="flex items-center justify-center gap-0.5 px-1.5 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 hover:border-cyan-500/30 active:scale-90 transition-all duration-200"
          title={t('drawer_strategy_builder') || 'Constructor de Estrategias'}>
          <Blocks className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[9px] font-semibold text-cyan-300 tracking-wide">{t('drawer_strategy_builder') || 'Estrategias'}</span>
        </button>
      </div>

      {open && (
        <div className="absolute z-50 left-0 right-0 top-full bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 shadow-lg">
          {days.map((day) => {
            const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDay, 'yyyy-MM-dd');
            const isToday = format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
            const dayName = format(day, 'EEEE', { locale: dateLocale });
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
                {isToday && <span className="ml-auto text-[10px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded">{t('analysis_today')}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}