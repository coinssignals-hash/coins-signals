/* ─── Technical Indicator Calculations for SignalChart SVG ─── */

export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

// ── RSI (Relative Strength Index) ──
export function calcRSI(data: CandleData[], period = 14): (number | null)[] {
  const closes = data.map(d => d.close);
  const result: (number | null)[] = [];
  if (closes.length < period + 1) return closes.map(() => null);

  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) avgGain += diff; else avgLoss += Math.abs(diff);
  }
  avgGain /= period;
  avgLoss /= period;

  for (let i = 0; i < period; i++) result.push(null);
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  result.push(100 - 100 / (1 + rs));

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    result.push(rsi);
  }
  return result;
}

// ── MACD ──
export interface MACDResult {
  macd: number | null;
  signal: number | null;
  histogram: number | null;
}

function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const result: number[] = [];
  let prev = values[0];
  result.push(prev);
  for (let i = 1; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    result.push(prev);
  }
  return result;
}

export function calcMACD(data: CandleData[], fast = 12, slow = 26, sig = 9): MACDResult[] {
  const closes = data.map(d => d.close);
  if (closes.length < slow) return closes.map(() => ({ macd: null, signal: null, histogram: null }));

  const emaFast = ema(closes, fast);
  const emaSlow = ema(closes, slow);
  const macdLine = emaFast.map((v, i) => v - emaSlow[i]);
  const signalLine = ema(macdLine, sig);

  return macdLine.map((m, i) => {
    if (i < slow - 1) return { macd: null, signal: null, histogram: null };
    const s = i < slow + sig - 2 ? null : signalLine[i];
    return { macd: m, signal: s, histogram: s !== null ? m - s : null };
  });
}

// ── Bollinger Bands ──
export interface BollingerResult {
  upper: number | null;
  middle: number | null;
  lower: number | null;
}

export function calcBollinger(data: CandleData[], period = 20, mult = 2): BollingerResult[] {
  const closes = data.map(d => d.close);
  return closes.map((_, i) => {
    if (i < period - 1) return { upper: null, middle: null, lower: null };
    const slice = closes.slice(i - period + 1, i + 1);
    const avg = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + (b - avg) ** 2, 0) / period;
    const stdDev = Math.sqrt(variance);
    return { upper: avg + mult * stdDev, middle: avg, lower: avg - mult * stdDev };
  });
}

// ── Stochastic Oscillator ──
export interface StochasticResult {
  k: number | null;
  d: number | null;
}

export function calcStochastic(data: CandleData[], kPeriod = 14, dPeriod = 3): StochasticResult[] {
  const result: StochasticResult[] = [];
  const kValues: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < kPeriod - 1) {
      result.push({ k: null, d: null });
      kValues.push(50);
      continue;
    }
    const slice = data.slice(i - kPeriod + 1, i + 1);
    const high = Math.max(...slice.map(d => d.high));
    const low = Math.min(...slice.map(d => d.low));
    const range = high - low || 0.0001;
    const k = ((data[i].close - low) / range) * 100;
    kValues.push(k);

    if (i < kPeriod - 1 + dPeriod - 1) {
      result.push({ k, d: null });
    } else {
      const dSlice = kValues.slice(kValues.length - dPeriod);
      const d = dSlice.reduce((a, b) => a + b, 0) / dPeriod;
      result.push({ k, d });
    }
  }
  return result;
}

// ── ADX (Average Directional Index) ──
export interface ADXResult {
  adx: number | null;
  plusDI: number | null;
  minusDI: number | null;
}

