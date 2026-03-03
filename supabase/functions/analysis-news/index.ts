import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const FINNHUB_KEY = Deno.env.get("FINNHUB_API_KEY") || "";
const FMP_KEY = Deno.env.get("FMP_API_KEY") || "";
const MARKETAUX_KEY = Deno.env.get("MARKETAUX_API_KEY") || "";
const ALPHA_VANTAGE_KEY = Deno.env.get("ALPHA_VANTAGE_API_KEY") || "";

const CACHE_TTL_MINUTES = 15;

const CURRENCY_KEYWORDS: Record<string, string[]> = {
  USD: ["dollar", "fed", "fomc", "powell", "treasury", "us economy", "nonfarm", "cpi us"],
  EUR: ["euro", "ecb", "lagarde", "eurozone", "eu economy"],
  GBP: ["pound", "sterling", "boe", "bank of england", "bailey", "uk economy"],
  JPY: ["yen", "boj", "bank of japan", "ueda", "japan economy"],
  CHF: ["franc", "snb", "swiss", "switzerland"],
  AUD: ["aussie", "rba", "reserve bank of australia", "australia economy"],
  CAD: ["loonie", "boc", "bank of canada", "canada economy"],
  NZD: ["kiwi", "rbnz", "new zealand"],
  CNY: ["yuan", "pboc", "china economy", "renminbi"],
  MXN: ["peso", "banxico", "mexico economy"],
};

function extractCurrencies(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const [cur, keywords] of Object.entries(CURRENCY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw)) || lower.includes(cur.toLowerCase())) {
      found.push(cur);
    }
  }
  return found.length > 0 ? found : ["USD"];
}

function classifyImpact(text: string): "high" | "medium" | "low" {
  const lower = text.toLowerCase();
  const highWords = ["rate decision", "interest rate", "inflation", "cpi", "gdp", "nonfarm", "employment", "recession", "crisis", "war", "crash", "emergency", "default"];
  const medWords = ["trade balance", "pmi", "retail sales", "consumer", "housing", "manufacturing", "sentiment"];
  if (highWords.some((w) => lower.includes(w))) return "high";
  if (medWords.some((w) => lower.includes(w))) return "medium";
  return "low";
}

function classifySentiment(text: string): "positive" | "negative" {
  const lower = text.toLowerCase();
  const pos = ["rally", "surge", "gain", "rise", "strong", "boost", "recovery", "bullish", "growth", "hawkish", "beat", "exceed", "optimism", "upgrade"];
  const neg = ["fall", "drop", "decline", "weak", "crash", "recession", "bearish", "cut", "dovish", "miss", "warn", "risk", "fear", "downgrade", "slump"];
  const posCount = pos.filter((w) => lower.includes(w)).length;
  const negCount = neg.filter((w) => lower.includes(w)).length;
  return posCount >= negCount ? "positive" : "negative";
}

async function fetchFinnhub(currencies: string[]): Promise<any[]> {
  try {
    const query = currencies.join(" OR ").toLowerCase();
    const res = await fetch(`https://finnhub.io/api/v1/news?category=forex&token=${FINNHUB_KEY}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data || []).slice(0, 30).map((n: any) => ({
      id: `fh-${n.id}`,
      title: n.headline || "",
      summary: n.summary || "",
      url: n.url || "",
      imageUrl: n.image || "",
      source: n.source || "Finnhub",
      provider: "Finnhub",
      publishedAt: n.datetime ? new Date(n.datetime * 1000).toISOString() : new Date().toISOString(),
    }));
  } catch { return []; }
}

async function fetchFMP(currencies: string[]): Promise<any[]> {
  try {
    const endpoints = [
      `https://financialmodelingprep.com/api/v3/fmp/articles?page=0&size=20&apikey=${FMP_KEY}`,
      `https://financialmodelingprep.com/api/v4/forex_news?page=0&apikey=${FMP_KEY}`,
    ];
    const results = await Promise.allSettled(endpoints.map((u) => fetch(u).then((r) => r.json())));
    const articles: any[] = [];
    for (const r of results) {
      if (r.status === "fulfilled") {
        const arr = Array.isArray(r.value) ? r.value : r.value?.content || [];
        articles.push(...arr.slice(0, 15));
      }
    }
    return articles.map((n: any) => ({
      id: `fmp-${n.title?.slice(0, 20)}-${Date.now()}`,
      title: n.title || "",
      summary: n.text?.slice(0, 300) || n.content?.slice(0, 300) || "",
      url: n.url || n.link || "",
      imageUrl: n.image || n.banner_image || "",
      source: n.site || n.source || "FMP",
      provider: "FMP",
      publishedAt: n.publishedDate || n.published_utc || new Date().toISOString(),
    }));
  } catch { return []; }
}

