import { API_CONFIG } from '@/config/api';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import {
  MajorNewsEvent,
  EconomicEvent,
  MarketSentimentData,
  PricePredictionData,
  TechnicalLevelsData,
  PreviousDayData,
  StrategicRecommendation,
  MarketConclusionsData,
  MonetaryPolicyData,
  RelevantNewsItem,
  FullAnalysisData,
} from '@/types/analysis';

// Helper function to call the Edge Function proxy
async function fetchViaProxy<T>(
  endpoint: string, 
  symbol: string, 
  date?: string,
  currentPrice?: number
): Promise<T> {
  console.log(`Fetching via proxy: ${endpoint} for ${symbol}`);
  
  const { data, error } = await supabase.functions.invoke('analysis-proxy', {
    body: { endpoint, symbol, date, currentPrice },
  });

  if (error) {
    console.error('Proxy error:', error);
    throw new Error(`Proxy Error: ${error.message}`);
  }

  if (data.error) {
    console.error('Backend error:', data.error);
    throw new Error(data.error);
  }

  return data as T;
}

// Helper function for direct fetch requests (fallback)
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_CONFIG.baseUrl}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Mock data generators
const generateMockSentiment = (symbol: string): MarketSentimentData => ({
  overall: 'bullish',
  bullishPercent: 65,
  bearishPercent: 25,
  neutralPercent: 10,
  indicators: [
    { name: 'RSI', signal: 'buy', value: 42 },
    { name: 'MACD', signal: 'buy' },
    { name: 'SMA 20', signal: 'neutral' },
    { name: 'SMA 50', signal: 'sell' },
    { name: 'Bollinger', signal: 'buy' },
  ],
  lastUpdate: new Date().toISOString(),
});

const generateMockPrediction = (symbol: string, currentPrice: number): PricePredictionData => ({
  symbol,
  currentPrice,
  predictedHigh: currentPrice * 1.008,
  predictedLow: currentPrice * 0.994,
  predictedClose: currentPrice * 1.003,
  confidence: 72,
  direction: 'up',
  summary: `Se espera que ${symbol} mantenga un sesgo alcista moderado durante la sesión, con soporte en niveles de Fibonacci y resistencia en máximos recientes.`,
  timeframe: '24h',
});

const generateMockTechnicalLevels = (symbol: string, currentPrice: number): TechnicalLevelsData => ({
  symbol,
  resistances: [
    { level: currentPrice * 1.005, strength: 'moderate', description: 'Resistencia inmediata' },
    { level: currentPrice * 1.012, strength: 'strong', description: 'Máximo semanal' },
    { level: currentPrice * 1.020, strength: 'weak', description: 'Fibonacci 38.2%' },
  ],
  supports: [
    { level: currentPrice * 0.995, strength: 'moderate', description: 'Soporte inmediato' },
    { level: currentPrice * 0.988, strength: 'strong', description: 'SMA 100' },
    { level: currentPrice * 0.980, strength: 'weak', description: 'Fibonacci 61.8%' },
  ],
  pivot: currentPrice,
  fibonacci: [
    { level: '23.6%', price: currentPrice * 1.005 },
    { level: '38.2%', price: currentPrice * 1.008 },
    { level: '50.0%', price: currentPrice * 1.012 },
    { level: '61.8%', price: currentPrice * 1.015 },
  ],
});

const generateMockPreviousDay = (symbol: string, currentPrice: number): PreviousDayData => ({
  symbol,
  date: format(new Date(Date.now() - 86400000), 'yyyy-MM-dd'),
  open: currentPrice * 0.998,
  high: currentPrice * 1.006,
  low: currentPrice * 0.992,
  close: currentPrice * 1.002,
  resistance: currentPrice * 1.006,
  support: currentPrice * 0.992,
  change: currentPrice * 0.004,
  changePercent: 0.4,
});

