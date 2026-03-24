import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, journalContext, psychologyContext, language = "es" } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const langMap: Record<string, string> = {
      es: "español", en: "English", pt: "portugués", fr: "français", de: "Deutsch", it: "italiano",
    };
    const langName = langMap[language] || "español";

    // Build context from journal data
    let journalSummary = "";
    if (journalContext && journalContext.length > 0) {
      const total = journalContext.length;
      const wins = journalContext.filter((t: any) => t.result === "win").length;
      const losses = journalContext.filter((t: any) => t.result === "loss").length;
      const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : "0";
      const totalPips = journalContext.reduce((sum: number, t: any) => {
        const p = parseFloat(t.pips) || 0;
        return sum + (t.result === "loss" ? -Math.abs(p) : p);
      }, 0);

      // Pair distribution
      const pairMap: Record<string, number> = {};
      journalContext.forEach((t: any) => { pairMap[t.pair] = (pairMap[t.pair] || 0) + 1; });
      const topPairs = Object.entries(pairMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

      // Recent trades (last 10)
      const recent = journalContext.slice(0, 10);
      const recentSummary = recent.map((t: any) =>
        `${t.date} | ${t.pair} ${t.action} | ${t.result} | ${t.pips}p | SL:${t.stopLoss || "N/A"} TP:${t.takeProfit || "N/A"} | Notas: ${t.notes || "ninguna"}`
      ).join("\n");

      // Streak analysis
      let currentStreak = 0;
      let streakType = "";
      for (const t of journalContext) {
        if (currentStreak === 0) { streakType = t.result; currentStreak = 1; }
        else if (t.result === streakType) { currentStreak++; }
        else break;
      }

      // Average pips per trade
      const avgPips = total > 0 ? (totalPips / total).toFixed(1) : "0";

      // Risk-reward analysis
      const tradesWithSLTP = journalContext.filter((t: any) => t.stopLoss && t.takeProfit && t.entryPrice);
      let avgRR = "N/A";
      if (tradesWithSLTP.length > 0) {
        const rrValues = tradesWithSLTP.map((t: any) => {
          const entry = parseFloat(t.entryPrice);
          const sl = parseFloat(t.stopLoss);
          const tp = parseFloat(t.takeProfit);
          const risk = Math.abs(entry - sl);
          const reward = Math.abs(tp - entry);
          return risk > 0 ? reward / risk : 0;
        });
        avgRR = (rrValues.reduce((s: number, v: number) => s + v, 0) / rrValues.length).toFixed(2);
      }

      journalSummary = `
=== DIARIO DE TRADING DEL USUARIO ===
Total de operaciones: ${total}
Ganadas: ${wins} | Perdidas: ${losses} | Win Rate: ${winRate}%
Pips totales: ${totalPips.toFixed(1)} | Promedio por trade: ${avgPips}p
Ratio R:R promedio: ${avgRR}
Racha actual: ${currentStreak} ${streakType === "win" ? "ganadas" : streakType === "loss" ? "perdidas" : "breakeven"} consecutivas
Pares más operados: ${topPairs.map(([p, c]) => `${p}(${c})`).join(", ")}

Últimas 10 operaciones:
${recentSummary}
`;
    }

    // Build psychology context
    let psychSummary = "";
    if (psychologyContext && psychologyContext.length > 0) {
      const total = psychologyContext.length;
      const avgDiscipline = (psychologyContext.reduce((s: number, e: any) => s + e.discipline, 0) / total).toFixed(1);
      const planFollowed = psychologyContext.filter((e: any) => e.followed_plan).length;
      const planRate = ((planFollowed / total) * 100).toFixed(0);

      // Emotion distribution
      const emotionMap: Record<string, number> = {};
      psychologyContext.forEach((e: any) => { emotionMap[e.emotion] = (emotionMap[e.emotion] || 0) + 1; });
      const topEmotions = Object.entries(emotionMap).sort((a, b) => b[1] - a[1]);

      // Mistake patterns
      const mistakeMap: Record<string, number> = {};
      psychologyContext.forEach((e: any) => {
        (e.mistakes || []).forEach((m: string) => { mistakeMap[m] = (mistakeMap[m] || 0) + 1; });
      });
      const topMistakes = Object.entries(mistakeMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

      // Win rate by emotion
      const emotionWinRate = topEmotions.map(([emotion, count]) => {
        const emEntries = psychologyContext.filter((e: any) => e.emotion === emotion && e.result);
        const wins = emEntries.filter((e: any) => e.result === "win").length;
        return `${emotion}: ${emEntries.length > 0 ? ((wins / emEntries.length) * 100).toFixed(0) : 0}% WR (${count} sesiones)`;
      });

      // Recent entries
      const recentPsych = psychologyContext.slice(0, 5).map((e: any) =>
        `${e.date} | ${e.emotion} | Disciplina: ${e.discipline}/5 | Plan: ${e.followed_plan ? "Sí" : "No"} | ${e.result || "N/A"} | Errores: ${(e.mistakes || []).join(", ") || "ninguno"} | Notas: ${e.notes || "ninguna"}`
      ).join("\n");

      psychSummary = `
=== PERFIL PSICOLÓGICO DEL TRADER ===
Sesiones registradas: ${total}
Disciplina promedio: ${avgDiscipline}/5
Plan seguido: ${planRate}%
Emociones predominantes: ${topEmotions.map(([e, c]) => `${e}(${c})`).join(", ")}
Win rate por emoción: ${emotionWinRate.join(" | ")}
Errores más frecuentes: ${topMistakes.map(([m, c]) => `${m}(${c}x)`).join(", ") || "ninguno"}

Últimas 5 sesiones psicológicas:
${recentPsych}
`;
    }

    const systemPrompt = `Eres un coach profesional de trading con más de 15 años de experiencia en los mercados financieros. Tienes acceso COMPLETO al diario de trading y perfil psicológico del usuario.

DATOS DEL TRADER:
${journalSummary || "Sin datos de diario disponibles aún."}
${psychSummary || "Sin datos psicológicos disponibles aún."}

REGLAS:
- Responde siempre en ${langName}
- USA los datos reales del trader para personalizar cada respuesta. Cita números concretos de su historial.
- Sé directo pero empático
- Si detectas patrones negativos (overtrading, revenge trading, baja disciplina, no usar SL), señálalos con tacto y datos
- Si hay correlación entre emociones y resultados, menciónalo
- Siempre incluye al menos un consejo accionable basado en SUS datos
- Usa formato markdown con headers y bullets
- No des consejos de inversión específicos, enfócate en proceso y disciplina
- Si el trader tiene racha perdedora, primero valida sus emociones
- Incluye ejercicios prácticos cuando sea apropiado
- Si no hay datos suficientes, anima al trader a registrar más operaciones y sesiones psicológicas`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("journal-coach error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