async function fetchMarketaux(currencies: string[]): Promise<any[]> {
  try {
    const symbols = currencies.map((c) => `${c}USD`).join(",");
    const res = await fetch(
      `https://api.marketaux.com/v1/news/all?filter_entities=true&language=en&limit=15&api_token=${MARKETAUX_KEY}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.data || []).map((n: any) => ({
      id: `mx-${n.uuid || Date.now()}`,
      title: n.title || "",
      summary: n.description || n.snippet || "",
      url: n.url || "",
      imageUrl: n.image_url || "",
      source: n.source || "MarketAux",
      provider: "MarketAux",
      publishedAt: n.published_at || new Date().toISOString(),
    }));
  } catch { return []; }
}

async function fetchAlphaVantage(currencies: string[]): Promise<any[]> {
  try {
    const tickers = currencies.map((c) => `FOREX:${c}`).join(",");
    const res = await fetch(
      `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${tickers}&limit=15&apikey=${ALPHA_VANTAGE_KEY}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.feed || []).map((n: any) => ({
      id: `av-${n.title?.slice(0, 20)}-${Date.now()}`,
      title: n.title || "",
      summary: n.summary || "",
      url: n.url || "",
      imageUrl: n.banner_image || "",
      source: n.source || "Alpha Vantage",
      provider: "Alpha Vantage",
      publishedAt: n.time_published
        ? `${n.time_published.slice(0, 4)}-${n.time_published.slice(4, 6)}-${n.time_published.slice(6, 8)}T${n.time_published.slice(9, 11)}:${n.time_published.slice(11, 13)}:00Z`
        : new Date().toISOString(),
      sentimentScore: n.overall_sentiment_score,
    }));
  } catch { return []; }
}

function deduplicateByTitle(articles: any[]): any[] {
  const seen = new Set<string>();
  return articles.filter((a) => {
    const key = a.title?.toLowerCase().trim().slice(0, 60);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol } = await req.json();
    if (!symbol) throw new Error("Symbol required");

    const cacheKey = `analysis-news`;
    const normalizedSymbol = symbol.replace("/", "").toUpperCase();

    // ── Check DB cache ──
    const { data: cached } = await supabase
      .from("ai_analysis_cache")
      .select("analysis_data, expires_at")
      .eq("symbol", normalizedSymbol)
      .eq("analysis_type", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cached?.analysis_data) {
      console.log(`[analysis-news] Cache HIT for ${normalizedSymbol}`);
      return new Response(
        JSON.stringify(cached.analysis_data),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[analysis-news] Cache MISS for ${normalizedSymbol}, fetching from APIs...`);

    const currencies = normalizedSymbol.match(/.{3}/g) || ["EUR", "USD"];

    // Fetch from all 4 sources in parallel
    const [finnhubNews, fmpNews, marketauxNews, avNews] = await Promise.allSettled([
      fetchFinnhub(currencies),
      fetchFMP(currencies),
      fetchMarketaux(currencies),
      fetchAlphaVantage(currencies),
    ]);

    const allArticles: any[] = [];
    for (const r of [finnhubNews, fmpNews, marketauxNews, avNews]) {
      if (r.status === "fulfilled") allArticles.push(...r.value);
    }

    // Deduplicate
    const unique = deduplicateByTitle(allArticles);

    // Filter by relevance to currencies
    const currLower = currencies.map((c: string) => c.toLowerCase());
    const relevant = unique.filter((a) => {
      const text = `${a.title} ${a.summary}`.toLowerCase();
      return currLower.some((c: string) => {
        if (text.includes(c)) return true;
        const kws = CURRENCY_KEYWORDS[c.toUpperCase()] || [];
        return kws.some((kw) => text.includes(kw));
      });
    });

    const pool = relevant.length >= 3 ? relevant : unique;
    pool.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    const majorNews = pool.slice(0, 10).map((a) => {
      const curs = extractCurrencies(`${a.title} ${a.summary}`);
      const type = classifySentiment(`${a.title} ${a.summary}`);
      return {
        type,
        currency: curs[0] || currencies[0],
        title: a.title,
        description: a.summary?.slice(0, 250) || a.title,
        source: `${a.provider} — ${a.source}`,
      };
    });

    const relevantNews = pool.slice(0, 15).map((a, i) => ({
      id: a.id || `${i}`,
      title: a.title,
      summary: a.summary?.slice(0, 200) || "",
      imageUrl: a.imageUrl || `https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=240&fit=crop`,
      url: a.url,
      source: `${a.provider}`,
      publishedAt: a.publishedAt,
      impact: classifyImpact(`${a.title} ${a.summary}`),
      currencies: extractCurrencies(`${a.title} ${a.summary}`),
    }));

    const result = { majorNews, relevantNews };

    // ── Save to DB cache ──
    const expiresAt = new Date(Date.now() + CACHE_TTL_MINUTES * 60 * 1000).toISOString();
    await supabase.from("ai_analysis_cache").upsert(
      {
        symbol: normalizedSymbol,
        analysis_type: cacheKey,
        analysis_data: result,
        expires_at: expiresAt,
      },
      { onConflict: "symbol,analysis_type" }
    ).then(({ error }) => {
      if (error) console.warn("[analysis-news] Cache write failed:", error.message);
      else console.log(`[analysis-news] Cached ${normalizedSymbol} until ${expiresAt}`);
    });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
