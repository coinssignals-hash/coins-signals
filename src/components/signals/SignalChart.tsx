import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Maximize2, X, TrendingUp, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useForexChartData } from '@/hooks/useForexChartData';
import { Skeleton } from '@/components/ui/skeleton';
import { ZoomableChart } from './ZoomableChart';

interface SignalChartProps {
  currencyPair: string;
  support?: number;
  resistance?: number;
  className?: string;
}

/* ─── helpers ─── */
function isJpyPair(s: number, r: number) { return s > 10 || r > 10; }
function fmtPrice(n: number, jpy: boolean) { return jpy ? n.toFixed(3) : n.toFixed(5); }

function dayKey(ts: string): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

/* ═══════════════════════════════════════════════════════
 *  Build SVG chart — matches reference image style
 * ═══════════════════════════════════════════════════════ */
function buildSignalChartSvg(
  data: CandleData[],
  support: number,
  resistance: number,
  showSR: boolean,
  width: number,
  height: number,
  compact = false,
): string {
  const W = width, H = height;
  const PAD = compact
    ? { top: 18, right: 55, bottom: 50, left: 40 }
    : { top: 30, right: 100, bottom: 50, left: 60 };
  const CHART_X1 = PAD.left;
  const CHART_X2 = W - PAD.right;
  const CHART_W = CHART_X2 - CHART_X1;
  const PRICE_TOP = PAD.top;
  const PRICE_BOTTOM = H - PAD.bottom;
  const PRICE_H = PRICE_BOTTOM - PRICE_TOP;

  // Colors
  const BG1 = '#060e1c';
  const BG2 = '#0b1729';
  const GRID = '#152a47';
  const GRID_MAJOR = '#1c3560';
  const TEXT_COL = '#5a6f8a';
  const UP = '#00e6b4';
  const DN = '#ff5080';

  if (data.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
      <rect width="${W}" height="${H}" fill="${BG1}"/>
      <text x="${W / 2}" y="${H / 2}" fill="${TEXT_COL}" text-anchor="middle" font-size="14" font-family="sans-serif">Sin datos</text>
    </svg>`;
  }

  const jpy = isJpyPair(support, resistance);

  // Price range
  let minP = Infinity, maxP = -Infinity;
  for (const c of data) { if (c.low < minP) minP = c.low; if (c.high > maxP) maxP = c.high; }
  if (showSR) {
    minP = Math.min(minP, support);
    maxP = Math.max(maxP, resistance);
  }
  const pr = maxP - minP || 0.0001;
  const pp = pr * 0.05;
  minP -= pp; maxP += pp;
  const totalRange = maxP - minP;

  const yOf = (price: number) => PRICE_TOP + PRICE_H * (1 - (price - minP) / totalRange);
  const xOf = (i: number) => CHART_X1 + (i + 0.5) * (CHART_W / data.length);
  const cw = CHART_W / data.length;
  const bodyW = Math.max(3, Math.min(18, cw * 0.78));

  const today = todayKey();
  const firstTodayIdx = data.findIndex(c => dayKey(c.time) === today);

  const parts: string[] = [];

  // Defs
  parts.push(`<defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${BG1}"/><stop offset="100%" stop-color="${BG2}"/></linearGradient>
    <linearGradient id="upGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#00f0c0"/><stop offset="100%" stop-color="#00b488"/></linearGradient>
    <linearGradient id="dnGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ff6b8a"/><stop offset="100%" stop-color="#e0304e"/></linearGradient>
    <linearGradient id="upGradDim" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(0,230,180,0.45)"/><stop offset="100%" stop-color="rgba(0,180,136,0.28)"/></linearGradient>
    <linearGradient id="dnGradDim" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(255,80,128,0.45)"/><stop offset="100%" stop-color="rgba(224,48,78,0.28)"/></linearGradient>
    <filter id="upGlow"><feDropShadow dx="0" dy="0" stdDeviation="2" flood-color="${UP}" flood-opacity="0.4"/></filter>
    <filter id="dnGlow"><feDropShadow dx="0" dy="0" stdDeviation="2" flood-color="${DN}" flood-opacity="0.4"/></filter>
    <linearGradient id="todayBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(56,189,248,0.08)"/><stop offset="100%" stop-color="rgba(56,189,248,0.02)"/></linearGradient>
  </defs>`);
  parts.push(`<rect width="${W}" height="${H}" fill="url(#bg)" rx="6"/>`);

  // Today highlight
  if (firstTodayIdx >= 0) {
    const x1 = CHART_X1 + firstTodayIdx * cw;
    const w = CHART_X2 - x1;
    parts.push(`<rect x="${x1}" y="${PRICE_TOP}" width="${w}" height="${PRICE_H}" fill="url(#todayBg)"/>`);
    // Border lines
    parts.push(`<line x1="${x1}" y1="${PRICE_TOP}" x2="${x1}" y2="${PRICE_BOTTOM}" stroke="rgba(56,189,248,0.2)" stroke-width="1" stroke-dasharray="4,4" shape-rendering="crispEdges"/>`);
    // "HOY" label
    const midX = x1 + w / 2;
    parts.push(`<text x="${midX}" y="${PRICE_TOP + 16}" fill="rgba(56,189,248,0.4)" text-anchor="middle" font-size="11" font-family="sans-serif" font-weight="bold" letter-spacing="3">HOY</text>`);
  }

  // Horizontal grid + price labels
  for (let i = 0; i <= 8; i++) {
    const price = minP + (totalRange * i) / 8;
    const y = yOf(price);
    const isMajor = i % 2 === 0;
    parts.push(`<line x1="${CHART_X1}" y1="${y}" x2="${CHART_X2}" y2="${y}" stroke="${isMajor ? GRID_MAJOR : GRID}" stroke-width="${isMajor ? '0.6' : '0.3'}" stroke-dasharray="${isMajor ? '6,4' : '2,6'}" shape-rendering="crispEdges"/>`);
    parts.push(`<text x="${CHART_X1 - 5}" y="${y + 3}" fill="${TEXT_COL}" text-anchor="end" font-size="9" font-family="monospace" opacity="${isMajor ? '0.9' : '0.6'}">${fmtPrice(price, jpy)}</text>`);
  }

  // Day separators
  let prevDay = '';
  for (let i = 0; i < data.length; i++) {
    const dk = dayKey(data[i].time);
    if (dk !== prevDay) {
      const x = CHART_X1 + i * cw;
      parts.push(`<line x1="${x}" y1="${PRICE_TOP}" x2="${x}" y2="${PRICE_BOTTOM}" stroke="${GRID}" stroke-width="0.5" stroke-dasharray="2,6" shape-rendering="crispEdges"/>`);
      const d = new Date(data[i].time);
      const label = `${DAY_NAMES[d.getDay()]} ${d.getDate()}`;
      const dayFs = compact ? 14 : 10;
      parts.push(`<text x="${x + 4}" y="${H - PAD.bottom + 18}" fill="${TEXT_COL}" font-size="${dayFs}" font-family="sans-serif" font-weight="${compact ? 'bold' : 'normal'}">${label}</text>`);
      prevDay = dk;
    }
  }

  // Time labels
  const timeInterval = Math.max(1, Math.floor(data.length / 14));
  for (let i = 0; i < data.length; i += timeInterval) {
    const x = xOf(i);
    const d = new Date(data[i].time);
    const dd = String(d.getDate()).padStart(2, '0');
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const timeFs = compact ? 11 : 7;
    parts.push(`<text x="${x}" y="${H - PAD.bottom + 38}" fill="${TEXT_COL}" font-size="${timeFs}" font-family="monospace" text-anchor="middle">${dd}/${mo} ${hh}:${mm}</text>`);
  }

  // Candles
  for (let i = 0; i < data.length; i++) {
    const c = data[i];
    const x = xOf(i);
    const isToday = dayKey(c.time) === today;
    const isUp = c.close >= c.open;

    const bodyTop = yOf(Math.max(c.open, c.close));
    const bodyBot = yOf(Math.min(c.open, c.close));
    const bH = Math.max(1.5, bodyBot - bodyTop);
    const wickTop = yOf(c.high);
    const wickBot = yOf(c.low);
    const wickW = isToday ? 1.5 : 1;

    if (isToday) {
      const grad = isUp ? 'url(#upGrad)' : 'url(#dnGrad)';
      const wickCol = isUp ? '#00e6b4' : '#ff5080';
      const glow = isUp ? 'url(#upGlow)' : 'url(#dnGlow)';
      parts.push(`<line x1="${x}" y1="${wickTop}" x2="${x}" y2="${bodyTop}" stroke="${wickCol}" stroke-width="${wickW}" stroke-linecap="round"/>`);
      parts.push(`<line x1="${x}" y1="${bodyBot}" x2="${x}" y2="${wickBot}" stroke="${wickCol}" stroke-width="${wickW}" stroke-linecap="round"/>`);
      parts.push(`<rect x="${x - bodyW / 2}" y="${bodyTop}" width="${bodyW}" height="${bH}" fill="${grad}" rx="1" filter="${glow}" shape-rendering="crispEdges"/>`);
    } else {
      const fill = isUp ? 'url(#upGradDim)' : 'url(#dnGradDim)';
      const wickCol = isUp ? '#00e6b4' : '#ff5080';
      parts.push(`<line x1="${x}" y1="${wickTop}" x2="${x}" y2="${bodyTop}" stroke="${wickCol}" stroke-width="${wickW}" stroke-linecap="round" opacity="0.45"/>`);
      parts.push(`<line x1="${x}" y1="${bodyBot}" x2="${x}" y2="${wickBot}" stroke="${wickCol}" stroke-width="${wickW}" stroke-linecap="round" opacity="0.45"/>`);
      parts.push(`<rect x="${x - bodyW / 2}" y="${bodyTop}" width="${bodyW}" height="${bH}" fill="${fill}" rx="1" shape-rendering="crispEdges"/>`);
    }
  }

  // S/R lines
  if (showSR) {
    const lblW = 80, lblH = 18, fs = 10;
    // Resistance (green)
    const rY = yOf(resistance);
    parts.push(`<rect x="${CHART_X1}" y="${rY - 8}" width="${CHART_W}" height="16" fill="rgba(0,230,180,0.04)"/>`);
    parts.push(`<line x1="${CHART_X1}" y1="${rY}" x2="${CHART_X2}" y2="${rY}" stroke="${UP}" stroke-width="1.2" stroke-dasharray="10,5" opacity="0.85" shape-rendering="crispEdges"/>`);
    parts.push(`<rect x="${CHART_X2 - lblW - 4}" y="${rY - lblH / 2}" width="${lblW}" height="${lblH}" rx="4" fill="rgba(0,212,170,0.15)" stroke="${UP}" stroke-width="0.6"/>`);
    parts.push(`<text x="${CHART_X2 - lblW / 2 - 4}" y="${rY + fs / 3}" fill="${UP}" text-anchor="middle" font-size="${fs}" font-family="monospace" font-weight="bold">R ${fmtPrice(resistance, jpy)}</text>`);

    // Support (red)
    const sY = yOf(support);
    parts.push(`<rect x="${CHART_X1}" y="${sY - 8}" width="${CHART_W}" height="16" fill="rgba(255,80,128,0.04)"/>`);
    parts.push(`<line x1="${CHART_X1}" y1="${sY}" x2="${CHART_X2}" y2="${sY}" stroke="${DN}" stroke-width="1.2" stroke-dasharray="10,5" opacity="0.85" shape-rendering="crispEdges"/>`);
    parts.push(`<rect x="${CHART_X2 - lblW - 4}" y="${sY - lblH / 2}" width="${lblW}" height="${lblH}" rx="4" fill="rgba(255,73,118,0.15)" stroke="${DN}" stroke-width="0.6"/>`);
    parts.push(`<text x="${CHART_X2 - lblW / 2 - 4}" y="${sY + fs / 3}" fill="${DN}" text-anchor="middle" font-size="${fs}" font-family="monospace" font-weight="bold">S ${fmtPrice(support, jpy)}</text>`);
  }

  // Title
  parts.push(`<text x="${CHART_X1}" y="20" fill="${TEXT_COL}" font-family="sans-serif" font-size="11" font-weight="bold">15min · 7 días</text>`);

  // Border
  parts.push(`<rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="${GRID}" stroke-width="1" rx="6"/>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" shape-rendering="geometricPrecision">${parts.join('\n')}</svg>`;
}

/* ═══════════════════════════════════════════
 *  SignalChart Component
 * ═══════════════════════════════════════════ */
export function SignalChart({ currencyPair, support: propSupport, resistance: propResistance, className }: SignalChartProps) {
  const symbol = currencyPair.replace('/', '');
  const { data: chartData, loading, error } = useForexChartData(symbol, '15min');
  const showSR = true; // Always show S/R lines in inline
  const [fullscreen, setFullscreen] = useState(false);
  const [fsSR, setFsSR] = useState(true); // S/R toggle for fullscreen
  const fsRef = useRef<HTMLDivElement>(null);
  const getVpSize = () => ({
    w: Math.max(window.innerWidth, document.documentElement.clientWidth),
    h: Math.max(window.innerHeight, document.documentElement.clientHeight),
  });
  const [viewportSize, setViewportSize] = useState(getVpSize);

  // Track viewport size for fullscreen rotation
  useEffect(() => {
    const onResize = () => setViewportSize(getVpSize());
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  const support = propSupport ?? chartData?.support ?? 0;
  const resistance = propResistance ?? chartData?.resistance ?? 0;
  const candles = chartData?.candles ?? [];
  const jpy = isJpyPair(support, resistance);

  const isPortrait = viewportSize.h > viewportSize.w;

  // Inline SVG (compact)
  const inlineSvgUri = useMemo(() => {
    if (!candles.length) return null;
    const svg = buildSignalChartSvg(candles, support, resistance, showSR, 1200, 600);
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }, [candles, support, resistance, showSR]);

  // Fullscreen SVG — generate landscape (2340x1080) always
  const fullscreenSvgUri = useMemo(() => {
    if (!candles.length || !fullscreen) return null;
    const fsW = isPortrait ? viewportSize.h : viewportSize.w;
    const fsH = isPortrait ? viewportSize.w : viewportSize.h;
    const scale = Math.max(1, Math.ceil(2340 / fsW));
    const svg = buildSignalChartSvg(candles, support, resistance, fsSR, fsW * scale, fsH * scale, true);
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }, [candles, support, resistance, fsSR, fullscreen, isPortrait, viewportSize]);

  // Lock body scroll in fullscreen + recalculate viewport
  useEffect(() => {
    if (fullscreen) {
      document.body.style.overflow = 'hidden';
      // Recalculate after a tick to ensure accurate measurements
      requestAnimationFrame(() => setViewportSize(getVpSize()));
      return () => { document.body.style.overflow = ''; };
    }
  }, [fullscreen]);

  if (loading) {
    return (
      <div className={cn("mx-1.5 mb-3", className)}>
        <Skeleton className="h-[180px] w-full rounded-lg" style={{ background: 'hsl(210, 60%, 8%)' }} />
      </div>
    );
  }

  if (error || !candles.length) {
    return null; // Silently hide if no data
  }

  return (
    <>
      {/* Inline chart */}
      <div className={cn("mx-0 sm:mx-1.5 mb-3", className)}>
        <div
          className="relative rounded-none sm:rounded-lg overflow-hidden"
          style={{ background: '#060e1c' }}
        >
          {/* Fullscreen button */}
          <button
            onClick={() => setFullscreen(true)}
            className="absolute top-2 right-2 z-10 p-1.5 rounded-md transition-colors active:scale-95"
            style={{ background: 'rgba(6,14,28,0.8)', border: '1px solid rgba(100,116,139,0.3)' }}
            title="Pantalla completa"
          >
            <Maximize2 className="w-4 h-4 text-cyan-300/70" />
          </button>

          {/* Chart image */}
          {inlineSvgUri && (
            <img
              src={inlineSvgUri}
              alt={`Gráfico ${currencyPair} 15min`}
              className="w-full h-auto block"
              draggable={false}
            />
          )}

        </div>
      </div>

      {/* Fullscreen overlay — landscape orientation */}
      {fullscreen && (
        <div
          ref={fsRef}
          className="fixed z-[9999]"
          style={{
            top: 0, left: 0,
            width: `${viewportSize.w}px`,
            height: `${viewportSize.h}px`,
            background: '#000',
            margin: 0, padding: 0,
            overflow: 'hidden',
          }}
          onClick={(e) => { if (e.target === fsRef.current) setFullscreen(false); }}
        >
          {/* Rotated container for portrait → landscape */}
          <div
            style={isPortrait ? {
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${viewportSize.h}px`,
              height: `${viewportSize.w}px`,
              transformOrigin: 'top left',
              transform: `translateX(${viewportSize.w}px) rotate(90deg)`,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            } : {
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Chart area — fills all space */}
            <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
              {fullscreenSvgUri && (
                <ZoomableChart className="absolute inset-0 w-full h-full">
                  <img
                    src={fullscreenSvgUri}
                    alt={`Gráfico ${currencyPair} 15min`}
                    style={{
                      width: '100%', height: '100%',
                      objectFit: 'fill',
                      display: 'block',
                    }}
                    draggable={false}
                  />
                </ZoomableChart>
              )}

              {/* Top-right controls: S/R toggle + config + close */}
              <div className="absolute top-2 right-2 z-[10001] flex items-center gap-2">
                {/* S/R toggle */}
                <button
                  onClick={() => setFsSR(prev => !prev)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg active:scale-95 transition-all"
                  style={{
                    background: fsSR ? 'rgba(0,230,180,0.15)' : 'rgba(255,255,255,0.08)',
                    border: `1px solid ${fsSR ? 'rgba(0,230,180,0.4)' : 'rgba(255,255,255,0.2)'}`,
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <TrendingUp className="w-3.5 h-3.5" style={{ color: fsSR ? '#00e6b4' : 'rgba(255,255,255,0.5)' }} />
                  <span className="text-[10px] font-semibold tracking-wide" style={{ color: fsSR ? '#00e6b4' : 'rgba(255,255,255,0.5)' }}>
                    S/R
                  </span>
                </button>

                {/* Config button (placeholder) */}
                <button
                  className="p-2 rounded-lg active:scale-95 transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <Settings2 className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.6)' }} />
                </button>

                {/* Close button */}
                <button
                  onClick={() => setFullscreen(false)}
                  className="p-2 rounded-full active:scale-90"
                  style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.3)' }}
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
