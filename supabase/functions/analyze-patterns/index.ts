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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { patterns, symbol, lastPrice, support, resistance, rsi, macdHistogram, model, language, detailLevel } = await req.json();

    const lang = language || "es";
    const detail = detailLevel || "standard";
    const aiModel = model || "google/gemini-3-flash-preview";

    const langInstruction = lang === "es" ? "Responde en español." : lang === "en" ? "Respond in English." : lang === "pt" ? "Responda em português." : lang === "fr" ? "Réponds en français." : "Responde en español.";
    const detailInstruction = detail === "concise" ? "Sé muy breve y directo, máximo 3-4 líneas por sección." : detail === "detailed" ? "Proporciona un análisis extenso y profundo con múltiples escenarios." : "Sé conciso pero completo.";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!patterns || patterns.length === 0) {
      return new Response(
        JSON.stringify({ analysis: "No se detectaron patrones de velas recientes para analizar." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const patternList = patterns
      .map((p: any) => `- **${p.name}** (${p.type}, fiabilidad: ${p.reliability}): ${p.description}`)
      .join("\n");

    const contextLines = [
      `Par: ${symbol}`,
      `Precio actual: ${lastPrice}`,
      support ? `Soporte 24h: ${support}` : null,
      resistance ? `Resistencia 24h: ${resistance}` : null,
      rsi !== undefined ? `RSI(14): ${rsi.toFixed(1)}` : null,
      macdHistogram !== undefined ? `MACD Histograma: ${macdHistogram > 0 ? "positivo" : "negativo"}` : null,
    ].filter(Boolean).join(" | ");

    const prompt = `Eres un analista técnico de Forex profesional. Analiza los siguientes patrones de velas detectados algorítmicamente y proporciona un análisis contextualizado.

**Contexto del mercado:**
${contextLines}

**Patrones detectados (últimas 20 velas):**
${patternList}

Responde con:
1. **Resumen** (2-3 líneas): ¿Qué dicen los patrones en conjunto?
2. **Sesgo** (Alcista / Bajista / Neutral): ¿Hacia dónde apuntan?
3. **Confluencias**: ¿Los patrones se alinean con los indicadores (RSI, MACD, S/R)?
4. **Acción sugerida**: ¿Qué debería hacer un trader? (Esperar confirmación / Entrar / Salir)
5. **Riesgo**: Nivel de confianza (Alto/Medio/Bajo) y qué invalidaría el escenario.

${langInstruction} ${detailInstruction} Formato markdown.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          { role: "system", content: `Eres un analista técnico de Forex experto. ${langInstruction} Sé preciso y profesional.` },
          { role: "user", content: prompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de solicitudes alcanzado." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos agotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Error del gateway de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || "No se pudo generar el análisis.";

    return new Response(JSON.stringify({ analysis, patternCount: patterns.length }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-patterns error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
