import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Loader2, Heart, LayoutGrid, List, ArrowUpDown, TrendingUp, Clock, Target, History, CalendarIcon, X, Brain } from 'lucide-react';
import { PageTransition } from '@/components/layout/PageTransition';
import { SignalCard } from '@/components/signals/SignalCard';
import { SignalCardV2 } from '@/components/signals/SignalCardV2';
import { SignalCardCompact } from '@/components/signals/SignalCardCompact';
import { SignalsDayTabs } from '@/components/signals/SignalsDayTabs';
import { SignalsDayGroup } from '@/components/signals/SignalsDayGroup';
import { TodaySignalsGroup } from '@/components/signals/today/TodaySignalsGroup';
import { TomorrowSignalsGroup } from '@/components/signals/tomorrow/TomorrowSignalsGroup';
import { SignalPerformanceStats } from '@/components/signals/SignalPerformanceStats';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';

import { NotificationToggle } from '@/components/notifications/NotificationToggle';
import { AICenter } from '@/components/signals/ai-center/AICenter';
import { useSignals, TradingSignal } from '@/hooks/useSignals';
import { useFavoriteSignals } from '@/hooks/useFavoriteSignals';
import { useAuth } from '@/hooks/useAuth';
import { format, addDays, subDays, startOfWeek, startOfDay, parseISO, isToday, isTomorrow, isYesterday, isSameDay } from 'date-fns';
import { es, enUS, ptBR, fr } from 'date-fns/locale';
import { useTranslation } from '@/i18n/LanguageContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type ViewMode = 'full' | 'compact';
type SortOption = 'date-desc' | 'date-asc' | 'probability-desc' | 'probability-asc' | 'pips-desc' | 'pips-asc';
type DayTab = 'today' | 'tomorrow' | 'yesterday' | 'calendar' | 'all';

function useSortOptions() {
  const { t } = useTranslation();
  return [
    { value: 'date-desc' as SortOption, label: t('signals_sort_recent'), icon: <Clock className="w-4 h-4" /> },
    { value: 'date-asc' as SortOption, label: t('signals_sort_oldest'), icon: <Clock className="w-4 h-4" /> },
    { value: 'probability-desc' as SortOption, label: t('signals_sort_prob_high'), icon: <TrendingUp className="w-4 h-4" /> },
    { value: 'probability-asc' as SortOption, label: t('signals_sort_prob_low'), icon: <TrendingUp className="w-4 h-4" /> },
    { value: 'pips-desc' as SortOption, label: t('signals_sort_pips_high'), icon: <Target className="w-4 h-4" /> },
    { value: 'pips-asc' as SortOption, label: t('signals_sort_pips_low'), icon: <Target className="w-4 h-4" /> },
  ];
}

// Calculate pips for a signal
const calculatePips = (signal: TradingSignal): number => {
  const isBuy = signal.action === 'BUY';
  return isBuy 
    ? Math.round((signal.takeProfit - signal.entryPrice) * 10000)
    : Math.round((signal.entryPrice - signal.takeProfit) * 10000);
};

// Generate week days dynamically
const generateWeekDays = () => {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    return {
      date: format(date, 'yyyy-MM-dd'),
      label: `${format(date, 'EEE')} ${format(date, 'd')}`,
    };
  });
};

