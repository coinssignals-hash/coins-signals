import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Indicator helpers ───

function calcEMA(data: number[], period: number): number[] {
  const result: number[] = [];
  const k = 2 / (period + 1);
  let prev: number | null = null;
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { result.push(NaN); continue; }
    if (i === period - 1) {
      let sum = 0; for (let j = 0; j < period; j++) sum += data[i - j];
      prev = sum / period; result.push(prev); continue;
    }
    prev = data[i] * k + prev! * (1 - k);
    result.push(prev);
  }
  return result;
}

function calcSMA(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { result.push(NaN); continue; }
    let sum = 0; for (let j = 0; j < period; j++) sum += data[i - j];
    result.push(sum / period);
  }
  return result;
}

function calcRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  const gains: number[] = [];
  const losses: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    gains.push(d > 0 ? d : 0);
    losses.push(d < 0 ? -d : 0);
  }
  let avgG = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgL = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < gains.length; i++) {
    avgG = (avgG * (period - 1) + gains[i]) / period;
    avgL = (avgL * (period - 1) + losses[i]) / period;
  }
  if (avgL === 0) return 100;
  return +(100 - 100 / (1 + avgG / avgL)).toFixed(1);
}

function calcMACDSignal(closes: number[]): "bullish" | "bearish" | "neutral" {
  if (closes.length < 35) return "neutral";
  const fast = calcEMA(closes, 12);
  const slow = calcEMA(closes, 26);
  const macdLine: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (!isNaN(fast[i]) && !isNaN(slow[i])) macdLine.push(fast[i] - slow[i]);
  }
  if (macdLine.length < 9) return "neutral";
  const sig = calcEMA(macdLine, 9);
  const last = macdLine.length - 1;
  const hist = macdLine[last] - (isNaN(sig[last]) ? 0 : sig[last]);
  if (hist > 0 && macdLine[last] > 0) return "bullish";
  if (hist < 0 && macdLine[last] < 0) return "bearish";
  return "neutral";
}

function calcEMASignal(closes: number[], period = 20): "bullish" | "bearish" | "neutral" {
  const vals = calcEMA(closes, period);
  const last = vals[vals.length - 1];
  if (isNaN(last)) return "neutral";
  const price = closes[closes.length - 1];
  const diff = (price - last) / last * 100;
  if (diff > 0.1) return "bullish";
  if (diff < -0.1) return "bearish";
  return "neutral";
}

function calcBBSignal(closes: number[], period = 20, stdDev = 2): "bullish" | "bearish" | "neutral" {
  if (closes.length < period) return "neutral";
  const smaVals = calcSMA(closes, period);
  const mid = smaVals[smaVals.length - 1];
  if (isNaN(mid)) return "neutral";
  let sumSq = 0;
  for (let j = 0; j < period; j++) sumSq += (closes[closes.length - 1 - j] - mid) ** 2;
  const sd = Math.sqrt(sumSq / period);
  const upper = mid + stdDev * sd;
  const lower = mid - stdDev * sd;
  const price = closes[closes.length - 1];
  if (price <= lower) return "bullish";
  if (price >= upper) return "bearish";
  return "neutral";
}

function calcTrendSignal(closes: number[]): "bullish" | "bearish" | "neutral" {
  if (closes.length < 50) return "neutral";
  const ema20 = calcEMA(closes, 20);
  const ema50 = calcEMA(closes, 50);
  const last20 = ema20[ema20.length - 1];
  const last50 = ema50[ema50.length - 1];
  if (isNaN(last20) || isNaN(last50)) return "neutral";
  if (last20 > last50 && closes[closes.length - 1] > last20) return "bullish";
  if (last20 < last50 && closes[closes.length - 1] < last20) return "bearish";
  return "neutral";
}

// ─── Yahoo Finance fetch ───

interface TFConfig { yhInterval: string; range: string; minCandles: number; }

const TF_MAP: Record<string, TFConfig> = {
  M5:  { yhInterval: "5m",  range: "5d",  minCandles: 60 },
  M15: { yhInterval: "15m", range: "5d",  minCandles: 60 },
  H1:  { yhInterval: "1h",  range: "30d", minCandles: 60 },
  H4:  { yhInterval: "1h",  range: "60d", minCandles: 200 }, // aggregate 4x
  D1:  { yhInterval: "1d",  range: "6mo", minCandles: 60 },
  W1:  { yhInterval: "1wk", range: "2y",  minCandles: 30 },
};

async function fetchCandles(yhSymbol: string, tf: string): Promise<number[]> {
  const cfg = TF_MAP[tf];
  if (!cfg) return [];
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yhSymbol}?interval=${cfg.yhInterval}&range=${cfg.range}&includePrePost=false`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MTFBot/1.0)" },
    });
    if (!res.ok) { await res.text(); return []; }
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result?.indicators?.quote?.[0]) return [];
    const quote = result.indicators.quote[0];
    const closes: number[] = [];
    for (let i = 0; i < (result.timestamp?.length || 0); i++) {
      if (quote.close?.[i] != null) closes.push(quote.close[i]);
    }

    // For H4, aggregate 1h candles into 4h
    if (tf === "H4" && closes.length > 4) {
      const agg: number[] = [];
      for (let i = 3; i < closes.length; i += 4) agg.push(closes[i]);
      return agg;
    }
    return closes;
  } catch {
    return [];
  }
}

// ─── Main ───

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pairs } = await req.json();
    const pairList: string[] = pairs || [
      "EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CHF",
      "NZD/USD", "USD/CAD", "EUR/GBP", "XAU/USD",
    ];
    const timeframes = ["M5", "M15", "H1", "H4", "D1", "W1"];

    // Fetch all data in parallel (limited concurrency)
    const results = await Promise.all(
      pairList.map(async (pair) => {
        const clean = pair.replace("/", "");
        const yhSymbol = clean === "XAUUSD" ? "GC=F" : clean + "=X";

        const tfResults: Record<string, any> = {};
        let bullCount = 0, bearCount = 0;

        // Fetch all timeframes for this pair in parallel
        const tfData = await Promise.all(
          timeframes.map(async (tf) => {
            const closes = await fetchCandles(yhSymbol, tf);
            return { tf, closes };
          })
        );

        for (const { tf, closes } of tfData) {
          if (closes.length < 14) {
            tfResults[tf] = { trend: "neutral", rsi: 50, macd: "neutral", ema: "neutral", bb: "neutral" };
            continue;
          }

          const trend = calcTrendSignal(closes);
          const rsi = calcRSI(closes);
          const macd = calcMACDSignal(closes);
          const emaSignal = calcEMASignal(closes);
          const bb = calcBBSignal(closes);

          [trend, macd, emaSignal, bb].forEach((s) => {
            if (s === "bullish") bullCount++;
            if (s === "bearish") bearCount++;
          });
          if (rsi < 30) bullCount++;
          else if (rsi > 70) bearCount++;

          tfResults[tf] = { trend, rsi, macd, ema: emaSignal, bb };
        }

        const total = timeframes.length * 5;
        const confluence = Math.round(Math.max(bullCount, bearCount) / total * 100);
        const overallBias = bullCount > bearCount + 3 ? "bullish" : bearCount > bullCount + 3 ? "bearish" : "neutral";

        return { pair, timeframes: tfResults, confluence, overallBias };
      })
    );

    console.log(`Multi-TF Screener: analyzed ${pairList.length} pairs`);

    return new Response(JSON.stringify({ data: results, timestamp: Date.now() }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("multi-tf-screener error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
