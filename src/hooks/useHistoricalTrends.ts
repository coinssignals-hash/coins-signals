import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Currency } from '@/types/news';

export interface TrendPoint {
  period: string;
  label: string;
  impact: number;
  volume: number;
  confidence: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

export interface CurrencyTrend {
  currency: string;
  avgImpact: number;
  maxImpact: number;
  minImpact: number;
  direction: 'bullish' | 'bearish' | 'neutral';
  points: TrendPoint[];
}

export interface HistoricalTrendsData {
  granularity: 'monthly' | 'yearly';
  periodCount: number;
  currencies: CurrencyTrend[];
  overall: {
    trend: 'bullish' | 'bearish' | 'neutral';
    avgImpact: number;
    volatility: number;
  };
}

interface TrendsParams {
  currencies?: Currency[];
  granularity?: 'monthly' | 'yearly';
  months?: number;
}

async function fetchHistoricalTrends(params: TrendsParams): Promise<HistoricalTrendsData> {
  const { data, error } = await supabase.functions.invoke('historical-trends', {
    body: {
      currencies: params.currencies,
      granularity: params.granularity || 'monthly',
      months: params.months || 12,
    },
  });

  if (error) {
    console.error('[useHistoricalTrends] Error:', error);
    throw error;
  }

  return data;
}

export function useHistoricalTrends(params: TrendsParams = {}) {
  const { currencies, granularity = 'monthly', months = 12 } = params;

  return useQuery({
    queryKey: ['historical-trends', currencies?.sort().join(',') ?? 'all', granularity, months],
    queryFn: () => fetchHistoricalTrends({ currencies, granularity, months }),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,    // 30 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function useMonthlyTrends(currencies?: Currency[], months = 12) {
  return useHistoricalTrends({ currencies, granularity: 'monthly', months });
}

export function useYearlyTrends(currencies?: Currency[]) {
  return useHistoricalTrends({ currencies, granularity: 'yearly', months: 36 });
}
