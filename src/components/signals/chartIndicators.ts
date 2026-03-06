/* ─── Price-Overlay Technical Indicators for SignalChart SVG ─── */

export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

/* ─── Types ─── */
export type IndicatorType = 'bollinger' | 'ema20' | 'ema50' | 'sma200' | 'parabolicSar';

export const INDICATOR_LABELS: Record<IndicatorType, string> = {
  bollinger: 'Bollinger',
  ema20: 'EMA 20',
  ema50: 'EMA 50',
  sma200: 'SMA 200',
  parabolicSar: 'SAR',
};

export const INDICATOR_COLORS: Record<IndicatorType, string> = {
  bollinger: '#fbbf24',
  ema20: '#a78bfa',
  ema50: '#60a5fa',
  sma200: '#f472b6',
  parabolicSar: '#34d399',
};

/* ─── Calculations ─── */

function ema(values: number[], period: number): (number | null)[] {
  if (values.length < period) return values.map(() => null);
  const k = 2 / (period + 1);
  const result: (number | null)[] = [];
  // Start EMA from the SMA of first `period` values
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += values[i];
    result.push(null);
  }
  let prev = sum / period;
  result[period - 1] = prev;
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    result.push(prev);
  }
  return result;
}

function sma(values: number[], period: number): (number | null)[] {
  return values.map((_, i) => {
    if (i < period - 1) return null;
    const slice = values.slice(i - period + 1, i + 1);
    return slice.reduce((a, b) => a + b, 0) / period;
  });
}

export function calcEMA(data: CandleData[], period: number): (number | null)[] {
  return ema(data.map(d => d.close), period);
}

