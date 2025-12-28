import { API_CONFIG } from '@/config/api';
import { NewsListItem, NewsDetail, Currency } from '@/types/news';
import { mockNewsList, getNewsById as getMockNewsById, getNewsByDate as getMockNewsByDate } from '@/data/mockNews';
import { format } from 'date-fns';

// API Response types
interface NewsListResponse {
  items: NewsListItem[];
  total: number;
  page: number;
  limit: number;
}

interface RefreshResponse {
  status: string;
  message: string;
  new_articles_count: number;
}

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

// News API Service
export const newsApi = {
  // Get all news with pagination
  async getNews(page = 1, limit = 20): Promise<NewsListResponse> {
    if (API_CONFIG.useMockData) {
      return {
        items: mockNewsList,
        total: mockNewsList.length,
        page,
        limit,
      };
    }
    return fetchApi<NewsListResponse>(`${API_CONFIG.endpoints.news}?page=${page}&limit=${limit}`);
  },

  // Get news by ID
  async getNewsById(id: string): Promise<NewsDetail> {
    if (API_CONFIG.useMockData) {
      const news = getMockNewsById(id);
      if (!news) {
        throw new Error('News not found');
      }
      return news;
    }
    return fetchApi<NewsDetail>(API_CONFIG.endpoints.newsById(id));
  },

  // Get news by date
  async getNewsByDate(date: Date): Promise<NewsListItem[]> {
    if (API_CONFIG.useMockData) {
      return getMockNewsByDate(date);
    }
    const formattedDate = format(date, 'yyyy-MM-dd');
    return fetchApi<NewsListItem[]>(API_CONFIG.endpoints.newsByDate(formattedDate));
  },

  // Get news by currency
  async getNewsByCurrency(currency: Currency): Promise<NewsListItem[]> {
    if (API_CONFIG.useMockData) {
      return mockNewsList.filter((news) =>
        news.affected_currencies.includes(currency)
      );
    }
    return fetchApi<NewsListItem[]>(API_CONFIG.endpoints.newsByCurrency(currency));
  },

  // Trigger news refresh
  async refreshNews(): Promise<RefreshResponse> {
    if (API_CONFIG.useMockData) {
      return {
        status: 'success',
        message: 'Mock refresh completed',
        new_articles_count: 0,
      };
    }
    return fetchApi<RefreshResponse>(API_CONFIG.endpoints.refresh, {
      method: 'POST',
    });
  },
};
