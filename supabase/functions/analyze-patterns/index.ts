import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function estimateAICost(model: string, inputTokens: number, outputTokens: number): number {
  const rates: Record<string, { input: number; output: number }> = {
    'google/gemini-2.5-flash': { input: 0.15, output: 0.6 },
    'google/gemini-3-flash-preview': { input: 0.15, output: 0.6 },
    'google/gemini-2.5-pro': { input: 1.25, output: 10.0 },
  };
  const rate = rates[model] || { input: 0.5, output: 2.0 };
  return (inputTokens * rate.input + outputTokens * rate.output) / 1000000;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function fetchLiveQuote(symbol: string): Promise<{ price?: number; bid?: number; ask?: number; change?: string; volume?: string; spread?: string; timestamp?: string } | null> {
  const parts = symbol.replace("C:", "").replace("_", "/").split("/");
  const isForex = parts.length === 2 && parts[0].length <= 4 && parts[1].length <= 4;

  // Try Finnhub first for forex
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
          return {
            price: data.c[idx],
            volume: data.v?.[idx] ? String(Math.round(data.v[idx])) : undefined,
            timestamp: new Date(data.t[idx] * 1000).toISOString(),
          };
        }
      }
    } catch { /* fallback */ }
  }

  // Alpha Vantage fallback for forex
  if (isForex) {
    try {
      const AV_KEY = Deno.env.get("ALPHA_VANTAGE_API_KEY");
      if (AV_KEY) {
        const res = await fetch(`https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${parts[0]}&to_currency=${parts[1]}&apikey=${AV_KEY}`);
        const data = await res.json();
        const rate = data["Realtime Currency Exchange Rate"];
        if (rate) {
          const bid = parseFloat(rate["8. Bid Price"]);
          const ask = parseFloat(rate["9. Ask Price"]);
          return {
            price: parseFloat(rate["5. Exchange Rate"]),
            bid, ask,
            spread: (ask - bid > 0) ? (ask - bid).toFixed(5) : undefined,
            timestamp: rate["6. Last Refreshed"],
          };
        }
      }
    } catch { /* ignore */ }
  }

  // Finnhub for stocks/indices
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { patterns, symbol, lastPrice, support, resistance, rsi, macdHistogram, model, language, detailLevel, timeframe, trend, volume } = await req.json();

    const lang = language || "en";
    const detail = detailLevel || "standard";
    const aiModel = model || "google/gemini-3-flash-preview";

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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!patterns || patterns.length === 0) {
      return new Response(
        JSON.stringify({ analysis: "No recent candlestick patterns were detected for analysis." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch real-time data
    const liveQuote = await fetchLiveQuote(symbol || "EUR/USD");

    const patternList = patterns
      .map((p: any) => `- **${p.name}** (${p.type}, reliability: ${p.reliability}) — ${p.description}`)
      .join("\n");

    const livePrice = liveQuote?.price || lastPrice;
    const liveSection = liveQuote
      ? `\n**Live Market Data (Real-Time)**\nPrice: ${liveQuote.price}${liveQuote.bid ? ` | Bid: ${liveQuote.bid} | Ask: ${liveQuote.ask}` : ''}${liveQuote.spread ? ` | Spread: ${liveQuote.spread}` : ''}${liveQuote.change ? ` | Change: ${liveQuote.change}` : ''}${liveQuote.volume ? ` | Volume: ${liveQuote.volume}` : ''}${liveQuote.timestamp ? `\nTimestamp: ${liveQuote.timestamp}` : ''}\n`
      : '';

    const contextLines = [
      `Symbol: ${symbol}`,
      `Price: ${livePrice}`,
      timeframe ? `Timeframe: ${timeframe}` : null,
      trend ? `Trend: ${trend}` : null,
      volume !== undefined ? `Volume: ${volume}` : null,
      support ? `Support: ${support}` : null,
      resistance ? `Resistance: ${resistance}` : null,
      rsi !== undefined ? `RSI(14): ${rsi.toFixed(1)}` : null,
      macdHistogram !== undefined ? `MACD Histogram: ${macdHistogram > 0 ? "positive" : "negative"}` : null,
    ].filter(Boolean).join(" | ");

    const prompt = `Act as a professional Forex technical analyst.

**Market data**
${contextLines}
${liveSection}
**Detected candlestick patterns (last 20 candles)**
${patternList}

Analyze the patterns and answer:

1. **Pattern summary** (2–3 lines)
2. **Market bias** (Bullish / Bearish / Neutral)
3. **Indicator confluence** (RSI, MACD, S/R)
4. **Suggested trader action** (Wait / Enter / Exit)
5. **Confidence level and invalidation factors**

${langInstruction} ${detailInstruction}

Markdown format.`;

    const startTime = Date.now();
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          { role: "system", content: `You are an expert Forex technical analyst. ${langInstruction} Be precise and professional.` },
          { role: "user", content: prompt },
        ],
        stream: false,
      }),
    });
    const latencyMs = Date.now() - startTime;

    // Log usage
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (!response.ok) {
      try {
        await supabase.from('api_usage_logs').insert({
          provider: 'lovable_ai', function_name: 'analyze-patterns', model: aiModel,
          response_status: response.status, latency_ms: latencyMs,
          metadata: { symbol, patternCount: patterns.length, hasLiveData: !!liveQuote },
        });
      } catch (_) {}

      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit reached." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || "Unable to generate analysis.";
    const usage = data.usage;

    try {
      await supabase.from('api_usage_logs').insert({
        provider: 'lovable_ai', function_name: 'analyze-patterns', model: aiModel,
        tokens_input: usage?.prompt_tokens || 0,
        tokens_output: usage?.completion_tokens || 0,
        tokens_total: usage?.total_tokens || 0,
        estimated_cost: estimateAICost(aiModel, usage?.prompt_tokens || 0, usage?.completion_tokens || 0),
        response_status: 200, latency_ms: latencyMs,
        metadata: { symbol, patternCount: patterns.length, hasLiveData: !!liveQuote },
      });
    } catch (_) {}

    return new Response(JSON.stringify({ analysis, patternCount: patterns.length, liveQuote }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-patterns error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
