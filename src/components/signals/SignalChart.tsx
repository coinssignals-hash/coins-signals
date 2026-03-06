import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Maximize2, X, TrendingUp, Clock, BarChart3, ChevronDown, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useForexChartData, type ChartInterval } from '@/hooks/useForexChartData';
import { Skeleton } from '@/components/ui/skeleton';
import { ZoomableChart } from './ZoomableChart';
import {
  type IndicatorType, type CandleData as IndCandleData,
  INDICATOR_LABELS, INDICATOR_COLORS,
  buildIndicatorOverlay, buildBollingerOverlay,
  calcRSI, calcMACD, calcStochastic, calcADX, calcBollinger,
} from './chartIndicators';

const TIMEFRAME_OPTIONS: { value: ChartInterval; label: string }[] = [
  { value: '5min', label: '5M' },
  { value: '15min', label: '15M' },
  { value: '1h', label: '1H' },
  { value: '4h', label: '4H' },
];

interface SignalLevels {
  entryPrice: number;
  takeProfit: number;
  takeProfit2?: number;
  stopLoss: number;
  signalDatetime: string; // ISO string of when signal was created
}

interface SignalChartProps {
  currencyPair: string;
  support?: number;
  resistance?: number;
  signalLevels?: SignalLevels;
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
  intervalLabel = '15min',
  signalLevels?: SignalLevels,
  showSignalLevels = false,
  activeIndicators: IndicatorType[] = [],
): string {
  // All indicators are overlays now — no sub-chart height needed
  const W = width, H = height;

  // Reserve extra space on the right for "next day" empty zone
  const NEXT_DAY_RATIO = 0.12;
  const PAD = compact
    ? { top: 18, right: 55, bottom: 50, left: 40 }
    : { top: 30, right: 100, bottom: 50, left: 60 };
  const CHART_X1 = PAD.left;
  const CHART_X2 = W - PAD.right;
  const CHART_W_FULL = CHART_X2 - CHART_X1;
  const NEXT_DAY_W = Math.round(CHART_W_FULL * NEXT_DAY_RATIO);
  const CHART_W = CHART_W_FULL - NEXT_DAY_W; // candle area
  const NEXT_DAY_X = CHART_X1 + CHART_W;
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
  if (showSignalLevels && signalLevels) {
    minP = Math.min(minP, signalLevels.stopLoss, signalLevels.entryPrice, signalLevels.takeProfit);
    maxP = Math.max(maxP, signalLevels.stopLoss, signalLevels.entryPrice, signalLevels.takeProfit);
    if (signalLevels.takeProfit2) {
      minP = Math.min(minP, signalLevels.takeProfit2);
      maxP = Math.max(maxP, signalLevels.takeProfit2);
    }
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
    <linearGradient id="upGradDim" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#00d4aa"/><stop offset="100%" stop-color="#00b488"/></linearGradient>
    <linearGradient id="dnGradDim" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ff4976"/><stop offset="100%" stop-color="#e0304e"/></linearGradient>
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

  // Horizontal grid + price labels (span full width including next day zone)
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

  // ── Next day empty zone ──
  {
    // Determine next day from last candle
    const lastCandle = data[data.length - 1];
    const lastDate = new Date(lastCandle.time);
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + 1);
    const nextDayName = DAY_NAMES[nextDate.getDay()];
    const nextDayNum = nextDate.getDate();

    // Background tint for next day zone
    parts.push(`<rect x="${NEXT_DAY_X}" y="${PRICE_TOP}" width="${NEXT_DAY_W}" height="${PRICE_H}" fill="rgba(15,25,45,0.5)"/>`);

    // Day separator line
    parts.push(`<line x1="${NEXT_DAY_X}" y1="${PRICE_TOP}" x2="${NEXT_DAY_X}" y2="${PRICE_BOTTOM}" stroke="${GRID_MAJOR}" stroke-width="0.8" stroke-dasharray="4,4" shape-rendering="crispEdges"/>`);

    // Day label
    const dayFs = compact ? 14 : 10;
    parts.push(`<text x="${NEXT_DAY_X + 4}" y="${H - PAD.bottom + 18}" fill="${TEXT_COL}" font-size="${dayFs}" font-family="sans-serif" font-weight="${compact ? 'bold' : 'normal'}" opacity="0.6">${nextDayName} ${nextDayNum}</text>`);

    // Hour gridlines inside next day zone
    const hoursToShow = [0, 4, 8, 12, 16, 20];
    const hourFs = compact ? 10 : 7;
    for (const h of hoursToShow) {
      const frac = h / 24;
      const hx = NEXT_DAY_X + frac * NEXT_DAY_W;
      // Vertical tick line
      parts.push(`<line x1="${hx}" y1="${PRICE_BOTTOM - 4}" x2="${hx}" y2="${PRICE_BOTTOM}" stroke="${GRID}" stroke-width="0.5" shape-rendering="crispEdges"/>`);
      // Hour label
      const hLabel = `${String(h).padStart(2, '0')}:00`;
      parts.push(`<text x="${hx}" y="${H - PAD.bottom + 38}" fill="${TEXT_COL}" font-size="${hourFs}" font-family="monospace" text-anchor="middle" opacity="0.5">${hLabel}</text>`);
    }
  }


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
      const wickCol = isUp ? '#00d4aa' : '#ff4976';
      parts.push(`<line x1="${x}" y1="${wickTop}" x2="${x}" y2="${bodyTop}" stroke="${wickCol}" stroke-width="${wickW}" stroke-linecap="round" opacity="0.85"/>`);
      parts.push(`<line x1="${x}" y1="${bodyBot}" x2="${x}" y2="${wickBot}" stroke="${wickCol}" stroke-width="${wickW}" stroke-linecap="round" opacity="0.85"/>`);
      parts.push(`<rect x="${x - bodyW / 2}" y="${bodyTop}" width="${bodyW}" height="${bH}" fill="${fill}" rx="1" opacity="0.9" shape-rendering="crispEdges"/>`);
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

  // ── Signal level zones (Entry→TP as green box, Entry→SL as red box) ──
  if (showSignalLevels && signalLevels) {
    const { entryPrice, takeProfit, takeProfit2, stopLoss, signalDatetime } = signalLevels;
    // Palette aligned with analysis theme: Teal for bullish, Rose for bearish
    const TP1_COL = '#00d4aa';   // teal — consistent with bullish palette
    const TP2_COL = '#34d399';   // emerald-lighter for extended TP
    const SL_COL = '#ff4976';    // rose — consistent with bearish palette
    const ENTRY_COL = '#38bdf8'; // cyan-blue for entry (neutral)
    const lblW = compact ? 105 : 88;
    const lblH = compact ? 22 : 18;
    const fs = compact ? 12 : 10;

    // Find x position of signal arrival
    const sigDate = new Date(signalDatetime);
    let sigIdx = -1;
    for (let i = 0; i < data.length; i++) {
      if (new Date(data[i].time) >= sigDate) { sigIdx = i; break; }
    }
    if (sigIdx === -1 && data.length > 0) sigIdx = data.length - 1;

    const sigX = sigIdx >= 0 ? xOf(sigIdx) : CHART_X1;
    const lineEndX = CHART_X2;
    const zoneWidth = lineEndX - sigX;

    const entryY = yOf(entryPrice);
    const tp1Y = yOf(takeProfit);
    const slY = yOf(stopLoss);

    // TP zone: teal filled rectangle from entry to TP1
    const tpBoxTop = Math.min(entryY, tp1Y);
    const tpBoxH = Math.abs(tp1Y - entryY);
    parts.push(`<rect x="${sigX}" y="${tpBoxTop}" width="${zoneWidth}" height="${tpBoxH}" fill="${TP1_COL}" opacity="0.14" rx="2"/>`);
    // Subtle inner border on TP zone
    parts.push(`<rect x="${sigX}" y="${tpBoxTop}" width="${zoneWidth}" height="${tpBoxH}" fill="none" stroke="${TP1_COL}" stroke-width="0.5" opacity="0.25" rx="2"/>`);

    // TP2 zone (lighter, extends beyond TP1)
    if (takeProfit2) {
      const tp2Y = yOf(takeProfit2);
      const tp2BoxTop = Math.min(tp1Y, tp2Y);
      const tp2BoxH = Math.abs(tp2Y - tp1Y);
      parts.push(`<rect x="${sigX}" y="${tp2BoxTop}" width="${zoneWidth}" height="${tp2BoxH}" fill="${TP2_COL}" opacity="0.09" rx="2"/>`);
      parts.push(`<rect x="${sigX}" y="${tp2BoxTop}" width="${zoneWidth}" height="${tp2BoxH}" fill="none" stroke="${TP2_COL}" stroke-width="0.4" opacity="0.2" rx="2"/>`);
    }

    // SL zone: rose filled rectangle from entry to SL
    const slBoxTop = Math.min(entryY, slY);
    const slBoxH = Math.abs(slY - entryY);
    parts.push(`<rect x="${sigX}" y="${slBoxTop}" width="${zoneWidth}" height="${slBoxH}" fill="${SL_COL}" opacity="0.12" rx="2"/>`);
    parts.push(`<rect x="${sigX}" y="${slBoxTop}" width="${zoneWidth}" height="${slBoxH}" fill="none" stroke="${SL_COL}" stroke-width="0.5" opacity="0.22" rx="2"/>`);

    // Vertical signal arrival line
    parts.push(`<line x1="${sigX}" y1="${PRICE_TOP}" x2="${sigX}" y2="${PRICE_BOTTOM}" stroke="${ENTRY_COL}" stroke-width="1.4" stroke-dasharray="6,3" opacity="0.55" shape-rendering="crispEdges"/>`);
    parts.push(`<text x="${sigX}" y="${PRICE_TOP - 5}" fill="${ENTRY_COL}" text-anchor="middle" font-size="${compact ? 11 : 9}" font-family="sans-serif" font-weight="bold" opacity="0.75">▼ SEÑAL</text>`);

    // Entry line + label
    parts.push(`<line x1="${sigX}" y1="${entryY}" x2="${lineEndX}" y2="${entryY}" stroke="${ENTRY_COL}" stroke-width="1.4" stroke-dasharray="8,4" opacity="0.85" shape-rendering="crispEdges"/>`);
    parts.push(`<rect x="${lineEndX - lblW - 4}" y="${entryY - lblH / 2}" width="${lblW}" height="${lblH}" rx="4" fill="${ENTRY_COL}" fill-opacity="0.2" stroke="${ENTRY_COL}" stroke-width="0.7"/>`);
    parts.push(`<text x="${lineEndX - lblW / 2 - 4}" y="${entryY + fs / 3}" fill="#fff" text-anchor="middle" font-size="${fs}" font-family="monospace" font-weight="bold">ENTRY ${fmtPrice(entryPrice, jpy)}</text>`);

    // TP1 line + label
    parts.push(`<line x1="${sigX}" y1="${tp1Y}" x2="${lineEndX}" y2="${tp1Y}" stroke="${TP1_COL}" stroke-width="1.4" stroke-dasharray="10,5" opacity="0.9" shape-rendering="crispEdges"/>`);
    parts.push(`<rect x="${lineEndX - lblW - 4}" y="${tp1Y - lblH / 2}" width="${lblW}" height="${lblH}" rx="4" fill="${TP1_COL}" fill-opacity="0.2" stroke="${TP1_COL}" stroke-width="0.7"/>`);
    parts.push(`<text x="${lineEndX - lblW / 2 - 4}" y="${tp1Y + fs / 3}" fill="#fff" text-anchor="middle" font-size="${fs}" font-family="monospace" font-weight="bold">TP1 ${fmtPrice(takeProfit, jpy)}</text>`);

    // TP2 line + label
    if (takeProfit2) {
      const tp2Y = yOf(takeProfit2);
      parts.push(`<line x1="${sigX}" y1="${tp2Y}" x2="${lineEndX}" y2="${tp2Y}" stroke="${TP2_COL}" stroke-width="1.2" stroke-dasharray="10,5" opacity="0.75" shape-rendering="crispEdges"/>`);
      parts.push(`<rect x="${lineEndX - lblW - 4}" y="${tp2Y - lblH / 2}" width="${lblW}" height="${lblH}" rx="4" fill="${TP2_COL}" fill-opacity="0.18" stroke="${TP2_COL}" stroke-width="0.6"/>`);
      parts.push(`<text x="${lineEndX - lblW / 2 - 4}" y="${tp2Y + fs / 3}" fill="#fff" text-anchor="middle" font-size="${fs}" font-family="monospace" font-weight="bold">TP2 ${fmtPrice(takeProfit2, jpy)}</text>`);
    }

    // SL line + label
    parts.push(`<line x1="${sigX}" y1="${slY}" x2="${lineEndX}" y2="${slY}" stroke="${SL_COL}" stroke-width="1.4" stroke-dasharray="6,4" opacity="0.9" shape-rendering="crispEdges"/>`);
    parts.push(`<rect x="${lineEndX - lblW - 4}" y="${slY - lblH / 2}" width="${lblW}" height="${lblH}" rx="4" fill="${SL_COL}" fill-opacity="0.2" stroke="${SL_COL}" stroke-width="0.7"/>`);
    parts.push(`<text x="${lineEndX - lblW / 2 - 4}" y="${slY + fs / 3}" fill="#fff" text-anchor="middle" font-size="${fs}" font-family="monospace" font-weight="bold">SL ${fmtPrice(stopLoss, jpy)}</text>`);
  }

  // ── Bollinger overlay (drawn on price chart) ──
  if (activeIndicators.includes('bollinger')) {
    const yOfPrice = (price: number) => PRICE_TOP + PRICE_H * (1 - (price - minP) / totalRange);
    parts.push(buildBollingerOverlay(data as IndCandleData[], xOf, yOfPrice));
  }

  // ── Overlay indicator panels (RSI, MACD, Stochastic, ADX) ──
  const overlayIndicators = activeIndicators.filter(i => i !== 'bollinger');
  for (let si = 0; si < overlayIndicators.length; si++) {
    parts.push(buildIndicatorOverlay(overlayIndicators[si], data as IndCandleData[], si, overlayIndicators.length, {
      chartX1: CHART_X1,
      chartX2: CHART_X2,
      priceTop: PRICE_TOP,
      priceBottom: PRICE_BOTTOM,
      xOf,
    }));
  }

  // Title
  parts.push(`<text x="${CHART_X1}" y="20" fill="${TEXT_COL}" font-family="sans-serif" font-size="11" font-weight="bold">${intervalLabel}</text>`);

  // Border
  parts.push(`<rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="${GRID}" stroke-width="1" rx="6"/>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" shape-rendering="geometricPrecision">${parts.join('\n')}</svg>`;
}

/* ═══════════════════════════════════════════
 *  SignalChart Component
 * ═══════════════════════════════════════════ */
export function SignalChart({ currencyPair, support: propSupport, resistance: propResistance, signalLevels, className }: SignalChartProps) {
  const symbol = currencyPair.replace('/', '');
  const [activeInterval, setActiveInterval] = useState<ChartInterval>('15min');
  const { data: chartData, loading, error } = useForexChartData(symbol, activeInterval);
  const showSR = true;
  const [fullscreen, setFullscreen] = useState(false);
  const [fsSR, setFsSR] = useState(true);
  const [fsSignalLines, setFsSignalLines] = useState(false);
  const [showTfMenu, setShowTfMenu] = useState(false);
  const [fsIndicators, setFsIndicators] = useState<Set<IndicatorType>>(new Set());
  const [showIndMenu, setShowIndMenu] = useState(false);
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
  const intervalLabel = TIMEFRAME_OPTIONS.find(t => t.value === activeInterval)?.label ?? '15M';
  const inlineSvgUri = useMemo(() => {
    if (!candles.length) return null;
    const svg = buildSignalChartSvg(candles, support, resistance, showSR, 1200, 600, false, intervalLabel, signalLevels, false);
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }, [candles, support, resistance, showSR, intervalLabel, signalLevels]);

  const activeIndArray = useMemo(() => Array.from(fsIndicators), [fsIndicators]);

  // Compute current indicator values for badges
  const indicatorValues = useMemo(() => {
    if (!candles.length) return {} as Record<IndicatorType, string>;
    const d = candles as IndCandleData[];
    const vals: Partial<Record<IndicatorType, string>> = {};
    const rsi = calcRSI(d);
    const lastRsi = [...rsi].reverse().find(v => v !== null);
    if (lastRsi != null) vals.rsi = lastRsi.toFixed(1);

    const macd = calcMACD(d);
    const lastMacd = [...macd].reverse().find(m => m.macd !== null);
    if (lastMacd?.macd != null) vals.macd = lastMacd.macd.toFixed(4);

    const stoch = calcStochastic(d);
    const lastK = [...stoch].reverse().find(s => s.k !== null);
    if (lastK?.k != null) vals.stochastic = lastK.k.toFixed(1);

    const adx = calcADX(d);
    const lastAdx = [...adx].reverse().find(a => a.adx !== null);
    if (lastAdx?.adx != null) vals.adx = lastAdx.adx.toFixed(1);

    const bb = calcBollinger(d);
    const lastBb = [...bb].reverse().find(b => b.middle !== null);
    if (lastBb?.middle != null) vals.bollinger = lastBb.middle.toFixed(4);

    return vals as Record<IndicatorType, string>;
  }, [candles]);

  // Fullscreen SVG — generate landscape (2340x1080) always
  const fullscreenSvgUri = useMemo(() => {
    if (!candles.length || !fullscreen) return null;
    const fsW = isPortrait ? viewportSize.h : viewportSize.w;
    const fsH = isPortrait ? viewportSize.w : viewportSize.h;
    const scale = Math.max(1, Math.ceil(2340 / fsW));
    const svg = buildSignalChartSvg(candles, support, resistance, fsSR, fsW * scale, fsH * scale, true, intervalLabel, signalLevels, fsSignalLines, activeIndArray);
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }, [candles, support, resistance, fsSR, fullscreen, isPortrait, viewportSize, intervalLabel, signalLevels, fsSignalLines, activeIndArray]);

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

              {/* Top-left: Signal levels toggle + Indicators dropdown */}
              <div className="absolute top-2 left-2 z-[10001] flex items-center gap-2">
                <button
                  onClick={() => setFsSignalLines(prev => !prev)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg active:scale-95 transition-all"
                  style={{
                    background: fsSignalLines ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.08)',
                    border: `1px solid ${fsSignalLines ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.2)'}`,
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <BarChart3 className="w-3.5 h-3.5" style={{ color: fsSignalLines ? '#38bdf8' : 'rgba(255,255,255,0.6)' }} />
                  <span className="text-[10px] font-semibold tracking-wide" style={{ color: fsSignalLines ? '#38bdf8' : 'rgba(255,255,255,0.5)' }}>
                    SEÑAL
                  </span>
                </button>

                {/* Indicators dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowIndMenu(prev => !prev)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg active:scale-95 transition-all"
                    style={{
                      background: fsIndicators.size > 0 ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.08)',
                      border: `1px solid ${fsIndicators.size > 0 ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.2)'}`,
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <Activity className="w-3.5 h-3.5" style={{ color: fsIndicators.size > 0 ? '#a78bfa' : 'rgba(255,255,255,0.6)' }} />
                    <span className="text-[10px] font-semibold tracking-wide" style={{ color: fsIndicators.size > 0 ? '#a78bfa' : 'rgba(255,255,255,0.5)' }}>
                      IND
                    </span>
                    <ChevronDown className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.4)' }} />
                  </button>

                  {showIndMenu && (
                    <div
                      className="absolute top-full left-0 mt-1 flex flex-col gap-0.5 rounded-lg overflow-hidden"
                      style={{
                        background: 'rgba(6,14,28,0.95)',
                        border: '1px solid rgba(167,139,250,0.25)',
                        backdropFilter: 'blur(12px)',
                        minWidth: '150px',
                      }}
                    >
                      {(['rsi', 'macd', 'bollinger', 'stochastic', 'adx'] as IndicatorType[]).map(ind => {
                        const active = fsIndicators.has(ind);
                        const col = INDICATOR_COLORS[ind];
                        const val = indicatorValues[ind];
                        return (
                          <button
                            key={ind}
                            onClick={() => {
                              setFsIndicators(prev => {
                                const next = new Set(prev);
                                next.has(ind) ? next.delete(ind) : next.add(ind);
                                return next;
                              });
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-left transition-colors"
                            style={{
                              background: active ? `${col}15` : 'transparent',
                            }}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                              style={{ background: active ? col : 'rgba(255,255,255,0.15)', border: `1px solid ${active ? col : 'rgba(255,255,255,0.2)'}` }}
                            />
                            <span className="text-[11px] font-semibold flex-1" style={{ color: active ? col : 'rgba(255,255,255,0.6)' }}>
                              {INDICATOR_LABELS[ind]}
                            </span>
                            {val && (
                              <span className="text-[9px] font-mono" style={{ color: active ? col : 'rgba(255,255,255,0.4)' }}>
                                {val}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Active indicator value badges */}
                {fsIndicators.size > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {Array.from(fsIndicators).map(ind => {
                      const col = INDICATOR_COLORS[ind];
                      const val = indicatorValues[ind];
                      return (
                        <span
                          key={ind}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold"
                          style={{
                            background: `${col}20`,
                            border: `1px solid ${col}40`,
                            color: col,
                            backdropFilter: 'blur(6px)',
                          }}
                        >
                          {INDICATOR_LABELS[ind]}
                          {val && <span style={{ opacity: 0.9 }}>{val}</span>}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

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

                {/* Timeframe selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowTfMenu(prev => !prev)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg active:scale-95 transition-all"
                    style={{
                      background: 'rgba(56,189,248,0.12)',
                      border: '1px solid rgba(56,189,248,0.3)',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <Clock className="w-3.5 h-3.5" style={{ color: 'rgba(56,189,248,0.9)' }} />
                    <span className="text-[10px] font-bold tracking-wide" style={{ color: 'rgba(56,189,248,0.9)' }}>
                      {TIMEFRAME_OPTIONS.find(t => t.value === activeInterval)?.label ?? '15M'}
                    </span>
                  </button>

                  {showTfMenu && (
                    <div
                      className="absolute top-full right-0 mt-1 flex flex-col gap-0.5 rounded-lg overflow-hidden"
                      style={{
                        background: 'rgba(6,14,28,0.95)',
                        border: '1px solid rgba(56,189,248,0.25)',
                        backdropFilter: 'blur(12px)',
                        minWidth: '64px',
                      }}
                    >
                      {TIMEFRAME_OPTIONS.map(tf => (
                        <button
                          key={tf.value}
                          onClick={() => {
                            setActiveInterval(tf.value);
                            setShowTfMenu(false);
                          }}
                          className="px-3 py-1.5 text-[11px] font-semibold tracking-wide transition-colors text-left"
                          style={{
                            color: activeInterval === tf.value ? '#38bdf8' : 'rgba(255,255,255,0.6)',
                            background: activeInterval === tf.value ? 'rgba(56,189,248,0.12)' : 'transparent',
                          }}
                        >
                          {tf.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

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
