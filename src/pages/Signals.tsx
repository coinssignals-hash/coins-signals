import { useState } from 'react';
import { Menu, User, Loader2 } from 'lucide-react';
import { SignalCard } from '@/components/signals/SignalCard';
import { SignalsDayTabs } from '@/components/signals/SignalsDayTabs';
import { BottomNav } from '@/components/layout/BottomNav';
import { MainDrawer } from '@/components/layout/MainDrawer';
import { NotificationToggle } from '@/components/notifications/NotificationToggle';
import { useSignals } from '@/hooks/useSignals';
import { format, addDays, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

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
  const weekDays = generateWeekDays();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const { signals, loading, error } = useSignals();

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
            <NotificationToggle />
            <button className="p-2 text-blue-300 hover:text-blue-100">
              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
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
        ) : signals.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No hay señales disponibles</p>
          </div>
        ) : (
          signals.map((signal) => (
            <SignalCard key={signal.id} signal={signal} />
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