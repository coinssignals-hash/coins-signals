import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface StrategicRecommendationsProps {
  symbol: string;
  currentPrice: number;
  support: number;
  resistance: number;
}

export function StrategicRecommendations({ 
  symbol, 
  currentPrice, 
  support, 
  resistance 
}: StrategicRecommendationsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full bg-[#0a1a0a] border border-green-900/50 rounded-lg p-4 flex items-center justify-between hover:bg-green-900/10 transition-colors">
        <h3 className="text-white font-semibold">Recomendaciones Estratégicas</h3>
        <ChevronDown className={`w-5 h-5 text-green-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="bg-[#0a1a0a] border border-t-0 border-green-900/50 rounded-b-lg p-4 -mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Long Term Traders */}
            <div className="space-y-3">
              <h4 className="text-white font-semibold border-b border-green-900/50 pb-2">
                Para Traders de Largo Plazo
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-green-400 font-semibold">Estrategia:</span>
                  <p className="text-gray-300">Operar el rango {support.toFixed(4)}-{resistance.toFixed(4)} con stops ajustados</p>
                </div>
                <div>
                  <span className="text-green-400 font-semibold">Entrada:</span>
                  <p className="text-gray-300">Zona de compra {(support - 0.002).toFixed(4)}-{support.toFixed(4)} (soporte de 100-day SMA)</p>
                </div>
                <div>
                  <span className="text-green-400 font-semibold">Stop Loss:</span>
                  <p className="text-gray-300">Por debajo de {(support - 0.007).toFixed(4)} (Fibonacci 61.8%)</p>
                </div>
                <div>
                  <span className="text-green-400 font-semibold">Objetivo 1:</span>
                  <p className="text-gray-300">{resistance.toFixed(4)} (resistencia Fibonacci 23.6%)</p>
                </div>
                <div>
                  <span className="text-green-400 font-semibold">Objetivo 2:</span>
                  <p className="text-gray-300">{(resistance + 0.012).toFixed(4)} (resistencias mayores)</p>
                </div>
                <div>
                  <span className="text-green-400 font-semibold">Horizonte:</span>
                  <p className="text-gray-300">2-3 meses</p>
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
                  <p className="text-gray-300">Operar el rango {support.toFixed(4)}-{resistance.toFixed(4)} con stops ajustados</p>
                </div>
                <div>
                  <span className="text-green-400 font-semibold">Compra:</span>
                  <p className="text-gray-300">En retrocesos hacia {support.toFixed(4)}-{(support + 0.001).toFixed(4)} con stop loss por debajo de {(support - 0.001).toFixed(4)}</p>
                </div>
                <div>
                  <span className="text-green-400 font-semibold">Venta:</span>
                  <p className="text-gray-300">En aproximación a {(resistance - 0.001).toFixed(4)}-{resistance.toFixed(4)} con stop loss por encima de {(resistance + 0.001).toFixed(4)}</p>
                </div>
                <div>
                  <span className="text-green-400 font-semibold">Horario Óptimo:</span>
                  <p className="text-gray-300">Overlap Europa-América (13:00-17:00 GMT) para máxima volatilidad</p>
                </div>
                <div>
                  <span className="text-green-400 font-semibold">Vigilar:</span>
                  <p className="text-gray-300">Ruptura sostenida de {resistance.toFixed(4)} (alcista) o {support.toFixed(4)} (bajista/trading de tendencia)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
