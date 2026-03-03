import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Central bank data mapping
const CENTRAL_BANKS: Record<string, { name: string; keywords: string[] }> = {
  USD: { name: 'Federal Reserve (Fed)', keywords: ['federal reserve', 'fed', 'fomc', 'powell', 'us interest rate', 'fed funds'] },
  EUR: { name: 'Banco Central Europeo (BCE)', keywords: ['ecb', 'european central bank', 'bce', 'lagarde', 'eurozone rate'] },
  GBP: { name: 'Bank of England (BoE)', keywords: ['bank of england', 'boe', 'bailey', 'uk interest rate', 'mpc'] },
  JPY: { name: 'Bank of Japan (BoJ)', keywords: ['bank of japan', 'boj', 'ueda', 'japan rate', 'yen policy'] },
  CHF: { name: 'Swiss National Bank (SNB)', keywords: ['swiss national bank', 'snb', 'swiss rate'] },
  AUD: { name: 'Reserve Bank of Australia (RBA)', keywords: ['reserve bank of australia', 'rba', 'australia rate'] },
  CAD: { name: 'Bank of Canada (BoC)', keywords: ['bank of canada', 'boc', 'canada rate'] },
  NZD: { name: 'Reserve Bank of New Zealand (RBNZ)', keywords: ['reserve bank of new zealand', 'rbnz', 'nz rate'] },
};

async function fetchFinnhubNews(currency: string, apiKey: string): Promise<any[]> {
  try {
    const keywords = CENTRAL_BANKS[currency]?.keywords || [];
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const from = weekAgo.toISOString().split('T')[0];
    const to = now.toISOString().split('T')[0];

    const results: any[] = [];
    // Search general news with central bank keywords
    for (const keyword of keywords.slice(0, 2)) {
      const url = `https://finnhub.io/api/v1/news?category=general&token=${apiKey}`;
      const resp = await fetch(url);
      if (resp.ok) {
        const data = await resp.json();
        const filtered = (data || []).filter((item: any) =>
          (item.headline?.toLowerCase().includes(keyword) || item.summary?.toLowerCase().includes(keyword))
        ).slice(0, 5);
        results.push(...filtered);
      }
    }
    return results;
  } catch (e) {
    console.error('Finnhub monetary error:', e);
    return [];
  }
}

async function fetchFMPEconomicCalendar(apiKey: string): Promise<any[]> {
  try {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const monthAhead = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const from = threeMonthsAgo.toISOString().split('T')[0];
    const to = monthAhead.toISOString().split('T')[0];
    const url = `https://financialmodelingprep.com/api/v3/economic_calendar?from=${from}&to=${to}&apikey=${apiKey}`;
    const resp = await fetch(url);
    if (resp.ok) return await resp.json();
    return [];
  } catch (e) {
    console.error('FMP calendar error:', e);
    return [];
  }
}

async function fetchFMPNews(currency: string, apiKey: string): Promise<any[]> {
  try {
    const keywords = CENTRAL_BANKS[currency]?.keywords || [];
    const keyword = keywords[0] || currency;
    const url = `https://financialmodelingprep.com/api/v3/fmp/articles?page=0&size=10&apikey=${apiKey}`;
    const resp = await fetch(url);
    if (resp.ok) {
      const data = await resp.json();
      const articles = data?.content || data || [];
      return articles.filter((a: any) =>
        keywords.some(k => (a.title?.toLowerCase().includes(k) || a.content?.toLowerCase()?.includes(k)))
      ).slice(0, 5);
    }
    return [];
  } catch (e) {
    console.error('FMP news error:', e);
    return [];
  }
}

async function fetchMarketauxNews(currency: string, apiKey: string): Promise<any[]> {
  try {
    const keywords = CENTRAL_BANKS[currency]?.keywords?.slice(0, 2).join(',') || currency;
    const url = `https://api.marketaux.com/v1/news/all?filter_entities=true&language=en&search=${encodeURIComponent(keywords)}&api_token=${apiKey}&limit=5`;
    const resp = await fetch(url);
    if (resp.ok) {
      const data = await resp.json();
      return data?.data || [];
    }
    return [];
  } catch (e) {
    console.error('Marketaux error:', e);
    return [];
  }
}

