import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFullAIRegeneration } from '@/hooks/useFullAIRegeneration';

interface AIFullRegenerateButtonProps {
  symbol: string;
  currentPrice: number;
  high: number;
  low: number;
  className?: string;
}

const TYPE_LABELS: Record<string, string> = {
  sentiment: 'Sentimiento',
  prediction: 'Predicción',
  recommendations: 'Recomendaciones',
  conclusions: 'Conclusiones'
};

export function AIFullRegenerateButton({
  symbol,
  currentPrice,
  high,
  low,
  className
}: AIFullRegenerateButtonProps) {
  const { regenerateAll, isRegenerating, progress } = useFullAIRegeneration();

  const handleRegenerate = () => {
    regenerateAll(symbol, {
      currentPrice,
      previousClose: currentPrice * 0.998,
      high,
      low
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRegenerate}
      disabled={isRegenerating}
      className={cn(
        'gap-2 border-purple-500/50 hover:bg-purple-500/20 hover:border-purple-400',
        'text-purple-400 hover:text-purple-300 bg-purple-500/10',
        className
      )}
    >
      {isRegenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs">
            {progress.currentType 
              ? `${TYPE_LABELS[progress.currentType]} (${progress.current + 1}/${progress.total})`
              : 'Iniciando...'}
          </span>
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          <span className="text-xs">Regenerar Todo con IA</span>
        </>
      )}
    </Button>
  );
}
