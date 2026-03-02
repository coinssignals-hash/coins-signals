import { useMemo } from 'react';
import {
  ComposedChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, ReferenceArea
} from 'recharts';
import { Loader2, AlertTriangle, TrendingUp, TrendingDown, Zap, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StochasticChartProps {
  pair: string;
  timeframe: string;
  priceData?: Array<{ time: string; price: number; high: number; low: number; open: number }>;
  apiStochastic?: Array<{ time: string; slowK: number; slowD: number }>;
  loading?: boolean;
  error?: string | null;
  realtimePrice?: number | null;
  isRealtimeConnected?: boolean;
}

interface StochPoint {
  time: string;
  k: number;
  d: number;
  crossover?: 'bullish' | 'bearish';
}

function calculateStochasticSeries(
  priceData: StochasticChartProps['priceData'],
  kPeriod = 14,
  dPeriod = 3
): StochPoint[] {
  if (!priceData || priceData.length === 0) return [];

  const kValues: number[] = [];

  return priceData.map((p, i) => {
    const date = new Date(p.time);
    const timeLabel = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;

    const slice = priceData.slice(Math.max(0, i - kPeriod + 1), i + 1);
    const highestHigh = Math.max(...slice.map(s => s.high));
    const lowestLow = Math.min(...slice.map(s => s.low));
    const range = highestHigh - lowestLow;
    const k = range > 0 ? ((p.price - lowestLow) / range) * 100 : 50;
    kValues.push(Math.max(0, Math.min(100, k)));

    // %D = SMA of %K
    const dSlice = kValues.slice(-dPeriod);
    const d = dSlice.reduce((a, b) => a + b, 0) / dSlice.length;

    // Crossover detection
    let crossover: StochPoint['crossover'];
    if (kValues.length >= 2) {
      const prevK = kValues[kValues.length - 2];
      const prevDSlice = kValues.slice(-dPeriod - 1, -1);
      const prevD = prevDSlice.length > 0 ? prevDSlice.reduce((a, b) => a + b, 0) / prevDSlice.length : d;

      if (prevK <= prevD && k > d) crossover = 'bullish';
      else if (prevK >= prevD && k < d) crossover = 'bearish';
    }

    return {
      time: timeLabel,
      k: Math.round(k * 10) / 10,
      d: Math.round(d * 10) / 10,
      crossover,
    };
  });
}

// Realtime %K
function calcRealtimeK(
  priceData: StochasticChartProps['priceData'],
  realtimePrice: number,
  period = 14
): number | null {
  if (!priceData || priceData.length < period) return null;
  const slice = priceData.slice(-period);
  const hh = Math.max(...slice.map(p => p.high), realtimePrice);
  const ll = Math.min(...slice.map(p => p.low), realtimePrice);
  const range = hh - ll;
  if (range === 0) return 50;
  return Math.max(0, Math.min(100, ((realtimePrice - ll) / range) * 100));
}

// Custom crossover dot
const CrossoverDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!payload?.crossover || !cx || !cy) return null;
  const isBullish = payload.crossover === 'bullish';
  const color = isBullish ? '#22c55e' : '#ef4444';

  return (
    <g>
      <circle cx={cx} cy={cy} r={5} fill={color} fillOpacity={0.25} stroke={color} strokeWidth={1.5} />
      <circle cx={cx} cy={cy} r={2} fill={color} />
      <text x={cx} y={cy - 10} textAnchor="middle" fill={color} fontSize={9} fontWeight="bold">
        {isBullish ? '▲' : '▼'}
      </text>
    </g>
  );
};

// Custom tooltip
const StochTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const k = payload.find((p: any) => p.dataKey === 'k')?.value;
  const d = payload.find((p: any) => p.dataKey === 'd')?.value;
  const zone = k >= 80 ? 'Sobrecompra' : k <= 20 ? 'Sobreventa' : 'Neutral';
  const zoneColor = k >= 80 ? 'text-red-400' : k <= 20 ? 'text-green-400' : 'text-gray-400';

  return (
    <div className="bg-[#0a1628]/95 border border-cyan-900/40 rounded-lg px-3 py-2 shadow-xl backdrop-blur-sm">
      <p className="text-[10px] text-gray-500 mb-1.5">{label}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-[10px] text-purple-400">%K</span>
          <span className="text-xs font-mono font-bold text-white">{k?.toFixed(1)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-[10px] text-orange-400">%D</span>
          <span className="text-xs font-mono font-bold text-white">{d?.toFixed(1)}</span>
        </div>
        <div className="border-t border-gray-700 pt-1">
          <span className={cn("text-[10px] font-medium", zoneColor)}>{zone}</span>
        </div>
      </div>
    </div>
  );
};

