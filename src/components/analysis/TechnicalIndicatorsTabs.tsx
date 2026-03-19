import { useMemo, useState, type ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gauge, BarChart3, Activity, Waves, CandlestickChart as CandlestickIcon, TrendingUp, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ComposedChart } from
'recharts';
import type { OHLCVCandle, TimeValue, MACDData, BandData, StochasticData, ADXData } from '@/lib/indicators';
import {
  calcRSI, calcMACD, calcSMA, calcEMA, calcBollingerBands, calcStochastic, calcADX } from
'@/lib/indicators';
import { useTranslation } from '@/i18n/LanguageContext';

interface Props {
  candles: OHLCVCandle[];
  loading?: boolean;
  priceChart?: ReactNode;
}

type TFn = (key: string) => string;

/** Short display label for chart X-axis (may collide across days — only for display) */
function formatTime(t: string) {
  const normalized = t.includes('T') ? t : t.replace(' ', 'T');
  const d = new Date(normalized.endsWith('Z') ? normalized : normalized + 'Z');
  if (isNaN(d.getTime())) {
    const match = t.match(/(\d{2}):(\d{2})/);
    return match ? `${match[1]}:${match[2]}` : t.slice(-5);
  }
  return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
}

/** Unique key including date — safe for Map lookups across multiple days */
function formatTimeKey(t: string) {
  const normalized = t.includes('T') ? t : t.replace(' ', 'T');
  const d = new Date(normalized.endsWith('Z') ? normalized : normalized + 'Z');
  if (isNaN(d.getTime())) return t;
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  return `${mm}-${dd} ${hh}:${min}`;
}

function SignalBadge({ signal, label }: {signal: 'buy' | 'sell' | 'neutral';label: string;}) {
  const colors = {
    buy: 'bg-green-500/15 text-green-400 border-green-500/30',
    sell: 'bg-red-500/15 text-red-400 border-red-500/30',
    neutral: 'bg-gray-500/15 text-gray-400 border-gray-500/30'
  };
  return (
    <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border', colors[signal])}>
      {label}
    </span>);
}

// ═══════════════ RSI TAB ═══════════════
function RSIPanel({ candles, t }: {candles: OHLCVCandle[]; t: TFn}) {
  const data = useMemo(() => {
    const rsi = calcRSI(candles);
    return rsi.map((r) => ({ time: formatTime(r.time), rsi: +r.value.toFixed(2) }));
  }, [candles]);

  const current = data[data.length - 1]?.rsi ?? 50;
  const signal: 'buy' | 'sell' | 'neutral' = current >= 70 ? 'sell' : current <= 30 ? 'buy' : 'neutral';
  const signalLabel = signal === 'sell' ? t('analysis_ti_overbought') : signal === 'buy' ? t('analysis_ti_oversold') : t('analysis_ti_neutral');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-lg font-mono font-bold text-foreground tabular-nums">{current.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground ml-2">/ 100</span>
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
              labelStyle={{ color: '#9ca3af' }} />
            
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
          <div className="text-muted-foreground">{t('analysis_ti_oversold')}</div>
        </div>
        <div className="bg-gray-500/5 border border-gray-500/10 rounded-lg p-2 text-center">
          <div className="text-muted-foreground font-bold">30 – 70</div>
          <div className="text-muted-foreground">{t('analysis_ti_neutral')}</div>
        </div>
        <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-2 text-center">
          <div className="text-red-400 font-bold">≥ 70</div>
          <div className="text-muted-foreground">{t('analysis_ti_overbought')}</div>
        </div>
      </div>
    </div>);
}

