import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const CURRENCY_FLAG: Record<string, string> = {
  USD: 'us', EUR: 'eu', GBP: 'gb', JPY: 'jp', AUD: 'au',
  CAD: 'ca', CHF: 'ch', NZD: 'nz', CNY: 'cn', HKD: 'hk',
  SGD: 'sg', MXN: 'mx', SEK: 'se', NOK: 'no', DKK: 'dk',
  ZAR: 'za', BRL: 'br', INR: 'in', KRW: 'kr', TRY: 'tr',
};

function flagUrl(code: string): string {
  const iso = CURRENCY_FLAG[code.toUpperCase()] ?? code.toLowerCase().slice(0, 2);
  return `https://flagcdn.com/w160/${iso}.png`;
}

function pipSize(price: number): number {
  return price >= 10 ? 0.01 : 0.0001;
}

function toPips(diff: number, price: number): string {
  const pips = diff / pipSize(price);
  return (pips >= 0 ? '+' : '') + pips.toFixed(1);
}

function toPercent(diff: number, base: number): string {
  const pct = (diff / base) * 100;
  return (pct >= 0 ? '+' : '') + pct.toFixed(3);
}

function toPercentNum(diff: number, base: number): number {
  return Math.round(((diff / base) * 100) * 10000) / 10000;
}

function formatPrice(n: number): string {
  return n >= 10 ? n.toFixed(3) : n.toFixed(5);
}

function formatDatetime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  }) + ' ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ---------- Polygon price fetcher with batch caching ----------
const priceCache = new Map<string, { price: number; ts: number }>();
const PRICE_CACHE_TTL = 15_000; // 15s

async function fetchCurrentPrice(base: string, quote: string, apiKey: string): Promise<number | null> {
  const key = `${base}${quote}`;
  const cached = priceCache.get(key);
  if (cached && Date.now() - cached.ts < PRICE_CACHE_TTL) return cached.price;

  try {
    const res = await fetch(
      `https://api.polygon.io/v1/last_quote/currencies/${base}/${quote}?apiKey=${apiKey}`,
    );
    if (!res.ok) { await res.text(); return null; }
    const json = await res.json();
    if (json.last) {
      const price = (json.last.ask + json.last.bid) / 2;
      priceCache.set(key, { price, ts: Date.now() });
      return price;
    }
  } catch (e) {
    console.error(`Price fetch error ${key}:`, e);
  }
  return null;
}

// Evict oldest cache entries
function evictPriceCache() {
  if (priceCache.size > 60) {
    const oldest = priceCache.keys().next().value;
    if (oldest) priceCache.delete(oldest);
  }
}

// ---------- Types ----------
interface DbSignal {
  id: string;
  currency_pair: string;
  datetime: string;
  status: string;
  probability: number;
  trend: string;
  action: string;
  entry_price: number;
  take_profit: number;
  stop_loss: number;
  support: number | null;
  resistance: number | null;
  session_data: unknown;
  analysis_data: unknown;
  created_at: string;
}

interface CurrencyPylon {
  currency: string;
  flag: string;
  role: 'base' | 'quote';
  entryPrice: number;
  currentPrice: number | null;
  percentChange: number | null;
  percentDisplay: string | null;
  pips: number | null;
  pipsDisplay: string | null;
  direction: 'up' | 'down' | 'neutral';
  // Visual pylon sizing (0-100, clamped for rendering)
  pylonHeight: number;
  color: string; // hex ready for mobile render
  hasLiveData: boolean;
}

interface ImpactSummary {
  overallDirection: 'bullish' | 'bearish' | 'neutral';
  avgPercent: number | null;
  avgPercentDisplay: string | null;
  spreadPips: number | null;
  spreadPipsDisplay: string | null;
  pylons: CurrencyPylon[];
}

