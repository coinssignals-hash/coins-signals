import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Loader2, Heart, LayoutGrid, List, ArrowUpDown, TrendingUp, Clock, Target, History, CalendarIcon, X, Brain, PlusCircle, ChevronDown, Filter, SlidersHorizontal, Layers, Activity, CheckCircle2, XCircle, Gauge, CircleDot, BarChart3 } from 'lucide-react';
import { PageTransition } from '@/components/layout/PageTransition';
import { SignalCard } from '@/components/signals/SignalCard';
const SignalCardV2 = lazy(() => import('@/components/signals/SignalCardV2').then(m => ({ default: m.SignalCardV2 })));
import { SignalCardCompact } from '@/components/signals/SignalCardCompact';
import { SignalsDayTabs } from '@/components/signals/SignalsDayTabs';
import { SignalsDayGroup } from '@/components/signals/SignalsDayGroup';
import { TodaySignalsGroup, TodayActivesBadge } from '@/components/signals/today/TodaySignalsGroup';
import { TomorrowSignalsGroup } from '@/components/signals/tomorrow/TomorrowSignalsGroup';
import { SignalPerformanceStats } from '@/components/signals/SignalPerformanceStats';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';

import { NotificationToggle } from '@/components/notifications/NotificationToggle';
import { LazySection } from '@/components/ui/lazy-section';

// Lazy load heavy AI Center
const AICenter = lazy(() => import('@/components/signals/ai-center/AICenter').then((m) => ({ default: m.AICenter })));
import { useSignals, TradingSignal } from '@/hooks/useSignals';
import { useFavoriteSignals } from '@/hooks/useFavoriteSignals';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { format, addDays, subDays, startOfWeek, startOfDay, parseISO, isToday, isTomorrow, isYesterday, isSameDay } from 'date-fns';
import { useDateLocale } from '@/hooks/useDateLocale';
import { useTranslation } from '@/i18n/LanguageContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger } from
'@/components/ui/dropdown-menu';

type ViewMode = 'full' | 'compact';
type SortOption = 'date-desc' | 'date-asc' | 'probability-desc' | 'probability-asc' | 'pips-desc' | 'pips-asc';
type DayTab = 'today' | 'tomorrow' | 'yesterday' | 'calendar' | 'all';
type SourceFilter = 'all' | 'server' | 'ai-center';

function useSortOptions() {
  const { t } = useTranslation();
  return [
  { value: 'date-desc' as SortOption, label: t('signals_sort_recent'), icon: <Clock className="w-4 h-4" /> },
  { value: 'date-asc' as SortOption, label: t('signals_sort_oldest'), icon: <Clock className="w-4 h-4" /> },
  { value: 'probability-desc' as SortOption, label: t('signals_sort_prob_high'), icon: <TrendingUp className="w-4 h-4" /> },
  { value: 'probability-asc' as SortOption, label: t('signals_sort_prob_low'), icon: <TrendingUp className="w-4 h-4" /> },
  { value: 'pips-desc' as SortOption, label: t('signals_sort_pips_high'), icon: <Target className="w-4 h-4" /> },
  { value: 'pips-asc' as SortOption, label: t('signals_sort_pips_low'), icon: <Target className="w-4 h-4" /> }];

}

// Calculate pips for a signal
const calculatePips = (signal: TradingSignal): number => {
  const isBuy = signal.action === 'BUY';
  return isBuy ?
  Math.round((signal.takeProfit - signal.entryPrice) * 10000) :
  Math.round((signal.entryPrice - signal.takeProfit) * 10000);
};

// Generate week days dynamically
const generateWeekDays = () => {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });

  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    return {
      date: format(date, 'yyyy-MM-dd'),
      label: `${format(date, 'EEE')} ${format(date, 'd')}`
    };
  });
};

