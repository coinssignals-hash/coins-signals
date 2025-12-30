// API Configuration
// Change this URL to your FastAPI backend URL
export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  endpoints: {
    // News endpoints
    news: '/api/v1/news',
    newsById: (id: string) => `/api/v1/news/${id}`,
    newsByDate: (date: string) => `/api/v1/news/by-date/${date}`,
    newsByCurrency: (currency: string) => `/api/v1/news/currency/${currency}`,
    refresh: '/api/v1/news/refresh',
    
    // Analysis endpoints
    fullAnalysis: (symbol: string) => `/api/v1/analysis/full/${symbol}`,
    sentiment: (symbol: string) => `/api/v1/analysis/sentiment/${symbol}`,
    prediction: (symbol: string) => `/api/v1/analysis/prediction/${symbol}`,
    technicalLevels: (symbol: string) => `/api/v1/analysis/technical-levels/${symbol}`,
    previousDay: (symbol: string) => `/api/v1/analysis/previous-day/${symbol}`,
    recommendations: (symbol: string) => `/api/v1/analysis/recommendations/${symbol}`,
    conclusions: (symbol: string) => `/api/v1/analysis/conclusions/${symbol}`,
    monetaryPolicies: (symbol: string) => `/api/v1/analysis/monetary-policies/${symbol}`,
    majorNews: (symbol: string) => `/api/v1/analysis/major-news/${symbol}`,
    relevantNews: (symbol: string) => `/api/v1/analysis/relevant-news/${symbol}`,
    economicEvents: (symbol: string, date: string) => `/api/v1/analysis/economic-events/${symbol}/${date}`,
  },
  // Enable mock data when API is not available
  useMockData: import.meta.env.VITE_USE_MOCK_DATA === 'true' || true,
} as const;