export function calcADX(data: CandleData[], period = 14): ADXResult[] {
  if (data.length < period + 1) return data.map(() => ({ adx: null, plusDI: null, minusDI: null }));

  const result: ADXResult[] = [{ adx: null, plusDI: null, minusDI: null }];
  const trList: number[] = [];
  const plusDMList: number[] = [];
  const minusDMList: number[] = [];

  for (let i = 1; i < data.length; i++) {
    const high = data[i].high, low = data[i].low, prevClose = data[i - 1].close;
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    const plusDM = data[i].high - data[i - 1].high > data[i - 1].low - data[i].low
      ? Math.max(data[i].high - data[i - 1].high, 0) : 0;
    const minusDM = data[i - 1].low - data[i].low > data[i].high - data[i - 1].high
      ? Math.max(data[i - 1].low - data[i].low, 0) : 0;

    trList.push(tr);
    plusDMList.push(plusDM);
    minusDMList.push(minusDM);

    if (i < period) {
      result.push({ adx: null, plusDI: null, minusDI: null });
      continue;
    }

    if (i === period) {
      const sumTR = trList.slice(0, period).reduce((a, b) => a + b, 0);
      const sumPlusDM = plusDMList.slice(0, period).reduce((a, b) => a + b, 0);
      const sumMinusDM = minusDMList.slice(0, period).reduce((a, b) => a + b, 0);
      const plusDI = sumTR > 0 ? (sumPlusDM / sumTR) * 100 : 0;
      const minusDI = sumTR > 0 ? (sumMinusDM / sumTR) * 100 : 0;
      const dx = (plusDI + minusDI) > 0 ? Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100 : 0;
      result.push({ adx: dx, plusDI, minusDI });
    } else {
      const prev = result[result.length - 1];
      const prevPlusDI = prev.plusDI ?? 0;
      const prevMinusDI = prev.minusDI ?? 0;
      const prevADX = prev.adx ?? 0;

      const smoothTR = trList.slice(Math.max(0, trList.length - period)).reduce((a, b) => a + b, 0);
      const smoothPlusDM = plusDMList.slice(Math.max(0, plusDMList.length - period)).reduce((a, b) => a + b, 0);
      const smoothMinusDM = minusDMList.slice(Math.max(0, minusDMList.length - period)).reduce((a, b) => a + b, 0);

      const plusDI = smoothTR > 0 ? (smoothPlusDM / smoothTR) * 100 : prevPlusDI;
      const minusDI = smoothTR > 0 ? (smoothMinusDM / smoothTR) * 100 : prevMinusDI;
      const dx = (plusDI + minusDI) > 0 ? Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100 : 0;
      const adx = (prevADX * (period - 1) + dx) / period;
      result.push({ adx, plusDI, minusDI });
    }
  }
  return result;
}

/* ─── Types ─── */
export type IndicatorType = 'rsi' | 'macd' | 'bollinger' | 'stochastic' | 'adx';

export const INDICATOR_LABELS: Record<IndicatorType, string> = {
  rsi: 'RSI',
  macd: 'MACD',
  bollinger: 'Bollinger',
  stochastic: 'Estocástico',
  adx: 'ADX',
};

export const INDICATOR_COLORS: Record<IndicatorType, string> = {
  rsi: '#a78bfa',
  macd: '#60a5fa',
  bollinger: '#fbbf24',
  stochastic: '#f472b6',
  adx: '#34d399',
};

/* ─── SVG Polyline helper ─── */
function polyline(xOf: (i: number) => number, values: (number | null)[], yOf: (v: number) => number, color: string, width = 1.2, dash?: string): string {
  let d = '';
  let started = false;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v === null) { started = false; continue; }
    const x = xOf(i), y = yOf(v);
    d += started ? ` L${x},${y}` : `M${x},${y}`;
    started = true;
  }
  if (!d) return '';
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}"${dash ? ` stroke-dasharray="${dash}"` : ''} stroke-linejoin="round" stroke-linecap="round"/>`;
}

/* ─── Overlay panel positions ─── */
// Each overlay indicator gets a small semi-transparent panel rendered in a specific
// area of the price chart. We stack them vertically from the bottom-left.

interface OverlayParams {
  chartX1: number;
  chartX2: number;
  priceTop: number;
  priceBottom: number;
  xOf: (i: number) => number;
}

// Returns the slot position for the nth overlay panel (0-indexed)
function getOverlaySlot(index: number, total: number, params: OverlayParams): { x1: number; x2: number; y1: number; y2: number } {
  const { chartX1, chartX2, priceTop, priceBottom } = params;
  const chartH = priceBottom - priceTop;
  const panelH = Math.min(chartH * 0.22, 100); // max 22% of chart height per panel
  const gap = 3;
  
  // Stack from bottom upward
  const y2 = priceBottom - gap - index * (panelH + gap);
  const y1 = y2 - panelH;
  
  return { x1: chartX1, x2: chartX2, y1, y2 };
}

