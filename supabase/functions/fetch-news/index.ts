import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewsItem {
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
  relevance_score: number;
}

// Source logos mapping
const SOURCE_LOGOS: Record<string, string> = {
  'Reuters': 'https://logo.clearbit.com/reuters.com',
  'Bloomberg': 'https://logo.clearbit.com/bloomberg.com',
  'CNBC': 'https://logo.clearbit.com/cnbc.com',
  'MarketWatch': 'https://logo.clearbit.com/marketwatch.com',
  'Yahoo Finance': 'https://logo.clearbit.com/finance.yahoo.com',
  'Financial Times': 'https://logo.clearbit.com/ft.com',
  'The Wall Street Journal': 'https://logo.clearbit.com/wsj.com',
  'Investing.com': 'https://logo.clearbit.com/investing.com',
  'FXStreet': 'https://logo.clearbit.com/fxstreet.com',
  'DailyFX': 'https://logo.clearbit.com/dailyfx.com',
  'Forex Factory': 'https://logo.clearbit.com/forexfactory.com',
  'Benzinga': 'https://logo.clearbit.com/benzinga.com',
};

// Currency detection from text
const CURRENCY_PATTERNS: Record<string, RegExp> = {
  'USD': /\b(USD|dollar|dólar|US\$|federal reserve|fed|powell)\b/i,
  'EUR': /\b(EUR|euro|eurozone|ECB|lagarde)\b/i,
  'GBP': /\b(GBP|pound|sterling|BOE|bank of england)\b/i,
  'JPY': /\b(JPY|yen|BOJ|bank of japan|kuroda|ueda)\b/i,
  'AUD': /\b(AUD|aussie|australian dollar|RBA)\b/i,
  'CAD': /\b(CAD|loonie|canadian dollar|BOC)\b/i,
  'CHF': /\b(CHF|swiss franc|SNB)\b/i,
  'NZD': /\b(NZD|kiwi|new zealand dollar|RBNZ)\b/i,
  'CNY': /\b(CNY|yuan|renminbi|PBOC|china)\b/i,
};

function detectCurrencies(text: string): string[] {
  const currencies: string[] = [];
  for (const [currency, pattern] of Object.entries(CURRENCY_PATTERNS)) {
    if (pattern.test(text)) {
      currencies.push(currency);
    }
  }
  return currencies.length > 0 ? currencies : ['USD'];
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `hace ${diffMins}m`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  return `hace ${diffDays}d`;
}

function detectCategory(text: string): string {
  const categories: Record<string, RegExp> = {
    'monetary_policy': /\b(interest rate|rate decision|monetary policy|QE|quantitative)\b/i,
    'inflation': /\b(inflation|CPI|consumer price|deflation)\b/i,
    'employment': /\b(employment|jobs|unemployment|NFP|payroll|labor)\b/i,
    'gdp': /\b(GDP|growth|recession|economic output)\b/i,
    'central_bank': /\b(fed|ECB|BOE|BOJ|central bank|FOMC)\b/i,
    'trade': /\b(trade|tariff|export|import|deficit)\b/i,
    'geopolitics': /\b(war|conflict|election|sanction|political)\b/i,
    'commodities': /\b(oil|gold|silver|commodity|WTI|brent)\b/i,
    'crypto': /\b(bitcoin|crypto|ethereum|BTC|ETH)\b/i,
  };

  for (const [category, pattern] of Object.entries(categories)) {
    if (pattern.test(text)) return category;
  }
  return 'other';
}

function detectSentiment(text: string): 'bullish' | 'bearish' | 'neutral' {
  const bullishWords = /\b(surge|rally|gain|rise|bullish|positive|growth|strong|optimism)\b/i;
  const bearishWords = /\b(fall|drop|decline|bearish|negative|weak|fear|crash|slump)\b/i;
  
  const bullishCount = (text.match(bullishWords) || []).length;
  const bearishCount = (text.match(bearishWords) || []).length;
  
  if (bullishCount > bearishCount) return 'bullish';
  if (bearishCount > bullishCount) return 'bearish';
  return 'neutral';
}

