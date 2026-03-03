import { useMemo, useState, type ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gauge, BarChart3, Activity, Waves, CandlestickChart as CandlestickIcon, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ComposedChart,
} from 'recharts';
import type { OHLCVCandle, TimeValue, MACDData, BandData, StochasticData, ADXData } from '@/lib/indicators';
import {
  calcRSI, calcMACD, calcSMA, calcEMA, calcBollingerBands, calcStochastic, calcADX,
} from '@/lib/indicators';

interface Props {
  candles: OHLCVCandle[];
  loading?: boolean;
  priceChart?: ReactNode;
}

function formatTime(t: string) {
  // Handle various formats: "2026-02-27 08:00:00", "2026-02-27T08:00:00Z", "2026-02-27 08:00"
  const normalized = t.includes('T') ? t : t.replace(' ', 'T');
  const d = new Date(normalized.endsWith('Z') ? normalized : normalized + 'Z');
  if (isNaN(d.getTime())) {
    // Fallback: extract time from string directly
    const match = t.match(/(\d{2}):(\d{2})/);
    return match ? `${match[1]}:${match[2]}` : t.slice(-5);
  }
  return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
}

function SignalBadge({ signal, label }: { signal: 'buy' | 'sell' | 'neutral'; label: string }) {
  const colors = {
    buy: 'bg-green-500/15 text-green-400 border-green-500/30',
    sell: 'bg-red-500/15 text-red-400 border-red-500/30',
    neutral: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
  };
  return (
    <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border', colors[signal])}>
      {label}
    </span>
  );
}

