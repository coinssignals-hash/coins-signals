import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

export function MonetaryPolicies() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full bg-[#0a1a0a] border border-green-900/50 rounded-lg p-4 flex items-center justify-between hover:bg-green-900/10 transition-colors">
        <h3 className="text-white font-semibold">Políticas Monetarias</h3>
        <ChevronDown className={`w-5 h-5 text-green-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="bg-[#0a1a0a] border border-t-0 border-green-900/50 rounded-b-lg p-4 -mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fed */}
            <div className="space-y-3 border border-green-900/30 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-xs">Fed</span>
              </div>
              <h4 className="text-blue-400 font-semibold">US Federal Reserve</h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Tasa Actual:</span>
                  <span className="text-green-400">4.00% - 4.25%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Última Decisión:</span>
                  <span className="text-green-400">Recorte de 25 pb (Septiembre 2025)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Próxima Reunión:</span>
                  <span className="text-green-400">28-29 Octubre 2025</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Expectativas:</span>
                  <span className="text-green-400 text-xs">Alta probabilidad (cerca de 100%) de recorte de 25 puntos básicos</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tasa Fin 2025:</span>
                  <span className="text-white">3.50% - 3.75%</span>
                </div>
              </div>
            </div>

            {/* ECB */}
            <div className="space-y-3 border border-green-900/30 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-xs">ECB</span>
              </div>
              <h4 className="text-blue-400 font-semibold">EU Banco Central Europeo</h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Tasa Actual:</span>
                  <span className="text-green-400">2.15%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Última Decisión:</span>
                  <span className="text-green-400">Sin cambios (Octubre 2025)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Próxima Reunión:</span>
                  <span className="text-green-400">Diciembre 2025 (estimado)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Expectativas:</span>
                  <span className="text-green-400 text-xs">Probable pausa continua, evaluación de datos</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tasa Fin 2025:</span>
                  <span className="text-white">2.2% (cerca del objetivo 2%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