export default function Signals() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const sortOptions = useSortOptions();
  const dateLocale = useDateLocale();
  const [dayTab, setDayTab] = useState<DayTab>('today');
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showAICenter, setShowAICenter] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [pairFilter, setPairFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [probFilter, setProbFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return localStorage.getItem('signals-view-mode') as ViewMode || 'full';
  });
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    return localStorage.getItem('signals-sort-by') as SortOption || 'date-desc';
  });
  const [expandedSignalId, setExpandedSignalId] = useState<string | null>(null);

  const { signals, loading, error } = useSignals();
  const { isFavorite, toggleFavorite, favoriteIds, isAuthenticated } = useFavoriteSignals();
  const { user, profile } = useAuth();
  const { isAdmin } = useUserRole();

  // Persist view mode
  useEffect(() => {
    localStorage.setItem('signals-view-mode', viewMode);
  }, [viewMode]);

  // Persist sort option
  useEffect(() => {
    localStorage.setItem('signals-sort-by', sortBy);
  }, [sortBy]);

  // Extract unique currency pairs for the filter
  const availablePairs = useMemo(() => {
    const pairs = new Set(signals.map(s => s.currencyPair));
    return Array.from(pairs).sort();
  }, [signals]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (pairFilter !== 'all') count++;
    if (statusFilter !== 'all') count++;
    if (probFilter !== 'all') count++;
    return count;
  }, [pairFilter, statusFilter, probFilter]);

  // Filter and sort signals
  const filteredAndSortedSignals = useMemo(() => {
    let result = showFavoritesOnly ?
    signals.filter((s) => favoriteIds.has(s.id)) :
    signals;

    // Filter by source
    if (sourceFilter !== 'all') {
      result = result.filter((s) => s.source === sourceFilter);
    }

    // Filter by pair
    if (pairFilter !== 'all') {
      result = result.filter((s) => s.currencyPair === pairFilter);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter((s) => s.status === statusFilter);
    }

    // Filter by probability
    if (probFilter !== 'all') {
      switch (probFilter) {
        case 'high':
          result = result.filter((s) => s.probability >= 80);
          break;
        case 'medium':
          result = result.filter((s) => s.probability >= 60 && s.probability < 80);
          break;
        case 'low':
          result = result.filter((s) => s.probability < 60);
          break;
      }
    }

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
  }, [signals, showFavoritesOnly, favoriteIds, sortBy, sourceFilter, pairFilter, statusFilter, probFilter]);

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

  const currentSortOption = sortOptions.find((opt) => opt.value === sortBy);

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
      <div className="relative w-full max-w-lg min-h-screen bg-gradient-to-b from-[hsl(222,45%,7%)] via-[hsl(218,52%,8%)] to-[hsl(222,45%,7%)] pb-20 shadow-2xl mx-auto">
      <Header />
        </div>

        {/* Unified Nav Bar — day tabs + source filter in one row */}
        <div className="flex items-center gap-1.5 px-3 py-2">
          {/* Day tabs — scrollable on small screens */}
          <ScrollArea className="flex-1 min-w-0">
            <div className="flex gap-1">
              {[
                { key: 'yesterday' as DayTab, label: t('signals_yesterday'), icon: <History className="w-3.5 h-3.5" />, count: yesterdaySignals.length },
                { key: 'today' as DayTab, label: t('signals_today'), icon: <TrendingUp className="w-3.5 h-3.5" />, count: todaySignals.length },
                { key: 'tomorrow' as DayTab, label: t('signals_tomorrow'), icon: <Clock className="w-3.5 h-3.5" />, count: tomorrowSignals.length },
                { key: 'all' as DayTab, label: t('signals_all'), icon: <LayoutGrid className="w-3.5 h-3.5" />, count: 0 },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => { setDayTab(tab.key); setCalendarDate(undefined); }}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all justify-center whitespace-nowrap active:scale-95 min-w-0",
                    dayTab === tab.key
                      ? "bg-primary text-primary-foreground shadow-[0_0_10px_hsl(var(--primary)/0.25)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  )}
                >
                  {tab.icon}
                  <span className="text-[10px]">{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={cn(
                      "text-[8px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-bold leading-none",
                      dayTab === tab.key ? "bg-white/20" : "bg-primary/15 text-primary"
                    )}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}

              {/* Calendar */}
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      "flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all justify-center active:scale-95",
                      dayTab === 'calendar'
                        ? "bg-primary text-primary-foreground shadow-[0_0_10px_hsl(var(--primary)/0.25)]"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    )}
                  >
                    <CalendarIcon className="w-3.5 h-3.5" />
                    {dayTab === 'calendar' && calendarDate
                      ? <span className="text-[10px]">{format(calendarDate, 'd MMM', { locale: dateLocale })}</span>
                      : null}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover border-border" align="end">
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
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* Right action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Source filter */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "flex items-center gap-0.5 p-1.5 rounded-lg text-[11px] font-medium transition-all active:scale-95 border",
                    sourceFilter === 'ai-center'
                      ? "bg-accent/15 text-accent-foreground border-accent/30"
                      : sourceFilter === 'server'
                        ? "bg-primary/15 text-primary border-primary/30"
                        : "bg-secondary/50 text-foreground border-border/50"
                  )}
                >
                  {sourceFilter === 'ai-center' ? <Brain className="w-3.5 h-3.5" /> : sourceFilter === 'server' ? <TrendingUp className="w-3.5 h-3.5" /> : <Filter className="w-3.5 h-3.5" />}
                  <ChevronDown className="w-2.5 h-2.5 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-36 p-1 bg-card border-border" align="end" sideOffset={4}>
                {([
                  { key: 'all' as SourceFilter, label: t('signals_all'), icon: <LayoutGrid className="w-3.5 h-3.5" /> },
                  { key: 'server' as SourceFilter, label: 'Server', icon: <TrendingUp className="w-3.5 h-3.5" /> },
                  { key: 'ai-center' as SourceFilter, label: 'AI Center', icon: <Brain className="w-3.5 h-3.5" /> },
                ]).map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setSourceFilter(opt.key)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-xs font-medium transition-colors",
                      sourceFilter === opt.key
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    )}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </PopoverContent>
            </Popover>

            {/* Advanced filters toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "relative p-1.5 rounded-lg text-[11px] font-medium transition-all active:scale-95 border",
                showFilters || activeFilterCount > 0
                  ? "bg-primary/15 text-primary border-primary/30 shadow-[0_0_8px_hsl(var(--primary)/0.2)]"
                  : "bg-secondary/50 text-foreground border-border/50"
              )}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold animate-pulse">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="px-3 pb-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
            {/* Glassmorphism container */}
            <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 p-3 space-y-3 shadow-[inset_0_1px_0_hsl(var(--primary)/0.1)]">

              {/* Pair filter */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 px-0.5">
                  <Layers className="w-3 h-3 text-primary/70" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{t('sf_pair')}</span>
                </div>
                <ScrollArea className="w-full">
                  <div className="flex gap-1.5 pb-1">
                    <button
                      onClick={() => setPairFilter('all')}
                      className={cn(
                        "px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all border",
                        pairFilter === 'all'
                          ? "bg-primary text-primary-foreground border-primary shadow-[0_0_10px_hsl(var(--primary)/0.3)]"
                          : "bg-muted/20 text-muted-foreground hover:text-foreground border-border/30 hover:border-primary/30"
                      )}
                    >
                      {t('sf_all')}
                    </button>
                    {availablePairs.map((pair) => (
                      <button
                        key={pair}
                        onClick={() => setPairFilter(pair === pairFilter ? 'all' : pair)}
                        className={cn(
                          "px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all border",
                          pairFilter === pair
                            ? "bg-primary text-primary-foreground border-primary shadow-[0_0_10px_hsl(var(--primary)/0.3)]"
                            : "bg-muted/20 text-muted-foreground hover:text-foreground border-border/30 hover:border-primary/30"
                        )}
                      >
                        {pair}
                      </button>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

              {/* Status filter */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 px-0.5">
                  <Activity className="w-3 h-3 text-primary/70" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{t('sf_status')}</span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    { key: 'all', label: t('sf_all'), icon: <CircleDot className="w-3 h-3" />, activeColor: 'bg-primary text-primary-foreground border-primary shadow-[0_0_10px_hsl(var(--primary)/0.3)]' },
                    { key: 'active', label: t('sf_active'), icon: <TrendingUp className="w-3 h-3" />, activeColor: 'bg-emerald-500/90 text-white border-emerald-400 shadow-[0_0_10px_hsl(152_69%_40%/0.4)]' },
                    { key: 'pending', label: t('sf_pending'), icon: <Clock className="w-3 h-3" />, activeColor: 'bg-amber-500/90 text-white border-amber-400 shadow-[0_0_10px_hsl(38_92%_50%/0.4)]' },
                    { key: 'completed', label: t('sf_completed'), icon: <CheckCircle2 className="w-3 h-3" />, activeColor: 'bg-sky-500/90 text-white border-sky-400 shadow-[0_0_10px_hsl(199_89%_48%/0.4)]' },
                    { key: 'cancelled', label: t('sf_cancelled'), icon: <XCircle className="w-3 h-3" />, activeColor: 'bg-red-500/90 text-white border-red-400 shadow-[0_0_10px_hsl(0_84%_60%/0.4)]' },
                  ].map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setStatusFilter(s.key === statusFilter ? 'all' : s.key)}
                      className={cn(
                        "flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all border",
                        statusFilter === s.key
                          ? s.activeColor
                          : "bg-muted/20 text-muted-foreground hover:text-foreground border-border/30 hover:border-primary/30"
                      )}
                    >
                      {s.icon}
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

              {/* Probability filter */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 px-0.5">
                  <Gauge className="w-3 h-3 text-primary/70" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{t('sf_probability')}</span>
                </div>
                <div className="flex gap-1.5">
                  {[
                    { key: 'all', label: t('sf_all_f'), icon: <BarChart3 className="w-3 h-3" /> },
                    { key: 'high', label: t('sf_high'), icon: <TrendingUp className="w-3 h-3" /> },
                    { key: 'medium', label: t('sf_medium'), icon: <Activity className="w-3 h-3" /> },
                    { key: 'low', label: t('sf_low'), icon: <Target className="w-3 h-3" /> },
                  ].map((p) => (
                    <button
                      key={p.key}
                      onClick={() => setProbFilter(p.key === probFilter ? 'all' : p.key)}
                      className={cn(
                        "flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all flex-1 text-center border",
                        probFilter === p.key
                          ? "bg-primary text-primary-foreground border-primary shadow-[0_0_10px_hsl(var(--primary)/0.3)]"
                          : "bg-muted/20 text-muted-foreground hover:text-foreground border-border/30 hover:border-primary/30"
                      )}
                    >
                      {p.icon}
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear all filters */}
              {activeFilterCount > 0 && (
                <div className="pt-1">
                  <button
                    onClick={() => { setPairFilter('all'); setStatusFilter('all'); setProbFilter('all'); }}
                    className="flex items-center gap-1.5 text-[11px] text-primary hover:text-primary/80 font-medium px-1 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    {t('sf_clear')} ({activeFilterCount})
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Calendar date indicator */}
        {dayTab === 'calendar' && calendarDate && (
          <div className="flex items-center gap-2 px-4 pb-2">
            <span className="text-xs text-primary">
              {format(calendarDate, "EEEE d 'de' MMMM yyyy", { locale: dateLocale })}
            </span>
            <button
              onClick={() => { setDayTab('today'); setCalendarDate(undefined); }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}


      {/* Filters Bar */}
      





































          

      {/* Signals List grouped by day */}
      <main className="p-3 sm:p-4 space-y-4 sm:space-y-6">
        {showAICenter ?
            <Suspense fallback={<div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <AICenter onClose={() => setShowAICenter(false)} />
          </Suspense> :

            <>
            {/* Performance Stats Panel */}
            {!loading && signals.length > 0 &&
              <SignalPerformanceStats signals={signals} activesBadge={
                <TodayActivesBadge count={signals.filter(s => s.status === 'active' || s.status === 'pending').length} />
              } />
              }

            {loading &&
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
              }
            {error &&
              <p className="text-destructive text-center py-4">{error}</p>
              }
            {!loading && filteredAndSortedSignals.length === 0 &&
              <p className="text-muted-foreground text-center py-10">{t('signals_no_signals')}</p>
              }

            {dayTab === 'today' && <TodaySignalsGroup signals={todaySignals} />}

            {dayTab === 'yesterday' &&
              <SignalsDayGroup date={format(subDays(new Date(), 1), 'yyyy-MM-dd')} count={yesterdaySignals.length} activeCount={yesterdaySignals.filter(s => s.status === 'active' || s.status === 'pending').length}>
                {yesterdaySignals.length === 0 ?
                <p className="text-muted-foreground text-center py-6 text-sm">{t('signals_no_yesterday')}</p> :

                yesterdaySignals.map((signal) => <SignalCardV2 key={signal.id} signal={signal} />)
                }
              </SignalsDayGroup>
              }

            {dayTab === 'tomorrow' && <TomorrowSignalsGroup signals={tomorrowSignals} />}

            {dayTab === 'calendar' && calendarDate &&
              <SignalsDayGroup date={format(calendarDate, 'yyyy-MM-dd')} count={calendarSignals.length} activeCount={calendarSignals.filter(s => s.status === 'active' || s.status === 'pending').length}>
                {calendarSignals.length === 0 ?
                <p className="text-muted-foreground text-center py-6 text-sm">{t('signals_no_date')}</p> :

                calendarSignals.map((signal) => <SignalCardV2 key={signal.id} signal={signal} />)
                }
              </SignalsDayGroup>
              }

            {dayTab === 'all' &&
              <>
                <TodaySignalsGroup signals={todaySignals} />
                {tomorrowSignals.length > 0 && <TomorrowSignalsGroup signals={tomorrowSignals} />}
                {yesterdaySignals.length > 0 &&
                <SignalsDayGroup date={format(subDays(new Date(), 1), 'yyyy-MM-dd')} count={yesterdaySignals.length} activeCount={yesterdaySignals.filter(s => s.status === 'active' || s.status === 'pending').length}>
                    {yesterdaySignals.map((signal) => <SignalCardV2 key={signal.id} signal={signal} />)}
                  </SignalsDayGroup>
                }
                {otherDayGroups.map(([day, daySignals]) =>
                <SignalsDayGroup key={day} date={day} count={daySignals.length} activeCount={daySignals.filter(s => s.status === 'active' || s.status === 'pending').length}>
                    {daySignals.map((signal) =>
                  <SignalCardV2 key={signal.id} signal={signal} />
                  )}
                  </SignalsDayGroup>
                )}
              </>
              }
          </>
            }
      </main>


      {/* Bottom Navigation */}
      <BottomNav />
      </div>
    </div>
    </PageTransition>);

}