import { API_CONFIG } from '@/config/api';
import { format } from 'date-fns';

// Types for analysis data
export interface MajorNewsEvent {
  type: 'positive' | 'negative';
  currency: string;
  title: string;
  description: string;
  source?: string;
}

export interface EconomicEvent {
  time: string;
  event: string;
  description: string;
  impact: 'Alto' | 'Moderado' | 'Bajo';
  result?: string;
}

// Mock data for when API is not available
const mockMajorNews: MajorNewsEvent[] = [
  {
    type: 'positive',
    currency: 'EUR',
    title: 'Estabilidad política en la Eurozona',
    description: 'El Primer Ministro Sébastien Lecornu sobrevivió a dos votos consecutivos de no confianza, reduciendo el riesgo político en la segunda economía más grande de la Eurozona y aliviando tensiones políticas regionales',
    source: 'Reuters'
  },
  {
    type: 'negative',
    currency: 'USD',
    title: 'Presión sobre el dólar',
    description: 'Los funcionarios de la Fed Christopher Waller y Stephen Miran pidieron más recortes de tasas para apoyar el mercado laboral, añadiendo presión al dólar. Los mercados esperan al menos dos recortes de 25 puntos básicos antes de fin de año.',
    source: 'Bloomberg'
  },
  {
    type: 'negative',
    currency: 'USD',
    title: 'Preocupaciones bancarias',
    description: 'Crecientes preocupaciones sobre prácticas de préstamos poco saludables en bancos regionales de EE.UU., particularmente problemas en Zions Bancorporation y Western Alliance Bancorp, elevaron riesgos de contagio en el mercado crediticio.',
    source: 'Financial Times'
  }
];

const mockEconomicEvents: EconomicEvent[] = [
  {
    time: '09:00',
    event: 'Datos finales de inflación de la Eurozona (Septiembre 2025)',
    description: 'CPI final y/y: 2.2%, CPI core y/y: 2.4%',
    impact: 'Alto',
    result: 'En línea con expectativas. Inflación cercana al objetivo del 2% del ECB'
  },
  {
    time: '10:00',
    event: 'Reuniones anuales FMI/Banco Mundial',
    description: 'Evento multi-día con participación global',
    impact: 'Moderado',
    result: 'En curso'
  },
  {
    time: '14:30',
    event: 'Ventas minoristas de EE.UU.',
    description: 'Datos mensuales de consumo del sector retail',
    impact: 'Alto',
    result: 'Pendiente'
  },
  {
    time: '16:00',
    event: 'Discurso del presidente de la Fed',
    description: 'Comentarios sobre política monetaria y perspectivas económicas',
    impact: 'Alto',
    result: 'Pendiente'
  }
];

// Helper function for fetch requests
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

// Analysis API Service
export const analysisApi = {
  // Get major news for a symbol
  async getMajorNews(symbol: string): Promise<MajorNewsEvent[]> {
    if (API_CONFIG.useMockData) {
      // Filter mock data based on currencies in the symbol
      const currencies = symbol.replace('/', '').match(/.{1,3}/g) || [];
      return mockMajorNews.filter(news => 
        currencies.some(cur => news.currency.includes(cur))
      );
    }
    return fetchApi<MajorNewsEvent[]>(API_CONFIG.endpoints.majorNews(symbol));
  },

  // Get economic events for a date
  async getEconomicEvents(date: Date): Promise<EconomicEvent[]> {
    if (API_CONFIG.useMockData) {
      return mockEconomicEvents;
    }
    const formattedDate = format(date, 'yyyy-MM-dd');
    return fetchApi<EconomicEvent[]>(API_CONFIG.endpoints.economicEvents(formattedDate));
  },
};
