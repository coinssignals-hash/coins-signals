import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useMonetaryPolicies } from '@/hooks/useAnalysisData';
import { AnalysisError } from './AnalysisError';

interface MonetaryPoliciesProps {
  symbol: string;
}

export function MonetaryPolicies({ symbol }: MonetaryPoliciesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: policies, isLoading, error } = useMonetaryPolicies(symbol);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="rounded-xl overflow-hidden border-2 border-green-500/30">
      <CollapsibleTrigger className="w-full bg-[#0d1f0d] px-4 py-3 flex items-center justify-between hover:bg-[#122212] transition-colors">
        <h3 className="text-white font-semibold text-sm">Políticas Monetarias</h3>
        <ChevronDown className={`w-5 h-5 text-green-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="bg-[#0a1a0a] p-4 border-t border-green-500/20">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-green-400 animate-spin" />
              <span className="ml-2 text-gray-400">Cargando políticas...</span>
            </div>
          ) : error || !policies ? (
            <AnalysisError 
              title="Políticas Monetarias"
              error={error as Error}
              compact
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {policies.map((policy, index) => (
                <div key={index} className="space-y-3 border border-green-900/30 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs">{policy.currency}</span>
                  </div>
                  <h4 className="text-blue-400 font-semibold">{policy.centralBank}</h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tasa Actual:</span>
                      <span className="text-green-400">{policy.currentRate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Última Decisión:</span>
                      <span className="text-green-400 text-xs">{policy.lastDecision}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Próxima Reunión:</span>
                      <span className="text-green-400">{policy.nextMeeting}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Expectativas:</span>
                      <span className="text-green-400 text-xs">{policy.expectations}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tasa Fin 2025:</span>
                      <span className="text-white">{policy.endYearRate}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
