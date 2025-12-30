import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type AIAnalysisType = 'sentiment' | 'prediction' | 'conclusions' | 'recommendations';

interface MarketData {
  currentPrice: number;
  previousClose: number;
  high: number;
  low: number;
  volume?: number;
}

interface TechnicalIndicators {
  rsi?: number;
  macd?: { value: number; signal: number; histogram: number };
  sma20?: number;
  sma50?: number;
}

interface AIAnalysisResult {
  type: AIAnalysisType;
  symbol: string;
  analysis: Record<string, unknown>;
  generated_at: string;
}

interface UseAIAnalysisReturn {
  generateAnalysis: (
    type: AIAnalysisType,
    symbol: string,
    marketData?: MarketData,
    technicalIndicators?: TechnicalIndicators,
    newsContext?: string[]
  ) => Promise<AIAnalysisResult | null>;
  isLoading: boolean;
  error: string | null;
  lastResult: AIAnalysisResult | null;
}

export function useAIAnalysis(): UseAIAnalysisReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<AIAnalysisResult | null>(null);

  const generateAnalysis = useCallback(async (
    type: AIAnalysisType,
    symbol: string,
    marketData?: MarketData,
    technicalIndicators?: TechnicalIndicators,
    newsContext?: string[]
  ): Promise<AIAnalysisResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-analysis', {
        body: {
          type,
          symbol,
          marketData,
          technicalIndicators,
          newsContext
        }
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.error) {
        if (data.error.includes('Rate limit')) {
          toast({
            title: 'Límite de velocidad',
            description: 'Por favor espera unos segundos antes de regenerar.',
            variant: 'destructive'
          });
        } else if (data.error.includes('credits')) {
          toast({
            title: 'Créditos agotados',
            description: 'Añade créditos a tu workspace para continuar.',
            variant: 'destructive'
          });
        }
        throw new Error(data.error);
      }

      setLastResult(data);
      toast({
        title: 'Análisis generado',
        description: `Análisis de ${type} actualizado con IA`,
      });

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error generating AI analysis';
      setError(message);
      console.error('AI Analysis error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    generateAnalysis,
    isLoading,
    error,
    lastResult
  };
}
