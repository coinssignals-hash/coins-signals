import { useMemo } from 'react';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react';

interface ATRChartProps {
  pair: string;
  timeframe: string;
  priceData?: { time: string; price: number; high: number; low: number; open?: number; close?: number }[];
  loading: boolean;
  error?: string | null;
  realtimePrice?: number;
  isRealtimeConnected?: boolean;
}

interface ATRPoint {
  time: string;
  label: string;
  atr: number;
  atrPercent: number;
  trueRange: number;
  high: number;
  low: number;
  close: number;
}

function calculateATR(priceData: ATRChartProps['priceData'], period = 14): ATRPoint[] {
  if (!priceData || priceData.length < period + 1) return [];

  const points: ATRPoint[] = [];
  const trueRanges: number[] = [];

  for (let i = 1; i < priceData.length; i++) {
    const curr = priceData[i];
    const prev = priceData[i - 1];
    const high = curr.high;
    const low = curr.low;
    const prevClose = prev.close ?? prev.price;

    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    trueRanges.push(tr);

    if (trueRanges.length >= period) {
      let atr: number;
      if (trueRanges.length === period) {
        atr = trueRanges.slice(-period).reduce((s, v) => s + v, 0) / period;
      } else {
        const prevATR = points[points.length - 1]?.atr || 0;
        atr = (prevATR * (period - 1) + tr) / period;
      }

      const close = curr.close ?? curr.price;
      const atrPercent = close > 0 ? (atr / close) * 100 : 0;
      const timeStr = curr.time || '';
      const date = new Date(timeStr);
      const label = !isNaN(date.getTime())
        ? `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
        : timeStr.slice(-5);

      points.push({ time: timeStr, label, atr, atrPercent, trueRange: tr, high, low, close });
    }
  }

  return points;
}

export function ATRChart({ pair, timeframe, priceData, loading, error, realtimePrice, isRealtimeConnected }: ATRChartProps) {
  const atrData = useMemo(() => calculateATR(priceData), [priceData]);

  const stats = useMemo(() => {
    if (atrData.length === 0) return null;
    const current = atrData[atrData.length - 1];
    const prev = atrData.length > 1 ? atrData[atrData.length - 2] : current;
    const avg = atrData.reduce((s, d) => s + d.atr, 0) / atrData.length;
    const max = Math.max(...atrData.map(d => d.atr));
    const min = Math.min(...atrData.map(d => d.atr));
    const trend = current.atr > prev.atr ? 'rising' : current.atr < prev.atr ? 'falling' : 'flat';

    // Volatility level
    const ratio = avg > 0 ? current.atr / avg : 1;
    const volatility = ratio > 1.5 ? 'extreme' : ratio > 1.15 ? 'high' : ratio > 0.85 ? 'normal' : 'low';

    return { current, prev, avg, max, min, trend, volatility, ratio };
  }, [atrData]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-32 bg-cyan-900/20" />
          <Skeleton className="h-5 w-20 bg-cyan-900/20" />
        </div>
        <Skeleton className="h-[220px] w-full bg-cyan-900/10" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center py-8 text-gray-500 text-xs">
        <Activity className="w-6 h-6 mx-auto mb-2 opacity-40" />
        Sin datos ATR disponibles
      </div>
    );
  }

  const volColor = stats.volatility === 'extreme' ? 'text-red-400' : stats.volatility === 'high' ? 'text-orange-400' : stats.volatility === 'normal' ? 'text-cyan-400' : 'text-blue-400';
  const volBg = stats.volatility === 'extreme' ? 'bg-red-500/15 border-red-500/30' : stats.volatility === 'high' ? 'bg-orange-500/15 border-orange-500/30' : stats.volatility === 'normal' ? 'bg-cyan-500/15 border-cyan-500/30' : 'bg-blue-500/15 border-blue-500/30';
  const volLabel = stats.volatility === 'extreme' ? 'EXTREMA' : stats.volatility === 'high' ? 'ALTA' : stats.volatility === 'normal' ? 'NORMAL' : 'BAJA';

  const TrendIcon = stats.trend === 'rising' ? TrendingUp : stats.trend === 'falling' ? TrendingDown : Minus;
  const trendColor = stats.trend === 'rising' ? 'text-orange-400' : stats.trend === 'falling' ? 'text-emerald-400' : 'text-gray-400';

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-orange-400" />
          <span className="text-xs font-mono font-bold text-white">ATR(14)</span>
          <span className="text-[10px] text-gray-500 font-mono">Average True Range</span>
          {isRealtimeConnected && (
            <span className="flex items-center gap-1 text-[9px] text-green-400">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              LIVE
            </span>
          )}
        </div>
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-mono font-bold ${volBg} ${volColor}`}>
          <Zap className="w-3 h-3" />
          {volLabel}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'ATR', value: stats.current.atr.toFixed(5), sub: `${stats.current.atrPercent.toFixed(2)}%` },
          { label: 'Media', value: stats.avg.toFixed(5) },
          { label: 'Rango', value: `${stats.min.toFixed(5)} — ${stats.max.toFixed(5)}` },
          { label: 'Tendencia', value: stats.trend === 'rising' ? 'Creciente' : stats.trend === 'falling' ? 'Decreciente' : 'Lateral', icon: true },
        ].map((s, i) => (
          <div key={i} className="bg-[#060d1b] rounded-lg p-2 border border-cyan-900/20">
            <div className="text-[9px] text-gray-500 font-mono uppercase">{s.label}</div>
            <div className="flex items-center gap-1">
              {s.icon && <TrendIcon className={`w-3 h-3 ${trendColor}`} />}
              <span className={`text-[11px] font-mono font-bold ${s.icon ? trendColor : 'text-white'}`}>{s.value}</span>
            </div>
            {s.sub && <div className="text-[9px] text-gray-500 font-mono">{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Volatility Gauge */}
      <div className="bg-[#060d1b] rounded-lg p-2.5 border border-cyan-900/20">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] text-gray-500 font-mono">VOLATILIDAD RELATIVA</span>
          <span className={`text-[10px] font-mono font-bold ${volColor}`}>{(stats.ratio * 100).toFixed(0)}%</span>
        </div>
        <div className="relative h-3 bg-[#0a1628] rounded-full overflow-hidden">
          <div className="absolute inset-0 flex">
            <div className="flex-1 bg-blue-500/20" />
            <div className="flex-1 bg-cyan-500/20" />
            <div className="flex-1 bg-orange-500/20" />
            <div className="flex-1 bg-red-500/20" />
          </div>
          <div
            className="absolute top-0 h-full w-1 bg-white rounded-full shadow-[0_0_6px_white]"
            style={{ left: `${Math.min(Math.max((stats.ratio / 2) * 100, 2), 98)}%` }}
          />
        </div>
        <div className="flex justify-between mt-0.5">
          {['Baja', 'Normal', 'Alta', 'Extrema'].map(l => (
            <span key={l} className="text-[8px] text-gray-600 font-mono">{l}</span>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={atrData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="atrFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f20" />
            <XAxis dataKey="label" tick={{ fill: '#4a5568', fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fill: '#4a5568', fontSize: 9 }} tickLine={false} axisLine={false} domain={['dataMin', 'dataMax']} width={55} tickFormatter={v => v.toFixed(4)} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0a1628', border: '1px solid rgba(6,182,212,0.3)', borderRadius: 8, fontSize: 11, fontFamily: 'monospace' }}
              labelStyle={{ color: '#9ca3af' }}
              formatter={(v: number, name: string) => {
                if (name === 'atr') return [v.toFixed(5), 'ATR'];
                if (name === 'trueRange') return [v.toFixed(5), 'TR'];
                return [v, name];
              }}
            />
            <ReferenceLine y={stats.avg} stroke="#06b6d4" strokeDasharray="4 4" strokeOpacity={0.5} />
            <Area type="monotone" dataKey="atr" stroke="transparent" fill="url(#atrFill)" />
            <Line type="monotone" dataKey="trueRange" stroke="#6366f1" strokeWidth={1} dot={false} opacity={0.4} />
            <Line type="monotone" dataKey="atr" stroke="#f97316" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#f97316', stroke: '#fff', strokeWidth: 1 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
