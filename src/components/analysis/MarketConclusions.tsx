import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Loader2 } from 'lucide-react';
import { useMarketConclusions } from '@/hooks/useAnalysisData';
import { AnalysisError } from './AnalysisError';
import { useTranslation } from '@/i18n/LanguageContext';
import { formatPrice } from '@/lib/utils';

interface MarketConclusionsProps {
  symbol: string;
  currentPrice: number;
  realtimePrice?: number;
  isRealtimeConnected?: boolean;
}

export function MarketConclusions({ symbol, currentPrice }: MarketConclusionsProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { data, isLoading, error } = useMarketConclusions(symbol, currentPrice);

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'bullish': return 'text-green-400';
      case 'bearish': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="rounded-xl overflow-hidden border border-cyan-800/30">
      <CollapsibleTrigger className="w-full bg-slate-800/60 px-4 py-3 flex items-center justify-between hover:bg-slate-700/60 transition-colors">
        <h3 className="text-white font-semibold text-sm">{t('analysis_conclusions')}</h3>
        <ChevronDown className={`w-5 h-5 text-cyan-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="p-4 border-t border-cyan-800/30">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
              <span className="ml-2 text-gray-400">{t('analysis_loading_conclusions')}</span>
            </div>
          ) : error || !data ? (
            <AnalysisError 
              title={t('analysis_conclusions')}
              error={error as Error}
              compact
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-white font-semibold border-b border-slate-700/50 pb-2">
                  {t('analysis_expected_direction')}
                </h4>
                
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-400">{t('analysis_very_short_term')}:</p>
                    <p className={`font-semibold ${getDirectionColor(data.shortTerm.direction)}`}>
                      {data.shortTerm.label}
                    </p>
                    <p className="text-gray-300 text-xs">
                      {t('analysis_probability_label')}: {data.shortTerm.probability}% | {t('analysis_target_label')}: {formatPrice(data.shortTerm.target, symbol)}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-gray-400">{t('analysis_short_term')}:</p>
                    <p className={`font-semibold ${getDirectionColor(data.mediumTerm.direction)}`}>
                      {data.mediumTerm.label}
                    </p>
                    <p className="text-gray-300 text-xs">
                      {t('analysis_probability_label')}: {data.mediumTerm.probability}% | {t('analysis_range_label')}: {formatPrice(data.mediumTerm.range.min, symbol)}-{formatPrice(data.mediumTerm.range.max, symbol)}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-gray-400">{t('analysis_medium_term')}:</p>
                    <p className={`font-semibold ${getDirectionColor(data.longTerm.direction)}`}>
                      {data.longTerm.label}
                    </p>
                    <p className="text-gray-300 text-xs">
                      {t('analysis_target_label')}: {formatPrice(data.longTerm.target, symbol)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-white font-semibold border-b border-slate-700/50 pb-2">
                  {t('analysis_detailed_technical')}
                </h4>
                
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-400">{t('analysis_technical_summary')}:</p>
                    <p className="text-gray-300 text-xs">{data.technicalSummary}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-400">{t('analysis_for_bulls')}:</p>
                    <p className="text-green-400 text-xs">{data.bullishScenario}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-400">{t('analysis_bearish_scenario')}:</p>
                    <p className="text-red-400 text-xs">{data.bearishScenario}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