// ═══════════════ RSI TAB ═══════════════
function RSIPanel({ candles }: { candles: OHLCVCandle[] }) {
  const data = useMemo(() => {
    const rsi = calcRSI(candles);
    return rsi.map(r => ({ time: formatTime(r.time), rsi: +r.value.toFixed(2) }));
  }, [candles]);

  const current = data[data.length - 1]?.rsi ?? 50;
  const signal: 'buy' | 'sell' | 'neutral' = current >= 70 ? 'sell' : current <= 30 ? 'buy' : 'neutral';
  const signalLabel = signal === 'sell' ? 'Sobrecompra' : signal === 'buy' ? 'Sobreventa' : 'Neutral';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-lg font-mono font-bold text-white tabular-nums">{current.toFixed(1)}</span>
          <span className="text-xs text-gray-500 ml-2">/ 100</span>
        </div>
        <SignalBadge signal={signal} label={signalLabel} />
      </div>
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="rsiGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(190, 90%, 50%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(190, 90%, 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsla(210, 30%, 25%, 0.3)" />
            <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#6b7280' }} interval="preserveStartEnd" />
            <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#6b7280' }} />
            <Tooltip
              contentStyle={{ background: '#0d1829', border: '1px solid hsl(190, 50%, 20%)', borderRadius: 8, fontSize: 11 }}
              labelStyle={{ color: '#9ca3af' }}
            />
            <ReferenceLine y={70} stroke="hsl(0, 70%, 50%)" strokeDasharray="4 4" strokeOpacity={0.6} />
            <ReferenceLine y={30} stroke="hsl(142, 70%, 45%)" strokeDasharray="4 4" strokeOpacity={0.6} />
            <ReferenceLine y={50} stroke="hsl(210, 20%, 40%)" strokeDasharray="2 4" strokeOpacity={0.3} />
            <Area type="monotone" dataKey="rsi" stroke="hsl(190, 90%, 50%)" fill="url(#rsiGrad)" strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-3 gap-2 text-[10px]">
        <div className="bg-green-500/5 border border-green-500/10 rounded-lg p-2 text-center">
          <div className="text-green-400 font-bold">≤ 30</div>
          <div className="text-gray-500">Sobreventa</div>
        </div>
        <div className="bg-gray-500/5 border border-gray-500/10 rounded-lg p-2 text-center">
          <div className="text-gray-400 font-bold">30 – 70</div>
          <div className="text-gray-500">Neutral</div>
        </div>
        <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-2 text-center">
          <div className="text-red-400 font-bold">≥ 70</div>
          <div className="text-gray-500">Sobrecompra</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════ MACD TAB ═══════════════
function MACDPanel({ candles }: { candles: OHLCVCandle[] }) {
  const data = useMemo(() => {
    const macd = calcMACD(candles);
    return macd.map(m => ({
      time: formatTime(m.time),
      macd: +m.macd.toFixed(5),
      signal: +m.signal.toFixed(5),
      histogram: +m.histogram.toFixed(5),
    }));
  }, [candles]);

  const latest = data[data.length - 1];
  const prev = data[data.length - 2];
  let signal: 'buy' | 'sell' | 'neutral' = 'neutral';
  let label = 'Neutral';
  if (latest && prev) {
    const bullCross = prev.macd <= prev.signal && latest.macd > latest.signal;
    const bearCross = prev.macd >= prev.signal && latest.macd < latest.signal;
    if (bullCross) { signal = 'buy'; label = 'Cruce Alcista ⚡'; }
    else if (bearCross) { signal = 'sell'; label = 'Cruce Bajista ⚡'; }
    else if (latest.macd > latest.signal) { signal = 'buy'; label = 'Alcista'; }
    else { signal = 'sell'; label = 'Bajista'; }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-x-3">
          <span className="text-[10px] text-gray-500">MACD: <span className="text-cyan-400 font-mono">{latest?.macd ?? '—'}</span></span>
          <span className="text-[10px] text-gray-500">Signal: <span className="text-amber-400 font-mono">{latest?.signal ?? '—'}</span></span>
        </div>
        <SignalBadge signal={signal} label={label} />
      </div>
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsla(210, 30%, 25%, 0.3)" />
            <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#6b7280' }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} />
            <Tooltip
              contentStyle={{ background: '#0d1829', border: '1px solid hsl(190, 50%, 20%)', borderRadius: 8, fontSize: 11 }}
              labelStyle={{ color: '#9ca3af' }}
            />
            <ReferenceLine y={0} stroke="hsl(210, 20%, 35%)" strokeDasharray="2 4" />
            <Bar dataKey="histogram" fill="hsl(190, 50%, 40%)" opacity={0.5}
              shape={(props: any) => {
                const { x, y, width, height, payload } = props;
                const color = payload.histogram >= 0 ? 'hsl(142, 70%, 45%)' : 'hsl(0, 70%, 50%)';
                return <rect x={x} y={y} width={width} height={Math.abs(height)} fill={color} opacity={0.5} rx={1} />;
              }}
            />
            <Line type="monotone" dataKey="macd" stroke="hsl(190, 90%, 50%)" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="signal" stroke="hsl(45, 90%, 55%)" strokeWidth={1.5} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="text-[10px] text-gray-500">
        <span className="inline-block w-2 h-2 rounded-full bg-cyan-500 mr-1" /> MACD (12,26)
        <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1 ml-3" /> Signal (9)
        <span className="inline-block w-2 h-2 rounded-sm bg-gray-500/50 mr-1 ml-3" /> Histograma
      </div>
    </div>
  );
}

// ═══════════════ BOLLINGER TAB ═══════════════
function BollingerPanel({ candles }: { candles: OHLCVCandle[] }) {
  const data = useMemo(() => {
    const bb = calcBollingerBands(candles);
    return bb.map(b => ({
      time: formatTime(b.time),
      upper: +b.upper.toFixed(5),
      middle: +b.middle.toFixed(5),
      lower: +b.lower.toFixed(5),
      price: candles.find(c => formatTime(c.time) === formatTime(b.time))?.close ?? b.middle,
    }));
  }, [candles]);

  const latest = data[data.length - 1];
  const bandwidth = latest ? ((latest.upper - latest.lower) / latest.middle * 100).toFixed(2) : '—';
  let signal: 'buy' | 'sell' | 'neutral' = 'neutral';
  let label = 'Dentro de bandas';
  if (latest) {
    if (latest.price >= latest.upper) { signal = 'sell'; label = 'Banda superior'; }
    else if (latest.price <= latest.lower) { signal = 'buy'; label = 'Banda inferior'; }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] text-gray-500">Ancho: <span className="text-cyan-400 font-mono">{bandwidth}%</span></div>
        <SignalBadge signal={signal} label={label} />
      </div>
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="bbGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(270, 60%, 50%)" stopOpacity={0.15} />
                <stop offset="100%" stopColor="hsl(270, 60%, 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsla(210, 30%, 25%, 0.3)" />
            <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#6b7280' }} interval="preserveStartEnd" />
            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9, fill: '#6b7280' }} tickFormatter={v => v.toFixed(4)} />
            <Tooltip
              contentStyle={{ background: '#0d1829', border: '1px solid hsl(270, 40%, 25%)', borderRadius: 8, fontSize: 11 }}
              labelStyle={{ color: '#9ca3af' }}
              formatter={(val: number) => val.toFixed(5)}
            />
            <Area type="monotone" dataKey="upper" stroke="hsl(270, 60%, 55%)" fill="url(#bbGrad)" strokeWidth={1} dot={false} strokeDasharray="3 3" />
            <Line type="monotone" dataKey="middle" stroke="hsl(270, 50%, 45%)" strokeWidth={1} dot={false} strokeDasharray="4 4" />
            <Area type="monotone" dataKey="lower" stroke="hsl(270, 60%, 55%)" fill="transparent" strokeWidth={1} dot={false} strokeDasharray="3 3" />
            <Line type="monotone" dataKey="price" stroke="hsl(190, 90%, 55%)" strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="text-[10px] text-gray-500">
        <span className="inline-block w-2 h-2 rounded-full bg-cyan-500 mr-1" /> Precio
        <span className="inline-block w-2 h-2 rounded-full bg-purple-500 mr-1 ml-3" /> Bandas (20, 2σ)
      </div>
    </div>
  );
}

