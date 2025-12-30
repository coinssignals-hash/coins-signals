import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useMarketConclusions } from '@/hooks/useAnalysisData';

interface MarketConclusionsProps {
  symbol: string;
  currentPrice: number;
}

export function MarketConclusions({ symbol, currentPrice }: MarketConclusionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data, isLoading, error } = useMarketConclusions(symbol, currentPrice);

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
        <h3 className="text-white font-semibold text-sm">Conclusiones y Dirección Esperada Del Mercado</h3>
        <ChevronDown className={`w-5 h-5 text-green-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="bg-[#0a1a0a] p-4 border-t border-green-500/20">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-green-400 animate-spin" />
              <span className="ml-2 text-gray-400">Cargando conclusiones...</span>
            </div>
          ) : error || !data ? (
            <div className="text-red-400 text-sm py-4">
              Error al cargar las conclusiones.
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
                    <p className={`font-semibold ${getDirectionColor(data.shortTerm.direction)}`}>
                      {data.shortTerm.label}
                    </p>
                    <p className="text-gray-300 text-xs">
                      Probabilidad: {data.shortTerm.probability}% | Objetivo: {data.shortTerm.target.toFixed(4)}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-gray-400">Corto Plazo (1-2 semanas):</p>
                    <p className={`font-semibold ${getDirectionColor(data.mediumTerm.direction)}`}>
                      {data.mediumTerm.label}
                    </p>
                    <p className="text-gray-300 text-xs">
                      Probabilidad: {data.mediumTerm.probability}% | Rango: {data.mediumTerm.range.min.toFixed(4)}-{data.mediumTerm.range.max.toFixed(4)}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-gray-400">Medio Plazo (1-3 meses):</p>
                    <p className={`font-semibold ${getDirectionColor(data.longTerm.direction)}`}>
                      {data.longTerm.label}
                    </p>
                    <p className="text-gray-300 text-xs">
                      Objetivo: {data.longTerm.target.toFixed(4)}
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
                    <p className="text-gray-300 text-xs">{data.technicalSummary}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-400">Para Alcistas:</p>
                    <p className="text-green-400 text-xs">{data.bullishScenario}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-400">Escenario Bajista:</p>
                    <p className="text-red-400 text-xs">{data.bearishScenario}</p>
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
