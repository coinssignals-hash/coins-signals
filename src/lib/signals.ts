import type { OHLCVCandle, ComputedIndicators } from "@/lib/indicators";
import type { DetectedPattern } from "@/lib/candle-patterns";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type SignalDirection = "BUY" | "SELL";
export type SignalStrength = "strong" | "moderate" | "weak";

export interface TradingSignal {
  id: string;
  direction: SignalDirection;
  strength: SignalStrength;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  takeProfitExtended?: number;
  riskReward: number;
  confidence: number;
  reasons: string[];
  timestamp: string;
  pipsRisk: number;
  pipsReward: number;
}

export interface SignalReport {
  signal: TradingSignal;
  aiAnalysis?: string;
  patterns: DetectedPattern[];
  marketContext: {
    trend: "bullish" | "bearish" | "ranging";
    volatility: "high" | "normal" | "low";
    rsi?: number;
    macdBias?: "bullish" | "bearish";
  };
}

// ═══════════════════════════════════════════════════════════════
// SIGNAL GENERATION
// ═══════════════════════════════════════════════════════════════

function pipMultiplier(symbol: string): number {
  return symbol.includes("JPY") ? 100 : 10000;
}

function toPips(priceDistance: number, symbol: string): number {
  return Math.abs(priceDistance) * pipMultiplier(symbol);
}

function determineTrend(indicators: ComputedIndicators): "bullish" | "bearish" | "ranging" {
  let bullSignals = 0;
  let bearSignals = 0;

  if (indicators.ema20 && indicators.ema50) {
    const last20 = indicators.ema20[indicators.ema20.length - 1]?.value;
    const last50 = indicators.ema50[indicators.ema50.length - 1]?.value;
    if (last20 && last50) {
      if (last20 > last50) bullSignals += 2;
      else bearSignals += 2;
    }
  }

  if (indicators.supertrend) {
    const lastDir = indicators.supertrend.direction[indicators.supertrend.direction.length - 1];
    if (lastDir?.value === 1) bullSignals += 2;
    else if (lastDir?.value === -1) bearSignals += 2;
  }

  if (indicators.macd && indicators.macd.length > 0) {
    const last = indicators.macd[indicators.macd.length - 1];
    if (last.histogram > 0) bullSignals++;
    else bearSignals++;
  }

  if (indicators.rsi && indicators.rsi.length > 0) {
    const lastRSI = indicators.rsi[indicators.rsi.length - 1].value;
    if (lastRSI > 60) bullSignals++;
    else if (lastRSI < 40) bearSignals++;
  }

  const diff = Math.abs(bullSignals - bearSignals);
  if (diff < 2) return "ranging";
  return bullSignals > bearSignals ? "bullish" : "bearish";
}

function determineVolatility(candles: OHLCVCandle[], symbol: string): "high" | "normal" | "low" {
  if (candles.length < 20) return "normal";
  const recent = candles.slice(-20);
  const avgRange = recent.reduce((sum, c) => sum + (c.high - c.low), 0) / recent.length;
  const older = candles.slice(-50, -20);
  if (older.length === 0) return "normal";
  const olderAvg = older.reduce((sum, c) => sum + (c.high - c.low), 0) / older.length;

  const ratio = avgRange / olderAvg;
  if (ratio > 1.5) return "high";
  if (ratio < 0.7) return "low";
  return "normal";
}

