import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
};

const VALID_CURRENCIES = ['EUR', 'USD', 'AUD', 'CAD', 'GBP', 'JPY', 'CHF', 'NZD'];

const SOURCE_LOGOS: Record<string, string> = {
  'Reuters': 'https://logo.clearbit.com/reuters.com',
  'Bloomberg': 'https://logo.clearbit.com/bloomberg.com',
  'CNBC': 'https://logo.clearbit.com/cnbc.com',
  'MarketWatch': 'https://logo.clearbit.com/marketwatch.com',
  'Financial Times': 'https://logo.clearbit.com/ft.com',
  'Investing.com': 'https://logo.clearbit.com/investing.com',
  'FXStreet': 'https://logo.clearbit.com/fxstreet.com',
  'DailyFX': 'https://logo.clearbit.com/dailyfx.com',
  'Forex Factory': 'https://logo.clearbit.com/forexfactory.com',
  'ForexLive': 'https://logo.clearbit.com/forexlive.com',
  'MarketAux': 'https://logo.clearbit.com/marketaux.com',
  'FMP': 'https://logo.clearbit.com/financialmodelingprep.com',
};

const CURRENCY_PATTERNS: Record<string, RegExp> = {
  'USD': /\b(USD|dollar|dólar|US\$|federal reserve|fed|powell)\b/i,
  'EUR': /\b(EUR|euro|eurozone|ECB|lagarde)\b/i,
  'GBP': /\b(GBP|pound|sterling|BOE|bank of england)\b/i,
  'JPY': /\b(JPY|yen|BOJ|bank of japan|ueda)\b/i,
  'AUD': /\b(AUD|aussie|australian dollar|RBA)\b/i,
  'CAD': /\b(CAD|loonie|canadian dollar|BOC)\b/i,
  'CHF': /\b(CHF|swiss franc|SNB)\b/i,
  'NZD': /\b(NZD|kiwi|new zealand dollar|RBNZ)\b/i,
};

interface CardRender {
  impact_color: string;
  impact_label: string;
  impact_icon: string;
  sentiment_color: string;
  sentiment_label: string;
  sentiment_icon: string;
  category_label: string;
  category_icon: string;
  fallback_image: string;
  source_initials: string;
}

interface MobileNewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  source_logo: string | null;
  url: string;
  image_url: string | null;
  published_at: string;
  time_ago: string;
  category: string;
  affected_currencies: string[];
  sentiment: 'bullish' | 'bearish' | 'neutral';
  impact: 'high' | 'medium' | 'low';
  card: CardRender;
}

function detectCurrencies(text: string): string[] {
  const currencies: string[] = [];
  for (const [currency, pattern] of Object.entries(CURRENCY_PATTERNS)) {
    if (pattern.test(text)) currencies.push(currency);
  }
  return currencies.length > 0 ? currencies : ['USD'];
}

function getTimeAgo(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function detectCategory(text: string): string {
  const cats: Record<string, RegExp> = {
    'monetary_policy': /\b(interest rate|rate decision|monetary policy|QE|quantitative)\b/i,
    'inflation': /\b(inflation|CPI|consumer price|deflation)\b/i,
    'employment': /\b(employment|jobs|unemployment|NFP|payroll|labor)\b/i,
    'gdp': /\b(GDP|growth|recession|economic output)\b/i,
    'central_bank': /\b(fed|ECB|BOE|BOJ|central bank|FOMC)\b/i,
    'trade': /\b(trade|tariff|export|import|deficit)\b/i,
    'geopolitics': /\b(war|conflict|election|sanction|political)\b/i,
  };
  for (const [cat, pattern] of Object.entries(cats)) {
    if (pattern.test(text)) return cat;
  }
  return 'market';
}

function detectSentiment(text: string): 'bullish' | 'bearish' | 'neutral' {
  const bull = (text.match(/\b(surge|rally|gain|rise|bullish|positive|growth|strong|optimism|higher|up)\b/gi) || []).length;
  const bear = (text.match(/\b(fall|drop|decline|bearish|negative|weak|fear|crash|slump|lower|down)\b/gi) || []).length;
  if (bull > bear) return 'bullish';
  if (bear > bull) return 'bearish';
  return 'neutral';
}

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  monetary_policy: { label: 'Política Monetaria', icon: '🏦' },
  inflation: { label: 'Inflación', icon: '📈' },
  employment: { label: 'Empleo', icon: '👷' },
  gdp: { label: 'PIB', icon: '📊' },
  central_bank: { label: 'Banco Central', icon: '🏛️' },
  trade: { label: 'Comercio', icon: '🚢' },
  geopolitics: { label: 'Geopolítica', icon: '🌍' },
  market: { label: 'Mercado', icon: '💹' },
};

