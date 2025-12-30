// API Configuration
// Set VITE_USE_MOCK_DATA=false and VITE_API_URL to your FastAPI backend URL
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
  // Mock data is enabled by default unless explicitly set to 'false'
  // Set VITE_USE_MOCK_DATA=false in .env to use real FastAPI backend
  useMockData: import.meta.env.VITE_USE_MOCK_DATA !== 'false',
} as const;
