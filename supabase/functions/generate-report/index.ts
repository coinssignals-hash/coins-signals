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
    const [i, o] = [0.15, 0.6];
    await supabaseAdmin.from('api_usage_logs').insert({
      function_name: 'generate-report', provider: 'lovable_ai', model: MODEL,
      response_status: status, latency_ms: latencyMs,
      tokens_input: usage?.prompt_tokens || 0, tokens_output: usage?.completion_tokens || 0,
      tokens_total: usage?.total_tokens || 0,
      estimated_cost: ((usage?.prompt_tokens || 0) * i + (usage?.completion_tokens || 0) * o) / 1e6,
      metadata: meta || {},
    });
  } catch { /* fire-and-forget */ }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { signal, patterns, marketContext, symbol, candles, indicators, language, detailLevel } = body;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const lang = language || "es";
    const detail = detailLevel || "standard";
    const langInstruction = lang === "es" ? "Responde en español." : lang === "en" ? "Respond in English." : lang === "pt" ? "Responda em português." : lang === "fr" ? "Réponds en français." : lang === "it" ? "Rispondi in italiano." : lang === "de" ? "Antworte auf Deutsch." : lang === "nl" ? "Antwoord in het Nederlands." : lang === "ar" ? "أجب باللغة العربية." : lang === "mt" ? "Wieġeb bil-Malti." : "Responde en español.";
    const detailInstruction = detail === "concise" ? "Sé muy breve y directo, máximo 2-3 líneas por sección." : detail === "detailed" ? "Proporciona un análisis extenso y profundo con múltiples escenarios." : "Sé conciso pero completo.";

    let prompt: string;

    if (signal) {
      // Legacy mode: called with a specific signal object
      const patternList = (patterns || []).map((p: any) => `- ${p.name} (${p.type}, ${p.reliability})`).join("\n") || "Ninguno relevante";

      prompt = `Eres un analista técnico profesional de Forex. Genera un reporte detallado de la siguiente señal de trading.

**Señal:** ${signal.direction} ${symbol}
**Entry:** ${signal.entry}
**Stop Loss:** ${signal.stopLoss} (${signal.pipsRisk?.toFixed(1) || 'N/A'} pips)
**Take Profit:** ${signal.takeProfit} (${signal.pipsReward?.toFixed(1) || 'N/A'} pips)
**Risk/Reward:** 1:${signal.riskReward?.toFixed(2) || 'N/A'}
**Confianza:** ${signal.confidence}%
**Fuerza:** ${signal.strength}

**Contexto del mercado:**
- Tendencia: ${marketContext?.trend || 'N/A'}
- Volatilidad: ${marketContext?.volatility || 'N/A'}
${marketContext?.rsi !== undefined ? `- RSI(14): ${marketContext.rsi.toFixed(1)}` : ""}
${marketContext?.macdBias ? `- MACD Sesgo: ${marketContext.macdBias}` : ""}

**Razones de la señal:**
${(signal.reasons || []).map((r: string) => `- ${r}`).join("\n")}

**Patrones de velas:**
${patternList}

Genera un reporte profesional en español con:
1. **📊 Análisis de la señal**: Validez y contexto
2. **🎯 Niveles clave**: Confirma o ajusta Entry/SL/TP
3. **⚠️ Riesgos**: Factores que podrían invalidar la señal
4. **📈 Escenarios**: Mejor caso, caso base, peor caso
5. **✅ Recomendación**: Ejecutar / Esperar / Evitar + gestión de posición sugerida

Sé conciso, profesional y directo. ${langInstruction} ${detailInstruction} Usa markdown.`;
    } else if (candles && Array.isArray(candles)) {
      // AI Center mode: called with raw candles + indicators
      const recent = candles.slice(-30);
      const lastCandle = recent[recent.length - 1];
      const lastPrice = lastCandle?.close || lastCandle?.open || 'N/A';
      const high24 = Math.max(...recent.map((c: any) => c.high || c.close || 0));
      const low24 = Math.min(...recent.map((c: any) => c.low || c.close || Infinity));

      const patternList = (indicators?.patterns || [])
        .slice(0, 10)
        .map((p: any) => `- ${p.name} (${p.type}, fiabilidad: ${p.reliability})`)
        .join("\n") || "Ninguno detectado";

      const rsi = indicators?.rsi;
      const lastRsi = Array.isArray(rsi) ? rsi[rsi.length - 1] : rsi;
      const ema20 = indicators?.ema20;
      const lastEma20 = Array.isArray(ema20) ? ema20[ema20.length - 1] : ema20;
      const ema50 = indicators?.ema50;
      const lastEma50 = Array.isArray(ema50) ? ema50[ema50.length - 1] : ema50;

      prompt = `Eres un analista técnico profesional de Forex. Genera un reporte técnico completo del activo ${symbol || 'desconocido'}.

**Datos del mercado:**
- Precio actual: ${lastPrice}
- Máximo reciente: ${high24}
- Mínimo reciente: ${low24}
- Velas analizadas: ${candles.length}

**Indicadores técnicos:**
${lastRsi !== undefined ? `- RSI(14): ${typeof lastRsi === 'number' ? lastRsi.toFixed(1) : lastRsi}` : '- RSI: N/A'}
${lastEma20 !== undefined ? `- EMA(20): ${typeof lastEma20 === 'number' ? lastEma20.toFixed(5) : lastEma20}` : ''}
${lastEma50 !== undefined ? `- EMA(50): ${typeof lastEma50 === 'number' ? lastEma50.toFixed(5) : lastEma50}` : ''}

**Patrones de velas detectados:**
${patternList}

Genera un reporte profesional en español con:
1. **📊 Resumen del mercado**: Estado actual, tendencia dominante y momentum
2. **🎯 Niveles clave**: Soporte, resistencia, y zonas de interés
3. **📈 Análisis técnico**: Interpretación de indicadores y patrones
4. **⚠️ Riesgos**: Factores a vigilar que podrían cambiar el escenario
5. **📈 Escenarios**: Mejor caso (alcista), caso base (neutral), peor caso (bajista) con probabilidades
6. **✅ Recomendación**: Sesgo operativo (COMPRA / VENTA / ESPERAR) con niveles sugeridos de entrada, SL y TP

Sé conciso, profesional y directo. ${langInstruction} ${detailInstruction} Usa markdown.`;
    } else {
      return new Response(JSON.stringify({ error: "No signal or candles provided" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const t0 = Date.now();
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: `Eres un analista de trading Forex profesional. ${langInstruction} Genera reportes concisos y accionables.` },
          { role: "user", content: prompt },
        ],
        stream: false,
      }),
    });
    const latency = Date.now() - t0;

    if (!response.ok) {
      logUsage(response.status, latency, undefined, { symbol });
      if (response.status === 429) return new Response(JSON.stringify({ error: "Límite de solicitudes alcanzado." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Créditos agotados." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Error del gateway de IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    logUsage(200, latency, data.usage, { symbol });

    const report = data.choices?.[0]?.message?.content || "No se pudo generar el reporte.";
    return new Response(JSON.stringify({ report }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