export function StochasticChart({
  pair, timeframe, priceData, apiStochastic, loading, error, realtimePrice, isRealtimeConnected = false,
}: StochasticChartProps) {
  const chartData = useMemo(() => {
    // Use API stochastic data if available
    if (apiStochastic && apiStochastic.length > 0) {
      return apiStochastic.map((s, i) => {
        const date = new Date(s.time);
        const timeLabel = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        let crossover: StochPoint['crossover'];
        if (i > 0) {
          const prev = apiStochastic[i - 1];
          if (prev.slowK <= prev.slowD && s.slowK > s.slowD) crossover = 'bullish';
          else if (prev.slowK >= prev.slowD && s.slowK < s.slowD) crossover = 'bearish';
        }
        return { time: timeLabel, k: Math.round(s.slowK * 10) / 10, d: Math.round(s.slowD * 10) / 10, crossover };
      });
    }
    return calculateStochasticSeries(priceData);
  }, [priceData, apiStochastic]);

  const realtimeK = useMemo(() => {
    if (!realtimePrice || !priceData) return null;
    return calcRealtimeK(priceData, realtimePrice);
  }, [priceData, realtimePrice]);

  const stats = useMemo(() => {
    if (chartData.length === 0) return {
      k: 50, d: 50, position: 'neutral' as const,
      signal: 'hold' as const, crossovers: 0, lastCrossover: null as null | 'bullish' | 'bearish',
      trend: 'flat' as const,
    };

    const latest = chartData[chartData.length - 1];
    const currentK = realtimeK ?? latest.k;
    const position = currentK >= 80 ? 'overbought' as const
      : currentK <= 20 ? 'oversold' as const
      : 'neutral' as const;

    // Signal from crossovers in zones
    let signal: 'buy' | 'sell' | 'hold' = 'hold';
    const crossoverPoints = chartData.filter(d => d.crossover);
    const lastCross = crossoverPoints.length > 0 ? crossoverPoints[crossoverPoints.length - 1] : null;

    if (lastCross) {
      if (lastCross.crossover === 'bullish' && lastCross.k < 30) signal = 'buy';
      else if (lastCross.crossover === 'bearish' && lastCross.k > 70) signal = 'sell';
    }

    // %K trend
    const recent = chartData.slice(-5).map(d => d.k);
    const delta = recent[recent.length - 1] - recent[0];
    const trend = delta > 5 ? 'rising' as const : delta < -5 ? 'falling' as const : 'flat' as const;

    return {
      k: currentK, d: latest.d, position, signal,
      crossovers: crossoverPoints.length,
      lastCrossover: lastCross?.crossover ?? null,
      trend,
    };
  }, [chartData, realtimeK]);

  if (loading) {
    return (
      <div className="h-[320px] w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
          <span className="text-[10px] text-gray-500">Cargando Estocástico...</span>
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
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Estocástico (14,3,3)</span>
            <div className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold",
              stats.position === 'overbought' && "bg-red-500/15 text-red-400",
              stats.position === 'oversold' && "bg-green-500/15 text-green-400",
              stats.position === 'neutral' && "bg-gray-500/15 text-gray-400",
            )}>
              {stats.position === 'overbought' ? <TrendingDown className="w-3 h-3" /> :
               stats.position === 'oversold' ? <TrendingUp className="w-3 h-3" /> :
               <ArrowUpDown className="w-3 h-3" />}
              {stats.position === 'overbought' ? 'SOBRECOMPRA' :
               stats.position === 'oversold' ? 'SOBREVENTA' : 'NEUTRAL'}
            </div>
            {stats.signal !== 'hold' && (
              <div className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold",
                stats.signal === 'buy' ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
              )}>
                <Zap className="w-3 h-3" />
                {stats.signal === 'buy' ? 'COMPRA' : 'VENTA'}
              </div>
            )}
            {isRealtimeConnected && realtimePrice && (
              <div className="flex items-center gap-1 bg-green-500/15 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] text-green-400 font-medium">LIVE</span>
              </div>
            )}
          </div>

          {/* Values */}
          <div className="flex items-baseline gap-3">
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] text-purple-400">%K</span>
              <span className={cn(
                "text-xl font-bold font-mono tabular-nums",
                realtimeK !== null ? "text-green-400" : "text-white"
              )}>{stats.k.toFixed(1)}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] text-orange-400">%D</span>
              <span className="text-xl font-bold font-mono tabular-nums text-white">{stats.d.toFixed(1)}</span>
            </div>
            <div className={cn(
              "flex items-center gap-0.5 text-[10px]",
              stats.trend === 'rising' ? "text-green-400" : stats.trend === 'falling' ? "text-red-400" : "text-gray-500"
            )}>
              {stats.trend === 'rising' ? '▲ Subiendo' : stats.trend === 'falling' ? '▼ Cayendo' : '─ Lateral'}
            </div>
          </div>
        </div>

        {/* Right: mini stats */}
        <div className="flex flex-col items-end gap-1 text-[10px]">
          {stats.lastCrossover && (
            <div className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-full font-medium",
              stats.lastCrossover === 'bullish' ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
            )}>
              <Zap className="w-3 h-3" />
              Cruce {stats.lastCrossover === 'bullish' ? '↑' : '↓'}
            </div>
          )}
          <div className="text-gray-500">
            Cruces: <span className="text-white font-mono">{stats.crossovers}</span>
          </div>
        </div>
      </div>

      {/* ── Position Gauge ── */}
      <div className="relative h-2 rounded-full overflow-hidden bg-gray-800/50">
        <div className="absolute inset-y-0 left-0 w-[20%] bg-gradient-to-r from-green-500/30 to-transparent rounded-l-full" />
        <div className="absolute inset-y-0 right-0 w-[20%] bg-gradient-to-l from-red-500/30 to-transparent rounded-r-full" />
        <div className="absolute inset-y-0 left-[20%] w-px bg-green-500/40" />
        <div className="absolute inset-y-0 left-[50%] w-px bg-gray-600/30" />
        <div className="absolute inset-y-0 left-[80%] w-px bg-red-500/40" />
        {/* %K position */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-purple-300 shadow-lg transition-all duration-500"
          style={{
            left: `calc(${Math.min(100, Math.max(0, stats.k))}% - 6px)`,
            backgroundColor: stats.position === 'overbought' ? '#ef4444' : stats.position === 'oversold' ? '#22c55e' : '#a855f7',
          }}
        />
        {/* %D position (smaller) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-orange-400/70 border border-orange-300/50 transition-all duration-500"
          style={{ left: `calc(${Math.min(100, Math.max(0, stats.d))}% - 4px)` }}
        />
      </div>

      {/* ── Chart ── */}
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="stochOBZone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="stochOSZone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.02} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0.1} />
              </linearGradient>
            </defs>

            {/* Zones */}
            <ReferenceArea y1={80} y2={100} fill="url(#stochOBZone)" />
            <ReferenceArea y1={0} y2={20} fill="url(#stochOSZone)" />

            <XAxis
              dataKey="time"
              tick={{ fill: '#4b5563', fontSize: 9, fontFamily: 'monospace' }}
              axisLine={{ stroke: '#1e293b' }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 20, 50, 80, 100]}
              tick={{ fill: '#4b5563', fontSize: 9, fontFamily: 'monospace' }}
              axisLine={{ stroke: '#1e293b' }}
              tickLine={false}
              width={28}
            />
            <Tooltip content={<StochTooltip />} />

            <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="4 3" strokeOpacity={0.5} />
            <ReferenceLine y={20} stroke="#22c55e" strokeDasharray="4 3" strokeOpacity={0.5} />
            <ReferenceLine y={50} stroke="#374151" strokeDasharray="2 4" strokeOpacity={0.3} />

            {/* Realtime %K */}
            {realtimeK !== null && (
              <ReferenceLine
                y={realtimeK}
                stroke={isRealtimeConnected ? '#22c55e' : '#a855f7'}
                strokeWidth={1.5}
                strokeDasharray={isRealtimeConnected ? '0' : '5 5'}
              />
            )}

            {/* %K line */}
            <Line
              type="monotone" dataKey="k" stroke="#a855f7" strokeWidth={2}
              dot={<CrossoverDot />}
              activeDot={{ r: 4, stroke: '#a855f7', strokeWidth: 2, fill: '#0a1628' }}
              isAnimationActive={false}
            />
            {/* %D line */}
            <Line
              type="monotone" dataKey="d" stroke="#f97316" strokeWidth={1.5}
              strokeDasharray="4 2" dot={false} isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ── Legend ── */}
      <div className="flex items-center justify-between text-[9px] text-gray-600 px-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="w-3 h-0.5 rounded-full bg-purple-500" />
            <span>%K (rápido)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-0.5 rounded-full bg-orange-400 opacity-70" />
            <span>%D (lento)</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500/40" />
            <span>Sobreventa &lt;20</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500/40" />
            <span>Sobrecompra &gt;80</span>
          </div>
        </div>
      </div>
    </div>
  );
}
