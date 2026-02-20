import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SVG dimensions
const W = 780;
const H = 400;
const PAD_TOP = 30;
const PAD_BOTTOM = 40;
const PAD_LEFT = 60;
const PAD_RIGHT = 20;
const CHART_W = W - PAD_LEFT - PAD_RIGHT;
const CHART_H = H - PAD_TOP - PAD_BOTTOM;

interface Bar {
  o: number; h: number; l: number; c: number; t: number;
}

// In-memory cache
const svgCache = new Map<string, { svg: string; ts: number }>();
const CACHE_TTL = 5 * 60_000; // 5 min

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatPrice(n: number, isJpy: boolean): string {
  return isJpy ? n.toFixed(3) : n.toFixed(5);
}

function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function buildSvg(bars: Bar[], support: number | null, resistance: number | null, pair: string): string {
  if (bars.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <rect width="${W}" height="${H}" fill="#050d1a"/>
      <text x="${W / 2}" y="${H / 2}" fill="#94A3B8" text-anchor="middle" font-size="14" font-family="sans-serif">No data available</text>
    </svg>`;
  }

  const isJpy = pair.includes('JPY');

  // Find price range
  let minP = Infinity, maxP = -Infinity;
  for (const b of bars) {
    if (b.l < minP) minP = b.l;
    if (b.h > maxP) maxP = b.h;
  }
  if (support !== null) { minP = Math.min(minP, support); maxP = Math.max(maxP, support); }
  if (resistance !== null) { minP = Math.min(minP, resistance); maxP = Math.max(maxP, resistance); }

  const priceRange = maxP - minP || 0.0001;
  const padding = priceRange * 0.05;
  minP -= padding;
  maxP += padding;
  const totalRange = maxP - minP;

  const yOf = (price: number) => PAD_TOP + CHART_H * (1 - (price - minP) / totalRange);
  const xOf = (i: number) => PAD_LEFT + (i + 0.5) * (CHART_W / bars.length);

  const candleWidth = Math.max(1, Math.min(8, (CHART_W / bars.length) * 0.6));

  // Identify last day
  const lastDayStr = dayKey(bars[bars.length - 1].t);

  // Grid lines (5 levels)
  const gridLines: string[] = [];
  const priceLabels: string[] = [];
  for (let i = 0; i <= 5; i++) {
    const price = minP + (totalRange * i) / 5;
    const y = yOf(price);
    gridLines.push(`<line x1="${PAD_LEFT}" y1="${y}" x2="${W - PAD_RIGHT}" y2="${y}" stroke="#1e3a5f" stroke-width="0.5" stroke-dasharray="4,4"/>`);
    priceLabels.push(`<text x="${PAD_LEFT - 5}" y="${y + 3}" fill="#64748b" text-anchor="end" font-size="9" font-family="monospace">${formatPrice(price, isJpy)}</text>`);
  }

  // Day separators + day labels
  const daySeps: string[] = [];
  let prevDay = '';
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  for (let i = 0; i < bars.length; i++) {
    const dk = dayKey(bars[i].t);
    if (dk !== prevDay) {
      const x = PAD_LEFT + i * (CHART_W / bars.length);
      daySeps.push(`<line x1="${x}" y1="${PAD_TOP}" x2="${x}" y2="${H - PAD_BOTTOM}" stroke="#1e3a5f" stroke-width="0.5" stroke-dasharray="2,6"/>`);
      const d = new Date(bars[i].t);
      const label = `${dayNames[d.getUTCDay()]} ${d.getUTCDate()}`;
      daySeps.push(`<text x="${x + 4}" y="${H - PAD_BOTTOM + 14}" fill="#64748b" font-size="9" font-family="sans-serif">${escapeXml(label)}</text>`);
      prevDay = dk;
    }
  }

  // Candles
  const candles: string[] = [];
  for (let i = 0; i < bars.length; i++) {
    const b = bars[i];
    const x = xOf(i);
    const isLastDay = dayKey(b.t) === lastDayStr;
    const isUp = b.c >= b.o;

    const bodyTop = yOf(Math.max(b.o, b.c));
    const bodyBot = yOf(Math.min(b.o, b.c));
    const bodyH = Math.max(1, bodyBot - bodyTop);

    const wickTop = yOf(b.h);
    const wickBot = yOf(b.l);

    // Colors: last day highlighted, others dimmed
    let upColor: string, downColor: string, wickColor: string;
    if (isLastDay) {
      upColor = '#22c55e';
      downColor = '#ef4444';
      wickColor = isUp ? '#22c55e' : '#ef4444';
    } else {
      upColor = 'rgba(34,197,94,0.35)';
      downColor = 'rgba(239,68,68,0.35)';
      wickColor = 'rgba(148,163,184,0.3)';
    }

    const fillColor = isUp ? upColor : downColor;

    // Wick
    candles.push(`<line x1="${x}" y1="${wickTop}" x2="${x}" y2="${wickBot}" stroke="${wickColor}" stroke-width="1"/>`);
    // Body
    candles.push(`<rect x="${x - candleWidth / 2}" y="${bodyTop}" width="${candleWidth}" height="${bodyH}" fill="${fillColor}" rx="0.5"/>`);
  }

  // Support & Resistance lines
  const srLines: string[] = [];
  if (support !== null) {
    const y = yOf(support);
    srLines.push(`<line x1="${PAD_LEFT}" y1="${y}" x2="${W - PAD_RIGHT}" y2="${y}" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="6,3"/>`);
    srLines.push(`<rect x="${W - PAD_RIGHT - 75}" y="${y - 9}" width="74" height="16" rx="3" fill="rgba(34,197,94,0.15)"/>`);
    srLines.push(`<text x="${W - PAD_RIGHT - 40}" y="${y + 3}" fill="#22c55e" text-anchor="middle" font-size="9" font-family="monospace" font-weight="bold">S ${formatPrice(support, isJpy)}</text>`);
  }
  if (resistance !== null) {
    const y = yOf(resistance);
    srLines.push(`<line x1="${PAD_LEFT}" y1="${y}" x2="${W - PAD_RIGHT}" y2="${y}" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="6,3"/>`);
    srLines.push(`<rect x="${W - PAD_RIGHT - 75}" y="${y - 9}" width="74" height="16" rx="3" fill="rgba(239,68,68,0.15)"/>`);
    srLines.push(`<text x="${W - PAD_RIGHT - 40}" y="${y + 3}" fill="#ef4444" text-anchor="middle" font-size="9" font-family="monospace" font-weight="bold">R ${formatPrice(resistance, isJpy)}</text>`);
  }

  // Title
  const title = `<text x="${PAD_LEFT + 4}" y="${PAD_TOP - 10}" fill="#e2e8f0" font-size="13" font-family="sans-serif" font-weight="bold">${escapeXml(pair)} · 15m · 7 días</text>`;

  // Last day highlight background
  let lastDayBg = '';
  const firstLastDayIdx = bars.findIndex(b => dayKey(b.t) === lastDayStr);
  if (firstLastDayIdx >= 0) {
    const x1 = PAD_LEFT + firstLastDayIdx * (CHART_W / bars.length);
    const x2 = W - PAD_RIGHT;
    lastDayBg = `<rect x="${x1}" y="${PAD_TOP}" width="${x2 - x1}" height="${CHART_H}" fill="rgba(34,197,94,0.03)"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#050d1a"/>
      <stop offset="100%" stop-color="#0a1628"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)" rx="8"/>
  ${title}
  ${gridLines.join('\n  ')}
  ${priceLabels.join('\n  ')}
  ${daySeps.join('\n  ')}
  ${lastDayBg}
  ${candles.join('\n  ')}
  ${srLines.join('\n  ')}
  <rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="#1e3a5f" stroke-width="1" rx="8"/>
</svg>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pair = (url.searchParams.get('pair') || 'EUR/USD').replace(/[/\-_]/g, '');
    const base = pair.slice(0, 3).toUpperCase();
    const quote = pair.slice(3, 6).toUpperCase();
    const pairLabel = `${base}/${quote}`;

    // Support / Resistance from query or from signal
    let support: number | null = url.searchParams.has('support') ? parseFloat(url.searchParams.get('support')!) : null;
    let resistance: number | null = url.searchParams.has('resistance') ? parseFloat(url.searchParams.get('resistance')!) : null;
    if (support !== null && isNaN(support)) support = null;
    if (resistance !== null && isNaN(resistance)) resistance = null;

    const signalId = url.searchParams.get('signal_id');

    // Check cache
    const cacheKey = `${pair}_${support}_${resistance}_${signalId}`;
    const cached = svgCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return new Response(cached.svg, {
        headers: { ...corsHeaders, 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=300' },
      });
    }

    // If signal_id provided, fetch support/resistance from DB
    if (signalId && (support === null || resistance === null)) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      );
      const { data: sig } = await supabase
        .from('trading_signals')
        .select('support, resistance')
        .eq('id', signalId)
        .single();
      if (sig) {
        if (support === null && sig.support) support = Number(sig.support);
        if (resistance === null && sig.resistance) resistance = Number(sig.resistance);
      }
    }

    // Fetch 7 days of 15-min candles from Polygon.io
    const polygonKey = Deno.env.get('POLYGON_API_KEY');
    if (!polygonKey) {
      return new Response(
        buildSvg([], support, resistance, pairLabel),
        { headers: { ...corsHeaders, 'Content-Type': 'image/svg+xml' } },
      );
    }

    const now = new Date();
    const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fromStr = from.toISOString().split('T')[0];
    const toStr = now.toISOString().split('T')[0];

    const ticker = `C:${base}${quote}`;
    const apiUrl = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/15/minute/${fromStr}/${toStr}?adjusted=true&sort=asc&limit=50000&apiKey=${polygonKey}`;

    const res = await fetch(apiUrl);
    if (!res.ok) {
      const errText = await res.text();
      console.error('Polygon API error:', res.status, errText);
      return new Response(
        buildSvg([], support, resistance, pairLabel),
        { headers: { ...corsHeaders, 'Content-Type': 'image/svg+xml' } },
      );
    }

    const json = await res.json();
    const results = json.results || [];

    const bars: Bar[] = results.map((r: { o: number; h: number; l: number; c: number; t: number }) => ({
      o: r.o,
      h: r.h,
      l: r.l,
      c: r.c,
      t: r.t,
    }));

    const svg = buildSvg(bars, support, resistance, pairLabel);

    // Cache
    svgCache.set(cacheKey, { svg, ts: Date.now() });
    // Evict old entries
    if (svgCache.size > 50) {
      const oldest = svgCache.keys().next().value;
      if (oldest) svgCache.delete(oldest);
    }

    return new Response(svg, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
      },
    });
  } catch (err) {
    console.error('Candlestick chart error:', err);
    return new Response(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#050d1a"/><text x="${W / 2}" y="${H / 2}" fill="#ef4444" text-anchor="middle" font-size="12" font-family="sans-serif">Error generating chart</text></svg>`,
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'image/svg+xml' } },
    );
  }
});