export function generateSignals(
  candles: OHLCVCandle[],
  indicators: ComputedIndicators,
  patterns: DetectedPattern[],
  symbol: string,
  support: number | null,
  resistance: number | null
): TradingSignal[] {
  if (candles.length < 20) return [];

  const lastCandle = candles[candles.length - 1];
  const price = lastCandle.close;
  const trend = determineTrend(indicators);

  const recentRanges = candles.slice(-14).map((c) => c.high - c.low);
  const avgRange = recentRanges.reduce((a, b) => a + b, 0) / recentRanges.length;

  const signals: TradingSignal[] = [];
  let bullScore = 0;
  let bearScore = 0;
  const bullReasons: string[] = [];
  const bearReasons: string[] = [];

  if (trend === "bullish") { bullScore += 15; bullReasons.push("Tendencia alcista (EMAs)"); }
  if (trend === "bearish") { bearScore += 15; bearReasons.push("Tendencia bajista (EMAs)"); }

  const highReliabilityPatterns = patterns.filter((p) => p.reliability === "high");
  for (const p of highReliabilityPatterns) {
    if (p.type === "bullish") { bullScore += 20; bullReasons.push(`Patrón: ${p.name}`); }
    if (p.type === "bearish") { bearScore += 20; bearReasons.push(`Patrón: ${p.name}`); }
  }
  const medReliabilityPatterns = patterns.filter((p) => p.reliability === "medium");
  for (const p of medReliabilityPatterns) {
    if (p.type === "bullish") { bullScore += 10; bullReasons.push(`Patrón: ${p.name}`); }
    if (p.type === "bearish") { bearScore += 10; bearReasons.push(`Patrón: ${p.name}`); }
  }

  if (indicators.rsi && indicators.rsi.length > 0) {
    const rsi = indicators.rsi[indicators.rsi.length - 1].value;
    if (rsi < 30) { bullScore += 15; bullReasons.push(`RSI sobreventa (${rsi.toFixed(1)})`); }
    if (rsi > 70) { bearScore += 15; bearReasons.push(`RSI sobrecompra (${rsi.toFixed(1)})`); }
    if (rsi > 50 && rsi < 70) { bullScore += 5; }
    if (rsi < 50 && rsi > 30) { bearScore += 5; }
  }

  if (indicators.macd && indicators.macd.length >= 2) {
    const curr = indicators.macd[indicators.macd.length - 1];
    const prev = indicators.macd[indicators.macd.length - 2];
    if (prev.histogram < 0 && curr.histogram > 0) { bullScore += 15; bullReasons.push("MACD cruce alcista"); }
    if (prev.histogram > 0 && curr.histogram < 0) { bearScore += 15; bearReasons.push("MACD cruce bajista"); }
  }

  if (support && Math.abs(price - support) < avgRange * 1.5) {
    bullScore += 10;
    bullReasons.push("Precio cerca del soporte");
  }
  if (resistance && Math.abs(price - resistance) < avgRange * 1.5) {
    bearScore += 10;
    bearReasons.push("Precio cerca de la resistencia");
  }

  if (indicators.structureBreaks && indicators.structureBreaks.length > 0) {
    const last = indicators.structureBreaks[indicators.structureBreaks.length - 1];
    if (last.type === "BOS" && last.direction === "bullish") { bullScore += 12; bullReasons.push("Break of Structure alcista"); }
    if (last.type === "BOS" && last.direction === "bearish") { bearScore += 12; bearReasons.push("Break of Structure bajista"); }
    if (last.type === "CHoCH" && last.direction === "bullish") { bullScore += 18; bullReasons.push("Change of Character alcista"); }
    if (last.type === "CHoCH" && last.direction === "bearish") { bearScore += 18; bearReasons.push("Change of Character bajista"); }
  }

  if (bullScore >= 25 && bullScore > bearScore) {
    const sl = support ? Math.min(price - avgRange * 1.5, support - avgRange * 0.3) : price - avgRange * 1.5;
    const tp1 = resistance ? Math.max(price + avgRange * 2, resistance) : price + avgRange * 2;
    const tp2 = price + avgRange * 3.5;
    const riskDist = price - sl;
    const rewardDist = tp1 - price;

    signals.push({
      id: `buy-${Date.now()}`,
      direction: "BUY",
      strength: bullScore >= 60 ? "strong" : bullScore >= 40 ? "moderate" : "weak",
      entry: price,
      stopLoss: sl,
      takeProfit: tp1,
      takeProfitExtended: tp2,
      riskReward: rewardDist / riskDist,
      confidence: Math.min(bullScore, 95),
      reasons: bullReasons.slice(0, 5),
      timestamp: lastCandle.time,
      pipsRisk: toPips(riskDist, symbol),
      pipsReward: toPips(rewardDist, symbol),
    });
  }

  if (bearScore >= 25 && bearScore > bullScore) {
    const sl = resistance ? Math.max(price + avgRange * 1.5, resistance + avgRange * 0.3) : price + avgRange * 1.5;
    const tp1 = support ? Math.min(price - avgRange * 2, support) : price - avgRange * 2;
    const tp2 = price - avgRange * 3.5;
    const riskDist = sl - price;
    const rewardDist = price - tp1;

    signals.push({
      id: `sell-${Date.now()}`,
      direction: "SELL",
      strength: bearScore >= 60 ? "strong" : bearScore >= 40 ? "moderate" : "weak",
      entry: price,
      stopLoss: sl,
      takeProfit: tp1,
      takeProfitExtended: tp2,
      riskReward: rewardDist / riskDist,
      confidence: Math.min(bearScore, 95),
      reasons: bearReasons.slice(0, 5),
      timestamp: lastCandle.time,
      pipsRisk: toPips(riskDist, symbol),
      pipsReward: toPips(rewardDist, symbol),
    });
  }

  return signals;
}

export function buildSignalReport(
  signal: TradingSignal,
  candles: OHLCVCandle[],
  indicators: ComputedIndicators,
  patterns: DetectedPattern[],
  symbol: string
): SignalReport {
  const lastRSI = indicators.rsi?.length ? indicators.rsi[indicators.rsi.length - 1].value : undefined;
  const lastMACD = indicators.macd?.length ? indicators.macd[indicators.macd.length - 1] : undefined;

  return {
    signal,
    patterns: patterns.filter((p) => p.type === (signal.direction === "BUY" ? "bullish" : "bearish")),
    marketContext: {
      trend: determineTrend(indicators),
      volatility: determineVolatility(candles, symbol),
      rsi: lastRSI,
      macdBias: lastMACD ? (lastMACD.histogram > 0 ? "bullish" : "bearish") : undefined,
    },
  };
}
