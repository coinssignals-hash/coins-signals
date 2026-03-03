import { useMemo } from 'react';
import {
  ComposedChart, Line, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, ReferenceArea, Dot
} from 'recharts';
import { Loader2, TrendingUp, TrendingDown, AlertTriangle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RSIChartProps {
  pair: string;
  timeframe: string;
  rsiData?: Array<{ time: string; rsi: number }>;
  loading?: boolean;
  error?: string | null;
}

interface ChartPoint {
  time: string;
  rsi: number;
  overbought: number;
  oversold: number;
  signalType?: 'enter_overbought' | 'exit_overbought' | 'enter_oversold' | 'exit_oversold';
}

// Detect divergences between RSI and price movement
function detectDivergences(data: ChartPoint[]): { type: 'bullish' | 'bearish'; index: number }[] {
  const divergences: { type: 'bullish' | 'bearish'; index: number }[] = [];
  if (data.length < 10) return divergences;

  for (let i = 5; i < data.length; i++) {
    const rsiTrend = data[i].rsi - data[i - 5].rsi;
    // Simple heuristic: if RSI drops significantly while still high = bearish divergence
    if (data[i].rsi > 60 && rsiTrend < -8) {
      divergences.push({ type: 'bearish', index: i });
    }
    // RSI rises significantly while still low = bullish divergence
    if (data[i].rsi < 40 && rsiTrend > 8) {
      divergences.push({ type: 'bullish', index: i });
    }
  }
  return divergences;
}

// Detect level crossings for signal markers
function detectSignals(data: ChartPoint[]): ChartPoint[] {
  return data.map((point, i) => {
    if (i === 0) return point;
    const prev = data[i - 1];

    let signalType: ChartPoint['signalType'];
    if (prev.rsi < 70 && point.rsi >= 70) signalType = 'enter_overbought';
    else if (prev.rsi >= 70 && point.rsi < 70) signalType = 'exit_overbought';
    else if (prev.rsi > 30 && point.rsi <= 30) signalType = 'enter_oversold';
    else if (prev.rsi <= 30 && point.rsi > 30) signalType = 'exit_oversold';

    return { ...point, signalType };
  });
}

// Custom dot for signal markers
const SignalDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!payload?.signalType || !cx || !cy) return null;

  const isBullish = payload.signalType === 'exit_oversold' || payload.signalType === 'enter_oversold';
  const color = isBullish ? '#00d4aa' : '#ff4976';

  return (
    <g>
      <circle cx={cx} cy={cy} r={5} fill={color} fillOpacity={0.3} stroke={color} strokeWidth={1.5} />
      <circle cx={cx} cy={cy} r={2} fill={color} />
    </g>
  );
};

// Custom tooltip
const RSITooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.[0]) return null;
  const rsi = payload[0].value;
  const zone = rsi >= 70 ? 'Sobrecompra' : rsi <= 30 ? 'Sobreventa' : 'Neutral';
  const zoneColor = rsi >= 70 ? 'text-red-400' : rsi <= 30 ? 'text-green-400' : 'text-gray-400';

  return (
    <div className="bg-[#0a1628]/95 border border-cyan-900/40 rounded-lg px-3 py-2 shadow-xl backdrop-blur-sm">
      <p className="text-[10px] text-gray-500 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-white font-mono">{rsi?.toFixed(2)}</span>
        <span className={cn("text-[10px] font-medium", zoneColor)}>{zone}</span>
      </div>
    </div>
  );
};

