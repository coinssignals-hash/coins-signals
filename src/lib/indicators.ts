// ═══════════════════════════════════════════════════════════════
// OHLCV Candle Type (local definition)
// ═══════════════════════════════════════════════════════════════

export interface OHLCVCandle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface TimeValue {
  time: string;
  value: number;
}

export interface BandData {
  time: string;
  upper: number;
  middle: number;
  lower: number;
}

export interface MACDData {
  time: string;
  macd: number;
  signal: number;
  histogram: number;
}

export interface StochasticData {
  time: string;
  k: number;
  d: number;
}

export interface SwingPoint {
  time: string;
  price: number;
  type: "HH" | "HL" | "LH" | "LL";
}

export interface Zone {
  startTime: string;
  endTime: string;
  upper: number;
  lower: number;
  type: "supply" | "demand";
}

export interface FVGZone {
  time: string;
  upper: number;
  lower: number;
  type: "bullish" | "bearish";
}

export interface StructureBreak {
  time: string;
  price: number;
  type: "BOS" | "CHoCH";
  direction: "bullish" | "bearish";
}

export interface IchimokuData {
  time: string;
  tenkan: number | null;
  kijun: number | null;
  senkouA: number | null;
  senkouB: number | null;
  chikou: number | null;
}

export interface LevelLine {
  price: number;
  label: string;
  color: string;
  style?: number; // 0=solid, 1=dotted, 2=dashed
}

export interface SessionZone {
  name: string;
  startTime: string;
  endTime: string;
  color: string;
}

export interface IndicatorConfig {
  ema20: boolean;
  ema50: boolean;
  ema200: boolean;
  sessionSydney: boolean;
  sessionTokyo: boolean;
  sessionLondon: boolean;
  sessionNewYork: boolean;
  kzLondonOpen: boolean;
  kzNewYorkOpen: boolean;
  kzLondonNYOverlap: boolean;
  kzAsianRange: boolean;
  kzHours: {
    ldnOpen: [number, number];
    nyOpen: [number, number];
    ldnNyOverlap: [number, number];
    asianRange: [number, number];
  };
}

export const DEFAULT_CONFIG: IndicatorConfig = {
  ema20: false,
  ema50: false,
  ema200: false,
  sessionSydney: false,
  sessionTokyo: false,
  sessionLondon: false,
  sessionNewYork: false,
  kzLondonOpen: false,
  kzNewYorkOpen: false,
  kzLondonNYOverlap: false,
  kzAsianRange: false,
  kzHours: {
    ldnOpen: [7, 10],
    nyOpen: [12, 15],
    ldnNyOverlap: [12, 16],
    asianRange: [0, 6],
  },
};

// ═══════════════════════════════════════════════════════════════
// CORE CALCULATIONS
// ═══════════════════════════════════════════════════════════════

export function sma(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = 0; j < period; j++) sum += data[i - j];
      result.push(sum / period);
    }
  }
  return result;
}

export function ema(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const k = 2 / (period + 1);
  let prev: number | null = null;

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      let sum = 0;
      for (let j = 0; j < period; j++) sum += data[i - j];
      prev = sum / period;
      result.push(prev);
    } else {
      prev = data[i] * k + prev! * (1 - k);
      result.push(prev);
    }
  }
  return result;
}

export function atr(candles: OHLCVCandle[], period: number = 14): (number | null)[] {
  const trs: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      trs.push(candles[i].high - candles[i].low);
    } else {
      const tr = Math.max(
        candles[i].high - candles[i].low,
        Math.abs(candles[i].high - candles[i - 1].close),
        Math.abs(candles[i].low - candles[i - 1].close)
      );
      trs.push(tr);
    }
  }
  return ema(trs, period);
}

// ═══════════════════════════════════════════════════════════════
// TREND INDICATORS
// ═══════════════════════════════════════════════════════════════

export function calcEMA(candles: OHLCVCandle[], period: number): TimeValue[] {
  const closes = candles.map((c) => c.close);
  const vals = ema(closes, period);
  return candles
    .map((c, i) => ({ time: c.time, value: vals[i]! }))
    .filter((v) => v.value !== null && v.value !== undefined) as TimeValue[];
}

export function calcSMA(candles: OHLCVCandle[], period: number): TimeValue[] {
  const closes = candles.map((c) => c.close);
  const vals = sma(closes, period);
  return candles
    .map((c, i) => ({ time: c.time, value: vals[i]! }))
    .filter((v) => v.value !== null && v.value !== undefined) as TimeValue[];
}

