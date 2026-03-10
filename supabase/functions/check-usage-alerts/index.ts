import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Default thresholds (can be overridden via request body)
const DEFAULT_THRESHOLDS = {
  dailyTokensLimit: 500000,
  dailyCostLimit: 5.0,
  errorRateLimit: 10,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const thresholds = { ...DEFAULT_THRESHOLDS, ...body.thresholds };

    // Get usage from last 24h
    const since = new Date(Date.now() - 86400000).toISOString();
    const { data: logs, error } = await supabaseAdmin
      .from("api_usage_logs")
      .select("tokens_total, estimated_cost, response_status")
      .gte("created_at", since);

    if (error) throw error;

    const totalTokens = (logs || []).reduce((s, l) => s + (l.tokens_total || 0), 0);
    const totalCost = (logs || []).reduce((s, l) => s + Number(l.estimated_cost || 0), 0);
    const totalCalls = (logs || []).length;
    const errorCount = (logs || []).filter(l => l.response_status && l.response_status >= 400).length;
    const errorRate = totalCalls > 0 ? (errorCount / totalCalls) * 100 : 0;

    const alerts: { type: string; message: string; value: number; limit: number }[] = [];

    if (totalTokens >= thresholds.dailyTokensLimit) {
      alerts.push({
        type: "tokens_exceeded",
        message: `Consumo de tokens (${totalTokens.toLocaleString()}) superó el límite de ${thresholds.dailyTokensLimit.toLocaleString()}`,
        value: totalTokens,
        limit: thresholds.dailyTokensLimit,
      });
    }

    if (totalCost >= thresholds.dailyCostLimit) {
      alerts.push({
        type: "cost_exceeded",
        message: `Costo estimado ($${totalCost.toFixed(4)}) superó el presupuesto de $${thresholds.dailyCostLimit.toFixed(2)}`,
        value: totalCost,
        limit: thresholds.dailyCostLimit,
      });
    }

    if (errorRate >= thresholds.errorRateLimit) {
      alerts.push({
        type: "error_rate_exceeded",
        message: `Tasa de error (${errorRate.toFixed(1)}%) superó el umbral de ${thresholds.errorRateLimit}%`,
        value: errorRate,
        limit: thresholds.errorRateLimit,
      });
    }

    // If there are alerts, send push notification to admin users
    if (alerts.length > 0) {
      // Get admin user IDs
      const { data: adminRoles } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      const adminIds = (adminRoles || []).map(r => r.user_id);

      if (adminIds.length > 0) {
        // Get push subscriptions for admin users
        const { data: subs } = await supabaseAdmin
          .from("push_subscriptions")
          .select("*")
          .in("user_id", adminIds);

        const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
        const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");

        if (subs && subs.length > 0 && VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
          const alertSummary = alerts.map(a => `⚠️ ${a.message}`).join("\n");
          const notifTitle = `🚨 Alerta de Consumo API (${alerts.length})`;
          const notifBody = alertSummary.slice(0, 200);

          // Use the send-push-notification function for each subscription
          for (const sub of subs) {
            try {
              await supabaseAdmin.functions.invoke("send-push-notification", {
                body: {
                  subscription: { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                  title: notifTitle,
                  body: notifBody,
                  url: "/admin",
                  tag: "api-usage-alert",
                },
              });
            } catch (e) {
              console.error("Failed to send push to admin:", e);
            }
          }
        }
      }

      // Log the alert event in audit_logs
      await supabaseAdmin.from("audit_logs").insert({
        action: "api_usage_alert",
        resource_type: "api_usage",
        success: true,
        details: { alerts, stats: { totalTokens, totalCost, totalCalls, errorRate } },
      });
    }

    return new Response(
      JSON.stringify({
        checked: true,
        stats: { totalTokens, totalCost, totalCalls, errorRate: parseFloat(errorRate.toFixed(1)) },
        alerts,
        alertsSent: alerts.length > 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("check-usage-alerts error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
