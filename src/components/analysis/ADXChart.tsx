import { useMemo } from 'react';
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Gauge, TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface ADXChartProps {
  pair: string;
  timeframe: string;
  priceData?: { time: string; price: number; high: number; low: number; open?: number; close?: number }[];
  apiADX?: Array<{ time: string; adx: number; pdi: number; mdi: number }>;
  loading: boolean;
  error?: string | null;
}

interface ADXPoint {
  time: string;
  label: string;
  adx: number;
  pdi: number;
  mdi: number;
  signal: 'strong_bull' | 'strong_bear' | 'weak' | 'ranging';
}

function calculateADX(priceData: ADXChartProps['priceData'], period = 14): ADXPoint[] {
  if (!priceData || priceData.length < period * 2 + 1) return [];

  const smoothedPDI: number[] = [];
  const smoothedMDI: number[] = [];
  const smoothedTR: number[] = [];
  const dxValues: number[] = [];
  const points: ADXPoint[] = [];

  let pdmAccum = 0, mdmAccum = 0, trAccum = 0;

  for (let i = 1; i < priceData.length; i++) {
    const curr = priceData[i];
    const prev = priceData[i - 1];
    const high = curr.high;
    const low = curr.low;
    const prevHigh = prev.high;
    const prevLow = prev.low;
    const prevClose = prev.close ?? prev.price;

    const upMove = high - prevHigh;
    const downMove = prevLow - low;
    const pdm = upMove > downMove && upMove > 0 ? upMove : 0;
    const mdm = downMove > upMove && downMove > 0 ? downMove : 0;
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));

    if (i <= period) {
      pdmAccum += pdm;
      mdmAccum += mdm;
      trAccum += tr;
      if (i === period) {
        smoothedPDI.push(pdmAccum);
        smoothedMDI.push(mdmAccum);
        smoothedTR.push(trAccum);
      }
      continue;
    }

    const sPDI = (smoothedPDI[smoothedPDI.length - 1] * (period - 1) + pdm) / period;
    const sMDI = (smoothedMDI[smoothedMDI.length - 1] * (period - 1) + mdm) / period;
    const sTR = (smoothedTR[smoothedTR.length - 1] * (period - 1) + tr) / period;

    smoothedPDI.push(sPDI);
    smoothedMDI.push(sMDI);
    smoothedTR.push(sTR);

    const pdi = sTR > 0 ? (sPDI / sTR) * 100 : 0;
    const mdi = sTR > 0 ? (sMDI / sTR) * 100 : 0;
    const diSum = pdi + mdi;
    const dx = diSum > 0 ? (Math.abs(pdi - mdi) / diSum) * 100 : 0;
    dxValues.push(dx);

    if (dxValues.length >= period) {
      let adx: number;
      if (dxValues.length === period) {
        adx = dxValues.slice(-period).reduce((s, v) => s + v, 0) / period;
      } else {
        const prevADX = points[points.length - 1]?.adx || 25;
        adx = (prevADX * (period - 1) + dx) / period;
      }

      const signal: ADXPoint['signal'] =
        adx >= 25 && pdi > mdi ? 'strong_bull' :
        adx >= 25 && mdi > pdi ? 'strong_bear' :
        adx < 20 ? 'ranging' : 'weak';

      const timeStr = curr.time || '';
      const date = new Date(timeStr);
      const label = !isNaN(date.getTime())
        ? `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
        : timeStr.slice(-5);

      points.push({ time: timeStr, label, adx, pdi, mdi, signal });
    }
  }

  return points;
}

export function ADXChart({ pair, timeframe, priceData, apiADX, loading, error }: ADXChartProps) {
  const adxData = useMemo(() => {
    if (apiADX && apiADX.length > 0) {
      return apiADX.map((a) => {
        const date = new Date(a.time);
        const label = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        const signal: ADXPoint['signal'] =
          a.adx >= 25 && a.pdi > a.mdi ? 'strong_bull' :
          a.adx >= 25 && a.mdi > a.pdi ? 'strong_bear' :
          a.adx < 20 ? 'ranging' : 'weak';
        return { time: a.time, label, adx: a.adx, pdi: a.pdi, mdi: a.mdi, signal };
      });
    }
    return calculateADX(priceData);
  }, [priceData, apiADX]);

  const stats = useMemo(() => {
    if (adxData.length === 0) return null;
    const current = adxData[adxData.length - 1];
    const prev = adxData.length > 1 ? adxData[adxData.length - 2] : current;
    const adxTrend = current.adx > prev.adx ? 'strengthening' : current.adx < prev.adx ? 'weakening' : 'flat';

    // DI crossover
    const prevCross = adxData.length > 1 ? adxData[adxData.length - 2] : null;
    let crossover: 'bullish' | 'bearish' | null = null;
    if (prevCross) {
      if (prevCross.pdi <= prevCross.mdi && current.pdi > current.mdi) crossover = 'bullish';
      else if (prevCross.pdi >= prevCross.mdi && current.pdi < current.mdi) crossover = 'bearish';
    }

    return { current, adxTrend, crossover };
  }, [adxData]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-40 bg-cyan-900/20" />
        <Skeleton className="h-[220px] w-full bg-cyan-900/10" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center py-8 text-gray-500 text-xs">
        <Gauge className="w-6 h-6 mx-auto mb-2 opacity-40" />
        Sin datos ADX disponibles
      </div>
    );
  }

  const { current, adxTrend, crossover } = stats;

  const strengthLabel = current.adx >= 50 ? 'MUY FUERTE' : current.adx >= 25 ? 'FUERTE' : current.adx >= 20 ? 'DÉBIL' : 'SIN TENDENCIA';
  const strengthColor = current.adx >= 50 ? 'text-yellow-400' : current.adx >= 25 ? 'text-emerald-400' : current.adx >= 20 ? 'text-orange-400' : 'text-gray-400';
  const strengthBg = current.adx >= 50 ? 'bg-yellow-500/15 border-yellow-500/30' : current.adx >= 25 ? 'bg-emerald-500/15 border-emerald-500/30' : current.adx >= 20 ? 'bg-orange-500/15 border-orange-500/30' : 'bg-gray-500/15 border-gray-500/30';

  const DirIcon = current.pdi > current.mdi ? ArrowUpRight : ArrowDownRight;
  const dirColor = current.pdi > current.mdi ? 'text-emerald-400' : 'text-red-400';
  const dirLabel = current.pdi > current.mdi ? 'ALCISTA' : 'BAJISTA';

  const TrendIcon = adxTrend === 'strengthening' ? TrendingUp : adxTrend === 'weakening' ? TrendingDown : Minus;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-yellow-400" />
          <span className="text-xs font-mono font-bold text-white">ADX(14)</span>
          <span className="text-[10px] text-gray-500 font-mono">Directional Index</span>
        </div>
        <div className="flex items-center gap-1.5">
          {crossover && (
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${crossover === 'bullish' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-red-500/15 border-red-500/30 text-red-400'}`}>
              ⚡ DI CROSS {crossover === 'bullish' ? '▲' : '▼'}
            </span>
          )}
          <span className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold ${strengthBg} ${strengthColor}`}>
            {strengthLabel}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-[#060d1b] rounded-lg p-2 border border-cyan-900/20">
          <div className="text-[9px] text-gray-500 font-mono">ADX</div>
          <div className={`text-sm font-mono font-bold ${strengthColor}`}>{current.adx.toFixed(1)}</div>
        </div>
        <div className="bg-[#060d1b] rounded-lg p-2 border border-cyan-900/20">
          <div className="text-[9px] text-gray-500 font-mono">+DI</div>
          <div className="text-sm font-mono font-bold text-emerald-400">{current.pdi.toFixed(1)}</div>
        </div>
        <div className="bg-[#060d1b] rounded-lg p-2 border border-cyan-900/20">
          <div className="text-[9px] text-gray-500 font-mono">−DI</div>
          <div className="text-sm font-mono font-bold text-red-400">{current.mdi.toFixed(1)}</div>
        </div>
        <div className="bg-[#060d1b] rounded-lg p-2 border border-cyan-900/20">
          <div className="text-[9px] text-gray-500 font-mono">Dirección</div>
          <div className="flex items-center gap-1">
            <DirIcon className={`w-3.5 h-3.5 ${dirColor}`} />
            <span className={`text-[11px] font-mono font-bold ${dirColor}`}>{dirLabel}</span>
          </div>
        </div>
      </div>

      {/* ADX Strength Gauge */}
      <div className="bg-[#060d1b] rounded-lg p-2.5 border border-cyan-900/20">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] text-gray-500 font-mono">FUERZA DE TENDENCIA</span>
          <div className="flex items-center gap-1">
            <TrendIcon className={`w-3 h-3 ${adxTrend === 'strengthening' ? 'text-emerald-400' : adxTrend === 'weakening' ? 'text-red-400' : 'text-gray-400'}`} />
            <span className={`text-[10px] font-mono font-bold ${strengthColor}`}>{current.adx.toFixed(1)}</span>
          </div>
        </div>
        <div className="relative h-3 bg-[#0a1628] rounded-full overflow-hidden">
          <div className="absolute inset-0 flex">
            <div className="w-[20%] bg-gray-500/15" />
            <div className="w-[5%] bg-orange-500/15" />
            <div className="w-[25%] bg-emerald-500/15" />
            <div className="w-[50%] bg-yellow-500/15" />
          </div>
          <div
            className="absolute top-0 h-full w-1.5 bg-white rounded-full shadow-[0_0_6px_white]"
            style={{ left: `${Math.min(current.adx, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-0.5">
          {['0', '20', '25', '50', '75+'].map(l => (
            <span key={l} className="text-[8px] text-gray-600 font-mono">{l}</span>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={adxData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f20" />
            <ReferenceArea y1={0} y2={20} fill="#6b728050" fillOpacity={0.1} />
            <ReferenceArea y1={25} y2={100} fill="#10b98110" fillOpacity={0.1} />
            <XAxis dataKey="label" tick={{ fill: '#4a5568', fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fill: '#4a5568', fontSize: 9 }} tickLine={false} axisLine={false} domain={[0, 'auto']} width={30} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0a1628', border: '1px solid rgba(6,182,212,0.3)', borderRadius: 8, fontSize: 11, fontFamily: 'monospace' }}
              formatter={(v: number, name: string) => {
                const labels: Record<string, string> = { adx: 'ADX', pdi: '+DI', mdi: '−DI' };
                return [v.toFixed(2), labels[name] || name];
              }}
            />
            <ReferenceLine y={20} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.4} />
            <ReferenceLine y={25} stroke="#10b981" strokeDasharray="4 4" strokeOpacity={0.4} />
            <Line type="monotone" dataKey="pdi" stroke="#10b981" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="mdi" stroke="#ef4444" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="adx" stroke="#eab308" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#eab308', stroke: '#fff', strokeWidth: 1 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
