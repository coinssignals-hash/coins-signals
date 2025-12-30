import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Loader2 } from 'lucide-react';
import { useMarketConclusions } from '@/hooks/useAnalysisData';
import { useAIAnalysis } from '@/hooks/useAIAnalysis';
import { AnalysisError } from './AnalysisError';
import { AIRegenerateButton } from './AIRegenerateButton';

interface MarketConclusionsProps {
  symbol: string;
  currentPrice: number;
}

export function MarketConclusions({ symbol, currentPrice }: MarketConclusionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data, isLoading, error } = useMarketConclusions(symbol, currentPrice);
  const { generateAnalysis, isLoading: isAILoading } = useAIAnalysis();
  const [aiConclusions, setAIConclusions] = useState<Record<string, unknown> | null>(null);

  const handleRegenerateWithAI = async () => {
    const result = await generateAnalysis('conclusions', symbol, {
      currentPrice,
      previousClose: currentPrice * 0.998,
      high: currentPrice * 1.005,
      low: currentPrice * 0.995
    });
    if (result?.analysis) {
      setAIConclusions(result.analysis);
    }
  };

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'bullish': return 'text-green-400';
      case 'bearish': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="rounded-xl overflow-hidden border-2 border-green-500/30">
      <CollapsibleTrigger className="w-full bg-[#0d1f0d] px-4 py-3 flex items-center justify-between hover:bg-[#122212] transition-colors">
        <div className="flex items-center gap-2">
          <h3 className="text-white font-semibold text-sm">Conclusiones y Dirección Esperada Del Mercado</h3>
          {aiConclusions && (
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
              <span className="ml-2 text-gray-400">Cargando conclusiones...</span>
            </div>
          ) : error || (!data && !aiConclusions) ? (
            <AnalysisError 
              title="Conclusiones del Mercado"
              error={error as Error}
              compact
            />
          ) : aiConclusions ? (
            // AI-generated conclusions view
            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm">Resumen:</p>
                <p className="text-white">{aiConclusions.summary as string}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Factores Clave:</p>
                  <ul className="text-green-400 text-sm list-disc list-inside">
                    {(aiConclusions.key_drivers as string[])?.map((driver, i) => (
                      <li key={i}>{driver}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">Riesgos:</p>
                  <ul className="text-red-400 text-sm list-disc list-inside">
                    {(aiConclusions.risks as string[])?.map((risk, i) => (
                      <li key={i}>{risk}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-2">Oportunidades:</p>
                <ul className="text-yellow-400 text-sm list-disc list-inside">
                  {(aiConclusions.opportunities as string[])?.map((opp, i) => (
                    <li key={i}>{opp}</li>
                  ))}
                </ul>
              </div>
              <div className="pt-2 border-t border-green-900/30">
                <p className="text-gray-400 text-sm">Perspectiva:</p>
                <p className="text-white font-semibold">{aiConclusions.outlook as string}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Market Direction */}
              <div className="space-y-4">
                <h4 className="text-white font-semibold border-b border-green-900/50 pb-2">
                  Dirección Esperada del Mercado
                </h4>
                
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-400">Muy Corto Plazo (1-2 días):</p>
                    <p className={`font-semibold ${getDirectionColor(data!.shortTerm.direction)}`}>
                      {data!.shortTerm.label}
                    </p>
                    <p className="text-gray-300 text-xs">
                      Probabilidad: {data!.shortTerm.probability}% | Objetivo: {data!.shortTerm.target.toFixed(4)}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-gray-400">Corto Plazo (1-2 semanas):</p>
                    <p className={`font-semibold ${getDirectionColor(data!.mediumTerm.direction)}`}>
                      {data!.mediumTerm.label}
                    </p>
                    <p className="text-gray-300 text-xs">
                      Probabilidad: {data!.mediumTerm.probability}% | Rango: {data!.mediumTerm.range.min.toFixed(4)}-{data!.mediumTerm.range.max.toFixed(4)}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-gray-400">Medio Plazo (1-3 meses):</p>
                    <p className={`font-semibold ${getDirectionColor(data!.longTerm.direction)}`}>
                      {data!.longTerm.label}
                    </p>
                    <p className="text-gray-300 text-xs">
                      Objetivo: {data!.longTerm.target.toFixed(4)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Technical Analysis */}
              <div className="space-y-4">
                <h4 className="text-white font-semibold border-b border-green-900/50 pb-2">
                  Análisis Técnico Detallado
                </h4>
                
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-400">Resumen Técnico:</p>
                    <p className="text-gray-300 text-xs">{data!.technicalSummary}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-400">Para Alcistas:</p>
                    <p className="text-green-400 text-xs">{data!.bullishScenario}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-400">Escenario Bajista:</p>
                    <p className="text-red-400 text-xs">{data!.bearishScenario}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
