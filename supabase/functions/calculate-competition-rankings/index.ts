import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify admin OR cron (cron uses anon key, check via x-cron-secret or skip if called internally)
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      // Check if it's the anon key (cron job) - allow through
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
      if (token !== anonKey) {
        // It's a user token - verify admin
        const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
        if (authErr || !user) throw new Error("Unauthorized");
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();
        if (!roleData) throw new Error("Admin only");
      }
    } else {
      throw new Error("No authorization");
    }

    const body = await req.json();
    const periodType: string = body.period_type || "weekly";

    // Calculate period bounds
    const now = new Date();
    let periodStart: Date, periodEnd: Date, periodLabel: string;

    if (periodType === "weekly") {
      const day = now.getDay();
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - day);
      periodStart.setHours(0, 0, 0, 0);
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodStart.getDate() + 6);
      periodEnd.setHours(23, 59, 59, 999);
      periodLabel = `Semana ${periodStart.toISOString().slice(0, 10)}`;
    } else if (periodType === "monthly") {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      periodLabel = `${months[now.getMonth()]} ${now.getFullYear()}`;
    } else {
      periodStart = new Date("2024-01-01");
      periodEnd = now;
      periodLabel = "All-time";
    }

    const startISO = periodStart.toISOString();
    const endISO = periodEnd.toISOString();

    // Fetch all data sources in parallel
    const [journalRes, importedRes, signalsRes, profilesRes] = await Promise.all([
      supabase
        .from("trading_journal")
        .select("user_id, result, pips, entry_price, exit_price, lot_size")
        .gte("trade_date", startISO.slice(0, 10))
        .lte("trade_date", endISO.slice(0, 10)),
      supabase
        .from("imported_trades")
        .select("user_id, profit, net_profit, status, side")
        .gte("entry_time", startISO)
        .lte("entry_time", endISO)
        .eq("status", "closed"),
      supabase
        .from("trading_signals")
        .select("id, closed_result, closed_price, entry_price, stop_loss, take_profit")
        .gte("created_at", startISO)
        .lte("created_at", endISO)
        .in("status", ["closed", "completed"]),
      supabase.from("profiles").select("id, alias"),
    ]);

    // Aggregate per user
    const userStats: Record<string, { trades: number; wins: number; pnl: number; losses: number[] }> = {};

    const ensureUser = (uid: string) => {
      if (!userStats[uid]) userStats[uid] = { trades: 0, wins: 0, pnl: 0, losses: [] };
    };

    // Journal trades
    for (const t of journalRes.data || []) {
      ensureUser(t.user_id);
      userStats[t.user_id].trades++;
      const profit = (t.exit_price - t.entry_price) * t.lot_size;
      userStats[t.user_id].pnl += profit;
      if (t.result === "win") userStats[t.user_id].wins++;
      if (profit < 0) userStats[t.user_id].losses.push(profit);
    }

    // Imported trades
    for (const t of importedRes.data || []) {
      ensureUser(t.user_id);
      userStats[t.user_id].trades++;
      const p = t.net_profit ?? t.profit ?? 0;
      userStats[t.user_id].pnl += p;
      if (p > 0) userStats[t.user_id].wins++;
      if (p < 0) userStats[t.user_id].losses.push(p);
    }

    // Calculate composite scores and build rankings
    const rankings = Object.entries(userStats)
      .filter(([_, s]) => s.trades >= 1)
      .map(([userId, s]) => {
        const winRate = s.trades > 0 ? (s.wins / s.trades) * 100 : 0;
        const maxDrawdown = s.losses.length > 0 ? Math.abs(Math.min(...s.losses)) : 0;
        const consistencyScore = s.trades >= 5 ? (winRate * 0.4 + Math.min(s.pnl, 10000) / 100 * 0.4 + (1 / (1 + maxDrawdown / 100)) * 20) : 0;
        const compositeScore = s.pnl * 0.4 + winRate * 0.3 + consistencyScore * 0.3;

        return {
          user_id: userId,
          period_type: periodType,
          period_label: periodLabel,
          period_start: startISO.slice(0, 10),
          period_end: endISO.slice(0, 10),
          total_trades: s.trades,
          winning_trades: s.wins,
          total_pnl: Math.round(s.pnl * 100) / 100,
          win_rate: Math.round(winRate * 100) / 100,
          max_drawdown: Math.round(maxDrawdown * 100) / 100,
          consistency_score: Math.round(consistencyScore * 100) / 100,
          composite_score: Math.round(compositeScore * 100) / 100,
          status: "active",
          calculated_at: new Date().toISOString(),
        };
      })
      .sort((a, b) => b.composite_score - a.composite_score)
      .map((r, i) => ({ ...r, rank: i + 1 }));

    // Delete old rankings for this period, then insert new ones
    await supabase
      .from("competition_rankings")
      .delete()
      .eq("period_type", periodType)
      .eq("period_label", periodLabel);

    if (rankings.length > 0) {
      const { error: insertErr } = await supabase
        .from("competition_rankings")
        .insert(rankings);
      if (insertErr) throw insertErr;

      // Send push notification to all users about new rankings
      const top3 = rankings.slice(0, 3);
      const profilesMap = new Map((profilesRes.data || []).map(p => [p.id, p.alias || "Trader"]));
      const top3Names = top3.map(r => profilesMap.get(r.user_id) || "Trader");
      const periodName = periodType === "weekly" ? "Semanal" : periodType === "monthly" ? "Mensual" : "General";

      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            title: `📊 Rankings ${periodName} actualizados`,
            body: `Top 3: ${top3Names.join(", ")}. ¡Revisa tu posición!`,
            url: "/competitions",
            tag: "competition-rankings-update",
          }),
        });
        console.log("Rankings notification sent");
      } catch (notifErr) {
        console.error("Failed to send rankings notification:", notifErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true, count: rankings.length, period: periodLabel }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
