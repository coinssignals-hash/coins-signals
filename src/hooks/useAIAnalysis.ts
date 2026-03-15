import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/i18n/LanguageContext';

export type AIModule = 'analyze-patterns' | 'predict-signals' | 'generate-report' | 'synthesize-analysis' | 'correlation-analysis';

export interface AIAnalysisResult {
  module: AIModule;
  data: unknown;
  timestamp: string;
}

export function useAIAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, AIAnalysisResult>>({});

  const runModule = useCallback(async (module: AIModule, payload: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(module, {
        body: payload,
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
  }, []);

  const runFullAnalysis = useCallback(async (symbol: string, candles: unknown[], indicators: unknown) => {
    setLoading(true);
    setError(null);
    // Run first 3 modules, then synthesize with their results
    const initialModules: AIModule[] = ['analyze-patterns', 'predict-signals', 'generate-report', 'correlation-analysis'];
    const allResults: Record<string, AIAnalysisResult> = {};

    try {
      // Run first 3 modules sequentially
      for (const mod of initialModules) {
        const { data, error: fnError } = await supabase.functions.invoke(mod, {
          body: { symbol, candles, indicators },
        });
        if (fnError) throw fnError;
        allResults[mod] = { module: mod, data, timestamp: new Date().toISOString() };
      }

      // Run synthesize-analysis with previous results
      const { data, error: fnError } = await supabase.functions.invoke('synthesize-analysis', {
        body: { symbol, candles, indicators, previousResults: allResults },
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
  }, []);

  return { results, loading, error, runModule, runFullAnalysis };
}
