import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { newsApi } from '@/services/newsApi';
import { Currency } from '@/types/news';

// Query keys for cache management
export const newsKeys = {
  all: ['news'] as const,
  lists: () => [...newsKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...newsKeys.lists(), filters] as const,
  details: () => [...newsKeys.all, 'detail'] as const,
  detail: (id: string) => [...newsKeys.details(), id] as const,
  byDate: (date: Date) => [...newsKeys.all, 'byDate', date.toISOString()] as const,
  byCurrency: (currency: Currency) => [...newsKeys.all, 'byCurrency', currency] as const,
};

// Hook to fetch news list with pagination
export function useNewsList(page = 1, limit = 20) {
  return useQuery({
    queryKey: newsKeys.list({ page, limit }),
    queryFn: () => newsApi.getNews(page, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to fetch news by ID
export function useNewsDetail(id: string) {
  return useQuery({
    queryKey: newsKeys.detail(id),
    queryFn: () => newsApi.getNewsById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook to fetch news by date
export function useNewsByDate(date: Date) {
  return useQuery({
    queryKey: newsKeys.byDate(date),
    queryFn: () => newsApi.getNewsByDate(date),
    staleTime: 5 * 60 * 1000,
  });
}

// Hook to fetch news by currency
export function useNewsByCurrency(currency: Currency) {
  return useQuery({
    queryKey: newsKeys.byCurrency(currency),
    queryFn: () => newsApi.getNewsByCurrency(currency),
    enabled: !!currency,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook to refresh news (mutation)
export function useRefreshNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: newsApi.refreshNews,
    onSuccess: () => {
      // Invalidate all news queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: newsKeys.all });
    },
  });
}