// ═══════════════ MACD TAB ═══════════════
function MACDPanel({ candles, t }: {candles: OHLCVCandle[]; t: TFn}) {
  const data = useMemo(() => {
    const macd = calcMACD(candles);
    return macd.map((m) => ({
      time: formatTime(m.time),
      macd: +m.macd.toFixed(5),
      signal: +m.signal.toFixed(5),
      histogram: +m.histogram.toFixed(5)
    }));
  }, [candles]);

  const latest = data[data.length - 1];
  const prev = data[data.length - 2];
  let signal: 'buy' | 'sell' | 'neutral' = 'neutral';
  let label = t('analysis_ti_neutral');
  if (latest && prev) {
    const bullCross = prev.macd <= prev.signal && latest.macd > latest.signal;
    const bearCross = prev.macd >= prev.signal && latest.macd < latest.signal;
    if (bullCross) {signal = 'buy';label = t('analysis_ti_bullish_cross');} else
    if (bearCross) {signal = 'sell';label = t('analysis_ti_bearish_cross');} else
    if (latest.macd > latest.signal) {signal = 'buy';label = t('analysis_ti_bullish');} else
    {signal = 'sell';label = t('analysis_ti_bearish');}
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-x-3">
          <span className="text-[10px] text-muted-foreground">MACD: <span className="text-cyan-400 font-mono">{latest?.macd ?? '—'}</span></span>
          <span className="text-[10px] text-muted-foreground">Signal: <span className="text-amber-400 font-mono">{latest?.signal ?? '—'}</span></span>
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
              labelStyle={{ color: '#9ca3af' }} />
            
            <ReferenceLine y={0} stroke="hsl(210, 20%, 35%)" strokeDasharray="2 4" />
            <Bar dataKey="histogram" fill="hsl(190, 50%, 40%)" opacity={0.5}
            shape={(props: any) => {
              const { x, y, width, height, payload } = props;
              const color = payload.histogram >= 0 ? 'hsl(142, 70%, 45%)' : 'hsl(0, 70%, 50%)';
              return <rect x={x} y={y} width={width} height={Math.abs(height)} fill={color} opacity={0.5} rx={1} />;
            }} />
            
            <Line type="monotone" dataKey="macd" stroke="hsl(190, 90%, 50%)" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="signal" stroke="hsl(45, 90%, 55%)" strokeWidth={1.5} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="text-[10px] text-muted-foreground">
        <span className="inline-block w-2 h-2 rounded-full bg-cyan-500 mr-1" /> MACD (12,26)
        <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1 ml-3" /> Signal (9)
        <span className="inline-block w-2 h-2 rounded-sm bg-gray-500/50 mr-1 ml-3" /> {t('analysis_ti_histogram')}
      </div>
    </div>);
}

// ═══════════════ BOLLINGER TAB ═══════════════
function BollingerPanel({ candles, t }: {candles: OHLCVCandle[]; t: TFn}) {
  const data = useMemo(() => {
    const bb = calcBollingerBands(candles);
    return bb.map((b) => ({
      time: formatTime(b.time),
      upper: +b.upper.toFixed(5),
      middle: +b.middle.toFixed(5),
      lower: +b.lower.toFixed(5),
      price: candles.find((c) => formatTime(c.time) === formatTime(b.time))?.close ?? b.middle
    }));
  }, [candles]);

  const latest = data[data.length - 1];
  const bandwidth = latest ? ((latest.upper - latest.lower) / latest.middle * 100).toFixed(2) : '—';
  let signal: 'buy' | 'sell' | 'neutral' = 'neutral';
  let label = t('analysis_ti_inside_bands');
  if (latest) {
    if (latest.price >= latest.upper) {signal = 'sell';label = t('analysis_ti_upper_band');} else
    if (latest.price <= latest.lower) {signal = 'buy';label = t('analysis_ti_lower_band');}
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] text-muted-foreground">{t('analysis_ti_width')}: <span className="text-cyan-400 font-mono">{bandwidth}%</span></div>
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
            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9, fill: '#6b7280' }} tickFormatter={(v) => v.toFixed(4)} />
            <Tooltip
              contentStyle={{ background: '#0d1829', border: '1px solid hsl(270, 40%, 25%)', borderRadius: 8, fontSize: 11 }}
              labelStyle={{ color: '#9ca3af' }}
              formatter={(val: number) => val.toFixed(5)} />
            
            <Area type="monotone" dataKey="upper" stroke="hsl(270, 60%, 55%)" fill="url(#bbGrad)" strokeWidth={1} dot={false} strokeDasharray="3 3" />
            <Line type="monotone" dataKey="middle" stroke="hsl(270, 50%, 45%)" strokeWidth={1} dot={false} strokeDasharray="4 4" />
            <Area type="monotone" dataKey="lower" stroke="hsl(270, 60%, 55%)" fill="transparent" strokeWidth={1} dot={false} strokeDasharray="3 3" />
            <Line type="monotone" dataKey="price" stroke="hsl(190, 90%, 55%)" strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="text-[10px] text-muted-foreground">
        <span className="inline-block w-2 h-2 rounded-full bg-cyan-500 mr-1" /> {t('analysis_ti_price_label')}
        <span className="inline-block w-2 h-2 rounded-full bg-purple-500 mr-1 ml-3" /> {t('analysis_ti_bands_label')} (20, 2σ)
      </div>
    </div>);
}

