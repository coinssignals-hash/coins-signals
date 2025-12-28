// API Configuration
// Change this URL to your FastAPI backend URL
export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  endpoints: {
    news: '/api/v1/news',
    newsById: (id: string) => `/api/v1/news/${id}`,
    newsByDate: (date: string) => `/api/v1/news/by-date/${date}`,
    newsByCurrency: (currency: string) => `/api/v1/news/currency/${currency}`,
    refresh: '/api/v1/news/refresh',
  },
  // Enable mock data when API is not available
  useMockData: import.meta.env.VITE_USE_MOCK_DATA === 'true' || true,
} as const;