export function calcSupertrend(
  candles: OHLCVCandle[],
  period: number = 10,
  multiplier: number = 3
): { data: TimeValue[]; direction: TimeValue[] } {
  const atrVals = atr(candles, period);
  const result: TimeValue[] = [];
  const dirs: TimeValue[] = [];
  let prevUpper = 0, prevLower = 0, prevST = 0, prevDir = 1;

  for (let i = 0; i < candles.length; i++) {
    const a = atrVals[i];
    if (a === null) continue;

    const hl2 = (candles[i].high + candles[i].low) / 2;
    let upper = hl2 + multiplier * a;
    let lower = hl2 - multiplier * a;

    upper = prevUpper !== 0 && upper > prevUpper ? prevUpper : upper;
    lower = prevLower !== 0 && lower < prevLower ? prevLower : lower;

    let dir: number;
    if (prevST === prevUpper) {
      dir = candles[i].close > upper ? 1 : -1;
    } else {
      dir = candles[i].close < lower ? -1 : 1;
    }

    const st = dir === 1 ? lower : upper;
    prevUpper = upper;
    prevLower = lower;
    prevST = st;
    prevDir = dir;

    result.push({ time: candles[i].time, value: st });
    dirs.push({ time: candles[i].time, value: dir });
  }
  return { data: result, direction: dirs };
}

export function calcLinearRegression(candles: OHLCVCandle[], stdDevMult: number = 2): BandData[] {
  const n = candles.length;
  if (n < 2) return [];

  const closes = candles.map((c) => c.close);
  const xMean = (n - 1) / 2;
  const yMean = closes.reduce((a, b) => a + b, 0) / n;

  let ssXY = 0, ssXX = 0;
  for (let i = 0; i < n; i++) {
    ssXY += (i - xMean) * (closes[i] - yMean);
    ssXX += (i - xMean) ** 2;
  }
  const slope = ssXY / ssXX;
  const intercept = yMean - slope * xMean;

  let sumSqErr = 0;
  for (let i = 0; i < n; i++) {
    const predicted = intercept + slope * i;
    sumSqErr += (closes[i] - predicted) ** 2;
  }
  const stdErr = Math.sqrt(sumSqErr / (n - 2));

  return candles.map((c, i) => {
    const mid = intercept + slope * i;
    return {
      time: c.time,
      upper: mid + stdDevMult * stdErr,
      middle: mid,
      lower: mid - stdDevMult * stdErr,
    };
  });
}

// ═══════════════════════════════════════════════════════════════
// VOLATILITY INDICATORS
// ═══════════════════════════════════════════════════════════════

export function calcBollingerBands(
  candles: OHLCVCandle[],
  period: number = 20,
  stdDev: number = 2
): BandData[] {
  const closes = candles.map((c) => c.close);
  const smaVals = sma(closes, period);

  return candles
    .map((c, i) => {
      const mid = smaVals[i];
      if (mid === null) return null;

      let sumSq = 0;
      for (let j = 0; j < period; j++) sumSq += (closes[i - j] - mid) ** 2;
      const sd = Math.sqrt(sumSq / period);

      return {
        time: c.time,
        upper: mid + stdDev * sd,
        middle: mid,
        lower: mid - stdDev * sd,
      };
    })
    .filter(Boolean) as BandData[];
}

export function calcKeltnerChannels(
  candles: OHLCVCandle[],
  emaPeriod: number = 20,
  atrPeriod: number = 10,
  mult: number = 1.5
): BandData[] {
  const closes = candles.map((c) => c.close);
  const emaVals = ema(closes, emaPeriod);
  const atrVals = atr(candles, atrPeriod);

  return candles
    .map((c, i) => {
      const mid = emaVals[i];
      const a = atrVals[i];
      if (mid === null || a === null) return null;
      return {
        time: c.time,
        upper: mid + mult * a,
        middle: mid,
        lower: mid - mult * a,
      };
    })
    .filter(Boolean) as BandData[];
}

