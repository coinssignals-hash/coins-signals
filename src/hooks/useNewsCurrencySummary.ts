import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Currency } from '@/types/news';

export interface CurrencyDriver {
  driver: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
}

export interface CurrencyNewsSummary {
  currency: string;
  overallSentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  summary: string;
  keyDrivers: CurrencyDriver[];
  outlook: { shortTerm: string; mediumTerm: string; longTerm: string };
  relatedPairs: { pair: string; correlation: string; direction: string }[];
  recentNewsDigest: { title: string; impact: string; sentiment: string }[];
  monetaryPolicyBias: string;
  economicHealth: number;
  volatilityExpectation: 'low' | 'moderate' | 'high' | 'extreme';
  cached: boolean;
}

interface FetchParams {
  currency: Currency;
  newsItems?: { title: string; category: string; sentiment: string }[];
}

async function fetchCurrencySummary(params: FetchParams): Promise<CurrencyNewsSummary> {
  const { data, error } = await supabase.functions.invoke('news-currency-summary', {
    body: {
      currency: params.currency,
      newsItems: params.newsItems,
    },
  });

  if (error) {
    console.error('[useNewsCurrencySummary] Error:', error);
    throw error;
  }

  return data;
}

export function useNewsCurrencySummary(
  currency: Currency | null,
  newsItems?: { title: string; category: string; sentiment: string }[]
) {
  return useQuery({
    queryKey: ['news-currency-summary', currency, newsItems?.length],
    queryFn: () => fetchCurrencySummary({ currency: currency!, newsItems }),
    enabled: !!currency,
    staleTime: 15 * 60_000,
    gcTime: 30 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
