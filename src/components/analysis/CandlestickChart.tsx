import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { AlertState } from '@/hooks/useSupportResistanceAlerts';

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface CandlestickChartProps {
  data: CandleData[];
  resistance: number;
  support: number;
  loading?: boolean;
  realtimePrice?: number | null;
  isRealtimeConnected?: boolean;
  previousDayDate?: string;
  alertState?: AlertState;
}

/* ─── helpers ─── */
function isJpy(s: number, r: number) { return s > 10 || r > 10; }
function fmt(n: number, jpy: boolean) { return jpy ? n.toFixed(3) : n.toFixed(5); }
function dayKey(ts: string) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function escapeXml(s: string) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

/* ─── SVG builder (runs client-side) ─── */
function buildChartSvg(
  data: CandleData[],
  support: number,
  resistance: number,
  realtimePrice: number | null,
  isConnected: boolean,
): string {
  const W = 780, H = 500;
  const PAD = { top: 30, right: 20, bottom: 40, left: 60 };
  const CHART_W = W - PAD.left - PAD.right;
  const TOTAL_H = H - PAD.top - PAD.bottom;
  const VOL_RATIO = 0.18;
  const VOL_GAP = 8;
  const VOL_H = TOTAL_H * VOL_RATIO;
  const CANDLE_H = TOTAL_H - VOL_H - VOL_GAP;

  if (data.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <rect width="${W}" height="${H}" fill="#050d1a"/>
      <text x="${W/2}" y="${H/2}" fill="#94A3B8" text-anchor="middle" font-size="14" font-family="sans-serif">Sin datos disponibles</text>
    </svg>`;
  }

  const jpy = isJpy(support, resistance);

  // Price range
  let minP = Infinity, maxP = -Infinity;
  for (const c of data) { if (c.low < minP) minP = c.low; if (c.high > maxP) maxP = c.high; }
  if (realtimePrice) { minP = Math.min(minP, realtimePrice); maxP = Math.max(maxP, realtimePrice); }
  minP = Math.min(minP, support); maxP = Math.max(maxP, resistance);
  const pr = maxP - minP || 0.0001;
  const pad2 = pr * 0.05;
  minP -= pad2; maxP += pad2;
  const totalRange = maxP - minP;

  // Mock volume
  const volumes = data.map((_, i) => 50 + Math.abs(Math.sin(i * 0.3)) * 100 + ((i * 7) % 30));
  let maxVol = 0;
  for (const v of volumes) if (v > maxVol) maxVol = v;
  if (maxVol === 0) maxVol = 1;

  const yOf = (price: number) => PAD.top + CANDLE_H * (1 - (price - minP) / totalRange);
  const xOf = (i: number) => PAD.left + (i + 0.5) * (CHART_W / data.length);
  const volY = (vol: number) => {
    const volTop = PAD.top + CANDLE_H + VOL_GAP;
    const h = (vol / maxVol) * VOL_H;
    return { y: volTop + VOL_H - h, h };
  };

  const cw = CHART_W / data.length;
  const bodyW = Math.max(1, Math.min(8, cw * 0.65));

  const lastDayStr = dayKey(data[data.length - 1].time);
  const firstLastDayIdx = data.findIndex(c => dayKey(c.time) === lastDayStr);

  // Build SVG parts
  const parts: string[] = [];

  // Grid lines + price labels
  for (let i = 0; i <= 6; i++) {
    const price = minP + (totalRange * i) / 6;
    const y = yOf(price);
    parts.push(`<line x1="${PAD.left}" y1="${y}" x2="${W - PAD.right}" y2="${y}" stroke="#1e3a5f" stroke-width="0.5" stroke-dasharray="4,4" shape-rendering="crispEdges"/>`);
    parts.push(`<text x="${PAD.left - 5}" y="${y + 3}" fill="#64748b" text-anchor="end" font-size="9" font-family="monospace">${fmt(price, jpy)}</text>`);
  }

  // Volume separator
  const volSepY = PAD.top + CANDLE_H + VOL_GAP / 2;
  parts.push(`<line x1="${PAD.left}" y1="${volSepY}" x2="${W - PAD.right}" y2="${volSepY}" stroke="#1e3a5f" stroke-width="0.8" shape-rendering="crispEdges"/>`);
  parts.push(`<text x="${PAD.left + 4}" y="${PAD.top + CANDLE_H + VOL_GAP + 11}" fill="#475569" font-size="8" font-family="sans-serif" font-weight="600">VOL</text>`);

  // Day separators + labels
  let prevDay = '';
  for (let i = 0; i < data.length; i++) {
    const dk = dayKey(data[i].time);
    if (dk !== prevDay) {
      const x = PAD.left + i * cw;
      parts.push(`<line x1="${x}" y1="${PAD.top}" x2="${x}" y2="${H - PAD.bottom}" stroke="#1e3a5f" stroke-width="0.5" stroke-dasharray="2,6" shape-rendering="crispEdges"/>`);
      const d = new Date(data[i].time);
      const label = `${DAY_NAMES[d.getDay()]} ${d.getDate()}`;
      parts.push(`<text x="${x + 4}" y="${H - PAD.bottom + 14}" fill="#64748b" font-size="9" font-family="sans-serif">${escapeXml(label)}</text>`);
      prevDay = dk;
    }
  }

  // Last day highlight
  if (firstLastDayIdx >= 0) {
    const x1 = PAD.left + firstLastDayIdx * cw;
    parts.push(`<rect x="${x1}" y="${PAD.top}" width="${W - PAD.right - x1}" height="${CANDLE_H}" fill="rgba(34,197,94,0.03)"/>`);
  }

  // Candles + volume bars
  for (let i = 0; i < data.length; i++) {
    const c = data[i];
    const x = xOf(i);
    const isLastDay = dayKey(c.time) === lastDayStr;
    const isUp = c.close >= c.open;

    const bodyTop = yOf(Math.max(c.open, c.close));
    const bodyBot = yOf(Math.min(c.open, c.close));
    const bH = Math.max(1, bodyBot - bodyTop);
    const wickTop = yOf(c.high);
    const wickBot = yOf(c.low);

    let upC: string, dnC: string, wickC: string;
    if (isLastDay) { upC = '#22c55e'; dnC = '#ef4444'; wickC = isUp ? '#22c55e' : '#ef4444'; }
    else { upC = 'rgba(34,197,94,0.35)'; dnC = 'rgba(239,68,68,0.35)'; wickC = 'rgba(148,163,184,0.3)'; }

    const fill = isUp ? upC : dnC;
    parts.push(`<line x1="${x}" y1="${wickTop}" x2="${x}" y2="${wickBot}" stroke="${wickC}" stroke-width="1" shape-rendering="crispEdges"/>`);
    parts.push(`<rect x="${x - bodyW / 2}" y="${bodyTop}" width="${bodyW}" height="${bH}" fill="${fill}" rx="0.5" shape-rendering="crispEdges"/>`);

    // Volume
    const { y: vy, h: vh } = volY(volumes[i]);
    const volColor = isLastDay
      ? (isUp ? 'rgba(34,197,94,0.6)' : 'rgba(239,68,68,0.6)')
      : (isUp ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)');
    parts.push(`<rect x="${x - bodyW / 2}" y="${vy}" width="${bodyW}" height="${Math.max(1, vh)}" fill="${volColor}" rx="0.3" shape-rendering="crispEdges"/>`);
  }

  // S/R lines — only last day
  const srX1 = firstLastDayIdx >= 0 ? PAD.left + firstLastDayIdx * cw : PAD.left;
  const srX2 = W - PAD.right;
  const lW = 80, lH = 18, fs = 10;

  // Resistance
  const rY = yOf(resistance);
  parts.push(`<line x1="${srX1}" y1="${rY}" x2="${srX2}" y2="${rY}" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="8,4" shape-rendering="crispEdges"/>`);
  parts.push(`<rect x="${srX2 - lW - 4}" y="${rY - lH / 2}" width="${lW}" height="${lH}" rx="4" fill="rgba(34,197,94,0.15)" stroke="#22c55e" stroke-width="0.8"/>`);
  parts.push(`<text x="${srX2 - lW / 2 - 4}" y="${rY + fs / 3}" fill="#22c55e" text-anchor="middle" font-size="${fs}" font-family="monospace" font-weight="bold">${fmt(resistance, jpy)}</text>`);

  // Support
  const sY = yOf(support);
  parts.push(`<line x1="${srX1}" y1="${sY}" x2="${srX2}" y2="${sY}" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="8,4" shape-rendering="crispEdges"/>`);
  parts.push(`<rect x="${srX2 - lW - 4}" y="${sY - lH / 2}" width="${lW}" height="${lH}" rx="4" fill="rgba(239,68,68,0.15)" stroke="#ef4444" stroke-width="0.8"/>`);
  parts.push(`<text x="${srX2 - lW / 2 - 4}" y="${sY + fs / 3}" fill="#ef4444" text-anchor="middle" font-size="${fs}" font-family="monospace" font-weight="bold">${fmt(support, jpy)}</text>`);

  // Realtime price
  if (realtimePrice) {
    const rtY = yOf(realtimePrice);
    const rtColor = isConnected ? '#3b82f6' : '#6366f1';
    parts.push(`<line x1="${PAD.left}" y1="${rtY}" x2="${W - PAD.right}" y2="${rtY}" stroke="${rtColor}" stroke-width="1.5" stroke-dasharray="4,2" shape-rendering="crispEdges"/>`);
    const bw = 70, bh = 18;
    parts.push(`<rect x="${srX2 - bw - 4}" y="${rtY - bh / 2}" width="${bw}" height="${bh}" rx="4" fill="${rtColor}"/>`);
    parts.push(`<text x="${srX2 - bw / 2 - 4}" y="${rtY + 3}" fill="#ffffff" text-anchor="middle" font-size="9" font-family="monospace" font-weight="bold">${isConnected ? '● ' : ''}${fmt(realtimePrice, jpy)}</text>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="geometricPrecision">
  <defs>
    <linearGradient id="chartBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#050d1a"/>
      <stop offset="100%" stop-color="#0a1628"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#chartBg)" rx="8"/>
  ${parts.join('\n  ')}
  <rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="#1e3a5f" stroke-width="1" rx="8"/>
</svg>`;
}

/* ═══════════════════════════════════════════
 *  Component — renders a static SVG image
 * ═══════════════════════════════════════════ */
export function CandlestickChart({
  data,
  resistance,
  support,
  loading,
  realtimePrice,
  isRealtimeConnected = false,
  previousDayDate,
  alertState,
}: CandlestickChartProps) {
  const jpy = isJpy(support, resistance);

  // Build SVG data URI
  const svgDataUri = useMemo(() => {
    if (!data.length) return null;
    const svg = buildChartSvg(data, support, resistance, realtimePrice ?? null, isRealtimeConnected);
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }, [data, support, resistance, realtimePrice, isRealtimeConnected]);

  /* ─── Alert styles ─── */
  const alertStyles = useMemo(() => {
    if (!alertState?.isActive) return null;
    const isRes = alertState.type === 'resistance' || alertState.type === 'breakout-resistance';
    const isCrit = alertState.level === 'critical';
    return {
      borderColor: isRes ? 'border-green-500' : 'border-red-500',
      glowColor: isRes
        ? (isCrit ? 'shadow-[0_0_30px_rgba(34,197,94,0.6)]' : 'shadow-[0_0_20px_rgba(34,197,94,0.4)]')
        : (isCrit ? 'shadow-[0_0_30px_rgba(239,68,68,0.6)]' : 'shadow-[0_0_20px_rgba(239,68,68,0.4)]'),
      bgPulse: isRes ? 'bg-green-500/10' : 'bg-red-500/10',
      label: alertState.type?.startsWith('breakout-')
        ? (isRes ? '🚀 RUPTURA RESISTENCIA' : '📉 RUPTURA SOPORTE')
        : (isRes ? '⚠️ CERCA DE RESISTENCIA' : '⚠️ CERCA DE SOPORTE'),
      labelBg: isRes ? 'bg-green-500' : 'bg-red-500',
    };
  }, [alertState]);

  if (loading) {
    return (
      <div className="bg-[#050d1a] border border-slate-700/50 rounded-lg p-4 animate-pulse">
        <div className="h-52 bg-cyan-900/10 rounded" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg transition-all duration-300 relative overflow-hidden',
        alertStyles
          ? `${alertStyles.borderColor} ${alertStyles.glowColor} border-2`
          : '',
      )}
    >
      {/* Alert overlay */}
      {alertStyles && (
        <>
          <div className={cn('absolute inset-0 animate-pulse pointer-events-none', alertStyles.bgPulse)} />
          <div className={cn('absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-xs font-bold text-white animate-bounce z-20', alertStyles.labelBg)}>
            {alertStyles.label}
          </div>
        </>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1 relative z-10" style={{ background: 'linear-gradient(180deg, #050d1a 0%, transparent 100%)' }}>
        <div className="flex items-center gap-2">
          <h3 className="text-white font-semibold text-sm">Velas Japonesas — Última Semana</h3>
          {previousDayDate && (
            <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded">{previousDayDate}</span>
          )}
        </div>
        {isRealtimeConnected && realtimePrice && (
          <div className="flex items-center gap-2 bg-blue-500/20 px-2 py-1 rounded-full">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-xs text-blue-400 font-medium">LIVE: {realtimePrice.toFixed(5)}</span>
          </div>
        )}
      </div>

      {/* Static SVG Chart */}
      {svgDataUri ? (
        <img
          src={svgDataUri}
          alt="Candlestick chart"
          className="w-full h-auto block"
          draggable={false}
        />
      ) : (
        <div className="h-52 bg-[#050d1a] rounded-lg flex items-center justify-center">
          <span className="text-slate-500 text-sm">Sin datos disponibles</span>
        </div>
      )}

      {/* Legend */}
      <div className="flex justify-between text-xs flex-wrap gap-2 px-3 pb-3 pt-1 relative z-10" style={{ background: 'linear-gradient(0deg, #0a1628 0%, transparent 100%)' }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 border-t-2 border-dashed border-green-500" />
            <span className="text-green-400">Resistencia 24h</span>
            <span className="font-mono font-semibold text-green-300 bg-green-500/20 px-1.5 py-0.5 rounded">{fmt(resistance, jpy)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 border-t-2 border-dashed border-red-500" />
            <span className="text-red-400">Soporte 24h</span>
            <span className="font-mono font-semibold text-red-300 bg-red-500/20 px-1.5 py-0.5 rounded">{fmt(support, jpy)}</span>
          </div>
        </div>
        {realtimePrice && (
          <div className="flex items-center gap-1">
            <div className={cn('w-2 h-2 rounded-full', isRealtimeConnected ? 'bg-blue-500 animate-pulse' : 'bg-indigo-500')} />
            <span className={isRealtimeConnected ? 'text-blue-400' : 'text-indigo-400'}>Actual {realtimePrice.toFixed(5)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
