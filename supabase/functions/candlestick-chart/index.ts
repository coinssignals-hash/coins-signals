import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SVG dimensions (default)
const W_DEFAULT = 780;
const H_DEFAULT = 500;
// HD dimensions
const W_HD = 1920;
const H_HD = 1080;
const PAD_TOP_DEFAULT = 30;
const PAD_BOTTOM_DEFAULT = 40;
const PAD_LEFT_DEFAULT = 60;
const PAD_RIGHT_DEFAULT = 20;
// Volume section height ratio
const VOLUME_RATIO = 0.18;

interface Bar {
  o: number; h: number; l: number; c: number; t: number; v: number;
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

/**
 * Compute S/R from the last complete trading day (the day before the most recent day in bars).
 * Returns { support, resistance } or nulls if not enough data.
 */
function computeLastCompleteDaySR(bars: Bar[]): { support: number | null; resistance: number | null } {
  if (bars.length === 0) return { support: null, resistance: null };

  // Collect unique days
  const days = new Map<string, Bar[]>();
  for (const b of bars) {
    const dk = dayKey(b.t);
    if (!days.has(dk)) days.set(dk, []);
    days.get(dk)!.push(b);
  }

  const sortedDays = [...days.keys()].sort();
  if (sortedDays.length < 2) return { support: null, resistance: null };

  // The last complete day is the second-to-last day (the latest day may still be in progress)
  const lastCompleteDay = sortedDays[sortedDays.length - 2];
  const dayBars = days.get(lastCompleteDay)!;

  let high = -Infinity, low = Infinity;
  for (const b of dayBars) {
    if (b.h > high) high = b.h;
    if (b.l < low) low = b.l;
  }

  return { support: low, resistance: high };
}

function buildSvg(bars: Bar[], support: number | null, resistance: number | null, pair: string, hd = false): string {
  const W = hd ? W_HD : W_DEFAULT;
  const H = hd ? H_HD : H_DEFAULT;
  const scale = hd ? 2.4 : 1;
  const PAD_TOP = PAD_TOP_DEFAULT * scale;
  const PAD_BOTTOM = PAD_BOTTOM_DEFAULT * scale;
  const PAD_LEFT = PAD_LEFT_DEFAULT * scale;
  const PAD_RIGHT = PAD_RIGHT_DEFAULT * scale;
  const CHART_W = W - PAD_LEFT - PAD_RIGHT;
  const TOTAL_CHART_H = H - PAD_TOP - PAD_BOTTOM;
  const VOLUME_H = TOTAL_CHART_H * VOLUME_RATIO;
  const VOL_GAP = 8 * scale;
  const CANDLE_H = TOTAL_CHART_H - VOLUME_H - VOL_GAP;

  if (bars.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <rect width="${W}" height="${H}" fill="#050d1a"/>
      <text x="${W / 2}" y="${H / 2}" fill="#94A3B8" text-anchor="middle" font-size="${14 * scale}" font-family="sans-serif">No data available</text>
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

  // Volume max
  let maxVol = 0;
  for (const b of bars) { if (b.v > maxVol) maxVol = b.v; }
  if (maxVol === 0) maxVol = 1;

  const yOf = (price: number) => PAD_TOP + CANDLE_H * (1 - (price - minP) / totalRange);
  const xOf = (i: number) => PAD_LEFT + (i + 0.5) * (CHART_W / bars.length);
  const volY = (vol: number) => {
    const volTop = PAD_TOP + CANDLE_H + VOL_GAP;
    const h = (vol / maxVol) * VOLUME_H;
    return { y: volTop + VOLUME_H - h, h };
  };

  const candleWidth = Math.max(1 * scale, Math.min(8 * scale, (CHART_W / bars.length) * 0.6));

  // Identify last day
  const lastDayStr = dayKey(bars[bars.length - 1].t);

  // Grid lines (6 levels for price area)
  const gridLines: string[] = [];
  const priceLabels: string[] = [];
  for (let i = 0; i <= 6; i++) {
    const price = minP + (totalRange * i) / 6;
    const y = yOf(price);
    gridLines.push(`<line x1="${PAD_LEFT}" y1="${y}" x2="${W - PAD_RIGHT}" y2="${y}" stroke="#1e3a5f" stroke-width="${0.5 * scale}" stroke-dasharray="4,4" shape-rendering="crispEdges"/>`);
    priceLabels.push(`<text x="${PAD_LEFT - 5}" y="${y + 3}" fill="#64748b" text-anchor="end" font-size="${9 * scale}" font-family="monospace">${formatPrice(price, isJpy)}</text>`);
  }

  // Volume separator line
  const volSepY = PAD_TOP + CANDLE_H + VOL_GAP / 2;
  gridLines.push(`<line x1="${PAD_LEFT}" y1="${volSepY}" x2="${W - PAD_RIGHT}" y2="${volSepY}" stroke="#1e3a5f" stroke-width="${0.8 * scale}" shape-rendering="crispEdges"/>`);
  // Volume label
  gridLines.push(`<text x="${PAD_LEFT + 4}" y="${PAD_TOP + CANDLE_H + VOL_GAP + 11 * scale}" fill="#475569" font-size="${8 * scale}" font-family="sans-serif" font-weight="600">VOL</text>`);

  // Day separators + day labels
  const daySeps: string[] = [];
  let prevDay = '';
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  for (let i = 0; i < bars.length; i++) {
    const dk = dayKey(bars[i].t);
    if (dk !== prevDay) {
      const x = PAD_LEFT + i * (CHART_W / bars.length);
      daySeps.push(`<line x1="${x}" y1="${PAD_TOP}" x2="${x}" y2="${H - PAD_BOTTOM}" stroke="#1e3a5f" stroke-width="${0.5 * scale}" stroke-dasharray="2,6" shape-rendering="crispEdges"/>`);
      const d = new Date(bars[i].t);
      const label = `${dayNames[d.getUTCDay()]} ${d.getUTCDate()}`;
      daySeps.push(`<text x="${x + 4}" y="${H - PAD_BOTTOM + 14 * scale}" fill="#64748b" font-size="${9 * scale}" font-family="sans-serif">${escapeXml(label)}</text>`);
      prevDay = dk;
    }
  }

  // Candles + Volume bars
  const candles: string[] = [];
  const volumeBars: string[] = [];
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
    candles.push(`<line x1="${x}" y1="${wickTop}" x2="${x}" y2="${wickBot}" stroke="${wickColor}" stroke-width="${scale}" shape-rendering="crispEdges"/>`);
    // Body
    candles.push(`<rect x="${x - candleWidth / 2}" y="${bodyTop}" width="${candleWidth}" height="${bodyH}" fill="${fillColor}" rx="${0.5 * scale}" shape-rendering="crispEdges"/>`);

    // Volume bar
    const { y: vy, h: vh } = volY(b.v);
    const volColor = isLastDay
      ? (isUp ? 'rgba(34,197,94,0.6)' : 'rgba(239,68,68,0.6)')
      : (isUp ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)');
    volumeBars.push(`<rect x="${x - candleWidth / 2}" y="${vy}" width="${candleWidth}" height="${Math.max(1, vh)}" fill="${volColor}" rx="${0.3 * scale}" shape-rendering="crispEdges"/>`);
  }

  // Last day highlight background + index
  const firstLastDayIdx = bars.findIndex(b => dayKey(b.t) === lastDayStr);
  let lastDayBg = '';
  if (firstLastDayIdx >= 0) {
    const x1 = PAD_LEFT + firstLastDayIdx * (CHART_W / bars.length);
    const x2 = W - PAD_RIGHT;
    lastDayBg = `<rect x="${x1}" y="${PAD_TOP}" width="${x2 - x1}" height="${CANDLE_H}" fill="rgba(34,197,94,0.03)"/>`;
  }

  // Support & Resistance lines (only last day)
  const srLines: string[] = [];
  const labelW = 90 * scale;
  const labelH = 20 * scale;
  const fontSize = 10 * scale;
  const lineW = 1.5 * scale;
  const srX1 = firstLastDayIdx >= 0 ? PAD_LEFT + firstLastDayIdx * (CHART_W / bars.length) : PAD_LEFT;
  const srX2 = W - PAD_RIGHT;

  if (resistance !== null) {
    const y = yOf(resistance);
    srLines.push(`<line x1="${srX1}" y1="${y}" x2="${srX2}" y2="${y}" stroke="#22c55e" stroke-width="${lineW}" stroke-dasharray="8,4" shape-rendering="crispEdges"/>`);
    srLines.push(`<rect x="${srX2 - labelW - 4}" y="${y - labelH / 2}" width="${labelW}" height="${labelH}" rx="${4 * scale}" fill="rgba(34,197,94,0.15)" stroke="#22c55e" stroke-width="${0.8 * scale}"/>`);
    srLines.push(`<text x="${srX2 - labelW / 2 - 4}" y="${y + fontSize / 3}" fill="#22c55e" text-anchor="middle" font-size="${fontSize}" font-family="monospace" font-weight="bold">${formatPrice(resistance, isJpy)}</text>`);
  }
  if (support !== null) {
    const y = yOf(support);
    srLines.push(`<line x1="${srX1}" y1="${y}" x2="${srX2}" y2="${y}" stroke="#ef4444" stroke-width="${lineW}" stroke-dasharray="8,4" shape-rendering="crispEdges"/>`);
    srLines.push(`<rect x="${srX2 - labelW - 4}" y="${y - labelH / 2}" width="${labelW}" height="${labelH}" rx="${4 * scale}" fill="rgba(239,68,68,0.15)" stroke="#ef4444" stroke-width="${0.8 * scale}"/>`);
    srLines.push(`<text x="${srX2 - labelW / 2 - 4}" y="${y + fontSize / 3}" fill="#ef4444" text-anchor="middle" font-size="${fontSize}" font-family="monospace" font-weight="bold">${formatPrice(support, isJpy)}</text>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="geometricPrecision">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#050d1a"/>
      <stop offset="100%" stop-color="#0a1628"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)" rx="${8 * scale}"/>
  ${title}
  ${gridLines.join('\n  ')}
  ${priceLabels.join('\n  ')}
  ${daySeps.join('\n  ')}
  ${lastDayBg}
  ${candles.join('\n  ')}
  ${volumeBars.join('\n  ')}
  ${srLines.join('\n  ')}
  <rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="#1e3a5f" stroke-width="${scale}" rx="${8 * scale}"/>
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
    const hd = url.searchParams.get('hd') === '1';
    // sr_mode: 'manual' (default, use provided values), 'auto' (compute from last complete trading day)
    const srMode = url.searchParams.get('sr_mode') || 'manual';

    // Check cache
    const cacheKey = `${pair}_${support}_${resistance}_${signalId}_${hd ? 'hd' : 'sd'}_${srMode}`;
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
        buildSvg([], support, resistance, pairLabel, hd),
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
        buildSvg([], support, resistance, pairLabel, hd),
        { headers: { ...corsHeaders, 'Content-Type': 'image/svg+xml' } },
      );
    }

    const json = await res.json();
    const results = json.results || [];

    const bars: Bar[] = results.map((r: { o: number; h: number; l: number; c: number; t: number; v: number }) => ({
      o: r.o,
      h: r.h,
      l: r.l,
      c: r.c,
      t: r.t,
      v: r.v || 0,
    }));

    // Auto-compute S/R from last complete trading day if sr_mode=auto or no manual values provided
    if (srMode === 'auto' || (support === null && resistance === null)) {
      const computed = computeLastCompleteDaySR(bars);
      if (support === null) support = computed.support;
      if (resistance === null) resistance = computed.resistance;
    }

    const svg = buildSvg(bars, support, resistance, pairLabel, hd);

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
    const errW = 780; const errH = 500;
    return new Response(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${errW}" height="${errH}"><rect width="${errW}" height="${errH}" fill="#050d1a"/><text x="${errW / 2}" y="${errH / 2}" fill="#ef4444" text-anchor="middle" font-size="12" font-family="sans-serif">Error generating chart</text></svg>`,
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'image/svg+xml' } },
    );
  }
});
