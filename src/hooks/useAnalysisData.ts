import { useQuery } from '@tanstack/react-query';
import { analysisApi } from '@/services/analysisApi';
import type {
  MajorNewsEvent,
  EconomicEvent,
  MarketSentimentData,
  PricePredictionData,
  TechnicalLevelsData,
  PreviousDayData,
  StrategicRecommendation,
  MarketConclusionsData,
  MonetaryPolicyData,
  RelevantNewsItem,
  FullAnalysisData,
} from '@/services/analysisApi';

// Query keys for cache management
export const analysisKeys = {
  all: ['analysis'] as const,
  fullAnalysis: (symbol: string) => [...analysisKeys.all, 'full', symbol] as const,
  sentiment: (symbol: string) => [...analysisKeys.all, 'sentiment', symbol] as const,
  prediction: (symbol: string) => [...analysisKeys.all, 'prediction', symbol] as const,
  technicalLevels: (symbol: string) => [...analysisKeys.all, 'technicalLevels', symbol] as const,
  previousDay: (symbol: string) => [...analysisKeys.all, 'previousDay', symbol] as const,
  recommendations: (symbol: string) => [...analysisKeys.all, 'recommendations', symbol] as const,
  conclusions: (symbol: string) => [...analysisKeys.all, 'conclusions', symbol] as const,
  monetaryPolicies: (symbol: string) => [...analysisKeys.all, 'monetaryPolicies', symbol] as const,
  majorNews: (symbol: string) => [...analysisKeys.all, 'majorNews', symbol] as const,
  relevantNews: (symbol: string) => [...analysisKeys.all, 'relevantNews', symbol] as const,
  economicEvents: (symbol: string, date: Date) => [...analysisKeys.all, 'economicEvents', symbol, date.toISOString()] as const,
};

// Hook to fetch full analysis
export function useFullAnalysis(symbol: string, currentPrice: number) {
  return useQuery({
    queryKey: analysisKeys.fullAnalysis(symbol),
    queryFn: () => analysisApi.getFullAnalysis(symbol, currentPrice),
    enabled: !!symbol,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to fetch market sentiment
export function useMarketSentiment(symbol: string) {
  return useQuery({
    queryKey: analysisKeys.sentiment(symbol),
    queryFn: () => analysisApi.getSentiment(symbol),
    enabled: !!symbol,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook to fetch price prediction
export function usePricePrediction(symbol: string, currentPrice: number) {
  return useQuery({
    queryKey: analysisKeys.prediction(symbol),
    queryFn: () => analysisApi.getPrediction(symbol, currentPrice),
    enabled: !!symbol && currentPrice > 0,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook to fetch technical levels
export function useTechnicalLevels(symbol: string, currentPrice: number) {
  return useQuery({
    queryKey: analysisKeys.technicalLevels(symbol),
    queryFn: () => analysisApi.getTechnicalLevels(symbol, currentPrice),
    enabled: !!symbol && currentPrice > 0,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook to fetch previous day data
export function usePreviousDay(symbol: string, currentPrice: number) {
  return useQuery({
    queryKey: analysisKeys.previousDay(symbol),
    queryFn: () => analysisApi.getPreviousDay(symbol, currentPrice),
    enabled: !!symbol && currentPrice > 0,
    staleTime: 30 * 60 * 1000, // 30 minutes (doesn't change often)
  });
}

// Hook to fetch strategic recommendations
export function useStrategicRecommendations(symbol: string, currentPrice: number) {
  return useQuery({
    queryKey: analysisKeys.recommendations(symbol),
    queryFn: () => analysisApi.getRecommendations(symbol, currentPrice),
    enabled: !!symbol && currentPrice > 0,
    staleTime: 10 * 60 * 1000,
  });
}

// Hook to fetch market conclusions
export function useMarketConclusions(symbol: string, currentPrice: number) {
  return useQuery({
    queryKey: analysisKeys.conclusions(symbol),
    queryFn: () => analysisApi.getConclusions(symbol, currentPrice),
    enabled: !!symbol && currentPrice > 0,
    staleTime: 10 * 60 * 1000,
  });
}

// Hook to fetch monetary policies
export function useMonetaryPolicies(symbol: string) {
  return useQuery({
    queryKey: analysisKeys.monetaryPolicies(symbol),
    queryFn: () => analysisApi.getMonetaryPolicies(symbol),
    enabled: !!symbol,
    staleTime: 60 * 60 * 1000, // 1 hour (policies don't change often)
  });
}

// Shared hook that fetches both major and relevant news in a single call
export function useAnalysisNews(symbol: string) {
  return useQuery({
    queryKey: [...analysisKeys.all, 'analysisNews', symbol] as const,
    queryFn: () => analysisApi.getAnalysisNews(symbol),
    enabled: !!symbol,
    staleTime: 5 * 60 * 1000,
  });
}

// Convenience hooks that select from the shared query
export function useMajorNews(symbol: string) {
  const query = useAnalysisNews(symbol);
  return { ...query, data: query.data?.majorNews };
}

export function useRelevantNews(symbol: string) {
  const query = useAnalysisNews(symbol);
  return { ...query, data: query.data?.relevantNews };
}

// Hook to fetch economic events
export function useEconomicEvents(symbol: string, date: Date) {
  return useQuery({
    queryKey: analysisKeys.economicEvents(symbol, date),
    queryFn: () => analysisApi.getEconomicEvents(symbol, date),
    enabled: !!symbol,
    staleTime: 5 * 60 * 1000,
  });
}

export type {
  MajorNewsEvent,
  EconomicEvent,
  MarketSentimentData,
  PricePredictionData,
  TechnicalLevelsData,
  PreviousDayData,
  StrategicRecommendation,
  MarketConclusionsData,
  MonetaryPolicyData,
  RelevantNewsItem,
  FullAnalysisData,
};
