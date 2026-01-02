import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EconomicCategory, Currency } from '@/types/news';

export interface MonthlyImpact {
  month: string;
  impact: number;
  confidence: number;
}

export interface HistoricalImpactData {
  monthlyData: MonthlyImpact[];
  averageImpact: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  summary: string;
}

interface FetchParams {
  newsId: string;
  newsTitle: string;
  category: EconomicCategory;
  affectedCurrencies: Currency[];
}

async function fetchHistoricalImpact(params: FetchParams): Promise<HistoricalImpactData> {
  const { data, error } = await supabase.functions.invoke('news-historical-impact', {
    body: {
      newsTitle: params.newsTitle,
      category: params.category,
      affectedCurrencies: params.affectedCurrencies,
    },
  });

  if (error) {
    console.error('[useNewsHistoricalImpact] Error:', error);
    throw error;
  }

  return data;
}

export function useNewsHistoricalImpact(params: FetchParams | null) {
  return useQuery({
    queryKey: ['news-historical-impact', params?.newsId],
    queryFn: () => fetchHistoricalImpact(params!),
    enabled: !!params,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 1,
  });
}

// Cache for multiple news items - fetch in batch for card display
const impactCache = new Map<string, HistoricalImpactData>();

export function useNewsHistoricalImpactCached(newsId: string, title: string, category: EconomicCategory, currencies: Currency[]) {
  return useQuery({
    queryKey: ['news-historical-impact-cached', newsId],
    queryFn: async () => {
      // Check cache first
      if (impactCache.has(newsId)) {
        return impactCache.get(newsId)!;
      }
      
      const data = await fetchHistoricalImpact({
        newsId,
        newsTitle: title,
        category,
        affectedCurrencies: currencies,
      });
      
      // Store in cache
      impactCache.set(newsId, data);
      
      return data;
    },
    enabled: !!newsId && !!title,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 1,
    // Don't refetch on window focus for cached data
    refetchOnWindowFocus: false,
  });
}
