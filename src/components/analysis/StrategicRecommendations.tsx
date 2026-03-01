import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Loader2 } from 'lucide-react';
import { useStrategicRecommendations } from '@/hooks/useAnalysisData';
import { AnalysisError } from './AnalysisError';
import { useTranslation } from '@/i18n/LanguageContext';

interface StrategicRecommendationsProps {
  symbol: string;
  currentPrice: number;
  realtimePrice?: number;
  isRealtimeConnected?: boolean;
}

export function StrategicRecommendations({ symbol, currentPrice }: StrategicRecommendationsProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { data, isLoading, error } = useStrategicRecommendations(symbol, currentPrice);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="rounded-xl overflow-hidden border border-cyan-800/30">
      <CollapsibleTrigger className="w-full bg-slate-800/60 px-4 py-3 flex items-center justify-between hover:bg-slate-700/60 transition-colors">
        <h3 className="text-white font-semibold text-sm">{t('analysis_strategic_recommendations')}</h3>
        <ChevronDown className={`w-5 h-5 text-cyan-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="p-4 border-t border-cyan-800/30">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
              <span className="ml-2 text-gray-400">{t('analysis_loading_recommendations')}</span>
            </div>
          ) : error || !data ? (
            <AnalysisError 
              title={t('analysis_strategic_recommendations')}
              error={error as Error}
              compact
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-white font-semibold border-b border-slate-700/50 pb-2">
                  {t('analysis_long_term_traders')}
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-cyan-400 font-semibold">{t('analysis_strategy_label')}:</span>
                    <p className="text-gray-300">{data.longTerm.strategy}</p>
                  </div>
                  <div>
                    <span className="text-cyan-400 font-semibold">{t('analysis_entry_label')}:</span>
                    <p className="text-gray-300">{data.longTerm.entry}</p>
                  </div>
                  <div>
                    <span className="text-cyan-400 font-semibold">Stop Loss:</span>
                    <p className="text-gray-300">{data.longTerm.stopLoss}</p>
                  </div>
                  <div>
                    <span className="text-cyan-400 font-semibold">{t('analysis_target_1')}:</span>
                    <p className="text-gray-300">{data.longTerm.takeProfit1}</p>
                  </div>
                  {data.longTerm.takeProfit2 && (
                    <div>
                      <span className="text-cyan-400 font-semibold">{t('analysis_target_2')}:</span>
                      <p className="text-gray-300">{data.longTerm.takeProfit2}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-cyan-400 font-semibold">{t('analysis_horizon')}:</span>
                    <p className="text-gray-300">{data.longTerm.horizon}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-white font-semibold border-b border-slate-700/50 pb-2">
                  {t('analysis_short_term_traders')}
                  <span className="text-gray-400 text-xs ml-2">(Day/Swing Traders)</span>
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-cyan-400 font-semibold">{t('analysis_strategy_label')}:</span>
                    <p className="text-gray-300">{data.shortTerm.strategy}</p>
                  </div>
                  <div>
                    <span className="text-cyan-400 font-semibold">{t('analysis_entry_label')}:</span>
                    <p className="text-gray-300">{data.shortTerm.entry}</p>
                  </div>
                  <div>
                    <span className="text-cyan-400 font-semibold">Stop Loss:</span>
                    <p className="text-gray-300">{data.shortTerm.stopLoss}</p>
                  </div>
                  <div>
                    <span className="text-cyan-400 font-semibold">{t('analysis_target_1')}:</span>
                    <p className="text-gray-300">{data.shortTerm.takeProfit1}</p>
                  </div>
                  {data.shortTerm.takeProfit2 && (
                    <div>
                      <span className="text-cyan-400 font-semibold">{t('analysis_target_2')}:</span>
                      <p className="text-gray-300">{data.shortTerm.takeProfit2}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-cyan-400 font-semibold">{t('analysis_horizon')}:</span>
                    <p className="text-gray-300">{data.shortTerm.horizon}</p>
                  </div>
                  {data.shortTerm.notes && data.shortTerm.notes.length > 0 && (
                    <div>
                      <span className="text-cyan-400 font-semibold">{t('analysis_watch')}:</span>
                      <ul className="text-gray-300 list-disc list-inside">
                        {data.shortTerm.notes.map((note: string, i: number) => (
                          <li key={i}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
