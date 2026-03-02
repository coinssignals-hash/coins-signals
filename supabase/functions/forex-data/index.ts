import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getYahooParams(interval: string): { yhInterval: string; range: string } {
  switch (interval) {
    case "1min": return { yhInterval: "1m", range: "7d" };
    case "5min": return { yhInterval: "5m", range: "60d" };
    case "15min": return { yhInterval: "15m", range: "60d" };
    case "30min": return { yhInterval: "30m", range: "60d" };
    case "1h": return { yhInterval: "1h", range: "730d" };
    case "4h": return { yhInterval: "1h", range: "730d" };
    case "1d":
    case "1day": return { yhInterval: "1d", range: "2y" };
    case "1week": return { yhInterval: "1wk", range: "5y" };
    default: return { yhInterval: "1d", range: "3mo" };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, interval = "30min", outputsize = "336" } = await req.json();

    if (!symbol) {
      return new Response(
        JSON.stringify({ error: "Symbol is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle symbols like EUR/USD, EURUSD, or EURUSD=X
    const cleanSymbol = symbol.replace("/", "").replace("=X", "");
    const yhSymbol = cleanSymbol + "=X";
    const maxCandles = parseInt(outputsize) || 336;
    const { yhInterval, range } = getYahooParams(interval);

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yhSymbol}?interval=${yhInterval}&range=${range}&includePrePost=true`;

    console.log("Fetching from Yahoo Finance:", url);

    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ForexBot/1.0)" },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Yahoo Finance HTTP error:", response.status, text.slice(0, 300));
      return new Response(
        JSON.stringify({ error: `Yahoo Finance error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    if (!result || !result.timestamp || result.timestamp.length === 0) {
      console.error("Yahoo Finance no data:", JSON.stringify(data?.chart?.error || data).slice(0, 300));
      return new Response(
        JSON.stringify({ error: "No data returned for this pair" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const timestamps = result.timestamp;
    const quote = result.indicators?.quote?.[0];
    if (!quote) {
      return new Response(
        JSON.stringify({ error: "No quote data in response" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const allCandles = [];
    for (let i = 0; i < timestamps.length; i++) {
      const o = quote.open?.[i];
      const h = quote.high?.[i];
      const l = quote.low?.[i];
      const c = quote.close?.[i];
      if (o == null || h == null || l == null || c == null) continue;
      const dt = new Date(timestamps[i] * 1000);
      const timeStr = dt.toISOString().replace("T", " ").slice(0, 19);
      allCandles.push({ time: timeStr, open: o, high: h, low: l, close: c, volume: quote.volume?.[i] || 0 });
    }

    const candles = allCandles.slice(-maxCandles);

    if (candles.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid candle data" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lastCandleTime = new Date(candles[candles.length - 1].time.replace(" ", "T") + "Z").getTime();
    const twentyFourHoursAgo = lastCandleTime - 24 * 60 * 60 * 1000;
    const last24h = candles.filter((c) => {
      const candleTime = new Date(c.time.replace(" ", "T") + "Z").getTime();
      return candleTime >= twentyFourHoursAgo;
    });

    let support = null;
    let resistance = null;
    if (last24h.length > 0) {
      support = Math.min(...last24h.map((c) => c.low));
      resistance = Math.max(...last24h.map((c) => c.high));
    }

    const lastCandle = candles[candles.length - 1];
    const prevCandle = candles.length > 1 ? candles[candles.length - 2] : lastCandle;
    const priceChange = lastCandle.close - prevCandle.close;
    const priceChangePercent = (priceChange / prevCandle.close) * 100;

    console.log(`Yahoo Finance OK: ${candles.length} candles for ${symbol}`);

    return new Response(
      JSON.stringify({
        symbol,
        interval,
        candles,
        support,
        resistance,
        meta: {
          lastPrice: lastCandle.close,
          priceChange,
          priceChangePercent,
          candleCount: candles.length,
          last24hCandleCount: last24h.length,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("forex-data error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
