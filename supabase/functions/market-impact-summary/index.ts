import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// In-memory cache
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 10 * 60_000; // 10 min

interface RequestBody {
  currencyPair: string;
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  action: string;
  trend: string;
  months?: number;
}

interface MonthPoint {
  date: string;
  label: string;
  impact: number;
  volume: number;
  sentiment: number; // -1 to 1
}

interface CurrencySummary {
  currency: string;
  direction: "bullish" | "bearish" | "neutral";
  strength: number; // 0-100
  avgImpact: number;
  maxImpact: number;
  minImpact: number;
  keyDrivers: string[];
  points: MonthPoint[];
}

interface SummaryResponse {
  currencyPair: string;
  period: { from: string; to: string };
  overall: {
    trend: "bullish" | "bearish" | "neutral";
    confidence: number;
    summary: string;
    riskLevel: "low" | "medium" | "high";
  };
  base: CurrencySummary;
  quote: CurrencySummary;
  correlation: number; // -1 to 1
  cached: boolean;
}

function buildMonthLabels(count: number): { date: string; label: string }[] {
  const labels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const now = new Date();
  const months: { date: string; label: string }[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push({ date: iso, label: `${labels[d.getMonth()]} ${d.getFullYear()}` });
  }
  return months;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    const { currencyPair, entryPrice, takeProfit, stopLoss, action, trend, months: monthCount = 6 } = body;

    if (!currencyPair || !entryPrice) {
      return new Response(
        JSON.stringify({ error: "currencyPair and entryPrice are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse currencies
    const clean = currencyPair.replace(/[^A-Z]/gi, "").toUpperCase();
    const base = clean.slice(0, 3);
    const quote = clean.slice(3, 6);

    const cacheKey = `${base}${quote}:${entryPrice}:${action}:${monthCount}`;
    const hit = cache.get(cacheKey);
    if (hit && Date.now() - hit.ts < CACHE_TTL) {
      return new Response(JSON.stringify(hit.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const monthLabels = buildMonthLabels(monthCount);
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Fetch recent signals for context
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const pairs = [`${base}/${quote}`, `${base}${quote}`];
    const { data: recentSignals } = await supabase
      .from("trading_signals")
      .select("action, trend, probability, entry_price, take_profit, stop_loss, created_at")
      .in("currency_pair", pairs)
      .order("created_at", { ascending: false })
      .limit(5);

    const signalContext = recentSignals?.length
      ? `\nRecent signals for context:\n${recentSignals.map(s => 
          `- ${s.action} @ ${s.entry_price}, TP: ${s.take_profit}, SL: ${s.stop_loss}, prob: ${s.probability}%, trend: ${s.trend}`
        ).join("\n")}`
      : "";

    const monthsList = monthLabels.map(m => m.date).join(", ");

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
            content: `You are a senior FX market analyst. Generate realistic summarized market impact data for currency pairs. Always respond using the provided tool. Data should reflect realistic FX market behavior patterns.`,
          },
          {
            role: "user",
            content: `Analyze market impact for ${base}/${quote}:
- Current signal: ${action} @ ${entryPrice}, TP: ${takeProfit}, SL: ${stopLoss}
- Trend: ${trend}
- Months to analyze: ${monthsList}
${signalContext}

Generate historical impact data for both ${base} and ${quote} individually, with monthly granularity.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "set_market_impact",
              description: "Set summarized market impact data with historical chart points",
              parameters: {
                type: "object",
                properties: {
                  overallTrend: { type: "string", enum: ["bullish", "bearish", "neutral"] },
                  confidence: { type: "number", description: "0-100 confidence in the overall trend" },
                  summary: { type: "string", description: "One-line summary in Spanish of the market outlook" },
                  riskLevel: { type: "string", enum: ["low", "medium", "high"] },
                  correlation: { type: "number", description: "Correlation between base and quote (-1 to 1)" },
                  baseCurrency: {
                    type: "object",
                    properties: {
                      direction: { type: "string", enum: ["bullish", "bearish", "neutral"] },
                      strength: { type: "number", description: "0-100 strength score" },
                      keyDrivers: { type: "array", items: { type: "string" }, description: "2-3 key drivers in Spanish" },
                      points: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            impact: { type: "number", description: "Impact percentage -30 to +30" },
                            volume: { type: "number", description: "Relative volume 0-100" },
                            sentiment: { type: "number", description: "Sentiment -1 to 1" },
                          },
                          required: ["impact", "volume", "sentiment"],
                        },
                      },
                    },
                    required: ["direction", "strength", "keyDrivers", "points"],
                  },
                  quoteCurrency: {
                    type: "object",
                    properties: {
                      direction: { type: "string", enum: ["bullish", "bearish", "neutral"] },
                      strength: { type: "number", description: "0-100 strength score" },
                      keyDrivers: { type: "array", items: { type: "string" }, description: "2-3 key drivers in Spanish" },
                      points: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            impact: { type: "number", description: "Impact percentage -30 to +30" },
                            volume: { type: "number", description: "Relative volume 0-100" },
                            sentiment: { type: "number", description: "Sentiment -1 to 1" },
                          },
                          required: ["impact", "volume", "sentiment"],
                        },
                      },
                    },
                    required: ["direction", "strength", "keyDrivers", "points"],
                  },
                },
                required: ["overallTrend", "confidence", "summary", "riskLevel", "correlation", "baseCurrency", "quoteCurrency"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "set_market_impact" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[market-impact-summary] AI error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const aiJson = await response.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No data generated");
    }

    const ai = JSON.parse(toolCall.function.arguments);

    // Build currency summaries
    const buildSummary = (currency: string, data: any): CurrencySummary => {
      const rawPoints = data.points || [];
      const points: MonthPoint[] = monthLabels.map((m, i) => ({
        date: m.date,
        label: m.label,
        impact: rawPoints[i]?.impact ?? 0,
        volume: rawPoints[i]?.volume ?? 50,
        sentiment: rawPoints[i]?.sentiment ?? 0,
      }));
      const impacts = points.map(p => p.impact);
      const avg = impacts.reduce((s, v) => s + v, 0) / (impacts.length || 1);
      return {
        currency,
        direction: data.direction || "neutral",
        strength: data.strength || 50,
        avgImpact: Math.round(avg * 100) / 100,
        maxImpact: Math.max(...impacts),
        minImpact: Math.min(...impacts),
        keyDrivers: data.keyDrivers || [],
        points,
      };
    };

    const result: SummaryResponse = {
      currencyPair: `${base}/${quote}`,
      period: { from: monthLabels[0].date, to: monthLabels[monthLabels.length - 1].date },
      overall: {
        trend: ai.overallTrend,
        confidence: ai.confidence,
        summary: ai.summary,
        riskLevel: ai.riskLevel,
      },
      base: buildSummary(base, ai.baseCurrency),
      quote: buildSummary(quote, ai.quoteCurrency),
      correlation: ai.correlation,
      cached: false,
    };

    cache.set(cacheKey, { data: { ...result, cached: true }, ts: Date.now() });
    if (cache.size > 100) {
      const oldest = cache.keys().next().value;
      if (oldest) cache.delete(oldest);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[market-impact-summary] Error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