// ═══════════════ STOCHASTIC TAB ═══════════════
function StochasticPanel({ candles, t }: {candles: OHLCVCandle[]; t: TFn}) {
  const data = useMemo(() => {
    const stoch = calcStochastic(candles);
    return stoch.map((s) => ({
      time: formatTime(s.time),
      k: +s.k.toFixed(2),
      d: +s.d.toFixed(2)
    }));
  }, [candles]);

  const latest = data[data.length - 1];
  let signal: 'buy' | 'sell' | 'neutral' = 'neutral';
  let label = t('analysis_ti_neutral');
  if (latest) {
    if (latest.k >= 80) {signal = 'sell';label = t('analysis_ti_overbought');} else
    if (latest.k <= 20) {signal = 'buy';label = t('analysis_ti_oversold');}
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-x-3">
          <span className="text-[10px] text-muted-foreground">%K: <span className="text-cyan-400 font-mono">{latest?.k?.toFixed(1) ?? '—'}</span></span>
          <span className="text-[10px] text-muted-foreground">%D: <span className="text-amber-400 font-mono">{latest?.d?.toFixed(1) ?? '—'}</span></span>
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
              labelStyle={{ color: '#9ca3af' }} />
            
            <ReferenceLine y={80} stroke="hsl(0, 70%, 50%)" strokeDasharray="4 4" strokeOpacity={0.6} />
            <ReferenceLine y={20} stroke="hsl(142, 70%, 45%)" strokeDasharray="4 4" strokeOpacity={0.6} />
            <Line type="monotone" dataKey="k" stroke="hsl(190, 90%, 50%)" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="d" stroke="hsl(45, 90%, 55%)" strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="text-[10px] text-muted-foreground">
        <span className="inline-block w-2 h-2 rounded-full bg-cyan-500 mr-1" /> %K (14,3)
        <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1 ml-3" /> %D (3)
      </div>
    </div>);
}