function buildCard(impact: 'high' | 'medium' | 'low', sentiment: 'bullish' | 'bearish' | 'neutral', category: string, source: string): CardRender {
  const impactMap = { high: { color: '#EF4444', label: 'Alto', icon: '🔴' }, medium: { color: '#F59E0B', label: 'Medio', icon: '🟡' }, low: { color: '#22C55E', label: 'Bajo', icon: '🟢' } };
  const sentimentMap = { bullish: { color: '#22C55E', label: 'Alcista', icon: '📈' }, bearish: { color: '#EF4444', label: 'Bajista', icon: '📉' }, neutral: { color: '#6B7280', label: 'Neutral', icon: '➖' } };
  const catMeta = CATEGORY_META[category] || CATEGORY_META.market;
  const initials = source.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  return {
    impact_color: impactMap[impact].color,
    impact_label: impactMap[impact].label,
    impact_icon: impactMap[impact].icon,
    sentiment_color: sentimentMap[sentiment].color,
    sentiment_label: sentimentMap[sentiment].label,
    sentiment_icon: sentimentMap[sentiment].icon,
    category_label: catMeta.label,
    category_icon: catMeta.icon,
    fallback_image: `https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=240&fit=crop`,
    source_initials: initials,
  };
}

function detectImpact(text: string): 'high' | 'medium' | 'low' {
  if (/\b(rate decision|NFP|CPI|GDP|FOMC|emergency|crisis)\b/i.test(text)) return 'high';
  if (/\b(employment|inflation|trade|policy|central bank)\b/i.test(text)) return 'medium';
  return 'low';
}

// Simple XML parser for RSS feeds
function parseRSSItems(xml: string): Array<{ title: string; link: string; description: string; pubDate: string; imageUrl?: string }> {
  const items: Array<{ title: string; link: string; description: string; pubDate: string; imageUrl?: string }> = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const title = (itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || itemXml.match(/<title>(.*?)<\/title>/) || [])[1] || '';
    const link = (itemXml.match(/<link><!\[CDATA\[(.*?)\]\]><\/link>/) || itemXml.match(/<link>(.*?)<\/link>/) || [])[1] || '';
    const description = (itemXml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || itemXml.match(/<description>([\s\S]*?)<\/description>/) || [])[1] || '';
    const pubDate = (itemXml.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || '';
    const mediaUrl = (itemXml.match(/<media:content[^>]+url="([^"]+)"/) || [])[1];
    const enclosureUrl = (itemXml.match(/<enclosure[^>]+url="([^"]+)"/) || [])[1];
    const descImgUrl = (description.match(/<img[^>]+src="([^"]+)"/) || [])[1];
    const imageUrl = mediaUrl || enclosureUrl || descImgUrl;
    if (title) {
      items.push({ title: title.trim(), link: link.trim(), description: description.replace(/<[^>]+>/g, '').trim(), pubDate, imageUrl });
    }
  }
  return items;
}

// --- Source fetchers ---

