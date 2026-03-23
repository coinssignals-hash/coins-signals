import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const TWILIO_WHATSAPP_FROM = Deno.env.get("TWILIO_WHATSAPP_FROM");

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_FROM) {
      throw new Error("Twilio credentials not configured");
    }

    // Twilio sends form-encoded data
    const formData = await req.formData();
    const from = formData.get("From") as string; // whatsapp:+1234567890
    const body = formData.get("Body") as string;
    const messageSid = formData.get("MessageSid") as string;

    if (!from || !body) {
      return new Response("Missing parameters", { status: 400 });
    }

    const phoneNumber = from.replace("whatsapp:", "");

    // Find or create conversation
    let { data: conversation } = await supabase
      .from("support_conversations")
      .select("id")
      .eq("channel", "whatsapp")
      .eq("channel_user_id", phoneNumber)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!conversation) {
      const { data: newConv } = await supabase
        .from("support_conversations")
        .insert({
          channel: "whatsapp",
          channel_user_id: phoneNumber,
          status: "active",
          metadata: { phone: phoneNumber },
        })
        .select("id")
        .single();
      conversation = newConv;
    }

    if (!conversation) {
      throw new Error("Failed to create conversation");
    }

    // Save user message
    await supabase.from("support_messages").insert({
      conversation_id: conversation.id,
      role: "user",
      content: body,
      channel: "whatsapp",
      metadata: { messageSid, from: phoneNumber },
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

    // Get AI response via support-chat function
    const chatResponse = await fetch(`${supabaseUrl}/functions/v1/support-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        messages,
        conversationId: conversation.id,
        channel: "whatsapp",
      }),
    });

    const aiResult = await chatResponse.json();
    const replyText = aiResult.content || "Lo siento, no pude procesar tu mensaje. Un agente te contactará pronto.";

    // Send reply via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: from,
        From: TWILIO_WHATSAPP_FROM,
        Body: replyText,
      }),
    });

    if (!twilioResponse.ok) {
      const err = await twilioResponse.text();
      console.error("Twilio send error:", err);
    }

    // Twilio expects TwiML or empty 200
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { headers: { ...corsHeaders, "Content-Type": "text/xml" } }
    );
  } catch (e) {
    console.error("support-whatsapp error:", e);
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { status: 200, headers: { "Content-Type": "text/xml" } }
    );
  }
});