function drawOverlayBg(slot: { x1: number; x2: number; y1: number; y2: number }, label: string, color: string, levels: { value: number; label: string }[], rangeMin: number, rangeMax: number): string[] {
  const parts: string[] = [];
  const { x1, x2, y1, y2 } = slot;
  const h = y2 - y1;
  const yOf = (v: number) => y1 + h * (1 - (v - rangeMin) / (rangeMax - rangeMin));

  // Semi-transparent background
  parts.push(`<rect x="${x1}" y="${y1}" width="${x2 - x1}" height="${h}" fill="rgba(6,14,28,0.75)" rx="3"/>`);
  parts.push(`<rect x="${x1}" y="${y1}" width="${x2 - x1}" height="${h}" fill="none" stroke="rgba(100,116,139,0.15)" stroke-width="0.5" rx="3"/>`);

  // Level lines
  for (const lv of levels) {
    const ly = yOf(lv.value);
    if (ly >= y1 && ly <= y2) {
      parts.push(`<line x1="${x1 + 2}" y1="${ly}" x2="${x2 - 2}" y2="${ly}" stroke="rgba(100,116,139,0.2)" stroke-width="0.4" stroke-dasharray="3,5"/>`);
      parts.push(`<text x="${x1 + 6}" y="${ly - 2}" fill="rgba(100,116,139,0.5)" font-size="7" font-family="monospace">${lv.label}</text>`);
    }
  }

  // Label
  parts.push(`<text x="${x1 + 8}" y="${y1 + 11}" fill="${color}" font-size="9" font-family="sans-serif" font-weight="bold" opacity="0.9">${label}</text>`);

  return parts;
}

/* ─── Build overlay for a single indicator ─── */
export function buildIndicatorOverlay(
  type: IndicatorType,
  data: CandleData[],
  index: number,
  total: number,
  params: OverlayParams,
): string {
  // Bollinger is handled separately as a price overlay
  if (type === 'bollinger') return '';

  const slot = getOverlaySlot(index, total, params);
  const { x1, x2, y1, y2 } = slot;
  const h = y2 - y1;
  const parts: string[] = [];
  const color = INDICATOR_COLORS[type];
  const label = INDICATOR_LABELS[type];

  if (type === 'rsi') {
    const rsi = calcRSI(data);
    const yOf = (v: number) => y1 + h * (1 - v / 100);
    parts.push(...drawOverlayBg(slot, label, color, [
      { value: 30, label: '30' }, { value: 50, label: '50' }, { value: 70, label: '70' },
    ], 0, 100));
    // Overbought/oversold zones
    parts.push(`<rect x="${x1}" y="${yOf(100)}" width="${x2 - x1}" height="${yOf(70) - yOf(100)}" fill="rgba(255,73,118,0.06)" rx="3"/>`);
    parts.push(`<rect x="${x1}" y="${yOf(30)}" width="${x2 - x1}" height="${yOf(0) - yOf(30)}" fill="rgba(0,212,170,0.06)" rx="3"/>`);
    parts.push(polyline(params.xOf, rsi, yOf, color, 1.4));
    // Show current value
    const lastRsi = [...rsi].reverse().find(v => v !== null);
    if (lastRsi !== null && lastRsi !== undefined) {
      parts.push(`<text x="${x2 - 8}" y="${y1 + 11}" fill="${color}" font-size="8" font-family="monospace" text-anchor="end" opacity="0.9">${lastRsi.toFixed(1)}</text>`);
    }
  }

  if (type === 'macd') {
    const macd = calcMACD(data);
    const macdVals = macd.map(m => m.macd);
    const sigVals = macd.map(m => m.signal);
    const histVals = macd.map(m => m.histogram);

    let minV = Infinity, maxV = -Infinity;
    for (const m of macd) {
      if (m.macd !== null) { minV = Math.min(minV, m.macd); maxV = Math.max(maxV, m.macd); }
      if (m.signal !== null) { minV = Math.min(minV, m.signal); maxV = Math.max(maxV, m.signal); }
      if (m.histogram !== null) { minV = Math.min(minV, m.histogram); maxV = Math.max(maxV, m.histogram); }
    }
    const range = maxV - minV || 0.0001;
    const pad = range * 0.1;
    minV -= pad; maxV += pad;
    const yOf = (v: number) => y1 + h * (1 - (v - minV) / (maxV - minV));

    parts.push(...drawOverlayBg(slot, label, color, [], 0, 0));
    // Zero line
    if (minV < 0 && maxV > 0) {
      const zy = yOf(0);
      parts.push(`<line x1="${x1 + 2}" y1="${zy}" x2="${x2 - 2}" y2="${zy}" stroke="rgba(100,116,139,0.3)" stroke-width="0.4" stroke-dasharray="3,5"/>`);
    }
    // Histogram bars
    const barW = Math.max(1, (x2 - x1) / data.length * 0.5);
    for (let i = 0; i < histVals.length; i++) {
      const hv = histVals[i];
      if (hv === null) continue;
      const bx = params.xOf(i);
      if (bx < x1 || bx > x2) continue;
      const zy = yOf(0);
      const by = yOf(hv);
      const bCol = hv >= 0 ? '#00d4aa' : '#ff4976';
      parts.push(`<rect x="${bx - barW / 2}" y="${Math.min(zy, by)}" width="${barW}" height="${Math.abs(by - zy)}" fill="${bCol}" opacity="0.4"/>`);
    }
    parts.push(polyline(params.xOf, macdVals, yOf, '#60a5fa', 1.3));
    parts.push(polyline(params.xOf, sigVals, yOf, '#f97316', 1, '3,2'));
  }

  if (type === 'stochastic') {
    const stoch = calcStochastic(data);
    const kVals = stoch.map(s => s.k);
    const dVals = stoch.map(s => s.d);
    const yOf = (v: number) => y1 + h * (1 - v / 100);
    parts.push(...drawOverlayBg(slot, label, color, [
      { value: 20, label: '20' }, { value: 50, label: '50' }, { value: 80, label: '80' },
    ], 0, 100));
    parts.push(`<rect x="${x1}" y="${yOf(100)}" width="${x2 - x1}" height="${yOf(80) - yOf(100)}" fill="rgba(255,73,118,0.06)" rx="3"/>`);
    parts.push(`<rect x="${x1}" y="${yOf(20)}" width="${x2 - x1}" height="${yOf(0) - yOf(20)}" fill="rgba(0,212,170,0.06)" rx="3"/>`);
    parts.push(polyline(params.xOf, kVals, yOf, '#f472b6', 1.3));
    parts.push(polyline(params.xOf, dVals, yOf, '#818cf8', 1, '3,2'));
    // Current value
    const lastK = [...kVals].reverse().find(v => v !== null);
    if (lastK !== null && lastK !== undefined) {
      parts.push(`<text x="${x2 - 8}" y="${y1 + 11}" fill="${color}" font-size="8" font-family="monospace" text-anchor="end" opacity="0.9">${lastK.toFixed(1)}</text>`);
    }
  }

  if (type === 'adx') {
    const adx = calcADX(data);
    const adxVals = adx.map(a => a.adx);
    const plusVals = adx.map(a => a.plusDI);
    const minusVals = adx.map(a => a.minusDI);
    const yOf = (v: number) => y1 + h * (1 - Math.min(v, 80) / 80);
    parts.push(...drawOverlayBg(slot, label, color, [
      { value: 20, label: '20' }, { value: 40, label: '40' },
    ], 0, 80));
    parts.push(polyline(params.xOf, adxVals, yOf, '#34d399', 1.5));
    parts.push(polyline(params.xOf, plusVals, yOf, '#00d4aa', 0.9, '2,2'));
    parts.push(polyline(params.xOf, minusVals, yOf, '#ff4976', 0.9, '2,2'));
    // Current value
    const lastAdx = [...adxVals].reverse().find(v => v !== null);
    if (lastAdx !== null && lastAdx !== undefined) {
      parts.push(`<text x="${x2 - 8}" y="${y1 + 11}" fill="${color}" font-size="8" font-family="monospace" text-anchor="end" opacity="0.9">${lastAdx.toFixed(1)}</text>`);
    }
  }

  return parts.join('\n');
}

