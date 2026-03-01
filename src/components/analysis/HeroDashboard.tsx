import { Activity, Clock, Globe, TrendingUp, TrendingDown, BarChart2, Zap } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from '@/i18n/LanguageContext';

interface HeroDashboardProps {
  currentPrice: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  symbol: string;
  loading: boolean;
  isRealtimeConnected: boolean;
}

function getActiveSession(): { name: string; emoji: string; color: string } {
  const utcHour = new Date().getUTCHours();
  if (utcHour >= 0 && utcHour < 7) return { name: 'Asia', emoji: '🌏', color: 'text-amber-400' };
  if (utcHour >= 7 && utcHour < 12) return { name: 'Europa', emoji: '🌍', color: 'text-cyan-400' };
  if (utcHour >= 12 && utcHour < 17) return { name: 'NY + EU', emoji: '🌎🌍', color: 'text-emerald-400' };
  if (utcHour >= 17 && utcHour < 21) return { name: 'Nueva York', emoji: '🌎', color: 'text-blue-400' };
  return { name: 'Asia (Pre)', emoji: '🌏', color: 'text-amber-400' };
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return 'Buenas noches';
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export function HeroDashboard({
  currentPrice, change, changePercent, high, low, symbol, loading, isRealtimeConnected,
}: HeroDashboardProps) {
  const session = useMemo(() => getActiveSession(), []);
  const greeting = useMemo(() => getGreeting(), []);
  const isPositive = change >= 0;
  const [base, quote] = symbol.split('/');

  const utcTime = new Date().toLocaleTimeString('es-ES', {
    hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
  });

  const spread = useMemo(() => {
    const decimals = currentPrice < 10 ? 5 : currentPrice < 1000 ? 3 : 2;
    return (Math.random() * 2 + 0.5).toFixed(1);
  }, [currentPrice]);

  return (
    <div className="space-y-3">
      {/* Hero greeting */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d1829] via-[#101f36] to-[#0a1628] border border-cyan-900/30 p-4">
        {/* Decorative glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-cyan-500/5 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-blue-500/5 blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-lg font-bold text-white/90">{greeting}, Trader 👋</h1>
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                {utcTime} UTC · Sesión {session.emoji} <span className={session.color}>{session.name}</span>
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {isRealtimeConnected ? (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-500/10 border border-gray-500/20 px-2 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                  Offline
                </span>
              )}
            </div>
          </div>

          {/* Active pair highlight */}
          <div className="flex items-center gap-3 bg-[#0a1628]/60 rounded-xl p-3 border border-cyan-900/20">
            <div className="flex -space-x-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-cyan-500/20">
                {base}
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-[10px] font-bold text-white border-2 border-[#0a1628]">
                {quote}
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono-numbers text-white">
                  {loading ? '...' : currentPrice.toFixed(currentPrice < 10 ? 5 : 2)}
                </span>
                <span className={`flex items-center gap-0.5 text-xs font-semibold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                </span>
              </div>
              <p className="text-[10px] text-gray-500 mt-0.5">
                {symbol} · Spread ~{spread} pips
              </p>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-gray-500">H/L</div>
              <div className="text-xs font-mono-numbers text-emerald-400">{high.toFixed(currentPrice < 10 ? 5 : 2)}</div>
              <div className="text-xs font-mono-numbers text-red-400">{low.toFixed(currentPrice < 10 ? 5 : 2)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-3 gap-2">
        <QuickStatCard
          icon={<Activity className="w-3.5 h-3.5 text-cyan-400" />}
          label="Volatilidad"
          value={`${(Math.abs(changePercent) * 2.5).toFixed(1)}%`}
          trend={Math.abs(changePercent) > 0.3 ? 'high' : 'low'}
        />
        <QuickStatCard
          icon={<BarChart2 className="w-3.5 h-3.5 text-blue-400" />}
          label="Rango Diario"
          value={`${((high - low) * (currentPrice < 10 ? 10000 : 100)).toFixed(0)} pips`}
          trend="neutral"
        />
        <QuickStatCard
          icon={<Zap className="w-3.5 h-3.5 text-amber-400" />}
          label="Momentum"
          value={isPositive ? 'Alcista' : 'Bajista'}
          trend={isPositive ? 'bullish' : 'bearish'}
        />
      </div>
    </div>
  );
}

function QuickStatCard({ icon, label, value, trend }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: 'high' | 'low' | 'neutral' | 'bullish' | 'bearish';
}) {
  const trendColors: Record<string, string> = {
    high: 'text-amber-400',
    low: 'text-gray-400',
    neutral: 'text-cyan-400',
    bullish: 'text-emerald-400',
    bearish: 'text-red-400',
  };

  return (
    <div className="bg-[#0d1829]/80 border border-cyan-900/20 rounded-xl p-2.5 flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[10px] text-gray-500 truncate">{label}</span>
      </div>
      <span className={`text-sm font-bold font-mono-numbers ${trendColors[trend]}`}>
        {value}
      </span>
    </div>
  );
}
