import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Currency → ISO 3166-1 alpha-2 flag code map
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

/** Derive pip size from price (forex heuristic) */
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

function formatPrice(n: number): string {
  // Determine decimal places from magnitude
  return n >= 10 ? n.toFixed(3) : n.toFixed(5);
}

function formatDatetime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  }) + ' ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

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

function buildMobileSignal(s: DbSignal) {
  const entry = Number(s.entry_price);
  const tp = Number(s.take_profit);
  const sl = Number(s.stop_loss);

  const tpDiff = tp - entry;
  const slDiff = sl - entry;
  const rr = Math.abs(tpDiff / slDiff);

  // Parse pair symbols (e.g. "USD/JPY", "USDJPY", "EUR-USD")
  const raw = s.currency_pair.replace(/[/\-_]/, '');
  const base = raw.slice(0, 3).toUpperCase();
  const quote = raw.slice(3, 6).toUpperCase();

  return {
    // Identity
    id: s.id,
    status: s.status,

    // Pair display
    pair: {
      raw: s.currency_pair,
      base,
      quote,
      label: `${base}-${quote}`,
      baseFlag: flagUrl(base),
      quoteFlag: flagUrl(quote),
    },

    // Timing (pre-formatted for immediate render)
    datetime: {
      iso: s.datetime,
      display: formatDatetime(s.datetime),
    },

    // Signal direction
    direction: {
      action: s.action,           // "BUY" | "SELL"
      trend: s.trend,             // "bullish" | "bearish"
      isBuy: s.action === 'BUY',
    },

    // Probability gauge (0–100)
    probability: s.probability,

    // Prices — pre-formatted strings, no client-side math needed
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

    // Pre-computed risk/reward
    riskReward: parseFloat(rr.toFixed(2)),

    // Day range helpers (if session data exists)
    session: Array.isArray(s.session_data) ? s.session_data : [],
    analysis: Array.isArray(s.analysis_data) ? s.analysis_data : [],
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const date = url.searchParams.get('date');          // YYYY-MM-DD
    const status = url.searchParams.get('status');       // active | pending | completed | cancelled
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50'), 200);
    const offset = parseInt(url.searchParams.get('offset') ?? '0');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

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

    const signals = (data as DbSignal[]).map(buildMobileSignal);

    const payload = {
      meta: {
        total: count ?? signals.length,
        limit,
        offset,
        returned: signals.length,
        generatedAt: new Date().toISOString(),
      },
      signals,
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        // Cache 30 s on CDN edge, 10 s stale-while-revalidate
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=10',
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
