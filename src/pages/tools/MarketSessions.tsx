import { useState, useEffect, useMemo } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/LanguageContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─────────── Session Data ─────────── */

interface CurrencyPair {
  pair: string;
  flag1: string;
  flag2: string;
}

interface SessionData {
  id: string;
  name: string;
  emoji: string;
  openUTC: number;   // hour UTC
  closeUTC: number;  // hour UTC
  volatility: 'low' | 'moderate' | 'high';
  liquidity: 'low' | 'moderate' | 'high';
  avgPipsRange: [number, number]; // min-max
  currencies: CurrencyPair[];
  color: string; // hsl accent
  weeklyVolatility: number[]; // Mon-Fri 0-100
  weeklyLiquidity: number[]; // Mon-Fri 0-100
}

const SESSIONS: SessionData[] = [
  {
    id: 'sydney',
    name: 'Sydney',
    emoji: '🇦🇺',
    openUTC: 22,
    closeUTC: 7,
    volatility: 'low',
    liquidity: 'moderate',
    avgPipsRange: [30, 50],
    currencies: [
      { pair: 'AUD/USD', flag1: '🇦🇺', flag2: '🇺🇸' },
      { pair: 'NZD/USD', flag1: '🇳🇿', flag2: '🇺🇸' },
      { pair: 'AUD/JPY', flag1: '🇦🇺', flag2: '🇯🇵' },
      { pair: 'USD/JPY', flag1: '🇺🇸', flag2: '🇯🇵' },
    ],
    color: '200 80% 55%',
    weeklyVolatility: [35, 40, 45, 50, 30],
    weeklyLiquidity: [45, 50, 55, 60, 40],
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    emoji: '🇯🇵',
    openUTC: 0,
    closeUTC: 9,
    volatility: 'moderate',
    liquidity: 'moderate',
    avgPipsRange: [40, 70],
    currencies: [
      { pair: 'USD/JPY', flag1: '🇺🇸', flag2: '🇯🇵' },
      { pair: 'EUR/JPY', flag1: '🇪🇺', flag2: '🇯🇵' },
      { pair: 'GBP/JPY', flag1: '🇬🇧', flag2: '🇯🇵' },
      { pair: 'AUD/JPY', flag1: '🇦🇺', flag2: '🇯🇵' },
    ],
    color: '330 70% 60%',
    weeklyVolatility: [50, 55, 60, 65, 45],
    weeklyLiquidity: [55, 60, 65, 70, 50],
  },
  {
    id: 'london',
    name: 'London',
    emoji: '🇬🇧',
    openUTC: 7,
    closeUTC: 16,
    volatility: 'high',
    liquidity: 'high',
    avgPipsRange: [80, 150],
    currencies: [
      { pair: 'EUR/USD', flag1: '🇪🇺', flag2: '🇺🇸' },
      { pair: 'GBP/USD', flag1: '🇬🇧', flag2: '🇺🇸' },
      { pair: 'EUR/GBP', flag1: '🇪🇺', flag2: '🇬🇧' },
      { pair: 'USD/CHF', flag1: '🇺🇸', flag2: '🇨🇭' },
    ],
    color: '45 80% 55%',
    weeklyVolatility: [75, 80, 85, 80, 65],
    weeklyLiquidity: [80, 85, 90, 85, 70],
  },
  {
    id: 'frankfurt',
    name: 'Frankfurt',
    emoji: '🇩🇪',
    openUTC: 7,
    closeUTC: 16,
    volatility: 'high',
    liquidity: 'high',
    avgPipsRange: [70, 130],
    currencies: [
      { pair: 'EUR/USD', flag1: '🇪🇺', flag2: '🇺🇸' },
      { pair: 'EUR/GBP', flag1: '🇪🇺', flag2: '🇬🇧' },
      { pair: 'EUR/JPY', flag1: '🇪🇺', flag2: '🇯🇵' },
      { pair: 'EUR/CHF', flag1: '🇪🇺', flag2: '🇨🇭' },
    ],
    color: '30 80% 50%',
    weeklyVolatility: [70, 78, 82, 78, 60],
    weeklyLiquidity: [75, 82, 88, 82, 65],
  },
  {
    id: 'newyork',
    name: 'New York',
    emoji: '🇺🇸',
    openUTC: 13,
    closeUTC: 22,
    volatility: 'high',
    liquidity: 'high',
    avgPipsRange: [80, 140],
    currencies: [
      { pair: 'EUR/USD', flag1: '🇪🇺', flag2: '🇺🇸' },
      { pair: 'GBP/USD', flag1: '🇬🇧', flag2: '🇺🇸' },
      { pair: 'USD/CAD', flag1: '🇺🇸', flag2: '🇨🇦' },
      { pair: 'USD/JPY', flag1: '🇺🇸', flag2: '🇯🇵' },
    ],
    color: '140 60% 50%',
    weeklyVolatility: [80, 85, 90, 85, 70],
    weeklyLiquidity: [85, 90, 95, 90, 75],
  },
];

