import { useState } from 'react';
import { Sparkles, Loader2, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNewsAIAnalysis, NewsAIAnalysis } from '@/hooks/useNewsAIAnalysis';
import { RealNewsItem } from '@/hooks/useRealNews';
import { useTranslation } from '@/i18n/LanguageContext';

interface NewsAISummaryInlineProps {
  news: RealNewsItem;
}

function CompactSummary({ analysis }: { analysis: NewsAIAnalysis }) {
  const { t } = useTranslation();

  const biasIcon =
    analysis.traderConclusion.bias === 'bullish' ? <TrendingUp className="w-3 h-3 text-green-400" /> :
    analysis.traderConclusion.bias === 'bearish' ? <TrendingDown className="w-3 h-3 text-red-400" /> :
    <Minus className="w-3 h-3 text-muted-foreground" />;

  const biasColor =
    analysis.traderConclusion.bias === 'bullish' ? 'text-green-400' :
    analysis.traderConclusion.bias === 'bearish' ? 'text-red-400' :
    'text-muted-foreground';

  const riskColor =
    analysis.traderConclusion.riskLevel === 'high' ? 'text-red-400' :
    analysis.traderConclusion.riskLevel === 'medium' ? 'text-yellow-400' :
    'text-green-400';

  return (
    <div className="space-y-2">
      {/* AI Summary text */}
      <p className="text-xs text-foreground/80 leading-relaxed line-clamp-2">
        {analysis.aiSummary}
      </p>

      {/* Key bullet points */}
      <div className="space-y-1">
        {analysis.keyPoints.slice(0, 3).map((point, i) => (
          <div
            key={i}
            className={cn(
              'flex items-start gap-1.5 text-[11px]',
              point.importance === 'high' ? 'text-foreground' : 'text-foreground/70'
            )}
          >
            <span className="flex-shrink-0 leading-none mt-0.5">{point.icon}</span>
            <span className="line-clamp-1">{point.text}</span>
          </div>
        ))}
      </div>

      {/* Compact trading meta */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          {biasIcon}
          <span className={cn('text-[10px] font-semibold uppercase', biasColor)}>
            {analysis.traderConclusion.bias}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Target className="w-3 h-3 text-muted-foreground" />
          <span className={cn('text-[10px] font-medium', riskColor)}>
            {t('news_detail_risk')}: {analysis.traderConclusion.riskLevel}
          </span>
        </div>
        {analysis.traderConclusion.recommendedPairs.length > 0 && (
          <div className="flex items-center gap-1">
            {analysis.traderConclusion.recommendedPairs.slice(0, 2).map((pair) => (
              <span
                key={pair}
                className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-medium"
              >
                {pair}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function NewsAISummaryInline({ news }: NewsAISummaryInlineProps) {
  const [expanded, setExpanded] = useState(false);
  const { data: analysis, isLoading, error } = useNewsAIAnalysis(expanded ? news : null);

  if (!expanded) {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setExpanded(true);
        }}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg w-full',
          'bg-primary/5 border border-primary/20 hover:bg-primary/10 hover:border-primary/30',
          'transition-all duration-200 group'
        )}
      >
        <Sparkles className="w-3 h-3 text-primary" />
        <span className="text-[11px] font-medium text-primary">{t('news_ai_trading_summary')}</span>
        <ChevronDown className="w-3 h-3 text-primary/60 ml-auto group-hover:translate-y-0.5 transition-transform" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg border overflow-hidden transition-all duration-300',
        'bg-gradient-to-br from-primary/5 to-primary/[0.02] border-primary/20'
      )}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      {/* Header */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setExpanded(false);
        }}
        className="flex items-center gap-1.5 px-2.5 py-1.5 w-full hover:bg-primary/5 transition-colors"
      >
        <Sparkles className="w-3 h-3 text-primary" />
        <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">{t('news_ai_trading_summary')}</span>
        <ChevronUp className="w-3 h-3 text-primary/60 ml-auto" />
      </button>

      {/* Content */}
      <div className="px-2.5 pb-2.5">
        {isLoading ? (
          <div className="flex items-center gap-2 py-3">
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground">Analyzing for trading insights...</span>
          </div>
        ) : error ? (
          <p className="text-xs text-muted-foreground py-2">AI analysis unavailable</p>
        ) : analysis ? (
          <CompactSummary analysis={analysis} />
        ) : null}
      </div>
    </div>
  );
}
