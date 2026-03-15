// API Configuration
// Production: points to Hetzner VPS backend
// Local dev: falls back to localhost:8000
// Set VITE_API_URL in environment to override

const PRODUCTION_API_URL = 'https://api.yourdomain.com'; // ← Reemplaza con tu dominio Hetzner

const resolveBaseUrl = (): string => {
  // 1. Explicit env var always wins
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // 2. Production build → use Hetzner
  if (import.meta.env.PROD) {
    return PRODUCTION_API_URL;
  }
  // 3. Dev → localhost
  return 'http://localhost:8000';
};

export const API_CONFIG = {
  baseUrl: resolveBaseUrl(),
  endpoints: {
    // News endpoints
    news: '/api/v1/news',
    newsById: (id: string) => `/api/v1/news/${id}`,
    newsByDate: (date: string) => `/api/v1/news/by-date/${date}`,
    newsByCurrency: (currency: string) => `/api/v1/news/currency/${currency}`,
    refresh: '/api/v1/news/refresh',
    
    // Analysis endpoints
    fullAnalysis: (symbol: string) => `/api/v1/analysis/full/${encodeURIComponent(symbol)}`,
    sentiment: (symbol: string) => `/api/v1/analysis/sentiment/${encodeURIComponent(symbol)}`,
    prediction: (symbol: string) => `/api/v1/analysis/prediction/${encodeURIComponent(symbol)}`,
    technicalLevels: (symbol: string) => `/api/v1/analysis/technical-levels/${encodeURIComponent(symbol)}`,
    previousDay: (symbol: string) => `/api/v1/analysis/previous-day/${encodeURIComponent(symbol)}`,
    recommendations: (symbol: string) => `/api/v1/analysis/recommendations/${encodeURIComponent(symbol)}`,
    conclusions: (symbol: string) => `/api/v1/analysis/conclusions/${encodeURIComponent(symbol)}`,
    monetaryPolicies: (symbol: string) => `/api/v1/analysis/monetary-policies/${encodeURIComponent(symbol)}`,
    majorNews: (symbol: string) => `/api/v1/analysis/major-news/${encodeURIComponent(symbol)}`,
    relevantNews: (symbol: string) => `/api/v1/analysis/relevant-news/${encodeURIComponent(symbol)}`,
    economicEvents: (symbol: string, date: string) => `/api/v1/analysis/economic-events/${encodeURIComponent(symbol)}/${date}`,
  },
  useMockData: import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_DATA !== 'false' 
    ? true 
    : import.meta.env.VITE_USE_MOCK_DATA === 'true',
} as const;
