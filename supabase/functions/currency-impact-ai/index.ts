import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// In-memory cache: key -> { data, ts }
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 60 * 60_000; // 60 minutes

interface SignalInput {
  currencyPair: string;
  action: string;
  trend: string;
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  probability: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { signal, language } = await req.json() as { signal: SignalInput; language?: string };

    if (!signal?.currencyPair) {
      return new Response(
        JSON.stringify({ error: "signal with currencyPair is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lang = language || "es";
    const cacheKey = `${signal.currencyPair}_${signal.action}_${signal.entryPrice}_${lang}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return new Response(JSON.stringify({ ...cached.data as object, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const clean = signal.currencyPair.replace(/[^A-Z]/gi, "").toUpperCase();
    const baseCurrency = clean.slice(0, 3);
    const quoteCurrency = clean.slice(3, 6);

    const isJpy = signal.currencyPair.includes("JPY");
    const pipMultiplier = isJpy ? 100 : 10000;
    const tpPips = Math.abs((signal.takeProfit - signal.entryPrice) * pipMultiplier).toFixed(1);
    const slPips = Math.abs((signal.stopLoss - signal.entryPrice) * pipMultiplier).toFixed(1);
    const rrRatio = (Math.abs(signal.takeProfit - signal.entryPrice) / Math.abs(signal.stopLoss - signal.entryPrice)).toFixed(2);

    const langInstructions = lang === "es"
      ? "Responde SOLO en español. Todos los campos de texto deben estar en español."
      : lang === "pt"
        ? "Responde SOMENTE em português. Todos os campos de texto devem estar em português."
        : lang === "fr"
          ? "Répondez UNIQUEMENT en français. Tous les champs de texte doivent être en français."
          : "Respond ONLY in English. All text fields must be in English.";

    const systemPrompt = `You are a professional forex market analyst. Analyze the sentiment impact on individual currencies based on a trading signal. ${langInstructions}

You must return a JSON response using the tool provided. Analyze how current market conditions, central bank policies, economic data, and geopolitical factors affect each currency individually.

The sentiment percentages (positive, negative, neutral) must add up to exactly 100 for each currency.
Each currency must have a brief "reason" explaining the main driver of its current sentiment.`;

    const userPrompt = `Analyze the individual currency sentiment for this trading signal:

Pair: ${baseCurrency}/${quoteCurrency}
Action: ${signal.action} (${signal.trend})
Entry: ${signal.entryPrice}
Take Profit: ${signal.takeProfit} (${tpPips} pips)
Stop Loss: ${signal.stopLoss} (${slPips} pips)  
R:R Ratio: ${rrRatio}
Probability: ${signal.probability}%

Provide sentiment analysis for each currency (${baseCurrency} and ${quoteCurrency}) considering:
- Current monetary policy stance
- Recent economic data trends
- Market positioning and flows
- Geopolitical factors
- Technical momentum alignment with the signal direction`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "currency_impact_analysis",
              description: "Return sentiment analysis for each currency in the pair",
              parameters: {
                type: "object",
                properties: {
                  currencies: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        currency: { type: "string", description: "3-letter currency code" },
                        positive: { type: "number", description: "Positive sentiment %" },
                        negative: { type: "number", description: "Negative sentiment %" },
                        neutral: { type: "number", description: "Neutral sentiment %" },
                        reason: { type: "string", description: "Brief reason for the sentiment (max 80 chars)" },
                      },
                      required: ["currency", "positive", "negative", "neutral", "reason"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["currencies"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "currency_impact_analysis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const json = await response.json();
    const toolCall = json.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error("No tool call response from AI");
    }

    const parsed = typeof toolCall.function.arguments === "string"
      ? JSON.parse(toolCall.function.arguments)
      : toolCall.function.arguments;

    // Validate and normalize percentages
    const currencies = (parsed.currencies || []).map((c: { currency: string; positive: number; negative: number; neutral: number; reason: string }) => {
      const total = c.positive + c.negative + c.neutral;
      if (Math.abs(total - 100) > 2) {
        // Normalize to 100
        const factor = 100 / total;
        return {
          currency: c.currency,
          positive: Math.round(c.positive * factor),
          negative: Math.round(c.negative * factor),
          neutral: 100 - Math.round(c.positive * factor) - Math.round(c.negative * factor),
          reason: c.reason,
        };
      }
      return c;
    });

    const result = { currencies, generatedAt: new Date().toISOString() };

    // Cache
    cache.set(cacheKey, { data: result, ts: Date.now() });
    if (cache.size > 100) {
      const oldest = cache.keys().next().value;
      if (oldest) cache.delete(oldest);
    }

    return new Response(JSON.stringify({ ...result, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("currency-impact-ai error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