export function calcDonchianChannels(candles: OHLCVCandle[], period: number = 20): BandData[] {
  return candles
    .map((c, i) => {
      if (i < period - 1) return null;
      let high = -Infinity, low = Infinity;
      for (let j = 0; j < period; j++) {
        high = Math.max(high, candles[i - j].high);
        low = Math.min(low, candles[i - j].low);
      }
      return { time: c.time, upper: high, middle: (high + low) / 2, lower: low };
    })
    .filter(Boolean) as BandData[];
}

// ═══════════════════════════════════════════════════════════════
// MOMENTUM / OSCILLATORS
// ═══════════════════════════════════════════════════════════════

export function calcRSI(candles: OHLCVCandle[], period: number = 14): TimeValue[] {
  const closes = candles.map((c) => c.close);
  const results: TimeValue[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? -diff : 0);
  }

  if (gains.length < period) return [];

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = period; i <= gains.length; i++) {
    if (i === period) {
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      results.push({ time: candles[i].time, value: 100 - 100 / (1 + rs) });
    } else {
      avgGain = (avgGain * (period - 1) + gains[i - 1]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i - 1]) / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      results.push({ time: candles[i].time, value: 100 - 100 / (1 + rs) });
    }
  }
  return results;
}

export function calcMACD(
  candles: OHLCVCandle[],
  fast: number = 12,
  slow: number = 26,
  signal: number = 9
): MACDData[] {
  const closes = candles.map((c) => c.close);
  const fastEMA = ema(closes, fast);
  const slowEMA = ema(closes, slow);

  const macdLine: number[] = [];
  const times: string[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (fastEMA[i] !== null && slowEMA[i] !== null) {
      macdLine.push(fastEMA[i]! - slowEMA[i]!);
      times.push(candles[i].time);
    }
  }

  const signalLine = ema(macdLine, signal);
  return macdLine
    .map((m, i) => {
      const s = signalLine[i];
      if (s === null) return null;
      return { time: times[i], macd: m, signal: s, histogram: m - s };
    })
    .filter(Boolean) as MACDData[];
}

export function calcStochastic(
  candles: OHLCVCandle[],
  kPeriod: number = 14,
  dPeriod: number = 3,
  smooth: number = 3
): StochasticData[] {
  const rawK: number[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (i < kPeriod - 1) continue;
    let high = -Infinity, low = Infinity;
    for (let j = 0; j < kPeriod; j++) {
      high = Math.max(high, candles[i - j].high);
      low = Math.min(low, candles[i - j].low);
    }
    rawK.push(high === low ? 50 : ((candles[i].close - low) / (high - low)) * 100);
  }

  const kSmoothed = sma(rawK, smooth);
  const kFiltered = kSmoothed.filter((v) => v !== null) as number[];
  const dLine = sma(kFiltered, dPeriod);

  const results: StochasticData[] = [];
  const startIdx = kPeriod - 1 + smooth - 1;

  for (let i = 0; i < kFiltered.length; i++) {
    const d = dLine[i];
    if (d === null) continue;
    const candleIdx = startIdx + i;
    if (candleIdx < candles.length) {
      results.push({ time: candles[candleIdx].time, k: kFiltered[i], d });
    }
  }
  return results;
}

// ═══════════════════════════════════════════════════════════════
// ICHIMOKU CLOUD
// ═══════════════════════════════════════════════════════════════

function ichimokuHL(candles: OHLCVCandle[], period: number, startIdx: number): number | null {
  if (startIdx < period - 1) return null;
  let high = -Infinity, low = Infinity;
  for (let j = 0; j < period; j++) {
    high = Math.max(high, candles[startIdx - j].high);
    low = Math.min(low, candles[startIdx - j].low);
  }
  return (high + low) / 2;
}

