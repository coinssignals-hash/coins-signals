import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODEL = "google/gemini-3-flash-preview";
const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

async function logUsage(status: number, latencyMs: number, usage?: any, meta?: Record<string, unknown>) {
  try {
    await supabaseAdmin.from("api_usage_logs").insert({
      function_name: "correlation-analysis", provider: "lovable_ai", model: MODEL,
      response_status: status, latency_ms: latencyMs,
      tokens_input: usage?.prompt_tokens || 0, tokens_output: usage?.completion_tokens || 0,
      tokens_total: usage?.total_tokens || 0,
      estimated_cost: ((usage?.prompt_tokens || 0) * 0.15 + (usage?.completion_tokens || 0) * 0.6) / 1e6,
      metadata: meta || {},
    });
  } catch { /* fire-and-forget */ }
}

async function fetchLiveQuote(symbol: string): Promise<{ price?: number; bid?: number; ask?: number; change?: string; volume?: string; spread?: string; timestamp?: string } | null> {
  const parts = symbol.replace("C:", "").replace("_", "/").split("/");
  const isForex = parts.length === 2 && parts[0].length <= 4 && parts[1].length <= 4;

  if (isForex) {
    try {
      const FINNHUB_KEY = Deno.env.get("FINNHUB_API_KEY");
      if (FINNHUB_KEY) {
        const fhSymbol = `OANDA:${parts[0]}_${parts[1]}`;
        const now = Math.floor(Date.now() / 1000);
        const res = await fetch(`https://finnhub.io/api/v1/forex/candle?symbol=${fhSymbol}&resolution=1&from=${now - 300}&to=${now}&token=${FINNHUB_KEY}`);
        const data = await res.json();
        if (data.s === "ok" && data.c?.length > 0) {
          const idx = data.c.length - 1;
          return { price: data.c[idx], volume: data.v?.[idx] ? String(Math.round(data.v[idx])) : undefined, timestamp: new Date(data.t[idx] * 1000).toISOString() };
        }
      }
    } catch { /* fallback */ }

    try {
      const AV_KEY = Deno.env.get("ALPHA_VANTAGE_API_KEY");
      if (AV_KEY) {
        const res = await fetch(`https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${parts[0]}&to_currency=${parts[1]}&apikey=${AV_KEY}`);
        const data = await res.json();
        const rate = data["Realtime Currency Exchange Rate"];
        if (rate) {
          const bid = parseFloat(rate["8. Bid Price"]);
          const ask = parseFloat(rate["9. Ask Price"]);
          return { price: parseFloat(rate["5. Exchange Rate"]), bid, ask, spread: (ask - bid > 0) ? (ask - bid).toFixed(5) : undefined, timestamp: rate["6. Last Refreshed"] };
        }
      }
    } catch { /* ignore */ }
  }

  if (!isForex) {
    try {
      const FINNHUB_KEY = Deno.env.get("FINNHUB_API_KEY");
      if (FINNHUB_KEY) {
        const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol.replace("/", "")}&token=${FINNHUB_KEY}`);
        const data = await res.json();
        if (data.c) return { price: data.c, change: `${data.dp?.toFixed(2)}%`, volume: data.v ? String(data.v) : undefined };
      }
    } catch { /* ignore */ }
  }

  return null;
}

// Fetch correlated pair prices for context
async function fetchCorrelatedPrices(symbol: string): Promise<string> {
  const CORRELATION_MAP: Record<string, string[]> = {
    "EUR/USD": ["GBP/USD", "USD/CHF", "USD/JPY", "XAU/USD"],
    "GBP/USD": ["EUR/USD", "EUR/GBP", "GBP/JPY"],
    "USD/JPY": ["EUR/JPY", "GBP/JPY", "XAU/USD"],
    "AUD/USD": ["NZD/USD", "USD/CAD", "XAU/USD"],
    "USD/CHF": ["EUR/USD", "EUR/CHF"],
    "XAU/USD": ["USD/JPY", "EUR/USD"],
    "EUR/GBP": ["EUR/USD", "GBP/USD"],
    "NZD/USD": ["AUD/USD", "AUD/NZD"],
    "USD/CAD": ["AUD/USD", "NZD/USD"],
  };

  const normalized = symbol.toUpperCase().replace("_", "/");
  const pairs = CORRELATION_MAP[normalized] || ["EUR/USD", "GBP/USD"];

  const results: string[] = [];
  // Fetch up to 3 correlated pairs
  for (const pair of pairs.slice(0, 3)) {
    try {
      const quote = await fetchLiveQuote(pair);
      if (quote?.price) {
        results.push(`${pair}: ${quote.price}${quote.change ? ` (${quote.change})` : ''}`);
      }
    } catch { /* skip */ }
  }

  return results.length > 0 ? results.join(" | ") : "Unavailable";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { symbol, candles, indicators, language, detailLevel, timeframe, trend, volatility, volume, atr, fundingRate, openInterest, previousResults } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!symbol) {
      return new Response(JSON.stringify({ error: "Symbol is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const lang = language || "en";
    const detail = detailLevel || "standard";

    const langMap: Record<string, string> = {
      en: "Respond in English.", es: "Respond in Spanish.", pt: "Respond in Portuguese.",
      fr: "Respond in French.", it: "Respond in Italian.", de: "Respond in German.",
      nl: "Respond in Dutch.", ar: "Respond in Arabic.", mt: "Respond in Maltese.",
    };
    const langInstruction = langMap[lang] || langMap.en;

    const detailMap: Record<string, string> = {
      concise: "Be very brief and direct, 2-3 lines max per section.",
      standard: "Be concise but thorough.",
      detailed: "Provide an extensive, in-depth analysis with multiple scenarios and detailed reasoning.",
    };
    const detailInstruction = detailMap[detail] || detailMap.standard;

    // Fetch real-time data + correlated pairs in parallel
    const [liveQuote, correlatedPrices] = await Promise.all([
      fetchLiveQuote(symbol),
      fetchCorrelatedPrices(symbol),
    ]);

    let lastPrice = "N/A";
    let rsiVal = "N/A";
    let macdVal = "N/A";
    let stochVal = "N/A";
    let patternList = "None detected";

    if (candles && Array.isArray(candles) && candles.length > 0) {
      const lastCandle = candles[candles.length - 1];
      lastPrice = liveQuote?.price?.toString() || lastCandle?.close?.toString() || "N/A";

      const rsi = indicators?.rsi;
      const lastRsi = Array.isArray(rsi) ? rsi[rsi.length - 1] : rsi;
      if (lastRsi !== undefined) rsiVal = typeof lastRsi === "number" ? lastRsi.toFixed(1) : String(lastRsi);

      const macd = indicators?.macdHistogram;
      const lastMacd = Array.isArray(macd) ? macd[macd.length - 1] : macd;
      if (lastMacd !== undefined) macdVal = typeof lastMacd === "number" ? lastMacd.toFixed(5) : String(lastMacd);

      const stoch = indicators?.stochastic;
      const lastStoch = Array.isArray(stoch) ? stoch[stoch.length - 1] : stoch;
      if (lastStoch !== undefined) stochVal = typeof lastStoch === "number" ? lastStoch.toFixed(1) : String(lastStoch);

      if (indicators?.patterns && Array.isArray(indicators.patterns) && indicators.patterns.length > 0) {
        patternList = indicators.patterns.slice(0, 10).map((p: any) => `- ${p.name} (${p.type}, reliability: ${p.reliability})`).join("\n");
      }
    } else if (liveQuote?.price) {
      lastPrice = liveQuote.price.toString();
    }

    const liveSection = liveQuote
      ? `\n**Real-Time Market Data**\nLive Price: ${liveQuote.price}${liveQuote.bid ? ` | Bid: ${liveQuote.bid} | Ask: ${liveQuote.ask}` : ''}${liveQuote.spread ? ` | Spread: ${liveQuote.spread}` : ''}${liveQuote.volume ? ` | Live Volume: ${liveQuote.volume}` : ''}${liveQuote.timestamp ? `\nLast Update: ${liveQuote.timestamp}` : ''}\n`
      : '';

    let prevAnalyses = "";
    if (previousResults) {
      const entries = Object.entries(previousResults).slice(0, 2);
      if (entries.length > 0) {
        prevAnalyses = entries.map(([key, val]: [string, any]) => {
          const content = val?.data?.analysis || val?.data?.prediction || val?.data?.report || "";
          return content ? `### ${key}\n${String(content).slice(0, 500)}` : "";
        }).filter(Boolean).join("\n\n");
      }
    }

    const prompt = `You are an institutional AI trading analyst combining technical analysis, quantitative signals, market flow intelligence, and risk management to produce a final trading decision.

**Asset**
Symbol: ${symbol}
Price: ${lastPrice}
${liveSection}
**Correlated Assets (Live)**
${correlatedPrices}

**Market Context**
Timeframe: ${timeframe || "D1"}
Trend: ${trend || "N/A"}
Volatility: ${volatility || "N/A"}
Support: ${indicators?.support || "N/A"}
Resistance: ${indicators?.resistance || "N/A"}

**Market Metrics**
Volume: ${volume || "N/A"}
ATR: ${atr || "N/A"}
Funding Rate: ${fundingRate || "N/A"}
Open Interest: ${openInterest || "N/A"}

**Technical Indicators**
RSI(14): ${rsiVal}
MACD Histogram: ${macdVal}
Stochastic K: ${stochVal}

**Detected Candlestick Patterns**
${patternList}

${prevAnalyses ? `**Previous AI Analyses**\n${prevAnalyses}` : ""}

**Tasks**

1. **Market Structure Analysis**
   Evaluate trend strength, market regime (trend / range / breakout), and structural levels.

2. **Technical Pattern Interpretation**
   Assess the reliability and implication of detected candlestick patterns.

3. **Smart Money & Flow Signals**
   Detect accumulation/distribution, unusual volume, positioning imbalance, or capital rotation.
   Use correlated asset prices to assess inter-market dynamics.

4. **Quantitative Trade Signal**
   Determine trade direction: LONG / SHORT / NO TRADE
   Estimate probability of success (%).

5. **Key Trading Levels**
   Define optimal Entry, Stop Loss, and Take Profit.

6. **Risk Evaluation**
   Assess trade risk using volatility, ATR, and market context.
   Classify risk level: Low / Medium / High.

7. **Market Scenarios**
   Best case, base case, and worst case outcome.

8. **Institutional Signal Scoring**
   Provide the following scores (0–100):
   - Signal Score
   - Trend Score
   - Momentum Score
   - Smart Money Score
   - Risk Score

9. **Final Decision**
   Trade decision: BUY / SELL / WAIT
   Confidence level (%)
   Brief reasoning.

${langInstruction} ${detailInstruction}

Markdown format.`;

    const t0 = Date.now();
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: `You are an elite institutional trading analyst with expertise in technical analysis, quantitative signals, smart money flow detection, and risk management. ${langInstruction} Provide professional, data-driven analysis.` },
          { role: "user", content: prompt },
        ],
        stream: false,
      }),
    });
    const latency = Date.now() - t0;

    if (!response.ok) {
      logUsage(response.status, latency, undefined, { symbol, hasLiveData: !!liveQuote });
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit reached." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    logUsage(200, latency, data.usage, { symbol, hasLiveData: !!liveQuote, correlatedPairs: correlatedPrices });

    const analysis = data.choices?.[0]?.message?.content || "Unable to generate institutional analysis.";

    return new Response(JSON.stringify({ analysis, liveQuote, correlatedPrices }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("correlation-analysis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
