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
    const { symbol, lastPrice, support, resistance, patterns, rsi, macdHistogram, stochastic, selectedSignals, model, language, detailLevel } = await req.json();

    const lang = language || "es";
    const detail = detailLevel || "standard";
    const aiModel = model || "google/gemini-3-flash-preview";

    const langInstruction = lang === "es" ? "Responde en español." : lang === "en" ? "Respond in English." : lang === "pt" ? "Responda em português." : lang === "fr" ? "Réponds en français." : "Responde en español.";
    const detailInstruction = detail === "concise" ? "Sé muy breve y directo, máximo 2-3 líneas por señal." : detail === "detailed" ? "Proporciona análisis extenso con múltiples escenarios por señal." : "Sé conciso pero completo.";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const patternList = (patterns || [])
      .map((p: any) => `- ${p.name} (${p.type}, fiabilidad: ${p.reliability})`)
      .join("\n") || "Ninguno detectado";

    const allSignals: Record<number, string> = {
      1: `## 1. 📡 Señal de acumulación por influencers\nDetecta cuando traders respetados empiezan a mencionar este activo repetidamente sin hacer hype.`,
      2: `## 2. 🔄 Alerta de giro de bajista a alcista\nEncuentra indicios donde cuentas históricamente bajistas se han vuelto neutrales o alcistas.`,
      3: `## 3. 🔍 Descubrimiento de catalizador oculto\nEscanea menciones sutiles de catalizadores próximos que no aparecen en noticias mainstream.`,
      4: `## 4. 🗣️ Escaneo de lenguaje insider\nAnaliza publicaciones que mencionen momentum o carga de trabajo relacionada con este activo.`,
      5: `## 5. 📊 Volumen sin noticias\nIdentifica volumen de trading inusual sin noticias importantes. Busca divergencias.`,
      6: `## 6. 🔀 Señal temprana de rotación sectorial\nDetecta charlas que sugieran que el capital se mueve hacia el sector de este activo.`,
      7: `## 7. 🎯 Análisis de susurros previos a ganancias\nAnaliza discusiones previas a resultados para extraer expectativas reales vs consenso.`,
      8: `## 8. ⚠️ Señal de salida de trade aglomerado\nEncuentra si el sentimiento alcista se está volviendo repetitivo o excesivamente confiado.`,
      9: `## 9. 💰 Rastro de dinero inteligente en small-caps\nIdentifica si este activo está siendo discutido por analistas de hedge funds o expertos.`,
      10: `## 10. 😰 Escaneo de compresión de miedo\nEncuentra si el lenguaje de miedo está disminuyendo aunque el precio no se haya movido.`,
    };

    const ids: number[] = Array.isArray(selectedSignals) && selectedSignals.length > 0
      ? selectedSignals.sort((a: number, b: number) => a - b)
      : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    const selectedSections = ids.map((id: number) => allSignals[id]).filter(Boolean).join("\n\n");

    const prompt = `Eres un analista de inteligencia de mercado especializado en señales alternativas, sentimiento social y flujos de capital.

**Activo:** ${symbol}
**Precio actual:** ${lastPrice}
**Soporte 24h:** ${support || "N/A"}
**Resistencia 24h:** ${resistance || "N/A"}

**Indicadores técnicos:**
${rsi !== undefined ? `- RSI(14): ${rsi.toFixed(1)}` : "- RSI: N/A"}
${macdHistogram !== undefined ? `- MACD Histograma: ${macdHistogram.toFixed(5)}` : "- MACD: N/A"}
${stochastic !== undefined ? `- Estocástico K: ${stochastic.toFixed(1)}` : "- Estocástico: N/A"}

**Patrones de velas:**
${patternList}

Responde cada punto con análisis específico:

${selectedSections}

---
**CONCLUSIÓN FINAL**: Resume las señales más fuertes, sesgo general, nivel de confianza y acción recomendada con niveles de entrada, SL y TP.

${langInstruction} ${detailInstruction} Usa markdown.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          { role: "system", content: `Eres un analista de inteligencia de mercado especializado en señales alternativas y análisis técnico avanzado. ${langInstruction}` },
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
    const prediction = data.choices?.[0]?.message?.content || "No se pudo generar la predicción.";

    return new Response(JSON.stringify({ prediction }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("predict-signals error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