export function RSIChart({ pair, timeframe, rsiData, loading, error }: RSIChartProps) {
  const chartData = useMemo(() => {
    if (!rsiData || rsiData.length === 0) return [];

    const mapped: ChartPoint[] = rsiData.map((item) => {
      const parts = item.time.split(' ');
      const timeLabel = parts[1]?.substring(0, 5) || item.time.split('T')[0];
      return {
        time: timeLabel,
        rsi: item.rsi,
        overbought: 70,
        oversold: 30,
      };
    });

    return detectSignals(mapped);
  }, [rsiData]);

  const divergences = useMemo(() => detectDivergences(chartData), [chartData]);

  const stats = useMemo(() => {
    if (chartData.length === 0) return {
      current: 50, status: 'neutral' as const, trend: 'flat' as const,
      min: 0, max: 100, avg: 50, signalCount: 0, latestDivergence: null as null | 'bullish' | 'bearish',
    };

    const current = chartData[chartData.length - 1].rsi;
    const values = chartData.map(d => d.rsi);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const status = current >= 70 ? 'overbought' as const : current <= 30 ? 'oversold' as const : 'neutral' as const;

    // Determine RSI trend (last 5 candles)
    const recent = values.slice(-5);
    const trendDelta = recent[recent.length - 1] - recent[0];
    const trend = trendDelta > 3 ? 'rising' as const : trendDelta < -3 ? 'falling' as const : 'flat' as const;

    const signalCount = chartData.filter(d => d.signalType).length;
    const latestDiv = divergences.length > 0 ? divergences[divergences.length - 1].type : null;

    return { current, status, trend, min, max, avg, signalCount, latestDivergence: latestDiv };
  }, [chartData, divergences]);

  if (loading) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
          <span className="text-[10px] text-gray-500">Cargando RSI...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center">
        <div className="text-center space-y-1">
          <AlertTriangle className="w-5 h-5 text-red-400 mx-auto" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center text-gray-500">
        <p className="text-xs">Sin datos RSI disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ── Header Stats ── */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">RSI (14)</span>
            <div className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold",
              stats.status === 'overbought' && "bg-red-500/15 text-red-400",
              stats.status === 'oversold' && "bg-green-500/15 text-green-400",
              stats.status === 'neutral' && "bg-gray-500/15 text-gray-400",
            )}>
              {stats.status === 'overbought' && <TrendingDown className="w-3 h-3" />}
              {stats.status === 'oversold' && <TrendingUp className="w-3 h-3" />}
              {stats.status === 'overbought' ? 'SOBRECOMPRA' :
               stats.status === 'oversold' ? 'SOBREVENTA' : 'NEUTRAL'}
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={cn(
              "text-2xl font-bold font-mono tabular-nums",
              stats.status === 'overbought' && "text-red-400",
              stats.status === 'oversold' && "text-green-400",
              stats.status === 'neutral' && "text-white",
            )}>
              {stats.current.toFixed(1)}
            </span>
            <div className={cn(
              "flex items-center gap-0.5 text-[10px]",
              stats.trend === 'rising' && "text-green-400",
              stats.trend === 'falling' && "text-red-400",
              stats.trend === 'flat' && "text-gray-500",
            )}>
              {stats.trend === 'rising' && '▲'}
              {stats.trend === 'falling' && '▼'}
              {stats.trend === 'flat' && '─'}
              {stats.trend === 'rising' ? 'Subiendo' : stats.trend === 'falling' ? 'Cayendo' : 'Lateral'}
            </div>
          </div>
        </div>

        {/* Right side: mini stats */}
        <div className="flex gap-3 text-[10px]">
          <div className="text-right space-y-0.5">
            <div className="text-gray-500">Máx</div>
            <div className="text-white font-mono">{stats.max.toFixed(1)}</div>
          </div>
          <div className="text-right space-y-0.5">
            <div className="text-gray-500">Mín</div>
            <div className="text-white font-mono">{stats.min.toFixed(1)}</div>
          </div>
          <div className="text-right space-y-0.5">
            <div className="text-gray-500">Media</div>
            <div className="text-white font-mono">{stats.avg.toFixed(1)}</div>
          </div>
          {stats.signalCount > 0 && (
            <div className="text-right space-y-0.5">
              <div className="text-gray-500">Señales</div>
              <div className="text-cyan-400 font-mono">{stats.signalCount}</div>
            </div>
          )}
        </div>
      </div>

      {/* Divergence Alert */}
      {stats.latestDivergence && (
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-medium",
          stats.latestDivergence === 'bullish'
            ? "bg-green-500/10 border border-green-500/20 text-green-400"
            : "bg-red-500/10 border border-red-500/20 text-red-400"
        )}>
          <Zap className="w-3.5 h-3.5" />
          Divergencia {stats.latestDivergence === 'bullish' ? 'alcista' : 'bajista'} detectada
        </div>
      )}

      {/* ── RSI Mini Gauge Bar ── */}
      <div className="relative h-2 rounded-full overflow-hidden bg-gray-800/50">
        {/* Zone colors */}
        <div className="absolute inset-y-0 left-0 w-[30%] bg-gradient-to-r from-[#00d4aa]/30 to-[#00d4aa]/10 rounded-l-full" />
        <div className="absolute inset-y-0 right-0 w-[30%] bg-gradient-to-l from-[#ff4976]/30 to-[#ff4976]/10 rounded-r-full" />
        {/* Position indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow-lg transition-all duration-500"
          style={{
            left: `calc(${Math.min(100, Math.max(0, stats.current))}% - 6px)`,
            backgroundColor: stats.status === 'overbought' ? '#ff4976' : stats.status === 'oversold' ? '#00d4aa' : '#06b6d4',
          }}
        />
        {/* Level markers */}
        <div className="absolute inset-y-0 left-[30%] w-px" style={{ background: 'rgba(0,212,170,0.4)' }} />
        <div className="absolute inset-y-0 left-[50%] w-px bg-gray-600/30" />
        <div className="absolute inset-y-0 left-[70%] w-px" style={{ background: 'rgba(255,73,118,0.4)' }} />
      </div>

      {/* ── Chart ── */}
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="rsiLineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="50%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
              <linearGradient id="rsiAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="overboughtZone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff4976" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#ff4976" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="oversoldZone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00d4aa" stopOpacity={0.02} />
                <stop offset="100%" stopColor="#00d4aa" stopOpacity={0.12} />
              </linearGradient>
            </defs>

            {/* Overbought zone */}
            <ReferenceArea y1={70} y2={100} fill="url(#overboughtZone)" />
            {/* Oversold zone */}
            <ReferenceArea y1={0} y2={30} fill="url(#oversoldZone)" />

            <XAxis
              dataKey="time"
              tick={{ fill: '#4b5563', fontSize: 9, fontFamily: 'monospace' }}
              axisLine={{ stroke: '#1e293b' }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 20, 30, 50, 70, 80, 100]}
              tick={{ fill: '#4b5563', fontSize: 9, fontFamily: 'monospace' }}
              axisLine={{ stroke: '#1e293b' }}
              tickLine={false}
              width={28}
            />
            <Tooltip content={<RSITooltip />} />

            {/* Reference lines */}
            <ReferenceLine y={70} stroke="#ff4976" strokeDasharray="4 3" strokeOpacity={0.6} />
            <ReferenceLine y={30} stroke="#00d4aa" strokeDasharray="4 3" strokeOpacity={0.6} />
            <ReferenceLine y={50} stroke="#374151" strokeDasharray="2 4" strokeOpacity={0.4} />

            {/* RSI Area fill */}
            <Area
              type="monotone"
              dataKey="rsi"
              stroke="none"
              fill="url(#rsiAreaGrad)"
              isAnimationActive={false}
            />

            {/* RSI Line */}
            <Line
              type="monotone"
              dataKey="rsi"
              stroke="url(#rsiLineGrad)"
              strokeWidth={2}
              dot={<SignalDot />}
              activeDot={{ r: 4, stroke: '#06b6d4', strokeWidth: 2, fill: '#0a1628' }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ── Zone Legend ── */}
      <div className="flex items-center justify-between text-[9px] text-gray-600 px-1">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ background: 'rgba(0,212,170,0.4)' }} />
          <span>Sobreventa &lt;30</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-gray-500/40" />
          <span>Neutral 30-70</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ background: 'rgba(255,73,118,0.4)' }} />
          <span>Sobrecompra &gt;70</span>
        </div>
      </div>
    </div>
  );
}
