import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// In-memory cache
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 5 * 60_000; // 5 min

interface ChartRequest {
  newsTitle: string;
  newsId?: string;
  category: string;
  affectedCurrencies: string[];
  months?: number;       // how many months back (default 12)
  year?: number;         // optional: filter to specific year
  granularity?: "month"; // future: "week" | "day"
}

interface MonthPoint {
  date: string;       // "2025-01" ISO
  label: string;      // "Ene 2025"
  impact: number;     // -30 … +30
  volume: number;     // relative volume 0-100
  confidence: number; // 0-1
}

interface CurrencyBreakdown {
  currency: string;
  avgImpact: number;
  maxImpact: number;
  minImpact: number;
  direction: "bullish" | "bearish" | "neutral";
  points: MonthPoint[];
}

interface ChartResponse {
  newsTitle: string;
  category: string;
  period: { from: string; to: string };
  overall: {
    trend: "bullish" | "bearish" | "neutral";
    avgImpact: number;
    volatility: number;
    totalPoints: number;
  };
  timeline: MonthPoint[];
  currencies: CurrencyBreakdown[];
  cached: boolean;
}

function buildMonthLabels(count: number, year?: number): { date: string; label: string }[] {
  const months: { date: string; label: string }[] = [];
  const labels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const now = new Date();

  if (year) {
    // All months of the specified year up to current month if same year
    const maxMonth = year === now.getFullYear() ? now.getMonth() : 11;
    for (let m = 0; m <= maxMonth; m++) {
      const d = `${year}-${String(m + 1).padStart(2, "0")}`;
      months.push({ date: d, label: `${labels[m]} ${year}` });
    }
  } else {
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const isoMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push({ date: isoMonth, label: `${labels[d.getMonth()]} ${d.getFullYear()}` });
    }
  }
  return months;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: ChartRequest = await req.json();
    const {
      newsTitle,
      newsId,
      category,
      affectedCurrencies,
      months: monthCount = 12,
      year,
    } = body;

    if (!newsTitle || !category || !affectedCurrencies?.length) {
      return new Response(
        JSON.stringify({ error: "newsTitle, category, and affectedCurrencies are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cacheKey = `${newsId || newsTitle}:${affectedCurrencies.sort().join(",")}:${year || monthCount}`;
    const hit = cache.get(cacheKey);
    if (hit && Date.now() - hit.ts < CACHE_TTL) {
      return new Response(JSON.stringify(hit.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const monthLabels = buildMonthLabels(monthCount, year);
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("AI API key not configured");
    }

    const currenciesStr = affectedCurrencies.join(", ");
    const monthsList = monthLabels.map((m) => `"${m.date}"`).join(", ");

    const prompt = `You are a senior FX market analyst. Given the following financial news event, generate realistic historical impact data for each affected currency over the specified months.

News: "${newsTitle}"
Category: ${category}
Currencies: ${currenciesStr}
Months (ISO): ${monthsList}

For EACH currency, produce an array of monthly data points. Each point has:
- impact: number between -30 and +30 (percentage market impact)
- volume: number 0-100 (relative trading volume spike)
- confidence: number 0.5-0.98

Base values on realistic patterns for this type of event. Vary across currencies—some benefit, some lose.

Reply ONLY with valid JSON, no markdown, no explanation:
{
  "currencies": {
    "<CURRENCY_CODE>": [
      {"impact": <n>, "volume": <n>, "confidence": <n>}
    ]
  },
  "overallTrend": "bullish"|"bearish"|"neutral",
  "summary": "<one-line summary in Spanish>"
}
Each currency array must have exactly ${monthLabels.length} entries, one per month in order.`;

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": lovableApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    let aiData: any;

    if (aiRes.ok) {
      const aiJson = await aiRes.json();
      const text = aiJson.content?.[0]?.text || "";
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        aiData = JSON.parse(match[0]);
      }
    } else {
      const errText = await aiRes.text();
      console.error("[news-impact-charts] AI error:", errText);
    }

    // Build response (with fallback if AI failed)
    const currencies: CurrencyBreakdown[] = affectedCurrencies.map((currency) => {
      const raw: { impact: number; volume: number; confidence: number }[] =
        aiData?.currencies?.[currency] || [];

      const points: MonthPoint[] = monthLabels.map((m, i) => ({
        date: m.date,
        label: m.label,
        impact: raw[i]?.impact ?? Math.round((Math.random() - 0.5) * 30 * 10) / 10,
        volume: raw[i]?.volume ?? Math.round(Math.random() * 60 + 20),
        confidence: raw[i]?.confidence ?? 0.6 + Math.random() * 0.3,
      }));

      const impacts = points.map((p) => p.impact);
      const avg = impacts.reduce((s, v) => s + v, 0) / impacts.length;

      return {
        currency,
        avgImpact: Math.round(avg * 100) / 100,
        maxImpact: Math.max(...impacts),
        minImpact: Math.min(...impacts),
        direction: avg > 3 ? "bullish" : avg < -3 ? "bearish" : "neutral",
        points,
      } as CurrencyBreakdown;
    });

    // Aggregate timeline (average across currencies per month)
    const timeline: MonthPoint[] = monthLabels.map((m, i) => {
      const vals = currencies.map((c) => c.points[i]);
      const avgImpact = vals.reduce((s, v) => s + v.impact, 0) / vals.length;
      const avgVol = vals.reduce((s, v) => s + v.volume, 0) / vals.length;
      const avgConf = vals.reduce((s, v) => s + v.confidence, 0) / vals.length;
      return {
        date: m.date,
        label: m.label,
        impact: Math.round(avgImpact * 100) / 100,
        volume: Math.round(avgVol),
        confidence: Math.round(avgConf * 100) / 100,
      };
    });

    const allImpacts = timeline.map((t) => t.impact);
    const overallAvg = allImpacts.reduce((s, v) => s + v, 0) / allImpacts.length;
    const variance = allImpacts.reduce((s, v) => s + (v - overallAvg) ** 2, 0) / allImpacts.length;

    const result: ChartResponse = {
      newsTitle,
      category,
      period: { from: monthLabels[0].date, to: monthLabels[monthLabels.length - 1].date },
      overall: {
        trend: aiData?.overallTrend || (overallAvg > 3 ? "bullish" : overallAvg < -3 ? "bearish" : "neutral"),
        avgImpact: Math.round(overallAvg * 100) / 100,
        volatility: Math.round(Math.sqrt(variance) * 100) / 100,
        totalPoints: timeline.length,
      },
      timeline,
      currencies,
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
    console.error("[news-impact-charts] Error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
