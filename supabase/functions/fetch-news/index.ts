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
  'ForexLive': 'https://logo.clearbit.com/forexlive.com',
  'MarketAux': 'https://logo.clearbit.com/marketaux.com',
  'FMP': 'https://logo.clearbit.com/financialmodelingprep.com',
  'Alpha Vantage': 'https://logo.clearbit.com/alphavantage.co',
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
  const bullishWords = /\b(surge|rally|gain|rise|bullish|positive|growth|strong|optimism|higher|up)\b/i;
  const bearishWords = /\b(fall|drop|decline|bearish|negative|weak|fear|crash|slump|lower|down)\b/i;
  
  const bullishCount = (text.match(new RegExp(bullishWords.source, 'gi')) || []).length;
  const bearishCount = (text.match(new RegExp(bearishWords.source, 'gi')) || []).length;
  
  if (bullishCount > bearishCount) return 'bullish';
  if (bearishCount > bullishCount) return 'bearish';
  return 'neutral';
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
    
    // Try to extract image from media:content, enclosure, or description
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

// Fetch from Finnhub
async function fetchFinnhubNews(apiKey: string): Promise<NewsItem[]> {
  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/news?category=forex&token=${apiKey}`
    );
    if (!response.ok) return [];
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
    console.error('[fetch-news] Finnhub error:', error);
    return [];
  }
}



// Fetch from NewsAPI.org
async function fetchNewsApiNews(apiKey: string): Promise<NewsItem[]> {
  try {
    const response = await fetch(
      `https://newsapi.org/v2/top-headlines?category=business&language=en&pageSize=20&apiKey=${apiKey}`
    );
    if (!response.ok) return [];
    const data = await response.json();
    if (data.status !== 'ok' || !data.articles) return [];
    
    return data.articles
      .filter((item: any) => item.title && item.title !== '[Removed]')
      .map((item: any, index: number) => ({
        id: `newsapi-${index}-${Date.now()}`,
        title: item.title,
        summary: item.description || '',
        source: item.source?.name || 'NewsAPI',
        source_logo: SOURCE_LOGOS[item.source?.name] || `https://logo.clearbit.com/${new URL(item.url || 'https://newsapi.org').hostname}`,
        url: item.url,
        image_url: item.urlToImage || null,
        published_at: item.publishedAt,
        time_ago: getTimeAgo(item.publishedAt),
        category: detectCategory(item.title + ' ' + (item.description || '')),
        affected_currencies: detectCurrencies(item.title + ' ' + (item.description || '') + ' ' + (item.content || '')),
        sentiment: detectSentiment(item.title + ' ' + (item.description || '')),
        relevance_score: 0.75 + Math.random() * 0.25,
      }));
  } catch (error) {
    console.error('[fetch-news] NewsAPI error:', error);
    return [];
  }
}

// Fetch from FXStreet RSS
async function fetchFXStreetNews(): Promise<NewsItem[]> {
  try {
    const response = await fetch('https://www.fxstreet.com/rss/news', {
      headers: { 'User-Agent': 'EcoSignalBot/1.0' },
    });
    if (!response.ok) return [];
    const xml = await response.text();
    const items = parseRSSItems(xml);
    
    return items.slice(0, 15).map((item, index) => {
      const text = `${item.title} ${item.description}`;
      const pubDate = item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString();
      return {
        id: `fxstreet-${index}-${Date.now()}`,
        title: item.title,
        summary: item.description.substring(0, 200),
        source: 'FXStreet',
        source_logo: SOURCE_LOGOS['FXStreet'],
        url: item.link,
        image_url: item.imageUrl || null,
        published_at: pubDate,
        time_ago: getTimeAgo(pubDate),
        category: detectCategory(text),
        affected_currencies: detectCurrencies(text),
        sentiment: detectSentiment(text),
        relevance_score: 0.85 + Math.random() * 0.15,
      };
    });
  } catch (error) {
    console.error('[fetch-news] FXStreet RSS error:', error);
    return [];
  }
}

