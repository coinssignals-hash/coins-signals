import { useMemo } from 'react';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Cloud, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface IchimokuChartProps {
  pair: string;
  timeframe: string;
  priceData?: { time: string; price: number; high: number; low: number; open?: number; close?: number }[];
  apiIchimoku?: { time: string; tenkan: number; kijun: number; senkouA: number; senkouB: number; chikou: number }[];
  loading: boolean;
  error?: string | null;
  realtimePrice?: number;
  isRealtimeConnected?: boolean;
}

interface IchimokuPoint {
  time: string;
  label: string;
  close: number;
  tenkan: number | null;
  kijun: number | null;
  senkouA: number | null;
  senkouB: number | null;
  chikou: number | null;
  cloudTop: number | null;
  cloudBottom: number | null;
  cloudBullish: boolean;
}

function midpoint(data: { high: number; low: number }[], start: number, period: number): number | null {
  if (start < 0 || start + period > data.length) return null;
  const slice = data.slice(start, start + period);
  const high = Math.max(...slice.map(d => d.high));
  const low = Math.min(...slice.map(d => d.low));
  return (high + low) / 2;
}

function calculateIchimoku(priceData: IchimokuChartProps['priceData']): IchimokuPoint[] {
  if (!priceData || priceData.length < 52) return [];

  const tenkanPeriod = 9;
  const kijunPeriod = 26;
  const senkouBPeriod = 52;
  const displacement = 26;

  const points: IchimokuPoint[] = [];

  for (let i = 0; i < priceData.length; i++) {
    const curr = priceData[i];
    const close = curr.close ?? curr.price;
    const timeStr = curr.time || '';
    const date = new Date(timeStr);
    const label = !isNaN(date.getTime())
      ? `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      : timeStr.slice(-5);

    const tenkan = i >= tenkanPeriod - 1 ? midpoint(priceData, i - tenkanPeriod + 1, tenkanPeriod) : null;
    const kijun = i >= kijunPeriod - 1 ? midpoint(priceData, i - kijunPeriod + 1, kijunPeriod) : null;

    // Senkou Span A & B are displaced forward by 26 periods, but we show them at current position
    // for simplicity (they represent "future cloud" seen from 26 bars ago)
    const senkouASource = i >= kijunPeriod - 1 + displacement ? i - displacement : -1;
    let senkouA: number | null = null;
    let senkouB: number | null = null;

    if (senkouASource >= kijunPeriod - 1) {
      const t = midpoint(priceData, senkouASource - tenkanPeriod + 1, tenkanPeriod);
      const k = midpoint(priceData, senkouASource - kijunPeriod + 1, kijunPeriod);
      if (t !== null && k !== null) senkouA = (t + k) / 2;
    }

    if (i >= senkouBPeriod - 1 + displacement) {
      const src = i - displacement;
      if (src >= senkouBPeriod - 1) {
        senkouB = midpoint(priceData, src - senkouBPeriod + 1, senkouBPeriod);
      }
    }

    // Chikou: close displaced 26 periods back — show at i if i+26 exists
    const chikou = i >= displacement ? (priceData[i - displacement].close ?? priceData[i - displacement].price) : null;

    const cloudTop = senkouA !== null && senkouB !== null ? Math.max(senkouA, senkouB) : null;
    const cloudBottom = senkouA !== null && senkouB !== null ? Math.min(senkouA, senkouB) : null;
    const cloudBullish = (senkouA ?? 0) >= (senkouB ?? 0);

    points.push({ time: timeStr, label, close, tenkan, kijun, senkouA, senkouB, chikou, cloudTop, cloudBottom, cloudBullish });
  }

  return points;
}

export function IchimokuChart({ pair, timeframe, priceData, apiIchimoku, loading, error, realtimePrice, isRealtimeConnected }: IchimokuChartProps) {
  // Use API data if available, otherwise fall back to local calculation
  const ichData = useMemo(() => {
    if (apiIchimoku && apiIchimoku.length > 0 && priceData && priceData.length > 0) {
      // Merge API ichimoku data with price data by matching timestamps
      const priceMap = new Map(priceData.map(p => [p.time, p]));
      // Try to match by date substring if exact match fails
      return apiIchimoku.map(ich => {
        const pricePoint = priceMap.get(ich.time) || 
          [...priceMap.values()].find(p => p.time.startsWith(ich.time.slice(0, 10)));
        const close = pricePoint ? (pricePoint.close ?? pricePoint.price) : 0;
        const date = new Date(ich.time);
        const label = !isNaN(date.getTime())
          ? `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
          : ich.time.slice(-5);
        const cloudTop = Math.max(ich.senkouA, ich.senkouB);
        const cloudBottom = Math.min(ich.senkouA, ich.senkouB);
        return {
          time: ich.time, label, close,
          tenkan: ich.tenkan, kijun: ich.kijun,
          senkouA: ich.senkouA, senkouB: ich.senkouB,
          chikou: ich.chikou,
          cloudTop, cloudBottom,
          cloudBullish: ich.senkouA >= ich.senkouB,
        } as IchimokuPoint;
      }).filter(p => p.close > 0);
    }
    return calculateIchimoku(priceData);
  }, [priceData, apiIchimoku]);

  const stats = useMemo(() => {
    if (ichData.length === 0) return null;
    const current = ichData[ichData.length - 1];
    const close = realtimePrice || current.close;

    // Signal analysis
    const signals: { name: string; signal: 'bull' | 'bear' | 'neutral'; detail: string }[] = [];

    // Price vs Cloud
    if (current.cloudTop !== null && current.cloudBottom !== null) {
      if (close > current.cloudTop) signals.push({ name: 'Precio vs Nube', signal: 'bull', detail: 'Sobre la nube' });
      else if (close < current.cloudBottom) signals.push({ name: 'Precio vs Nube', signal: 'bear', detail: 'Bajo la nube' });
      else signals.push({ name: 'Precio vs Nube', signal: 'neutral', detail: 'Dentro de la nube' });
    }

    // Tenkan vs Kijun
    if (current.tenkan !== null && current.kijun !== null) {
      if (current.tenkan > current.kijun) signals.push({ name: 'TK Cross', signal: 'bull', detail: 'Tenkan > Kijun' });
      else if (current.tenkan < current.kijun) signals.push({ name: 'TK Cross', signal: 'bear', detail: 'Tenkan < Kijun' });
      else signals.push({ name: 'TK Cross', signal: 'neutral', detail: 'Tenkan = Kijun' });
    }

    // Cloud color
    if (current.senkouA !== null && current.senkouB !== null) {
      signals.push({ name: 'Nube', signal: current.cloudBullish ? 'bull' : 'bear', detail: current.cloudBullish ? 'Alcista (verde)' : 'Bajista (roja)' });
    }

    // Price vs Kijun
    if (current.kijun !== null) {
      signals.push({ name: 'Precio vs Kijun', signal: close > current.kijun ? 'bull' : close < current.kijun ? 'bear' : 'neutral', detail: close > current.kijun ? 'Sobre Kijun' : close < current.kijun ? 'Bajo Kijun' : 'En Kijun' });
    }

    const bullCount = signals.filter(s => s.signal === 'bull').length;
    const bearCount = signals.filter(s => s.signal === 'bear').length;
    const overall = bullCount > bearCount + 1 ? 'bull' : bearCount > bullCount + 1 ? 'bear' : 'neutral';

    return { current, close, signals, overall, bullCount, bearCount };
  }, [ichData, realtimePrice]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-40 bg-cyan-900/20" />
        <Skeleton className="h-[260px] w-full bg-cyan-900/10" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center py-8 text-gray-500 text-xs">
        <Cloud className="w-6 h-6 mx-auto mb-2 opacity-40" />
        Sin datos Ichimoku disponibles (mínimo 52 velas)
      </div>
    );
  }

  const overallColor = stats.overall === 'bull' ? 'text-emerald-400' : stats.overall === 'bear' ? 'text-red-400' : 'text-gray-400';
  const overallBg = stats.overall === 'bull' ? 'bg-emerald-500/15 border-emerald-500/30' : stats.overall === 'bear' ? 'bg-red-500/15 border-red-500/30' : 'bg-gray-500/15 border-gray-500/30';
  const overallLabel = stats.overall === 'bull' ? 'ALCISTA' : stats.overall === 'bear' ? 'BAJISTA' : 'NEUTRAL';
  const OverallIcon = stats.overall === 'bull' ? TrendingUp : stats.overall === 'bear' ? TrendingDown : Minus;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cloud className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-mono font-bold text-white">ICHIMOKU</span>
          <span className="text-[10px] text-gray-500 font-mono">9-26-52</span>
          {isRealtimeConnected && (
            <span className="flex items-center gap-1 text-[9px] text-green-400">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              LIVE
            </span>
          )}
        </div>
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-mono font-bold ${overallBg} ${overallColor}`}>
          <OverallIcon className="w-3 h-3" />
          {overallLabel}
        </div>
      </div>

      {/* Signals Grid */}
      <div className="grid grid-cols-2 gap-1.5">
        {stats.signals.map((sig, i) => {
          const color = sig.signal === 'bull' ? 'text-emerald-400' : sig.signal === 'bear' ? 'text-red-400' : 'text-gray-400';
          const bg = sig.signal === 'bull' ? 'border-emerald-900/30' : sig.signal === 'bear' ? 'border-red-900/30' : 'border-gray-800/30';
          const dot = sig.signal === 'bull' ? 'bg-emerald-400' : sig.signal === 'bear' ? 'bg-red-400' : 'bg-gray-400';
          return (
            <div key={i} className={`bg-[#060d1b] rounded-lg p-2 border ${bg} flex items-center gap-2`}>
              <span className={`w-2 h-2 rounded-full ${dot} shrink-0`} />
              <div className="min-w-0">
                <div className="text-[9px] text-gray-500 font-mono truncate">{sig.name}</div>
                <div className={`text-[10px] font-mono font-bold ${color} truncate`}>{sig.detail}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Key Levels */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Tenkan', value: stats.current.tenkan, color: 'text-red-400' },
          { label: 'Kijun', value: stats.current.kijun, color: 'text-blue-400' },
          { label: 'Span A', value: stats.current.senkouA, color: 'text-emerald-400' },
          { label: 'Span B', value: stats.current.senkouB, color: 'text-red-300' },
        ].map((lev, i) => (
          <div key={i} className="bg-[#060d1b] rounded-lg p-2 border border-cyan-900/20">
            <div className="text-[9px] text-gray-500 font-mono">{lev.label}</div>
            <div className={`text-[11px] font-mono font-bold ${lev.color}`}>
              {lev.value !== null ? lev.value.toFixed(5) : '—'}
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={ichData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="cloudBull" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.03} />
              </linearGradient>
              <linearGradient id="cloudBear" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f20" />
            <XAxis dataKey="label" tick={{ fill: '#4a5568', fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fill: '#4a5568', fontSize: 9 }} tickLine={false} axisLine={false} domain={['dataMin', 'dataMax']} width={55} tickFormatter={v => typeof v === 'number' ? v.toFixed(4) : ''} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0a1628', border: '1px solid rgba(6,182,212,0.3)', borderRadius: 8, fontSize: 10, fontFamily: 'monospace' }}
              formatter={(v: number | null, name: string) => {
                if (v === null) return ['—', name];
                const labels: Record<string, string> = { close: 'Precio', tenkan: 'Tenkan', kijun: 'Kijun', senkouA: 'Span A', senkouB: 'Span B', chikou: 'Chikou' };
                return [v.toFixed(5), labels[name] || name];
              }}
            />
            {/* Cloud */}
            <Area type="monotone" dataKey="cloudTop" stroke="transparent" fill="url(#cloudBull)" fillOpacity={1} connectNulls={false} />
            <Area type="monotone" dataKey="cloudBottom" stroke="transparent" fill="#0a1628" fillOpacity={1} connectNulls={false} />
            {/* Lines */}
            <Line type="monotone" dataKey="senkouA" stroke="#10b981" strokeWidth={1} dot={false} strokeDasharray="2 2" connectNulls={false} />
            <Line type="monotone" dataKey="senkouB" stroke="#ef4444" strokeWidth={1} dot={false} strokeDasharray="2 2" connectNulls={false} />
            <Line type="monotone" dataKey="tenkan" stroke="#ef4444" strokeWidth={1.5} dot={false} connectNulls={false} />
            <Line type="monotone" dataKey="kijun" stroke="#3b82f6" strokeWidth={1.5} dot={false} connectNulls={false} />
            <Line type="monotone" dataKey="chikou" stroke="#a855f7" strokeWidth={1} dot={false} opacity={0.6} connectNulls={false} />
            <Line type="monotone" dataKey="close" stroke="#e2e8f0" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#e2e8f0', stroke: '#06b6d4', strokeWidth: 1 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center">
        {[
          { label: 'Precio', color: 'bg-gray-300' },
          { label: 'Tenkan(9)', color: 'bg-red-400' },
          { label: 'Kijun(26)', color: 'bg-blue-400' },
          { label: 'Span A', color: 'bg-emerald-400' },
          { label: 'Span B', color: 'bg-red-300' },
          { label: 'Chikou', color: 'bg-purple-400' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1">
            <span className={`w-2 h-0.5 ${l.color} rounded`} />
            <span className="text-[9px] text-gray-500 font-mono">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
