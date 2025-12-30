import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Loader2 } from 'lucide-react';
import { useStrategicRecommendations } from '@/hooks/useAnalysisData';
import { useAIAnalysis } from '@/hooks/useAIAnalysis';
import { AnalysisError } from './AnalysisError';
import { AIRegenerateButton } from './AIRegenerateButton';

interface StrategicRecommendationsProps {
  symbol: string;
  currentPrice: number;
}

export function StrategicRecommendations({ symbol, currentPrice }: StrategicRecommendationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data, isLoading, error } = useStrategicRecommendations(symbol, currentPrice);
  const { generateAnalysis, isLoading: isAILoading } = useAIAnalysis();
  const [aiRecommendations, setAIRecommendations] = useState<Record<string, unknown> | null>(null);

  const handleRegenerateWithAI = async () => {
    const result = await generateAnalysis('recommendations', symbol, {
      currentPrice,
      previousClose: currentPrice * 0.998,
      high: currentPrice * 1.005,
      low: currentPrice * 0.995
    });
    if (result?.analysis) {
      setAIRecommendations(result.analysis);
    }
  };

  // Helper to format AI recommendations to match component structure
  const formatAIRecommendation = (rec: Record<string, unknown>) => ({
    strategy: `${rec.action === 'buy' ? 'Compra' : rec.action === 'sell' ? 'Venta' : 'Mantener'} - ${rec.reasoning || ''}`,
    entry: `${(rec.entry_price as number)?.toFixed(4) || 'N/A'}`,
    stopLoss: `${(rec.stop_loss as number)?.toFixed(4) || 'N/A'}`,
    takeProfit1: `${(rec.take_profit as number)?.toFixed(4) || 'N/A'}`,
    takeProfit2: undefined as string | undefined,
    horizon: (rec.timeframe as string) || 'N/A',
    notes: [] as string[]
  });

  const displayData = aiRecommendations ? {
    longTerm: formatAIRecommendation((aiRecommendations.long_term || aiRecommendations.medium_term) as Record<string, unknown>),
    shortTerm: formatAIRecommendation(aiRecommendations.short_term as Record<string, unknown>)
  } : data;
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="rounded-xl overflow-hidden border-2 border-green-500/30">
      <CollapsibleTrigger className="w-full bg-[#0d1f0d] px-4 py-3 flex items-center justify-between hover:bg-[#122212] transition-colors">
        <div className="flex items-center gap-2">
          <h3 className="text-white font-semibold text-sm">Recomendaciones Estratégicas</h3>
          {aiRecommendations && (
            <span className="text-xs text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded">IA</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <AIRegenerateButton 
            onClick={(e) => { e.stopPropagation(); handleRegenerateWithAI(); }} 
            isLoading={isAILoading}
            showLabel={false}
            size="icon"
            className="h-7 w-7"
          />
          <ChevronDown className={`w-5 h-5 text-green-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="bg-[#0a1a0a] p-4 border-t border-green-500/20">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-green-400 animate-spin" />
              <span className="ml-2 text-gray-400">Cargando recomendaciones...</span>
            </div>
          ) : error || !displayData ? (
            <AnalysisError 
              title="Recomendaciones Estratégicas"
              error={error as Error}
              compact
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Long Term Traders */}
              <div className="space-y-3">
                <h4 className="text-white font-semibold border-b border-green-900/50 pb-2">
                  Para Traders de Largo Plazo
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-green-400 font-semibold">Estrategia:</span>
                    <p className="text-gray-300">{displayData.longTerm.strategy}</p>
                  </div>
                  <div>
                    <span className="text-green-400 font-semibold">Entrada:</span>
                    <p className="text-gray-300">{displayData.longTerm.entry}</p>
                  </div>
                  <div>
                    <span className="text-green-400 font-semibold">Stop Loss:</span>
                    <p className="text-gray-300">{displayData.longTerm.stopLoss}</p>
                  </div>
                  <div>
                    <span className="text-green-400 font-semibold">Objetivo 1:</span>
                    <p className="text-gray-300">{displayData.longTerm.takeProfit1}</p>
                  </div>
                  {displayData.longTerm.takeProfit2 && (
                    <div>
                      <span className="text-green-400 font-semibold">Objetivo 2:</span>
                      <p className="text-gray-300">{displayData.longTerm.takeProfit2}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-green-400 font-semibold">Horizonte:</span>
                    <p className="text-gray-300">{displayData.longTerm.horizon}</p>
                  </div>
                </div>
              </div>

              {/* Short Term Traders */}
              <div className="space-y-3">
                <h4 className="text-white font-semibold border-b border-green-900/50 pb-2">
                  Para Traders de Corto Plazo
                  <span className="text-gray-400 text-xs ml-2">(Day/Swing Traders)</span>
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-green-400 font-semibold">Estrategia:</span>
                    <p className="text-gray-300">{displayData.shortTerm.strategy}</p>
                  </div>
                  <div>
                    <span className="text-green-400 font-semibold">Entrada:</span>
                    <p className="text-gray-300">{displayData.shortTerm.entry}</p>
                  </div>
                  <div>
                    <span className="text-green-400 font-semibold">Stop Loss:</span>
                    <p className="text-gray-300">{displayData.shortTerm.stopLoss}</p>
                  </div>
                  <div>
                    <span className="text-green-400 font-semibold">Objetivo 1:</span>
                    <p className="text-gray-300">{displayData.shortTerm.takeProfit1}</p>
                  </div>
                  {displayData.shortTerm.takeProfit2 && (
                    <div>
                      <span className="text-green-400 font-semibold">Objetivo 2:</span>
                      <p className="text-gray-300">{displayData.shortTerm.takeProfit2}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-green-400 font-semibold">Horizonte:</span>
                    <p className="text-gray-300">{displayData.shortTerm.horizon}</p>
                  </div>
                  {displayData.shortTerm.notes && displayData.shortTerm.notes.length > 0 && (
                    <div>
                      <span className="text-green-400 font-semibold">Vigilar:</span>
                      <ul className="text-gray-300 list-disc list-inside">
                        {displayData.shortTerm.notes.map((note: string, i: number) => (
                          <li key={i}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
