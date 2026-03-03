import { useMemo } from 'react';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell
} from 'recharts';
import { Loader2, AlertTriangle, Zap, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MACDChartProps {
  pair: string;
  timeframe: string;
  macdData?: Array<{ time: string; macd: number; signal: number; histogram: number }>;
  loading?: boolean;
  error?: string | null;
}

interface ChartPoint {
  time: string;
  macd: number;
  signal: number;
  histogram: number;
  crossover?: 'bullish' | 'bearish';
  histAccel?: 'accelerating' | 'decelerating';
}

function processData(raw: MACDChartProps['macdData']): ChartPoint[] {
  if (!raw || raw.length === 0) return [];

  return raw.map((item, i) => {
    const parts = item.time.split(' ');
    const timeLabel = parts[1]?.substring(0, 5) || item.time.split('T')[0];

    let crossover: ChartPoint['crossover'];
    if (i > 0) {
      const prev = raw[i - 1];
      if (prev.macd <= prev.signal && item.macd > item.signal) crossover = 'bullish';
      else if (prev.macd >= prev.signal && item.macd < item.signal) crossover = 'bearish';
    }

    let histAccel: ChartPoint['histAccel'];
    if (i > 0) {
      const prevHist = raw[i - 1].histogram;
      if (Math.abs(item.histogram) > Math.abs(prevHist)) histAccel = 'accelerating';
      else histAccel = 'decelerating';
    }

    return {
      time: timeLabel,
      macd: item.macd,
      signal: item.signal,
      histogram: item.histogram,
      crossover,
      histAccel,
    };
  });
}

// Custom dot for crossover markers
const CrossoverDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!payload?.crossover || !cx || !cy) return null;

  const isBullish = payload.crossover === 'bullish';
  const color = isBullish ? '#00d4aa' : '#ff4976';

  return (
    <g>
      <circle cx={cx} cy={cy} r={6} fill={color} fillOpacity={0.2} stroke={color} strokeWidth={1.5} />
      <circle cx={cx} cy={cy} r={2.5} fill={color} />
      {/* Arrow indicator */}
      <text x={cx} y={cy - 10} textAnchor="middle" fill={color} fontSize={10} fontWeight="bold">
        {isBullish ? '▲' : '▼'}
      </text>
    </g>
  );
};

