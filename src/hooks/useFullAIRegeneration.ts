import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AIAnalysisType } from './useAIAnalysis';

interface MarketData {
  currentPrice: number;
  previousClose: number;
  high: number;
  low: number;
  volume?: number;
}

interface RegenerationProgress {
  current: number;
  total: number;
  currentType: AIAnalysisType | null;
}

interface UseFullAIRegenerationReturn {
  regenerateAll: (symbol: string, marketData: MarketData) => Promise<void>;
  isRegenerating: boolean;
  progress: RegenerationProgress;
}

const ANALYSIS_TYPES: AIAnalysisType[] = ['sentiment', 'prediction', 'recommendations', 'conclusions'];

export function useFullAIRegeneration(): UseFullAIRegenerationReturn {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [progress, setProgress] = useState<RegenerationProgress>({
    current: 0,
    total: ANALYSIS_TYPES.length,
    currentType: null
  });

  const regenerateAll = useCallback(async (symbol: string, marketData: MarketData) => {
    setIsRegenerating(true);
    setProgress({ current: 0, total: ANALYSIS_TYPES.length, currentType: null });

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < ANALYSIS_TYPES.length; i++) {
      const type = ANALYSIS_TYPES[i];
      setProgress({ current: i, total: ANALYSIS_TYPES.length, currentType: type });

      try {
        const { data, error } = await supabase.functions.invoke('ai-analysis', {
          body: {
            type,
            symbol,
            marketData
          }
        });

        if (error || data?.error) {
          errorCount++;
          console.error(`Error regenerating ${type}:`, error || data?.error);
        } else {
          successCount++;
        }
      } catch (err) {
        errorCount++;
        console.error(`Error regenerating ${type}:`, err);
      }

      // Small delay between requests to avoid rate limiting
      if (i < ANALYSIS_TYPES.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setProgress({ current: ANALYSIS_TYPES.length, total: ANALYSIS_TYPES.length, currentType: null });
    setIsRegenerating(false);

    if (errorCount === 0) {
      toast({
        title: '✨ Análisis completo regenerado',
        description: `${successCount} secciones actualizadas con IA`,
      });
    } else if (successCount > 0) {
      toast({
        title: 'Análisis parcialmente regenerado',
        description: `${successCount} éxitos, ${errorCount} errores`,
        variant: 'default'
      });
    } else {
      toast({
        title: 'Error al regenerar',
        description: 'No se pudo regenerar el análisis. Intenta de nuevo.',
        variant: 'destructive'
      });
    }
  }, []);

  return {
    regenerateAll,
    isRegenerating,
    progress
  };
}
