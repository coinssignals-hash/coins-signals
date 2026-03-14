import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/LanguageContext';
import { ChevronLeft, ChevronRight, Wifi, WifiOff, RefreshCw, Loader2, BarChart3, Bell, BellOff, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

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
  openUTC: number;
  closeUTC: number;
  volatility: 'low' | 'moderate' | 'high';
  liquidity: 'low' | 'moderate' | 'high';
  avgPipsRange: [number, number];
  currencies: CurrencyPair[];
  color: string;
  weeklyVolatility: number[];
  weeklyLiquidity: number[];
}

const SESSIONS: SessionData[] = [
  {
    id: 'sydney', name: 'Sydney', emoji: '🇦🇺', openUTC: 22, closeUTC: 7,
    volatility: 'low', liquidity: 'moderate', avgPipsRange: [30, 50],
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
    id: 'tokyo', name: 'Tokyo', emoji: '🇯🇵', openUTC: 0, closeUTC: 9,
    volatility: 'moderate', liquidity: 'moderate', avgPipsRange: [40, 70],
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
    id: 'london', name: 'London', emoji: '🇬🇧', openUTC: 7, closeUTC: 16,
    volatility: 'high', liquidity: 'high', avgPipsRange: [80, 150],
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
    id: 'frankfurt', name: 'Frankfurt', emoji: '🇩🇪', openUTC: 7, closeUTC: 16,
    volatility: 'high', liquidity: 'high', avgPipsRange: [70, 130],
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
    id: 'newyork', name: 'New York', emoji: '🇺🇸', openUTC: 13, closeUTC: 22,
    volatility: 'high', liquidity: 'high', avgPipsRange: [80, 140],
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

/* ─────────── Live Data Hook ─────────── */

interface LiveQuote {
  pair: string;
  bid: number;
  ask: number;
  spread: number;
  price: number;
  change: number;
  volume: number;
  dailyRange: number; // in pips
  loading: boolean;
  error: boolean;
  updatedAt: number;
}

interface SessionVolume {
  totalVolume: number;
  avgDailyRange: number;
  pairVolumes: { pair: string; volume: number; range: number }[];
  loading: boolean;
}

const liveCache = new Map<string, { bid: number; ask: number; price: number; volume: number; high: number; low: number; ts: number }>();
const aggCache = new Map<string, { volume: number; high: number; low: number; close: number; ts: number }>();
const QUOTE_CACHE_TTL = 55_000;

/* Spread history buffer — stores up to 12 snapshots (~2h at 10s ticks) per session */
const MAX_HISTORY = 12;
const spreadHistory: number[][] = Array.from({ length: 5 }, () => []);
const AGG_CACHE_TTL = 120_000; // aggregates change less often
const POLL_INTERVAL = 60_000;

// Global in-flight tracker to deduplicate concurrent requests for the same symbol
const inFlight = new Map<string, Promise<any>>();

function deduplicatedInvoke(key: string, body: Record<string, any>): Promise<any> {
  const existing = inFlight.get(key);
  if (existing) return existing;
  const p = supabase.functions.invoke('realtime-market', { body })
    .finally(() => inFlight.delete(key));
  inFlight.set(key, p);
  return p;
}

function useSessionLiveData(session: SessionData, isActive: boolean) {
  const [quotes, setQuotes] = useState<LiveQuote[]>(
    session.currencies.map(c => ({
      pair: c.pair, bid: 0, ask: 0, spread: 0, price: 0, change: 0, volume: 0, dailyRange: 0,
      loading: true, error: false, updatedAt: 0,
    }))
  );
  const [isConnected, setIsConnected] = useState(false);
  const [lastFetch, setLastFetch] = useState(0);
  const [sessionVolume, setSessionVolume] = useState<SessionVolume>({
    totalVolume: 0, avgDailyRange: 0, pairVolumes: [], loading: true,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchQuotes = useCallback(async () => {
    const pairs = session.currencies.map(c => {
      const clean = c.pair.replace('/', '');
      return { display: c.pair, symbol: `C:${clean}` };
    });

    // Stagger requests: fetch pairs sequentially in small batches of 2
    const results: PromiseSettledResult<any>[] = [];
    for (let i = 0; i < pairs.length; i += 2) {
      const batch = pairs.slice(i, i + 2);
      const batchResults = await Promise.allSettled(
        batch.map(async (p) => {
          // Check full cache first
          const cached = liveCache.get(p.symbol);
          if (cached && Date.now() - cached.ts < QUOTE_CACHE_TTL) {
            return { pair: p.display, ...cached, fromCache: true };
          }

          // Always fetch quote; only fetch aggregates if agg cache is stale
          const needAgg = (() => {
            const ac = aggCache.get(p.symbol);
            return !ac || Date.now() - ac.ts > AGG_CACHE_TTL;
          })();

          const promises: Promise<any>[] = [
            deduplicatedInvoke(`quote:${p.symbol}`, { symbol: p.symbol, type: 'quote' }),
          ];
          if (needAgg) {
            promises.push(
              deduplicatedInvoke(`agg:${p.symbol}`, { symbol: p.symbol, type: 'aggregates' })
            );
          }

          const [quoteRes, aggRes] = await Promise.allSettled(promises);

          let bid = 0, ask = 0, price = 0, volume = 0, high = 0, low = 0;

          // Process quote
          if (quoteRes.status === 'fulfilled' && !quoteRes.value.error) {
            const data = quoteRes.value.data;
            if (data?.last) {
              bid = data.last.bid || 0;
              ask = data.last.ask || 0;
              price = (bid + ask) / 2;
            } else if (data?.price) {
              price = data.price;
              const isJPY = p.display.includes('JPY');
              const spreadPips = isJPY ? 0.02 : 0.00015;
              bid = price - spreadPips / 2;
              ask = price + spreadPips / 2;
            } else if (data?.results?.[0]) {
              price = data.results[0].c;
              bid = data.results[0].l || price;
              ask = data.results[0].h || price;
            }
          }

          // Process aggregates (fresh or cached)
          if (aggRes && aggRes.status === 'fulfilled' && !aggRes.value.error) {
            const aggData = aggRes.value.data;
            if (aggData?.results?.[0]) {
              const r = aggData.results[0];
              volume = r.v || 0;
              high = r.h || 0;
              low = r.l || 0;
              if (price === 0 && r.c) price = r.c;
              aggCache.set(p.symbol, { volume, high, low, close: r.c || 0, ts: Date.now() });
            } else if (aggData?.price) {
              if (price === 0) price = aggData.price;
            }
          } else {
            // Use cached aggregates
            const ac = aggCache.get(p.symbol);
            if (ac) {
              volume = ac.volume;
              high = ac.high;
              low = ac.low;
              if (price === 0 && ac.close) price = ac.close;
            }
          }

          if (price > 0) {
            liveCache.set(p.symbol, { bid, ask, price, volume, high, low, ts: Date.now() });
            return { pair: p.display, bid, ask, price, volume, high, low, ts: Date.now(), fromCache: false };
          }

          throw new Error('No price data');
        })
      );
      results.push(...batchResults);
      // Small delay between batches to avoid rate limiting
      if (i + 2 < pairs.length) await new Promise(r => setTimeout(r, 300));
    }

    const pairVolumes: { pair: string; volume: number; range: number }[] = [];

    const newQuotes: LiveQuote[] = results.map((r, i) => {
      const pair = pairs[i].display;
      const isJPY = pair.includes('JPY');
      const pipMultiplier = isJPY ? 100 : 10000;

      if (r.status === 'fulfilled') {
        const { bid, ask, price, volume, high, low } = r.value;
        const spread = Math.abs(ask - bid) * pipMultiplier;
        const dailyRange = Math.abs(high - low) * pipMultiplier;
        pairVolumes.push({ pair, volume, range: dailyRange });
        return {
          pair, bid, ask, price, volume,
          spread: Math.round(spread * 10) / 10,
          dailyRange: Math.round(dailyRange * 10) / 10,
          change: 0,
          loading: false, error: false,
          updatedAt: Date.now(),
        };
      }
      const cached = liveCache.get(pairs[i].symbol);
      if (cached) {
        const spread = Math.abs(cached.ask - cached.bid) * pipMultiplier;
        const dailyRange = Math.abs(cached.high - cached.low) * pipMultiplier;
        pairVolumes.push({ pair, volume: cached.volume, range: dailyRange });
        return {
          pair, bid: cached.bid, ask: cached.ask, price: cached.price,
          volume: cached.volume,
          spread: Math.round(spread * 10) / 10,
          dailyRange: Math.round(dailyRange * 10) / 10,
          change: 0,
          loading: false, error: true,
          updatedAt: cached.ts,
        };
      }
      return {
        pair, bid: 0, ask: 0, spread: 0, price: 0, change: 0, volume: 0, dailyRange: 0,
        loading: false, error: true, updatedAt: 0,
      };
    });

    setQuotes(newQuotes);
    setIsConnected(newQuotes.some(q => !q.error && q.price > 0));
    setLastFetch(Date.now());

    const totalVolume = pairVolumes.reduce((s, p) => s + p.volume, 0);
    const validRanges = pairVolumes.filter(p => p.range > 0);
    const avgDailyRange = validRanges.length > 0
      ? validRanges.reduce((s, p) => s + p.range, 0) / validRanges.length
      : 0;
    setSessionVolume({
      totalVolume, avgDailyRange, pairVolumes, loading: false,
    });
  }, [session]);

  useEffect(() => {
    if (!isActive) return;
    fetchQuotes();
    intervalRef.current = setInterval(fetchQuotes, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, fetchQuotes]);

  useEffect(() => {
    const handler = () => {
      if (document.hidden) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else if (isActive) {
        fetchQuotes();
        intervalRef.current = setInterval(fetchQuotes, POLL_INTERVAL);
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [isActive, fetchQuotes]);

  return { quotes, isConnected, lastFetch, sessionVolume, refetch: fetchQuotes };
}

/* ─────────── Helpers ─────────── */

function formatHour(utcHour: number): string {
  const ampm = utcHour >= 12 ? 'PM' : 'AM';
  const h = utcHour % 12 || 12;
  return `${String(h).padStart(2, '0')}:00 ${ampm}`;
}

function formatPrice(price: number, pair: string): string {
  if (price === 0) return '—';
  const isJPY = pair.includes('JPY');
  return price.toFixed(isJPY ? 2 : 4);
}

function getSessionStatus(session: SessionData) {
  const now = new Date();
  const utcH = now.getUTCHours();
  const utcM = now.getUTCMinutes();
  const currentMinutes = utcH * 60 + utcM;
  const openMin = session.openUTC * 60;
  const closeMin = session.closeUTC * 60;
  const isOvernight = session.openUTC > session.closeUTC;

  let isOpen: boolean;
  let elapsed: number;
  let totalDuration: number;

  if (isOvernight) {
    totalDuration = (24 * 60 - openMin) + closeMin;
    isOpen = currentMinutes >= openMin || currentMinutes < closeMin;
    elapsed = isOpen
      ? (currentMinutes >= openMin ? currentMinutes - openMin : (24 * 60 - openMin) + currentMinutes)
      : 0;
  } else {
    totalDuration = closeMin - openMin;
    isOpen = currentMinutes >= openMin && currentMinutes < closeMin;
    elapsed = isOpen ? currentMinutes - openMin : 0;
  }

  const progressPercent = isOpen ? Math.round((elapsed / totalDuration) * 100) : 0;
  const remaining = isOpen ? totalDuration - elapsed : 0;

  let timeRemaining: string;
  if (!isOpen) {
    let untilOpen = currentMinutes < openMin
      ? openMin - currentMinutes
      : (24 * 60 - currentMinutes) + openMin;
    const uH = Math.floor(untilOpen / 60);
    const uM = untilOpen % 60;
    timeRemaining = `${String(uH).padStart(2, '0')}:${String(uM).padStart(2, '0')}`;
  } else {
    const remH = Math.floor(remaining / 60);
    const remM = remaining % 60;
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

function PipsGauge({ range, color, liveSpread }: { range: [number, number]; color: string; liveSpread?: number }) {
  const avg = liveSpread != null && liveSpread > 0 ? Math.round(liveSpread) : Math.round((range[0] + range[1]) / 2);
  const maxPips = 200;
  const percent = Math.min((avg / maxPips) * 100, 100);
  const angle = -90 + (percent / 100) * 180;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Average Pips</span>
      <div className="relative w-20 h-12 overflow-hidden">
        <svg viewBox="0 0 100 55" className="w-full h-full">
          <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="hsl(var(--muted) / 0.3)" strokeWidth="6" strokeLinecap="round" />
          <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke={`hsl(${color})`} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${percent * 1.26} 126`} />
          <line x1="50" y1="50" x2={50 + 30 * Math.cos((angle * Math.PI) / 180)} y2={50 + 30 * Math.sin((angle * Math.PI) / 180)} stroke="white" strokeWidth="2" strokeLinecap="round" />
          <circle cx="50" cy="50" r="3" fill="white" />
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

function LiveDataPanel({ quotes, isConnected, color, onRefresh }: {
  quotes: LiveQuote[];
  isConnected: boolean;
  color: string;
  onRefresh: () => void;
}) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => setRefreshing(false), 500);
  };

  const avgSpread = quotes.filter(q => q.spread > 0).reduce((sum, q) => sum + q.spread, 0) /
    (quotes.filter(q => q.spread > 0).length || 1);

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {isConnected ? (
            <Wifi className="w-3 h-3 text-green-400" />
          ) : (
            <WifiOff className="w-3 h-3 text-yellow-500" />
          )}
          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: isConnected ? 'hsl(140 60% 50%)' : 'hsl(45 80% 55%)' }}>
            {isConnected ? 'LIVE' : 'OFFLINE'}
          </span>
          <span className="text-[8px] text-muted-foreground">
            Spread avg: <span className="font-bold" style={{ color: `hsl(${color})` }}>{avgSpread.toFixed(1)}p</span>
          </span>
        </div>
        <button
          onClick={handleRefresh}
          className="p-1 rounded hover:bg-muted/20 transition-colors"
          disabled={refreshing}
        >
          <RefreshCw className={cn('w-3 h-3 text-muted-foreground', refreshing && 'animate-spin')} />
        </button>
      </div>

      {/* Quotes Table */}
      <div className="rounded-lg border overflow-hidden" style={{ borderColor: `hsl(${color} / 0.15)` }}>
        {/* Table header */}
        <div className="grid grid-cols-4 gap-0 px-2 py-1" style={{ background: `hsl(${color} / 0.08)` }}>
          <span className="text-[8px] font-bold text-muted-foreground uppercase">Par</span>
          <span className="text-[8px] font-bold text-muted-foreground uppercase text-right">Bid</span>
          <span className="text-[8px] font-bold text-muted-foreground uppercase text-right">Ask</span>
          <span className="text-[8px] font-bold text-muted-foreground uppercase text-right">Spread</span>
        </div>
        {quotes.map((q, i) => (
          <div
            key={q.pair}
            className={cn(
              'grid grid-cols-4 gap-0 px-2 py-1.5 items-center',
              i < quotes.length - 1 && 'border-b'
            )}
            style={{ borderColor: `hsl(${color} / 0.08)` }}
          >
            <span className="text-[9px] font-bold text-foreground">{q.pair}</span>
            {q.loading ? (
              <>
                <span className="text-right"><Loader2 className="w-2.5 h-2.5 animate-spin text-muted-foreground inline" /></span>
                <span className="text-right"><Loader2 className="w-2.5 h-2.5 animate-spin text-muted-foreground inline" /></span>
                <span className="text-right"><Loader2 className="w-2.5 h-2.5 animate-spin text-muted-foreground inline" /></span>
              </>
            ) : q.error && q.price === 0 ? (
              <>
                <span className="text-[9px] text-muted-foreground text-right">—</span>
                <span className="text-[9px] text-muted-foreground text-right">—</span>
                <span className="text-[9px] text-muted-foreground text-right">—</span>
              </>
            ) : (
              <>
                <span className="text-[9px] font-mono text-red-400 text-right tabular-nums">{formatPrice(q.bid, q.pair)}</span>
                <span className="text-[9px] font-mono text-green-400 text-right tabular-nums">{formatPrice(q.ask, q.pair)}</span>
                <span
                  className="text-[9px] font-bold text-right tabular-nums"
                  style={{ color: q.spread < 2 ? 'hsl(140 60% 50%)' : q.spread < 4 ? 'hsl(45 80% 55%)' : 'hsl(0 70% 55%)' }}
                >
                  {q.spread.toFixed(1)}p
                </span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function formatVolume(vol: number): string {
  if (vol === 0) return '—';
  if (vol >= 1_000_000_000) return `${(vol / 1_000_000_000).toFixed(1)}B`;
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(1)}K`;
  return vol.toFixed(0);
}

function VolumeIndicator({ sessionVolume, color }: { sessionVolume: SessionVolume; color: string }) {
  if (sessionVolume.loading) {
    return (
      <div className="rounded-lg border p-3 space-y-2" style={{ borderColor: `hsl(${color} / 0.15)` }}>
        <div className="flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5" style={{ color: `hsl(${color})` }} />
          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Volume & Range</span>
        </div>
        <div className="flex items-center justify-center py-3">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const maxVol = Math.max(...sessionVolume.pairVolumes.map(p => p.volume), 1);

  return (
    <div className="rounded-lg border p-3 space-y-2" style={{ borderColor: `hsl(${color} / 0.15)` }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5" style={{ color: `hsl(${color})` }} />
          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Volume & Range</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[8px] text-muted-foreground">
            Total: <span className="font-bold" style={{ color: `hsl(${color})` }}>{formatVolume(sessionVolume.totalVolume)}</span>
          </span>
          {sessionVolume.avgDailyRange > 0 && (
            <span className="text-[8px] text-muted-foreground">
              Avg: <span className="font-bold" style={{ color: `hsl(${color})` }}>{sessionVolume.avgDailyRange.toFixed(0)}p</span>
            </span>
          )}
        </div>
      </div>

      {/* Per-pair volume bars */}
      <div className="space-y-1.5">
        {sessionVolume.pairVolumes.map(pv => {
          const pct = maxVol > 0 ? (pv.volume / maxVol) * 100 : 0;
          return (
            <div key={pv.pair} className="space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-foreground">{pv.pair}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-mono tabular-nums text-muted-foreground">{formatVolume(pv.volume)}</span>
                  {pv.range > 0 && (
                    <span className="text-[8px] font-mono tabular-nums" style={{ color: `hsl(${color})` }}>{pv.range.toFixed(0)}p</span>
                  )}
                </div>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: `hsl(${color} / 0.1)` }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, hsl(${color} / 0.4), hsl(${color}))`,
                    boxShadow: pct > 50 ? `0 0 6px hsl(${color} / 0.3)` : undefined,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(pct, 2)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function useWeeklyVolume(session: SessionData) {
  const [weeklyData, setWeeklyData] = useState<{ day: string; volume: number; range: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    async function fetchWeekly() {
      try {
        const mainPair = session.currencies[0];
        const symbol = `C:${mainPair.pair.replace('/', '')}`;
        const now = new Date();
        // Get last 7 calendar days to capture 5 weekdays
        const from = new Date(now);
        from.setDate(from.getDate() - 9);
        const formatDate = (d: Date) => d.toISOString().split('T')[0];

        const { data, error } = await supabase.functions.invoke('realtime-market', {
          body: {
            symbol,
            type: 'range',
            from: formatDate(from),
            to: formatDate(now),
            timespan: 'day',
          },
        });

        if (error || !data?.results?.length) {
          setLoading(false);
          return;
        }

        const isJPY = mainPair.pair.includes('JPY');
        const pipMult = isJPY ? 100 : 10000;
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        const weekdays = data.results
          .map((r: any) => {
            const d = new Date(r.t);
            const dow = d.getUTCDay();
            if (dow === 0 || dow === 6) return null;
            return {
              day: dayNames[dow],
              volume: r.v || 0,
              range: Math.abs((r.h || 0) - (r.l || 0)) * pipMult,
            };
          })
          .filter(Boolean)
          .slice(-5);

        setWeeklyData(weekdays);
      } catch {
        // keep static fallback
      } finally {
        setLoading(false);
      }
    }

    fetchWeekly();
  }, [session]);

  return { weeklyData, loading };
}

function WeeklyChart({ session, color }: {
  session: SessionData;
  color: string;
}) {
  const { weeklyData, loading } = useWeeklyVolume(session);

  // Fallback to static data if API didn't return results
  const hasRealData = weeklyData.length > 0;

  const displayData = hasRealData
    ? weeklyData
    : DAYS.map((d, i) => ({ day: d, volume: session.weeklyVolatility[i] * 1000, range: session.weeklyLiquidity[i] }));

  const maxVol = Math.max(...displayData.map(d => d.volume), 1);
  const maxRange = Math.max(...displayData.map(d => d.range), 1);
  const maxH = 80;

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1 px-1">
        <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
          {hasRealData ? '📊 Vol. Semanal Real' : '📊 Vol. Semanal'}
        </span>
        {loading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
        {hasRealData && !loading && (
          <span className="text-[7px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: `hsl(${color} / 0.15)`, color: `hsl(${color})` }}>LIVE</span>
        )}
      </div>
      <div className="flex items-end gap-1 justify-between h-24 px-1">
        {displayData.map((item, i) => {
          const volH = (item.volume / maxVol) * maxH;
          const rangeH = (item.range / maxRange) * maxH;
          return (
            <div key={item.day + i} className="flex flex-col items-center gap-0.5 flex-1">
              <div className="flex items-end gap-[2px] h-20">
                <motion.div
                  className="relative w-3 rounded-t overflow-hidden"
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(volH, 3)}%` }}
                  transition={{ duration: 0.6, delay: i * 0.08 }}
                >
                  <div className="absolute inset-0" style={{ background: `linear-gradient(to top, hsl(${color} / 0.3), hsl(${color} / 0.8))` }} />
                </motion.div>
                <motion.div
                  className="relative w-3 rounded-t overflow-hidden"
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(rangeH, 3)}%` }}
                  transition={{ duration: 0.6, delay: i * 0.08 + 0.05 }}
                >
                  <div className="absolute inset-0" style={{ background: `linear-gradient(to top, hsl(45 80% 55% / 0.3), hsl(45 80% 55% / 0.8))` }} />
                </motion.div>
              </div>
              <span className="text-[8px] text-muted-foreground">{item.day}</span>
              {hasRealData && (
                <span className="text-[6px] font-mono text-muted-foreground/60 tabular-nums">
                  {item.volume >= 1e6 ? `${(item.volume / 1e6).toFixed(1)}M` : item.volume >= 1e3 ? `${(item.volume / 1e3).toFixed(0)}K` : item.volume}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 justify-center mt-1">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm" style={{ background: `hsl(${color})` }} />
          <span className="text-[8px] text-muted-foreground">{hasRealData ? 'Volume' : 'Volatility'}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm" style={{ background: 'hsl(45 80% 55%)' }} />
          <span className="text-[8px] text-muted-foreground">{hasRealData ? 'Range (pips)' : 'Liquidity'}</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────── Volatility Alerts ─────────── */

interface VolatilityAlertConfig {
  enabled: boolean;
  thresholdPips: number;
}

function getAlertConfig(sessionId: string): VolatilityAlertConfig {
  try {
    const stored = localStorage.getItem(`vol-alert-${sessionId}`);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return { enabled: false, thresholdPips: 100 };
}

function saveAlertConfig(sessionId: string, config: VolatilityAlertConfig) {
  localStorage.setItem(`vol-alert-${sessionId}`, JSON.stringify(config));
}

function VolatilityAlerts({ session, sessionVolume, color }: {
  session: SessionData;
  sessionVolume: SessionVolume;
  color: string;
}) {
  const [config, setConfig] = useState<VolatilityAlertConfig>(() => getAlertConfig(session.id));
  const [showSettings, setShowSettings] = useState(false);
  const alertedRef = useRef(false);

  // Reset alert flag when threshold changes
  useEffect(() => { alertedRef.current = false; }, [config.thresholdPips]);

  // Check threshold and fire notification
  useEffect(() => {
    if (!config.enabled || sessionVolume.loading || alertedRef.current) return;
    if (sessionVolume.avgDailyRange >= config.thresholdPips && sessionVolume.avgDailyRange > 0) {
      alertedRef.current = true;
      toast.warning(`⚡ ${session.name}: Rango diario ${sessionVolume.avgDailyRange.toFixed(1)} pips supera umbral de ${config.thresholdPips} pips`, {
        duration: 8000,
        description: `Volatilidad elevada en la sesión de ${session.name}`,
      });
    }
  }, [config.enabled, config.thresholdPips, sessionVolume.avgDailyRange, sessionVolume.loading, session.name]);

  const toggleEnabled = () => {
    const next = { ...config, enabled: !config.enabled };
    setConfig(next);
    saveAlertConfig(session.id, next);
    alertedRef.current = false;
    if (next.enabled) {
      toast.success(`Alerta activada para ${session.name} (${next.thresholdPips} pips)`);
    }
  };

  const updateThreshold = (val: number) => {
    const next = { ...config, thresholdPips: val };
    setConfig(next);
    saveAlertConfig(session.id, next);
  };

  const isTriggered = config.enabled && !sessionVolume.loading && sessionVolume.avgDailyRange >= config.thresholdPips && sessionVolume.avgDailyRange > 0;

  return (
    <div
      className="rounded-lg border p-2.5 transition-all"
      style={{
        borderColor: isTriggered ? `hsl(0 70% 50% / 0.5)` : `hsl(${color} / 0.15)`,
        background: isTriggered ? 'hsl(0 70% 50% / 0.06)' : `hsl(${color} / 0.03)`,
        boxShadow: isTriggered ? '0 0 12px hsl(0 70% 50% / 0.15)' : undefined,
      }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px]">🔔</span>
          <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Alerta Volatilidad</span>
          {isTriggered && (
            <motion.span
              className="text-[7px] px-1.5 py-0.5 rounded-full font-bold"
              style={{ background: 'hsl(0 70% 50% / 0.2)', color: 'hsl(0 70% 55%)' }}
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              TRIGGERED
            </motion.span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 rounded-md transition-colors hover:bg-muted/30"
          >
            <Settings2 className="w-3 h-3 text-muted-foreground" />
          </button>
          <button
            onClick={toggleEnabled}
            className={cn(
              "p-1 rounded-md transition-all",
              config.enabled ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {config.enabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Current status */}
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-muted-foreground">
          Rango actual: <span className="font-bold text-foreground">{sessionVolume.loading ? '...' : `${sessionVolume.avgDailyRange.toFixed(1)} pips`}</span>
        </span>
        <span className="text-[9px] text-muted-foreground">
          Umbral: <span className="font-bold" style={{ color: config.enabled ? `hsl(${color})` : undefined }}>{config.thresholdPips} pips</span>
        </span>
      </div>

      {/* Progress bar showing proximity to threshold */}
      {config.enabled && !sessionVolume.loading && (
        <div className="mt-1.5">
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted) / 0.2)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{
                background: isTriggered
                  ? 'linear-gradient(90deg, hsl(0 70% 40%), hsl(0 70% 55%))'
                  : `linear-gradient(90deg, hsl(${color} / 0.4), hsl(${color}))`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((sessionVolume.avgDailyRange / config.thresholdPips) * 100, 100)}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
          <div className="flex justify-between mt-0.5">
            <span className="text-[7px] text-muted-foreground/50">0</span>
            <span className="text-[7px] text-muted-foreground/50">{config.thresholdPips}</span>
          </div>
        </div>
      )}

      {/* Settings panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 pt-2 border-t" style={{ borderColor: `hsl(${color} / 0.1)` }}>
              <label className="text-[9px] text-muted-foreground font-medium block mb-1.5">Umbral de pips</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={10}
                  max={300}
                  step={5}
                  value={config.thresholdPips}
                  onChange={e => updateThreshold(Number(e.target.value))}
                  className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-primary"
                  style={{ accentColor: `hsl(${color})` }}
                />
                <input
                  type="number"
                  min={5}
                  max={500}
                  value={config.thresholdPips}
                  onChange={e => updateThreshold(Math.max(5, Number(e.target.value)))}
                  className="w-14 text-center text-[10px] font-mono rounded-md border bg-background py-1"
                  style={{ borderColor: `hsl(${color} / 0.3)` }}
                />
              </div>
              <div className="flex gap-1 mt-1.5">
                {[50, 80, 100, 150, 200].map(v => (
                  <button
                    key={v}
                    onClick={() => updateThreshold(v)}
                    className={cn(
                      "text-[8px] px-1.5 py-0.5 rounded-md border transition-all",
                      config.thresholdPips === v
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SessionCard({ session, isActive }: { session: SessionData; isActive: boolean }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(iv);
  }, []);

  const status = getSessionStatus(session);
  const { quotes, isConnected, sessionVolume, refetch } = useSessionLiveData(session, isActive);

  const liveAvgSpread = useMemo(() => {
    const valid = quotes.filter(q => q.spread > 0);
    if (valid.length === 0) return undefined;
    return valid.reduce((s, q) => s + q.spread, 0) / valid.length;
  }, [quotes]);

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{
      background: `linear-gradient(165deg, hsl(${session.color} / 0.08) 0%, hsl(var(--card)) 40%, hsl(var(--background)) 100%)`,
      border: `1px solid hsl(${session.color} / 0.2)`,
    }}>
      {/* Top glow line */}
      <div className="absolute top-0 inset-x-0 h-[2px]" style={{
        background: `linear-gradient(90deg, transparent, hsl(${session.color} / 0.7), transparent)`,
      }} />

      {/* Subtle radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-32 rounded-full opacity-20 pointer-events-none" style={{
        background: `radial-gradient(circle, hsl(${session.color} / 0.4), transparent 70%)`,
      }} />

      <div className="relative p-4 space-y-4">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{
              background: `linear-gradient(135deg, hsl(${session.color} / 0.2), hsl(${session.color} / 0.08))`,
              border: `1px solid hsl(${session.color} / 0.25)`,
              boxShadow: `0 4px 12px hsl(${session.color} / 0.1)`,
            }}>
              {session.emoji}
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground leading-tight">{session.name}</h2>
              <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
                {formatHour(session.openUTC)} – {formatHour(session.closeUTC)} UTC
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className={cn(
              "text-[9px] font-bold uppercase px-2 py-0.5 rounded-full tracking-wider"
            )} style={{
              background: status.isOpen ? 'hsl(var(--bullish) / 0.12)' : 'hsl(var(--muted) / 0.3)',
              color: status.isOpen ? 'hsl(var(--bullish))' : 'hsl(var(--muted-foreground))',
              border: `1px solid ${status.isOpen ? 'hsl(var(--bullish) / 0.25)' : 'hsl(var(--border))'}`,
            }}>
              {status.isOpen ? '● OPEN' : 'CLOSED'}
            </span>
            <span className="text-[10px] font-mono font-bold tabular-nums" style={{
              color: status.isOpen ? `hsl(${session.color})` : 'hsl(var(--muted-foreground))',
            }}>
              {status.isOpen ? `${status.timeRemaining} left` : `opens ${status.timeRemaining}`}
            </span>
          </div>
        </div>

        {/* ── Progress Bar ── */}
        <div className="space-y-1">
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted) / 0.15)' }}>
            {status.isOpen ? (
              <motion.div
                className="h-full rounded-full relative"
                style={{
                  background: `linear-gradient(90deg, hsl(${session.color} / 0.5), hsl(${session.color}))`,
                  boxShadow: `0 0 8px hsl(${session.color} / 0.4)`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${status.progressPercent}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-foreground shadow-lg" />
              </motion.div>
            ) : (
              <div className="h-full w-full rounded-full" style={{ background: 'hsl(var(--muted) / 0.1)' }} />
            )}
          </div>
          {status.isOpen && (
            <div className="flex justify-end">
              <span className="text-[9px] font-mono font-bold tabular-nums" style={{ color: `hsl(${session.color})` }}>
                {status.progressPercent}%
              </span>
            </div>
          )}
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Volatilidad', value: session.volatility },
            { label: 'Liquidez', value: session.liquidity },
            { label: 'Rango Pips', value: null, custom: `${session.avgPipsRange[0]}–${session.avgPipsRange[1]}` },
          ].map((stat, idx) => (
            <div key={idx} className="rounded-xl p-2.5 text-center" style={{
              background: 'hsl(var(--card) / 0.6)',
              border: '1px solid hsl(var(--border) / 0.5)',
            }}>
              <span className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">{stat.label}</span>
              {stat.value ? (
                <LevelBadge level={stat.value} />
              ) : (
                <span className="text-xs font-bold tabular-nums" style={{ color: `hsl(${session.color})` }}>{stat.custom}</span>
              )}
            </div>
          ))}
        </div>

        {/* ── Currency Pairs Grid ── */}
        <div className="rounded-xl overflow-hidden" style={{
          background: 'hsl(var(--card) / 0.4)',
          border: '1px solid hsl(var(--border) / 0.4)',
        }}>
          <div className="px-3 py-1.5 flex items-center justify-between" style={{
            background: `hsl(${session.color} / 0.06)`,
            borderBottom: '1px solid hsl(var(--border) / 0.3)',
          }}>
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Pares de Divisas</span>
            <PipsGauge range={session.avgPipsRange} color={session.color} liveSpread={liveAvgSpread} />
          </div>
          <div className="grid grid-cols-2 gap-px" style={{ background: 'hsl(var(--border) / 0.2)' }}>
            {session.currencies.map(c => {
              const liveQuote = quotes.find(q => q.pair === c.pair);
              return (
                <div key={c.pair} className="flex items-center gap-2 p-2.5" style={{ background: 'hsl(var(--card) / 0.6)' }}>
                  <div className="flex items-center -space-x-1.5">
                    <span className="text-base">{c.flag1}</span>
                    <span className="text-base">{c.flag2}</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-foreground leading-tight">{c.pair}</span>
                    {liveQuote && liveQuote.price > 0 ? (
                      <span className="text-[10px] font-mono tabular-nums leading-tight" style={{ color: `hsl(${session.color})` }}>
                        {formatPrice(liveQuote.price, c.pair)}
                      </span>
                    ) : liveQuote?.loading ? (
                      <Loader2 className="w-2.5 h-2.5 animate-spin text-muted-foreground mt-0.5" />
                    ) : (
                      <span className="text-[9px] text-muted-foreground/50">—</span>
                    )}
                  </div>
                  {liveQuote && liveQuote.spread > 0 && (
                    <span className="ml-auto text-[8px] font-mono tabular-nums px-1.5 py-0.5 rounded-md" style={{
                      background: liveQuote.spread < 2 ? 'hsl(var(--bullish) / 0.1)' : liveQuote.spread < 4 ? 'hsl(var(--accent) / 0.1)' : 'hsl(var(--destructive) / 0.1)',
                      color: liveQuote.spread < 2 ? 'hsl(var(--bullish))' : liveQuote.spread < 4 ? 'hsl(var(--accent))' : 'hsl(var(--destructive))',
                    }}>
                      {liveQuote.spread.toFixed(1)}p
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Live Data Panel ── */}
        <LiveDataPanel quotes={quotes} isConnected={isConnected} color={session.color} onRefresh={refetch} />

        {/* ── Volume Indicator ── */}
        <VolumeIndicator sessionVolume={sessionVolume} color={session.color} />

        {/* ── Volatility Alerts ── */}
        <VolatilityAlerts session={session} sessionVolume={sessionVolume} color={session.color} />

        {/* ── Weekly Chart ── */}
        <WeeklyChart session={session} color={session.color} />
      </div>
    </div>
  );
}

/* ─────────── Session Comparison Table ─────────── */

/* ─── Mini Sparkline SVG ─── */
function MiniSparkline({ data, color, width = 36, height = 14 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (data.length < 2) return <div style={{ width, height }} className="rounded bg-muted/20" />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 2) - 1;
    return `${x},${y}`;
  }).join(' ');
  const trend = data[data.length - 1] >= data[0];
  const strokeColor = `hsl(${color})`;
  return (
    <svg width={width} height={height} className="shrink-0">
      <polyline points={points} fill="none" stroke={strokeColor} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
      <circle cx={(data.length - 1) / (data.length - 1) * width} cy={height - ((data[data.length - 1] - min) / range) * (height - 2) - 1} r={2} fill={strokeColor} />
    </svg>
  );
}

function SessionComparisonTable({ activeIndex, onSelect }: { activeIndex: number; onSelect: (i: number) => void }) {
  const [tick, setTick] = useState(0);
  const [flashIdx, setFlashIdx] = useState<number | null>(null);

  const handleSelect = (i: number) => {
    setFlashIdx(i);
    onSelect(i);
    setTimeout(() => setFlashIdx(null), 600);
  };

  // Re-render periodically to pick up fresh cache data
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 10_000);
    return () => clearInterval(iv);
  }, []);

  const sessionStats = useMemo(() => {
    return SESSIONS.map(session => {
      let totalSpread = 0;
      let spreadCount = 0;
      let totalVolume = 0;
      let totalRange = 0;
      let rangeCount = 0;

      session.currencies.forEach(c => {
        const symbol = `C:${c.pair.replace('/', '')}`;
        const isJPY = c.pair.includes('JPY');
        const pipMul = isJPY ? 100 : 10000;
        const cached = liveCache.get(symbol);
        const agg = aggCache.get(symbol);

        if (cached && cached.bid > 0 && cached.ask > 0) {
          const spread = Math.abs(cached.ask - cached.bid) * pipMul;
          totalSpread += spread;
          spreadCount++;
        }
        if (agg) {
          totalVolume += agg.volume;
          if (agg.high > 0 && agg.low > 0) {
            totalRange += Math.abs(agg.high - agg.low) * pipMul;
            rangeCount++;
          }
        }
      });

      return {
        avgSpread: spreadCount > 0 ? totalSpread / spreadCount : 0,
        totalVolume,
        avgRange: rangeCount > 0 ? totalRange / rangeCount : 0,
        hasData: spreadCount > 0 || totalVolume > 0,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const maxVol = Math.max(...sessionStats.map(s => s.totalVolume), 1);
  const maxRange = Math.max(...sessionStats.map(s => s.avgRange), 1);

  return (
    <div className="mt-4 rounded-xl border overflow-hidden" style={{
      borderColor: 'hsl(var(--border) / 0.5)',
      background: 'hsl(var(--card) / 0.6)',
    }}>
      {/* Title */}
      <div className="px-3 py-2 flex items-center gap-1.5" style={{ background: 'hsl(var(--muted) / 0.3)' }}>
        <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Comparativa de sesiones</span>
      </div>

      {/* Header row */}
      <div className="grid grid-cols-[1fr_60px_70px_60px] gap-0 px-3 py-1.5" style={{ background: 'hsl(var(--muted) / 0.15)' }}>
        <span className="text-[8px] font-bold text-muted-foreground uppercase">Sesión</span>
        <span className="text-[8px] font-bold text-muted-foreground uppercase text-right">Spread</span>
        <span className="text-[8px] font-bold text-muted-foreground uppercase text-right">Volumen</span>
        <span className="text-[8px] font-bold text-muted-foreground uppercase text-right">Rango</span>
      </div>

      {/* Rows */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
      >
      {SESSIONS.map((session, i) => {
        const stats = sessionStats[i];
        const status = getSessionStatus(session);
        const isSelected = i === activeIndex;
        const volPct = maxVol > 0 ? (stats.totalVolume / maxVol) * 100 : 0;

        return (
          <motion.div
            key={session.id}
            variants={{
              hidden: { opacity: 0, x: -12 },
              visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } },
            }}
          >
          <button
            onClick={() => handleSelect(i)}
            className={cn(
              'w-full grid grid-cols-[1fr_60px_70px_60px] gap-0 px-3 py-2 items-center transition-all duration-500 border-b last:border-b-0 text-left',
              isSelected ? 'bg-muted/30' : 'hover:bg-muted/10',
            )}
            style={{
              borderColor: 'hsl(var(--border) / 0.15)',
              ...(isSelected ? { boxShadow: `inset 3px 0 0 hsl(${session.color})` } : {}),
              ...(flashIdx === i ? { background: `hsl(${session.color} / 0.15)` } : {}),
            }}
          >
            {/* Session name */}
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs">{session.emoji}</span>
              <span className={cn('text-[10px] font-semibold truncate', isSelected ? 'text-foreground' : 'text-muted-foreground')}>
                {session.name}
              </span>
              {status.isOpen && (
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
              )}
            </div>

            {/* Spread */}
            <div className="text-right">
              {stats.hasData && stats.avgSpread > 0 ? (
                <span className="text-[10px] font-mono font-bold tabular-nums" style={{
                  color: stats.avgSpread < 2 ? 'hsl(var(--bullish, 140 60% 50%))' : stats.avgSpread < 4 ? 'hsl(var(--accent))' : 'hsl(var(--destructive))',
                }}>
                  {stats.avgSpread.toFixed(1)}p
                </span>
              ) : (
                <span className="text-[9px] text-muted-foreground">—</span>
              )}
            </div>

            {/* Volume with mini bar */}
            <div className="text-right space-y-0.5">
              <span className="text-[10px] font-mono font-bold tabular-nums text-foreground block">
                {stats.totalVolume > 0 ? formatVolume(stats.totalVolume) : '—'}
              </span>
              {stats.totalVolume > 0 && (
                <div className="w-full h-[3px] rounded-full overflow-hidden ml-auto" style={{ background: `hsl(${session.color} / 0.1)` }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{
                    width: `${volPct}%`,
                    background: `hsl(${session.color})`,
                  }} />
                </div>
              )}
            </div>

            {/* Range */}
            <div className="text-right">
              {stats.avgRange > 0 ? (
                <span className="text-[10px] font-mono font-bold tabular-nums" style={{ color: `hsl(${session.color})` }}>
                  {stats.avgRange.toFixed(0)}p
                </span>
              ) : (
                <span className="text-[9px] text-muted-foreground">—</span>
              )}
            </div>
          </button>
          </motion.div>
        );
      })}
      </motion.div>
    </div>
  );
}

/* ─────────── Main Page ─────────── */

export default function MarketSessions() {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [swipeDir, setSwipeDir] = useState<1 | -1>(1);

  const goNext = () => {
    if (activeIndex < SESSIONS.length - 1) {
      setSwipeDir(1);
      setActiveIndex(i => i + 1);
    }
  };
  const goPrev = () => {
    if (activeIndex > 0) {
      setSwipeDir(-1);
      setActiveIndex(i => i - 1);
    }
  };

  const SWIPE_THRESHOLD = 50;

  return (
    <PageShell>
      <Header />
      <main className="container py-3 max-w-lg mx-auto px-3">
        {/* Session Tabs */}
        <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
          {SESSIONS.map((s, i) => {
            const isSelected = i === activeIndex;
            const sessionStatus = getSessionStatus(s);
            return (
              <button
                key={s.id}
                onClick={() => { setSwipeDir(i > activeIndex ? 1 : -1); setActiveIndex(i); }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all shrink-0 active:scale-95',
                  isSelected ? 'text-foreground shadow-lg' : 'text-muted-foreground'
                )}
                style={{
                  background: isSelected
                    ? `linear-gradient(135deg, hsl(${s.color} / 0.2), hsl(${s.color} / 0.08))`
                    : 'hsl(var(--card) / 0.5)',
                  border: `1px solid ${isSelected ? `hsl(${s.color} / 0.35)` : 'hsl(var(--border) / 0.5)'}`,
                  boxShadow: isSelected ? `0 2px 8px hsl(${s.color} / 0.15)` : undefined,
                }}
              >
                <span className="text-sm">{s.emoji}</span>
                <span>{s.name}</span>
                {sessionStatus.isOpen && (
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Card carousel */}
        <div className="relative overflow-hidden touch-pan-y">
          <AnimatePresence mode="wait" custom={swipeDir}>
            <motion.div
              key={SESSIONS[activeIndex].id}
              custom={swipeDir}
              initial={{ opacity: 0, x: swipeDir * 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -swipeDir * 60 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.12}
              onDragEnd={(_e, info) => {
                if (info.offset.x < -SWIPE_THRESHOLD && activeIndex < SESSIONS.length - 1) goNext();
                else if (info.offset.x > SWIPE_THRESHOLD && activeIndex > 0) goPrev();
              }}
              style={{ cursor: 'grab' }}
            >
              <SessionCard session={SESSIONS[activeIndex]} isActive={true} />
            </motion.div>
          </AnimatePresence>

          {activeIndex > 0 && (
            <button onClick={goPrev} className="absolute left-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-all z-10 active:scale-90 backdrop-blur-sm" style={{
              background: 'hsl(var(--card) / 0.85)',
              border: '1px solid hsl(var(--border) / 0.6)',
              boxShadow: '0 2px 8px hsl(0 0% 0% / 0.3)',
            }}>
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {activeIndex < SESSIONS.length - 1 && (
            <button onClick={goNext} className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-all z-10 active:scale-90 backdrop-blur-sm" style={{
              background: 'hsl(var(--card) / 0.85)',
              border: '1px solid hsl(var(--border) / 0.6)',
              boxShadow: '0 2px 8px hsl(0 0% 0% / 0.3)',
            }}>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-1.5 mt-3 pb-2">
          {SESSIONS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActiveIndex(i)}
              className="transition-all rounded-full"
              style={{
                width: i === activeIndex ? 18 : 6,
                height: 6,
                background: i === activeIndex ? `hsl(${s.color})` : 'hsl(var(--muted-foreground) / 0.2)',
                boxShadow: i === activeIndex ? `0 0 6px hsl(${s.color} / 0.4)` : undefined,
              }}
            />
          ))}
        </div>

        {/* Session Comparison Table */}
        <SessionComparisonTable activeIndex={activeIndex} onSelect={(i) => { setSwipeDir(i > activeIndex ? 1 : -1); setActiveIndex(i); }} />
      </main>
    </PageShell>
  );
}