async function fetchFinnhub(apiKey: string): Promise<MobileNewsItem[]> {
  try {
    const res = await fetch(`https://finnhub.io/api/v1/news?category=forex&token=${apiKey}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.slice(0, 20).map((item: any, i: number) => {
      const text = `${item.headline} ${item.summary || ''}`;
      const pubDate = new Date(item.datetime * 1000).toISOString();
      const cat = detectCategory(text); const sent = detectSentiment(text); const imp = detectImpact(text);
      const src = item.source || 'Finnhub';
      return {
        id: `finnhub-${item.id || i}`, title: item.headline, summary: item.summary || '',
        source: src, source_logo: SOURCE_LOGOS[item.source] || null,
        url: item.url, image_url: item.image || null, published_at: pubDate,
        time_ago: getTimeAgo(pubDate), category: cat,
        affected_currencies: detectCurrencies(text), sentiment: sent, impact: imp,
        card: buildCard(imp, sent, cat, src),
      };
    });
  } catch { return []; }
}



async function fetchNewsApi(apiKey: string): Promise<MobileNewsItem[]> {
  try {
    const res = await fetch(`https://newsapi.org/v2/top-headlines?category=business&language=en&pageSize=20&apiKey=${apiKey}`);
    if (!res.ok) return [];
    const data = await res.json();
    if (data.status !== 'ok' || !data.articles) return [];
    return data.articles
      .filter((a: any) => a.title && a.title !== '[Removed]')
      .map((item: any, i: number) => {
        const text = `${item.title} ${item.description || ''}`;
        const cat = detectCategory(text); const sent = detectSentiment(text); const imp = detectImpact(text);
        const src = item.source?.name || 'NewsAPI';
        return {
          id: `newsapi-${i}-${Date.now()}`, title: item.title, summary: item.description || '',
          source: src, source_logo: SOURCE_LOGOS[src] || null,
          url: item.url, image_url: item.urlToImage || null, published_at: item.publishedAt,
          time_ago: getTimeAgo(item.publishedAt), category: cat,
          affected_currencies: detectCurrencies(text), sentiment: sent, impact: imp,
          card: buildCard(imp, sent, cat, src),
        };
      });
  } catch { return []; }
}

function rssToItems(items: ReturnType<typeof parseRSSItems>, sourceId: string, sourceName: string): MobileNewsItem[] {
  return items.slice(0, 15).map((item, i) => {
    const text = `${item.title} ${item.description}`;
    const pubDate = item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString();
    const cat = detectCategory(text); const sent = detectSentiment(text); const imp = detectImpact(text);
    return {
      id: `${sourceId}-${i}-${Date.now()}`, title: item.title,
      summary: item.description.substring(0, 200), source: sourceName,
      source_logo: SOURCE_LOGOS[sourceName] || null, url: item.link,
      image_url: item.imageUrl || null, published_at: pubDate,
      time_ago: getTimeAgo(pubDate), category: cat,
      affected_currencies: detectCurrencies(text), sentiment: sent, impact: imp,
      card: buildCard(imp, sent, cat, sourceName),
    };
  });
}

async function fetchRSS(url: string, sourceId: string, sourceName: string): Promise<MobileNewsItem[]> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'EcoSignalBot/1.0' } });
    if (!res.ok) return [];
    const xml = await res.text();
    return rssToItems(parseRSSItems(xml), sourceId, sourceName);
  } catch (e) {
    console.error(`[mobile-news] ${sourceName} RSS error:`, e);
    return [];
  }
}