// ═══════════════ STOCHASTIC TAB ═══════════════
function StochasticPanel({ candles }: { candles: OHLCVCandle[] }) {
  const data = useMemo(() => {
    const stoch = calcStochastic(candles);
    return stoch.map(s => ({
      time: formatTime(s.time),
      k: +s.k.toFixed(2),
      d: +s.d.toFixed(2),
    }));
  }, [candles]);

  const latest = data[data.length - 1];
  let signal: 'buy' | 'sell' | 'neutral' = 'neutral';
  let label = 'Neutral';
  if (latest) {
    if (latest.k >= 80) { signal = 'sell'; label = 'Sobrecompra'; }
    else if (latest.k <= 20) { signal = 'buy'; label = 'Sobreventa'; }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-x-3">
          <span className="text-[10px] text-gray-500">%K: <span className="text-cyan-400 font-mono">{latest?.k?.toFixed(1) ?? '—'}</span></span>
          <span className="text-[10px] text-gray-500">%D: <span className="text-amber-400 font-mono">{latest?.d?.toFixed(1) ?? '—'}</span></span>
        </div>
        <SignalBadge signal={signal} label={label} />
      </div>
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsla(210, 30%, 25%, 0.3)" />
            <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#6b7280' }} interval="preserveStartEnd" />
            <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#6b7280' }} />
            <Tooltip
              contentStyle={{ background: '#0d1829', border: '1px solid hsl(190, 50%, 20%)', borderRadius: 8, fontSize: 11 }}
              labelStyle={{ color: '#9ca3af' }}
            />
            <ReferenceLine y={80} stroke="hsl(0, 70%, 50%)" strokeDasharray="4 4" strokeOpacity={0.6} />
            <ReferenceLine y={20} stroke="hsl(142, 70%, 45%)" strokeDasharray="4 4" strokeOpacity={0.6} />
            <Line type="monotone" dataKey="k" stroke="hsl(190, 90%, 50%)" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="d" stroke="hsl(45, 90%, 55%)" strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="text-[10px] text-gray-500">
        <span className="inline-block w-2 h-2 rounded-full bg-cyan-500 mr-1" /> %K (14,3)
        <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1 ml-3" /> %D (3)
      </div>
    </div>
  );
}

