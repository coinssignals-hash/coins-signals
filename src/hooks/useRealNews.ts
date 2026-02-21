import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Currency } from '@/types/news';

export interface RealNewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  source_logo: string | null;
  url: string;
  image_url: string | null;
  published_at: string;
  time_ago: string;
  category: string;
  affected_currencies: Currency[];
  sentiment: 'bullish' | 'bearish' | 'neutral';
  relevance_score: number;
}

interface FetchNewsResponse {
  success: boolean;
  data: RealNewsItem[];
  sources: {
    finnhub: boolean;
    polygon: boolean;
    newsapi: boolean;
    fxstreet: boolean;
    investing: boolean;
    forexfactory: boolean;
    bloomberg: boolean;
  };
  total: number;
  error?: string;
}

async function fetchRealNews(
  date?: Date,
  currencies?: Currency[],
  limit?: number
): Promise<RealNewsItem[]> {
  const { data, error } = await supabase.functions.invoke<FetchNewsResponse>('fetch-news', {
    body: {
      date: date?.toISOString(),
      currencies,
      limit: limit || 30,
    },
  });

  if (error) {
    console.error('[useRealNews] Error fetching news:', error);
    throw error;
  }

  if (!data?.success) {
    throw new Error(data?.error || 'Failed to fetch news');
  }

  return data.data;
}

export function useRealNews(date?: Date, currencies?: Currency[], limit?: number) {
  return useQuery({
    queryKey: ['real-news', date?.toISOString(), currencies, limit],
    queryFn: () => fetchRealNews(date, currencies, limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    retry: 2,
  });
}

export function useRealNewsByDate(date: Date) {
  return useRealNews(date, undefined, 30);
}
