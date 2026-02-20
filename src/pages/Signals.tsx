import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, User, Loader2, Heart, LayoutGrid, List, ArrowUpDown, TrendingUp, Clock, Target } from 'lucide-react';
import { SignalCard } from '@/components/signals/SignalCard';
import { SignalCardV2 } from '@/components/signals/SignalCardV2';
import { SignalCardCompact } from '@/components/signals/SignalCardCompact';
import { SignalsDayTabs } from '@/components/signals/SignalsDayTabs';
import { BottomNav } from '@/components/layout/BottomNav';
import { MainDrawer } from '@/components/layout/MainDrawer';
import { NotificationToggle } from '@/components/notifications/NotificationToggle';
import { useSignals, TradingSignal } from '@/hooks/useSignals';
import { useFavoriteSignals } from '@/hooks/useFavoriteSignals';
import { useAuth } from '@/hooks/useAuth';
import { format, addDays, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type ViewMode = 'full' | 'compact';
type SortOption = 'date-desc' | 'date-asc' | 'probability-desc' | 'probability-asc' | 'pips-desc' | 'pips-asc';

const sortOptions: { value: SortOption; label: string; icon: React.ReactNode }[] = [
  { value: 'date-desc', label: 'Más recientes', icon: <Clock className="w-4 h-4" /> },
  { value: 'date-asc', label: 'Más antiguas', icon: <Clock className="w-4 h-4" /> },
  { value: 'probability-desc', label: 'Mayor probabilidad', icon: <TrendingUp className="w-4 h-4" /> },
  { value: 'probability-asc', label: 'Menor probabilidad', icon: <TrendingUp className="w-4 h-4" /> },
  { value: 'pips-desc', label: 'Más pips', icon: <Target className="w-4 h-4" /> },
  { value: 'pips-asc', label: 'Menos pips', icon: <Target className="w-4 h-4" /> },
];

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
      label: `${format(date, 'EEE', { locale: es })} ${format(date, 'd')}`,
    };
  });
};

export default function Signals() {
  const navigate = useNavigate();
  const weekDays = generateWeekDays();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
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
    <div className="min-h-screen bg-[#06080f] flex justify-center">
      <div className="relative w-full max-w-[390px] min-h-screen bg-gradient-to-b from-[#0a0f1a] via-[#0d1829] to-[#0a0f1a] pb-20 shadow-2xl">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0f1a]/95 backdrop-blur-sm border-b border-blue-500/20">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => setDrawerOpen(true)}
            className="p-2 text-blue-300 hover:text-blue-100"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <h1 className="text-2xl font-bold text-white tracking-wide">
            Coins <span className="text-yellow-400">$</span>ignals
          </h1>
          
          <div className="flex items-center gap-1">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-800/50 rounded-lg p-0.5 border border-slate-700/50">
              <button
                onClick={() => setViewMode('full')}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  viewMode === 'full' 
                    ? "bg-slate-700 text-white shadow-sm" 
                    : "text-slate-500 hover:text-slate-300"
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
                    ? "bg-slate-700 text-white shadow-sm" 
                    : "text-slate-500 hover:text-slate-300"
                )}
                title="Vista compacta"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            
            <NotificationToggle />
            {isAuthenticated && (
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={cn(
                  "p-2 rounded-full transition-colors",
                  showFavoritesOnly ? "text-red-400" : "text-blue-300 hover:text-blue-100"
                )}
                title={showFavoritesOnly ? "Ver todas las señales" : "Ver solo favoritos"}
              >
                <Heart className={cn("w-5 h-5", showFavoritesOnly && "fill-current")} />
              </button>
            )}
            <button
              onClick={() => navigate(user ? '/settings' : '/auth')}
              className="p-2 text-blue-300 hover:text-blue-100"
            >
              {user ? (
                <Avatar className="w-8 h-8 border-2 border-blue-500/50">
                  <AvatarImage src={profile?.avatar_url || ''} alt="Avatar" />
                  <AvatarFallback className="bg-blue-600 text-white text-xs">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Day Tabs */}
        <SignalsDayTabs
          days={weekDays}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </header>

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
                <span>Favoritos</span>
              </div>
            )}
            <span>{filteredAndSortedSignals.length} señales</span>
          </div>
        </div>
      </div>

      {/* Signals List */}
      <main className="p-4 space-y-4">
        {loading && (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        )}
        {error && (
          <p className="text-red-400 text-center py-4">{error}</p>
        )}
        {!loading && filteredAndSortedSignals.length === 0 && (
          <p className="text-slate-500 text-center py-10">No hay señales para esta fecha</p>
        )}
        {filteredAndSortedSignals.map((signal) => (
          <SignalCardV2 key={signal.id} signal={signal} />
        ))}
      </main>

      {/* Drawer */}
      <MainDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />

      {/* Bottom Navigation */}
      <BottomNav />
      </div>
    </div>
  );
}