export function calcSMA(data: CandleData[], period: number): (number | null)[] {
  return sma(data.map(d => d.close), period);
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

// ── Parabolic SAR ──
export function calcParabolicSAR(data: CandleData[], afStep = 0.02, afMax = 0.2): (number | null)[] {
  if (data.length < 2) return data.map(() => null);
  const result: (number | null)[] = [null];

  let isUpTrend = data[1].close > data[0].close;
  let af = afStep;
  let ep = isUpTrend ? data[0].high : data[0].low;
  let sar = isUpTrend ? data[0].low : data[0].high;

  for (let i = 1; i < data.length; i++) {
    const prevSar = sar;
    sar = prevSar + af * (ep - prevSar);

    if (isUpTrend) {
      // Clamp SAR to not go above prior two lows
      if (i >= 2) sar = Math.min(sar, data[i - 1].low, data[i - 2].low);
      else sar = Math.min(sar, data[i - 1].low);

      if (data[i].low < sar) {
        // Reverse to downtrend
        isUpTrend = false;
        sar = ep;
        ep = data[i].low;
        af = afStep;
      } else {
        if (data[i].high > ep) {
          ep = data[i].high;
          af = Math.min(af + afStep, afMax);
        }
      }
    } else {
      // Clamp SAR to not go below prior two highs
      if (i >= 2) sar = Math.max(sar, data[i - 1].high, data[i - 2].high);
      else sar = Math.max(sar, data[i - 1].high);

      if (data[i].high > sar) {
        // Reverse to uptrend
        isUpTrend = true;
        sar = ep;
        ep = data[i].high;
        af = afStep;
      } else {
        if (data[i].low < ep) {
          ep = data[i].low;
          af = Math.min(af + afStep, afMax);
        }
      }
    }

    result.push(sar);
  }
  return result;
}

/* ─── SVG helpers ─── */

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

/* ─── Build all active overlays on the price chart ─── */
export function buildPriceOverlays(
  activeIndicators: IndicatorType[],
  data: CandleData[],
  xOf: (i: number) => number,
  yOf: (price: number) => number,
): string {
  if (!activeIndicators.length || !data.length) return '';
  const parts: string[] = [];

  for (const type of activeIndicators) {
    const color = INDICATOR_COLORS[type];

    if (type === 'bollinger') {
      const bb = calcBollinger(data);
      const upper = bb.map(b => b.upper);
      const middle = bb.map(b => b.middle);
      const lower = bb.map(b => b.lower);

      // Fill between upper and lower
      const validIndices: number[] = [];
      for (let i = 0; i < upper.length; i++) {
        if (upper[i] !== null && lower[i] !== null) validIndices.push(i);
      }
      if (validIndices.length > 1) {
        let fillD = `M${xOf(validIndices[0])},${yOf(upper[validIndices[0]]!)}`;
        for (let j = 1; j < validIndices.length; j++) {
          fillD += ` L${xOf(validIndices[j])},${yOf(upper[validIndices[j]]!)}`;
        }
        for (let j = validIndices.length - 1; j >= 0; j--) {
          fillD += ` L${xOf(validIndices[j])},${yOf(lower[validIndices[j]]!)}`;
        }
        fillD += 'Z';
        parts.push(`<path d="${fillD}" fill="rgba(251,191,36,0.06)" stroke="none"/>`);
      }
      parts.push(polyline(xOf, upper, yOf, color, 0.8, '4,3'));
      parts.push(polyline(xOf, middle, yOf, color, 1.2));
      parts.push(polyline(xOf, lower, yOf, color, 0.8, '4,3'));
    }

    if (type === 'ema20') {
      const vals = calcEMA(data, 20);
      parts.push(polyline(xOf, vals, yOf, color, 1.3));
    }

    if (type === 'ema50') {
      const vals = calcEMA(data, 50);
      parts.push(polyline(xOf, vals, yOf, color, 1.3));
    }

    if (type === 'sma200') {
      const vals = calcSMA(data, 200);
      parts.push(polyline(xOf, vals, yOf, color, 1.5, '6,3'));
    }

    if (type === 'parabolicSar') {
      const sarVals = calcParabolicSAR(data);
      // Draw as dots instead of a line
      for (let i = 0; i < sarVals.length; i++) {
        const v = sarVals[i];
        if (v === null) continue;
        const x = xOf(i);
        const y = yOf(v);
        const isBelow = v < data[i].close;
        const dotColor = isBelow ? '#34d399' : '#ff4976';
        parts.push(`<circle cx="${x}" cy="${y}" r="1.8" fill="${dotColor}" opacity="0.85"/>`);
      }
    }
  }

  return parts.join('\n');
}

/* ─── Get current values for badges ─── */
export function getIndicatorCurrentValues(
  activeIndicators: IndicatorType[],
  data: CandleData[],
): Record<IndicatorType, string> {
  const vals: Partial<Record<IndicatorType, string>> = {};
  if (!data.length) return vals as Record<IndicatorType, string>;

  const jpy = data[0].close > 10;
  const fmt = (n: number) => jpy ? n.toFixed(3) : n.toFixed(5);

  for (const type of activeIndicators) {
    if (type === 'bollinger') {
      const bb = calcBollinger(data);
      const last = [...bb].reverse().find(b => b.middle !== null);
      if (last?.middle != null) vals.bollinger = fmt(last.middle);
    }
    if (type === 'ema20') {
      const v = calcEMA(data, 20);
      const last = [...v].reverse().find(x => x !== null);
      if (last != null) vals.ema20 = fmt(last);
    }
    if (type === 'ema50') {
      const v = calcEMA(data, 50);
      const last = [...v].reverse().find(x => x !== null);
      if (last != null) vals.ema50 = fmt(last);
    }
    if (type === 'sma200') {
      const v = calcSMA(data, 200);
      const last = [...v].reverse().find(x => x !== null);
      if (last != null) vals.sma200 = fmt(last);
    }
    if (type === 'parabolicSar') {
      const v = calcParabolicSAR(data);
      const last = [...v].reverse().find(x => x !== null);
      if (last != null) vals.parabolicSar = fmt(last);
    }
  }

  return vals as Record<IndicatorType, string>;
}
