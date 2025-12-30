import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useStrategicRecommendations } from '@/hooks/useAnalysisData';

interface StrategicRecommendationsProps {
  symbol: string;
  currentPrice: number;
}

export function StrategicRecommendations({ symbol, currentPrice }: StrategicRecommendationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data, isLoading, error } = useStrategicRecommendations(symbol, currentPrice);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="rounded-xl overflow-hidden border-2 border-green-500/30">
      <CollapsibleTrigger className="w-full bg-[#0d1f0d] px-4 py-3 flex items-center justify-between hover:bg-[#122212] transition-colors">
        <h3 className="text-white font-semibold text-sm">Recomendaciones Estratégicas</h3>
        <ChevronDown className={`w-5 h-5 text-green-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="bg-[#0a1a0a] p-4 border-t border-green-500/20">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-green-400 animate-spin" />
              <span className="ml-2 text-gray-400">Cargando recomendaciones...</span>
            </div>
          ) : error || !data ? (
            <div className="text-red-400 text-sm py-4">
              Error al cargar las recomendaciones.
            </div>
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
                    <p className="text-gray-300">{data.longTerm.strategy}</p>
                  </div>
                  <div>
                    <span className="text-green-400 font-semibold">Entrada:</span>
                    <p className="text-gray-300">{data.longTerm.entry}</p>
                  </div>
                  <div>
                    <span className="text-green-400 font-semibold">Stop Loss:</span>
                    <p className="text-gray-300">{data.longTerm.stopLoss}</p>
                  </div>
                  <div>
                    <span className="text-green-400 font-semibold">Objetivo 1:</span>
                    <p className="text-gray-300">{data.longTerm.takeProfit1}</p>
                  </div>
                  {data.longTerm.takeProfit2 && (
                    <div>
                      <span className="text-green-400 font-semibold">Objetivo 2:</span>
                      <p className="text-gray-300">{data.longTerm.takeProfit2}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-green-400 font-semibold">Horizonte:</span>
                    <p className="text-gray-300">{data.longTerm.horizon}</p>
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
                    <p className="text-gray-300">{data.shortTerm.strategy}</p>
                  </div>
                  <div>
                    <span className="text-green-400 font-semibold">Entrada:</span>
                    <p className="text-gray-300">{data.shortTerm.entry}</p>
                  </div>
                  <div>
                    <span className="text-green-400 font-semibold">Stop Loss:</span>
                    <p className="text-gray-300">{data.shortTerm.stopLoss}</p>
                  </div>
                  <div>
                    <span className="text-green-400 font-semibold">Objetivo 1:</span>
                    <p className="text-gray-300">{data.shortTerm.takeProfit1}</p>
                  </div>
                  {data.shortTerm.takeProfit2 && (
                    <div>
                      <span className="text-green-400 font-semibold">Objetivo 2:</span>
                      <p className="text-gray-300">{data.shortTerm.takeProfit2}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-green-400 font-semibold">Horizonte:</span>
                    <p className="text-gray-300">{data.shortTerm.horizon}</p>
                  </div>
                  {data.shortTerm.notes && data.shortTerm.notes.length > 0 && (
                    <div>
                      <span className="text-green-400 font-semibold">Vigilar:</span>
                      <ul className="text-gray-300 list-disc list-inside">
                        {data.shortTerm.notes.map((note, i) => (
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