/* ─────────── Helpers ─────────── */

function formatHour(utcHour: number): string {
  const ampm = utcHour >= 12 ? 'PM' : 'AM';
  const h = utcHour % 12 || 12;
  return `${String(h).padStart(2, '0')}:00 ${ampm}`;
}

function getSessionStatus(session: SessionData): {
  isOpen: boolean;
  progressPercent: number;
  timeRemaining: string;
} {
  const now = new Date();
  const utcH = now.getUTCHours();
  const utcM = now.getUTCMinutes();
  const currentMinutes = utcH * 60 + utcM;

  let openMin = session.openUTC * 60;
  let closeMin = session.closeUTC * 60;

  // Handle overnight sessions (e.g. Sydney 22:00 - 07:00)
  const isOvernight = session.openUTC > session.closeUTC;

  let isOpen: boolean;
  let elapsed: number;
  let totalDuration: number;

  if (isOvernight) {
    totalDuration = (24 * 60 - openMin) + closeMin;
    isOpen = currentMinutes >= openMin || currentMinutes < closeMin;
    if (isOpen) {
      elapsed = currentMinutes >= openMin
        ? currentMinutes - openMin
        : (24 * 60 - openMin) + currentMinutes;
    } else {
      elapsed = 0;
    }
  } else {
    totalDuration = closeMin - openMin;
    isOpen = currentMinutes >= openMin && currentMinutes < closeMin;
    elapsed = isOpen ? currentMinutes - openMin : 0;
  }

  const progressPercent = isOpen ? Math.round((elapsed / totalDuration) * 100) : 0;
  const remaining = isOpen ? totalDuration - elapsed : 0;
  const remH = Math.floor(remaining / 60);
  const remM = remaining % 60;

  let timeRemaining: string;
  if (!isOpen) {
    // Time until open
    let untilOpen: number;
    if (isOvernight) {
      untilOpen = currentMinutes < openMin
        ? openMin - currentMinutes
        : (24 * 60 - currentMinutes) + openMin; // This case shouldn't happen if not open for overnight
    } else {
      untilOpen = currentMinutes < openMin
        ? openMin - currentMinutes
        : (24 * 60 - currentMinutes) + openMin;
    }
    const uH = Math.floor(untilOpen / 60);
    const uM = untilOpen % 60;
    timeRemaining = `${String(uH).padStart(2, '0')}:${String(uM).padStart(2, '0')}`;
  } else {
    timeRemaining = `${String(remH).padStart(2, '0')}:${String(remM).padStart(2, '0')}`;
  }

  return { isOpen, progressPercent, timeRemaining };
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const LEVEL_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  low: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Low' },
  moderate: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Moderate' },
  high: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'High' },
};

/* ─────────── Components ─────────── */

