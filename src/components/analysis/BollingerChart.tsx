import { useMemo } from 'react';
import {
  ComposedChart, Line, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { Loader2, AlertTriangle, TrendingUp, TrendingDown, Minus, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BollingerChartProps {
  pair: string;
  timeframe: string;
  priceData?: Array<{ time: string; price: number; high: number; low: number; open: number }>;
  apiBBands?: Array<{ time: string; upper: number; middle: number; lower: number }>;
  loading?: boolean;
  error?: string | null;
  realtimePrice?: number | null;
  isRealtimeConnected?: boolean;
}

interface BollingerPoint {
  time: string;
  price: number;
  upper: number;
  middle: number;
  lower: number;
  percentB: number; // %B indicator (0-1 scale, can exceed)
  bandwidth: number;
}

function calculateBollingerSeries(
  priceData: BollingerChartProps['priceData'],
  period = 20,
  multiplier = 2
): BollingerPoint[] {
  if (!priceData || priceData.length === 0) return [];

  const prices = priceData.map(p => p.price);

  return priceData.map((p, i) => {
    const date = new Date(p.time);
    const timeLabel = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;

    const slice = prices.slice(Math.max(0, i - period + 1), i + 1);
    const sma = slice.reduce((a, b) => a + b, 0) / slice.length;

    let stdDev = 0;
    if (slice.length >= 2) {
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - sma, 2), 0) / slice.length;
      stdDev = Math.sqrt(variance);
    }

    const upper = sma + multiplier * stdDev;
    const lower = sma - multiplier * stdDev;
    const range = upper - lower;
    const percentB = range > 0 ? (p.price - lower) / range : 0.5;
    const bandwidth = sma > 0 ? (range / sma) * 100 : 0;

    return { time: timeLabel, price: p.price, upper, middle: sma, lower, percentB, bandwidth };
  });
}

