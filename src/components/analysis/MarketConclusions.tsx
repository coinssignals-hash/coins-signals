import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface MarketConclusionsProps {
  symbol: string;
  resistance: number;
  support: number;
}

export function MarketConclusions({ symbol, resistance, support }: MarketConclusionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full bg-[#0a1a0a] border border-green-900/50 rounded-lg p-4 flex items-center justify-between hover:bg-green-900/10 transition-colors">
        <h3 className="text-white font-semibold">Conclusiones y Dirección Esperada Del Mercado</h3>
        <ChevronDown className={`w-5 h-5 text-green-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="bg-[#0a1a0a] border border-t-0 border-green-900/50 rounded-b-lg p-4 -mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Market Direction */}
            <div className="space-y-4">
              <h4 className="text-white font-semibold border-b border-green-900/50 pb-2">
                Dirección Esperada del Mercado
              </h4>
              
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-400">Muy Corto Plazo (1-2 días):</p>
                  <p className="text-blue-400 font-semibold">REBOTE TÉCNICO PROBABLE</p>
                  <p className="text-gray-300 text-xs">Probabilidad: 60-65% | Objetivo: {(resistance - 0.002).toFixed(4)}</p>
                </div>
                
                <div>
                  <p className="text-gray-400">Corto Plazo (1-2 semanas):</p>
                  <p className="text-yellow-400 font-semibold">CONSOLIDACIÓN EN RANGO</p>
                  <p className="text-gray-300 text-xs">Probabilidad: 45-55% | Rango: {support.toFixed(4)}-{resistance.toFixed(4)}</p>
                </div>
                
                <div>
                  <p className="text-gray-400">Medio Plazo (1-3 meses):</p>
                  <p className="text-green-400 font-semibold">SESGO ALCISTA</p>
                  <p className="text-gray-300 text-xs">Objetivo: {(resistance + 0.010).toFixed(4)}</p>
                </div>
                
                <div>
                  <p className="text-gray-400">Largo Plazo (6-12 meses):</p>
                  <p className="text-yellow-400 font-semibold">NEUTRAL CON RIESGOS BIDIRECCIONALES</p>
                  <p className="text-gray-300 text-xs">Rango: {(support - 0.05).toFixed(2)}-{(resistance + 0.08).toFixed(2)} | Objetivo Central: {((support + resistance) / 2).toFixed(2)}</p>
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
                  <p className="text-gray-300 text-xs">
                    Indicadores técnicos muestran señales mixtas con predominio bajista a corto plazo pero condiciones de sobreventa que podrían generar rebote
                  </p>
                </div>
                
                <div>
                  <p className="text-gray-400">Punto Técnico Identificado:</p>
                  <p className="text-yellow-400 font-semibold">CONSOLIDACIÓN EN RANGO</p>
                  <p className="text-gray-300 text-xs">Consolidación después de ruptura alcista</p>
                </div>
                
                <div>
                  <p className="text-gray-400">Para Alcistas:</p>
                  <p className="text-gray-300 text-xs">Confirmación por encima de {resistance.toFixed(4)} abriría camino a {(resistance + 0.006).toFixed(4)} y luego {(resistance + 0.012).toFixed(4)}</p>
                </div>
                
                <div>
                  <p className="text-gray-400">Escenario Bajista:</p>
                  <p className="text-gray-300 text-xs">Fallo en mantener {support.toFixed(4)} y ruptura por debajo de {(support - 0.005).toFixed(4)} apuntaría a {(support - 0.012).toFixed(4)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
