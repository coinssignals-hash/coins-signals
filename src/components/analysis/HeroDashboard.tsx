import { Activity, Clock, TrendingUp, TrendingDown, BarChart2, Zap, ChevronRight, ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useMultiPairPrices, MultiPairQuote } from '@/hooks/useMultiPairPrices';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import bullBg from '@/assets/brand-logo-bg.svg';
import { useTranslation } from '@/i18n/LanguageContext';

const CURRENCY_FLAGS: Record<string, string> = {
  USD: "us", EUR: "eu", GBP: "gb", JPY: "jp", AUD: "au", CAD: "ca",
  CHF: "ch", NZD: "nz", CNY: "cn", SGD: "sg", HKD: "hk", XAU: "us",
  BTC: "us",
};

interface HeroDashboardProps {
  currentPrice: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  symbol: string;
  loading: boolean;
  isRealtimeConnected: boolean;
  onSelectPair?: (pair: string) => void;
}

function getActiveSession(t: (k: string) => string): {name: string;emoji: string;color: string;} {
  const utcHour = new Date().getUTCHours();
  if (utcHour >= 0 && utcHour < 7) return { name: t('analysis_session_asia'), emoji: '🌏', color: 'text-amber-400' };
  if (utcHour >= 7 && utcHour < 12) return { name: t('analysis_session_europe'), emoji: '🌍', color: 'text-cyan-400' };
  if (utcHour >= 12 && utcHour < 17) return { name: t('analysis_session_ny_eu'), emoji: '🌎🌍', color: 'text-emerald-400' };
  if (utcHour >= 17 && utcHour < 21) return { name: t('analysis_session_new_york'), emoji: '🌎', color: 'text-blue-400' };
  return { name: t('analysis_session_asia_pre'), emoji: '🌏', color: 'text-amber-400' };
}

function getGreeting(t: (k: string) => string): string {
  const hour = new Date().getHours();
  if (hour < 6) return t('analysis_greeting_evening');
  if (hour < 12) return t('analysis_greeting_morning');
  if (hour < 19) return t('analysis_greeting_afternoon');
  return t('analysis_greeting_evening');
}

const pairFlags: Record<string, string> = {
  'EUR/USD': '🇪🇺🇺🇸',
  'GBP/USD': '🇬🇧🇺🇸',
  'USD/JPY': '🇺🇸🇯🇵',
  'AUD/USD': '🇦🇺🇺🇸',
  'USD/CAD': '🇺🇸🇨🇦',
  'USD/CHF': '🇺🇸🇨🇭'
};

function formatPrice(price: number): string {
  if (price > 100) return price.toFixed(2);
  if (price > 10) return price.toFixed(4);
  return price.toFixed(5);
}