// ═══════════════ ADX TAB ═══════════════
function ADXPanel({ candles, t }: {candles: OHLCVCandle[]; t: TFn}) {
  const data = useMemo(() => {
    const adx = calcADX(candles);
    return adx.map((a) => ({
      time: formatTime(a.time),
      adx: a.adx,
      plusDI: a.plusDI,
      minusDI: a.minusDI
    }));
  }, [candles]);

  const latest = data[data.length - 1];
  const adxVal = latest?.adx ?? 0;
  let signal: 'buy' | 'sell' | 'neutral' = 'neutral';
  let label = t('analysis_ti_no_trend');
  if (latest) {
    if (adxVal >= 25 && latest.plusDI > latest.minusDI) {signal = 'buy';label = t('analysis_ti_bullish_trend');} else
    if (adxVal >= 25 && latest.minusDI > latest.plusDI) {signal = 'sell';label = t('analysis_ti_bearish_trend');} else
    if (adxVal < 20) {label = t('analysis_ti_no_trend');} else
    {label = t('analysis_ti_weak');}
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-x-3">
          <span className="text-[10px] text-muted-foreground">ADX: <span className="text-cyan-400 font-mono">{latest?.adx?.toFixed(1) ?? '—'}</span></span>
          <span className="text-[10px] text-muted-foreground">+DI: <span className="text-green-400 font-mono">{latest?.plusDI?.toFixed(1) ?? '—'}</span></span>
          <span className="text-[10px] text-muted-foreground">-DI: <span className="text-red-400 font-mono">{latest?.minusDI?.toFixed(1) ?? '—'}</span></span>
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
              labelStyle={{ color: '#9ca3af' }} />
            
            <ReferenceLine y={25} stroke="hsl(45, 70%, 50%)" strokeDasharray="4 4" strokeOpacity={0.6} />
            <Line type="monotone" dataKey="adx" stroke="hsl(190, 90%, 50%)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="plusDI" stroke="hsl(142, 70%, 50%)" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="minusDI" stroke="hsl(0, 70%, 55%)" strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="bg-gray-500/5 border border-gray-500/10 rounded-lg p-2 text-center">
          <div className="text-muted-foreground font-bold">&lt; 20</div>
          <div className="text-muted-foreground">{t('analysis_ti_no_trend')}</div>
        </div>
        <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-lg p-2 text-center">
          <div className="text-cyan-400 font-bold">≥ 25</div>
          <div className="text-muted-foreground">{t('analysis_ti_strong_trend')}</div>
        </div>
      </div>
      <div className="text-[10px] text-muted-foreground">
        <span className="inline-block w-2 h-2 rounded-full bg-cyan-500 mr-1" /> ADX (14)
        <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1 ml-3" /> +DI
        <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1 ml-3" /> -DI
      </div>
    </div>);
}

// ═══════════════ MOVING AVERAGES TAB ═══════════════
function MovingAveragesPanel({ candles, t }: {candles: OHLCVCandle[]; t: TFn}) {
  const data = useMemo(() => {
    const ema20 = calcEMA(candles, 20);
    const ema50 = calcEMA(candles, 50);
    const sma200 = calcSMA(candles, 200);
    const priceMap = new Map(candles.map((c) => [formatTime(c.time), c.close]));
    const allTimes = candles.map((c) => formatTime(c.time));
    const ema20Map = new Map(ema20.map((e) => [formatTime(e.time), e.value]));
    const ema50Map = new Map(ema50.map((e) => [formatTime(e.time), e.value]));
    const sma200Map = new Map(sma200.map((e) => [formatTime(e.time), e.value]));
    return allTimes.map((t) => ({
      time: t,
      price: +(priceMap.get(t) ?? 0).toFixed(5),
      ema20: ema20Map.has(t) ? +ema20Map.get(t)!.toFixed(5) : undefined,
      ema50: ema50Map.has(t) ? +ema50Map.get(t)!.toFixed(5) : undefined,
      sma200: sma200Map.has(t) ? +sma200Map.get(t)!.toFixed(5) : undefined
    }));
  }, [candles]);

  const latest = data[data.length - 1];
  const price = latest?.price ?? 0;
  const e20 = latest?.ema20;
  const e50 = latest?.ema50;
  let signal: 'buy' | 'sell' | 'neutral' = 'neutral';
  let label = t('analysis_ti_neutral');
  if (e20 && e50) {
    const aboveBoth = price > e20 && price > e50;
    const belowBoth = price < e20 && price < e50;
    const golden = e20 > e50;
    if (aboveBoth && golden) {signal = 'buy';label = 'Golden Cross';} else
    if (belowBoth && !golden) {signal = 'sell';label = 'Death Cross';} else
    if (aboveBoth) {signal = 'buy';label = t('analysis_ti_above');} else
    if (belowBoth) {signal = 'sell';label = t('analysis_ti_below');} else
    {label = t('analysis_ti_mixed');}
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-x-3 text-[10px] text-muted-foreground">
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
            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9, fill: '#6b7280' }} tickFormatter={(v) => v.toFixed(4)} />
            <Tooltip
              contentStyle={{ background: '#0d1829', border: '1px solid hsl(190, 50%, 20%)', borderRadius: 8, fontSize: 11 }}
              labelStyle={{ color: '#9ca3af' }}
              formatter={(val: number) => val.toFixed(5)} />
            
            <Line type="monotone" dataKey="price" stroke="hsl(210, 20%, 55%)" strokeWidth={1} dot={false} />
            <Line type="monotone" dataKey="ema20" stroke="hsl(142, 70%, 50%)" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="ema50" stroke="hsl(45, 90%, 55%)" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="sma200" stroke="hsl(0, 70%, 55%)" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="text-[10px] text-muted-foreground">
        <span className="inline-block w-2 h-2 rounded-full bg-gray-500 mr-1" /> {t('analysis_ti_price_label')}
        <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1 ml-3" /> EMA 20
        <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1 ml-3" /> EMA 50
        <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1 ml-3" /> SMA 200
      </div>
    </div>);
}