export function calcIchimoku(
  candles: OHLCVCandle[],
  tenkanPeriod: number = 9,
  kijunPeriod: number = 26,
  senkouBPeriod: number = 52,
  displacement: number = 26
): IchimokuData[] {
  const results: IchimokuData[] = [];

  for (let i = 0; i < candles.length; i++) {
    const tenkan = ichimokuHL(candles, tenkanPeriod, i);
    const kijun = ichimokuHL(candles, kijunPeriod, i);
    results.push({
      time: candles[i].time,
      tenkan,
      kijun,
      senkouA: null,
      senkouB: null,
      chikou: null,
    });
  }

  for (let i = 0; i < candles.length; i++) {
    const tenkan = ichimokuHL(candles, tenkanPeriod, i);
    const kijun = ichimokuHL(candles, kijunPeriod, i);
    const senkouA = tenkan !== null && kijun !== null ? (tenkan + kijun) / 2 : null;
    const senkouB = ichimokuHL(candles, senkouBPeriod, i);

    const futureIdx = i + displacement;
    if (futureIdx < results.length) {
      results[futureIdx].senkouA = senkouA;
      results[futureIdx].senkouB = senkouB;
    }
  }

  for (let i = displacement; i < candles.length; i++) {
    results[i - displacement].chikou = candles[i].close;
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════
// FIBONACCI RETRACEMENTS
// ═══════════════════════════════════════════════════════════════

export function calcFibonacci(candles: OHLCVCandle[]): LevelLine[] {
  if (candles.length === 0) return [];
  const high = Math.max(...candles.map((c) => c.high));
  const low = Math.min(...candles.map((c) => c.low));
  const diff = high - low;

  const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
  const labels = ["0%", "23.6%", "38.2%", "50%", "61.8%", "78.6%", "100%"];
  const colors = [
    "hsl(0, 72%, 51%)",
    "hsl(30, 80%, 55%)",
    "hsl(45, 90%, 55%)",
    "hsl(60, 70%, 50%)",
    "hsl(142, 71%, 45%)",
    "hsl(200, 80%, 55%)",
    "hsl(270, 60%, 60%)",
  ];

  return levels.map((lvl, i) => ({
    price: high - diff * lvl,
    label: `Fib ${labels[i]}`,
    color: colors[i],
    style: 1,
  }));
}

// ═══════════════════════════════════════════════════════════════
// PIVOT POINTS
// ═══════════════════════════════════════════════════════════════

export function calcPivotPoints(candles: OHLCVCandle[]): LevelLine[] {
  if (candles.length === 0) return [];

  const lastTime = new Date(candles[candles.length - 1].time.replace(" ", "T") + "Z");
  const today = new Date(lastTime);
  today.setUTCHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  const prevDay = candles.filter((c) => {
    const t = new Date(c.time.replace(" ", "T") + "Z");
    return t >= yesterday && t < today;
  });

  if (prevDay.length === 0) {
    const h = Math.max(...candles.map((c) => c.high));
    const l = Math.min(...candles.map((c) => c.low));
    const c = candles[candles.length - 1].close;
    return calcPivotLevels(h, l, c);
  }

  const h = Math.max(...prevDay.map((c) => c.high));
  const l = Math.min(...prevDay.map((c) => c.low));
  const c = prevDay[prevDay.length - 1].close;
  return calcPivotLevels(h, l, c);
}

function calcPivotLevels(h: number, l: number, c: number): LevelLine[] {
  const pp = (h + l + c) / 3;
  const r1 = 2 * pp - l;
  const s1 = 2 * pp - h;
  const r2 = pp + (h - l);
  const s2 = pp - (h - l);
  const r3 = h + 2 * (pp - l);
  const s3 = l - 2 * (h - pp);

  return [
    { price: r3, label: "R3", color: "hsl(142, 50%, 40%)", style: 1 },
    { price: r2, label: "R2", color: "hsl(142, 60%, 45%)", style: 1 },
    { price: r1, label: "R1", color: "hsl(142, 71%, 50%)", style: 1 },
    { price: pp, label: "PP", color: "hsl(45, 90%, 55%)", style: 0 },
    { price: s1, label: "S1", color: "hsl(0, 60%, 50%)", style: 1 },
    { price: s2, label: "S2", color: "hsl(0, 50%, 45%)", style: 1 },
    { price: s3, label: "S3", color: "hsl(0, 40%, 40%)", style: 1 },
  ];
}

// ═══════════════════════════════════════════════════════════════
// VOLUME INDICATORS
// ═══════════════════════════════════════════════════════════════

export function calcOBV(candles: OHLCVCandle[]): TimeValue[] {
  let obv = 0;
  return candles.map((c, i) => {
    if (i > 0) {
      if (c.close > candles[i - 1].close) obv += c.volume;
      else if (c.close < candles[i - 1].close) obv -= c.volume;
    }
    return { time: c.time, value: obv };
  });
}

export function calcVolumeMA(candles: OHLCVCandle[], period: number = 20): TimeValue[] {
  const vols = candles.map((c) => c.volume);
  const vals = sma(vols, period);
  return candles
    .map((c, i) => (vals[i] !== null ? { time: c.time, value: vals[i]! } : null))
    .filter(Boolean) as TimeValue[];
}

// ═══════════════════════════════════════════════════════════════
// LEVELS & STRUCTURE
// ═══════════════════════════════════════════════════════════════

export function calcHighLow7D(candles: OHLCVCandle[]): LevelLine[] {
  if (candles.length === 0) return [];
  const high = Math.max(...candles.map((c) => c.high));
  const low = Math.min(...candles.map((c) => c.low));
  return [
    { price: high, label: "7D High", color: "hsl(142, 71%, 45%)", style: 2 },
    { price: low, label: "7D Low", color: "hsl(0, 72%, 51%)", style: 2 },
  ];
}

export function calcPDHLC(candles: OHLCVCandle[]): LevelLine[] {
  if (candles.length === 0) return [];

  const lastTime = new Date(candles[candles.length - 1].time.replace(" ", "T") + "Z");
  const today = new Date(lastTime);
  today.setUTCHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  const prevDayCandles = candles.filter((c) => {
    const t = new Date(c.time.replace(" ", "T") + "Z");
    return t >= yesterday && t < today;
  });

  if (prevDayCandles.length === 0) return [];

  const pdh = Math.max(...prevDayCandles.map((c) => c.high));
  const pdl = Math.min(...prevDayCandles.map((c) => c.low));
  const pdc = prevDayCandles[prevDayCandles.length - 1].close;

  return [
    { price: pdh, label: "PDH", color: "hsl(142, 60%, 50%)", style: 1 },
    { price: pdl, label: "PDL", color: "hsl(0, 60%, 50%)", style: 1 },
    { price: pdc, label: "PDC", color: "hsl(45, 90%, 55%)", style: 1 },
  ];
}

export function calcSessionOpen(candles: OHLCVCandle[]): LevelLine[] {
  if (candles.length === 0) return [];
  const lastTime = new Date(candles[candles.length - 1].time.replace(" ", "T") + "Z");
  const todayStart = new Date(lastTime);
  todayStart.setUTCHours(0, 0, 0, 0);

  const todayCandles = candles.filter((c) => {
    const t = new Date(c.time.replace(" ", "T") + "Z");
    return t >= todayStart;
  });

  if (todayCandles.length === 0) return [];
  return [{ price: todayCandles[0].open, label: "Session Open", color: "hsl(200, 80%, 55%)", style: 2 }];
}

const SESSIONS = [
  { name: "Sydney",          startHour: 21, endHour: 6,  color: "hsla(270, 60%, 60%, 0.06)" },
  { name: "Tokyo",           startHour: 0,  endHour: 9,  color: "hsla(0, 70%, 55%, 0.06)" },
  { name: "London",          startHour: 7,  endHour: 16, color: "hsla(200, 80%, 55%, 0.06)" },
  { name: "New York",        startHour: 12, endHour: 21, color: "hsla(142, 71%, 45%, 0.06)" },
  { name: "LDN Open KZ",     startHour: 7,  endHour: 10, color: "hsla(200, 90%, 55%, 0.10)" },
  { name: "NY Open KZ",      startHour: 12, endHour: 15, color: "hsla(142, 80%, 45%, 0.10)" },
  { name: "LDN-NY Overlap",  startHour: 12, endHour: 16, color: "hsla(45, 90%, 55%, 0.10)" },
  { name: "Asian Range",     startHour: 0,  endHour: 6,  color: "hsla(320, 60%, 55%, 0.08)" },
];

export function calcSessionZones(candles: OHLCVCandle[], sessionNames?: string[], hourOverrides?: Record<string, [number, number]>): SessionZone[] {
  if (candles.length === 0) return [];
  const zones: SessionZone[] = [];

  const dayMap = new Map<string, OHLCVCandle[]>();
  for (const c of candles) {
    const t = new Date(c.time.replace(" ", "T") + "Z");
    const dayKey = t.toISOString().slice(0, 10);
    if (!dayMap.has(dayKey)) dayMap.set(dayKey, []);
    dayMap.get(dayKey)!.push(c);
  }

  for (const [dayKey] of dayMap) {
    const dayDate = new Date(dayKey + "T00:00:00Z");
    const filteredSessions = sessionNames ? SESSIONS.filter(s => sessionNames.includes(s.name)) : SESSIONS;
    for (const baseSession of filteredSessions) {
      const override = hourOverrides?.[baseSession.name];
      const session = override ? { ...baseSession, startHour: override[0], endHour: override[1] } : baseSession;
      let startDate: Date, endDate: Date;

      if (session.startHour > session.endHour) {
        startDate = new Date(dayDate);
        startDate.setUTCHours(session.startHour, 0, 0, 0);
        endDate = new Date(dayDate);
        endDate.setDate(endDate.getDate() + 1);
        endDate.setUTCHours(session.endHour, 0, 0, 0);
      } else {
        startDate = new Date(dayDate);
        startDate.setUTCHours(session.startHour, 0, 0, 0);
        endDate = new Date(dayDate);
        endDate.setUTCHours(session.endHour, 0, 0, 0);
      }

      const sessionCandles = candles.filter((c) => {
        const t = new Date(c.time.replace(" ", "T") + "Z");
        return t >= startDate && t < endDate;
      });

      if (sessionCandles.length >= 2) {
        zones.push({
          name: session.name,
          startTime: sessionCandles[0].time,
          endTime: sessionCandles[sessionCandles.length - 1].time,
          color: session.color,
        });
      }
    }
  }

  return zones;
}

export function detectSwings(candles: OHLCVCandle[], lookback: number = 5): SwingPoint[] {
  const swings: SwingPoint[] = [];
  const highs: { time: string; price: number }[] = [];
  const lows: { time: string; price: number }[] = [];

  for (let i = lookback; i < candles.length - lookback; i++) {
    let isHigh = true, isLow = true;
    for (let j = 1; j <= lookback; j++) {
      if (candles[i].high <= candles[i - j].high || candles[i].high <= candles[i + j].high) isHigh = false;
      if (candles[i].low >= candles[i - j].low || candles[i].low >= candles[i + j].low) isLow = false;
    }
    if (isHigh) highs.push({ time: candles[i].time, price: candles[i].high });
    if (isLow) lows.push({ time: candles[i].time, price: candles[i].low });
  }

  for (let i = 1; i < highs.length; i++) {
    swings.push({
      time: highs[i].time,
      price: highs[i].price,
      type: highs[i].price > highs[i - 1].price ? "HH" : "LH",
    });
  }
  for (let i = 1; i < lows.length; i++) {
    swings.push({
      time: lows[i].time,
      price: lows[i].price,
      type: lows[i].price > lows[i - 1].price ? "HL" : "LL",
    });
  }
  return swings.sort((a, b) => a.time.localeCompare(b.time));
}

export function detectFVG(candles: OHLCVCandle[]): FVGZone[] {
  const gaps: FVGZone[] = [];
  for (let i = 2; i < candles.length; i++) {
    if (candles[i].low > candles[i - 2].high) {
      gaps.push({ time: candles[i - 1].time, upper: candles[i].low, lower: candles[i - 2].high, type: "bullish" });
    }
    if (candles[i].high < candles[i - 2].low) {
      gaps.push({ time: candles[i - 1].time, upper: candles[i - 2].low, lower: candles[i].high, type: "bearish" });
    }
  }
  return gaps;
}

export function detectSupplyDemand(candles: OHLCVCandle[], lookback: number = 3): Zone[] {
  const zones: Zone[] = [];
  const avgBodyVal = candles.reduce((s, c) => s + Math.abs(c.close - c.open), 0) / candles.length;

  for (let i = lookback; i < candles.length - 1; i++) {
    const bodyVal = Math.abs(candles[i].close - candles[i].open);
    if (bodyVal > avgBodyVal * 2) {
      let consolidation = true;
      for (let j = 1; j <= Math.min(lookback, i); j++) {
        if (Math.abs(candles[i - j].close - candles[i - j].open) > avgBodyVal * 1.5) {
          consolidation = false;
          break;
        }
      }
      if (!consolidation) continue;

      const isBullish = candles[i].close > candles[i].open;
      const baseStart = Math.max(0, i - lookback);
      const low = Math.min(...candles.slice(baseStart, i).map((c) => c.low));
      const high = Math.max(...candles.slice(baseStart, i).map((c) => c.high));
      zones.push({
        startTime: candles[baseStart].time,
        endTime: candles[i].time,
        upper: high,
        lower: low,
        type: isBullish ? "demand" : "supply",
      });
    }
  }
  return zones;
}

export function detectBOS(candles: OHLCVCandle[], lookback: number = 5): StructureBreak[] {
  const swings = detectSwings(candles, lookback);
  const breaks: StructureBreak[] = [];

  const swingHighs = swings.filter((s) => s.type === "HH" || s.type === "LH");
  const swingLows = swings.filter((s) => s.type === "HL" || s.type === "LL");

  for (let i = 1; i < swingHighs.length; i++) {
    const prev = swingHighs[i - 1];
    const curr = swingHighs[i];
    if (curr.price > prev.price && prev.type === "LH") {
      breaks.push({ time: curr.time, price: curr.price, type: "CHoCH", direction: "bullish" });
    } else if (curr.price > prev.price) {
      breaks.push({ time: curr.time, price: curr.price, type: "BOS", direction: "bullish" });
    }
  }

  for (let i = 1; i < swingLows.length; i++) {
    const prev = swingLows[i - 1];
    const curr = swingLows[i];
    if (curr.price < prev.price && prev.type === "HL") {
      breaks.push({ time: curr.time, price: curr.price, type: "CHoCH", direction: "bearish" });
    } else if (curr.price < prev.price) {
      breaks.push({ time: curr.time, price: curr.price, type: "BOS", direction: "bearish" });
    }
  }

  return breaks.sort((a, b) => a.time.localeCompare(b.time));
}

// ═══════════════════════════════════════════════════════════════
// MASTER COMPUTE FUNCTION
// ═══════════════════════════════════════════════════════════════

export interface ComputedIndicators {
  ema20?: TimeValue[];
  ema50?: TimeValue[];
  ema200?: TimeValue[];
  sma50?: TimeValue[];
  sma200?: TimeValue[];
  supertrend?: { data: TimeValue[]; direction: TimeValue[] };
  regressionChannel?: BandData[];
  bollingerBands?: BandData[];
  keltnerChannels?: BandData[];
  donchianChannels?: BandData[];
  ichimoku?: IchimokuData[];
  levelLines: LevelLine[];
  swingPoints?: SwingPoint[];
  supplyDemandZones?: Zone[];
  fvgZones?: FVGZone[];
  structureBreaks?: StructureBreak[];
  sessionZones?: SessionZone[];
  rsi?: TimeValue[];
  macd?: MACDData[];
  stochastic?: StochasticData[];
  obv?: TimeValue[];
  volumeMA?: TimeValue[];
}

export function computeIndicators(
  candles: OHLCVCandle[],
  config: IndicatorConfig
): ComputedIndicators {
  const result: ComputedIndicators = { levelLines: [] };

  result.rsi = calcRSI(candles);
  result.macd = calcMACD(candles);
  result.stochastic = calcStochastic(candles);

  const ema20Data = calcEMA(candles, 20);
  const ema50Data = calcEMA(candles, 50);
  const ema200Data = calcEMA(candles, 200);
  if (config.ema20) result.ema20 = ema20Data;
  if (config.ema50) result.ema50 = ema50Data;
  if (config.ema200) result.ema200 = ema200Data;

  // Always expose for signal generation (internal)
  if (!result.ema20) result.ema20 = ema20Data;
  if (!result.ema50) result.ema50 = ema50Data;

  const activeSessions: string[] = [];
  const hourOverrides: Record<string, [number, number]> = {};
  if (config.sessionSydney) activeSessions.push("Sydney");
  if (config.sessionTokyo) activeSessions.push("Tokyo");
  if (config.sessionLondon) activeSessions.push("London");
  if (config.sessionNewYork) activeSessions.push("New York");
  if (config.kzLondonOpen) {
    activeSessions.push("LDN Open KZ");
    hourOverrides["LDN Open KZ"] = config.kzHours.ldnOpen;
  }
  if (config.kzNewYorkOpen) {
    activeSessions.push("NY Open KZ");
    hourOverrides["NY Open KZ"] = config.kzHours.nyOpen;
  }
  if (config.kzLondonNYOverlap) {
    activeSessions.push("LDN-NY Overlap");
    hourOverrides["LDN-NY Overlap"] = config.kzHours.ldnNyOverlap;
  }
  if (config.kzAsianRange) {
    activeSessions.push("Asian Range");
    hourOverrides["Asian Range"] = config.kzHours.asianRange;
  }
  if (activeSessions.length > 0) result.sessionZones = calcSessionZones(candles, activeSessions, hourOverrides);

  return result;
}
