import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type AIAnalysisType = 'sentiment' | 'prediction' | 'conclusions' | 'recommendations' | 'technical_levels';

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
  cached?: boolean;
}

interface UseAIAnalysisReturn {
  generateAnalysis: (
    type: AIAnalysisType,
    symbol: string,
    marketData?: MarketData,
    technicalIndicators?: TechnicalIndicators,
    newsContext?: string[],
    forceRefresh?: boolean
  ) => Promise<AIAnalysisResult | null>;
  isLoading: boolean;
  error: string | null;
  lastResult: AIAnalysisResult | null;
}

// Helper to get translations without hook (reads from localStorage)
function getStoredLanguage(): string {
  try {
    return localStorage.getItem('app-language') || 'es';
  } catch {
    return 'es';
  }
}

const TOAST_TRANSLATIONS: Record<string, Record<string, string>> = {
  es: { rate_limit: 'Límite de velocidad', rate_limit_desc: 'Por favor espera unos segundos antes de regenerar.', credits: 'Créditos agotados', credits_desc: 'Añade créditos a tu workspace para continuar.', generated: 'Análisis generado', updated: 'Análisis actualizado con IA' },
  en: { rate_limit: 'Rate limit', rate_limit_desc: 'Please wait a few seconds before regenerating.', credits: 'Credits exhausted', credits_desc: 'Add credits to your workspace to continue.', generated: 'Analysis generated', updated: 'Analysis updated with AI' },
  pt: { rate_limit: 'Limite de velocidade', rate_limit_desc: 'Por favor, aguarde alguns segundos antes de regenerar.', credits: 'Créditos esgotados', credits_desc: 'Adicione créditos ao seu workspace para continuar.', generated: 'Análise gerada', updated: 'Análise atualizada com IA' },
  fr: { rate_limit: 'Limite de débit', rate_limit_desc: 'Veuillez patienter quelques secondes avant de régénérer.', credits: 'Crédits épuisés', credits_desc: 'Ajoutez des crédits à votre espace de travail pour continuer.', generated: 'Analyse générée', updated: 'Analyse mise à jour avec l\'IA' },
};

export function useAIAnalysis(): UseAIAnalysisReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<AIAnalysisResult | null>(null);

  const generateAnalysis = useCallback(async (
    type: AIAnalysisType,
    symbol: string,
    marketData?: MarketData,
    technicalIndicators?: TechnicalIndicators,
    newsContext?: string[],
    forceRefresh: boolean = false
  ): Promise<AIAnalysisResult | null> => {
    setIsLoading(true);
    setError(null);

    const lang = getStoredLanguage();
    const tt = TOAST_TRANSLATIONS[lang] || TOAST_TRANSLATIONS.es;

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-analysis', {
        body: {
          type,
          symbol,
          marketData,
          technicalIndicators,
          newsContext,
          forceRefresh,
          language: lang
        }
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.error) {
        if (data.error.includes('Rate limit')) {
          toast({ title: tt.rate_limit, description: tt.rate_limit_desc, variant: 'destructive' });
        } else if (data.error.includes('credits')) {
          toast({ title: tt.credits, description: tt.credits_desc, variant: 'destructive' });
        }
        throw new Error(data.error);
      }

      setLastResult(data);
      
      if (!data.cached) {
        toast({ title: tt.generated, description: `${type} — ${tt.updated}` });
      }

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

  return { generateAnalysis, isLoading, error, lastResult };
}