const generateMockRecommendations = (symbol: string, currentPrice: number): { longTerm: StrategicRecommendation; shortTerm: StrategicRecommendation } => ({
  longTerm: {
    type: 'long_term',
    strategy: `Operar el rango ${(currentPrice * 0.988).toFixed(4)}-${(currentPrice * 1.012).toFixed(4)} con stops ajustados`,
    entry: `Zona de compra ${(currentPrice * 0.988).toFixed(4)}-${(currentPrice * 0.992).toFixed(4)} (soporte de 100-day SMA)`,
    stopLoss: `Por debajo de ${(currentPrice * 0.980).toFixed(4)} (Fibonacci 61.8%)`,
    takeProfit1: `${(currentPrice * 1.008).toFixed(4)} (resistencia Fibonacci 23.6%)`,
    takeProfit2: `${(currentPrice * 1.020).toFixed(4)} (resistencias mayores)`,
    horizon: '2-3 meses',
    notes: ['Mantener stops ajustados', 'Vigilar comunicados del banco central'],
  },
  shortTerm: {
    type: 'short_term',
    strategy: `Operar el rango intradía ${(currentPrice * 0.996).toFixed(4)}-${(currentPrice * 1.004).toFixed(4)}`,
    entry: `En retrocesos hacia ${(currentPrice * 0.996).toFixed(4)}-${(currentPrice * 0.998).toFixed(4)}`,
    stopLoss: `Por debajo de ${(currentPrice * 0.994).toFixed(4)}`,
    takeProfit1: `${(currentPrice * 1.002).toFixed(4)}`,
    takeProfit2: `${(currentPrice * 1.004).toFixed(4)}`,
    horizon: '1-3 días',
    notes: ['Horario óptimo: Overlap Europa-América (13:00-17:00 GMT)', 'Vigilar datos económicos del día'],
  },
});

const generateMockConclusions = (symbol: string, currentPrice: number): MarketConclusionsData => ({
  symbol,
  shortTerm: {
    direction: 'bullish',
    label: 'REBOTE TÉCNICO PROBABLE',
    probability: 62,
    target: currentPrice * 1.004,
  },
  mediumTerm: {
    direction: 'neutral',
    label: 'CONSOLIDACIÓN EN RANGO',
    probability: 50,
    range: { min: currentPrice * 0.988, max: currentPrice * 1.012 },
  },
  longTerm: {
    direction: 'bullish',
    label: 'SESGO ALCISTA',
    range: { min: currentPrice * 0.95, max: currentPrice * 1.08 },
    target: currentPrice * 1.05,
  },
  technicalSummary: 'Indicadores técnicos muestran señales mixtas con predominio alcista a corto plazo pero condiciones de sobrecompra que podrían generar corrección.',
  bullishScenario: `Confirmación por encima de ${(currentPrice * 1.008).toFixed(4)} abriría camino a ${(currentPrice * 1.015).toFixed(4)}`,
  bearishScenario: `Fallo en mantener ${(currentPrice * 0.992).toFixed(4)} apuntaría a ${(currentPrice * 0.980).toFixed(4)}`,
});

const generateMockMonetaryPolicies = (symbol: string): MonetaryPolicyData[] => {
  const currencies = symbol.replace('/', '').match(/.{3}/g) || ['EUR', 'USD'];
  const policies: MonetaryPolicyData[] = [];

  if (currencies.includes('USD')) {
    policies.push({
      currency: 'USD',
      centralBank: 'US Federal Reserve',
      currentRate: '4.00% - 4.25%',
      lastDecision: 'Recorte de 25 pb (Diciembre 2025)',
      nextMeeting: '28-29 Enero 2026',
      expectations: 'Alta probabilidad de mantener tasas',
      endYearRate: '3.50% - 3.75%',
    });
  }

  if (currencies.includes('EUR')) {
    policies.push({
      currency: 'EUR',
      centralBank: 'EU Banco Central Europeo',
      currentRate: '2.15%',
      lastDecision: 'Sin cambios (Diciembre 2025)',
      nextMeeting: 'Enero 2026',
      expectations: 'Probable pausa continua',
      endYearRate: '2.00%',
    });
  }

  if (currencies.includes('GBP')) {
    policies.push({
      currency: 'GBP',
      centralBank: 'Bank of England',
      currentRate: '4.75%',
      lastDecision: 'Recorte de 25 pb (Noviembre 2025)',
      nextMeeting: 'Febrero 2026',
      expectations: 'Posible recorte adicional',
      endYearRate: '4.25%',
    });
  }

  if (currencies.includes('JPY')) {
    policies.push({
      currency: 'JPY',
      centralBank: 'Bank of Japan',
      currentRate: '0.25%',
      lastDecision: 'Sin cambios (Diciembre 2025)',
      nextMeeting: 'Enero 2026',
      expectations: 'Posible normalización gradual',
      endYearRate: '0.50%',
    });
  }

  return policies;
};

