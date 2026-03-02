import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

async function avFetch(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('alpha-vantage', { body });
  if (error) throw error;
  return data;
}

export function useAVNewsSentiment(tickers?: string, topics?: string) {
  return useQuery({
    queryKey: ['av-news-sentiment', tickers, topics],
    queryFn: () => avFetch({ action: 'news-sentiment', tickers, topics, sort: 'LATEST', limit: 20 }),
    staleTime: 5 * 60_000,
    select: (data: any) => data?.feed ?? [],
  });
}

export function useAVForexRate(fromCurrency: string, toCurrency: string) {
  return useQuery({
    queryKey: ['av-forex-rate', fromCurrency, toCurrency],
    queryFn: () => avFetch({ action: 'forex-rate', from_currency: fromCurrency, to_currency: toCurrency }),
    enabled: !!fromCurrency && !!toCurrency,
    staleTime: 30_000,
    refetchInterval: 30_000,
    select: (data: any) => data?.['Realtime Currency Exchange Rate'] ?? null,
  });
}

export function useAVCompanyOverview(symbol: string) {
  return useQuery({
    queryKey: ['av-overview', symbol],
    queryFn: () => avFetch({ action: 'overview', symbol }),
    enabled: !!symbol,
    staleTime: 30 * 60_000,
  });
}

export function useAVEarnings(symbol: string) {
  return useQuery({
    queryKey: ['av-earnings', symbol],
    queryFn: () => avFetch({ action: 'earnings', symbol }),
    enabled: !!symbol,
    staleTime: 30 * 60_000,
    select: (data: any) => data?.quarterlyEarnings?.slice(0, 8) ?? [],
  });
}

export function useAVIncomeStatement(symbol: string) {
  return useQuery({
    queryKey: ['av-income', symbol],
    queryFn: () => avFetch({ action: 'income-statement', symbol }),
    enabled: !!symbol,
    staleTime: 30 * 60_000,
    select: (data: any) => data?.annualReports?.slice(0, 5) ?? [],
  });
}
