import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useMajorNews, MajorNewsEvent } from '@/hooks/useAnalysisData';
import { AnalysisError } from './AnalysisError';
import { useTranslation } from '@/i18n/LanguageContext';

interface MajorNewsProps {
  symbol: string;
}

export function MajorNews({ symbol }: MajorNewsProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { data: events, isLoading, error } = useMajorNews(symbol);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="rounded-xl overflow-hidden border-2 border-green-500/30">
      <CollapsibleTrigger className="w-full bg-[#0d1f0d] px-4 py-3 flex items-center justify-between hover:bg-[#122212] transition-colors">
        <h3 className="text-white font-semibold text-sm">{t('analysis_major_news')}</h3>
        <ChevronDown className={`w-5 h-5 text-green-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="bg-[#0a1a0a] p-4 border-t border-green-500/20">
          <h4 className="text-white font-semibold mb-4">{t('analysis_featured_events')}</h4>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-green-400 animate-spin" />
              <span className="ml-2 text-gray-400">{t('analysis_loading_news')}</span>
            </div>
          ) : error ? (
            <AnalysisError 
              title={t('analysis_major_news')}
              error={error as Error}
              compact
            />
          ) : events && events.length > 0 ? (
            <div className="space-y-4">
              {events.map((event, index) => (
                <div key={index} className="space-y-2">
                  <p className={`font-bold ${event.type === 'positive' ? 'text-green-400' : 'text-red-400'}`}>
                    {event.type === 'positive' ? t('analysis_positive_for') : t('analysis_negative_for')} {event.currency}:
                  </p>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {event.description}
                  </p>
                  {event.source && (
                    <p className="text-yellow-400 text-xs">{t('analysis_source')}: {event.source}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 text-sm py-4">
              {t('analysis_no_impact_news')}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
