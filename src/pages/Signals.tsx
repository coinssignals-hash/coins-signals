import { useState } from 'react';
import { Menu, User } from 'lucide-react';
import { SignalCard } from '@/components/signals/SignalCard';
import { SignalsDayTabs } from '@/components/signals/SignalsDayTabs';
import { BottomNav } from '@/components/layout/BottomNav';
import { mockSignals, weekDays } from '@/data/mockSignals';
import { MainDrawer } from '@/components/layout/MainDrawer';

export default function Signals() {
  const [selectedDate, setSelectedDate] = useState('2025-10-08');
  const [drawerOpen, setDrawerOpen] = useState(false);

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
          
          <button className="p-2 text-blue-300 hover:text-blue-100">
            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
          </button>
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
        {mockSignals.map((signal) => (
          <SignalCard key={signal.id} signal={signal} />
        ))}
      </main>

      {/* Drawer */}
      <MainDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