// Custom tooltip
const MACDTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  const macd = payload.find((p: any) => p.dataKey === 'macd')?.value;
  const signal = payload.find((p: any) => p.dataKey === 'signal')?.value;
  const hist = payload.find((p: any) => p.dataKey === 'histogram')?.value;

  return (
    <div className="bg-[#0a1628]/95 border border-cyan-900/40 rounded-lg px-3 py-2 shadow-xl backdrop-blur-sm">
      <p className="text-[10px] text-gray-500 mb-1.5">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[10px] text-cyan-400">MACD</span>
          <span className="text-xs font-mono font-bold text-white">{macd?.toFixed(5)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[10px] text-orange-400">Signal</span>
          <span className="text-xs font-mono font-bold text-white">{signal?.toFixed(5)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[10px] text-gray-400">Hist</span>
          <span className={cn(
            "text-xs font-mono font-bold",
            hist >= 0 ? "text-green-400" : "text-red-400"
          )}>{hist?.toFixed(5)}</span>
        </div>
      </div>
    </div>
  );
};

export function MACDChart({ pair, timeframe, macdData, loading, error }: MACDChartProps) {
  const chartData = useMemo(() => processData(macdData), [macdData]);

  const stats = useMemo(() => {
    if (chartData.length === 0) return {
      macd: 0, signal: 0, histogram: 0,
      trend: 'neutral' as const,
      momentum: 'neutral' as const,
      crossovers: 0,
      lastCrossover: null as null | 'bullish' | 'bearish',
      histStreak: 0,
      convergence: 'neutral' as const,
    };

    const latest = chartData[chartData.length - 1];
    const trend = latest.macd > latest.signal ? 'bullish' as const : 'bearish' as const;

    // Momentum: histogram acceleration
    const momentum = latest.histAccel === 'accelerating'
      ? (latest.histogram > 0 ? 'bullish' as const : 'bearish' as const)
      : 'neutral' as const;

    // Count crossovers
    const crossoverPoints = chartData.filter(d => d.crossover);
    const lastCrossover = crossoverPoints.length > 0
      ? crossoverPoints[crossoverPoints.length - 1].crossover!
      : null;

    // Histogram streak (consecutive same-sign bars)
    let histStreak = 0;
    const sign = latest.histogram >= 0;
    for (let i = chartData.length - 1; i >= 0; i--) {
      if ((chartData[i].histogram >= 0) === sign) histStreak++;
      else break;
    }

    // MACD-Signal convergence
    const diff = Math.abs(latest.macd - latest.signal);
    const prevDiff = chartData.length > 1 ? Math.abs(chartData[chartData.length - 2].macd - chartData[chartData.length - 2].signal) : diff;
    const convergence = diff < prevDiff ? 'converging' as const : 'diverging' as const;

    return {
      macd: latest.macd, signal: latest.signal, histogram: latest.histogram,
      trend, momentum, crossovers: crossoverPoints.length,
      lastCrossover, histStreak, convergence,
    };
  }, [chartData]);

  if (loading) {
    return (
      <div className="h-[320px] w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
          <span className="text-[10px] text-gray-500">Cargando MACD...</span>
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
        <p className="text-xs">Sin datos MACD disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">MACD (12,26,9)</span>
            <div className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold",
              stats.trend === 'bullish' ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400",
            )}>
              {stats.trend === 'bullish' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {stats.trend === 'bullish' ? 'ALCISTA' : 'BAJISTA'}
            </div>
            {stats.convergence === 'converging' && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-500/10 text-yellow-400">
                <ArrowRightLeft className="w-3 h-3" />
                Convergiendo
              </div>
            )}
          </div>

          {/* Values row */}
          <div className="flex items-center gap-3">
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] text-cyan-500">MACD</span>
              <span className="text-sm font-bold font-mono text-white">{stats.macd.toFixed(5)}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] text-orange-400">Signal</span>
              <span className="text-sm font-bold font-mono text-white">{stats.signal.toFixed(5)}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] text-gray-500">Hist</span>
              <span className={cn(
                "text-sm font-bold font-mono",
                stats.histogram >= 0 ? "text-green-400" : "text-red-400"
              )}>{stats.histogram.toFixed(5)}</span>
            </div>
          </div>
        </div>

        {/* Right side: mini badges */}
        <div className="flex flex-col items-end gap-1 text-[10px]">
          {stats.lastCrossover && (
            <div className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-full font-medium",
              stats.lastCrossover === 'bullish'
                ? "bg-green-500/15 text-green-400"
                : "bg-red-500/15 text-red-400"
            )}>
              <Zap className="w-3 h-3" />
              Cruce {stats.lastCrossover === 'bullish' ? '↑' : '↓'}
            </div>
          )}
          <div className="text-gray-500">
            Racha: <span className="text-white font-mono">{stats.histStreak}</span> barras
          </div>
        </div>
      </div>

      {/* ── Momentum Bar ── */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-gray-600 w-16 shrink-0">Momentum</span>
        <div className="flex-1 h-1.5 bg-gray-800/50 rounded-full overflow-hidden relative">
          <div className="absolute inset-y-0 left-1/2 w-px bg-gray-600/40" />
          {stats.histogram >= 0 ? (
            <div
              className="absolute inset-y-0 left-1/2 bg-gradient-to-r from-green-500/60 to-green-400 rounded-r-full transition-all duration-500"
              style={{ width: `${Math.min(50, Math.abs(stats.histogram) * 5000)}%` }}
            />
          ) : (
            <div
              className="absolute inset-y-0 right-1/2 bg-gradient-to-l from-red-500/60 to-red-400 rounded-l-full transition-all duration-500"
              style={{ width: `${Math.min(50, Math.abs(stats.histogram) * 5000)}%` }}
            />
          )}
        </div>
        <span className={cn(
          "text-[9px] font-mono w-8 text-right",
          stats.histogram >= 0 ? "text-green-400" : "text-red-400"
        )}>
          {stats.histogram >= 0 ? '+' : ''}{(stats.histogram * 10000).toFixed(1)}
        </span>
      </div>

      {/* ── Chart ── */}
      <div className="h-[230px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="macdLineGrad" x1="0" y1="0" x2="1" y2="0">
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
              tick={{ fill: '#4b5563', fontSize: 9, fontFamily: 'monospace' }}
              axisLine={{ stroke: '#1e293b' }}
              tickLine={false}
              width={45}
              tickFormatter={(v) => v.toFixed(4)}
            />
            <Tooltip content={<MACDTooltip />} />
            <ReferenceLine y={0} stroke="#374151" strokeDasharray="3 3" strokeOpacity={0.5} />

            {/* Histogram bars with gradient coloring */}
            <Bar dataKey="histogram" barSize={4} radius={[2, 2, 0, 0]} isAnimationActive={false}>
              {chartData.map((entry, index) => {
                const isPositive = entry.histogram >= 0;
                const isAccelerating = entry.histAccel === 'accelerating';
                let fill: string;
                if (isPositive) {
                  fill = isAccelerating ? '#00d4aa' : 'rgba(0,212,170,0.45)';
                } else {
                  fill = isAccelerating ? '#ff4976' : 'rgba(255,73,118,0.45)';
                }
                return <Cell key={`hist-${index}`} fill={fill} />;
              })}
            </Bar>

            {/* MACD Line */}
            <Line
              type="monotone"
              dataKey="macd"
              stroke="url(#macdLineGrad)"
              strokeWidth={2}
              dot={<CrossoverDot />}
              activeDot={{ r: 4, stroke: '#06b6d4', strokeWidth: 2, fill: '#0a1628' }}
              isAnimationActive={false}
            />

            {/* Signal Line */}
            <Line
              type="monotone"
              dataKey="signal"
              stroke="#f97316"
              strokeWidth={1.5}
              strokeDasharray="4 2"
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ── Legend ── */}
      <div className="flex items-center justify-between text-[9px] text-gray-600 px-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="w-3 h-0.5 rounded-full bg-cyan-400" />
            <span>MACD</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-0.5 rounded-full bg-orange-400 opacity-70" style={{ borderTop: '1px dashed' }} />
            <span>Signal</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm" style={{ background: 'rgba(0,212,170,0.6)' }} />
            <span>Histograma +</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm" style={{ background: 'rgba(255,73,118,0.6)' }} />
            <span>Histograma −</span>
          </div>
        </div>
      </div>
    </div>
  );
}