// Fetch from Finnhub
async function fetchFinnhubNews(apiKey: string): Promise<NewsItem[]> {
  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/news?category=forex&token=${apiKey}`
    );
    
    if (!response.ok) {
      console.error('[fetch-news] Finnhub error:', response.status);
      return [];
    }
    
    const data = await response.json();
    
    return data.slice(0, 15).map((item: any, index: number) => ({
      id: `finnhub-${item.id || index}`,
      title: item.headline,
      summary: item.summary || '',
      source: item.source || 'Finnhub',
      source_logo: SOURCE_LOGOS[item.source] || null,
      url: item.url,
      image_url: item.image || null,
      published_at: new Date(item.datetime * 1000).toISOString(),
      time_ago: getTimeAgo(new Date(item.datetime * 1000).toISOString()),
      category: detectCategory(item.headline + ' ' + (item.summary || '')),
      affected_currencies: detectCurrencies(item.headline + ' ' + (item.summary || '')),
      sentiment: detectSentiment(item.headline + ' ' + (item.summary || '')),
      relevance_score: 0.8 + Math.random() * 0.2,
    }));
  } catch (error) {
    console.error('[fetch-news] Finnhub fetch error:', error);
    return [];
  }
}

// Fetch from Polygon.io
async function fetchPolygonNews(apiKey: string): Promise<NewsItem[]> {
  try {
    const response = await fetch(
      `https://api.polygon.io/v2/reference/news?limit=15&apiKey=${apiKey}`
    );
    
    if (!response.ok) {
      console.error('[fetch-news] Polygon error:', response.status);
      return [];
    }
    
    const data = await response.json();
    
    return (data.results || []).map((item: any, index: number) => ({
      id: `polygon-${item.id || index}`,
      title: item.title,
      summary: item.description || '',
      source: item.publisher?.name || 'Polygon',
      source_logo: item.publisher?.logo_url || SOURCE_LOGOS[item.publisher?.name] || null,
      url: item.article_url,
      image_url: item.image_url || null,
      published_at: item.published_utc,
      time_ago: getTimeAgo(item.published_utc),
      category: detectCategory(item.title + ' ' + (item.description || '')),
      affected_currencies: item.tickers?.length > 0 
        ? detectCurrencies(item.tickers.join(' ') + ' ' + item.title)
        : detectCurrencies(item.title + ' ' + (item.description || '')),
      sentiment: detectSentiment(item.title + ' ' + (item.description || '')),
      relevance_score: 0.7 + Math.random() * 0.3,
    }));
  } catch (error) {
    console.error('[fetch-news] Polygon fetch error:', error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { date, currencies, limit = 30 } = await req.json();
    
    console.log('[fetch-news] Fetching news for date:', date, 'currencies:', currencies);

    const finnhubKey = Deno.env.get('FINNHUB_API_KEY');
    const polygonKey = Deno.env.get('POLYGON_API_KEY');

    const newsPromises: Promise<NewsItem[]>[] = [];

    if (finnhubKey) {
      newsPromises.push(fetchFinnhubNews(finnhubKey));
    }

    if (polygonKey) {
      newsPromises.push(fetchPolygonNews(polygonKey));
    }

    if (newsPromises.length === 0) {
      console.error('[fetch-news] No API keys configured');
      return new Response(
        JSON.stringify({ success: false, error: 'No news API keys configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = await Promise.all(newsPromises);
    let allNews = results.flat();

    // Filter by currencies if specified
    if (currencies && currencies.length > 0) {
      allNews = allNews.filter(item => 
        item.affected_currencies.some(c => currencies.includes(c))
      );
    }

    // Sort by published date (newest first)
    allNews.sort((a, b) => 
      new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    );

    // Remove duplicates by title similarity
    const seenTitles = new Set<string>();
    allNews = allNews.filter(item => {
      const normalizedTitle = item.title.toLowerCase().substring(0, 50);
      if (seenTitles.has(normalizedTitle)) return false;
      seenTitles.add(normalizedTitle);
      return true;
    });

    // Limit results
    allNews = allNews.slice(0, limit);

    console.log('[fetch-news] Returning', allNews.length, 'news items');

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: allNews,
        sources: {
          finnhub: !!finnhubKey,
          polygon: !!polygonKey,
        },
        total: allNews.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[fetch-news] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
