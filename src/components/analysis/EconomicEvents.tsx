import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface EconomicEvent {
  time: string;
  event: string;
  description: string;
  impact: 'Alto' | 'Moderado' | 'Bajo';
  result?: string;
}

interface EconomicEventsProps {
  events?: EconomicEvent[];
}

const mockEvents: EconomicEvent[] = [
  {
    time: '09:00',
    event: 'Datos finales de inflación de la Eurozona (Septiembre 2025)',
    description: 'CPI final y/y: 2.2%, CPI core y/y: 2.4%',
    impact: 'Alto',
    result: 'En línea con expectativas. Inflación cercana al objetivo del 2% del ECB, con inflación core ligeramente por encima en 2.4%'
  },
  {
    time: '10:00',
    event: 'Reuniones anuales FMI/Banco Mundial',
    description: 'Evento multi-día con participación global, incluyendo representantes de EE.UU. y Eurozona',
    impact: 'Moderado',
    result: 'En línea con expectativas. Inflación cercana al objetivo del 2% del ECB, con inflación core ligeramente por encima en 2.4%'
  },
  {
    time: '14:30',
    event: 'Ventas minoristas de EE.UU.',
    description: 'Datos mensuales de consumo del sector retail',
    impact: 'Alto',
    result: 'Pendiente'
  },
  {
    time: '16:00',
    event: 'Discurso del presidente de la Fed',
    description: 'Comentarios sobre política monetaria y perspectivas económicas',
    impact: 'Alto',
    result: 'Pendiente'
  }
];

export function EconomicEvents({ events = mockEvents }: EconomicEventsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'Alto':
        return 'text-red-400 bg-red-400/10';
      case 'Moderado':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'Bajo':
        return 'text-green-400 bg-green-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full bg-[#0a1a0a] border border-green-900/50 rounded-lg p-4 flex items-center justify-between hover:bg-green-900/10 transition-colors">
        <h3 className="text-white font-semibold">Eventos Económicos Del Día</h3>
        <ChevronDown className={`w-5 h-5 text-green-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="bg-[#0a1a0a] border border-t-0 border-green-900/50 rounded-b-lg p-4 -mt-2">
          <div className="border border-green-900/30 rounded-lg overflow-hidden">
            <div className="bg-green-900/20 p-2">
              <h4 className="text-green-400 font-semibold text-sm">Eventos Económicos del Día</h4>
            </div>
            
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 p-2 border-b border-green-900/30 text-xs text-gray-400 font-semibold">
              <div className="col-span-1">Hora</div>
              <div className="col-span-3">Eventos</div>
              <div className="col-span-3">Descripción</div>
              <div className="col-span-2">Impacto</div>
              <div className="col-span-3">Resultados</div>
            </div>
            
            {/* Events */}
            {events.map((event, index) => (
              <div 
                key={index} 
                className="grid grid-cols-12 gap-2 p-2 border-b border-green-900/20 text-xs hover:bg-green-900/10"
              >
                <div className="col-span-1 text-white font-mono">{event.time}</div>
                <div className="col-span-3 text-gray-300">{event.event}</div>
                <div className="col-span-3 text-gray-400">{event.description}</div>
                <div className="col-span-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${getImpactColor(event.impact)}`}>
                    {event.impact}
                  </span>
                </div>
                <div className="col-span-3 text-gray-300 text-xs">{event.result || '-'}</div>
              </div>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