const generateMockMajorNews = (symbol: string): MajorNewsEvent[] => {
  const currencies = symbol.replace('/', '').match(/.{3}/g) || ['EUR', 'USD'];
  const allNews: MajorNewsEvent[] = [
    {
      type: 'positive',
      currency: 'EUR',
      title: 'Estabilidad política en la Eurozona',
      description: 'Datos de inflación en línea con expectativas del BCE, reduciendo incertidumbre sobre política monetaria.',
      source: 'Reuters',
    },
    {
      type: 'negative',
      currency: 'USD',
      title: 'Presión sobre el dólar',
      description: 'Funcionarios de la Fed señalan posibles recortes adicionales para 2026, debilitando al dólar.',
      source: 'Bloomberg',
    },
    {
      type: 'positive',
      currency: 'GBP',
      title: 'Datos de empleo positivos en UK',
      description: 'Tasa de desempleo se mantiene estable, apoyando a la libra esterlina.',
      source: 'Financial Times',
    },
    {
      type: 'negative',
      currency: 'JPY',
      title: 'BoJ mantiene política ultra-laxa',
      description: 'El Banco de Japón mantiene tasas cercanas a cero, presionando al yen.',
      source: 'Nikkei',
    },
  ];

  return allNews.filter(news => currencies.some(cur => news.currency === cur));
};

const generateMockRelevantNews = (symbol: string): RelevantNewsItem[] => {
  const currencies = symbol.replace('/', '').match(/.{3}/g) || ['EUR', 'USD'];
  const allNews: RelevantNewsItem[] = [
    {
      id: '1',
      title: 'Fed señala cautela ante datos mixtos de inflación',
      summary: 'Los funcionarios de la Reserva Federal mantienen tono cauteloso sobre futuros recortes de tasas.',
      imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=200&h=120&fit=crop',
      url: '#',
      source: 'Bloomberg',
      publishedAt: new Date().toISOString(),
      impact: 'high' as const,
      currencies: ['USD'],
    },
    {
      id: '2',
      title: 'BCE: Lagarde destaca resiliencia económica',
      summary: 'La presidenta del BCE enfatiza la fortaleza de la economía europea ante incertidumbres globales.',
      imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=200&h=120&fit=crop',
      url: '#',
      source: 'Reuters',
      publishedAt: new Date(Date.now() - 3600000).toISOString(),
      impact: 'high' as const,
      currencies: ['EUR'],
    },
    {
      id: '3',
      title: 'Datos de empleo superan expectativas en EE.UU.',
      summary: 'El mercado laboral estadounidense muestra fortaleza con 200K nuevos empleos.',
      imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=200&h=120&fit=crop',
      url: '#',
      source: 'CNBC',
      publishedAt: new Date(Date.now() - 7200000).toISOString(),
      impact: 'high' as const,
      currencies: ['USD'],
    },
    {
      id: '4',
      title: 'Inflación de la Eurozona se mantiene estable',
      summary: 'El IPC de la zona euro se sitúa en 2.2%, cerca del objetivo del BCE.',
      imageUrl: 'https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=200&h=120&fit=crop',
      url: '#',
      source: 'Financial Times',
      publishedAt: new Date(Date.now() - 10800000).toISOString(),
      impact: 'medium' as const,
      currencies: ['EUR'],
    },
    {
      id: '5',
      title: 'Tensiones geopolíticas afectan mercados',
      summary: 'Los inversores buscan activos refugio ante incertidumbre en Medio Oriente.',
      imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&h=120&fit=crop',
      url: '#',
      source: 'WSJ',
      publishedAt: new Date(Date.now() - 14400000).toISOString(),
      impact: 'medium' as const,
      currencies: ['USD', 'EUR', 'JPY'],
    },
  ];
  return allNews.filter(news => news.currencies.some(cur => currencies.includes(cur))).slice(0, 5);
};

const generateMockEconomicEvents = (symbol: string): EconomicEvent[] => {
  const currencies = symbol.replace('/', '').match(/.{3}/g) || ['EUR', 'USD'];
  const allEvents: EconomicEvent[] = [
    {
      time: '09:00',
      event: 'IPC Eurozona (Final)',
      description: 'Datos finales de inflación de la Eurozona',
      impact: 'Alto',
      result: 'En línea: 2.2% y/y',
    },
    {
      time: '14:30',
      event: 'Ventas Minoristas EE.UU.',
      description: 'Datos mensuales de consumo retail',
      impact: 'Alto',
      result: 'Pendiente',
    },
    {
      time: '15:00',
      event: 'Producción Industrial EE.UU.',
      description: 'Índice de producción manufacturera',
      impact: 'Moderado',
      result: 'Pendiente',
    },
    {
      time: '16:00',
      event: 'Discurso miembro Fed',
      description: 'Comentarios sobre política monetaria',
      impact: 'Alto',
      result: 'Pendiente',
    },
    {
      time: '20:00',
      event: 'Minutas FOMC',
      description: 'Actas de la última reunión de la Fed',
      impact: 'Alto',
      result: 'Pendiente',
    },
  ];

  // Filter events based on currencies
  return allEvents.filter(event => {
    if (currencies.includes('USD') && (event.event.includes('EE.UU.') || event.event.includes('Fed') || event.event.includes('FOMC'))) return true;
    if (currencies.includes('EUR') && event.event.includes('Eurozona')) return true;
    return false;
  });
};

