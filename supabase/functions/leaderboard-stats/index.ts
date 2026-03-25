import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Demo traders shown when no real data exists
const DEMO_TRADERS = [
  { alias: "ElToro_AR", country: "AR", pnl: 12450.80, winRate: 78.5, trades: 234, streak: 12, winners: 184, losers: 50, symbolsTraded: 8 },
  { alias: "SamuraiTrader", country: "JP", pnl: 9820.50, winRate: 82.1, trades: 156, streak: 8, winners: 128, losers: 28, symbolsTraded: 5 },
  { alias: "FxWolf_MX", country: "MX", pnl: 8340.25, winRate: 71.3, trades: 312, streak: 5, winners: 222, losers: 90, symbolsTraded: 12 },
  { alias: "PipHunterCL", country: "CL", pnl: 7215.90, winRate: 74.8, trades: 198, streak: 7, winners: 148, losers: 50, symbolsTraded: 6 },
  { alias: "GoldenBull", country: "US", pnl: 6890.40, winRate: 69.2, trades: 278, streak: 4, winners: 192, losers: 86, symbolsTraded: 10 },
  { alias: "NightOwl_CO", country: "CO", pnl: 5670.15, winRate: 76.0, trades: 150, streak: 9, winners: 114, losers: 36, symbolsTraded: 4 },
  { alias: "ScalperKing", country: "BR", pnl: 4980.30, winRate: 65.8, trades: 420, streak: 3, winners: 276, losers: 144, symbolsTraded: 15 },
  { alias: "TrendRider_PE", country: "PE", pnl: 4450.60, winRate: 80.0, trades: 100, streak: 11, winners: 80, losers: 20, symbolsTraded: 3 },
  { alias: "AlphaFx_UY", country: "UY", pnl: 3920.75, winRate: 72.5, trades: 200, streak: 6, winners: 145, losers: 55, symbolsTraded: 7 },
  { alias: "SwingMaster", country: "ES", pnl: 3580.20, winRate: 68.4, trades: 190, streak: 2, winners: 130, losers: 60, symbolsTraded: 9 },
  { alias: "IronTrader_DE", country: "DE", pnl: 3120.90, winRate: 73.1, trades: 160, streak: 5, winners: 117, losers: 43, symbolsTraded: 6 },
  { alias: "VortexFx", country: "GB", pnl: 2850.40, winRate: 66.7, trades: 240, streak: 3, winners: 160, losers: 80, symbolsTraded: 11 },
];

