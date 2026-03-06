import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useNewsList, useNewsDetail, useNewsByDate, useNewsByCurrency, newsKeys } from '../useNews';

// Mock the newsApi service
const mockGetNews = vi.fn();
const mockGetNewsById = vi.fn();
const mockGetNewsByDate = vi.fn();
const mockGetNewsByCurrency = vi.fn();

vi.mock('@/services/newsApi', () => ({
  newsApi: {
    getNews: (...args: any[]) => mockGetNews(...args),
    getNewsById: (...args: any[]) => mockGetNewsById(...args),
    getNewsByDate: (...args: any[]) => mockGetNewsByDate(...args),
    getNewsByCurrency: (...args: any[]) => mockGetNewsByCurrency(...args),
    refreshNews: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useNews hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('newsKeys', () => {
    it('generates correct query keys', () => {
      expect(newsKeys.all).toEqual(['news']);
      expect(newsKeys.lists()).toEqual(['news', 'list']);
      expect(newsKeys.list({ page: 1 })).toEqual(['news', 'list', { page: 1 }]);
      expect(newsKeys.details()).toEqual(['news', 'detail']);
      expect(newsKeys.detail('abc')).toEqual(['news', 'detail', 'abc']);
    });

    it('generates date-based key with ISO string', () => {
      const date = new Date('2025-01-15T00:00:00.000Z');
      const key = newsKeys.byDate(date);
      expect(key).toEqual(['news', 'byDate', '2025-01-15T00:00:00.000Z']);
    });

    it('generates currency-based key', () => {
      expect(newsKeys.byCurrency('USD')).toEqual(['news', 'byCurrency', 'USD']);
    });
  });

  describe('useNewsList', () => {
    it('fetches news list with default pagination', async () => {
      const mockData = {
        items: [{ id: '1', title: 'Test News' }],
        total: 1,
        page: 1,
        limit: 20,
      };
      mockGetNews.mockResolvedValue(mockData);

      const { result } = renderHook(() => useNewsList(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockGetNews).toHaveBeenCalledWith(1, 20);
      expect(result.current.data).toEqual(mockData);
    });

    it('fetches with custom page and limit', async () => {
      mockGetNews.mockResolvedValue({ items: [], total: 0, page: 3, limit: 10 });

      const { result } = renderHook(() => useNewsList(3, 10), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockGetNews).toHaveBeenCalledWith(3, 10);
    });

    it('handles fetch error', async () => {
      mockGetNews.mockRejectedValue(new Error('API down'));

      const { result } = renderHook(() => useNewsList(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.message).toBe('API down');
    });
  });

  describe('useNewsDetail', () => {
    it('fetches news by ID', async () => {
      const mockDetail = { id: 'news-1', title: 'Breaking News', content: 'Details...' };
      mockGetNewsById.mockResolvedValue(mockDetail);

      const { result } = renderHook(() => useNewsDetail('news-1'), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockGetNewsById).toHaveBeenCalledWith('news-1');
      expect(result.current.data).toEqual(mockDetail);
    });

    it('does not fetch when id is empty', () => {
      renderHook(() => useNewsDetail(''), { wrapper: createWrapper() });
      expect(mockGetNewsById).not.toHaveBeenCalled();
    });
  });

  describe('useNewsByDate', () => {
    it('fetches news for a specific date', async () => {
      const date = new Date('2025-03-01');
      const mockNews = [{ id: '1', title: 'March News' }];
      mockGetNewsByDate.mockResolvedValue(mockNews);

      const { result } = renderHook(() => useNewsByDate(date), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockGetNewsByDate).toHaveBeenCalledWith(date);
      expect(result.current.data).toEqual(mockNews);
    });
  });

  describe('useNewsByCurrency', () => {
    it('fetches news filtered by currency', async () => {
      const mockNews = [{ id: '2', title: 'USD Impact', affected_currencies: ['USD'] }];
      mockGetNewsByCurrency.mockResolvedValue(mockNews);

      const { result } = renderHook(
        () => useNewsByCurrency('USD'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockGetNewsByCurrency).toHaveBeenCalledWith('USD');
    });

    it('does not fetch when currency is empty', () => {
      renderHook(() => useNewsByCurrency('' as any), { wrapper: createWrapper() });
      expect(mockGetNewsByCurrency).not.toHaveBeenCalled();
    });
  });
});