// ═══════════════ MAIN COMPONENT ═══════════════
export function TechnicalIndicatorsTabs({ candles, loading, priceChart }: Props) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('precio');

  if (loading || !candles || candles.length === 0) {
    return (
      <div className="bg-[#0a1628] border border-cyan-900/20 rounded-xl p-4 animate-pulse">
        <div className="h-4 w-32 bg-cyan-900/20 rounded mb-4" />
        <div className="h-[180px] bg-cyan-900/10 rounded" />
      </div>);
  }

  const tabs = [
  { value: 'precio', label: t('analysis_ti_price'), icon: CandlestickIcon },
  { value: 'rsi', label: 'RSI', icon: Gauge },
  { value: 'macd', label: 'MACD', icon: BarChart3 },
  { value: 'bollinger', label: 'Bollinger', icon: Waves },
  { value: 'stochastic', label: t('analysis_ti_stoch'), icon: Activity },
  { value: 'adx', label: 'ADX', icon: TrendingUp },
  { value: 'ma', label: t('analysis_ti_averages'), icon: GitBranch }];

  return (
    <div className="bg-[#0a1628] border border-cyan-900/20 rounded-xl overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#060e1a] border-b border-cyan-900/20 w-full h-auto p-0.5 gap-0 rounded-none overflow-x-auto scrollbar-hide flex-nowrap">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="tab-compact flex-1 min-w-0 text-[9px] xs:text-[10px] gap-0.5 rounded-lg data-[state=active]:bg-cyan-500/15 data-[state=active]:text-cyan-400 py-1.5 px-1 xs:px-1.5 transition-all">
                
                <Icon className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{tab.label}</span>
              </TabsTrigger>);
          })}
        </TabsList>

        <TabsContent value="precio" className="mt-0">
          {priceChart}
        </TabsContent>

        <TabsContent value="rsi" className="p-3 mt-0">
          <RSIPanel candles={candles} t={t} />
        </TabsContent>

        <TabsContent value="macd" className="p-3 mt-0">
          <MACDPanel candles={candles} t={t} />
        </TabsContent>

        <TabsContent value="bollinger" className="p-3 mt-0">
          <BollingerPanel candles={candles} t={t} />
        </TabsContent>

        <TabsContent value="stochastic" className="p-3 mt-0">
          <StochasticPanel candles={candles} t={t} />
        </TabsContent>

        <TabsContent value="adx" className="p-3 mt-0">
          <ADXPanel candles={candles} t={t} />
        </TabsContent>

        <TabsContent value="ma" className="p-3 mt-0">
          <MovingAveragesPanel candles={candles} t={t} />
        </TabsContent>
      </Tabs>
    </div>);
}