// Fetch from Investing.com RSS
async function fetchInvestingNews(): Promise<NewsItem[]> {
  try {
    const response = await fetch('https://www.investing.com/rss/news.rss', {
      headers: { 'User-Agent': 'EcoSignalBot/1.0' },
    });
    if (!response.ok) return [];
    const xml = await response.text();
    const items = parseRSSItems(xml);
    
    return items.slice(0, 15).map((item, index) => {
      const text = `${item.title} ${item.description}`;
      const pubDate = item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString();
      return {
        id: `investing-${index}-${Date.now()}`,
        title: item.title,
        summary: item.description.substring(0, 200),
        source: 'Investing.com',
        source_logo: SOURCE_LOGOS['Investing.com'],
        url: item.link,
        image_url: item.imageUrl || null,
        published_at: pubDate,
        time_ago: getTimeAgo(pubDate),
        category: detectCategory(text),
        affected_currencies: detectCurrencies(text),
        sentiment: detectSentiment(text),
        relevance_score: 0.8 + Math.random() * 0.2,
      };
    });
  } catch (error) {
    console.error('[fetch-news] Investing.com RSS error:', error);
    return [];
  }
}



// Fetch from Bloomberg RSS
async function fetchBloombergNews(): Promise<NewsItem[]> {
  try {
    const response = await fetch('https://feeds.bloomberg.com/markets/news.rss', {
      headers: { 'User-Agent': 'EcoSignalBot/1.0' },
    });
    if (!response.ok) return [];
    const xml = await response.text();
    const items = parseRSSItems(xml);
    
    return items.slice(0, 15).map((item, index) => {
      const text = `${item.title} ${item.description}`;
      const pubDate = item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString();
      return {
        id: `bloomberg-${index}-${Date.now()}`,
        title: item.title,
        summary: item.description.substring(0, 200),
        source: 'Bloomberg',
        source_logo: SOURCE_LOGOS['Bloomberg'],
        url: item.link,
        image_url: item.imageUrl || null,
        published_at: pubDate,
        time_ago: getTimeAgo(pubDate),
        category: detectCategory(text),
        affected_currencies: detectCurrencies(text),
        sentiment: detectSentiment(text),
        relevance_score: 0.9 + Math.random() * 0.1,
      };
    });
  } catch (error) {
    console.error('[fetch-news] Bloomberg RSS error:', error);
    return [];
  }
}

