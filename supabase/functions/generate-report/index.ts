import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const MODEL = "google/gemini-3-flash-preview";

async function logUsage(status: number, latencyMs: number, usage?: any, meta?: Record<string, unknown>) {
  try {
    const [i, o] = [0.15, 0.6];
    await supabaseAdmin.from('api_usage_logs').insert({
      function_name: 'generate-report', provider: 'lovable_ai', model: MODEL,
      response_status: status, latency_ms: latencyMs,
      tokens_input: usage?.prompt_tokens || 0, tokens_output: usage?.completion_tokens || 0,
      tokens_total: usage?.total_tokens || 0,
      estimated_cost: ((usage?.prompt_tokens || 0) * i + (usage?.completion_tokens || 0) * o) / 1e6,
      metadata: meta || {},
    });
  } catch { /* fire-and-forget */ }
}

const _quoteCache = new Map<string, { data: any; ts: number }>();
const QUOTE_CACHE_TTL = 60_000;

async function fetchLiveQuote(symbol: string): Promise<{ price?: number; bid?: number; ask?: number; change?: string; volume?: string; spread?: string; timestamp?: string } | null> {
  const cached = _quoteCache.get(symbol);
  if (cached && Date.now() - cached.ts < QUOTE_CACHE_TTL) return cached.data;

  const result = await _fetchLiveQuoteUncached(symbol);
  if (result) _quoteCache.set(symbol, { data: result, ts: Date.now() });
  return result;
}

async function _fetchLiveQuoteUncached(symbol: string): Promise<{ price?: number; bid?: number; ask?: number; change?: string; volume?: string; spread?: string; timestamp?: string } | null> {
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { signal, patterns, marketContext, symbol, candles, indicators, language, detailLevel, timeframe, volume, atr } = body;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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

    // Fetch real-time data
    const liveQuote = await fetchLiveQuote(symbol || "EUR/USD");

    const liveSection = liveQuote
      ? `\n**Real-Time Market Data**\nLive Price: ${liveQuote.price}${liveQuote.bid ? ` | Bid: ${liveQuote.bid} | Ask: ${liveQuote.ask}` : ''}${liveQuote.spread ? ` | Spread: ${liveQuote.spread}` : ''}${liveQuote.change ? ` | Change: ${liveQuote.change}` : ''}${liveQuote.volume ? ` | Live Volume: ${liveQuote.volume}` : ''}${liveQuote.timestamp ? `\nLast Update: ${liveQuote.timestamp}` : ''}\n`
      : '';

    let prompt: string;

    if (signal) {
      const patternList = (patterns || []).map((p: any) => `- ${p.name} (${p.type}, reliability: ${p.reliability})`).join("\n") || "None relevant";
      const reasonsList = (signal.reasons || []).map((r: string) => `- ${r}`).join("\n") || "None provided";

      prompt = `Act as a professional Forex analyst.

**Signal**
${signal.direction} ${symbol}
Entry: ${signal.entry}
SL: ${signal.stopLoss}${signal.pipsRisk ? ` (${signal.pipsRisk.toFixed(1)} pips)` : ''}
TP: ${signal.takeProfit}${signal.pipsReward ? ` (${signal.pipsReward.toFixed(1)} pips)` : ''}
Risk/Reward: 1:${signal.riskReward?.toFixed(2) || 'N/A'}
Confidence: ${signal.confidence}%

**Market context**
Timeframe: ${timeframe || marketContext?.timeframe || 'N/A'}
Trend: ${marketContext?.trend || 'N/A'}
Volatility: ${marketContext?.volatility || 'N/A'}
Support: ${marketContext?.support || signal.support || 'N/A'}
Resistance: ${marketContext?.resistance || signal.resistance || 'N/A'}
Volume: ${volume || 'N/A'}
ATR: ${atr || 'N/A'}
${marketContext?.rsi !== undefined ? `RSI: ${marketContext.rsi.toFixed(1)}` : ''}
${marketContext?.macdBias ? `MACD: ${marketContext.macdBias}` : ''}
${liveSection}
**Reasons**
${reasonsList}

**Candlestick patterns**
${patternList}

Provide:

• **Signal validation**
• **Key levels confirmation or adjustment** (Entry / SL / TP)
• **Risk factors** that could invalidate the trade
• **Best / base / worst market scenario**
• **Final recommendation** (Execute / Wait / Avoid) with position management guidance

${langInstruction} ${detailInstruction}

Markdown format.`;
    } else if (candles && Array.isArray(candles)) {
      const recent = candles.slice(-30);
      const lastCandle = recent[recent.length - 1];
      const lastPrice = liveQuote?.price || lastCandle?.close || lastCandle?.open || 'N/A';
      const high24 = Math.max(...recent.map((c: any) => c.high || c.close || 0));
      const low24 = Math.min(...recent.map((c: any) => c.low || c.close || Infinity));

      const patternList = (indicators?.patterns || [])
        .slice(0, 10)
        .map((p: any) => `- ${p.name} (${p.type}, reliability: ${p.reliability})`)
        .join("\n") || "None detected";

      const rsi = indicators?.rsi;
      const lastRsi = Array.isArray(rsi) ? rsi[rsi.length - 1] : rsi;
      const ema20 = indicators?.ema20;
      const lastEma20 = Array.isArray(ema20) ? ema20[ema20.length - 1] : ema20;
      const ema50 = indicators?.ema50;
      const lastEma50 = Array.isArray(ema50) ? ema50[ema50.length - 1] : ema50;

      prompt = `Act as a professional Forex analyst.

**Market data**
Symbol: ${symbol || 'Unknown'} | Price: ${lastPrice}
24h High: ${high24} | 24h Low: ${low24}
Candles analyzed: ${candles.length}
${liveSection}
**Indicators**
${lastRsi !== undefined ? `RSI(14): ${typeof lastRsi === 'number' ? lastRsi.toFixed(1) : lastRsi}` : 'RSI: N/A'}
${lastEma20 !== undefined ? `EMA(20): ${typeof lastEma20 === 'number' ? lastEma20.toFixed(5) : lastEma20}` : ''}
${lastEma50 !== undefined ? `EMA(50): ${typeof lastEma50 === 'number' ? lastEma50.toFixed(5) : lastEma50}` : ''}

**Candlestick patterns**
${patternList}

Provide:

• **Market summary**: Current state, dominant trend, and momentum
• **Key levels**: Support, resistance, and zones of interest
• **Technical analysis**: Indicator and pattern interpretation
• **Risk factors**: What could change the scenario
• **Scenarios**: Best case (bullish), base case (neutral), worst case (bearish) with probabilities
• **Final recommendation**: Bias (BUY / SELL / WAIT) with suggested Entry, SL, and TP levels

${langInstruction} ${detailInstruction}

Markdown format.`;
    } else {
      return new Response(JSON.stringify({ error: "No signal or candles provided" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const t0 = Date.now();
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: `You are a professional Forex trading analyst. ${langInstruction} Generate concise and actionable reports.` },
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
    logUsage(200, latency, data.usage, { symbol, hasLiveData: !!liveQuote });

    const report = data.choices?.[0]?.message?.content || "Unable to generate report.";
    return new Response(JSON.stringify({ report, liveQuote }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