// Custom tooltip
const BollingerTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  const price = payload.find((p: any) => p.dataKey === 'price')?.value;
  const upper = payload.find((p: any) => p.dataKey === 'upper')?.value;
  const middle = payload.find((p: any) => p.dataKey === 'middle')?.value;
  const lower = payload.find((p: any) => p.dataKey === 'lower')?.value;

  const pB = upper && lower && (upper - lower) > 0
    ? ((price - lower) / (upper - lower) * 100).toFixed(0)
    : '—';

  return (
    <div className="bg-[#0a1628]/95 border border-cyan-900/40 rounded-lg px-3 py-2 shadow-xl backdrop-blur-sm">
      <p className="text-[10px] text-gray-500 mb-1.5">{label}</p>
      <div className="space-y-1 text-xs font-mono">
        <div className="flex justify-between gap-4">
          <span className="text-red-400/70">Superior</span>
          <span className="text-white font-bold">{upper?.toFixed(5)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-cyan-400">Precio</span>
          <span className="text-white font-bold">{price?.toFixed(5)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">SMA 20</span>
          <span className="text-white font-bold">{middle?.toFixed(5)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-green-400/70">Inferior</span>
          <span className="text-white font-bold">{lower?.toFixed(5)}</span>
        </div>
        <div className="border-t border-gray-700 pt-1 flex justify-between gap-4">
          <span className="text-purple-400">%B</span>
          <span className="text-white font-bold">{pB}%</span>
        </div>
      </div>
    </div>
  );
};

export function BollingerChart({
  pair, timeframe, priceData, apiBBands, loading, error, realtimePrice, isRealtimeConnected = false,
}: BollingerChartProps) {
  const chartData = useMemo(() => {
    // Use API Bollinger Bands data if available, merged with price
    if (apiBBands && apiBBands.length > 0 && priceData && priceData.length > 0) {
      return apiBBands.map((bb, i) => {
        const p = priceData[Math.min(i, priceData.length - 1)];
        const range = bb.upper - bb.lower;
        const percentB = range > 0 ? ((p.price - bb.lower) / range) * 100 : 50;
        const bandwidth = bb.middle > 0 ? (range / bb.middle) * 100 : 0;
        const date = new Date(bb.time);
        const timeLabel = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        return { time: timeLabel, price: p.price, upper: bb.upper, middle: bb.middle, lower: bb.lower, percentB, bandwidth };
      });
    }
    return calculateBollingerSeries(priceData);
  }, [priceData, apiBBands]);

  const stats = useMemo(() => {
    if (chartData.length === 0) return {
      price: 0, upper: 0, middle: 0, lower: 0,
      percentB: 50, bandwidth: 0,
      position: 'neutral' as const,
      squeeze: false, squeezeTrend: 'flat' as const,
      touchUpper: false, touchLower: false,
    };

    const latest = chartData[chartData.length - 1];
    const currentPrice = realtimePrice ?? latest.price;

    const range = latest.upper - latest.lower;
    const percentB = range > 0 ? ((currentPrice - latest.lower) / range) * 100 : 50;
    const position = percentB > 80 ? 'overbought' as const
      : percentB < 20 ? 'oversold' as const
      : 'neutral' as const;

    // Squeeze detection: bandwidth below average
    const bandwidths = chartData.map(d => d.bandwidth);
    const avgBandwidth = bandwidths.reduce((a, b) => a + b, 0) / bandwidths.length;
    const squeeze = latest.bandwidth < avgBandwidth * 0.7;

    // Squeeze trend
    const recentBW = bandwidths.slice(-5);
    const bwDelta = recentBW[recentBW.length - 1] - recentBW[0];
    const squeezeTrend = bwDelta > 0.001 ? 'expanding' as const
      : bwDelta < -0.001 ? 'contracting' as const
      : 'flat' as const;

    // Touch detection
    const touchThreshold = range * 0.05;
    const touchUpper = currentPrice >= latest.upper - touchThreshold;
    const touchLower = currentPrice <= latest.lower + touchThreshold;

    return {
      price: currentPrice, upper: latest.upper, middle: latest.middle, lower: latest.lower,
      percentB, bandwidth: latest.bandwidth, position, squeeze, squeezeTrend,
      touchUpper, touchLower,
    };
  }, [chartData, realtimePrice]);

  if (loading) {
    return (
      <div className="h-[320px] w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
          <span className="text-[10px] text-gray-500">Cargando Bollinger...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[320px] w-full flex items-center justify-center">
        <div className="text-center space-y-1">
          <AlertTriangle className="w-5 h-5 text-red-400 mx-auto" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="h-[320px] w-full flex items-center justify-center text-gray-500">
        <p className="text-xs">Sin datos disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Bollinger Bands (20,2)</span>
            <div className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold",
              stats.position === 'overbought' && "bg-red-500/15 text-red-400",
              stats.position === 'oversold' && "bg-green-500/15 text-green-400",
              stats.position === 'neutral' && "bg-gray-500/15 text-gray-400",
            )}>
              {stats.position === 'overbought' ? <TrendingDown className="w-3 h-3" /> :
               stats.position === 'oversold' ? <TrendingUp className="w-3 h-3" /> :
               <Minus className="w-3 h-3" />}
              {stats.position === 'overbought' ? 'SOBRECOMPRA' :
               stats.position === 'oversold' ? 'SOBREVENTA' : 'NEUTRAL'}
            </div>
            {stats.squeeze && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-500/15 text-yellow-400 animate-pulse">
                <Minimize2 className="w-3 h-3" />
                SQUEEZE
              </div>
            )}
            {isRealtimeConnected && realtimePrice && (
              <div className="flex items-center gap-1 bg-green-500/15 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] text-green-400 font-medium">LIVE</span>
              </div>
            )}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-white">{stats.price.toFixed(5)}</span>
          </div>
        </div>

        {/* Right side stats */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px]">
          <div className="text-right">
            <span className="text-red-400/60">Sup </span>
            <span className="text-white font-mono">{stats.upper.toFixed(5)}</span>
          </div>
          <div className="text-right">
            <span className="text-gray-500">SMA </span>
            <span className="text-white font-mono">{stats.middle.toFixed(5)}</span>
          </div>
          <div className="text-right">
            <span className="text-green-400/60">Inf </span>
            <span className="text-white font-mono">{stats.lower.toFixed(5)}</span>
          </div>
          <div className="text-right">
            <span className="text-purple-400/60">%B </span>
            <span className={cn(
              "font-mono font-bold",
              stats.percentB > 80 ? "text-red-400" : stats.percentB < 20 ? "text-green-400" : "text-white"
            )}>{stats.percentB.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* ── %B Position Bar ── */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[9px] text-gray-600">
          <span>Banda Inferior</span>
          <span>SMA 20</span>
          <span>Banda Superior</span>
        </div>
        <div className="relative h-2 rounded-full overflow-hidden bg-gray-800/50">
          {/* Zone gradients */}
          <div className="absolute inset-y-0 left-0 w-[20%] bg-gradient-to-r from-[#00d4aa]/25 to-transparent rounded-l-full" />
          <div className="absolute inset-y-0 right-0 w-[20%] bg-gradient-to-l from-[#ff4976]/25 to-transparent rounded-r-full" />
          {/* Center marker */}
          <div className="absolute inset-y-0 left-1/2 w-px bg-gray-600/40" />
          {/* Position dot */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow-lg transition-all duration-500"
            style={{
              left: `calc(${Math.min(100, Math.max(0, stats.percentB))}% - 6px)`,
              backgroundColor: stats.percentB > 80 ? '#ff4976' : stats.percentB < 20 ? '#00d4aa' : '#06b6d4',
            }}
          />
        </div>
      </div>

      {/* ── Bandwidth Bar ── */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-gray-600 w-16 shrink-0">Ancho</span>
        <div className="flex-1 h-1.5 bg-gray-800/50 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              stats.squeeze ? "bg-yellow-500/60" : "bg-blue-500/40"
            )}
            style={{ width: `${Math.min(100, stats.bandwidth * 200)}%` }}
          />
        </div>
        <div className="flex items-center gap-1 text-[9px]">
          {stats.squeezeTrend === 'expanding' ? (
            <><Maximize2 className="w-3 h-3 text-blue-400" /><span className="text-blue-400">Expandiendo</span></>
          ) : stats.squeezeTrend === 'contracting' ? (
            <><Minimize2 className="w-3 h-3 text-yellow-400" /><span className="text-yellow-400">Contrayendo</span></>
          ) : (
            <span className="text-gray-500">Estable</span>
          )}
        </div>
      </div>

      {/* ── Chart ── */}
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="bbBandFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.12} />
                <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.06} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.12} />
              </linearGradient>
              <linearGradient id="bbPriceGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="time"
              tick={{ fill: '#4b5563', fontSize: 9, fontFamily: 'monospace' }}
              axisLine={{ stroke: '#1e293b' }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fill: '#4b5563', fontSize: 9, fontFamily: 'monospace' }}
              axisLine={{ stroke: '#1e293b' }}
              tickLine={false}
              width={50}
              tickFormatter={(v) => v.toFixed(4)}
            />
            <Tooltip content={<BollingerTooltip />} />

            {/* Band fill area */}
            <Area type="monotone" dataKey="upper" stroke="none" fill="url(#bbBandFill)" isAnimationActive={false} />
            <Area type="monotone" dataKey="lower" stroke="none" fill="#0a1628" isAnimationActive={false} />

            {/* Band lines */}
            <Line type="monotone" dataKey="upper" stroke="#ff4976" strokeWidth={1} strokeOpacity={0.5} strokeDasharray="4 2" dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="middle" stroke="#6b7280" strokeWidth={1} strokeDasharray="2 4" dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="lower" stroke="#00d4aa" strokeWidth={1} strokeOpacity={0.5} strokeDasharray="4 2" dot={false} isAnimationActive={false} />

            {/* Price line */}
            <Line
              type="monotone" dataKey="price" stroke="url(#bbPriceGrad)" strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: '#06b6d4', strokeWidth: 2, fill: '#0a1628' }}
              isAnimationActive={false}
            />

            {/* Realtime price */}
            {realtimePrice && (
              <ReferenceLine
                y={realtimePrice}
                stroke={isRealtimeConnected ? '#22c55e' : '#3b82f6'}
                strokeWidth={1.5}
                strokeDasharray={isRealtimeConnected ? '0' : '5 5'}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ── Legend ── */}
      <div className="flex items-center justify-between text-[9px] text-gray-600 px-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="w-3 h-0.5 rounded-full bg-cyan-400" />
            <span>Precio</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-0.5 rounded-full bg-gray-500" />
            <span>SMA 20</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="w-3 h-0.5 rounded-full" style={{ background: '#ff4976', opacity: 0.5 }} />
            <span>Banda Sup.</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-0.5 rounded-full" style={{ background: '#00d4aa', opacity: 0.5 }} />
            <span>Banda Inf.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