export function HeroDashboard({
  currentPrice, change, changePercent, high, low, symbol, loading, isRealtimeConnected, onSelectPair
}: HeroDashboardProps) {
  const { t } = useTranslation();
  const session = useMemo(() => getActiveSession(t), [t]);
  const greeting = useMemo(() => getGreeting(t), [t]);
  const isPositive = change >= 0;
  const [base, quote] = symbol.split('/');
  const { quotes } = useMultiPairPrices();
  const [marketExpanded, setMarketExpanded] = useState(true);

  const utcTime = new Date().toLocaleTimeString('es-ES', {
    hour: '2-digit', minute: '2-digit', timeZone: 'UTC'
  });

  const spread = useMemo(() => {
    return (Math.random() * 2 + 0.5).toFixed(1);
  }, [currentPrice]);

  // Separate active pair from other pairs
  const otherPairs = quotes.filter((q) => q.symbol !== symbol);

  return (
    <motion.div
      className="space-y-3"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Hero card - Signal style */}
      <motion.div
        className="relative w-full rounded-xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="relative rounded-xl border border-cyan-800/30 overflow-hidden"
          style={{
            background:
            'radial-gradient(ellipse at center 40%, hsl(200, 100%, 15%) 0%, hsl(205, 100%, 7%) 70%, hsl(210, 100%, 5%) 100%)'
          }}>

          {/* Bull background overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url(${bullBg})`,
              backgroundSize: '55%',
              backgroundPosition: '65% center',
              backgroundRepeat: 'no-repeat',
              opacity: 0.3,
              mixBlendMode: 'screen'
            }} />

          {/* Top glow line */}
          <div
            className="absolute top-0 left-[15%] right-[15%] h-[1px]"
            style={{ background: 'radial-gradient(ellipse at center, hsl(200, 80%, 55%) 0%, transparent 70%)' }} />

          <div className="relative z-10 p-3">
            {/* Greeting + session */}
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-extrabold text-white truncate">{greeting}, Trader 👋</h1>
                <p className="text-[10px] text-cyan-300/60 mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{utcTime} UTC · {session.emoji} <span className={session.color}>{session.name}</span></span>
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                {isRealtimeConnected ?
                <span className="flex items-center gap-1 text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live
                  </span> :
                <span className="flex items-center gap-1 text-[9px] text-gray-500 bg-gray-500/10 border border-gray-500/20 px-1.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                    Offline
                  </span>
                }
              </div>
            </div>

            {/* Active pair highlight with FlagCDN flags */}
            <div
              className="relative flex items-center gap-3 rounded-lg p-2.5 overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, hsl(210, 100%, 8%) 0%, hsl(200, 80%, 12%) 100%)',
                border: '1px solid hsla(200, 60%, 35%, 0.3)'
              }}>
              <div
                className="absolute top-0 left-[10%] right-[10%] h-[1px]"
                style={{ background: 'radial-gradient(ellipse at center, hsl(195, 100%, 54%) 0%, transparent 70%)' }} />

              {/* Flag icons */}
              <div className="relative w-16 h-11 flex-shrink-0">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full overflow-hidden border-2 border-white/20 shadow-lg z-10">
                  <img src={`https://flagcdn.com/w160/${CURRENCY_FLAGS[base] ?? 'un'}.png`} alt={base} className="w-full h-full object-cover" />
                </div>
                <div className="absolute left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full overflow-hidden border-2 border-white/20 shadow-lg z-20">
                  <img src={`https://flagcdn.com/w160/${CURRENCY_FLAGS[quote] ?? 'un'}.png`} alt={quote} className="w-full h-full object-cover" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-xl font-extrabold font-mono-numbers text-white tracking-wide">
                    {loading ? '...' : formatPrice(currentPrice)}
                  </span>
                  <span className={`flex items-center gap-0.5 text-xs font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                  </span>
                </div>
                <p className="text-[10px] text-cyan-300/50 mt-0.5 font-medium truncate">
                  {symbol} · Spread ~{spread} pips
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[9px] text-cyan-300/40 font-medium uppercase tracking-wider">H/L</div>
                <div className="text-xs font-bold font-mono-numbers text-emerald-400">{formatPrice(high)}</div>
                <div className="text-xs font-bold font-mono-numbers text-red-400">{formatPrice(low)}</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick stats row */}
      <motion.div
        className="grid grid-cols-3 gap-2"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } } }}
      >
        <motion.div variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}>
          <QuickStatCard
            icon={<Activity className="w-3.5 h-3.5 text-cyan-400" />}
            label="Volatilidad"
            value={`${(Math.abs(changePercent) * 2.5).toFixed(1)}%`}
            trend={Math.abs(changePercent) > 0.3 ? 'high' : 'low'} />
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}>
          <QuickStatCard
            icon={<BarChart2 className="w-3.5 h-3.5 text-blue-400" />}
            label="Rango Diario"
            value={`${((high - low) * (currentPrice < 10 ? 10000 : 100)).toFixed(0)} pips`}
            trend="neutral" />
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}>
          <QuickStatCard
            icon={<Zap className="w-3.5 h-3.5 text-amber-400" />}
            label="Momentum"
            value={isPositive ? 'Alcista' : 'Bajista'}
            trend={isPositive ? 'bullish' : 'bearish'} />
        </motion.div>
      </motion.div>

      {/* Market Overview - Multiple Pairs */}
      























    </motion.div>);

}

function MarketPairRow({ pair, isSelected, onClick



}: {pair: MultiPairQuote;isSelected: boolean;onClick: () => void;}) {
  const isPositive = pair.changePercent >= 0;
  const flags = pairFlags[pair.symbol] || '';

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors text-left',
        isSelected ? 'bg-cyan-500/10' : 'hover:bg-[#0a1628]/60 active:bg-cyan-500/5'
      )}>

      <span className="text-sm">{flags}</span>
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium text-white/80">{pair.symbol}</span>
      </div>
      <div className="text-right flex items-center gap-2">
        <span className="text-xs font-mono-numbers text-white/70">
          {pair.loading ? '---' : formatPrice(pair.price)}
        </span>
        <span className={cn(
          'text-[10px] font-bold font-mono-numbers px-1.5 py-0.5 rounded-md min-w-[52px] text-center',
          isPositive ?
          'text-emerald-400 bg-emerald-500/10' :
          'text-red-400 bg-red-500/10'
        )}>
          {pair.loading ? '...' : `${isPositive ? '+' : ''}${pair.changePercent.toFixed(2)}%`}
        </span>
        <ChevronRight className="w-3 h-3 text-gray-600" />
      </div>
    </button>);

}

function QuickStatCard({ icon, label, value, trend




}: {icon: React.ReactNode;label: string;value: string;trend: 'high' | 'low' | 'neutral' | 'bullish' | 'bearish';}) {
  const trendColors: Record<string, string> = {
    high: 'text-amber-400',
    low: 'text-gray-400',
    neutral: 'text-cyan-400',
    bullish: 'text-emerald-400',
    bearish: 'text-red-400'
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
    </div>);

}