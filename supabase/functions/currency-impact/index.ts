import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// In-memory cache: key -> { data, ts }
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 30_000; // 30 seconds

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { currencies } = await req.json() as { currencies: string[] };

    if (!currencies || currencies.length < 1) {
      return new Response(
        JSON.stringify({ error: "currencies array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build cache key from sorted currencies
    const cacheKey = [...currencies].sort().join(",");
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return new Response(JSON.stringify({ data: cached.data, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const polygonKey = Deno.env.get("POLYGON_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build all possible pair combinations from affected currencies
    const possiblePairs: string[] = [];
    for (let i = 0; i < currencies.length; i++) {
      for (let j = 0; j < currencies.length; j++) {
        if (i === j) continue;
        possiblePairs.push(`${currencies[i]}/${currencies[j]}`);
        possiblePairs.push(`${currencies[i]}${currencies[j]}`);
      }
    }

    // Query active signals matching any pair
    const { data: signals, error: dbError } = await supabase
      .from("trading_signals")
      .select("id, currency_pair, entry_price, action, trend, probability, take_profit, stop_loss")
      .in("currency_pair", possiblePairs)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(10);

    if (dbError) {
      throw new Error(`DB error: ${dbError.message}`);
    }

    if (!signals || signals.length === 0) {
      return new Response(
        JSON.stringify({ data: [], message: "No active signals for these currencies" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deduplicate by currency_pair
    const seen = new Set<string>();
    const uniqueSignals = signals.filter((s) => {
      if (seen.has(s.currency_pair)) return false;
      seen.add(s.currency_pair);
      return true;
    });

    // Fetch current prices from Polygon.io for each unique pair
    const results = await Promise.all(
      uniqueSignals.map(async (signal) => {
        const clean = signal.currency_pair.replace(/[^A-Z]/g, "");
        const base = clean.slice(0, 3);
        const quote = clean.slice(3);
        let currentPrice: number | null = null;

        if (polygonKey) {
          try {
            const url = `https://api.polygon.io/v1/last_quote/currencies/${base}/${quote}?apiKey=${polygonKey}`;
            const res = await fetch(url);
            if (res.ok) {
              const json = await res.json();
              // Polygon returns last.ask and last.bid
              if (json.last) {
                currentPrice = (json.last.ask + json.last.bid) / 2;
              }
            }
          } catch (e) {
            console.error(`Polygon fetch error for ${signal.currency_pair}:`, e);
          }
        }

        const entryPrice = Number(signal.entry_price);
        const percentChange =
          currentPrice !== null ? ((currentPrice - entryPrice) / entryPrice) * 100 : null;

        const tpPrice = Number(signal.take_profit);
        const slPrice = Number(signal.stop_loss);
        const tpPercent = ((tpPrice - entryPrice) / entryPrice) * 100;
        const slPercent = ((slPrice - entryPrice) / entryPrice) * 100;

        // Calculate pips (forex standard: 4th decimal, JPY pairs 2nd)
        const isJPY = signal.currency_pair.includes("JPY");
        const pipMultiplier = isJPY ? 100 : 10000;
        const pipsDiff = currentPrice !== null ? (currentPrice - entryPrice) * pipMultiplier : null;

        return {
          signal_id: signal.id,
          currency_pair: signal.currency_pair,
          action: signal.action,
          trend: signal.trend,
          probability: signal.probability,
          entry_price: entryPrice,
          current_price: currentPrice,
          percent_change: percentChange !== null ? Math.round(percentChange * 10000) / 10000 : null,
          pips: pipsDiff !== null ? Math.round(pipsDiff * 10) / 10 : null,
          take_profit: tpPrice,
          tp_percent: Math.round(tpPercent * 10000) / 10000,
          stop_loss: slPrice,
          sl_percent: Math.round(slPercent * 10000) / 10000,
          is_positive: percentChange !== null ? percentChange >= 0 : null,
          has_live_data: currentPrice !== null,
        };
      })
    );

    // Cache results
    cache.set(cacheKey, { data: results, ts: Date.now() });
    // Evict old entries
    if (cache.size > 50) {
      const oldest = cache.keys().next().value;
      if (oldest) cache.delete(oldest);
    }

    return new Response(JSON.stringify({ data: results, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("currency-impact error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
