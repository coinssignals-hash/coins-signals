import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const MODEL = "google/gemini-2.5-flash-lite";

async function logUsage(status: number, latencyMs: number, usage?: any, meta?: Record<string, unknown>) {
  try {
    await supabaseAdmin.from('api_usage_logs').insert({
      function_name: 'currency-impact-ai', provider: 'lovable_ai', model: MODEL,
      response_status: status, latency_ms: latencyMs,
      tokens_input: usage?.prompt_tokens || 0, tokens_output: usage?.completion_tokens || 0,
      tokens_total: usage?.total_tokens || 0,
      estimated_cost: ((usage?.prompt_tokens || 0) * 0.075 + (usage?.completion_tokens || 0) * 0.3) / 1e6,
      metadata: meta || {},
    });
  } catch { /* fire-and-forget */ }
}

const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 60 * 60_000;

interface SignalInput { currencyPair: string; action: string; trend: string; entryPrice: number; takeProfit: number; stopLoss: number; probability: number; }

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { signal, language } = await req.json() as { signal: SignalInput; language?: string };
    if (!signal?.currencyPair) return new Response(JSON.stringify({ error: "signal with currencyPair is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const lang = language || "es";
    const cacheKey = `${signal.currencyPair}_${signal.action}_${signal.entryPrice}_${lang}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return new Response(JSON.stringify({ ...cached.data as object, cached: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const clean = signal.currencyPair.replace(/[^A-Z]/gi, "").toUpperCase();
    const baseCurrency = clean.slice(0, 3);
    const quoteCurrency = clean.slice(3, 6);
    const isJpy = signal.currencyPair.includes("JPY");
    const pipMultiplier = isJpy ? 100 : 10000;
    const tpPips = Math.abs((signal.takeProfit - signal.entryPrice) * pipMultiplier).toFixed(1);
    const slPips = Math.abs((signal.stopLoss - signal.entryPrice) * pipMultiplier).toFixed(1);
    const rrRatio = (Math.abs(signal.takeProfit - signal.entryPrice) / Math.abs(signal.stopLoss - signal.entryPrice)).toFixed(2);

    const langInstructions = lang === "es" ? "Responde SOLO en español." : lang === "pt" ? "Responde SOMENTE em português." : lang === "fr" ? "Répondez UNIQUEMENT en français." : "Respond ONLY in English.";

    const t0 = Date.now();
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: `You are a professional forex market analyst. Analyze the sentiment impact on individual currencies based on a trading signal. ${langInstructions}\nThe sentiment percentages must add up to exactly 100 for each currency.` },
          { role: "user", content: `Analyze the individual currency sentiment for this trading signal:\n\nPair: ${baseCurrency}/${quoteCurrency}\nAction: ${signal.action} (${signal.trend})\nEntry: ${signal.entryPrice}\nTake Profit: ${signal.takeProfit} (${tpPips} pips)\nStop Loss: ${signal.stopLoss} (${slPips} pips)\nR:R Ratio: ${rrRatio}\nProbability: ${signal.probability}%` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "currency_impact_analysis",
            description: "Return sentiment analysis for each currency in the pair",
            parameters: {
              type: "object",
              properties: {
                currencies: { type: "array", items: { type: "object", properties: { currency: { type: "string" }, positive: { type: "number" }, negative: { type: "number" }, neutral: { type: "number" }, reason: { type: "string" } }, required: ["currency", "positive", "negative", "neutral", "reason"], additionalProperties: false } },
              },
              required: ["currencies"], additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "currency_impact_analysis" } },
      }),
    });
    const latency = Date.now() - t0;

    if (!response.ok) {
      logUsage(response.status, latency, undefined, { pair: signal.currencyPair });
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const json = await response.json();
    logUsage(200, latency, json.usage, { pair: signal.currencyPair });

    const toolCall = json.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error("No tool call response from AI");

    const parsed = typeof toolCall.function.arguments === "string" ? JSON.parse(toolCall.function.arguments) : toolCall.function.arguments;

    const currencies = (parsed.currencies || []).map((c: any) => {
      const total = c.positive + c.negative + c.neutral;
      if (Math.abs(total - 100) > 2) {
        const factor = 100 / total;
        return { currency: c.currency, positive: Math.round(c.positive * factor), negative: Math.round(c.negative * factor), neutral: 100 - Math.round(c.positive * factor) - Math.round(c.negative * factor), reason: c.reason };
      }
      return c;
    });

    const result = { currencies, generatedAt: new Date().toISOString() };
    cache.set(cacheKey, { data: result, ts: Date.now() });
    if (cache.size > 100) { const oldest = cache.keys().next().value; if (oldest) cache.delete(oldest); }

    return new Response(JSON.stringify({ ...result, cached: false }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("currency-impact-ai error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
