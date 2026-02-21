import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 15 * 60_000; // 15 min

interface RequestBody {
  currency: string;
  newsItems?: { title: string; category: string; sentiment: string }[];
  months?: number;
}

interface CurrencyNewsSummary {
  currency: string;
  overallSentiment: "bullish" | "bearish" | "neutral";
  sentimentScore: number; // -100 to 100
  riskLevel: "low" | "medium" | "high";
  summary: string;
  keyDrivers: { driver: string; impact: "positive" | "negative" | "neutral"; weight: number }[];
  outlook: { shortTerm: string; mediumTerm: string; longTerm: string };
  relatedPairs: { pair: string; correlation: string; direction: string }[];
  recentNewsDigest: { title: string; impact: string; sentiment: string }[];
  monetaryPolicyBias: string;
  economicHealth: number; // 0-100
  volatilityExpectation: "low" | "moderate" | "high" | "extreme";
  cached: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    const { currency, newsItems, months = 3 } = body;

    if (!currency || currency.length !== 3) {
      return new Response(
        JSON.stringify({ error: "A valid 3-letter currency code is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cur = currency.toUpperCase();
    const newsKey = newsItems?.map(n => n.title.slice(0, 20)).join("|") || "general";
    const cacheKey = `${cur}:${newsKey}:${months}`;
    const hit = cache.get(cacheKey);
    if (hit && Date.now() - hit.ts < CACHE_TTL) {
      return new Response(JSON.stringify(hit.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY not configured");

    // Fetch recent signals involving this currency
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: signals } = await supabase
      .from("trading_signals")
      .select("currency_pair, action, trend, probability, entry_price, created_at")
      .or(`currency_pair.ilike.%${cur}%`)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(8);

    const signalCtx = signals?.length
      ? signals.map(s => `${s.currency_pair} ${s.action} ${s.trend} prob:${s.probability}%`).join("; ")
      : "No active signals";

    const newsCtx = newsItems?.length
      ? newsItems.map(n => `- [${n.category}] ${n.title} (${n.sentiment})`).join("\n")
      : "No specific news provided";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a senior FX macro analyst. Generate comprehensive currency impact summaries. All text output must be in Spanish. Always respond using the provided tool.`,
          },
          {
            role: "user",
            content: `Generate a detailed news impact summary for ${cur}.

Active signals context: ${signalCtx}

Recent news affecting ${cur}:
${newsCtx}

Provide: overall sentiment, risk level, key economic drivers with weights, short/medium/long term outlook, related pairs with correlations, monetary policy bias, economic health score, and volatility expectation.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "set_currency_summary",
              description: "Set detailed currency news impact summary",
              parameters: {
                type: "object",
                properties: {
                  overallSentiment: { type: "string", enum: ["bullish", "bearish", "neutral"] },
                  sentimentScore: { type: "number", description: "-100 to 100" },
                  riskLevel: { type: "string", enum: ["low", "medium", "high"] },
                  summary: { type: "string", description: "2-3 sentence summary in Spanish" },
                  keyDrivers: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        driver: { type: "string", description: "Driver name in Spanish" },
                        impact: { type: "string", enum: ["positive", "negative", "neutral"] },
                        weight: { type: "number", description: "0-100 importance weight" },
                      },
                      required: ["driver", "impact", "weight"],
                    },
                  },
                  outlook: {
                    type: "object",
                    properties: {
                      shortTerm: { type: "string", description: "1-2 weeks outlook in Spanish" },
                      mediumTerm: { type: "string", description: "1-3 months outlook in Spanish" },
                      longTerm: { type: "string", description: "3-12 months outlook in Spanish" },
                    },
                    required: ["shortTerm", "mediumTerm", "longTerm"],
                  },
                  relatedPairs: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        pair: { type: "string" },
                        correlation: { type: "string", description: "positive, negative, or neutral" },
                        direction: { type: "string", description: "Expected direction in Spanish" },
                      },
                      required: ["pair", "correlation", "direction"],
                    },
                  },
                  recentNewsDigest: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "News headline in Spanish" },
                        impact: { type: "string", description: "Brief impact description in Spanish" },
                        sentiment: { type: "string", enum: ["bullish", "bearish", "neutral"] },
                      },
                      required: ["title", "impact", "sentiment"],
                    },
                  },
                  monetaryPolicyBias: { type: "string", description: "Current central bank stance in Spanish" },
                  economicHealth: { type: "number", description: "0-100 score" },
                  volatilityExpectation: { type: "string", enum: ["low", "moderate", "high", "extreme"] },
                },
                required: [
                  "overallSentiment", "sentimentScore", "riskLevel", "summary",
                  "keyDrivers", "outlook", "relatedPairs", "recentNewsDigest",
                  "monetaryPolicyBias", "economicHealth", "volatilityExpectation",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "set_currency_summary" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[news-currency-summary] AI error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const aiJson = await response.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error("No data generated");

    const ai = JSON.parse(toolCall.function.arguments);

    const result: CurrencyNewsSummary = {
      currency: cur,
      overallSentiment: ai.overallSentiment,
      sentimentScore: ai.sentimentScore,
      riskLevel: ai.riskLevel,
      summary: ai.summary,
      keyDrivers: ai.keyDrivers || [],
      outlook: ai.outlook,
      relatedPairs: ai.relatedPairs || [],
      recentNewsDigest: ai.recentNewsDigest || [],
      monetaryPolicyBias: ai.monetaryPolicyBias,
      economicHealth: ai.economicHealth,
      volatilityExpectation: ai.volatilityExpectation,
      cached: false,
    };

    cache.set(cacheKey, { data: { ...result, cached: true }, ts: Date.now() });
    if (cache.size > 80) {
      const oldest = cache.keys().next().value;
      if (oldest) cache.delete(oldest);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[news-currency-summary] Error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