// Fetch from MarketAux API
async function fetchMarketAux(apiKey: string): Promise<MobileNewsItem[]> {
  try {
    const res = await fetch(
      `https://api.marketaux.com/v1/news/all?api_token=${apiKey}&filter_entities=true&language=en&limit=20&domains=bloomberg.com,reuters.com,cnbc.com,ft.com,wsj.com,investing.com,forexlive.com,fxstreet.com`
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.data || !Array.isArray(data.data)) return [];

    return data.data.map((item: any, i: number) => {
      const text = `${item.title} ${item.description || ''}`;
      const entitySentiment = item.entities?.[0]?.sentiment_score;
      let sent: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      if (entitySentiment != null) {
        sent = entitySentiment > 0.2 ? 'bullish' : entitySentiment < -0.2 ? 'bearish' : 'neutral';
      } else {
        sent = detectSentiment(text);
      }
      const cat = detectCategory(text);
      const imp = detectImpact(text);
      const src = item.source || 'MarketAux';

      const entityCurrencies = (item.entities || [])
        .filter((e: any) => e.type === 'currency' || e.type === 'index' || e.type === 'equity')
        .map((e: any) => e.symbol?.substring(0, 3)?.toUpperCase())
        .filter((c: string) => c && Object.keys(CURRENCY_PATTERNS).includes(c));
      const currencies = entityCurrencies.length > 0 ? [...new Set(entityCurrencies)] : detectCurrencies(text);

      return {
        id: `marketaux-${item.uuid || i}-${Date.now()}`,
        title: item.title,
        summary: (item.description || item.snippet || '').substring(0, 200),
        source: src,
        source_logo: SOURCE_LOGOS[src] || SOURCE_LOGOS['MarketAux'],
        url: item.url,
        image_url: item.image_url || null,
        published_at: item.published_at,
        time_ago: getTimeAgo(item.published_at),
        category: cat,
        affected_currencies: currencies as string[],
        sentiment: sent,
        impact: imp,
        card: buildCard(imp, sent, cat, src),
      };
    });
  } catch (error) {
    console.error('[mobile-news] MarketAux error:', error);
    return [];
  }
}

