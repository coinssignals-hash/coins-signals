import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
  const bull = (text.match(/\b(surge|rally|gain|rise|bullish|positive|growth|strong|optimism)\b/gi) || []).length;
  const bear = (text.match(/\b(fall|drop|decline|bearish|negative|weak|fear|crash|slump)\b/gi) || []).length;
  if (bull > bear) return 'bullish';
  if (bear > bull) return 'bearish';
  return 'neutral';
}

function detectImpact(text: string): 'high' | 'medium' | 'low' {
  if (/\b(rate decision|NFP|CPI|GDP|FOMC|emergency|crisis)\b/i.test(text)) return 'high';
  if (/\b(employment|inflation|trade|policy|central bank)\b/i.test(text)) return 'medium';
  return 'low';
}

async function fetchFinnhub(apiKey: string): Promise<MobileNewsItem[]> {
  try {
    const res = await fetch(`https://finnhub.io/api/v1/news?category=forex&token=${apiKey}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.slice(0, 20).map((item: any, i: number) => {
      const text = `${item.headline} ${item.summary || ''}`;
      const pubDate = new Date(item.datetime * 1000).toISOString();
      return {
        id: `finnhub-${item.id || i}`,
        title: item.headline,
        summary: item.summary || '',
        source: item.source || 'Finnhub',
        source_logo: SOURCE_LOGOS[item.source] || null,
        url: item.url,
        image_url: item.image || null,
        published_at: pubDate,
        time_ago: getTimeAgo(pubDate),
        category: detectCategory(text),
        affected_currencies: detectCurrencies(text),
        sentiment: detectSentiment(text),
        impact: detectImpact(text),
      };
    });
  } catch { return []; }
}

async function fetchPolygon(apiKey: string): Promise<MobileNewsItem[]> {
  try {
    const res = await fetch(`https://api.polygon.io/v2/reference/news?limit=20&apiKey=${apiKey}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((item: any, i: number) => {
      const text = `${item.title} ${item.description || ''}`;
      return {
        id: `polygon-${item.id || i}`,
        title: item.title,
        summary: item.description || '',
        source: item.publisher?.name || 'Polygon',
        source_logo: item.publisher?.logo_url || SOURCE_LOGOS[item.publisher?.name] || null,
        url: item.article_url,
        image_url: item.image_url || null,
        published_at: item.published_utc,
        time_ago: getTimeAgo(item.published_utc),
        category: detectCategory(text),
        affected_currencies: detectCurrencies(text),
        sentiment: detectSentiment(text),
        impact: detectImpact(text),
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
        return {
          id: `newsapi-${i}-${Date.now()}`,
          title: item.title,
          summary: item.description || '',
          source: item.source?.name || 'NewsAPI',
          source_logo: SOURCE_LOGOS[item.source?.name] || null,
          url: item.url,
          image_url: item.urlToImage || null,
          published_at: item.publishedAt,
          time_ago: getTimeAgo(item.publishedAt),
          category: detectCategory(text),
          affected_currencies: detectCurrencies(text),
          sentiment: detectSentiment(text),
          impact: detectImpact(text),
        };
      });
  } catch { return []; }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let currencies: string[] = [];
    let limit = 30;

    // Support both GET (query params) and POST (JSON body)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const currParam = url.searchParams.get('currencies');
      if (currParam) currencies = currParam.split(',').map(c => c.trim().toUpperCase()).filter(c => VALID_CURRENCIES.includes(c));
      limit = Math.min(parseInt(url.searchParams.get('limit') || '30'), 50);
    } else {
      const body = await req.json().catch(() => ({}));
      if (body.currencies) currencies = body.currencies.filter((c: string) => VALID_CURRENCIES.includes(c.toUpperCase()));
      if (body.limit) limit = Math.min(body.limit, 50);
    }

    console.log('[mobile-news] currencies:', currencies, 'limit:', limit);

    const finnhubKey = Deno.env.get('FINNHUB_API_KEY');
    const polygonKey = Deno.env.get('POLYGON_API_KEY');
    const newsApiKey = Deno.env.get('NEWSAPI_API_KEY');

    const promises: Promise<MobileNewsItem[]>[] = [];
    if (finnhubKey) promises.push(fetchFinnhub(finnhubKey));
    if (polygonKey) promises.push(fetchPolygon(polygonKey));
    if (newsApiKey) promises.push(fetchNewsApi(newsApiKey));

    if (promises.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No news API keys configured', data: [], total: 0 }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = await Promise.all(promises);
    let allNews = results.flat();

    // Filter by currencies
    if (currencies.length > 0) {
      allNews = allNews.filter(item =>
        item.affected_currencies.some(c => currencies.includes(c))
      );
    }

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

    allNews = allNews.slice(0, limit);

    console.log('[mobile-news] Returning', allNews.length, 'items');

    return new Response(
      JSON.stringify({
        success: true,
        data: allNews,
        total: allNews.length,
        available_currencies: VALID_CURRENCIES,
        sources: { finnhub: !!finnhubKey, polygon: !!polygonKey, newsapi: !!newsApiKey },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[mobile-news] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error', data: [], total: 0 }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
