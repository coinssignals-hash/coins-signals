import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useEconomicEvents, EconomicEvent } from '@/hooks/useAnalysisData';
import { AnalysisError } from './AnalysisError';
import { useTranslation } from '@/i18n/LanguageContext';

interface EconomicEventsProps {
  symbol: string;
  date: Date;
}

export function EconomicEvents({ symbol, date }: EconomicEventsProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { data: events, isLoading, error } = useEconomicEvents(symbol, date);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'Alto':
      case 'High':
        return 'text-red-400 bg-red-400/10';
      case 'Moderado':
      case 'Moderate':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'Bajo':
      case 'Low':
        return 'text-green-400 bg-green-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="rounded-xl overflow-hidden border-2 border-green-500/30">
      <CollapsibleTrigger className="w-full bg-[#0d1f0d] px-4 py-3 flex items-center justify-between hover:bg-[#122212] transition-colors">
        <h3 className="text-white font-semibold text-sm">{t('analysis_economic_events')}</h3>
        <ChevronDown className={`w-5 h-5 text-green-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="bg-[#0a1a0a] p-4 border-t border-green-500/20">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-green-400 animate-spin" />
              <span className="ml-2 text-gray-400">{t('analysis_loading_events')}</span>
            </div>
          ) : error ? (
            <AnalysisError 
              title={t('analysis_economic_events')}
              error={error as Error}
              compact
            />
          ) : events && events.length > 0 ? (
            <div className="border border-green-900/30 rounded-lg overflow-hidden">
              <div className="bg-green-900/20 p-2">
                <h4 className="text-green-400 font-semibold text-sm">{t('analysis_economic_events')}</h4>
              </div>
              
              <div className="grid grid-cols-12 gap-2 p-2 border-b border-green-900/30 text-xs text-gray-400 font-semibold">
                <div className="col-span-1">{t('analysis_time')}</div>
                <div className="col-span-3">{t('analysis_events')}</div>
                <div className="col-span-3">{t('analysis_description')}</div>
                <div className="col-span-2">{t('analysis_impact')}</div>
                <div className="col-span-3">{t('analysis_results')}</div>
              </div>
              
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
          ) : (
            <div className="text-gray-400 text-sm py-4">
              {t('analysis_no_events')}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