// Fetch from MarketAux API (Premium)
async function fetchMarketAuxNews(apiKey: string): Promise<NewsItem[]> {
  const allItems: NewsItem[] = [];
  
  // Premium: fetch multiple categories in parallel with higher limits
  const endpoints = [
    `https://api.marketaux.com/v1/news/all?api_token=${apiKey}&filter_entities=true&language=en&limit=50&industries=Financial&domains=bloomberg.com,reuters.com,cnbc.com,ft.com,wsj.com,investing.com,forexlive.com,fxstreet.com,marketwatch.com,benzinga.com`,
    `https://api.marketaux.com/v1/news/all?api_token=${apiKey}&filter_entities=true&language=en&limit=30&search=forex+currency+exchange+rate&sort=published_at`,
    `https://api.marketaux.com/v1/news/all?api_token=${apiKey}&filter_entities=true&language=en&limit=20&search=central+bank+interest+rate+monetary+policy&sort=entity_match_score`,
  ];

  try {
    const responses = await Promise.allSettled(endpoints.map(url => fetch(url)));
    
    for (const [idx, result] of responses.entries()) {
      if (result.status !== 'fulfilled' || !result.value.ok) {
        console.error(`[fetch-news] MarketAux endpoint ${idx} failed:`, result.status === 'rejected' ? result.reason : `HTTP ${result.value?.status}`);
        continue;
      }
      const data = await result.value.json();
      if (!data.data || !Array.isArray(data.data)) continue;

      console.log(`[fetch-news] MarketAux endpoint ${idx}: ${data.data.length} items (meta: ${JSON.stringify(data.meta || {})})`);

      for (const [i, item] of data.data.entries()) {
        const text = `${item.title} ${item.description || ''}`;
        
        // Premium: use native entity sentiment scores
        const entitySentiment = item.entities?.[0]?.sentiment_score;
        let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
        if (entitySentiment != null) {
          sentiment = entitySentiment > 0.15 ? 'bullish' : entitySentiment < -0.15 ? 'bearish' : 'neutral';
        } else {
          sentiment = detectSentiment(text);
        }

        // Premium: extract richer entity data
        const entityCurrencies = (item.entities || [])
          .filter((e: any) => e.type === 'currency' || e.type === 'index' || e.type === 'equity' || e.type === 'forex_pair')
          .map((e: any) => e.symbol?.substring(0, 3)?.toUpperCase())
          .filter((c: string) => c && Object.keys(CURRENCY_PATTERNS).includes(c));
        const currencies = entityCurrencies.length > 0 ? [...new Set(entityCurrencies)] : detectCurrencies(text);

        // Premium: use highlight and match scores for better relevance
        const matchScore = item.entities?.[0]?.match_score || 0;
        const highlightScore = item.entities?.[0]?.highlights?.length || 0;
        const relevance = matchScore > 0
          ? Math.min((matchScore + highlightScore * 5) / 120, 1)
          : 0.80 + Math.random() * 0.15;

        allItems.push({
          id: `marketaux-${item.uuid || `${idx}-${i}`}-${Date.now()}`,
          title: item.title,
          summary: (item.description || item.snippet || '').substring(0, 400),
          source: 'MarketAux',
          source_logo: SOURCE_LOGOS['MarketAux'],
          url: item.url,
          image_url: item.image_url || null,
          published_at: item.published_at,
          time_ago: getTimeAgo(item.published_at),
          category: detectCategory(text),
          affected_currencies: currencies as string[],
          sentiment,
          relevance_score: relevance,
        });
      }
    }

    // Deduplicate by title
    const seen = new Set<string>();
    const unique = allItems.filter(item => {
      const key = item.title.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    console.log(`[fetch-news] MarketAux premium total: ${unique.length} unique items`);
    return unique;
  } catch (error) {
    console.error('[fetch-news] MarketAux error:', error);
    return [];
  }
}

// Fetch from FMP - Forex News
async function fetchFMPForexNews(apiKey: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(`https://financialmodelingprep.com/stable/news/forex-latest?page=0&limit=20&apikey=${apiKey}`);
    if (!res.ok) {
      const errBody = await res.text();
      console.error(`[fetch-news] FMP Forex HTTP ${res.status}: ${errBody.slice(0, 300)}`);
      return [];
    }
    const data = await res.json();
    if (!Array.isArray(data)) {
      console.warn('[fetch-news] FMP Forex non-array response:', JSON.stringify(data).slice(0, 300));
      return [];
    }
    return data.map((item: any, i: number) => {
      const text = `${item.title} ${item.text || ''}`;
      return {
        id: `fmp-forex-${i}-${Date.now()}`,
        title: item.title,
        summary: (item.text || '').substring(0, 300),
        source: 'FMP',
        source_logo: SOURCE_LOGOS['FMP'],
        url: item.url,
        image_url: item.image || null,
        published_at: item.publishedDate || new Date().toISOString(),
        time_ago: getTimeAgo(item.publishedDate || new Date().toISOString()),
        category: detectCategory(text),
        affected_currencies: detectCurrencies(text),
        sentiment: detectSentiment(text),
        relevance_score: 0.85 + Math.random() * 0.15,
      };
    });
  } catch (error) {
    console.error('[fetch-news] FMP Forex error:', error);
    return [];
  }
}

// Fetch from FMP - Crypto News
async function fetchFMPCryptoNews(apiKey: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(`https://financialmodelingprep.com/stable/news/crypto-latest?page=0&limit=15&apikey=${apiKey}`);
    if (!res.ok) {
      const errBody = await res.text();
      console.error(`[fetch-news] FMP Crypto HTTP ${res.status}: ${errBody.slice(0, 300)}`);
      return [];
    }
    const data = await res.json();
    if (!Array.isArray(data)) {
      console.warn('[fetch-news] FMP Crypto non-array response:', JSON.stringify(data).slice(0, 300));
      return [];
    }
    return data.map((item: any, i: number) => {
      const text = `${item.title} ${item.text || ''}`;
      return {
        id: `fmp-crypto-${i}-${Date.now()}`,
        title: item.title,
        summary: (item.text || '').substring(0, 300),
        source: 'FMP',
        source_logo: SOURCE_LOGOS['FMP'],
        url: item.url,
        image_url: item.image || null,
        published_at: item.publishedDate || new Date().toISOString(),
        time_ago: getTimeAgo(item.publishedDate || new Date().toISOString()),
        category: 'crypto',
        affected_currencies: detectCurrencies(text),
        sentiment: detectSentiment(text),
        relevance_score: 0.8 + Math.random() * 0.2,
      };
    });
  } catch (error) {
    console.error('[fetch-news] FMP Crypto error:', error);
    return [];
  }
}