// ═══════════════ ADX TAB ═══════════════
function ADXPanel({ candles }: { candles: OHLCVCandle[] }) {
  const data = useMemo(() => {
    const adx = calcADX(candles);
    return adx.map(a => ({
      time: formatTime(a.time),
      adx: a.adx,
      plusDI: a.plusDI,
      minusDI: a.minusDI,
    }));
  }, [candles]);

  const latest = data[data.length - 1];
  const adxVal = latest?.adx ?? 0;
  let signal: 'buy' | 'sell' | 'neutral' = 'neutral';
  let label = 'Sin tendencia';
  if (latest) {
    if (adxVal >= 25 && latest.plusDI > latest.minusDI) { signal = 'buy'; label = 'Tendencia alcista'; }
    else if (adxVal >= 25 && latest.minusDI > latest.plusDI) { signal = 'sell'; label = 'Tendencia bajista'; }
    else if (adxVal < 20) { label = 'Sin tendencia'; }
    else { label = 'Débil'; }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-x-3">
          <span className="text-[10px] text-gray-500">ADX: <span className="text-cyan-400 font-mono">{latest?.adx?.toFixed(1) ?? '—'}</span></span>
          <span className="text-[10px] text-gray-500">+DI: <span className="text-green-400 font-mono">{latest?.plusDI?.toFixed(1) ?? '—'}</span></span>
          <span className="text-[10px] text-gray-500">-DI: <span className="text-red-400 font-mono">{latest?.minusDI?.toFixed(1) ?? '—'}</span></span>
        </div>
        <SignalBadge signal={signal} label={label} />
      </div>
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsla(210, 30%, 25%, 0.3)" />
            <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#6b7280' }} interval="preserveStartEnd" />
            <YAxis domain={[0, 'auto']} tick={{ fontSize: 9, fill: '#6b7280' }} />
            <Tooltip
              contentStyle={{ background: '#0d1829', border: '1px solid hsl(190, 50%, 20%)', borderRadius: 8, fontSize: 11 }}
              labelStyle={{ color: '#9ca3af' }}
            />
            <ReferenceLine y={25} stroke="hsl(45, 70%, 50%)" strokeDasharray="4 4" strokeOpacity={0.6} />
            <Line type="monotone" dataKey="adx" stroke="hsl(190, 90%, 50%)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="plusDI" stroke="hsl(142, 70%, 50%)" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="minusDI" stroke="hsl(0, 70%, 55%)" strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="bg-gray-500/5 border border-gray-500/10 rounded-lg p-2 text-center">
          <div className="text-gray-400 font-bold">&lt; 20</div>
          <div className="text-gray-500">Sin tendencia</div>
        </div>
        <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-lg p-2 text-center">
          <div className="text-cyan-400 font-bold">≥ 25</div>
          <div className="text-gray-500">Tendencia fuerte</div>
        </div>
      </div>
      <div className="text-[10px] text-gray-500">
        <span className="inline-block w-2 h-2 rounded-full bg-cyan-500 mr-1" /> ADX (14)
        <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1 ml-3" /> +DI
        <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1 ml-3" /> -DI
      </div>
    </div>
  );
}

