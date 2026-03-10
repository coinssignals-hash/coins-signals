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
    const r: Record<string, [number, number]> = { 'google/gemini-3-flash-preview': [0.15, 0.6] };
    const [i, o] = r[MODEL] || [0.5, 2];
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
    const { signal, patterns, marketContext, symbol } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!signal) return new Response(JSON.stringify({ error: "No signal provided" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const patternList = (patterns || []).map((p: any) => `- ${p.name} (${p.type}, ${p.reliability})`).join("\n") || "Ninguno relevante";

    const prompt = `Eres un analista técnico profesional de Forex. Genera un reporte detallado de la siguiente señal de trading.

**Señal:** ${signal.direction} ${symbol}
**Entry:** ${signal.entry}
**Stop Loss:** ${signal.stopLoss} (${signal.pipsRisk.toFixed(1)} pips)
**Take Profit:** ${signal.takeProfit} (${signal.pipsReward.toFixed(1)} pips)
**Risk/Reward:** 1:${signal.riskReward.toFixed(2)}
**Confianza:** ${signal.confidence}%
**Fuerza:** ${signal.strength}

**Contexto del mercado:**
- Tendencia: ${marketContext.trend}
- Volatilidad: ${marketContext.volatility}
${marketContext.rsi !== undefined ? `- RSI(14): ${marketContext.rsi.toFixed(1)}` : ""}
${marketContext.macdBias ? `- MACD Sesgo: ${marketContext.macdBias}` : ""}

**Razones de la señal:**
${signal.reasons.map((r: string) => `- ${r}`).join("\n")}

**Patrones de velas:**
${patternList}

Genera un reporte profesional en español con:
1. **📊 Análisis de la señal**: Validez y contexto
2. **🎯 Niveles clave**: Confirma o ajusta Entry/SL/TP
3. **⚠️ Riesgos**: Factores que podrían invalidar la señal
4. **📈 Escenarios**: Mejor caso, caso base, peor caso
5. **✅ Recomendación**: Ejecutar / Esperar / Evitar + gestión de posición sugerida

Sé conciso, profesional y directo. Usa markdown.`;

    const t0 = Date.now();
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: "Eres un analista de trading Forex profesional. Respondes siempre en español con reportes concisos y accionables." },
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
