import { useMemo } from 'react';
import { Globe, Clock, Activity, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TerminalStatusBarProps {
  symbol: string;
  currentPrice: number;
  high: number;
  low: number;
  isRealtimeConnected?: boolean;
}

interface MarketSession {
  name: string;
  emoji: string;
  isActive: boolean;
  color: string;
}

function getActiveMarketSessions(): MarketSession[] {
  const now = new Date();
  const utcHour = now.getUTCHours();

  return [
    {
      name: 'Sydney',
      emoji: '🇦🇺',
      isActive: (utcHour >= 21 || utcHour < 6),
      color: 'text-blue-400',
    },
    {
      name: 'Tokyo',
      emoji: '🇯🇵',
      isActive: (utcHour >= 0 && utcHour < 9),
      color: 'text-pink-400',
    },
    {
      name: 'London',
      emoji: '🇬🇧',
      isActive: (utcHour >= 7 && utcHour < 16),
      color: 'text-yellow-400',
    },
    {
      name: 'New York',
      emoji: '🇺🇸',
      isActive: (utcHour >= 13 && utcHour < 22),
      color: 'text-green-400',
    },
  ];
}

function estimateSpread(symbol: string): { spread: number; unit: string } {
  const pair = symbol.toUpperCase();
  const majors: Record<string, number> = {
    'EUR/USD': 0.8, 'GBP/USD': 1.0, 'USD/JPY': 0.9, 'USD/CHF': 1.1,
    'AUD/USD': 1.2, 'NZD/USD': 1.5, 'USD/CAD': 1.3,
  };
  const spread = majors[pair] || 2.5;
  return { spread, unit: 'pips' };
}

export function TerminalStatusBar({ symbol, currentPrice, high, low, isRealtimeConnected }: TerminalStatusBarProps) {
  const sessions = useMemo(() => getActiveMarketSessions(), []);
  const activeSessions = sessions.filter(s => s.isActive);
  const { spread, unit } = useMemo(() => estimateSpread(symbol), [symbol]);
  const range = high - low;
  const rangePips = Math.round(range * 10000);
  const position = range > 0 ? ((currentPrice - low) / range) * 100 : 50;

  return (
    <div className="grid grid-cols-4 gap-1 sm:flex sm:items-center sm:gap-2 sm:overflow-x-auto pb-0.5 scrollbar-hide">
      {/* Active Sessions */}
      <div className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-[#0a1628]/80 border border-cyan-900/30 rounded-lg col-span-1">
        <Globe className="w-3 h-3 text-cyan-500 shrink-0" />
        <div className="flex items-center gap-0.5 overflow-hidden">
          {activeSessions.length > 0 ? activeSessions.slice(0, 2).map(s => (
            <span key={s.name} className={cn("text-[9px] sm:text-[10px] font-medium flex items-center gap-0.5", s.color)}>
              <span className="text-[10px]">{s.emoji}</span>
              <span className="hidden sm:inline">{s.name}</span>
            </span>
          )) : (
            <span className="text-[9px] text-gray-500">Off</span>
          )}
        </div>
      </div>

      {/* Spread */}
      <div className="flex items-center justify-center gap-0.5 sm:gap-1 px-1.5 py-1.5 bg-[#0a1628]/80 border border-cyan-900/30 rounded-lg col-span-1">
        <Zap className="w-3 h-3 text-yellow-500 shrink-0" />
        <span className="text-[9px] sm:text-[10px] font-bold text-yellow-400 tabular-nums">{spread.toFixed(1)}<span className="text-gray-500 font-normal ml-0.5 hidden xs:inline">{unit}</span></span>
      </div>

      {/* Daily Range */}
      <div className="flex items-center justify-center gap-1 px-1.5 py-1.5 bg-[#0a1628]/80 border border-cyan-900/30 rounded-lg col-span-1">
        <Activity className="w-3 h-3 text-cyan-500 shrink-0" />
        <span className="text-[9px] sm:text-[10px] font-bold text-cyan-400 tabular-nums">{rangePips}p</span>
        <div className="w-8 sm:w-12 h-1.5 bg-gray-800 rounded-full overflow-hidden relative hidden xs:block">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-gray-500 to-green-500 opacity-30 rounded-full" />
          <div
            className="absolute top-0 w-1.5 h-1.5 bg-white rounded-full shadow-lg shadow-white/50 transition-all"
            style={{ left: `${Math.min(Math.max(position, 5), 95)}%`, transform: 'translateX(-50%)' }}
          />
        </div>
      </div>

      {/* UTC Clock */}
      <div className="flex items-center justify-center gap-0.5 sm:gap-1 px-1.5 py-1.5 bg-[#0a1628]/80 border border-cyan-900/30 rounded-lg col-span-1">
        <Clock className="w-3 h-3 text-gray-500 shrink-0" />
        <UTCClock />
      </div>
    </div>
  );
}

function UTCClock() {
  const now = new Date();
  const h = String(now.getUTCHours()).padStart(2, '0');
  const m = String(now.getUTCMinutes()).padStart(2, '0');
  return (
    <span className="text-[10px] font-mono text-gray-400 tabular-nums">
      {h}:{m} <span className="text-gray-600">UTC</span>
    </span>
  );
}
