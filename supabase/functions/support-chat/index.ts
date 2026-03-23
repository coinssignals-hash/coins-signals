import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a helpful customer support assistant for "Coins Signals", a professional trading signals and financial news application. You help users with:

- Account issues (login, profile, verification)
- Subscription and payment questions (plans: Básico $30/month, Plus $35/month, Premium $40/month)
- Trading signals usage and interpretation
- Technical issues with the app
- General trading education questions

Rules:
1. Be friendly, professional, and concise.
2. Answer in the SAME LANGUAGE the user writes in.
3. If you cannot resolve an issue (billing disputes, account recovery, technical bugs you can't diagnose), respond with EXACTLY this tag at the end: [ESCALATE]
4. Never give specific financial advice or guarantee profits.
5. For payment issues, guide them to the subscription page or suggest contacting support via WhatsApp.
6. Keep responses under 200 words unless the user asks for detailed explanation.
7. You have knowledge about forex, crypto, and stock markets for educational purposes only.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, conversationId, channel = "web" } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth user if available
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id ?? null;
    }

    // Create or get conversation
    let convId = conversationId;
    if (!convId && userId) {
      // Look for active conversation
      const { data: existing } = await supabase
        .from("support_conversations")
        .select("id")
        .eq("user_id", userId)
        .eq("channel", channel)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (existing) {
        convId = existing.id;
      } else {
        const { data: newConv } = await supabase
          .from("support_conversations")
          .insert({ user_id: userId, channel, status: "active" })
          .select("id")
          .single();
        convId = newConv?.id;
      }
    }

    // Save user message
    const lastUserMsg = messages[messages.length - 1];
    if (convId && lastUserMsg?.role === "user") {
      await supabase.from("support_messages").insert({
        conversation_id: convId,
        role: "user",
        content: lastUserMsg.content,
        channel,
      });
    }

    // Load conversation history from DB for context
    let historyMessages = messages;
    if (convId) {
      const { data: dbMessages } = await supabase
        .from("support_messages")
        .select("role, content")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true })
        .limit(50);

      if (dbMessages && dbMessages.length > 0) {
        historyMessages = dbMessages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));
      }
    }

    // For non-web channels, use non-streaming
    if (channel !== "web") {
      const response = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              ...historyMessages,
            ],
            stream: false,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: "AI credits exhausted." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      const assistantContent = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process your request.";

      // Check for escalation
      const needsEscalation = assistantContent.includes("[ESCALATE]");
      const cleanContent = assistantContent.replace("[ESCALATE]", "").trim();

      // Save assistant response
      if (convId) {
        await supabase.from("support_messages").insert({
          conversation_id: convId,
          role: "assistant",
          content: cleanContent,
          channel,
        });

        if (needsEscalation) {
          await supabase
            .from("support_conversations")
            .update({ status: "escalated", escalated_at: new Date().toISOString() })
            .eq("id", convId);
        }
      }

      return new Response(
        JSON.stringify({
          content: cleanContent,
          conversationId: convId,
          escalated: needsEscalation,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For web channel, use streaming
    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...historyMessages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a transform stream to intercept the full response
    const reader = response.body!.getReader();
    let fullContent = "";

    const stream = new ReadableStream({
      async pull(controller) {
        const { done, value } = await reader.read();
        if (done) {
          // Save the complete assistant response
          if (convId && fullContent) {
            const needsEscalation = fullContent.includes("[ESCALATE]");
            const cleanContent = fullContent.replace("[ESCALATE]", "").trim();

            await supabase.from("support_messages").insert({
              conversation_id: convId,
              role: "assistant",
              content: cleanContent,
              channel: "web",
            });

            if (needsEscalation) {
              await supabase
                .from("support_conversations")
                .update({ status: "escalated", escalated_at: new Date().toISOString() })
                .eq("id", convId);
            }
          }
          controller.close();
          return;
        }

        // Parse SSE to accumulate full content
        const text = new TextDecoder().decode(value);
        const lines = text.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) fullContent += delta;
          } catch {
            // ignore
          }
        }

        controller.enqueue(value);
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "X-Conversation-Id": convId || "",
      },
    });
  } catch (e) {
    console.error("support-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
