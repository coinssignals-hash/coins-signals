import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface NewsEvent {
  type: 'positive' | 'negative';
  currency: string;
  title: string;
  description: string;
  source?: string;
}

interface MajorNewsProps {
  events?: NewsEvent[];
}

const mockEvents: NewsEvent[] = [
  {
    type: 'positive',
    currency: 'EUR',
    title: 'Estabilidad política en la Eurozona',
    description: 'El Primer Ministro Sébastien Lecornu sobrevivió a dos votos consecutivos de no confianza, reduciendo el riesgo político en la segunda economía más grande de la Eurozona y aliviando tensiones políticas regionales',
    source: 'Fed mantiene perspectiva dovish'
  },
  {
    type: 'negative',
    currency: 'USD',
    title: 'Presión sobre el dólar',
    description: 'Los funcionarios de la Fed Christopher Waller y Stephen Miran pidieron más recortes de tasas para apoyar el mercado laboral, añadiendo presión al dólar. Los mercados esperan al menos dos recortes de 25 puntos básicos antes de fin de año.',
    source: 'Crisis en sector bancario regional de EE.UU.'
  },
  {
    type: 'negative',
    currency: 'USD',
    title: 'Preocupaciones bancarias',
    description: 'Crecientes preocupaciones sobre prácticas de préstamos poco saludables en bancos regionales de EE.UU., particularmente problemas en Zions Bancorporation y Western Alliance Bancorp, elevaron riesgos de contagio en el mercado crediticio.',
    source: 'Cierre del gobierno de EE.UU. continúa'
  }
];

export function MajorNews({ events = mockEvents }: MajorNewsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="rounded-xl overflow-hidden border-2 border-green-500/30">
      <CollapsibleTrigger className="w-full bg-[#0d1f0d] px-4 py-3 flex items-center justify-between hover:bg-[#122212] transition-colors">
        <h3 className="text-white font-semibold text-sm">Principales Noticias De Mayor Impacto</h3>
        <ChevronDown className={`w-5 h-5 text-green-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="bg-[#0a1a0a] p-4 border-t border-green-500/20">
          <h4 className="text-white font-semibold mb-4">Eventos Destacados</h4>
          
          <div className="space-y-4">
            {events.map((event, index) => (
              <div key={index} className="space-y-2">
                <p className={`font-bold ${event.type === 'positive' ? 'text-green-400' : 'text-red-400'}`}>
                  {event.type === 'positive' ? 'POSITIVO' : 'NEGATIVO'} PARA {event.currency}:
                </p>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {event.description}
                </p>
                {event.source && (
                  <p className="text-yellow-400 text-xs">{event.source}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