function PipsGauge({ range, color }: { range: [number, number]; color: string }) {
  const avg = Math.round((range[0] + range[1]) / 2);
  const maxPips = 200;
  const percent = Math.min((avg / maxPips) * 100, 100);
  const angle = -90 + (percent / 100) * 180; // -90 to 90 degrees

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Average Pips</span>
      <div className="relative w-20 h-12 overflow-hidden">
        {/* Gauge background arc */}
        <svg viewBox="0 0 100 55" className="w-full h-full">
          {/* Background arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="hsl(var(--muted) / 0.3)"
            strokeWidth="6"
            strokeLinecap="round"
          />
          {/* Colored arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={`hsl(${color})`}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${percent * 1.26} 126`}
          />
          {/* Needle */}
          <line
            x1="50"
            y1="50"
            x2={50 + 30 * Math.cos((angle * Math.PI) / 180)}
            y2={50 + 30 * Math.sin((angle * Math.PI) / 180)}
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="50" cy="50" r="3" fill="white" />
          {/* Scale labels */}
          <text x="8" y="54" className="text-[7px]" fill="hsl(var(--muted-foreground))" textAnchor="start">20</text>
          <text x="35" y="18" className="text-[7px]" fill="hsl(var(--muted-foreground))" textAnchor="middle">50</text>
          <text x="65" y="18" className="text-[7px]" fill="hsl(var(--muted-foreground))" textAnchor="middle">100</text>
          <text x="92" y="54" className="text-[7px]" fill="hsl(var(--muted-foreground))" textAnchor="end">200</text>
        </svg>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs font-bold" style={{ color: `hsl(${color})` }}>{avg}</span>
        <span className="text-[9px] text-muted-foreground">Pips</span>
      </div>
      <span className="text-[8px] text-muted-foreground">{range[0]} - {range[1]}</span>
    </div>
  );
}

function LevelBadge({ level }: { level: 'low' | 'moderate' | 'high' }) {
  const config = LEVEL_COLORS[level];
  return (
    <span className={cn('px-2 py-0.5 rounded text-[9px] font-bold uppercase', config.bg, config.text)}>
      {config.label}
    </span>
  );
}

