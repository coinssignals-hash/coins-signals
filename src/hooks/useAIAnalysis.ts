import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/i18n/LanguageContext';

export type AIModule = 'analyze-patterns' | 'predict-signals' | 'generate-report' | 'synthesize-analysis' | 'correlation-analysis';
export type DetailLevel = 'concise' | 'standard' | 'detailed';

export interface AIAnalysisResult {
  module: AIModule;
  data: unknown;
  timestamp: string;
}

export function useAIAnalysis() {
  const { language } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, AIAnalysisResult>>({});
  const [detailLevel, setDetailLevel] = useState<DetailLevel>('standard');

  const runModule = useCallback(async (module: AIModule, payload: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(module, {
        body: { ...payload, language, detailLevel },
      });
      if (fnError) throw fnError;

      const result: AIAnalysisResult = {
        module,
        data,
        timestamp: new Date().toISOString(),
      };
      setResults(prev => ({ ...prev, [module]: result }));
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : `Error running ${module}`;
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [language, detailLevel]);

  const runFullAnalysis = useCallback(async (symbol: string, candles: unknown[], indicators: unknown) => {
    setLoading(true);
    setError(null);
    const initialModules: AIModule[] = ['analyze-patterns', 'predict-signals', 'generate-report', 'correlation-analysis'];
    const allResults: Record<string, AIAnalysisResult> = {};

    try {
      for (const mod of initialModules) {
        const { data, error: fnError } = await supabase.functions.invoke(mod, {
          body: { symbol, candles, indicators, language, detailLevel },
        });
        if (fnError) throw fnError;
        allResults[mod] = { module: mod, data, timestamp: new Date().toISOString() };
      }

      const { data, error: fnError } = await supabase.functions.invoke('synthesize-analysis', {
        body: { symbol, candles, indicators, previousResults: allResults, language, detailLevel },
      });
      if (fnError) throw fnError;
      allResults['synthesize-analysis'] = { module: 'synthesize-analysis', data, timestamp: new Date().toISOString() };

      setResults(allResults);
      return allResults;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error in full analysis';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [language, detailLevel]);

  return { results, loading, error, runModule, runFullAnalysis, detailLevel, setDetailLevel };
}
