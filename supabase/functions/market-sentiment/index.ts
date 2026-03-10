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
    await supabaseAdmin.from('api_usage_logs').insert({
      function_name: 'market-sentiment', provider: 'lovable_ai', model: MODEL,
      response_status: status, latency_ms: latencyMs,
      tokens_input: usage?.prompt_tokens || 0, tokens_output: usage?.completion_tokens || 0,
      tokens_total: usage?.total_tokens || 0,
      estimated_cost: ((usage?.prompt_tokens || 0) * 0.15 + (usage?.completion_tokens || 0) * 0.6) / 1e6,
      metadata: meta || {},
    });
  } catch { /* fire-and-forget */ }
}

const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 15 * 60 * 1000;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { currencyPair, language = "es" } = await req.json();
    if (!currencyPair) return new Response(JSON.stringify({ error: "currencyPair is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const cacheKey = `${currencyPair}-${language}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return new Response(JSON.stringify({ ...cached.data, cached: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const langLabel = language === "es" ? "español" : language === "pt" ? "portugués" : language === "fr" ? "francés" : "inglés";
    const systemPrompt = `You are a professional financial analyst specializing in forex and currency markets. Respond ALWAYS in ${langLabel}.`;

    const userPrompt = `Generate a COMPLETE market sentiment analysis for the currency pair ${currencyPair}.

Combine all available intelligence:
1. **News sentiment** – Recent macro/geopolitical headlines affecting both currencies
2. **Technical analysis** – Estimated RSI, MACD, moving averages, key S/R levels
3. **Macro outlook** – Central bank policy stance, interest rate differentials, GDP/CPI trends
4. **Capital flow** – Estimated institutional vs retail positioning
5. **Trader recommendation** – Actionable bias (buy/sell/wait) with entry zones, risk management tips`;

    const t0 = Date.now();
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "market_sentiment_report",
            description: "Return a comprehensive market sentiment report with per-source scores and trader recommendations",
            parameters: {
              type: "object",
              properties: {
                currencyPair: { type: "string" },
                overallScore: { type: "number", description: "Overall sentiment -100 (very bearish) to +100 (very bullish)" },
                overallLabel: { type: "string", enum: ["Very Bullish", "Bullish", "Slightly Bullish", "Neutral", "Slightly Bearish", "Bearish", "Very Bearish"] },
                confidence: { type: "number", description: "Confidence 0-100" },
                riskLevel: { type: "string", enum: ["low", "moderate", "high", "extreme"] },
                sources: {
                  type: "object",
                  properties: {
                    news: { type: "object", properties: { score: { type: "number" }, label: { type: "string" }, detail: { type: "string" }, headlines: { type: "array", items: { type: "string" } } }, required: ["score", "label", "detail", "headlines"] },
                    technical: { type: "object", properties: { score: { type: "number" }, label: { type: "string" }, detail: { type: "string" }, indicators: { type: "object", properties: { rsi: { type: "number" }, macdSignal: { type: "string", enum: ["bullish", "bearish", "neutral"] }, trendStrength: { type: "string", enum: ["strong", "moderate", "weak"] }, smaAlignment: { type: "string", enum: ["bullish", "bearish", "mixed"] }, keySupport: { type: "number" }, keyResistance: { type: "number" } }, required: ["rsi", "macdSignal", "trendStrength", "smaAlignment", "keySupport", "keyResistance"] } }, required: ["score", "label", "detail", "indicators"] },
                    macro: { type: "object", properties: { score: { type: "number" }, label: { type: "string" }, detail: { type: "string" }, rateBase: { type: "string" }, rateQuote: { type: "string" } }, required: ["score", "label", "detail", "rateBase", "rateQuote"] },
                    flow: { type: "object", properties: { retailBullishPct: { type: "number" }, institutionalBullishPct: { type: "number" }, detail: { type: "string" } }, required: ["retailBullishPct", "institutionalBullishPct", "detail"] },
                  },
                  required: ["news", "technical", "macro", "flow"],
                },
                traderRecommendation: { type: "object", properties: { bias: { type: "string", enum: ["buy", "sell", "wait"] }, summary: { type: "string" }, entryZone: { type: "string" }, stopLoss: { type: "string" }, takeProfit: { type: "string" }, timeframe: { type: "string" } }, required: ["bias", "summary", "entryZone", "stopLoss", "takeProfit", "timeframe"] },
                keyDrivers: { type: "array", items: { type: "string" } },
              },
              required: ["currencyPair", "overallScore", "overallLabel", "confidence", "riskLevel", "sources", "traderRecommendation", "keyDrivers"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "market_sentiment_report" } },
      }),
    });
    const latency = Date.now() - t0;

    if (!response.ok) {
      logUsage(response.status, latency, undefined, { currencyPair });
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded, try again later" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await response.json();
    logUsage(200, latency, aiData.usage, { currencyPair });

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call in AI response");
      return new Response(JSON.stringify({ error: "Invalid AI response" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const result = JSON.parse(toolCall.function.arguments);
    result.generatedAt = new Date().toISOString();

    cache.set(cacheKey, { data: result, ts: Date.now() });
    if (cache.size > 100) { const now = Date.now(); for (const [k, v] of cache) { if (now - v.ts > CACHE_TTL) cache.delete(k); } }

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("market-sentiment error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
