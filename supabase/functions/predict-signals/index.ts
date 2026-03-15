import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

function estimateCost(model: string, inp: number, out: number): number {
  const r: Record<string, [number, number]> = {
    'google/gemini-3-flash-preview': [0.15, 0.6], 'google/gemini-2.5-flash': [0.15, 0.6],
    'google/gemini-2.5-pro': [1.25, 10], 'openai/gpt-5': [2.5, 10], 'openai/gpt-5-mini': [0.4, 1.6],
  };
  const [i, o] = r[model] || [0.5, 2];
  return (inp * i + out * o) / 1e6;
}

async function logUsage(model: string, status: number, latencyMs: number, usage?: any, meta?: Record<string, unknown>) {
  try {
    await supabaseAdmin.from('api_usage_logs').insert({
      function_name: 'predict-signals', provider: 'lovable_ai', model,
      response_status: status, latency_ms: latencyMs,
      tokens_input: usage?.prompt_tokens || 0, tokens_output: usage?.completion_tokens || 0,
      tokens_total: usage?.total_tokens || 0,
      estimated_cost: estimateCost(model, usage?.prompt_tokens || 0, usage?.completion_tokens || 0),
      metadata: meta || {},
    });
  } catch { /* fire-and-forget */ }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { symbol, lastPrice, support, resistance, patterns, rsi, macdHistogram, stochastic, selectedSignals, model, language, detailLevel, timeframe, trend, volume, fundingRate, openInterest } = await req.json();

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
      concise: "Be very brief and direct, 2-3 lines max per signal.",
      standard: "Be concise but thorough.",
      detailed: "Provide an extensive, in-depth analysis with multiple scenarios per signal.",
    };
    const detailInstruction = detailMap[detail] || detailMap.standard;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const patternList = (patterns || []).map((p: any) => `- ${p.name} (${p.type}, reliability: ${p.reliability})`).join("\n") || "None detected";

    const contextLines = [
      `Asset: ${symbol}`,
      `Price: ${lastPrice}`,
      timeframe ? `Timeframe: ${timeframe}` : null,
      trend ? `Trend: ${trend}` : null,
      volume !== undefined ? `Volume: ${volume}` : null,
      fundingRate !== undefined ? `Funding Rate: ${fundingRate}` : null,
      openInterest !== undefined ? `Open Interest: ${openInterest}` : null,
      `Support: ${support || "N/A"}`,
      `Resistance: ${resistance || "N/A"}`,
    ].filter(Boolean).join(" | ");

    const indicatorLines = [
      rsi !== undefined ? `RSI(14): ${rsi.toFixed(1)}` : "RSI: N/A",
      macdHistogram !== undefined ? `MACD Histogram: ${macdHistogram.toFixed(5)}` : "MACD: N/A",
      stochastic !== undefined ? `Stochastic K: ${stochastic.toFixed(1)}` : "Stochastic: N/A",
    ].join(" | ");

    const prompt = `Act as a market intelligence analyst.

**Market data**
${contextLines}

**Indicators**
${indicatorLines}

**Candlestick patterns**
${patternList}

Provide:

• **Smart money accumulation signals**
• **Reversal probability**
• **Volume anomalies**
• **Capital rotation signals**
• **Crowded trade risk**

**Conclusion:**
Market bias, confidence level, and suggested trade (Entry / SL / TP).

${langInstruction} ${detailInstruction}

Markdown format.`;

    const t0 = Date.now();
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          { role: "system", content: `You are a market intelligence analyst specializing in alternative signals, smart money flows, and advanced technical analysis. ${langInstruction}` },
          { role: "user", content: prompt },
        ],
        stream: false,
      }),
    });
    const latency = Date.now() - t0;

    if (!response.ok) {
      logUsage(aiModel, response.status, latency, undefined, { symbol });
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit reached." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    logUsage(aiModel, 200, latency, data.usage, { symbol });

    const prediction = data.choices?.[0]?.message?.content || "Unable to generate prediction.";

    return new Response(JSON.stringify({ prediction }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("predict-signals error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