function buildPylon(
  currency: string,
  role: 'base' | 'quote',
  entry: number,
  currentPrice: number | null,
): CurrencyPylon {
  const isJpy = currency === 'JPY';
  const pipMul = isJpy ? 100 : 10000;

  let percentChange: number | null = null;
  let pips: number | null = null;
  let direction: 'up' | 'down' | 'neutral' = 'neutral';

  if (currentPrice !== null) {
    const diff = currentPrice - entry;
    percentChange = toPercentNum(diff, entry);
    pips = Math.round(diff * pipMul * 10) / 10;
    direction = percentChange > 0.001 ? 'up' : percentChange < -0.001 ? 'down' : 'neutral';
  }

  // Pylon height: map |percent| to 0-100 range (1% = full bar)
  const pylonHeight = percentChange !== null
    ? Math.min(100, Math.abs(percentChange) * 100)
    : 0;

  const color = direction === 'up'
    ? '#22C55E'  // green-500
    : direction === 'down'
      ? '#EF4444' // red-500
      : '#94A3B8'; // slate-400

  return {
    currency,
    flag: flagUrl(currency),
    role,
    entryPrice: entry,
    currentPrice,
    percentChange,
    percentDisplay: percentChange !== null
      ? `${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(2)}%`
      : null,
    pips,
    pipsDisplay: pips !== null
      ? `${pips >= 0 ? '+' : ''}${pips.toFixed(1)}`
      : null,
    direction,
    pylonHeight,
    color,
    hasLiveData: currentPrice !== null,
  };
}

async function buildImpact(s: DbSignal, polygonKey: string | null): Promise<ImpactSummary> {
  const raw = s.currency_pair.replace(/[/\-_]/g, '');
  const base = raw.slice(0, 3).toUpperCase();
  const quote = raw.slice(3, 6).toUpperCase();
  const entry = Number(s.entry_price);

  let currentPrice: number | null = null;
  if (polygonKey) {
    currentPrice = await fetchCurrentPrice(base, quote, polygonKey);
  }

  const basePylon = buildPylon(base, 'base', entry, currentPrice);
  // Quote pylon: inverse perspective
  const quotePylon = buildPylon(
    quote,
    'quote',
    entry,
    currentPrice !== null ? currentPrice : null,
  );
  // For the quote currency, invert the direction (if base goes up, quote weakens)
  if (quotePylon.percentChange !== null) {
    quotePylon.percentChange = -quotePylon.percentChange;
    quotePylon.percentDisplay = `${quotePylon.percentChange >= 0 ? '+' : ''}${quotePylon.percentChange.toFixed(2)}%`;
    quotePylon.direction = quotePylon.percentChange > 0.001 ? 'up' : quotePylon.percentChange < -0.001 ? 'down' : 'neutral';
    quotePylon.color = quotePylon.direction === 'up' ? '#22C55E' : quotePylon.direction === 'down' ? '#EF4444' : '#94A3B8';
    quotePylon.pylonHeight = Math.min(100, Math.abs(quotePylon.percentChange) * 100);
    if (quotePylon.pips !== null) {
      quotePylon.pips = -quotePylon.pips;
      quotePylon.pipsDisplay = `${quotePylon.pips >= 0 ? '+' : ''}${quotePylon.pips.toFixed(1)}`;
    }
  }

  const pylons = [basePylon, quotePylon];
  const percents = pylons.map(p => p.percentChange).filter((v): v is number => v !== null);
  const avgPct = percents.length > 0 ? percents.reduce((a, b) => a + b, 0) / percents.length : null;

  const isJpy = base === 'JPY' || quote === 'JPY';
  const pipMul = isJpy ? 100 : 10000;
  const spreadPips = currentPrice !== null ? Math.round((currentPrice - entry) * pipMul * 10) / 10 : null;

  return {
    overallDirection: basePylon.direction === 'up' ? 'bullish' : basePylon.direction === 'down' ? 'bearish' : 'neutral',
    avgPercent: avgPct !== null ? Math.round(avgPct * 10000) / 10000 : null,
    avgPercentDisplay: avgPct !== null ? `${avgPct >= 0 ? '+' : ''}${avgPct.toFixed(2)}%` : null,
    spreadPips,
    spreadPipsDisplay: spreadPips !== null ? `${spreadPips >= 0 ? '+' : ''}${spreadPips.toFixed(1)} pips` : null,
    pylons,
  };
}

