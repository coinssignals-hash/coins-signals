import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Loader2, Newspaper, Database } from 'lucide-react';
import { useState } from 'react';
import { useMonetaryPolicies } from '@/hooks/useAnalysisData';
import { AnalysisError } from './AnalysisError';
import { useTranslation } from '@/i18n/LanguageContext';
import { Badge } from '@/components/ui/badge';

interface MonetaryPoliciesProps {
  symbol: string;
}

export function MonetaryPolicies({ symbol }: MonetaryPoliciesProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { data: policies, isLoading, error } = useMonetaryPolicies(symbol);

  const totalSources = policies?.reduce((acc, p) => {
    const s = p.sources;
    return acc + (s ? s.finnhub + s.fmp + s.marketaux + s.alphaVantage : 0);
  }, 0) || 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="rounded-xl overflow-hidden border border-border/50">
      <CollapsibleTrigger className="w-full bg-card/80 px-4 py-3 flex items-center justify-between hover:bg-muted/60 transition-colors">
        <div className="flex items-center gap-2">
          <h3 className="text-foreground font-semibold text-sm">{t('analysis_monetary_policies')}</h3>
          {totalSources > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              <Database className="w-3 h-3 mr-0.5" />{totalSources} {t('analysis_mp_sources')}
            </Badge>
          )}
        </div>
        <ChevronDown className={`w-5 h-5 text-primary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="p-4 border-t border-border/50">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <span className="ml-2 text-muted-foreground">{t('analysis_loading_policies')}</span>
            </div>
          ) : error || !policies ? (
            <AnalysisError 
              title={t('analysis_monetary_policies')}
              error={error as Error}
              compact
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {policies.map((policy, index) => (
                <div key={index} className="space-y-3 border border-border/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs">{policy.currency}</span>
                      {policy.sources && (
                        <div className="flex gap-1">
                          {policy.sources.finnhub > 0 && <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">FH:{policy.sources.finnhub}</Badge>}
                          {policy.sources.fmp > 0 && <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">FMP:{policy.sources.fmp}</Badge>}
                          {policy.sources.marketaux > 0 && <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">MX:{policy.sources.marketaux}</Badge>}
                          {policy.sources.alphaVantage > 0 && <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">AV:{policy.sources.alphaVantage}</Badge>}
                        </div>
                      )}
                    </div>
                  </div>
                  <h4 className="text-primary font-semibold">{policy.centralBank}</h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('analysis_current_rate')}:</span>
                      <span className="text-primary">{policy.currentRate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('analysis_last_decision')}:</span>
                      <span className="text-primary text-xs">{policy.lastDecision}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('analysis_next_meeting')}:</span>
                      <span className="text-primary">{policy.nextMeeting}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('analysis_expectations')}:</span>
                      <span className="text-primary text-xs">{policy.expectations}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('analysis_end_year_rate')}:</span>
                      <span className="text-foreground">{policy.endYearRate}</span>
                    </div>
                  </div>

                  {/* Recent Headlines */}
                  {policy.recentHeadlines && policy.recentHeadlines.length > 0 && (
                    <div className="pt-2 border-t border-border/30 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Newspaper className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{t('analysis_mp_recent_news')}</span>
                      </div>
                      {policy.recentHeadlines.map((headline, i) => (
                        <div key={i} className="text-xs">
                          <p className="text-foreground/80 leading-tight">{headline.title}</p>
                          <span className="text-[10px] text-muted-foreground">{headline.source}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
