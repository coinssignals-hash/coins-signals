import { useQuery } from '@tanstack/react-query';
import { analysisApi, MajorNewsEvent, EconomicEvent } from '@/services/analysisApi';

// Query keys for cache management
export const analysisKeys = {
  all: ['analysis'] as const,
  majorNews: (symbol: string) => [...analysisKeys.all, 'majorNews', symbol] as const,
  economicEvents: (date: Date) => [...analysisKeys.all, 'economicEvents', date.toISOString()] as const,
};

// Hook to fetch major news for analysis
export function useMajorNews(symbol: string) {
  return useQuery({
    queryKey: analysisKeys.majorNews(symbol),
    queryFn: () => analysisApi.getMajorNews(symbol),
    enabled: !!symbol,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to fetch economic events
export function useEconomicEvents(date: Date) {
  return useQuery({
    queryKey: analysisKeys.economicEvents(date),
    queryFn: () => analysisApi.getEconomicEvents(date),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export type { MajorNewsEvent, EconomicEvent };
