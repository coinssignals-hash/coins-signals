import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { analyses, symbol, language, detailLevel, candles, indicators, previousResults, timeframe, trend, volatility } = body;

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

    // Collect all analysis blocks
    const parts: string[] = [];

    if (analyses && analyses.length > 0) {
      analyses.forEach((a: { model: string; analysis: string }, i: number) => {
        parts.push(`### Analysis ${i + 1} — Model: ${a.model}\n${a.analysis}`);
      });
    }

    if (previousResults) {
      for (const [moduleName, result] of Object.entries(previousResults)) {
        const data = (result as any)?.data;
        if (!data) continue;
        const content = typeof data === 'string' ? data :
          (data as any)?.analysis || (data as any)?.prediction || (data as any)?.report || JSON.stringify(data).substring(0, 2000);
        parts.push(`### Module: ${moduleName}\n${content}`);
      }
    }

    // Extract market context
    let lastPrice = "N/A";
    if (candles && Array.isArray(candles) && candles.length > 0) {
      const lastCandle = candles[candles.length - 1];
      lastPrice = lastCandle?.close?.toString() || "N/A";

      if (parts.length === 0) {
        const patternList = (indicators?.patterns || []).slice(0, 5).map((p: any) => `${p.name} (${p.type})`).join(", ") || "None";
        parts.push(`### Market Data\n- Asset: ${symbol}\n- Price: ${lastPrice}\n- Candles: ${candles.length}\n- Patterns: ${patternList}`);
      }
    }

    if (parts.length === 0) {
      return new Response(
        JSON.stringify({ error: "No analyses or data provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const analysisBlocks = parts.join("\n\n---\n\n");

    const prompt = `Act as an elite Forex meta-analyst.

**Asset:** ${symbol || "Unknown"}

**Market Context**
Timeframe: ${timeframe || "N/A"}
Price: ${lastPrice}
Trend: ${trend || "N/A"}
Volatility: ${volatility || "N/A"}

**AI Analyses**

${analysisBlocks}

---

Synthesize the analyses and provide:

• **Executive summary** (2–3 lines)
• **Technical consensus** between models
• **Main divergences**
• **Final bias** (Bullish / Bearish / Neutral) with confidence %
• **Key levels** (Support, Resistance, Entry, SL, TP)
• **Recommended action** (BUY / SELL / WAIT)
• **Main risks**
• **Confidence level** based on model agreement

${langInstruction} ${detailInstruction}

Markdown format.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: `You are an elite meta-analyst who synthesizes multiple AI analyses into a single definitive conclusion. ${langInstruction} Be precise and professional.` },
          { role: "user", content: prompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit reached." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const synthesis = data.choices?.[0]?.message?.content || "Unable to generate synthesis.";

    return new Response(JSON.stringify({ synthesis }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("synthesize-analysis error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