// Fetch from FMP - Stock News
async function fetchFMPStockNews(apiKey: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(`https://financialmodelingprep.com/stable/news/stock-latest?page=0&limit=15&apikey=${apiKey}`);
    if (!res.ok) {
      const errBody = await res.text();
      console.error(`[fetch-news] FMP Stock HTTP ${res.status}: ${errBody.slice(0, 300)}`);
      return [];
    }
    const data = await res.json();
    if (!Array.isArray(data)) {
      console.warn('[fetch-news] FMP Stock non-array response:', JSON.stringify(data).slice(0, 300));
      return [];
    }
    return data.map((item: any, i: number) => {
      const text = `${item.title} ${item.text || ''}`;
      return {
        id: `fmp-stock-${i}-${Date.now()}`,
        title: item.title,
        summary: (item.text || '').substring(0, 300),
        source: 'FMP',
        source_logo: SOURCE_LOGOS['FMP'],
        url: item.url,
        image_url: item.image || null,
        published_at: item.publishedDate || new Date().toISOString(),
        time_ago: getTimeAgo(item.publishedDate || new Date().toISOString()),
        category: detectCategory(text),
        affected_currencies: detectCurrencies(text),
        sentiment: detectSentiment(text),
        relevance_score: 0.82 + Math.random() * 0.18,
      };
    });
  } catch (error) {
    console.error('[fetch-news] FMP Stock error:', error);
    return [];
  }
}

// Fetch from FMP - General News
async function fetchFMPGeneralNews(apiKey: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(`https://financialmodelingprep.com/stable/news/general-latest?page=0&limit=10&apikey=${apiKey}`);
    if (!res.ok) {
      const errBody = await res.text();
      console.error(`[fetch-news] FMP General HTTP ${res.status}: ${errBody.slice(0, 300)}`);
      return [];
    }
    const data = await res.json();
    if (!Array.isArray(data)) {
      console.warn('[fetch-news] FMP General non-array response:', JSON.stringify(data).slice(0, 300));
      return [];
    }
    return data.map((item: any, i: number) => {
      const text = `${item.title} ${item.text || ''}`;
      return {
        id: `fmp-general-${i}-${Date.now()}`,
        title: item.title,
        summary: (item.text || '').substring(0, 300),
        source: 'FMP',
        source_logo: SOURCE_LOGOS['FMP'],
        url: item.url,
        image_url: item.image || null,
        published_at: item.publishedDate || new Date().toISOString(),
        time_ago: getTimeAgo(item.publishedDate || new Date().toISOString()),
        category: detectCategory(text),
        affected_currencies: detectCurrencies(text),
        sentiment: detectSentiment(text),
        relevance_score: 0.75 + Math.random() * 0.25,
      };
    });
  } catch (error) {
    console.error('[fetch-news] FMP General error:', error);
    return [];
  }
}

