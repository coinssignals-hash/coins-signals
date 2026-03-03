import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { CategoryBadge } from '@/components/news/CategoryBadge';
import { CurrencyBadgeList } from '@/components/news/CurrencyBadge';
import { BiasBadge } from '@/components/news/BiasBadge';
import { useRealNews, RealNewsItem } from '@/hooks/useRealNews';
import { useNewsAIAnalysis } from '@/hooks/useNewsAIAnalysis';
import { useNewsCache } from '@/hooks/useNewsCache';
import { ArrowLeft, Clock, ExternalLink, TrendingUp, TrendingDown, Minus, Sparkles, Target, AlertTriangle, Timer, Loader2, Archive, Activity } from 'lucide-react';
import { CurrencyImpactModal } from '@/components/news/CurrencyImpactModal';
import { CurrencyImpactCharts } from '@/components/news/CurrencyImpactCharts';
import { RealtimeCurrencyImpact } from '@/components/news/RealtimeCurrencyImpact';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { useMemo, useEffect, useState } from 'react';
import { EconomicCategory } from '@/types/news';
import { useTranslation } from '@/i18n/LanguageContext';
import { useNewsImage } from '@/hooks/useNewsImage';

const NewsDetail = () => {
  const { id } = useParams<{id: string;}>();
  const { t } = useTranslation();
  const { cacheNews, getCachedNews } = useNewsCache();
  const [isFromCache, setIsFromCache] = useState(false);

  const { data: allNews, isLoading, error, refetch } = useRealNews(undefined, undefined, 100);

  const news = useMemo(() => {
    if (!id) return null;
    if (allNews) {
      const freshNews = allNews.find((item: RealNewsItem) => item.id === id);
      if (freshNews) {
        setIsFromCache(false);
        return freshNews;
      }
    }
    const cachedNews = getCachedNews(id);
    if (cachedNews) {
      setIsFromCache(true);
      return cachedNews;
    }
    setIsFromCache(false);
    return null;
  }, [allNews, id, getCachedNews]);

  useEffect(() => {
    if (news && !isFromCache) {
      cacheNews(news);
    }
  }, [news, isFromCache, cacheNews]);

  const { imageUrl: generatedImageUrl, isGenerating: isGeneratingImage, handleImageError } = useNewsImage(
    id,
    news?.title,
    news?.category,
    news?.sentiment,
    news?.image_url
  );

  const { data: aiAnalysis, isLoading: isLoadingAI, error: aiError } = useNewsAIAnalysis(news);

  const recentNews = useMemo(() => {
    if (!allNews) return [];
    if (!news) return allNews.slice(0, 8);
    return allNews.filter(item => item.id !== id).slice(0, 6);
  }, [news, allNews, id]);

  const getBiasFromSentiment = (sentiment: string): 'bullish' | 'bearish' | 'neutral' => {
    if (sentiment === 'bullish') return 'bullish';
    if (sentiment === 'bearish') return 'bearish';
    return 'neutral';
  };

  const getSentimentIcon = (sentiment: string) => {
    if (sentiment === 'bullish') return <TrendingUp className="w-5 h-5 text-green-500" />;
    if (sentiment === 'bearish') return <TrendingDown className="w-5 h-5 text-red-500" />;
    return <Minus className="w-5 h-5 text-muted-foreground" />;
  };

  const getRiskIcon = (risk: string) => {
    if (risk === 'high') return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (risk === 'medium') return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return <AlertTriangle className="w-4 h-4 text-green-500" />;
  };

  const getTimeHorizonLabel = (horizon: string) => {
    if (horizon === 'short_term') return t('news_detail_horizon_short');
    if (horizon === 'medium_term') return t('news_detail_horizon_medium');
    return t('news_detail_horizon_long');
  };

  const getRiskLabel = (risk: string) => {
    if (risk === 'high') return t('news_detail_risk_high');
    if (risk === 'medium') return t('news_detail_risk_medium');
    return t('news_detail_risk_low');
  };

  const getBiasLabel = (bias: string) => {
    if (bias === 'bullish') return t('news_detail_bullish');
    if (bias === 'bearish') return t('news_detail_bearish');
    return t('news_detail_neutral');
  };

  const getStrengthLabel = (strength: string) => {
    if (strength === 'strong') return t('news_detail_strong');
    if (strength === 'moderate') return t('news_detail_moderate');
    return t('news_detail_weak');
  };

  const getImportanceColor = (importance: string) => {
    if (importance === 'high') return 'border-l-red-500 bg-red-500/5';
    if (importance === 'medium') return 'border-l-yellow-500 bg-yellow-500/5';
    return 'border-l-green-500 bg-green-500/5';
  };

  if (isLoading) {
    return (
      <PageShell>
        <Header />
        <main className="py-4 px-4 space-y-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        </main>
      </PageShell>);

  }

  if (error || !news) {
    return (
      <PageShell>
        <Header />
        <main className="py-4 px-4 space-y-6">
          <Link to="/news" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">{t('news_detail_back')}</span>
          </Link>

          {recentNews.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                {t('news_detail_recent')}
              </h3>
              <div className="space-y-3">
                {recentNews.map((item) => (
                  <Link
                    key={item.id}
                    to={`/news/${item.id}`}
                    className="flex gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-all group">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt=""
                        className="w-20 h-20 rounded-md object-cover flex-shrink-0"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    ) : (
                      <div className="w-20 h-20 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-6 h-6 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 space-y-1">
                      <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.summary}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{item.source}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.time_ago}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {item.affected_currencies.slice(0, 3).map((currency) => (
                          <span
                            key={currency}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary font-medium">
                            {currency}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 space-y-3">
              <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">{t('news_detail_not_found')}</p>
            </div>
          )}

          <Link to="/news">
            <Button className="w-full gap-2">
              <ArrowLeft className="w-4 h-4" />
              {t('news_detail_view_all')}
            </Button>
          </Link>
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Header />
      
      <main className="py-4 px-4 space-y-6">
        {isFromCache &&
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
            <Archive className="w-4 h-4" />
            <span>{t('news_detail_cached_notice')}</span>
          </div>
        }
        
        <Link to="/news" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">{t('news_detail_back')}</span>
        </Link>
        
        {(generatedImageUrl || isGeneratingImage) && (
          <div className="relative aspect-video rounded-xl overflow-hidden">
            {isGeneratingImage && !generatedImageUrl ? (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                  <p className="text-xs text-muted-foreground">{t('news_detail_generating_image') || 'Generando imagen...'}</p>
                </div>
              </div>
            ) : (
              <img
                src={generatedImageUrl!}
                alt={news.title}
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </div>
        )}
        
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge category={news.category as EconomicCategory} />
            <BiasBadge
              bias={aiAnalysis?.traderConclusion.bias || getBiasFromSentiment(news.sentiment)}
              strength={aiAnalysis?.traderConclusion.biasStrength || 'moderate'} />

          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{news.title}</h1>
          
          <div className="p-5 rounded-lg bg-card border border-border space-y-4">
            <p className="text-foreground leading-relaxed text-base">{news.summary}</p>
            {news.summary.length > 100 && (
              <div className="pt-2 border-t border-border">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {news.summary}
                </p>
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {news.source_logo &&
            <img
              src={news.source_logo}
              alt={news.source}
              className="w-5 h-5 rounded object-contain"
              onError={(e) => {e.currentTarget.style.display = 'none';}} />

            }
            <span className="font-medium text-foreground">{news.source}</span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {news.time_ago}
            </span>
          </div>
          
          <CurrencyBadgeList currencies={news.affected_currencies} size="md" />
        </div>

        {isLoadingAI ?
        <div className="p-6 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 space-y-4">
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <span className="text-sm font-medium text-primary">{t('news_detail_analyzing')}</span>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div> :
        aiAnalysis ?
        <>
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">{t('news_detail_ai_analysis')}</h2>
              </div>
              <p className="text-foreground leading-relaxed">{aiAnalysis.aiSummary}</p>
            </div>

            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t('news_detail_key_points')}</h2>
              <div className="space-y-2">
                {aiAnalysis.keyPoints.map((point, i) =>
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-lg border-l-4 ${getImportanceColor(point.importance)}`}>

                    <span className="text-lg flex-shrink-0">{point.icon}</span>
                    <span className="text-foreground">{point.text}</span>
                  </div>
              )}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-secondary/50 border border-primary/20 space-y-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">{t('news_detail_trader_conclusion')}</h2>
              </div>
              
              <p className="text-foreground">{aiAnalysis.traderConclusion.summary}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-2 rounded bg-background/50">
                  <div className="text-xs text-muted-foreground mb-1">{t('news_detail_risk')}</div>
                  <div className="flex items-center gap-1.5">
                    {getRiskIcon(aiAnalysis.traderConclusion.riskLevel)}
                    <span className="text-sm font-medium capitalize">
                      {getRiskLabel(aiAnalysis.traderConclusion.riskLevel)}
                    </span>
                  </div>
                </div>
                <div className="p-2 rounded bg-background/50">
                  <div className="text-xs text-muted-foreground mb-1">{t('news_detail_horizon')}</div>
                  <div className="flex items-center gap-1.5">
                    <Timer className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">
                      {getTimeHorizonLabel(aiAnalysis.traderConclusion.timeHorizon)}
                    </span>
                  </div>
                </div>
                <div className="p-2 rounded bg-background/50 col-span-2 md:col-span-1">
                  <div className="text-xs text-muted-foreground mb-1">{t('news_detail_bias')}</div>
                  <div className="flex items-center gap-1.5">
                    {getSentimentIcon(aiAnalysis.traderConclusion.bias)}
                    <span className="text-sm font-medium capitalize">
                      {getBiasLabel(aiAnalysis.traderConclusion.bias)}
                      {' '}({getStrengthLabel(aiAnalysis.traderConclusion.biasStrength)})
                    </span>
                  </div>
                </div>
              </div>

              {aiAnalysis.traderConclusion.recommendedPairs.length > 0 &&
            <div>
                  <div className="text-xs text-muted-foreground mb-2">{t('news_detail_recommended_pairs')}</div>
                  <div className="flex flex-wrap gap-2">
                    {aiAnalysis.traderConclusion.recommendedPairs.map((pair) =>
                <span
                  key={pair}
                  className="px-2 py-1 rounded bg-primary/10 text-primary text-sm font-medium">

                        {pair}
                      </span>
                )}
                  </div>
                </div>
            }
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-card border border-border space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t('news_detail_market_impact')}</h3>
                <p className="text-foreground text-sm">{aiAnalysis.marketImpact}</p>
              </div>
              <div className="p-4 rounded-lg bg-card border border-border space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t('news_detail_suggested_strategy')}</h3>
                <p className="text-foreground text-sm">{aiAnalysis.tradingStrategy}</p>
              </div>
            </div>
          </> :

        <div className="p-4 rounded-lg bg-card border border-border space-y-3">
            <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">{t('news_detail_summary')}</h2>
            <p className="text-foreground leading-relaxed">{news.summary}</p>
            {aiError &&
          <p className="text-xs text-muted-foreground">
                {t('news_detail_ai_unavailable')}
              </p>
          }
          </div>
        }
        
        {news.affected_currencies.length > 0 &&
        <CurrencyImpactModal currencies={news.affected_currencies}>
            <div className="p-4 rounded-lg bg-card border border-border space-y-3 cursor-pointer hover:border-primary/50 transition-colors group">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t('news_detail_affected_currencies')}</h2>
                <span className="flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  <Activity className="w-3 h-3" />
                  {t('news_detail_live_impact')}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {news.affected_currencies.map((currency) =>
              <span
                key={currency}
                className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium">

                    {currency}
                  </span>
              )}
              </div>
            </div>
          </CurrencyImpactModal>
        }

        {news.affected_currencies.length > 0 &&
        <RealtimeCurrencyImpact currencies={news.affected_currencies} />
        }

        {news.affected_currencies.length > 0 &&
        <CurrencyImpactCharts
          newsId={news.id}
          newsTitle={news.title}
          category={news.category as EconomicCategory}
          currencies={news.affected_currencies} />

        }

        













        
        <a href={news.url} target="_blank" rel="noopener noreferrer" className="block">
          <Button variant="outline" className="w-full gap-2">
            <ExternalLink className="w-4 h-4" />
            {t('news_detail_view_full_article')} {news.source}
          </Button>
        </a>

        {recentNews.length > 0 && (
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              {t('news_detail_recent')}
            </h3>
            <div className="space-y-3">
              {recentNews.map((item) => (
                <Link
                  key={item.id}
                  to={`/news/${item.id}`}
                  className="flex gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-all group">
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt=""
                      className="w-16 h-16 rounded-md object-cover flex-shrink-0"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  )}
                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{item.source}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.time_ago}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </PageShell>);

};

export default NewsDetail;