function getDemoTraders(category: string) {
  const sorted = [...DEMO_TRADERS];
  switch (category) {
    case "winrate": sorted.sort((a, b) => b.winRate - a.winRate); break;
    case "streak": sorted.sort((a, b) => b.streak - a.streak); break;
    case "signals": sorted.sort((a, b) => b.trades - a.trades); break;
    default: sorted.sort((a, b) => b.pnl - a.pnl);
  }

  const getTier = (rank: number, total: number) => {
    const pct = rank / Math.max(total, 1);
    if (pct <= 0.05) return "legendary";
    if (pct <= 0.15) return "diamond";
    if (pct <= 0.3) return "gold";
    if (pct <= 0.6) return "silver";
    return "bronze";
  };

  return sorted.map((t, i) => ({
    id: `demo-${i}`,
    rank: i + 1,
    alias: t.alias,
    avatar_url: null,
    country: t.country,
    pnl: t.pnl,
    winRate: t.winRate,
    trades: t.trades,
    streak: t.streak,
    winners: t.winners,
    losers: t.losers,
    symbolsTraded: t.symbolsTraded,
    tier: getTier(i, sorted.length),
  }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const period = url.searchParams.get("period") || "alltime";
    const category = url.searchParams.get("category") || "pnl";
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);

    // Build date filter
    let dateFilter: string | null = null;
    const now = new Date();
    if (period === "weekly") {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      dateFilter = d.toISOString();
    } else if (period === "monthly") {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      dateFilter = d.toISOString();
    }

    // Query all closed trades (service role bypasses RLS)
    let query = supabase
      .from("imported_trades")
      .select("user_id, net_profit, profit, status, entry_time, exit_time, symbol, side")
      .eq("status", "closed");

    if (dateFilter) {
      query = query.gte("exit_time", dateFilter);
    }

    const { data: trades, error: tradesErr } = await query;
    if (tradesErr) throw tradesErr;

    // If no real trades, return demo data
    if (!trades || trades.length === 0) {
      const demoTraders = getDemoTraders(category);
      return new Response(JSON.stringify({ traders: demoTraders.slice(0, limit), total: demoTraders.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Group by user_id
    const grouped: Record<string, typeof trades> = {};
    for (const t of trades) {
      if (!grouped[t.user_id]) grouped[t.user_id] = [];
      grouped[t.user_id].push(t);
    }

    // Calculate stats per user
    const stats = Object.entries(grouped).map(([userId, userTrades]) => {
      const sorted = [...userTrades].sort(
        (a, b) =>
          new Date(a.exit_time || a.entry_time).getTime() -
          new Date(b.exit_time || b.entry_time).getTime()
      );

      const wins = sorted.filter((t) => (t.net_profit ?? t.profit ?? 0) > 0);
      const losses = sorted.filter((t) => (t.net_profit ?? t.profit ?? 0) < 0);
      const totalPnl = sorted.reduce(
        (s, t) => s + (t.net_profit ?? t.profit ?? 0),
        0
      );
      const winRate =
        sorted.length > 0 ? (wins.length / sorted.length) * 100 : 0;

      // Current win streak
      let streak = 0;
      for (let i = sorted.length - 1; i >= 0; i--) {
        if ((sorted[i].net_profit ?? sorted[i].profit ?? 0) > 0) streak++;
        else break;
      }

      // Unique symbols traded
      const symbols = new Set(sorted.map((t) => t.symbol));

      return {
        user_id: userId,
        pnl: Math.round(totalPnl * 100) / 100,
        winRate: Math.round(winRate * 10) / 10,
        trades: sorted.length,
        streak,
        winners: wins.length,
        losers: losses.length,
        symbolsTraded: symbols.size,
      };
    });

    // Sort by category
    switch (category) {
      case "winrate":
        stats.sort((a, b) => b.winRate - a.winRate);
        break;
      case "streak":
        stats.sort((a, b) => b.streak - a.streak);
        break;
      case "signals":
        stats.sort((a, b) => b.trades - a.trades);
        break;
      default:
        stats.sort((a, b) => b.pnl - a.pnl);
    }

    const topStats = stats.slice(0, limit);
    const userIds = topStats.map((s) => s.user_id);

    // Fetch profiles for these users
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, alias, avatar_url, country, first_name, last_name")
      .in("id", userIds);

    const profileMap: Record<string, any> = {};
    for (const p of profiles || []) {
      profileMap[p.id] = p;
    }

    // Assign tiers based on rank
    const getTier = (rank: number, total: number) => {
      const pct = rank / Math.max(total, 1);
      if (pct <= 0.05) return "legendary";
      if (pct <= 0.15) return "diamond";
      if (pct <= 0.3) return "gold";
      if (pct <= 0.6) return "silver";
      return "bronze";
    };

    const traders = topStats.map((s, i) => {
      const profile = profileMap[s.user_id];
      const alias =
        profile?.alias ||
        (profile?.first_name
          ? `${profile.first_name} ${(profile.last_name || "")[0] || ""}`.trim()
          : `Trader${(i + 1).toString().padStart(2, "0")}`);

      return {
        id: s.user_id,
        rank: i + 1,
        alias,
        avatar_url: profile?.avatar_url || null,
        country: profile?.country || null,
        pnl: s.pnl,
        winRate: s.winRate,
        trades: s.trades,
        streak: s.streak,
        winners: s.winners,
        losers: s.losers,
        symbolsTraded: s.symbolsTraded,
        tier: getTier(i, stats.length),
      };
    });

    return new Response(
      JSON.stringify({ traders, total: stats.length }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Leaderboard error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
