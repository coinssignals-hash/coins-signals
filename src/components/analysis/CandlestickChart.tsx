import { useMemo, useState, useCallback, useRef } from 'react';
import type { TimeValue, MACDData } from '@/lib/indicators';
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
  /** Whether to show support/resistance lines (default: true) */
  showSupportResistance?: boolean;
  /** Optional EMA overlay data */
  ema20Data?: TimeValue[];
  ema50Data?: TimeValue[];
}

/* ─── helpers ─── */
function isJpyPair(s: number, r: number) { return s > 10 || r > 10; }
function fmtPrice(n: number, jpy: boolean) { return jpy ? n.toFixed(3) : n.toFixed(5); }

function dayKey(ts: string): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function fmtTimeLabel(ts: string): string {
  const d = new Date(ts);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${mm}/${dd} ${hh}:${min}`;
}


/* ═══════════════════════════════════════════════════════
 *  Build SVG — dark navy style matching reference image
 * ═══════════════════════════════════════════════════════ */
function buildChartSvg(
  data: CandleData[],
  support: number,
  resistance: number,
  realtimePrice: number | null,
  isConnected: boolean,
  title?: string,
  showSR = true,
  ema20Data?: TimeValue[],
  ema50Data?: TimeValue[],
): string {
  const W = 1200, H = 700;
  const PAD = { top: 35, right: 110, bottom: 50, left: 65 };
  const CHART_X1 = PAD.left;
  const CHART_X2 = W - PAD.right;
  const CHART_W = CHART_X2 - CHART_X1;

  // Price area (full height, no volume)
  const PRICE_TOP = PAD.top;
  const PRICE_BOTTOM = H - PAD.bottom;
  const PRICE_H = PRICE_BOTTOM - PRICE_TOP;

  // Colors
  const BG1 = '#050d1a';
  const BG2 = '#0a1628';
  const GRID = '#1e3a5f';
  const TEXT_COL = '#64748b';
  const UP = '#22c55e';
  const DN = '#ef4444';
  const UP_DIM = 'rgba(34,197,94,0.35)';
  const DN_DIM = 'rgba(239,68,68,0.35)';
  const WICK_DIM = 'rgba(148,163,184,0.3)';

  if (data.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
      <rect width="${W}" height="${H}" fill="${BG1}"/>
      <text x="${W / 2}" y="${H / 2}" fill="${TEXT_COL}" text-anchor="middle" font-size="14" font-family="sans-serif">Sin datos disponibles</text>
    </svg>`;
  }

  const jpy = isJpyPair(support, resistance);

  // Price range
  let minP = Infinity, maxP = -Infinity;
  for (const c of data) { if (c.low < minP) minP = c.low; if (c.high > maxP) maxP = c.high; }
  if (realtimePrice) { minP = Math.min(minP, realtimePrice); maxP = Math.max(maxP, realtimePrice); }
  minP = Math.min(minP, support); maxP = Math.max(maxP, resistance);
  const pr = maxP - minP || 0.0001;
  const pp = pr * 0.05;
  minP -= pp; maxP += pp;
  const totalRange = maxP - minP;

  // Helpers
  const yOf = (price: number) => PRICE_TOP + PRICE_H * (1 - (price - minP) / totalRange);
  const xOf = (i: number) => CHART_X1 + (i + 0.5) * (CHART_W / data.length);
  const cw = CHART_W / data.length;
  const bodyW = Math.max(3, Math.min(14, cw * 0.8));

  // Identify last day
  const lastDayStr = dayKey(data[data.length - 1].time);
  const firstLastDayIdx = data.findIndex(c => dayKey(c.time) === lastDayStr);

  const parts: string[] = [];

  // Background gradient
  parts.push(`<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${BG1}"/><stop offset="100%" stop-color="${BG2}"/></linearGradient></defs>`);
  parts.push(`<rect width="${W}" height="${H}" fill="url(#bg)" rx="8"/>`);

  // Title
  if (title) {
    parts.push(`<text x="${CHART_X1}" y="25" fill="${TEXT_COL}" font-family="sans-serif" font-size="13" font-weight="bold">${title}</text>`);
  }

  // Horizontal grid + price labels (LEFT)
  for (let i = 0; i <= 8; i++) {
    const price = minP + (totalRange * i) / 8;
    const y = yOf(price);
    parts.push(`<line x1="${CHART_X1}" y1="${y}" x2="${CHART_X2}" y2="${y}" stroke="${GRID}" stroke-width="0.5" stroke-dasharray="4,4" shape-rendering="crispEdges"/>`);
    parts.push(`<text x="${CHART_X1 - 5}" y="${y + 3}" fill="${TEXT_COL}" text-anchor="end" font-size="9" font-family="monospace">${fmtPrice(price, jpy)}</text>`);
  }

  // Day separators + labels
  let prevDay = '';
  for (let i = 0; i < data.length; i++) {
    const dk = dayKey(data[i].time);
    if (dk !== prevDay) {
      const x = CHART_X1 + i * cw;
      parts.push(`<line x1="${x}" y1="${PRICE_TOP}" x2="${x}" y2="${PRICE_BOTTOM}" stroke="${GRID}" stroke-width="0.5" stroke-dasharray="2,6" shape-rendering="crispEdges"/>`);
      const d = new Date(data[i].time);
      const label = `${DAY_NAMES[d.getDay()]} ${d.getDate()}`;
      parts.push(`<text x="${x + 4}" y="${H - PAD.bottom + 15}" fill="${TEXT_COL}" font-size="10" font-family="sans-serif">${label}</text>`);
      prevDay = dk;
    }
  }

  // Time labels (every ~3 hours)
  const timeInterval = Math.max(1, Math.floor(data.length / 12));
  for (let i = 0; i < data.length; i += timeInterval) {
    const x = xOf(i);
    const d = new Date(data[i].time);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    parts.push(`<text x="${x}" y="${H - PAD.bottom + 30}" fill="${TEXT_COL}" font-size="8" font-family="monospace" text-anchor="middle">${hh}:${mm}</text>`);
  }

  // Last day highlight background
  if (firstLastDayIdx >= 0) {
    const x1 = CHART_X1 + firstLastDayIdx * cw;
    parts.push(`<rect x="${x1}" y="${PRICE_TOP}" width="${CHART_X2 - x1}" height="${PRICE_H}" fill="rgba(34,197,94,0.03)"/>`);
  }

  // Candles + Volume
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

    let upC: string, dnC: string, wC: string;
    if (isLastDay) { upC = UP; dnC = DN; wC = isUp ? UP : DN; }
    else { upC = UP_DIM; dnC = DN_DIM; wC = WICK_DIM; }

    const fill = isUp ? upC : dnC;
    parts.push(`<line x1="${x}" y1="${wickTop}" x2="${x}" y2="${wickBot}" stroke="${wC}" stroke-width="1" shape-rendering="crispEdges"/>`);
    parts.push(`<rect x="${x - bodyW / 2}" y="${bodyTop}" width="${bodyW}" height="${bH}" fill="${fill}" rx="0.5" shape-rendering="crispEdges"/>`);

  }

  // EMA overlays
  const drawEmaLine = (emaData: TimeValue[] | undefined, color: string) => {
    if (!emaData?.length) return;
    const timeMap = new Map(emaData.map(e => [e.time, e.value]));
    const points: string[] = [];
    for (let i = 0; i < data.length; i++) {
      const val = timeMap.get(data[i].time);
      if (val !== undefined && val !== null) {
        points.push(`${xOf(i)},${yOf(val)}`);
      }
    }
    if (points.length > 1) {
      parts.push(`<polyline points="${points.join(' ')}" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.8"/>`);
    }
  };
  drawEmaLine(ema20Data, '#3b82f6');
  drawEmaLine(ema50Data, '#f59e0b');

  const srX1 = CHART_X1;
  const srX2 = CHART_X2;
  const lblW = 80, lblH = 18, fs = 10;

  if (showSR) {
    // Resistance
    const rY = yOf(resistance);
    parts.push(`<line x1="${srX1}" y1="${rY}" x2="${srX2}" y2="${rY}" stroke="${UP}" stroke-width="1.5" stroke-dasharray="8,4" shape-rendering="crispEdges"/>`);
    parts.push(`<rect x="${srX2 - lblW - 4}" y="${rY - lblH / 2}" width="${lblW}" height="${lblH}" rx="4" fill="rgba(34,197,94,0.15)" stroke="${UP}" stroke-width="0.8"/>`);
    parts.push(`<text x="${srX2 - lblW / 2 - 4}" y="${rY + fs / 3}" fill="${UP}" text-anchor="middle" font-size="${fs}" font-family="monospace" font-weight="bold">${fmtPrice(resistance, jpy)}</text>`);

    // Support
    const sY = yOf(support);
    parts.push(`<line x1="${srX1}" y1="${sY}" x2="${srX2}" y2="${sY}" stroke="${DN}" stroke-width="1.5" stroke-dasharray="8,4" shape-rendering="crispEdges"/>`);
    parts.push(`<rect x="${srX2 - lblW - 4}" y="${sY - lblH / 2}" width="${lblW}" height="${lblH}" rx="4" fill="rgba(239,68,68,0.15)" stroke="${DN}" stroke-width="0.8"/>`);
    parts.push(`<text x="${srX2 - lblW / 2 - 4}" y="${sY + fs / 3}" fill="${DN}" text-anchor="middle" font-size="${fs}" font-family="monospace" font-weight="bold">${fmtPrice(support, jpy)}</text>`);
  }

  // Realtime price
  if (realtimePrice) {
    const rtY = yOf(realtimePrice);
    const rtC = isConnected ? '#3b82f6' : '#6366f1';
    parts.push(`<line x1="${CHART_X1}" y1="${rtY}" x2="${srX2}" y2="${rtY}" stroke="${rtC}" stroke-width="1.5" stroke-dasharray="4,2" shape-rendering="crispEdges"/>`);
    const bw = 70;
    parts.push(`<rect x="${srX2 - bw - 4}" y="${rtY - lblH / 2}" width="${bw}" height="${lblH}" rx="4" fill="${rtC}"/>`);
    parts.push(`<text x="${srX2 - bw / 2 - 4}" y="${rtY + 3}" fill="#fff" text-anchor="middle" font-size="9" font-family="monospace" font-weight="bold">${isConnected ? '● ' : ''}${fmtPrice(realtimePrice, jpy)}</text>`);
  }

  // Border
  parts.push(`<rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="${GRID}" stroke-width="1" rx="8"/>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" shape-rendering="geometricPrecision">
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
  showSupportResistance = true,
  ema20Data,
  ema50Data,
}: CandlestickChartProps) {
  const jpy = isJpyPair(support, resistance);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; candle: CandleData; crosshairX: number; relY: number } | null>(null);

  // Chart layout constants (must match buildChartSvg)
  const SVG_W = 1200, SVG_H = 700;
  const CHART_X1 = 65, CHART_W = SVG_W - 110 - 65;
  const PRICE_BOTTOM_PX = SVG_H - 50, PAD_TOP = 35;

  // Price range for crosshair price label
  const priceRange = useMemo(() => {
    if (!data.length) return null;
    let minP = Infinity, maxP = -Infinity;
    for (const c of data) { if (c.low < minP) minP = c.low; if (c.high > maxP) maxP = c.high; }
    if (realtimePrice) { minP = Math.min(minP, realtimePrice); maxP = Math.max(maxP, realtimePrice); }
    minP = Math.min(minP, support); maxP = Math.max(maxP, resistance);
    const pr = maxP - minP || 0.0001;
    const pp = pr * 0.05;
    return { min: minP - pp, max: maxP + pp };
  }, [data, support, resistance, realtimePrice]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!data.length || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = SVG_W / rect.width;
    const scaleY = SVG_H / rect.height;
    const svgX = (e.clientX - rect.left) * scaleX;
    const svgY = (e.clientY - rect.top) * scaleY;
    if (svgX < CHART_X1 || svgX > CHART_X1 + CHART_W || svgY < PAD_TOP || svgY > PRICE_BOTTOM_PX) {
      setTooltip(null); return;
    }
    const cw = CHART_W / data.length;
    const idx = Math.floor((svgX - CHART_X1) / cw);
    if (idx < 0 || idx >= data.length) { setTooltip(null); return; }
    const candleCenterPx = (CHART_X1 + (idx + 0.5) * cw) / scaleX;
    setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, candle: data[idx], crosshairX: candleCenterPx, relY: e.clientY - rect.top });
  }, [data]);

  const handleMouseLeave = useCallback(() => setTooltip(null), []);

  const svgDataUri = useMemo(() => {
    if (!data.length) return null;
    const title = previousDayDate
      ? `30min · Última Semana | ${previousDayDate}`
      : '30min · Última Semana';
    const svg = buildChartSvg(data, support, resistance, realtimePrice ?? null, isRealtimeConnected, title, showSupportResistance, ema20Data, ema50Data);
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }, [data, support, resistance, realtimePrice, isRealtimeConnected, previousDayDate, showSupportResistance, ema20Data, ema50Data]);

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
      <div className="rounded-lg p-4 animate-pulse" style={{ background: '#050d1a' }}>
        <div className="h-52 rounded" style={{ background: 'rgba(6,182,212,0.05)' }} />
      </div>
    );
  }

  const tooltipCandle = tooltip?.candle;
  const isUp = tooltipCandle ? tooltipCandle.close >= tooltipCandle.open : false;

  return (
    <div
      className={cn(
        'rounded-lg transition-all duration-300 relative overflow-hidden',
        alertStyles ? `${alertStyles.borderColor} ${alertStyles.glowColor} border-2` : '',
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

      <div ref={containerRef} className="relative cursor-crosshair" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
        {svgDataUri ? (
          <img
            src={svgDataUri}
            alt="Gráfico de velas japonesas 30min - 7 días"
            className="w-full h-auto block rounded-lg"
            draggable={false}
          />
        ) : (
          <div className="h-52 rounded-lg flex items-center justify-center" style={{ background: '#050d1a' }}>
            <span className="text-sm" style={{ color: '#64748b' }}>Sin datos disponibles</span>
          </div>
        )}

        {/* Crosshair lines */}
        {tooltip && containerRef.current && (() => {
          const h = containerRef.current!.clientHeight;
          const w = containerRef.current!.clientWidth;
          const scaleY = SVG_H / h;
          const chartTopPx = PAD_TOP / scaleY;
          const chartBottomPx = PRICE_BOTTOM_PX / scaleY;
          // Price from Y position
          const svgY = tooltip.relY * scaleY;
          const priceAtY = priceRange
            ? priceRange.max - ((svgY - PAD_TOP) / (PRICE_BOTTOM_PX - PAD_TOP)) * (priceRange.max - priceRange.min)
            : null;
          const showPriceLabel = priceAtY !== null && svgY >= PAD_TOP && svgY <= PRICE_BOTTOM_PX;
          return (
            <>
              {/* Vertical line snapped to candle */}
              <div
                className="absolute top-0 pointer-events-none z-20"
                style={{
                  left: tooltip.crosshairX,
                  top: chartTopPx,
                  height: chartBottomPx - chartTopPx,
                  width: 1,
                  background: 'rgba(148,163,184,0.4)',
                  borderLeft: '1px dashed rgba(148,163,184,0.5)',
                }}
              />
              {/* Horizontal line */}
              <div
                className="absolute pointer-events-none z-20"
                style={{
                  left: CHART_X1 / (SVG_W / w),
                  top: tooltip.relY,
                  width: CHART_W / (SVG_W / w),
                  height: 1,
                  background: 'rgba(148,163,184,0.3)',
                  borderTop: '1px dashed rgba(148,163,184,0.4)',
                }}
              />
              {/* Price label on right edge */}
              {showPriceLabel && (
                <div
                  className="absolute pointer-events-none z-20 text-[10px] font-mono px-1.5 py-0.5 rounded-sm"
                  style={{
                    right: 2,
                    top: tooltip.relY - 9,
                    background: 'rgba(59,130,246,0.85)',
                    color: '#fff',
                  }}
                >
                  {fmtPrice(priceAtY!, jpy)}
                </div>
              )}
              {/* Time label on bottom */}
              <div
                className="absolute pointer-events-none z-20 text-[10px] font-mono px-1.5 py-0.5 rounded-sm"
                style={{
                  left: tooltip.crosshairX - 25,
                  bottom: 46,
                  background: 'rgba(51,65,85,0.9)',
                  color: '#94a3b8',
                }}
              >
                {new Date(tooltip.candle.time).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </>
          );
        })()}

        {/* OHLC Tooltip */}
        {tooltip && tooltipCandle && (
          <div
            className="absolute z-30 pointer-events-none transition-opacity duration-150"
            style={{
              left: tooltip.x > (containerRef.current?.clientWidth ?? 0) * 0.7 ? tooltip.x - 160 : tooltip.x + 16,
              top: Math.max(4, tooltip.y - 10),
            }}
          >
            <div
              className="rounded-lg px-3 py-2 text-xs font-mono shadow-xl backdrop-blur-sm"
              style={{ background: 'rgba(5,13,26,0.93)', border: '1px solid rgba(100,116,139,0.25)' }}
            >
              <div className="text-slate-400 mb-1.5 text-[10px] border-b border-white/5 pb-1">{fmtTimeLabel(tooltipCandle.time)}</div>
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
                <span className="text-slate-500">O</span>
                <span className="text-slate-200 text-right">{fmtPrice(tooltipCandle.open, jpy)}</span>
                <span className="text-slate-500">H</span>
                <span className="text-green-400 text-right">{fmtPrice(tooltipCandle.high, jpy)}</span>
                <span className="text-slate-500">L</span>
                <span className="text-red-400 text-right">{fmtPrice(tooltipCandle.low, jpy)}</span>
                <span className="text-slate-500">C</span>
                <span className={cn('text-right font-semibold', isUp ? 'text-green-400' : 'text-red-400')}>
                  {fmtPrice(tooltipCandle.close, jpy)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex justify-between text-xs flex-wrap gap-2 px-3 py-2 rounded-b-lg" style={{ background: '#0a1628' }}>
        <div className="flex items-center gap-4">
          {showSupportResistance && (
            <>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-0.5 border-t-2 border-dashed border-green-500" />
                <span className="text-green-400">Resistencia 24h</span>
                <span className="font-mono font-semibold text-green-300 bg-green-500/20 px-1.5 py-0.5 rounded text-xs">{fmtPrice(resistance, jpy)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-0.5 border-t-2 border-dashed border-red-500" />
                <span className="text-red-400">Soporte 24h</span>
                <span className="font-mono font-semibold text-red-300 bg-red-500/20 px-1.5 py-0.5 rounded text-xs">{fmtPrice(support, jpy)}</span>
              </div>
            </>
          )}
          {ema20Data && ema20Data.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-0.5 bg-blue-500" />
              <span className="text-blue-400">EMA 20</span>
            </div>
          )}
          {ema50Data && ema50Data.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-0.5 bg-amber-500" />
              <span className="text-amber-400">EMA 50</span>
            </div>
          )}
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
