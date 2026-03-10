import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

function estimateCost(model: string, inp: number, out: number): number {
  const r: Record<string, [number, number]> = {
    'google/gemini-3-flash-preview': [0.15, 0.6],
    'google/gemini-2.5-flash': [0.15, 0.6],
    'google/gemini-2.5-flash-lite': [0.075, 0.3],
    'google/gemini-2.5-pro': [1.25, 10],
    'openai/gpt-5': [2.5, 10],
    'openai/gpt-5-mini': [0.4, 1.6],
  };
  const [i, o] = r[model] || [0.5, 2];
  return (inp * i + out * o) / 1e6;
}

async function logUsage(fn: string, model: string, status: number, latencyMs: number, usage?: any, meta?: Record<string, unknown>) {
  try {
    await supabaseAdmin.from('api_usage_logs').insert({
      function_name: fn, provider: 'lovable_ai', model,
      response_status: status, latency_ms: latencyMs,
      tokens_input: usage?.prompt_tokens || 0,
      tokens_output: usage?.completion_tokens || 0,
      tokens_total: usage?.total_tokens || 0,
      estimated_cost: estimateCost(model, usage?.prompt_tokens || 0, usage?.completion_tokens || 0),
      metadata: meta || {},
    });
  } catch { /* fire-and-forget */ }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const model = "google/gemini-3-flash-preview";

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { prompt } = await req.json();
    if (!prompt) {
      return new Response(JSON.stringify({ error: "Missing prompt" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const t0 = Date.now();
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "Eres un analista macroeconómico experto en forex. Respondes de forma concisa y directa en español." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      }),
    });
    const latency = Date.now() - t0;

    if (!response.ok) {
      logUsage('economic-ai', model, response.status, latency);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    logUsage('economic-ai', model, 200, latency, aiResponse.usage);

    const text = aiResponse.choices?.[0]?.message?.content || "Sin análisis disponible";

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("economic-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
