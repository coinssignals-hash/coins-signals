/* ─── Price-Overlay Technical Indicators for SignalChart SVG ─── */

export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

/* ─── Types ─── */
export type IndicatorKind = 'bollinger' | 'ema' | 'sma' | 'parabolicSar';

export interface IndicatorConfig {
  kind: IndicatorKind;
  period: number; // ignored for parabolicSar
  id: string;     // unique key e.g. "ema-20"
}

export const INDICATOR_KIND_LABELS: Record<IndicatorKind, string> = {
  bollinger: 'Bollinger',
  ema: 'EMA',
  sma: 'SMA',
  parabolicSar: 'SAR',
};

export const INDICATOR_KIND_COLORS: Record<IndicatorKind, string> = {
  bollinger: '#fbbf24',
  ema: '#a78bfa',
  sma: '#f472b6',
  parabolicSar: '#34d399',
};

// Different shades for multiple EMAs/SMAs
const EMA_COLORS = ['#a78bfa', '#60a5fa', '#c084fc', '#818cf8'];
const SMA_COLORS = ['#f472b6', '#fb923c', '#e879f9', '#f43f5e'];

export function getIndicatorColor(config: IndicatorConfig, index: number): string {
  if (config.kind === 'ema') return EMA_COLORS[index % EMA_COLORS.length];
  if (config.kind === 'sma') return SMA_COLORS[index % SMA_COLORS.length];
  return INDICATOR_KIND_COLORS[config.kind];
}

export function getIndicatorLabel(config: IndicatorConfig): string {
  if (config.kind === 'parabolicSar') return 'SAR';
  return `${INDICATOR_KIND_LABELS[config.kind]} ${config.period}`;
}

export function makeIndicatorId(kind: IndicatorKind, period: number): string {
  return kind === 'parabolicSar' ? 'parabolicSar' : `${kind}-${period}`;
}

/* Default presets */
export const DEFAULT_PRESETS: IndicatorConfig[] = [
  { kind: 'bollinger', period: 20, id: 'bollinger-20' },
  { kind: 'ema', period: 9, id: 'ema-9' },
  { kind: 'ema', period: 21, id: 'ema-21' },
  { kind: 'ema', period: 50, id: 'ema-50' },
  { kind: 'sma', period: 200, id: 'sma-200' },
  { kind: 'parabolicSar', period: 0, id: 'parabolicSar' },
];

/* ─── Calculations ─── */

function emaCalc(values: number[], period: number): (number | null)[] {
  if (values.length < period) return values.map(() => null);
  const k = 2 / (period + 1);
  const result: (number | null)[] = [];
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

function smaCalc(values: number[], period: number): (number | null)[] {
  return values.map((_, i) => {
    if (i < period - 1) return null;
    const slice = values.slice(i - period + 1, i + 1);
    return slice.reduce((a, b) => a + b, 0) / period;
  });
}

export function calcEMA(data: CandleData[], period: number): (number | null)[] {
  return emaCalc(data.map(d => d.close), period);
}

export function calcSMA(data: CandleData[], period: number): (number | null)[] {
  return smaCalc(data.map(d => d.close), period);
}

export interface BollingerResult { upper: number | null; middle: number | null; lower: number | null; }

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
      if (i >= 2) sar = Math.min(sar, data[i - 1].low, data[i - 2].low);
      else sar = Math.min(sar, data[i - 1].low);
      if (data[i].low < sar) {
        isUpTrend = false; sar = ep; ep = data[i].low; af = afStep;
      } else if (data[i].high > ep) { ep = data[i].high; af = Math.min(af + afStep, afMax); }
    } else {
      if (i >= 2) sar = Math.max(sar, data[i - 1].high, data[i - 2].high);
      else sar = Math.max(sar, data[i - 1].high);
      if (data[i].high > sar) {
        isUpTrend = true; sar = ep; ep = data[i].high; af = afStep;
      } else if (data[i].low < ep) { ep = data[i].low; af = Math.min(af + afStep, afMax); }
    }
    result.push(sar);
  }
  return result;
}

/* ─── SVG polyline ─── */
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

