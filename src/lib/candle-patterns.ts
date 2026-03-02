import type { OHLCVCandle } from "@/lib/indicators";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface DetectedPattern {
  name: string;
  japaneseName?: string;
  type: "bullish" | "bearish" | "neutral";
  candleCount: number;
  reliability: "high" | "medium" | "low";
  startIndex: number;
  endIndex: number;
  time: string;
  description: string;
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function body(c: OHLCVCandle) { return Math.abs(c.close - c.open); }
function upperWick(c: OHLCVCandle) { return c.high - Math.max(c.open, c.close); }
function lowerWick(c: OHLCVCandle) { return Math.min(c.open, c.close) - c.low; }
function isBullish(c: OHLCVCandle) { return c.close > c.open; }
function isBearish(c: OHLCVCandle) { return c.close < c.open; }
function range(c: OHLCVCandle) { return c.high - c.low; }

function avgBody(candles: OHLCVCandle[], endIdx: number, lookback = 14): number {
  const start = Math.max(0, endIdx - lookback);
  let sum = 0;
  for (let i = start; i < endIdx; i++) sum += body(candles[i]);
  return sum / (endIdx - start) || 0.0001;
}

// ═══════════════════════════════════════════════════════════════
// SINGLE CANDLE PATTERNS
// ═══════════════════════════════════════════════════════════════

function detectDoji(c: OHLCVCandle, avg: number): DetectedPattern | null {
  if (body(c) > avg * 0.1) return null;
  if (range(c) < avg * 0.5) return null;
  const uW = upperWick(c);
  const lW = lowerWick(c);
  if (uW < range(c) * 0.1 && lW > range(c) * 0.6) {
    return { name: "Dragonfly Doji", japaneseName: "トンボ", type: "bullish", candleCount: 1, reliability: "medium", startIndex: 0, endIndex: 0, time: c.time, description: "Long lower shadow, no upper shadow. Bullish reversal signal at support." };
  }
  if (lW < range(c) * 0.1 && uW > range(c) * 0.6) {
    return { name: "Gravestone Doji", japaneseName: "墓石", type: "bearish", candleCount: 1, reliability: "medium", startIndex: 0, endIndex: 0, time: c.time, description: "Long upper shadow, no lower shadow. Bearish reversal signal at resistance." };
  }
  return { name: "Doji", japaneseName: "同事", type: "neutral", candleCount: 1, reliability: "low", startIndex: 0, endIndex: 0, time: c.time, description: "Indecision candle. Open ≈ Close. Watch next candle for direction." };
}

function detectHammer(c: OHLCVCandle, avg: number): DetectedPattern | null {
  const b = body(c); const lW = lowerWick(c); const uW = upperWick(c);
  if (b < avg * 0.3) return null;
  if (lW < b * 2) return null;
  if (uW > b * 0.3) return null;
  return { name: "Hammer", japaneseName: "ハンマー", type: "bullish", candleCount: 1, reliability: "medium", startIndex: 0, endIndex: 0, time: c.time, description: "Small body at top, long lower wick (≥2x body). Bullish reversal after downtrend." };
}

function detectInvertedHammer(c: OHLCVCandle, avg: number): DetectedPattern | null {
  const b = body(c); const uW = upperWick(c); const lW = lowerWick(c);
  if (b < avg * 0.3) return null;
  if (uW < b * 2) return null;
  if (lW > b * 0.3) return null;
  return { name: "Inverted Hammer", japaneseName: "逆ハンマー", type: "bullish", candleCount: 1, reliability: "low", startIndex: 0, endIndex: 0, time: c.time, description: "Small body at bottom, long upper wick (≥2x body). Potential bullish reversal." };
}

function detectShootingStar(c: OHLCVCandle, avg: number): DetectedPattern | null {
  const b = body(c); const uW = upperWick(c); const lW = lowerWick(c);
  if (b < avg * 0.3) return null;
  if (uW < b * 2) return null;
  if (lW > b * 0.3) return null;
  if (!isBearish(c)) return null;
  return { name: "Shooting Star", japaneseName: "流れ星", type: "bearish", candleCount: 1, reliability: "medium", startIndex: 0, endIndex: 0, time: c.time, description: "Small body at bottom, long upper wick. Bearish reversal after uptrend." };
}

function detectSpinningTop(c: OHLCVCandle, avg: number): DetectedPattern | null {
  const b = body(c); const uW = upperWick(c); const lW = lowerWick(c);
  if (b > avg * 0.4) return null;
  if (uW < b * 0.5 || lW < b * 0.5) return null;
  if (range(c) < avg * 0.3) return null;
  return { name: "Spinning Top", japaneseName: "コマ", type: "neutral", candleCount: 1, reliability: "low", startIndex: 0, endIndex: 0, time: c.time, description: "Small body with upper and lower shadows. Market indecision." };
}

function detectMarubozu(c: OHLCVCandle, avg: number): DetectedPattern | null {
  const b = body(c); const r = range(c);
  if (b < avg * 1.5) return null;
  if (b < r * 0.9) return null;
  const type = isBullish(c) ? "bullish" : "bearish";
  return { name: `${type === "bullish" ? "Bullish" : "Bearish"} Marubozu`, japaneseName: "丸坊主", type, candleCount: 1, reliability: "high", startIndex: 0, endIndex: 0, time: c.time, description: `Strong ${type} candle with no/minimal wicks. Strong momentum continuation.` };
}

function detectPinBar(c: OHLCVCandle, avg: number): DetectedPattern | null {
  const b = body(c); const uW = upperWick(c); const lW = lowerWick(c);
  if (b < avg * 0.1 || b > avg * 0.5) return null;
  if (lW >= b * 3 && uW < b * 0.5) {
    return { name: "Pin Bar (Alcista)", japaneseName: "ピンバー", type: "bullish", candleCount: 1, reliability: "high", startIndex: 0, endIndex: 0, time: c.time, description: "Very long lower wick (≥3x body), tiny upper wick. Strong rejection of lower prices." };
  }
  if (uW >= b * 3 && lW < b * 0.5) {
    return { name: "Pin Bar (Bajista)", japaneseName: "ピンバー", type: "bearish", candleCount: 1, reliability: "high", startIndex: 0, endIndex: 0, time: c.time, description: "Very long upper wick (≥3x body), tiny lower wick. Strong rejection of higher prices." };
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
// TWO CANDLE PATTERNS
// ═══════════════════════════════════════════════════════════════

function detectEngulfing(prev: OHLCVCandle, curr: OHLCVCandle, avg: number): DetectedPattern | null {
  if (body(curr) < avg * 0.5) return null;
  if (isBearish(prev) && isBullish(curr) && curr.open <= prev.close && curr.close >= prev.open && body(curr) > body(prev)) {
    return { name: "Bullish Engulfing", japaneseName: "抱き線", type: "bullish", candleCount: 2, reliability: "high", startIndex: 0, endIndex: 0, time: curr.time, description: "Current bullish candle completely engulfs previous bearish candle. Strong reversal signal." };
  }
  if (isBullish(prev) && isBearish(curr) && curr.open >= prev.close && curr.close <= prev.open && body(curr) > body(prev)) {
    return { name: "Bearish Engulfing", japaneseName: "抱き線", type: "bearish", candleCount: 2, reliability: "high", startIndex: 0, endIndex: 0, time: curr.time, description: "Current bearish candle completely engulfs previous bullish candle. Strong reversal signal." };
  }
  return null;
}

function detectPiercing(prev: OHLCVCandle, curr: OHLCVCandle, avg: number): DetectedPattern | null {
  if (!isBearish(prev) || !isBullish(curr)) return null;
  if (body(prev) < avg * 0.5 || body(curr) < avg * 0.5) return null;
  const midPrev = (prev.open + prev.close) / 2;
  if (curr.open < prev.close && curr.close > midPrev && curr.close < prev.open) {
    return { name: "Piercing Line", japaneseName: "切り込み線", type: "bullish", candleCount: 2, reliability: "medium", startIndex: 0, endIndex: 0, time: curr.time, description: "Bullish candle opens below previous close and closes above midpoint. Bullish reversal." };
  }
  return null;
}

function detectDarkCloud(prev: OHLCVCandle, curr: OHLCVCandle, avg: number): DetectedPattern | null {
  if (!isBullish(prev) || !isBearish(curr)) return null;
  if (body(prev) < avg * 0.5 || body(curr) < avg * 0.5) return null;
  const midPrev = (prev.open + prev.close) / 2;
  if (curr.open > prev.close && curr.close < midPrev && curr.close > prev.open) {
    return { name: "Dark Cloud Cover", japaneseName: "かぶせ線", type: "bearish", candleCount: 2, reliability: "medium", startIndex: 0, endIndex: 0, time: curr.time, description: "Bearish candle opens above previous close and closes below midpoint. Bearish reversal." };
  }
  return null;
}

function detectHarami(prev: OHLCVCandle, curr: OHLCVCandle, avg: number): DetectedPattern | null {
  if (body(prev) < avg * 0.8) return null;
  if (body(curr) > body(prev) * 0.5) return null;
  const prevHigh = Math.max(prev.open, prev.close);
  const prevLow = Math.min(prev.open, prev.close);
  const currHigh = Math.max(curr.open, curr.close);
  const currLow = Math.min(curr.open, curr.close);
  if (currHigh < prevHigh && currLow > prevLow) {
    const type = isBearish(prev) ? "bullish" : "bearish";
    return { name: `${type === "bullish" ? "Bullish" : "Bearish"} Harami`, japaneseName: "はらみ線", type, candleCount: 2, reliability: "medium", startIndex: 0, endIndex: 0, time: curr.time, description: `Small candle contained within previous large candle. ${type === "bullish" ? "Bullish" : "Bearish"} reversal signal.` };
  }
  return null;
}

function detectTweezer(prev: OHLCVCandle, curr: OHLCVCandle, avg: number): DetectedPattern | null {
  const tolerance = avg * 0.05;
  if (Math.abs(prev.low - curr.low) < tolerance && isBearish(prev) && isBullish(curr)) {
    return { name: "Tweezer Bottom", japaneseName: "毛抜き底", type: "bullish", candleCount: 2, reliability: "medium", startIndex: 0, endIndex: 0, time: curr.time, description: "Two candles with same low. Bearish then bullish. Support confirmation." };
  }
  if (Math.abs(prev.high - curr.high) < tolerance && isBullish(prev) && isBearish(curr)) {
    return { name: "Tweezer Top", japaneseName: "毛抜き天井", type: "bearish", candleCount: 2, reliability: "medium", startIndex: 0, endIndex: 0, time: curr.time, description: "Two candles with same high. Bullish then bearish. Resistance confirmation." };
  }
  return null;
}

function detectInsideBar(prev: OHLCVCandle, curr: OHLCVCandle, _avg: number): DetectedPattern | null {
  if (curr.high < prev.high && curr.low > prev.low) {
    const type = isBearish(prev) ? "bullish" : "bearish";
    return {
      name: `Inside Bar (${type === "bullish" ? "Alcista" : "Bajista"})`,
      japaneseName: "はらみ足",
      type,
      candleCount: 2,
      reliability: "medium",
      startIndex: 0,
      endIndex: 0,
      time: curr.time,
      description: `Current candle range fully inside previous candle. Breakout ${type === "bullish" ? "above high" : "below low"} of mother bar expected.`,
    };
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
// THREE CANDLE PATTERNS
// ═══════════════════════════════════════════════════════════════

function detectMorningStar(a: OHLCVCandle, b: OHLCVCandle, c: OHLCVCandle, avg: number): DetectedPattern | null {
  if (!isBearish(a) || !isBullish(c)) return null;
  if (body(a) < avg * 0.5 || body(c) < avg * 0.5) return null;
  if (body(b) > avg * 0.3) return null;
  const midA = (a.open + a.close) / 2;
  if (c.close > midA) {
    return { name: "Morning Star", japaneseName: "明けの明星", type: "bullish", candleCount: 3, reliability: "high", startIndex: 0, endIndex: 0, time: c.time, description: "Bearish → small body → bullish closing above mid of first. Strong bullish reversal." };
  }
  return null;
}

function detectEveningStar(a: OHLCVCandle, b: OHLCVCandle, c: OHLCVCandle, avg: number): DetectedPattern | null {
  if (!isBullish(a) || !isBearish(c)) return null;
  if (body(a) < avg * 0.5 || body(c) < avg * 0.5) return null;
  if (body(b) > avg * 0.3) return null;
  const midA = (a.open + a.close) / 2;
  if (c.close < midA) {
    return { name: "Evening Star", japaneseName: "宵の明星", type: "bearish", candleCount: 3, reliability: "high", startIndex: 0, endIndex: 0, time: c.time, description: "Bullish → small body → bearish closing below mid of first. Strong bearish reversal." };
  }
  return null;
}

function detectThreeSoldiers(a: OHLCVCandle, b: OHLCVCandle, c: OHLCVCandle, avg: number): DetectedPattern | null {
  if (!isBullish(a) || !isBullish(b) || !isBullish(c)) return null;
  if (body(a) < avg * 0.5 || body(b) < avg * 0.5 || body(c) < avg * 0.5) return null;
  if (b.close <= a.close || c.close <= b.close) return null;
  if (b.open < a.open || c.open < b.open) return null;
  return { name: "Three White Soldiers", japaneseName: "赤三兵", type: "bullish", candleCount: 3, reliability: "high", startIndex: 0, endIndex: 0, time: c.time, description: "Three consecutive bullish candles with higher closes. Strong uptrend continuation." };
}

function detectThreeCrows(a: OHLCVCandle, b: OHLCVCandle, c: OHLCVCandle, avg: number): DetectedPattern | null {
  if (!isBearish(a) || !isBearish(b) || !isBearish(c)) return null;
  if (body(a) < avg * 0.5 || body(b) < avg * 0.5 || body(c) < avg * 0.5) return null;
  if (b.close >= a.close || c.close >= b.close) return null;
  return { name: "Three Black Crows", japaneseName: "黒三兵", type: "bearish", candleCount: 3, reliability: "high", startIndex: 0, endIndex: 0, time: c.time, description: "Three consecutive bearish candles with lower closes. Strong downtrend continuation." };
}

function detectThreeInside(a: OHLCVCandle, b: OHLCVCandle, c: OHLCVCandle, avg: number): DetectedPattern | null {
  if (isBearish(a) && body(a) > avg * 0.5) {
    const aH = Math.max(a.open, a.close);
    const aL = Math.min(a.open, a.close);
    const bH = Math.max(b.open, b.close);
    const bL = Math.min(b.open, b.close);
    if (bH < aH && bL > aL && isBullish(c) && c.close > aH) {
      return { name: "Three Inside Up", type: "bullish", candleCount: 3, reliability: "high", startIndex: 0, endIndex: 0, time: c.time, description: "Harami followed by bullish breakout above first candle. Confirmed bullish reversal." };
    }
  }
  if (isBullish(a) && body(a) > avg * 0.5) {
    const aH = Math.max(a.open, a.close);
    const aL = Math.min(a.open, a.close);
    const bH = Math.max(b.open, b.close);
    const bL = Math.min(b.open, b.close);
    if (bH < aH && bL > aL && isBearish(c) && c.close < aL) {
      return { name: "Three Inside Down", type: "bearish", candleCount: 3, reliability: "high", startIndex: 0, endIndex: 0, time: c.time, description: "Harami followed by bearish breakout below first candle. Confirmed bearish reversal." };
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
// MASTER DETECTION
// ═══════════════════════════════════════════════════════════════

export function detectCandlePatterns(candles: OHLCVCandle[], lookbackWindow = 50): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];
  const start = Math.max(0, candles.length - lookbackWindow);

  for (let i = start; i < candles.length; i++) {
    const avg = avgBody(candles, i);
    const c = candles[i];

    const doji = detectDoji(c, avg);
    if (doji) { doji.startIndex = i; doji.endIndex = i; patterns.push(doji); }

    const hammer = detectHammer(c, avg);
    if (hammer) { hammer.startIndex = i; hammer.endIndex = i; patterns.push(hammer); }

    const invHammer = detectInvertedHammer(c, avg);
    if (invHammer) { invHammer.startIndex = i; invHammer.endIndex = i; patterns.push(invHammer); }

    const shootingStar = detectShootingStar(c, avg);
    if (shootingStar) { shootingStar.startIndex = i; shootingStar.endIndex = i; patterns.push(shootingStar); }

    const spinTop = detectSpinningTop(c, avg);
    if (spinTop) { spinTop.startIndex = i; spinTop.endIndex = i; patterns.push(spinTop); }

    const marubozu = detectMarubozu(c, avg);
    if (marubozu) { marubozu.startIndex = i; marubozu.endIndex = i; patterns.push(marubozu); }

    const pinBar = detectPinBar(c, avg);
    if (pinBar) { pinBar.startIndex = i; pinBar.endIndex = i; patterns.push(pinBar); }

    if (i >= 1) {
      const prev = candles[i - 1];
      const engulfing = detectEngulfing(prev, c, avg);
      if (engulfing) { engulfing.startIndex = i - 1; engulfing.endIndex = i; patterns.push(engulfing); }

      const piercing = detectPiercing(prev, c, avg);
      if (piercing) { piercing.startIndex = i - 1; piercing.endIndex = i; patterns.push(piercing); }

      const darkCloud = detectDarkCloud(prev, c, avg);
      if (darkCloud) { darkCloud.startIndex = i - 1; darkCloud.endIndex = i; patterns.push(darkCloud); }

      const harami = detectHarami(prev, c, avg);
      if (harami) { harami.startIndex = i - 1; harami.endIndex = i; patterns.push(harami); }

      const tweezer = detectTweezer(prev, c, avg);
      if (tweezer) { tweezer.startIndex = i - 1; tweezer.endIndex = i; patterns.push(tweezer); }

      const insideBar = detectInsideBar(prev, c, avg);
      if (insideBar) { insideBar.startIndex = i - 1; insideBar.endIndex = i; patterns.push(insideBar); }
    }

    if (i >= 2) {
      const a = candles[i - 2], b = candles[i - 1];
      const morning = detectMorningStar(a, b, c, avg);
      if (morning) { morning.startIndex = i - 2; morning.endIndex = i; patterns.push(morning); }

      const evening = detectEveningStar(a, b, c, avg);
      if (evening) { evening.startIndex = i - 2; evening.endIndex = i; patterns.push(evening); }

      const soldiers = detectThreeSoldiers(a, b, c, avg);
      if (soldiers) { soldiers.startIndex = i - 2; soldiers.endIndex = i; patterns.push(soldiers); }

      const crows = detectThreeCrows(a, b, c, avg);
      if (crows) { crows.startIndex = i - 2; crows.endIndex = i; patterns.push(crows); }

      const inside = detectThreeInside(a, b, c, avg);
      if (inside) { inside.startIndex = i - 2; inside.endIndex = i; patterns.push(inside); }
    }
  }

  return patterns;
}

export function getRecentPatterns(candles: OHLCVCandle[], recentCandles = 20): DetectedPattern[] {
  const all = detectCandlePatterns(candles, recentCandles);
  const seen = new Map<string, DetectedPattern>();
  for (const p of all) {
    const key = `${p.time}-${p.name}`;
    const existing = seen.get(key);
    if (!existing || reliabilityScore(p.reliability) > reliabilityScore(existing.reliability)) {
      seen.set(key, p);
    }
  }
  return Array.from(seen.values()).sort((a, b) => b.endIndex - a.endIndex);
}

function reliabilityScore(r: string): number {
  return r === "high" ? 3 : r === "medium" ? 2 : 1;
}
