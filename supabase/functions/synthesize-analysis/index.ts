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
    const { analyses, symbol, language, detailLevel, candles, indicators, previousResults } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const lang = language || "es";
    const detail = detailLevel || "standard";

    const langInstruction = lang === "es" ? "Responde en español." : lang === "en" ? "Respond in English." : lang === "pt" ? "Responda em português." : lang === "fr" ? "Réponds en français." : "Responde en español.";
    const detailInstruction = detail === "concise" ? "Sé muy breve y directo." : detail === "detailed" ? "Proporciona un análisis extenso y profundo." : "Sé conciso pero completo.";

    let prompt: string;

    if (analyses && analyses.length > 0) {
      // Legacy mode: explicit analyses array
      const analysisBlocks = analyses
        .map((a: { model: string; analysis: string }, i: number) => `### Análisis ${i + 1} — Modelo: ${a.model}\n${a.analysis}`)
        .join("\n\n---\n\n");

      prompt = `Eres un meta-analista técnico de Forex de élite. Se te proporcionan múltiples análisis del mismo activo (${symbol}) generados por diferentes modelos de IA. Tu trabajo es sintetizar todos en una **conclusión unificada y definitiva**.

${analysisBlocks}

---

**INSTRUCCIONES DE SÍNTESIS:**
1. **Consenso**: ¿En qué coinciden todos los modelos?
2. **Divergencias**: ¿Dónde discrepan? ¿Qué modelo tiene el argumento más sólido?
3. **Sesgo final**: Alcista / Bajista / Neutral — con nivel de confianza consolidado (%).
4. **Niveles clave**: Entrada, Stop Loss y Take Profit consensuados.
5. **Acción recomendada**: Una directriz clara y única basada en el consenso.
6. **Nivel de confianza**: Alto / Medio / Bajo — justificado por el grado de acuerdo entre modelos.

${langInstruction} ${detailInstruction} Formato markdown. Sé profesional y directo.`;
    } else if (previousResults || (candles && Array.isArray(candles))) {
      // AI Center mode: synthesize from previous module results or raw data
      const parts: string[] = [];

      if (previousResults) {
        for (const [moduleName, result] of Object.entries(previousResults)) {
          const data = (result as any)?.data;
          if (!data) continue;
          const content = typeof data === 'string' ? data :
            (data as any)?.analysis || (data as any)?.prediction || (data as any)?.report || JSON.stringify(data).substring(0, 2000);
          parts.push(`### Módulo: ${moduleName}\n${content}`);
        }
      }

      if (parts.length === 0 && candles) {
        // Fallback: generate synthesis from raw market data
        const recent = candles.slice(-20);
        const lastPrice = recent[recent.length - 1]?.close || 'N/A';
        const patternList = (indicators?.patterns || []).slice(0, 5).map((p: any) => `${p.name} (${p.type})`).join(", ") || "Ninguno";

        parts.push(`### Datos del mercado
- Activo: ${symbol}
- Precio actual: ${lastPrice}
- Velas: ${candles.length}
- Patrones: ${patternList}`);
      }

      const analysisBlocks = parts.join("\n\n---\n\n");

      prompt = `Eres un meta-analista técnico de Forex de élite. Se te proporcionan los resultados de múltiples módulos de análisis del activo ${symbol || 'desconocido'}. Tu trabajo es sintetizar todo en una **conclusión unificada y definitiva**.

${analysisBlocks}

---

**INSTRUCCIONES DE SÍNTESIS:**
1. **Resumen ejecutivo**: Conclusión principal en 2-3 líneas
2. **Consenso técnico**: ¿Qué indican la mayoría de los análisis?
3. **Sesgo final**: Alcista / Bajista / Neutral — con nivel de confianza (%)
4. **Niveles clave**: Soporte, resistencia, entrada sugerida, SL y TP
5. **Acción recomendada**: COMPRAR / VENDER / ESPERAR con justificación
6. **Riesgos principales**: Factores que podrían invalidar el análisis
7. **Nivel de confianza**: Alto / Medio / Bajo

${langInstruction} ${detailInstruction} Formato markdown. Sé profesional y directo.`;
    } else {
      return new Response(
        JSON.stringify({ error: "No analyses or data provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: `Eres un meta-analista que sintetiza múltiples análisis de IA en una conclusión definitiva. ${langInstruction} Sé preciso y profesional.` },
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
    const synthesis = data.choices?.[0]?.message?.content || "No se pudo generar la síntesis.";

    return new Response(JSON.stringify({ synthesis }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("synthesize-analysis error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