// Fetch from Alpha Vantage News Sentiment
async function fetchAlphaVantageNews(apiKey: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(
      `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=financial_markets,economy_fiscal,economy_monetary,finance&sort=LATEST&limit=30&apikey=${apiKey}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (data['Note'] || data['Information'] || !data.feed) return [];

    return data.feed.slice(0, 20).map((item: any, i: number) => {
      const text = `${item.title} ${item.summary || ''}`;
      
      // Use AV native sentiment
      let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      const score = parseFloat(item.overall_sentiment_score || '0');
      if (score > 0.15) sentiment = 'bullish';
      else if (score < -0.15) sentiment = 'bearish';

      // Extract currencies from ticker_sentiment
      const avCurrencies = (item.ticker_sentiment || [])
        .map((t: any) => t.ticker?.replace('FOREX:', '')?.substring(0, 3)?.toUpperCase())
        .filter((c: string) => c && Object.keys(CURRENCY_PATTERNS).includes(c));
      const currencies = avCurrencies.length > 0 ? [...new Set(avCurrencies)] : detectCurrencies(text);

      // Relevance from AV
      const relevance = Math.min(parseFloat(item.overall_sentiment_score ? '0.85' : '0.7') + Math.random() * 0.15, 1);

      return {
        id: `alphavantage-${i}-${Date.now()}`,
        title: item.title,
        summary: (item.summary || '').substring(0, 300),
        source: 'Alpha Vantage',
        source_logo: SOURCE_LOGOS['Alpha Vantage'],
        url: item.url,
        image_url: item.banner_image || null,
        published_at: item.time_published
          ? `${item.time_published.slice(0,4)}-${item.time_published.slice(4,6)}-${item.time_published.slice(6,8)}T${item.time_published.slice(9,11)}:${item.time_published.slice(11,13)}:${item.time_published.slice(13,15)}Z`
          : new Date().toISOString(),
        time_ago: item.time_published
          ? getTimeAgo(`${item.time_published.slice(0,4)}-${item.time_published.slice(4,6)}-${item.time_published.slice(6,8)}T${item.time_published.slice(9,11)}:${item.time_published.slice(11,13)}:${item.time_published.slice(13,15)}Z`)
          : 'ahora',
        category: detectCategory(text),
        affected_currencies: currencies as string[],
        sentiment,
        relevance_score: relevance,
      };
    });
  } catch (error) {
    console.error('[fetch-news] Alpha Vantage error:', error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { date, currencies, limit = 50 } = await req.json();
    
    console.log('[fetch-news] Fetching news for date:', date, 'currencies:', currencies);

    const finnhubKey = Deno.env.get('FINNHUB_API_KEY');
    const newsApiKey = Deno.env.get('NEWSAPI_API_KEY');
    const marketAuxKey = Deno.env.get('MARKETAUX_API_KEY');
    const fmpKey = Deno.env.get('FMP_API_KEY');
    const avKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');
    

    // Launch all sources in parallel - RSS sources don't need API keys
    const newsPromises: Promise<NewsItem[]>[] = [
      fetchFXStreetNews(),
      fetchInvestingNews(),
      fetchBloombergNews(),
    ];

    if (finnhubKey) newsPromises.push(fetchFinnhubNews(finnhubKey));
    if (newsApiKey) newsPromises.push(fetchNewsApiNews(newsApiKey));
    if (marketAuxKey) newsPromises.push(fetchMarketAuxNews(marketAuxKey));
    if (avKey) newsPromises.push(fetchAlphaVantageNews(avKey));
    if (fmpKey) {
      newsPromises.push(fetchFMPForexNews(fmpKey));
      newsPromises.push(fetchFMPCryptoNews(fmpKey));
      newsPromises.push(fetchFMPStockNews(fmpKey));
      newsPromises.push(fetchFMPGeneralNews(fmpKey));
    }

    const results = await Promise.allSettled(newsPromises);
    let allNews = results
      .filter((r): r is PromiseFulfilledResult<NewsItem[]> => r.status === 'fulfilled')
      .flatMap(r => r.value);

    // Filter by date if specified (match by calendar day)
    if (date) {
      const targetDate = new Date(date);
      const targetDay = targetDate.toISOString().split('T')[0];
      allNews = allNews.filter(item => {
        const itemDay = new Date(item.published_at).toISOString().split('T')[0];
        return itemDay === targetDay;
      });
    }

    // Filter by currencies if specified
    if (currencies && currencies.length > 0) {
      allNews = allNews.filter(item => 
        item.affected_currencies.some((c: string) => currencies.includes(c))
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

    // Count sources present
    const sourcesPresent = {
      finnhub: allNews.some(n => n.id.startsWith('finnhub')),
      newsapi: allNews.some(n => n.id.startsWith('newsapi')),
      fxstreet: allNews.some(n => n.id.startsWith('fxstreet')),
      investing: allNews.some(n => n.id.startsWith('investing')),
      bloomberg: allNews.some(n => n.id.startsWith('bloomberg')),
      marketaux: allNews.some(n => n.id.startsWith('marketaux')),
      alphavantage: allNews.some(n => n.id.startsWith('alphavantage')),
      fmp_forex: allNews.some(n => n.id.startsWith('fmp-forex')),
      fmp_crypto: allNews.some(n => n.id.startsWith('fmp-crypto')),
      fmp_stock: allNews.some(n => n.id.startsWith('fmp-stock')),
      fmp_general: allNews.some(n => n.id.startsWith('fmp-general')),
    };

    console.log('[fetch-news] Returning', allNews.length, 'news items. Sources:', sourcesPresent);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: allNews,
        sources: sourcesPresent,
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