function buildMobileSignal(s: DbSignal, impact: ImpactSummary) {
  const entry = Number(s.entry_price);
  const tp = Number(s.take_profit);
  const sl = Number(s.stop_loss);
  const tpDiff = tp - entry;
  const slDiff = sl - entry;
  const rr = Math.abs(tpDiff / slDiff);

  const raw = s.currency_pair.replace(/[/\-_]/g, '');
  const base = raw.slice(0, 3).toUpperCase();
  const quote = raw.slice(3, 6).toUpperCase();

  return {
    id: s.id,
    status: s.status,

    pair: {
      raw: s.currency_pair,
      base,
      quote,
      label: `${base}-${quote}`,
      baseFlag: flagUrl(base),
      quoteFlag: flagUrl(quote),
    },

    datetime: {
      iso: s.datetime,
      display: formatDatetime(s.datetime),
    },

    direction: {
      action: s.action,
      trend: s.trend,
      isBuy: s.action === 'BUY',
    },

    probability: s.probability,

    prices: {
      entry: { raw: entry, display: formatPrice(entry) },
      tp: {
        raw: tp,
        display: formatPrice(tp),
        pips: toPips(tpDiff, entry),
        percent: toPercent(tpDiff, entry),
        isPositive: tpDiff > 0,
      },
      sl: {
        raw: sl,
        display: formatPrice(sl),
        pips: toPips(slDiff, entry),
        percent: toPercent(slDiff, entry),
        isPositive: slDiff > 0,
      },
      support: s.support ? { raw: s.support, display: formatPrice(Number(s.support)) } : null,
      resistance: s.resistance ? { raw: s.resistance, display: formatPrice(Number(s.resistance)) } : null,
    },

    riskReward: parseFloat(rr.toFixed(2)),

    // --- NEW: Currency impact pylons ---
    impact,

    session: Array.isArray(s.session_data) ? s.session_data : [],
    analysis: Array.isArray(s.analysis_data) ? s.analysis_data : [],
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const date = url.searchParams.get('date');
    const status = url.searchParams.get('status');
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50'), 200);
    const offset = parseInt(url.searchParams.get('offset') ?? '0');
    const includePrices = url.searchParams.get('prices') !== 'false'; // opt-out with ?prices=false

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const polygonKey = includePrices ? (Deno.env.get('POLYGON_API_KEY') ?? null) : null;

    let query = supabase
      .from('trading_signals')
      .select('*', { count: 'exact' })
      .order('datetime', { ascending: false })
      .range(offset, offset + limit - 1);

    if (date) {
      const start = new Date(date);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setUTCHours(23, 59, 59, 999);
      query = query.gte('datetime', start.toISOString()).lte('datetime', end.toISOString());
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const dbSignals = data as DbSignal[];

    // Fetch impacts in parallel (batched by unique pair to avoid duplicate API calls)
    const uniquePairs = [...new Set(dbSignals.map(s => s.currency_pair))];
    const impactMap = new Map<string, ImpactSummary>();

    // Build one representative signal per pair for price fetch
    await Promise.all(
      uniquePairs.map(async (pair) => {
        const representative = dbSignals.find(s => s.currency_pair === pair)!;
        const impact = await buildImpact(representative, polygonKey);
        impactMap.set(pair, impact);
      }),
    );

    evictPriceCache();

    const signals = dbSignals.map(s => {
      const impact = impactMap.get(s.currency_pair)!;
      return buildMobileSignal(s, impact);
    });

    const payload = {
      meta: {
        total: count ?? signals.length,
        limit,
        offset,
        returned: signals.length,
        generatedAt: new Date().toISOString(),
        livePrices: includePrices && polygonKey !== null,
      },
      signals,
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=15, stale-while-revalidate=10',
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
