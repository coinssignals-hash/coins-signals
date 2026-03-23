import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_RUNTIME_MS = 55_000;
const MIN_REMAINING_MS = 5_000;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!TELEGRAM_BOT_TOKEN) {
    return new Response(
      JSON.stringify({ error: "TELEGRAM_BOT_TOKEN not configured. Create a bot with @BotFather and add the token." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let totalProcessed = 0;

  // Get last known offset from metadata
  const { data: offsetConv } = await supabase
    .from("support_conversations")
    .select("metadata")
    .eq("channel", "telegram_state")
    .eq("channel_user_id", "poll_offset")
    .limit(1)
    .single();

  let currentOffset = (offsetConv?.metadata as any)?.offset || 0;

  // If no state row exists, create one
  if (!offsetConv) {
    await supabase.from("support_conversations").insert({
      channel: "telegram_state",
      channel_user_id: "poll_offset",
      status: "active",
      metadata: { offset: 0 },
    });
  }

  try {
    while (true) {
      const elapsed = Date.now() - startTime;
      const remainingMs = MAX_RUNTIME_MS - elapsed;
      if (remainingMs < MIN_REMAINING_MS) break;

      const timeout = Math.min(50, Math.floor(remainingMs / 1000) - 5);
      if (timeout < 1) break;

      const response = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            offset: currentOffset,
            timeout,
            allowed_updates: ["message"],
          }),
        }
      );

      const data = await response.json();
      if (!data.ok) {
        console.error("Telegram getUpdates error:", data);
        break;
      }

      const updates = data.result ?? [];
      if (updates.length === 0) continue;

      for (const update of updates) {
        if (!update.message?.text) continue;

        const chatId = String(update.message.chat.id);
        const text = update.message.text;
        const userName = update.message.from?.first_name || "User";

        // Find or create conversation
        let { data: conversation } = await supabase
          .from("support_conversations")
          .select("id")
          .eq("channel", "telegram")
          .eq("channel_user_id", chatId)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (!conversation) {
          const { data: newConv } = await supabase
            .from("support_conversations")
            .insert({
              channel: "telegram",
              channel_user_id: chatId,
              status: "active",
              metadata: { chatId, userName },
            })
            .select("id")
            .single();
          conversation = newConv;
        }

        if (!conversation) continue;

        // Save user message
        await supabase.from("support_messages").insert({
          conversation_id: conversation.id,
          role: "user",
          content: text,
          channel: "telegram",
          metadata: { updateId: update.update_id, chatId },
        });

        // Get conversation history
        const { data: history } = await supabase
          .from("support_messages")
          .select("role, content")
          .eq("conversation_id", conversation.id)
          .order("created_at", { ascending: true })
          .limit(30);

        const messages = (history || []).map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

        // Get AI response
        const chatResponse = await fetch(
          `${supabaseUrl}/functions/v1/support-chat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              messages,
              conversationId: conversation.id,
              channel: "telegram",
            }),
          }
        );

        const aiResult = await chatResponse.json();
        const replyText = aiResult.content || "Sorry, I couldn't process your message.";

        // Send reply via Telegram
        await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: replyText,
              parse_mode: "Markdown",
            }),
          }
        );

        totalProcessed++;
      }

      // Update offset
      const newOffset = Math.max(...updates.map((u: any) => u.update_id)) + 1;
      await supabase
        .from("support_conversations")
        .update({ metadata: { offset: newOffset } })
        .eq("channel", "telegram_state")
        .eq("channel_user_id", "poll_offset");

      currentOffset = newOffset;
    }
  } catch (e) {
    console.error("Telegram poll error:", e);
  }

  return new Response(
    JSON.stringify({ ok: true, processed: totalProcessed, finalOffset: currentOffset }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
