import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  // Facebook/Instagram webhook verification (GET)
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const VERIFY_TOKEN = Deno.env.get("META_VERIFY_TOKEN");

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("Meta webhook verified");
      return new Response(challenge, { status: 200 });
    }

    return new Response("Forbidden", { status: 403 });
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const META_PAGE_TOKEN = Deno.env.get("META_PAGE_TOKEN");
    if (!META_PAGE_TOKEN) {
      console.error("META_PAGE_TOKEN not configured");
      return new Response("OK", { status: 200 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();

    // Process each entry (Facebook and Instagram share the same webhook structure)
    for (const entry of body.entry || []) {
      for (const event of entry.messaging || []) {
        const senderId = event.sender?.id;
        const messageText = event.message?.text;

        if (!senderId || !messageText) continue;

        // Determine channel (facebook or instagram based on entry.id)
        const channel = body.object === "instagram" ? "instagram" : "facebook";

        // Find or create conversation
        let { data: conversation } = await supabase
          .from("support_conversations")
          .select("id")
          .eq("channel", channel)
          .eq("channel_user_id", senderId)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (!conversation) {
          const { data: newConv } = await supabase
            .from("support_conversations")
            .insert({
              channel,
              channel_user_id: senderId,
              status: "active",
              metadata: { senderId, platform: channel },
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
          content: messageText,
          channel,
          metadata: { senderId, messageId: event.message?.mid },
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
              channel,
            }),
          }
        );

        const aiResult = await chatResponse.json();
        const replyText = aiResult.content || "Sorry, I couldn't process your message.";

        // Send reply via Graph API
        const graphUrl = channel === "instagram"
          ? `https://graph.instagram.com/v21.0/me/messages`
          : `https://graph.facebook.com/v21.0/me/messages`;

        await fetch(`${graphUrl}?access_token=${META_PAGE_TOKEN}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipient: { id: senderId },
            message: { text: replyText },
          }),
        });
      }
    }

    // Facebook requires 200 response within 20 seconds
    return new Response("EVENT_RECEIVED", { status: 200 });
  } catch (e) {
    console.error("Meta webhook error:", e);
    return new Response("EVENT_RECEIVED", { status: 200 });
  }
});
