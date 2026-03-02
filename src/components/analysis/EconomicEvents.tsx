import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Loader2, Clock, Calendar } from 'lucide-react';
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
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'Moderado':
      case 'Moderate':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'Bajo':
      case 'Low':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      default:
        return 'text-muted-foreground bg-muted/30 border-muted/20';
    }
  };

  const getImpactDot = (impact: string) => {
    switch (impact) {
      case 'Alto':
      case 'High':
        return 'bg-red-400';
      case 'Moderado':
      case 'Moderate':
        return 'bg-yellow-400';
      case 'Bajo':
      case 'Low':
        return 'bg-green-400';
      default:
        return 'bg-muted-foreground';
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="rounded-xl overflow-hidden border border-cyan-800/30">
      <CollapsibleTrigger className="w-full bg-slate-800/60 px-4 py-3 flex items-center justify-between hover:bg-slate-700/60 transition-colors">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <h3 className="text-white font-semibold text-sm">{t('analysis_economic_events')}</h3>
          {events && events.length > 0 && (
            <span className="text-xs bg-cyan-400/10 text-cyan-400 px-2 py-0.5 rounded-full">{events.length}</span>
          )}
        </div>
        <ChevronDown className={`w-5 h-5 text-cyan-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="p-3 sm:p-4 border-t border-cyan-800/30">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
              <span className="ml-2 text-gray-400">{t('analysis_loading_events')}</span>
            </div>
          ) : error ? (
            <AnalysisError 
              title={t('analysis_economic_events')}
              error={error as Error}
              compact
            />
          ) : events && events.length > 0 ? (
            <div className="space-y-2">
              {/* Desktop table header */}
              <div className="hidden sm:grid grid-cols-12 gap-2 px-3 py-2 text-xs text-gray-400 font-semibold border-b border-slate-700/30">
                <div className="col-span-1">{t('analysis_time')}</div>
                <div className="col-span-3">{t('analysis_events')}</div>
                <div className="col-span-3">{t('analysis_description')}</div>
                <div className="col-span-2">{t('analysis_impact')}</div>
                <div className="col-span-3">{t('analysis_results')}</div>
              </div>

              {/* Desktop rows */}
              <div className="hidden sm:block space-y-0.5">
                {events.map((event, index) => (
                  <div 
                    key={index} 
                    className="grid grid-cols-12 gap-2 px-3 py-2 text-xs hover:bg-slate-800/40 rounded-md transition-colors"
                  >
                    <div className="col-span-1 text-white font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-400/60" />
                      {event.time}
                    </div>
                    <div className="col-span-3 text-gray-300 font-medium">{event.event}</div>
                    <div className="col-span-3 text-gray-400">{event.description}</div>
                    <div className="col-span-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs ${getImpactColor(event.impact)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${getImpactDot(event.impact)}`} />
                        {event.impact}
                      </span>
                    </div>
                    <div className="col-span-3 text-gray-300 text-xs">{event.result || '-'}</div>
                  </div>
                ))}
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden space-y-2">
                {events.map((event, index) => (
                  <div key={index} className="bg-slate-800/40 rounded-lg p-3 space-y-2 border border-slate-700/20">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-mono text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400/60" />
                        {event.time} UTC
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs ${getImpactColor(event.impact)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${getImpactDot(event.impact)}`} />
                        {event.impact}
                      </span>
                    </div>
                    <div className="text-gray-200 text-sm font-medium leading-tight">{event.event}</div>
                    <div className="text-gray-400 text-xs">{event.description}</div>
                    {event.result && event.result !== '-' && (
                      <div className="text-cyan-300 text-xs bg-cyan-400/5 rounded px-2 py-1 font-mono">
                        {event.result}
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
