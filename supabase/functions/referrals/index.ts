import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  console.log(`[REFERRALS] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

function generateCode(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (const byte of array) {
    result += chars[byte % chars.length];
  }
  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || (await req.json().catch(() => ({}))).action;

    // ---- GET OR CREATE REFERRAL CODE ----
    if (action === "get-code") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) throw new Error("Not authenticated");
      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: authErr } = await supabase.auth.getUser(token);
      if (authErr || !userData.user) throw new Error("Auth failed");
      const userId = userData.user.id;

      // Check existing
      const { data: existing } = await supabase
        .from("referral_codes")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        logStep("Returning existing code", { code: existing.code });
        return new Response(JSON.stringify({ code: existing.code }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Generate unique code
      let code = generateCode();
      let attempts = 0;
      while (attempts < 5) {
        const { data: conflict } = await supabase
          .from("referral_codes")
          .select("id")
          .eq("code", code)
          .maybeSingle();
        if (!conflict) break;
        code = generateCode();
        attempts++;
      }

      const { error: insertErr } = await supabase
        .from("referral_codes")
        .insert({ user_id: userId, code });

      if (insertErr) throw new Error(`Failed to create code: ${insertErr.message}`);
      logStep("Created new code", { code });

      return new Response(JSON.stringify({ code }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- REGISTER A REFERRAL (on signup) ----
    if (action === "register") {
      const { referral_code, referred_user_id } = await req.json();
      if (!referral_code || !referred_user_id) throw new Error("Missing params");

      // Look up referrer
      const { data: codeData } = await supabase
        .from("referral_codes")
        .select("user_id")
        .eq("code", referral_code.toUpperCase())
        .maybeSingle();

      if (!codeData) {
        return new Response(JSON.stringify({ error: "Invalid referral code" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Can't refer yourself
      if (codeData.user_id === referred_user_id) {
        return new Response(JSON.stringify({ error: "Cannot refer yourself" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create referral record
      const { error: refErr } = await supabase.from("referrals").insert({
        referrer_id: codeData.user_id,
        referred_id: referred_user_id,
        status: "pending",
        reward_days: 7,
        reward_amount: 15,
      });

      if (refErr) {
        if (refErr.code === "23505") {
          return new Response(JSON.stringify({ message: "Already referred" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(refErr.message);
      }

      logStep("Referral registered", { referrer: codeData.user_id, referred: referred_user_id });
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- COMPLETE REFERRAL (when referred user subscribes) ----
    if (action === "complete") {
      const { referred_user_id } = await req.json();
      if (!referred_user_id) throw new Error("Missing referred_user_id");

      const { data: referral, error: fetchErr } = await supabase
        .from("referrals")
        .select("*")
        .eq("referred_id", referred_user_id)
        .eq("status", "pending")
        .maybeSingle();

      if (fetchErr || !referral) {
        return new Response(JSON.stringify({ message: "No pending referral" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Mark as completed
      const { error: updateErr } = await supabase
        .from("referrals")
        .update({ status: "completed", completed_at: new Date().toISOString(), reward_amount: 25 })
        .eq("id", referral.id);

      if (updateErr) throw new Error(updateErr.message);

      logStep("Referral completed", { referralId: referral.id, referrerId: referral.referrer_id });

      return new Response(JSON.stringify({ success: true, reward_days: referral.reward_days }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- GET STATS ----
    if (action === "stats") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) throw new Error("Not authenticated");
      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: authErr } = await supabase.auth.getUser(token);
      if (authErr || !userData.user) throw new Error("Auth failed");

      const { data: referrals } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", userData.user.id)
        .order("created_at", { ascending: false });

      const list = referrals || [];
      const total = list.length;
      const completed = list.filter(r => r.status === "completed").length;
      const pending = list.filter(r => r.status === "pending").length;
      const totalEarned = list
        .filter(r => r.status === "completed")
        .reduce((sum, r) => sum + Number(r.reward_amount || 0), 0);
      const totalDays = list
        .filter(r => r.status === "completed")
        .reduce((sum, r) => sum + Number(r.reward_days || 0), 0);

      return new Response(JSON.stringify({
        total,
        completed,
        pending,
        totalEarned,
        totalDays,
        referrals: list.map(r => ({
          id: r.id,
          status: r.status,
          reward_amount: r.reward_amount,
          reward_days: r.reward_days,
          created_at: r.created_at,
          completed_at: r.completed_at,
        })),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