// Bollinger is an overlay on the price chart, not a panel
export function buildBollingerOverlay(
  data: CandleData[],
  xOf: (i: number) => number,
  yOf: (price: number) => number,
): string {
  const bb = calcBollinger(data);
  const upper = bb.map(b => b.upper);
  const middle = bb.map(b => b.middle);
  const lower = bb.map(b => b.lower);
  const parts: string[] = [];

  // Fill between upper and lower
  let fillD = '';
  const validIndices: number[] = [];
  for (let i = 0; i < upper.length; i++) {
    if (upper[i] !== null && lower[i] !== null) validIndices.push(i);
  }
  if (validIndices.length > 1) {
    fillD = `M${xOf(validIndices[0])},${yOf(upper[validIndices[0]]!)}`;
    for (let j = 1; j < validIndices.length; j++) {
      fillD += ` L${xOf(validIndices[j])},${yOf(upper[validIndices[j]]!)}`;
    }
    for (let j = validIndices.length - 1; j >= 0; j--) {
      fillD += ` L${xOf(validIndices[j])},${yOf(lower[validIndices[j]]!)}`;
    }
    fillD += 'Z';
    parts.push(`<path d="${fillD}" fill="rgba(251,191,36,0.06)" stroke="none"/>`);
  }

  parts.push(polyline(xOf, upper, yOf, '#fbbf24', 0.8, '4,3'));
  parts.push(polyline(xOf, middle, yOf, '#fbbf24', 1.2));
  parts.push(polyline(xOf, lower, yOf, '#fbbf24', 0.8, '4,3'));

  return parts.join('\n');
}