// Fetch from FMP - multiple news categories
async function fetchFMPNews(apiKey: string): Promise<MobileNewsItem[]> {
  const endpoints = [
    { url: `https://financialmodelingprep.com/stable/news/forex-latest?page=0&limit=15&apikey=${apiKey}`, prefix: 'fmp-forex' },
    { url: `https://financialmodelingprep.com/stable/news/crypto-latest?page=0&limit=10&apikey=${apiKey}`, prefix: 'fmp-crypto' },
    { url: `https://financialmodelingprep.com/stable/news/stock-latest?page=0&limit=10&apikey=${apiKey}`, prefix: 'fmp-stock' },
    { url: `https://financialmodelingprep.com/stable/news/general-latest?page=0&limit=8&apikey=${apiKey}`, prefix: 'fmp-general' },
  ];

  const results = await Promise.allSettled(
    endpoints.map(async ({ url, prefix }) => {
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      if (!Array.isArray(data)) return [];
      return data.map((item: any, i: number) => {
        const text = `${item.title} ${item.text || ''}`;
        const cat = prefix === 'fmp-crypto' ? 'market' : detectCategory(text);
        const sent = detectSentiment(text);
        const imp = detectImpact(text);
        const src = item.site || 'FMP';
        return {
          id: `${prefix}-${i}-${Date.now()}`,
          title: item.title,
          summary: (item.text || '').substring(0, 200),
          source: src,
          source_logo: SOURCE_LOGOS['FMP'],
          url: item.url,
          image_url: item.image || null,
          published_at: item.publishedDate || new Date().toISOString(),
          time_ago: getTimeAgo(item.publishedDate || new Date().toISOString()),
          category: cat,
          affected_currencies: detectCurrencies(text),
          sentiment: sent,
          impact: imp,
          card: buildCard(imp, sent, cat, src),
        };
      });
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<MobileNewsItem[]> => r.status === 'fulfilled')
    .flatMap(r => r.value);
}

// In-memory cache with 2-min TTL
let newsCache: { data: MobileNewsItem[]; sources: Record<string, boolean>; ts: number } | null = null;
const CACHE_TTL = 2 * 60 * 1000;

async function getAllNews(): Promise<{ data: MobileNewsItem[]; sources: Record<string, boolean> }> {
  if (newsCache && Date.now() - newsCache.ts < CACHE_TTL) {
    return { data: newsCache.data, sources: newsCache.sources };
  }

  const finnhubKey = Deno.env.get('FINNHUB_API_KEY');
  const newsApiKey = Deno.env.get('NEWSAPI_API_KEY');
  const marketAuxKey = Deno.env.get('MARKETAUX_API_KEY');
  const fmpKey = Deno.env.get('FMP_API_KEY');

  const promises: Promise<MobileNewsItem[]>[] = [
    fetchRSS('https://www.fxstreet.com/rss/news', 'fxstreet', 'FXStreet'),
    fetchRSS('https://www.investing.com/rss/news.rss', 'investing', 'Investing.com'),
    fetchRSS('https://feeds.bloomberg.com/markets/news.rss', 'bloomberg', 'Bloomberg'),
  ];
  if (finnhubKey) promises.push(fetchFinnhub(finnhubKey));
  if (newsApiKey) promises.push(fetchNewsApi(newsApiKey));
  if (marketAuxKey) promises.push(fetchMarketAux(marketAuxKey));
  if (fmpKey) promises.push(fetchFMPNews(fmpKey));

  if (promises.length === 0) {
    return { data: [], sources: {} };
  }

  const results = await Promise.allSettled(promises);
  let allNews = results
    .filter((r): r is PromiseFulfilledResult<MobileNewsItem[]> => r.status === 'fulfilled')
    .flatMap(r => r.value);

  // Sort newest first
  allNews.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

  // Deduplicate by title prefix
  const seen = new Set<string>();
  allNews = allNews.filter(item => {
    const key = item.title.toLowerCase().substring(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const sources: Record<string, boolean> = {
    finnhub: allNews.some(n => n.id.startsWith('finnhub')),
    newsapi: allNews.some(n => n.id.startsWith('newsapi')),
    fxstreet: allNews.some(n => n.id.startsWith('fxstreet')),
    investing: allNews.some(n => n.id.startsWith('investing')),
    bloomberg: allNews.some(n => n.id.startsWith('bloomberg')),
    marketaux: allNews.some(n => n.id.startsWith('marketaux')),
    fmp: allNews.some(n => n.id.startsWith('fmp-')),
  };

  newsCache = { data: allNews, sources, ts: Date.now() };
  return { data: allNews, sources };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let currencies: string[] = [];
    let limit = 30;
    let day: string | null = null; // YYYY-MM-DD filter
    let page = 1;

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const currParam = url.searchParams.get('currencies');
      if (currParam) currencies = currParam.split(',').map(c => c.trim().toUpperCase()).filter(c => VALID_CURRENCIES.includes(c));
      limit = Math.min(parseInt(url.searchParams.get('limit') || '30'), 100);
      day = url.searchParams.get('day'); // e.g. 2026-02-21
      page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    } else {
      const body = await req.json().catch(() => ({}));
      if (body.currencies) currencies = body.currencies.filter((c: string) => VALID_CURRENCIES.includes(c.toUpperCase()));
      if (body.limit) limit = Math.min(body.limit, 100);
      if (body.day) day = body.day;
      if (body.page) page = Math.max(1, body.page);
    }

    console.log('[mobile-news] day:', day, 'currencies:', currencies, 'limit:', limit, 'page:', page);

    const { data: allNews, sources } = await getAllNews();
    let filtered = allNews;

    // Filter by day
    if (day) {
      filtered = filtered.filter(item => {
        const itemDay = new Date(item.published_at).toISOString().split('T')[0];
        return itemDay === day;
      });
    }

    // Filter by currencies
    if (currencies.length > 0) {
      filtered = filtered.filter(item =>
        item.affected_currencies.some(c => currencies.includes(c))
      );
    }

    // Pagination
    const total = filtered.length;
    const offset = (page - 1) * limit;
    const paged = filtered.slice(offset, offset + limit);

    return new Response(
      JSON.stringify({
        success: true,
        data: paged,
        total,
        page,
        limit,
        has_more: offset + limit < total,
        day: day || undefined,
        available_currencies: VALID_CURRENCIES,
        sources,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=120' } }
    );
  } catch (error) {
    console.error('[mobile-news] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error', data: [], total: 0 }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