/* ─── Build all active overlays ─── */
export function buildPriceOverlays(
  configs: IndicatorConfig[],
  data: CandleData[],
  xOf: (i: number) => number,
  yOf: (price: number) => number,
): string {
  if (!configs.length || !data.length) return '';
  const parts: string[] = [];
  let emaIdx = 0, smaIdx = 0;

  for (const cfg of configs) {
    const color = cfg.kind === 'ema'
      ? EMA_COLORS[emaIdx++ % EMA_COLORS.length]
      : cfg.kind === 'sma'
        ? SMA_COLORS[smaIdx++ % SMA_COLORS.length]
        : INDICATOR_KIND_COLORS[cfg.kind];

    if (cfg.kind === 'bollinger') {
      const bb = calcBollinger(data, cfg.period);
      const upper = bb.map(b => b.upper);
      const middle = bb.map(b => b.middle);
      const lower = bb.map(b => b.lower);
      const validIndices: number[] = [];
      for (let i = 0; i < upper.length; i++) {
        if (upper[i] !== null && lower[i] !== null) validIndices.push(i);
      }
      if (validIndices.length > 1) {
        let fillD = `M${xOf(validIndices[0])},${yOf(upper[validIndices[0]]!)}`;
        for (let j = 1; j < validIndices.length; j++) fillD += ` L${xOf(validIndices[j])},${yOf(upper[validIndices[j]]!)}`;
        for (let j = validIndices.length - 1; j >= 0; j--) fillD += ` L${xOf(validIndices[j])},${yOf(lower[validIndices[j]]!)}`;
        fillD += 'Z';
        parts.push(`<path d="${fillD}" fill="rgba(251,191,36,0.06)" stroke="none"/>`);
      }
      parts.push(polyline(xOf, upper, yOf, color, 0.8, '4,3'));
      parts.push(polyline(xOf, middle, yOf, color, 1.2));
      parts.push(polyline(xOf, lower, yOf, color, 0.8, '4,3'));
    }

    if (cfg.kind === 'ema') {
      parts.push(polyline(xOf, calcEMA(data, cfg.period), yOf, color, 1.3));
    }

    if (cfg.kind === 'sma') {
      parts.push(polyline(xOf, calcSMA(data, cfg.period), yOf, color, 1.5, '6,3'));
    }

    if (cfg.kind === 'parabolicSar') {
      const sarVals = calcParabolicSAR(data);
      for (let i = 0; i < sarVals.length; i++) {
        const v = sarVals[i];
        if (v === null) continue;
        const dotColor = v < data[i].close ? '#34d399' : '#ff4976';
        parts.push(`<circle cx="${xOf(i)}" cy="${yOf(v)}" r="1.8" fill="${dotColor}" opacity="0.85"/>`);
      }
    }
  }

  return parts.join('\n');
}

/* ─── Get current values for badges ─── */
export function getIndicatorCurrentValues(
  configs: IndicatorConfig[],
  data: CandleData[],
): Record<string, string> {
  const vals: Record<string, string> = {};
  if (!data.length) return vals;
  const jpy = data[0].close > 10;
  const fmt = (n: number) => jpy ? n.toFixed(3) : n.toFixed(5);

  for (const cfg of configs) {
    if (cfg.kind === 'bollinger') {
      const bb = calcBollinger(data, cfg.period);
      const last = [...bb].reverse().find(b => b.middle !== null);
      if (last?.middle != null) vals[cfg.id] = fmt(last.middle);
    }
    if (cfg.kind === 'ema') {
      const v = calcEMA(data, cfg.period);
      const last = [...v].reverse().find(x => x !== null);
      if (last != null) vals[cfg.id] = fmt(last);
    }
    if (cfg.kind === 'sma') {
      const v = calcSMA(data, cfg.period);
      const last = [...v].reverse().find(x => x !== null);
      if (last != null) vals[cfg.id] = fmt(last);
    }
    if (cfg.kind === 'parabolicSar') {
      const v = calcParabolicSAR(data);
      const last = [...v].reverse().find(x => x !== null);
      if (last != null) vals[cfg.id] = fmt(last);
    }
  }
  return vals;
}
