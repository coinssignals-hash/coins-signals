import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, User, Loader2, Heart, LayoutGrid, List } from 'lucide-react';
import { SignalCard } from '@/components/signals/SignalCard';
import { SignalCardCompact } from '@/components/signals/SignalCardCompact';
import { SignalsDayTabs } from '@/components/signals/SignalsDayTabs';
import { BottomNav } from '@/components/layout/BottomNav';
import { MainDrawer } from '@/components/layout/MainDrawer';
import { NotificationToggle } from '@/components/notifications/NotificationToggle';
import { useSignals } from '@/hooks/useSignals';
import { useFavoriteSignals } from '@/hooks/useFavoriteSignals';
import { useAuth } from '@/hooks/useAuth';
import { format, addDays, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

type ViewMode = 'full' | 'compact';

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
  const [expandedSignalId, setExpandedSignalId] = useState<string | null>(null);
  
  const { signals, loading, error } = useSignals();
  const { isFavorite, toggleFavorite, favoriteIds, isAuthenticated } = useFavoriteSignals();
  const { user, profile } = useAuth();

  // Persist view mode
  useEffect(() => {
    localStorage.setItem('signals-view-mode', viewMode);
  }, [viewMode]);

  const filteredSignals = showFavoritesOnly 
    ? signals.filter(s => favoriteIds.has(s.id))
    : signals;

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
    <div className="min-h-screen bg-gradient-to-b from-[#0a0f1a] via-[#0d1829] to-[#0a0f1a] pb-20">
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

      {/* Favorites Filter Indicator */}
      {showFavoritesOnly && (
        <div className="bg-red-500/20 border-b border-red-500/30 px-4 py-2">
          <div className="flex items-center justify-center gap-2 text-sm text-red-300">
            <Heart className="w-4 h-4 fill-current" />
            <span>Mostrando solo favoritos ({favoriteIds.size})</span>
          </div>
        </div>
      )}

      {/* Signals List */}
      <main className="p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-400">
            <p>Error al cargar señales</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        ) : filteredSignals.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>{showFavoritesOnly ? 'No tienes señales favoritas' : 'No hay señales disponibles'}</p>
            {showFavoritesOnly && (
              <button
                onClick={() => setShowFavoritesOnly(false)}
                className="mt-2 text-blue-400 hover:underline text-sm"
              >
                Ver todas las señales
              </button>
            )}
          </div>
        ) : viewMode === 'compact' ? (
          <div className="space-y-2">
            {filteredSignals.map((signal) => (
              expandedSignalId === signal.id ? (
                <div key={signal.id} className="animate-in fade-in duration-200">
                  <SignalCard 
                    signal={signal}
                    isFavorite={isFavorite(signal.id)}
                    onToggleFavorite={toggleFavorite}
                  />
                  <button
                    onClick={() => setExpandedSignalId(null)}
                    className="w-full mt-1 py-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    Cerrar vista expandida
                  </button>
                </div>
              ) : (
                <SignalCardCompact
                  key={signal.id}
                  signal={signal}
                  isFavorite={isFavorite(signal.id)}
                  onToggleFavorite={toggleFavorite}
                  onExpand={() => setExpandedSignalId(signal.id)}
                />
              )
            ))}
          </div>
        ) : (
          filteredSignals.map((signal) => (
            <SignalCard 
              key={signal.id} 
              signal={signal}
              isFavorite={isFavorite(signal.id)}
              onToggleFavorite={toggleFavorite}
            />
          ))
        )}
      </main>

      {/* Drawer */}
      <MainDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}