// Analysis API Service
export const analysisApi = {
  // Get full analysis for a symbol
  async getFullAnalysis(symbol: string, currentPrice: number = 1.05): Promise<FullAnalysisData> {
    if (API_CONFIG.useMockData) {
      return {
        symbol,
        timestamp: new Date().toISOString(),
        sentiment: generateMockSentiment(symbol),
        prediction: generateMockPrediction(symbol, currentPrice),
        technicalLevels: generateMockTechnicalLevels(symbol, currentPrice),
        previousDay: generateMockPreviousDay(symbol, currentPrice),
        recommendations: generateMockRecommendations(symbol, currentPrice),
        conclusions: generateMockConclusions(symbol, currentPrice),
        monetaryPolicies: generateMockMonetaryPolicies(symbol),
        majorNews: generateMockMajorNews(symbol),
        relevantNews: generateMockRelevantNews(symbol),
        economicEvents: generateMockEconomicEvents(symbol),
      };
    }
    return fetchViaProxy<FullAnalysisData>('fullAnalysis', symbol, undefined, currentPrice);
  },

  // Individual endpoints
  async getSentiment(symbol: string): Promise<MarketSentimentData> {
    if (API_CONFIG.useMockData) {
      return generateMockSentiment(symbol);
    }
    return fetchViaProxy<MarketSentimentData>('sentiment', symbol);
  },

  async getPrediction(symbol: string, currentPrice: number): Promise<PricePredictionData> {
    if (API_CONFIG.useMockData) {
      return generateMockPrediction(symbol, currentPrice);
    }
    return fetchViaProxy<PricePredictionData>('prediction', symbol, undefined, currentPrice);
  },

  async getTechnicalLevels(symbol: string, currentPrice: number): Promise<TechnicalLevelsData> {
    if (API_CONFIG.useMockData) {
      return generateMockTechnicalLevels(symbol, currentPrice);
    }
    return fetchViaProxy<TechnicalLevelsData>('technicalLevels', symbol, undefined, currentPrice);
  },

  async getPreviousDay(symbol: string, currentPrice: number): Promise<PreviousDayData> {
    if (API_CONFIG.useMockData) {
      return generateMockPreviousDay(symbol, currentPrice);
    }
    return fetchViaProxy<PreviousDayData>('previousDay', symbol, undefined, currentPrice);
  },

  async getRecommendations(symbol: string, currentPrice: number): Promise<{ longTerm: StrategicRecommendation; shortTerm: StrategicRecommendation }> {
    if (API_CONFIG.useMockData) {
      return generateMockRecommendations(symbol, currentPrice);
    }
    return fetchViaProxy<{ longTerm: StrategicRecommendation; shortTerm: StrategicRecommendation }>('recommendations', symbol, undefined, currentPrice);
  },

  async getConclusions(symbol: string, currentPrice: number): Promise<MarketConclusionsData> {
    if (API_CONFIG.useMockData) {
      return generateMockConclusions(symbol, currentPrice);
    }
    return fetchViaProxy<MarketConclusionsData>('conclusions', symbol, undefined, currentPrice);
  },

  async getMonetaryPolicies(symbol: string): Promise<MonetaryPolicyData[]> {
    if (API_CONFIG.useMockData) {
      return generateMockMonetaryPolicies(symbol);
    }
    return fetchViaProxy<MonetaryPolicyData[]>('monetaryPolicies', symbol);
  },

  async getMajorNews(symbol: string): Promise<MajorNewsEvent[]> {
    if (API_CONFIG.useMockData) {
      return generateMockMajorNews(symbol);
    }
    return fetchViaProxy<MajorNewsEvent[]>('majorNews', symbol);
  },

  async getRelevantNews(symbol: string): Promise<RelevantNewsItem[]> {
    if (API_CONFIG.useMockData) {
      return generateMockRelevantNews(symbol);
    }
    return fetchViaProxy<RelevantNewsItem[]>('relevantNews', symbol);
  },

  async getEconomicEvents(symbol: string, date: Date): Promise<EconomicEvent[]> {
    if (API_CONFIG.useMockData) {
      return generateMockEconomicEvents(symbol);
    }
    const formattedDate = format(date, 'yyyy-MM-dd');
    return fetchViaProxy<EconomicEvent[]>('economicEvents', symbol, formattedDate);
  },
};

export type {
  MajorNewsEvent,
  EconomicEvent,
  MarketSentimentData,
  PricePredictionData,
  TechnicalLevelsData,
  PreviousDayData,
  StrategicRecommendation,
  MarketConclusionsData,
  MonetaryPolicyData,
  RelevantNewsItem,
  FullAnalysisData,
};