function WeeklyChart({
  volatilityData,
  liquidityData,
  color,
}: {
  volatilityData: number[];
  liquidityData: number[];
  color: string;
}) {
  const maxH = 80;
  return (
    <div className="mt-3">
      <div className="flex items-end gap-1 justify-between h-24 px-1">
        {DAYS.map((day, i) => {
          const volH = (volatilityData[i] / 100) * maxH;
          const liqH = (liquidityData[i] / 100) * maxH;
          return (
            <div key={day} className="flex flex-col items-center gap-0.5 flex-1">
              <div className="flex items-end gap-[2px] h-20">
                {/* Volatility bar */}
                <div className="relative w-3 rounded-t overflow-hidden" style={{ height: `${volH}%` }}>
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(to top, hsl(${color} / 0.3), hsl(${color} / 0.8))`,
                    }}
                  />
                </div>
                {/* Liquidity bar */}
                <div className="relative w-3 rounded-t overflow-hidden" style={{ height: `${liqH}%` }}>
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(to top, hsl(45 80% 55% / 0.3), hsl(45 80% 55% / 0.8))`,
                    }}
                  />
                </div>
              </div>
              <span className="text-[8px] text-muted-foreground">{day}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 justify-center mt-1">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm" style={{ background: `hsl(${color})` }} />
          <span className="text-[8px] text-muted-foreground">Volatility</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-yellow-500" />
          <span className="text-[8px] text-muted-foreground">Liquidity</span>
        </div>
      </div>
    </div>
  );
}

function SessionCard({ session }: { session: SessionData }) {
  const { isOpen, progressPercent, timeRemaining } = useMemo(() => getSessionStatus(session), [session]);

  // Re-render every minute
  const [, setTick] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(iv);
  }, []);

  const status = getSessionStatus(session);

  return (
    <div
      className="relative rounded-xl border overflow-hidden"
      style={{
        borderColor: `hsl(${session.color} / 0.3)`,
        background: 'radial-gradient(ellipse at center 30%, hsl(200 100% 10%) 0%, hsl(210 100% 5%) 100%)',
      }}
    >
      {/* Top glow */}
      <div
        className="absolute top-0 left-[10%] right-[10%] h-[1px]"
        style={{ background: `radial-gradient(ellipse at center, hsl(${session.color} / 0.6) 0%, transparent 70%)` }}
      />

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-lg font-bold text-foreground">
            Sesión {session.name}
          </h2>
        </div>

        {/* Progress / Status */}
        <div className="flex flex-col items-center gap-1.5">
          {status.isOpen && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded"
              style={{ background: `hsl(${session.color} / 0.2)`, color: `hsl(${session.color})` }}
            >
              {status.progressPercent}%
            </span>
          )}
          <div
            className="w-full rounded-full h-3 relative overflow-hidden"
            style={{ background: 'hsl(var(--muted) / 0.2)' }}
          >
            {status.isOpen ? (
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, hsl(${session.color} / 0.4), hsl(${session.color}))`,
                  boxShadow: `0 0 12px hsl(${session.color} / 0.5)`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${status.progressPercent}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <span className="text-[8px] text-muted-foreground font-medium">CERRADA</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px]">{status.isOpen ? '⏱' : '🔒'}</span>
            <span className="text-xs font-bold" style={{ color: status.isOpen ? `hsl(${session.color})` : undefined }}>
              {status.isOpen
                ? `Cierre en - ${status.timeRemaining}`
                : `Abre en - ${status.timeRemaining}`
              }
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-3 gap-2">
          {/* Left - Schedule & Levels */}
          <div className="col-span-1 space-y-2 border rounded-lg p-2" style={{ borderColor: `hsl(${session.color} / 0.15)` }}>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-foreground">Open</span>
                <span className="text-[10px] font-mono text-muted-foreground">{formatHour(session.openUTC)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-foreground">Closed</span>
                <span className="text-[10px] font-mono" style={{ color: `hsl(${session.color})` }}>{formatHour(session.closeUTC)}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-semibold text-foreground">Volatility</span>
                <LevelBadge level={session.volatility} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-semibold text-foreground">Liquidity</span>
                <LevelBadge level={session.liquidity} />
              </div>
            </div>
          </div>

          {/* Center - Gauge */}
          <div className="col-span-1 flex items-center justify-center">
            <PipsGauge range={session.avgPipsRange} color={session.color} />
          </div>

          {/* Right - Currencies */}
          <div className="col-span-1 space-y-1">
            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block text-center">Divisa</span>
            <div className="grid grid-cols-2 gap-1">
              {session.currencies.map(c => (
                <div
                  key={c.pair}
                  className="flex flex-col items-center gap-0.5 p-1 rounded-lg"
                  style={{ background: `hsl(${session.color} / 0.06)` }}
                >
                  <div className="flex items-center -space-x-1">
                    <span className="text-sm">{c.flag1}</span>
                    <span className="text-sm">{c.flag2}</span>
                  </div>
                  <span className="text-[7px] font-bold text-muted-foreground leading-none">{c.pair}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Weekly Chart */}
        <WeeklyChart
          volatilityData={session.weeklyVolatility}
          liquidityData={session.weeklyLiquidity}
          color={session.color}
        />
      </div>
    </div>
  );
}

/* ─────────── Main Page ─────────── */

export default function MarketSessions() {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);

  const goNext = () => setActiveIndex(i => Math.min(i + 1, SESSIONS.length - 1));
  const goPrev = () => setActiveIndex(i => Math.max(i - 1, 0));

  return (
    <PageShell>
      <Header />
      <main className="container py-4 max-w-lg mx-auto">
        {/* Session tabs */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-hide">
          {SESSIONS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActiveIndex(i)}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium whitespace-nowrap transition-all shrink-0',
                i === activeIndex
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/40'
              )}
            >
              <span>{s.emoji}</span>
              {s.name}
            </button>
          ))}
        </div>

        {/* Card carousel */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={SESSIONS[activeIndex].id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            >
              <SessionCard session={SESSIONS[activeIndex]} />
            </motion.div>
          </AnimatePresence>

          {/* Nav arrows */}
          {activeIndex > 0 && (
            <button
              onClick={goPrev}
              className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/80 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-10"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {activeIndex < SESSIONS.length - 1 && (
            <button
              onClick={goNext}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/80 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-10"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dots indicator */}
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {SESSIONS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActiveIndex(i)}
              className={cn(
                'w-1.5 h-1.5 rounded-full transition-all',
                i === activeIndex ? 'bg-primary w-4' : 'bg-muted-foreground/30'
              )}
            />
          ))}
        </div>
      </main>
    </PageShell>
  );
}
