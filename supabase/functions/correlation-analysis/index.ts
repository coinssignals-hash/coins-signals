import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODEL = "google/gemini-3-flash-preview";
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function logUsage(
  status: number,
  latencyMs: number,
  usage?: any,
  meta?: Record<string, unknown>
) {
  try {
    await supabaseAdmin.from("api_usage_logs").insert({
      function_name: "correlation-analysis",
      provider: "lovable_ai",
      model: MODEL,
      response_status: status,
      latency_ms: latencyMs,
      tokens_input: usage?.prompt_tokens || 0,
      tokens_output: usage?.completion_tokens || 0,
      tokens_total: usage?.total_tokens || 0,
      estimated_cost:
        ((usage?.prompt_tokens || 0) * 0.15 +
          (usage?.completion_tokens || 0) * 0.6) /
        1e6,
      metadata: meta || {},
    });
  } catch {
    /* fire-and-forget */
  }
}

// Default correlated pairs for common instruments
const CORRELATION_MAP: Record<string, string[]> = {
  "EUR/USD": ["GBP/USD", "USD/CHF", "USD/JPY", "AUD/USD", "DXY"],
  "GBP/USD": ["EUR/USD", "EUR/GBP", "GBP/JPY", "AUD/USD"],
  "USD/JPY": ["EUR/JPY", "GBP/JPY", "EUR/USD", "XAU/USD"],
  "AUD/USD": ["NZD/USD", "EUR/USD", "USD/CAD", "XAU/USD"],
  "USD/CHF": ["EUR/USD", "EUR/CHF", "GBP/USD", "USD/JPY"],
  "XAU/USD": ["USD/JPY", "EUR/USD", "DXY", "US10Y"],
  "EUR/GBP": ["EUR/USD", "GBP/USD", "EUR/JPY", "GBP/JPY"],
  "NZD/USD": ["AUD/USD", "AUD/NZD", "EUR/USD", "USD/CAD"],
  "USD/CAD": ["WTI", "AUD/USD", "NZD/USD", "EUR/USD"],
  "EUR/JPY": ["USD/JPY", "EUR/USD", "GBP/JPY", "AUD/JPY"],
  "GBP/JPY": ["USD/JPY", "GBP/USD", "EUR/JPY", "AUD/JPY"],
};

function getCorrelatedPairs(symbol: string): string[] {
  const normalized = symbol.toUpperCase().replace("_", "/");
  return CORRELATION_MAP[normalized] || ["EUR/USD", "GBP/USD", "USD/JPY", "XAU/USD"];
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const {
      symbol,
      candles,
      indicators,
      correlatedPairs,
      language,
      detailLevel,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!symbol) {
      return new Response(
        JSON.stringify({ error: "Symbol is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const lang = language || "es";
    const detail = detailLevel || "standard";
    const pairs = correlatedPairs || getCorrelatedPairs(symbol);

    const langInstruction =
      lang === "es"
        ? "Responde en español."
        : lang === "en"
        ? "Respond in English."
        : lang === "pt"
        ? "Responda em português."
        : lang === "fr"
        ? "Réponds en français."
        : "Responde en español.";

    const detailInstruction =
      detail === "concise"
        ? "Sé muy breve y directo."
        : detail === "detailed"
        ? "Proporciona un análisis extenso y profundo con datos históricos."
        : "Sé conciso pero completo.";

    // Extract market context from candles/indicators
    let marketContext = "";
    if (candles && Array.isArray(candles) && candles.length > 0) {
      const recent = candles.slice(-30);
      const lastCandle = recent[recent.length - 1];
      const lastPrice = lastCandle?.close || lastCandle?.open || "N/A";
      const high = Math.max(...recent.map((c: any) => c.high || c.close || 0));
      const low = Math.min(
        ...recent.map((c: any) => c.low || c.close || Infinity)
      );

      const rsi = indicators?.rsi;
      const lastRsi = Array.isArray(rsi) ? rsi[rsi.length - 1] : rsi;

      marketContext = `
**Datos del activo principal (${symbol}):**
- Precio actual: ${lastPrice}
- Rango reciente: ${low.toFixed(5)} — ${high.toFixed(5)}
- Velas analizadas: ${candles.length}
${lastRsi !== undefined ? `- RSI(14): ${typeof lastRsi === "number" ? lastRsi.toFixed(1) : lastRsi}` : ""}
`;
    }

    const prompt = `Eres un analista cuantitativo de élite especializado en correlaciones entre instrumentos financieros, análisis inter-mercado y flujos de capital global.

**Activo principal:** ${symbol}
**Pares correlacionados a analizar:** ${pairs.join(", ")}
${marketContext}

Realiza un análisis de correlación exhaustivo:

## 1. 🔗 Matriz de Correlación
Para cada par correlacionado con ${symbol}:
- Tipo de correlación: Positiva / Negativa / Neutral
- Fuerza estimada: Fuerte (>0.7) / Moderada (0.4-0.7) / Débil (<0.4)
- Estabilidad: ¿La correlación ha sido estable o se ha roto recientemente?

## 2. 📊 Análisis de Divergencias
- ¿Hay divergencias actuales entre ${symbol} y sus pares correlacionados?
- Si ${symbol} se mueve en una dirección pero un par correlacionado no sigue, identifica la divergencia
- Evalúa si la divergencia sugiere una oportunidad de reversión o continuación

## 3. 🌐 Flujos Inter-Mercado
- ¿Cómo están fluyendo los capitales entre mercados relacionados?
- Identifica si hay rotación sectorial o cambios en el apetito de riesgo
- Analiza la relación con índices de referencia (DXY, VIX si aplica)

## 4. ⚡ Señales de Convergencia/Divergencia
- Pares que están convergiendo (la correlación se fortalece)
- Pares que están divergiendo (la correlación se debilita)
- Implicaciones para el trading de ${symbol}

## 5. 🎯 Oportunidades de Trading por Correlación
- **Trades de convergencia**: Si dos pares correlacionados divergen, apuesta por la reversión a la media
- **Trades de confirmación**: Si la correlación confirma la dirección, usa como señal adicional
- **Hedging**: Pares óptimos para cubrir posiciones en ${symbol}

## 6. 📈 Conclusión y Scoring
- **Correlation Score**: Puntuación global de la salud de las correlaciones (1-100)
- **Señal dominante**: ¿Las correlaciones apoyan COMPRA, VENTA o NEUTRAL?
- **Confianza**: Baja / Media / Alta
- **Pares clave a monitorear**: Los 2-3 más relevantes ahora mismo

${langInstruction} ${detailInstruction} Usa markdown con emojis. Sé profesional y directo.`;

    const t0 = Date.now();
    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            {
              role: "system",
              content: `Eres un analista cuantitativo especializado en correlaciones inter-mercado, análisis de flujos de capital y estrategias de pairs trading. ${langInstruction} Proporcionas análisis detallados basados en relaciones históricas entre instrumentos.`,
            },
            { role: "user", content: prompt },
          ],
          stream: false,
        }),
      }
    );
    const latency = Date.now() - t0;

    if (!response.ok) {
      logUsage(response.status, latency, undefined, { symbol });
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de solicitudes alcanzado." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos agotados." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Error del gateway de IA" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    logUsage(200, latency, data.usage, { symbol, correlatedPairs: pairs });

    const analysis =
      data.choices?.[0]?.message?.content ||
      "No se pudo generar el análisis de correlación.";

    return new Response(
      JSON.stringify({ analysis, correlatedPairs: pairs }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("correlation-analysis error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Error desconocido",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