export default function Signals() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const sortOptions = useSortOptions();
  const DATE_LOCALES: Record<string, typeof es> = { es, en: enUS, pt: ptBR, fr };
  const dateLocale = DATE_LOCALES[language] ?? es;
  const [dayTab, setDayTab] = useState<DayTab>('today');
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showAICenter, setShowAICenter] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('signals-view-mode') as ViewMode) || 'full';
  });
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    return (localStorage.getItem('signals-sort-by') as SortOption) || 'date-desc';
  });
  const [expandedSignalId, setExpandedSignalId] = useState<string | null>(null);
  
  const { signals, loading, error } = useSignals();
  const { isFavorite, toggleFavorite, favoriteIds, isAuthenticated } = useFavoriteSignals();
  const { user, profile } = useAuth();

  // Persist view mode
  useEffect(() => {
    localStorage.setItem('signals-view-mode', viewMode);
  }, [viewMode]);

  // Persist sort option
  useEffect(() => {
    localStorage.setItem('signals-sort-by', sortBy);
  }, [sortBy]);

  // Filter and sort signals
  const filteredAndSortedSignals = useMemo(() => {
    let result = showFavoritesOnly 
      ? signals.filter(s => favoriteIds.has(s.id))
      : signals;

    // Sort signals
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.datetime).getTime() - new Date(a.datetime).getTime();
        case 'date-asc':
          return new Date(a.datetime).getTime() - new Date(b.datetime).getTime();
        case 'probability-desc':
          return b.probability - a.probability;
        case 'probability-asc':
          return a.probability - b.probability;
        case 'pips-desc':
          return calculatePips(b) - calculatePips(a);
        case 'pips-asc':
          return calculatePips(a) - calculatePips(b);
        default:
          return 0;
      }
    });

    return result;
  }, [signals, showFavoritesOnly, favoriteIds, sortBy]);

  // Separate today, tomorrow, yesterday, and other days
  const { todaySignals, tomorrowSignals, yesterdaySignals, otherDayGroups } = useMemo(() => {
    const today: TradingSignal[] = [];
    const tomorrow: TradingSignal[] = [];
    const yesterday: TradingSignal[] = [];
    const others: Record<string, TradingSignal[]> = {};

    filteredAndSortedSignals.forEach((signal) => {
      const d = parseISO(signal.datetime);
      if (isToday(d)) {
        today.push(signal);
      } else if (isTomorrow(d)) {
        tomorrow.push(signal);
      } else if (isYesterday(d)) {
        yesterday.push(signal);
      } else {
        const day = format(d, 'yyyy-MM-dd');
        if (!others[day]) others[day] = [];
        others[day].push(signal);
      }
    });

    const sortedOthers = Object.entries(others).sort(([a], [b]) => b.localeCompare(a));
    return { todaySignals: today, tomorrowSignals: tomorrow, yesterdaySignals: yesterday, otherDayGroups: sortedOthers };
  }, [filteredAndSortedSignals]);

  // Signals for a specific calendar date
  const calendarSignals = useMemo(() => {
    if (!calendarDate) return [];
    return filteredAndSortedSignals.filter((s) => isSameDay(parseISO(s.datetime), calendarDate));
  }, [filteredAndSortedSignals, calendarDate]);

  const currentSortOption = sortOptions.find(opt => opt.value === sortBy);

  const getInitials = () => {
    if (profile?.first_name) {
      return `${profile.first_name.charAt(0)}${profile.last_name?.charAt(0) || ''}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <PageTransition>
    <div className="min-h-screen bg-[hsl(225,45%,3%)] flex justify-center">
      <div className="relative w-full max-w-2xl min-h-screen bg-gradient-to-b from-[hsl(222,45%,7%)] via-[hsl(218,52%,8%)] to-[hsl(222,45%,7%)] pb-20 shadow-2xl">
      <Header />
      {/* Signal Controls Bar */}
      <div className="sticky top-14 z-30 bg-[hsl(222,45%,7%)]/95 backdrop-blur-sm border-b border-primary/20 px-4 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-secondary/50 rounded-lg p-0.5 border border-border/50">
              <button
                onClick={() => setViewMode('full')}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  viewMode === 'full' 
                    ? "bg-muted text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Vista completa"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  viewMode === 'compact' 
                    ? "bg-muted text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Vista compacta"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowAICenter(!showAICenter)}
              className={cn(
                "p-2 rounded-full transition-colors",
                showAICenter ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
              )}
              title="Centro de Análisis IA"
            >
              <Brain className="w-5 h-5" />
            </button>
            <NotificationToggle />
            {isAuthenticated && (
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={cn(
                  "p-2 rounded-full transition-colors",
                  showFavoritesOnly ? "text-destructive" : "text-muted-foreground hover:text-foreground"
                )}
                title={showFavoritesOnly ? "Ver todas las señales" : "Ver solo favoritos"}
              >
                <Heart className={cn("w-5 h-5", showFavoritesOnly && "fill-current")} />
              </button>
            )}
          </div>
        </div>

        {/* Day Tab Switcher */}
        <div className="flex gap-1 px-3 py-2">
        {([
            { key: 'yesterday' as DayTab, label: t('signals_yesterday'), icon: <History className="w-3.5 h-3.5" />, count: yesterdaySignals.length },
            { key: 'today' as DayTab, label: t('signals_today'), icon: <TrendingUp className="w-3.5 h-3.5" />, count: todaySignals.length },
            { key: 'tomorrow' as DayTab, label: t('signals_tomorrow'), icon: <Clock className="w-3.5 h-3.5" />, count: tomorrowSignals.length },
            { key: 'all' as DayTab, label: t('signals_all'), icon: <LayoutGrid className="w-3.5 h-3.5" />, count: 0 },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setDayTab(tab.key); setCalendarDate(undefined); }}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-1 justify-center",
                dayTab === tab.key && tab.key !== 'calendar'
                  ? tab.key === 'today'
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                    : tab.key === 'yesterday'
                      ? "bg-violet-600 text-white shadow-lg shadow-violet-500/30"
                      : tab.key === 'tomorrow'
                        ? "bg-amber-600 text-white shadow-lg shadow-amber-500/30"
                        : "bg-slate-600 text-white shadow-lg shadow-slate-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-0.5 bg-white/20 text-[10px] px-1.5 py-0.5 rounded-full">{tab.count}</span>
              )}
            </button>
          ))}

          {/* Calendar picker */}
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all justify-center",
                  dayTab === 'calendar'
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                )}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                {dayTab === 'calendar' && calendarDate
                  ? format(calendarDate, 'd MMM', { locale: dateLocale })
                  : ''}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-700" align="end">
              <Calendar
                mode="single"
                selected={calendarDate}
                onSelect={(date) => {
                  setCalendarDate(date);
                  setDayTab('calendar');
                  setCalendarOpen(false);
                }}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
                locale={dateLocale}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Calendar date indicator */}
        {dayTab === 'calendar' && calendarDate && (
          <div className="flex items-center gap-2 px-4 pb-2">
            <span className="text-xs text-emerald-400">
              {format(calendarDate, "EEEE d 'de' MMMM yyyy", { locale: dateLocale })}
            </span>
            <button
              onClick={() => { setDayTab('today'); setCalendarDate(undefined); }}
              className="text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      

      {/* Filters Bar */}
      <div className="bg-slate-900/50 border-b border-slate-700/50 px-4 py-2">
        <div className="flex items-center justify-between gap-3">
          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 hover:bg-slate-700/60 transition-colors text-sm">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-300">{currentSortOption?.label}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-slate-900 border-slate-700">
              {sortOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                  className={cn(
                    "flex items-center gap-2 cursor-pointer",
                    sortBy === option.value && "bg-slate-800 text-white"
                  )}
                >
                  {option.icon}
                  <span>{option.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Results count */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {showFavoritesOnly && (
              <div className="flex items-center gap-1 text-rose-400">
                <Heart className="w-3 h-3 fill-current" />
                <span>{t('signals_favorites')}</span>
              </div>
            )}
            <span>{filteredAndSortedSignals.length} {t('signals_count')}</span>
          </div>
        </div>
      </div>

      {/* Signals List grouped by day */}
      <main className="p-4 space-y-6">
        {showAICenter ? (
          <AICenter onClose={() => setShowAICenter(false)} />
        ) : (
          <>
            {/* Performance Stats Panel */}
            {!loading && signals.length > 0 && (
              <SignalPerformanceStats signals={signals} />
            )}

            {loading && (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}
            {error && (
              <p className="text-destructive text-center py-4">{error}</p>
            )}
            {!loading && filteredAndSortedSignals.length === 0 && (
              <p className="text-muted-foreground text-center py-10">{t('signals_no_signals')}</p>
            )}

            {dayTab === 'today' && <TodaySignalsGroup signals={todaySignals} />}

            {dayTab === 'yesterday' && (
              <SignalsDayGroup date={format(subDays(new Date(), 1), 'yyyy-MM-dd')} count={yesterdaySignals.length}>
                {yesterdaySignals.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6 text-sm">{t('signals_no_yesterday')}</p>
                ) : (
                  yesterdaySignals.map((signal) => <SignalCardV2 key={signal.id} signal={signal} />)
                )}
              </SignalsDayGroup>
            )}

            {dayTab === 'tomorrow' && <TomorrowSignalsGroup signals={tomorrowSignals} />}

            {dayTab === 'calendar' && calendarDate && (
              <SignalsDayGroup date={format(calendarDate, 'yyyy-MM-dd')} count={calendarSignals.length}>
                {calendarSignals.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6 text-sm">{t('signals_no_date')}</p>
                ) : (
                  calendarSignals.map((signal) => <SignalCardV2 key={signal.id} signal={signal} />)
                )}
              </SignalsDayGroup>
            )}

            {dayTab === 'all' && (
              <>
                <TodaySignalsGroup signals={todaySignals} />
                {tomorrowSignals.length > 0 && <TomorrowSignalsGroup signals={tomorrowSignals} />}
                {yesterdaySignals.length > 0 && (
                  <SignalsDayGroup date={format(subDays(new Date(), 1), 'yyyy-MM-dd')} count={yesterdaySignals.length}>
                    {yesterdaySignals.map((signal) => <SignalCardV2 key={signal.id} signal={signal} />)}
                  </SignalsDayGroup>
                )}
                {otherDayGroups.map(([day, daySignals]) => (
                  <SignalsDayGroup key={day} date={day} count={daySignals.length}>
                    {daySignals.map((signal) => (
                      <SignalCardV2 key={signal.id} signal={signal} />
                    ))}
                  </SignalsDayGroup>
                ))}
              </>
            )}
          </>
        )}
      </main>


      {/* Bottom Navigation */}
      <BottomNav />
      </div>
    </div>
    </PageTransition>
  );
}