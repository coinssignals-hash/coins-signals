import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RealNewsItem } from './useRealNews';

export interface KeyPoint {
  icon: string;
  text: string;
  importance: 'high' | 'medium' | 'low';
}

export interface TraderConclusion {
  bias: 'bullish' | 'bearish' | 'neutral';
  biasStrength: 'strong' | 'moderate' | 'weak';
  summary: string;
  recommendedPairs: string[];
  riskLevel: 'high' | 'medium' | 'low';
  timeHorizon: 'short_term' | 'medium_term' | 'long_term';
}

export interface NewsAIAnalysis {
  aiSummary: string;
  keyPoints: KeyPoint[];
  traderConclusion: TraderConclusion;
  marketImpact: string;
  tradingStrategy: string;
}

interface AIAnalysisResponse {
  success: boolean;
  data?: NewsAIAnalysis;
  error?: string;
}

function getStoredLanguage(): string {
  try {
    return localStorage.getItem('app-language') || 'es';
  } catch {
    return 'es';
  }
}

async function fetchNewsAIAnalysis(news: RealNewsItem): Promise<NewsAIAnalysis> {
  const language = getStoredLanguage();
  const { data, error } = await supabase.functions.invoke<AIAnalysisResponse>('news-ai-analysis', {
    body: {
      newsId: news.id,
      title: news.title,
      summary: news.summary,
      source: news.source,
      category: news.category,
      affectedCurrencies: news.affected_currencies,
      sentiment: news.sentiment,
      language,
    },
  });

  if (error) {
    console.error('[useNewsAIAnalysis] Error:', error);
    throw error;
  }

  if (!data?.success || !data.data) {
    throw new Error(data?.error || 'Failed to generate AI analysis');
  }

  return data.data;
}

export function useNewsAIAnalysis(news: RealNewsItem | null) {
  return useQuery({
    queryKey: ['news-ai-analysis', news?.id],
    queryFn: () => fetchNewsAIAnalysis(news!),
    enabled: !!news,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 1,
  });
}
