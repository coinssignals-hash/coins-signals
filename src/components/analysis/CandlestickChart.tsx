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
function isJpyPair(s: number, r: number) { return s > 10 || r > 10; }
function fmtPrice(n: number, jpy: boolean) { return jpy ? n.toFixed(3) : n.toFixed(5); }

function fmtTimeLabel(ts: string): string {
  const d = new Date(ts);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${mm}/${dd} ${hh}:${min}`;
}

function fmtVolume(v: number): string {
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return v.toFixed(0);
}

/* ═══════════════════════════════════════════════════
 *  Build TradingView-style SVG chart (static image)
 * ═══════════════════════════════════════════════════ */
function buildChartSvg(
  data: CandleData[],
  support: number,
  resistance: number,
  realtimePrice: number | null,
  isConnected: boolean,
  title?: string,
): string {
  const W = 1200, H = 700;
  const PAD = { top: 35, right: 130, bottom: 30, left: 60 };
  const CHART_X1 = PAD.left;
  const CHART_X2 = W - PAD.right;
  const CHART_W = CHART_X2 - CHART_X1;

  // Price area & volume area
  const PRICE_TOP = PAD.top;
  const VOL_SEPARATOR_Y = 570;
  const PRICE_BOTTOM = VOL_SEPARATOR_Y;
  const PRICE_H = PRICE_BOTTOM - PRICE_TOP;
  const VOL_TOP = VOL_SEPARATOR_Y + 10;
  const VOL_BOTTOM = H - PAD.bottom;
  const VOL_H = VOL_BOTTOM - VOL_TOP;

  // Colors — TradingView
  const BG = '#131722';
  const GRID = '#2a2e39';
  const TEXT_COLOR = '#787b86';
  const UP_COLOR = '#26a69a';
  const DN_COLOR = '#ef5350';

  if (data.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
      <rect width="${W}" height="${H}" fill="${BG}"/>
      <text x="${W / 2}" y="${H / 2}" fill="${TEXT_COLOR}" text-anchor="middle" font-size="14" font-family="Arial, sans-serif">Sin datos disponibles</text>
    </svg>`;
  }

  const jpy = isJpyPair(support, resistance);

  // ── Price range ──
  let minP = Infinity, maxP = -Infinity;
  for (const c of data) { if (c.low < minP) minP = c.low; if (c.high > maxP) maxP = c.high; }
  if (realtimePrice) { minP = Math.min(minP, realtimePrice); maxP = Math.max(maxP, realtimePrice); }
  minP = Math.min(minP, support);
  maxP = Math.max(maxP, resistance);
  const pr = maxP - minP || 0.0001;
  const pPad = pr * 0.05;
  minP -= pPad;
  maxP += pPad;
  const totalRange = maxP - minP;

  // ── Mock volume ──
  const volumes = data.map((_, i) => 5e6 + Math.abs(Math.sin(i * 0.3)) * 50e6 + ((i * 7) % 10) * 1e6);
  let maxVol = 0;
  for (const v of volumes) if (v > maxVol) maxVol = v;
  if (maxVol === 0) maxVol = 1;

  // ── Coordinate helpers ──
  const yOf = (price: number) => PRICE_TOP + PRICE_H * (1 - (price - minP) / totalRange);
  const xOf = (i: number) => CHART_X1 + (i + 0.5) * (CHART_W / data.length);
  const volYOf = (vol: number) => {
    const h = (vol / maxVol) * VOL_H;
    return { y: VOL_BOTTOM - h, h };
  };

  const cw = CHART_W / data.length;
  const bodyW = Math.max(2, Math.min(8, cw * 0.7));

  const parts: string[] = [];

  // ── Background ──
  parts.push(`<rect width="${W}" height="${H}" fill="${BG}"/>`);

  // ── Title ──
  if (title) {
    parts.push(`<text x="${CHART_X1}" y="25" fill="${TEXT_COLOR}" font-family="Arial, sans-serif" font-size="14" font-weight="bold">${title}</text>`);
  }

  // ── Horizontal grid + price labels (RIGHT side) ──
  const gridCount = 8;
  for (let i = 0; i <= gridCount; i++) {
    const price = minP + (totalRange * i) / gridCount;
    const y = yOf(price);
    parts.push(`<line x1="${CHART_X1}" y1="${y}" x2="${CHART_X2}" y2="${y}" stroke="${GRID}" stroke-width="1"/>`);
    parts.push(`<text x="${CHART_X2 + 10}" y="${y + 4}" fill="${TEXT_COLOR}" font-family="Arial, sans-serif" font-size="11">${fmtPrice(price, jpy)}</text>`);
  }

  // ── Vertical grid + time labels ──
  const timeLabelCount = Math.min(10, data.length);
  const timeInterval = Math.max(1, Math.floor(data.length / timeLabelCount));
  for (let i = 0; i < data.length; i += timeInterval) {
    const x = xOf(i);
    parts.push(`<line x1="${x}" y1="${PRICE_TOP}" x2="${x}" y2="${PRICE_BOTTOM}" stroke="${GRID}" stroke-width="1"/>`);
    parts.push(`<text x="${x}" y="${PRICE_BOTTOM + 50}" fill="${TEXT_COLOR}" font-family="Arial, sans-serif" font-size="11" text-anchor="middle">${fmtTimeLabel(data[i].time)}</text>`);
  }

  // ── Volume separator ──
  parts.push(`<line x1="${CHART_X1}" y1="${VOL_SEPARATOR_Y}" x2="${CHART_X2}" y2="${VOL_SEPARATOR_Y}" stroke="${GRID}" stroke-width="2"/>`);
  parts.push(`<text x="${CHART_X1}" y="${VOL_SEPARATOR_Y + 5}" fill="${TEXT_COLOR}" font-family="Arial, sans-serif" font-size="12" font-weight="bold">VOLUME</text>`);

  // ── Volume grid ──
  for (let i = 1; i <= 3; i++) {
    const volVal = (maxVol * i) / 3;
    const { y } = volYOf(volVal);
    parts.push(`<line x1="${CHART_X1}" y1="${y}" x2="${CHART_X2}" y2="${y}" stroke="${GRID}" stroke-width="1" opacity="0.3"/>`);
    parts.push(`<text x="${W - 20}" y="${y + 4}" fill="${TEXT_COLOR}" font-family="Arial, sans-serif" font-size="9">${fmtVolume(volVal)}</text>`);
  }

  // ── Support line ──
  const sY = yOf(support);
  parts.push(`<line x1="${CHART_X1}" y1="${sY}" x2="${CHART_X2 - 60}" y2="${sY}" stroke="${DN_COLOR}" stroke-width="1" stroke-dasharray="5,5"/>`);
  parts.push(`<rect x="${CHART_X2 - 55}" y="${sY - 10}" width="55" height="20" fill="${DN_COLOR}" rx="2"/>`);
  parts.push(`<text x="${CHART_X2 - 52}" y="${sY + 4}" fill="white" font-family="Arial, sans-serif" font-size="10">${fmtPrice(support, jpy)}</text>`);

  // ── Resistance line ──
  const rY = yOf(resistance);
  parts.push(`<line x1="${CHART_X1}" y1="${rY}" x2="${CHART_X2 - 60}" y2="${rY}" stroke="${UP_COLOR}" stroke-width="1" stroke-dasharray="5,5"/>`);
  parts.push(`<rect x="${CHART_X2 - 55}" y="${rY - 10}" width="55" height="20" fill="${UP_COLOR}" rx="2"/>`);
  parts.push(`<text x="${CHART_X2 - 52}" y="${rY + 4}" fill="white" font-family="Arial, sans-serif" font-size="10">${fmtPrice(resistance, jpy)}</text>`);

  // ── Candlesticks + Volume bars ──
  for (let i = 0; i < data.length; i++) {
    const c = data[i];
    const x = xOf(i);
    const isUp = c.close >= c.open;
    const color = isUp ? UP_COLOR : DN_COLOR;

    const bodyTop = yOf(Math.max(c.open, c.close));
    const bodyBot = yOf(Math.min(c.open, c.close));
    const bH = Math.max(1, bodyBot - bodyTop);
    const wickTop = yOf(c.high);
    const wickBot = yOf(c.low);

    // Wick
    parts.push(`<line x1="${x}" y1="${wickTop}" x2="${x}" y2="${wickBot}" stroke="${color}" stroke-width="1"/>`);
    // Body
    parts.push(`<rect x="${x - bodyW / 2}" y="${bodyTop}" width="${bodyW}" height="${bH}" fill="${color}"/>`);

    // Volume bar
    const { y: vy, h: vh } = volYOf(volumes[i]);
    parts.push(`<rect x="${x - bodyW / 2}" y="${vy}" width="${bodyW}" height="${Math.max(1, vh)}" fill="${color}" opacity="0.8"/>`);
  }

  // ── Realtime price line ──
  if (realtimePrice) {
    const rtY = yOf(realtimePrice);
    const rtColor = isConnected ? '#2196F3' : '#6366f1';
    parts.push(`<line x1="${CHART_X1}" y1="${rtY}" x2="${CHART_X2 - 60}" y2="${rtY}" stroke="${rtColor}" stroke-width="1.5" stroke-dasharray="4,2"/>`);
    parts.push(`<rect x="${CHART_X2 - 55}" y="${rtY - 10}" width="55" height="20" fill="${rtColor}" rx="2"/>`);
    parts.push(`<text x="${CHART_X2 - 52}" y="${rtY + 4}" fill="white" font-family="Arial, sans-serif" font-size="10">${isConnected ? '● ' : ''}${fmtPrice(realtimePrice, jpy)}</text>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <style>
      .grid-line { stroke: ${GRID}; stroke-width: 1; }
      .text { fill: ${TEXT_COLOR}; font-family: Arial, sans-serif; font-size: 11px; }
      .price-label { font-size: 10px; fill: white; }
    </style>
  </defs>
  ${parts.join('\n  ')}
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
  const jpy = isJpyPair(support, resistance);

  const svgDataUri = useMemo(() => {
    if (!data.length) return null;
    const title = previousDayDate
      ? `Velas — Última Semana | ${previousDayDate}`
      : 'Velas — Última Semana';
    const svg = buildChartSvg(data, support, resistance, realtimePrice ?? null, isRealtimeConnected, title);
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }, [data, support, resistance, realtimePrice, isRealtimeConnected, previousDayDate]);

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
      <div className="bg-[#131722] rounded-lg p-4 animate-pulse">
        <div className="h-52 bg-slate-800/30 rounded" />
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
      {alertStyles && (
        <>
          <div className={cn('absolute inset-0 animate-pulse pointer-events-none', alertStyles.bgPulse)} />
          <div className={cn('absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-xs font-bold text-white animate-bounce z-20', alertStyles.labelBg)}>
            {alertStyles.label}
          </div>
        </>
      )}

      {svgDataUri ? (
        <img
          src={svgDataUri}
          alt="Candlestick chart"
          className="w-full h-auto block rounded-lg"
          draggable={false}
        />
      ) : (
        <div className="h-52 bg-[#131722] rounded-lg flex items-center justify-center">
          <span className="text-slate-500 text-sm">Sin datos disponibles</span>
        </div>
      )}

      {/* Legend below */}
      <div className="flex justify-between text-xs flex-wrap gap-2 px-3 py-2 bg-[#131722] rounded-b-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-0.5 border-t-2 border-dashed" style={{ borderColor: '#26a69a' }} />
            <span style={{ color: '#26a69a' }}>Resistencia 24h</span>
            <span className="font-mono font-semibold px-1.5 py-0.5 rounded text-xs" style={{ color: '#26a69a', background: 'rgba(38,166,154,0.2)' }}>{fmtPrice(resistance, jpy)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-0.5 border-t-2 border-dashed" style={{ borderColor: '#ef5350' }} />
            <span style={{ color: '#ef5350' }}>Soporte 24h</span>
            <span className="font-mono font-semibold px-1.5 py-0.5 rounded text-xs" style={{ color: '#ef5350', background: 'rgba(239,83,80,0.2)' }}>{fmtPrice(support, jpy)}</span>
          </div>
        </div>
        {realtimePrice && (
          <div className="flex items-center gap-1">
            <div className={cn('w-2 h-2 rounded-full', isRealtimeConnected ? 'bg-blue-500 animate-pulse' : 'bg-indigo-500')} />
            <span className={isRealtimeConnected ? 'text-blue-400' : 'text-indigo-400'}>
              Actual {realtimePrice.toFixed(5)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
