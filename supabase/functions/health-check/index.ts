import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ServiceCheck {
  name: string;
  status: "ok" | "error" | "timeout" | "skipped";
  latency_ms: number;
  message?: string;
  details?: Record<string, unknown>;
}

async function checkWithTimeout(
  name: string,
  fn: () => Promise<Partial<ServiceCheck>>,
  timeoutMs = 8000
): Promise<ServiceCheck> {
  const start = Date.now();
  try {
    const result = await Promise.race([
      fn(),
      new Promise<Partial<ServiceCheck>>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), timeoutMs)
      ),
    ]);
    return {
      name,
      status: result.status ?? "ok",
      latency_ms: Date.now() - start,
      message: result.message,
      details: result.details,
    };
  } catch (e) {
    const isTimeout = e instanceof Error && e.message === "timeout";
    return {
      name,
      status: isTimeout ? "timeout" : "error",
      latency_ms: Date.now() - start,
      message: isTimeout ? `Timeout after ${timeoutMs}ms` : String(e),
    };
  }
}

// --- Individual checks ---

async function checkDatabase(): Promise<Partial<ServiceCheck>> {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(url, key);
  const { count, error } = await sb
    .from("trading_signals")
    .select("id", { count: "exact", head: true });
  if (error) return { status: "error", message: error.message };
  return { status: "ok", details: { signals_count: count } };
}

async function checkAuth(): Promise<Partial<ServiceCheck>> {
  const url = Deno.env.get("SUPABASE_URL")!;
  const res = await fetch(`${url}/auth/v1/health`, {
    headers: { apikey: Deno.env.get("SUPABASE_ANON_KEY")! },
  });
  if (!res.ok) {
    const body = await res.text();
    return { status: "error", message: `HTTP ${res.status}: ${body}` };
  }
  await res.text();
  return { status: "ok" };
}

async function checkStorage(): Promise<Partial<ServiceCheck>> {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(url, key);
  const { data, error } = await sb.storage.listBuckets();
  if (error) return { status: "error", message: error.message };
  return {
    status: "ok",
    details: { buckets: data?.map((b) => b.name) },
  };
}

async function checkFastAPI(): Promise<Partial<ServiceCheck>> {
  const baseUrl = Deno.env.get("FASTAPI_BASE_URL");
  if (!baseUrl) return { status: "skipped", message: "FASTAPI_BASE_URL not set" };
  const res = await fetch(`${baseUrl}/health`);
  const body = await res.json();
  if (!res.ok) return { status: "error", message: `HTTP ${res.status}` };
  return { status: "ok", details: body };
}

async function checkExternalAPI(
  name: string,
  url: string,
  headers?: Record<string, string>
): Promise<Partial<ServiceCheck>> {
  const res = await fetch(url, { headers });
  const text = await res.text();
  if (!res.ok)
    return { status: "error", message: `HTTP ${res.status}: ${text.slice(0, 200)}` };
  return { status: "ok" };
}

async function checkFinnhub(): Promise<Partial<ServiceCheck>> {
  const key = Deno.env.get("FINNHUB_API_KEY");
  if (!key) return { status: "skipped", message: "No API key" };
  return checkExternalAPI(
    "Finnhub",
    `https://finnhub.io/api/v1/quote?symbol=AAPL&token=${key}`
  );
}

async function checkFMP(): Promise<Partial<ServiceCheck>> {
  const key = Deno.env.get("FMP_API_KEY");
  if (!key) return { status: "skipped", message: "No API key" };
  return checkExternalAPI(
    "FMP",
    `https://financialmodelingprep.com/api/v3/quote/AAPL?apikey=${key}`
  );
}

async function checkAlphaVantage(): Promise<Partial<ServiceCheck>> {
  const key = Deno.env.get("ALPHA_VANTAGE_API_KEY");
  if (!key) return { status: "skipped", message: "No API key" };
  return checkExternalAPI(
    "AlphaVantage",
    `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=${key}`
  );
}

async function checkPolygon(): Promise<Partial<ServiceCheck>> {
  const key = Deno.env.get("POLYGON_API_KEY");
  if (!key) return { status: "skipped", message: "No API key" };
  return checkExternalAPI(
    "Polygon",
    `https://api.polygon.io/v2/aggs/ticker/AAPL/prev?apiKey=${key}`
  );
}

async function checkTwelveData(): Promise<Partial<ServiceCheck>> {
  const key = Deno.env.get("TWELVE_DATA_API_KEY");
  if (!key) return { status: "skipped", message: "No API key" };
  return checkExternalAPI(
    "TwelveData",
    `https://api.twelvedata.com/quote?symbol=AAPL&apikey=${key}`
  );
}

async function checkStripe(): Promise<Partial<ServiceCheck>> {
  const key = Deno.env.get("STRIPE_SECRET_KEY");
  if (!key) return { status: "skipped", message: "No API key" };
  const res = await fetch("https://api.stripe.com/v1/balance", {
    headers: { Authorization: `Bearer ${key}` },
  });
  const text = await res.text();
  if (!res.ok)
    return { status: "error", message: `HTTP ${res.status}: ${text.slice(0, 200)}` };
  return { status: "ok" };
}

async function checkNewsAPI(): Promise<Partial<ServiceCheck>> {
  const key = Deno.env.get("NEWSAPI_API_KEY");
  if (!key) return { status: "skipped", message: "No API key" };
  return checkExternalAPI(
    "NewsAPI",
    `https://newsapi.org/v2/top-headlines?country=us&pageSize=1&apiKey=${key}`
  );
}

async function checkLovableAI(): Promise<Partial<ServiceCheck>> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return { status: "skipped", message: "No API key" };
  // Just verify the key format exists, don't burn tokens
  return { status: "ok", message: "API key configured" };
}

// --- Main handler ---

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startAll = Date.now();

  // Run all checks in parallel
  const results = await Promise.all([
    checkWithTimeout("PostgreSQL Database", checkDatabase),
    checkWithTimeout("Auth Service", checkAuth),
    checkWithTimeout("Storage Service", checkStorage),
    checkWithTimeout("FastAPI Backend", checkFastAPI),
    checkWithTimeout("Finnhub API", checkFinnhub),
    checkWithTimeout("FMP API", checkFMP),
    checkWithTimeout("Alpha Vantage API", checkAlphaVantage),
    checkWithTimeout("Polygon API", checkPolygon),
    checkWithTimeout("Twelve Data API", checkTwelveData),
    checkWithTimeout("Stripe API", checkStripe),
    checkWithTimeout("NewsAPI", checkNewsAPI),
    checkWithTimeout("Lovable AI Gateway", checkLovableAI),
  ]);

  const totalLatency = Date.now() - startAll;
  const okCount = results.filter((r) => r.status === "ok").length;
  const errorCount = results.filter((r) => r.status === "error").length;
  const timeoutCount = results.filter((r) => r.status === "timeout").length;
  const skippedCount = results.filter((r) => r.status === "skipped").length;

  const overallStatus =
    errorCount > 0 || timeoutCount > 0 ? "degraded" : "healthy";

  const response = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    total_latency_ms: totalLatency,
    summary: {
      total: results.length,
      ok: okCount,
      error: errorCount,
      timeout: timeoutCount,
      skipped: skippedCount,
    },
    services: results,
  };

  return new Response(JSON.stringify(response, null, 2), {
    status: overallStatus === "healthy" ? 200 : 503,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