async function fetchAlphaVantageNews(currency: string, apiKey: string): Promise<any[]> {
  try {
    const keywords = CENTRAL_BANKS[currency]?.keywords?.[0] || currency;
    const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=economy_monetary&tickers=FOREX:${currency}&apikey=${apiKey}&limit=10`;
    const resp = await fetch(url);
    if (resp.ok) {
      const data = await resp.json();
      return (data?.feed || []).filter((item: any) =>
        CENTRAL_BANKS[currency]?.keywords?.some(k =>
          item.title?.toLowerCase().includes(k) || item.summary?.toLowerCase().includes(k)
        )
      ).slice(0, 5);
    }
    return [];
  } catch (e) {
    console.error('AlphaVantage news error:', e);
    return [];
  }
}

function extractInterestRateFromCalendar(events: any[], currency: string): { currentRate: string; nextMeeting: string; lastDecision: string } | null {
  const rateKeywords = ['interest rate', 'rate decision', 'funds rate', 'base rate', 'cash rate', 'policy rate'];
  
  const rateEvents = events.filter(e =>
    e.currency === currency &&
    rateKeywords.some(k => e.event?.toLowerCase().includes(k))
  );

  if (rateEvents.length === 0) return null;

  // Find the most recent past event with actual value
  const pastEvents = rateEvents.filter(e => e.actual !== null && e.actual !== undefined);
  const futureEvents = rateEvents.filter(e => e.actual === null || e.actual === undefined);

  const currentRate = pastEvents.length > 0 ? `${pastEvents[0].actual}%` : null;
  const lastDecision = pastEvents.length > 0 
    ? `${pastEvents[0].actual === pastEvents[0].previous ? 'Sin cambios' : pastEvents[0].actual > pastEvents[0].previous ? 'Subida' : 'Recorte'} (${new Date(pastEvents[0].date).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })})`
    : null;
  const nextMeeting = futureEvents.length > 0
    ? new Date(futureEvents[0].date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return {
    currentRate: currentRate || 'N/D',
    nextMeeting: nextMeeting || 'Pendiente',
    lastDecision: lastDecision || 'N/D',
  };
}

function buildExpectations(news: any[], currency: string): { expectations: string; endYearRate: string } {
  const allText = news.map(n => 
    (n.headline || n.title || '') + ' ' + (n.summary || n.description || n.content || '')
  ).join(' ').toLowerCase();

  let expectations = 'Sin señales claras';
  let endYearRate = 'N/D';

  // Detect hawkish/dovish sentiment
  const hawkishWords = ['hike', 'raise', 'tighten', 'hawkish', 'inflation concern', 'subida', 'restrictiva'];
  const dovishWords = ['cut', 'lower', 'ease', 'dovish', 'recession', 'slowdown', 'recorte', 'expansiva'];
  const holdWords = ['hold', 'pause', 'steady', 'unchanged', 'maintain', 'mantener', 'pausa'];

  const hawkishCount = hawkishWords.filter(w => allText.includes(w)).length;
  const dovishCount = dovishWords.filter(w => allText.includes(w)).length;
  const holdCount = holdWords.filter(w => allText.includes(w)).length;

  if (hawkishCount > dovishCount && hawkishCount > holdCount) {
    expectations = 'Sesgo restrictivo - posible subida de tasas';
  } else if (dovishCount > hawkishCount && dovishCount > holdCount) {
    expectations = 'Sesgo expansivo - posible recorte de tasas';
  } else if (holdCount > 0) {
    expectations = 'Probable pausa - mantener tasas actuales';
  }

  // Try to extract rate predictions from text
  const ratePattern = /(\d+\.?\d*)\s*%\s*(by|end|fin|para)\s*(year|año|2026|2027)/i;
  const rateMatch = allText.match(ratePattern);
  if (rateMatch) {
    endYearRate = `~${rateMatch[1]}%`;
  }

  return { expectations, endYearRate };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol } = await req.json();
    if (!symbol) throw new Error('Symbol is required');

    const currencies = symbol.replace('/', '').match(/.{3}/g) || ['EUR', 'USD'];

    const FINNHUB_API_KEY = Deno.env.get('FINNHUB_API_KEY') || '';
    const FMP_API_KEY = Deno.env.get('FMP_API_KEY') || '';
    const MARKETAUX_API_KEY = Deno.env.get('MARKETAUX_API_KEY') || '';
    const ALPHA_VANTAGE_API_KEY = Deno.env.get('ALPHA_VANTAGE_API_KEY') || '';

    // Fetch economic calendar for rate decisions
    const calendarPromise = FMP_API_KEY ? fetchFMPEconomicCalendar(FMP_API_KEY) : Promise.resolve([]);

    const policies = [];

    const calendarEvents = await calendarPromise;

    for (const currency of currencies) {
      if (!CENTRAL_BANKS[currency]) continue;

      // Fetch news from all sources in parallel
      const [finnhubNews, fmpNews, marketauxNews, avNews] = await Promise.allSettled([
        FINNHUB_API_KEY ? fetchFinnhubNews(currency, FINNHUB_API_KEY) : [],
        FMP_API_KEY ? fetchFMPNews(currency, FMP_API_KEY) : [],
        MARKETAUX_API_KEY ? fetchMarketauxNews(currency, MARKETAUX_API_KEY) : [],
        ALPHA_VANTAGE_API_KEY ? fetchAlphaVantageNews(currency, ALPHA_VANTAGE_API_KEY) : [],
      ]);

      const allNews = [
        ...(finnhubNews.status === 'fulfilled' ? finnhubNews.value : []),
        ...(fmpNews.status === 'fulfilled' ? fmpNews.value : []),
        ...(marketauxNews.status === 'fulfilled' ? marketauxNews.value : []),
        ...(avNews.status === 'fulfilled' ? avNews.value : []),
      ];

      // Extract rate data from economic calendar
      const rateData = extractInterestRateFromCalendar(calendarEvents, currency);

      // Build expectations from news sentiment
      const { expectations, endYearRate } = buildExpectations(allNews, currency);

      policies.push({
        currency,
        centralBank: CENTRAL_BANKS[currency].name,
        currentRate: rateData?.currentRate || 'N/D',
        lastDecision: rateData?.lastDecision || 'N/D',
        nextMeeting: rateData?.nextMeeting || 'Pendiente',
        expectations: allNews.length > 0 ? expectations : 'Sin datos suficientes',
        endYearRate: endYearRate !== 'N/D' ? endYearRate : 'N/D',
        sources: {
          finnhub: (finnhubNews.status === 'fulfilled' ? finnhubNews.value : []).length,
          fmp: (fmpNews.status === 'fulfilled' ? fmpNews.value : []).length,
          marketaux: (marketauxNews.status === 'fulfilled' ? marketauxNews.value : []).length,
          alphaVantage: (avNews.status === 'fulfilled' ? avNews.value : []).length,
        },
        recentHeadlines: allNews.slice(0, 3).map((n: any) => ({
          title: n.headline || n.title || '',
          source: n.source || n.source_name || 'API',
          date: n.datetime || n.date || n.publishedDate || n.time_published || '',
        })),
      });
    }

    return new Response(JSON.stringify(policies), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Monetary policies error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