// ═══════════════ MOVING AVERAGES TAB ═══════════════
function MovingAveragesPanel({ candles }: { candles: OHLCVCandle[] }) {
  const data = useMemo(() => {
    const ema20 = calcEMA(candles, 20);
    const ema50 = calcEMA(candles, 50);
    const sma200 = calcSMA(candles, 200);
    const priceMap = new Map(candles.map(c => [formatTime(c.time), c.close]));
    const allTimes = candles.map(c => formatTime(c.time));
    const ema20Map = new Map(ema20.map(e => [formatTime(e.time), e.value]));
    const ema50Map = new Map(ema50.map(e => [formatTime(e.time), e.value]));
    const sma200Map = new Map(sma200.map(e => [formatTime(e.time), e.value]));
    return allTimes.map(t => ({
      time: t,
      price: +(priceMap.get(t) ?? 0).toFixed(5),
      ema20: ema20Map.has(t) ? +ema20Map.get(t)!.toFixed(5) : undefined,
      ema50: ema50Map.has(t) ? +ema50Map.get(t)!.toFixed(5) : undefined,
      sma200: sma200Map.has(t) ? +sma200Map.get(t)!.toFixed(5) : undefined,
    }));
  }, [candles]);

  const latest = data[data.length - 1];
  const price = latest?.price ?? 0;
  const e20 = latest?.ema20;
  const e50 = latest?.ema50;
  let signal: 'buy' | 'sell' | 'neutral' = 'neutral';
  let label = 'Neutral';
  if (e20 && e50) {
    const aboveBoth = price > e20 && price > e50;
    const belowBoth = price < e20 && price < e50;
    const golden = e20 > e50;
    if (aboveBoth && golden) { signal = 'buy'; label = 'Golden Cross'; }
    else if (belowBoth && !golden) { signal = 'sell'; label = 'Death Cross'; }
    else if (aboveBoth) { signal = 'buy'; label = 'Por encima'; }
    else if (belowBoth) { signal = 'sell'; label = 'Por debajo'; }
    else { label = 'Mixto'; }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-x-3 text-[10px] text-gray-500">
          {e20 && <span>EMA20: <span className="text-green-400 font-mono">{e20.toFixed(5)}</span></span>}
          {e50 && <span>EMA50: <span className="text-amber-400 font-mono">{e50.toFixed(5)}</span></span>}
        </div>
        <SignalBadge signal={signal} label={label} />
      </div>
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsla(210, 30%, 25%, 0.3)" />
            <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#6b7280' }} interval="preserveStartEnd" />
            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9, fill: '#6b7280' }} tickFormatter={v => v.toFixed(4)} />
            <Tooltip
              contentStyle={{ background: '#0d1829', border: '1px solid hsl(190, 50%, 20%)', borderRadius: 8, fontSize: 11 }}
              labelStyle={{ color: '#9ca3af' }}
              formatter={(val: number) => val.toFixed(5)}
            />
            <Line type="monotone" dataKey="price" stroke="hsl(210, 20%, 55%)" strokeWidth={1} dot={false} />
            <Line type="monotone" dataKey="ema20" stroke="hsl(142, 70%, 50%)" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="ema50" stroke="hsl(45, 90%, 55%)" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="sma200" stroke="hsl(0, 70%, 55%)" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="text-[10px] text-gray-500">
        <span className="inline-block w-2 h-2 rounded-full bg-gray-500 mr-1" /> Precio
        <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1 ml-3" /> EMA 20
        <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1 ml-3" /> EMA 50
        <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1 ml-3" /> SMA 200
      </div>
    </div>
  );
}

// ═══════════════ MAIN COMPONENT ═══════════════
export function TechnicalIndicatorsTabs({ candles, loading, priceChart }: Props) {
  const [activeTab, setActiveTab] = useState('precio');

  if (loading || !candles || candles.length === 0) {
    return (
      <div className="bg-[#0a1628] border border-cyan-900/20 rounded-xl p-4 animate-pulse">
        <div className="h-4 w-32 bg-cyan-900/20 rounded mb-4" />
        <div className="h-[180px] bg-cyan-900/10 rounded" />
      </div>
    );
  }

  const tabs = [
    { value: 'precio', label: 'Precio', icon: CandlestickIcon },
    { value: 'rsi', label: 'RSI', icon: Gauge },
    { value: 'macd', label: 'MACD', icon: BarChart3 },
    { value: 'bollinger', label: 'Bollinger', icon: Waves },
    { value: 'stochastic', label: 'Estoc.', icon: Activity },
    { value: 'adx', label: 'ADX', icon: TrendingUp },
  ];

  return (
    <div className="bg-[#0a1628] border border-cyan-900/20 rounded-xl overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#060e1a] border-b border-cyan-900/20 w-full h-10 p-0.5 gap-0 rounded-none">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex-1 text-[10px] gap-1 rounded-lg data-[state=active]:bg-cyan-500/15 data-[state=active]:text-cyan-400 py-2 transition-all"
              >
                <Icon className="w-3 h-3" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="precio" className="mt-0">
          {priceChart}
        </TabsContent>
        <div className="p-3">
          <TabsContent value="rsi" className="mt-0">
            <RSIPanel candles={candles} />
          </TabsContent>
          <TabsContent value="macd" className="mt-0">
            <MACDPanel candles={candles} />
          </TabsContent>
          <TabsContent value="bollinger" className="mt-0">
            <BollingerPanel candles={candles} />
          </TabsContent>
          <TabsContent value="stochastic" className="mt-0">
            <StochasticPanel candles={candles} />
          </TabsContent>
          <TabsContent value="adx" className="mt-0">
            <ADXPanel candles={candles} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
