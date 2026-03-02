import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AIModule = 'analyze-patterns' | 'predict-signals' | 'generate-report' | 'synthesize-analysis';

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
    const modules: AIModule[] = ['analyze-patterns', 'predict-signals', 'generate-report', 'synthesize-analysis'];
    const allResults: Record<string, AIAnalysisResult> = {};

    try {
      for (const mod of modules) {
        const { data, error: fnError } = await supabase.functions.invoke(mod, {
          body: { symbol, candles, indicators },
        });
        if (fnError) throw fnError;
        allResults[mod] = { module: mod, data, timestamp: new Date().toISOString() };
      }
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
