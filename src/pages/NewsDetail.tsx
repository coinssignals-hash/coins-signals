import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { CategoryBadge } from '@/components/news/CategoryBadge';
import { CurrencyBadgeList } from '@/components/news/CurrencyBadge';
import { BiasBadge } from '@/components/news/BiasBadge';
import { useRealNews, RealNewsItem } from '@/hooks/useRealNews';
import { useNewsAIAnalysis } from '@/hooks/useNewsAIAnalysis';
import { useNewsCache } from '@/hooks/useNewsCache';
import { ArrowLeft, Clock, ExternalLink, TrendingUp, TrendingDown, Minus, Sparkles, Target, AlertTriangle, Timer, Loader2, Archive, Activity, Shield, BarChart3, Zap, ChevronRight } from 'lucide-react';
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
import { cn } from '@/lib/utils';

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
    if (sentiment === 'bullish') return <TrendingUp className="w-5 h-5 text-green-400" />;
    if (sentiment === 'bearish') return <TrendingDown className="w-5 h-5 text-red-400" />;
    return <Minus className="w-5 h-5 text-muted-foreground" />;
  };

  const getRiskIcon = (risk: string) => {
    if (risk === 'high') return <AlertTriangle className="w-4 h-4 text-red-400" />;
    if (risk === 'medium') return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    return <Shield className="w-4 h-4 text-green-400" />;
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

  const getRiskColor = (risk: string) => {
    if (risk === 'high') return 'text-red-400 bg-red-500/10 border-red-500/20';
    if (risk === 'medium') return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    return 'text-green-400 bg-green-500/10 border-green-500/20';
  };

  const getBiasColor = (bias: string) => {
    if (bias === 'bullish') return 'text-green-400 bg-green-500/10 border-green-500/20';
    if (bias === 'bearish') return 'text-red-400 bg-red-500/10 border-red-500/20';
    return 'text-muted-foreground bg-muted/30 border-border';
  };

  const getImportanceColor = (importance: string) => {
    if (importance === 'high') return 'border-l-red-400 bg-red-500/5';
    if (importance === 'medium') return 'border-l-yellow-400 bg-yellow-500/5';
    return 'border-l-emerald-400 bg-emerald-500/5';
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <PageShell>
        <Header />
        <main className="py-4 px-4 space-y-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-56 w-full rounded-2xl" />
          <div className="space-y-3">
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-16 rounded-full" />
              <Skeleton className="h-8 w-16 rounded-full" />
            </div>
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        </main>
      </PageShell>
    );
  }

  // Error / not found with recent news fallback
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
                    className="flex gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/40 transition-all group">
                    {item.image_url ? (
                      <img src={item.image_url} alt="" className="w-20 h-20 rounded-lg object-cover flex-shrink-0" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-6 h-6 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 space-y-1">
                      <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">{item.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.summary}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{item.source}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{item.time_ago}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
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

  const sentimentColor = news.sentiment === 'bullish' ? 'from-green-500/20 via-green-500/5' : news.sentiment === 'bearish' ? 'from-red-500/20 via-red-500/5' : 'from-primary/20 via-primary/5';

  return (
    <PageShell>
      <Header />
      
      <main className="pb-6">
        {/* Cache notice */}
        {isFromCache && (
          <div className="mx-4 mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
            <Archive className="w-4 h-4 flex-shrink-0" />
            <span>{t('news_detail_cached_notice')}</span>
          </div>
        )}
        
        {/* Hero Section */}
        <div className="relative">
          {/* Back button - floating */}
          <div className="absolute top-3 left-3 z-20">
            <Link to="/news" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-md border border-border/50 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t('news_detail_back')}</span>
            </Link>
          </div>

          {/* Image with gradient overlay */}
          {(generatedImageUrl || isGeneratingImage) ? (
            <div className="relative aspect-[16/10] overflow-hidden">
              {isGeneratingImage && !generatedImageUrl ? (
                <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
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
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              
              {/* Floating badges on image */}
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  <CategoryBadge category={news.category as EconomicCategory} />
                  <BiasBadge
                    bias={aiAnalysis?.traderConclusion.bias || getBiasFromSentiment(news.sentiment)}
                    strength={aiAnalysis?.traderConclusion.biasStrength || 'moderate'}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className={cn("relative pt-14 pb-6 px-4 bg-gradient-to-b", sentimentColor, "to-transparent")}>
              <div className="flex flex-wrap gap-1.5">
                <CategoryBadge category={news.category as EconomicCategory} />
                <BiasBadge
                  bias={aiAnalysis?.traderConclusion.bias || getBiasFromSentiment(news.sentiment)}
                  strength={aiAnalysis?.traderConclusion.biasStrength || 'moderate'}
                />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-4 space-y-5 -mt-1">
          {/* Title & Meta */}
          <div className="space-y-3">
            <h1 className="text-xl font-bold text-foreground leading-tight tracking-tight">{news.title}</h1>
            
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {news.source_logo && (
                <img src={news.source_logo} alt={news.source} className="w-4 h-4 rounded object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              )}
              <span className="font-medium text-foreground/80">{news.source}</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {news.time_ago}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {news.affected_currencies.map((currency) => (
                <span key={currency} className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-semibold tracking-wide">
                  {currency}
                </span>
              ))}
            </div>
          </div>

          {/* Summary Card */}
          <div className="relative p-4 rounded-xl bg-card/80 border border-border/60 backdrop-blur-sm">
            <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl bg-primary/60" />
            <p className="text-foreground/90 leading-relaxed text-[15px] pl-3">{news.summary}</p>
          </div>

          {/* AI Analysis Section */}
          {isLoadingAI ? (
            <div className="space-y-4">
              <div className="p-5 rounded-xl bg-gradient-to-br from-primary/8 to-primary/3 border border-primary/15">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  </div>
                  <span className="text-sm font-semibold text-primary">{t('news_detail_analyzing')}</span>
                </div>
                <div className="space-y-2.5">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-3/5" />
                </div>
              </div>
            </div>
          ) : aiAnalysis ? (
            <div className="space-y-4">
              {/* AI Summary */}
              <div className="relative overflow-hidden rounded-xl border border-primary/20">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-primary/3 to-transparent" />
                <div className="relative p-4 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <h2 className="text-sm font-bold text-primary uppercase tracking-widest">{t('news_detail_ai_analysis')}</h2>
                  </div>
                  <p className="text-foreground/90 leading-relaxed text-[15px]">{aiAnalysis.aiSummary}</p>
                </div>
              </div>

              {/* Key Points */}
              <div className="space-y-2.5">
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  {t('news_detail_key_points')}
                </h2>
                <div className="space-y-2">
                  {aiAnalysis.keyPoints.map((point, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-xl border-l-[3px] transition-colors',
                        getImportanceColor(point.importance)
                      )}
                    >
                      <span className="text-base flex-shrink-0 mt-0.5">{point.icon}</span>
                      <span className="text-foreground/90 text-sm leading-relaxed">{point.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trader Conclusion - Premium Card */}
              <div className="relative overflow-hidden rounded-xl border border-primary/20">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/6 via-transparent to-primary/3" />
                <div className="relative p-4 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                      <Target className="w-4 h-4 text-primary" />
                    </div>
                    <h2 className="text-sm font-bold text-primary uppercase tracking-widest">{t('news_detail_trader_conclusion')}</h2>
                  </div>
                  
                  <p className="text-foreground/90 leading-relaxed text-[15px]">{aiAnalysis.traderConclusion.summary}</p>
                  
                  {/* Metrics Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className={cn('p-2.5 rounded-xl border text-center space-y-1', getRiskColor(aiAnalysis.traderConclusion.riskLevel))}>
                      <div className="flex justify-center">{getRiskIcon(aiAnalysis.traderConclusion.riskLevel)}</div>
                      <div className="text-[10px] uppercase tracking-wider opacity-70">{t('news_detail_risk')}</div>
                      <div className="text-xs font-bold">{getRiskLabel(aiAnalysis.traderConclusion.riskLevel)}</div>
                    </div>
                    <div className="p-2.5 rounded-xl border border-primary/15 bg-primary/5 text-center space-y-1">
                      <div className="flex justify-center"><Timer className="w-4 h-4 text-primary" /></div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t('news_detail_horizon')}</div>
                      <div className="text-xs font-bold text-primary">{getTimeHorizonLabel(aiAnalysis.traderConclusion.timeHorizon)}</div>
                    </div>
                    <div className={cn('p-2.5 rounded-xl border text-center space-y-1', getBiasColor(aiAnalysis.traderConclusion.bias))}>
                      <div className="flex justify-center">{getSentimentIcon(aiAnalysis.traderConclusion.bias)}</div>
                      <div className="text-[10px] uppercase tracking-wider opacity-70">{t('news_detail_bias')}</div>
                      <div className="text-xs font-bold">{getBiasLabel(aiAnalysis.traderConclusion.bias)}</div>
                    </div>
                  </div>

                  {/* Bias Strength indicator */}
                  {aiAnalysis.traderConclusion.biasStrength && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{t('news_detail_bias')} strength:</span>
                      <div className="flex gap-0.5">
                        {['weak', 'moderate', 'strong'].map((level) => (
                          <div
                            key={level}
                            className={cn(
                              'w-6 h-1.5 rounded-full transition-colors',
                              ['weak', 'moderate', 'strong'].indexOf(aiAnalysis.traderConclusion.biasStrength) >= ['weak', 'moderate', 'strong'].indexOf(level)
                                ? aiAnalysis.traderConclusion.bias === 'bullish' ? 'bg-green-400' : aiAnalysis.traderConclusion.bias === 'bearish' ? 'bg-red-400' : 'bg-muted-foreground'
                                : 'bg-muted/30'
                            )}
                          />
                        ))}
                      </div>
                      <span className="font-medium text-foreground/70">{getStrengthLabel(aiAnalysis.traderConclusion.biasStrength)}</span>
                    </div>
                  )}

                  {/* Recommended Pairs */}
                  {aiAnalysis.traderConclusion.recommendedPairs.length > 0 && (
                    <div className="pt-2 border-t border-border/40">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{t('news_detail_recommended_pairs')}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {aiAnalysis.traderConclusion.recommendedPairs.map((pair) => (
                          <span key={pair} className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold tracking-wide border border-primary/15">
                            {pair}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Market Impact & Strategy - Side by Side */}
              <div className="grid grid-cols-1 gap-3">
                <div className="relative overflow-hidden p-4 rounded-xl bg-card border border-border/60">
                  <div className="flex items-center gap-2 mb-2.5">
                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('news_detail_market_impact')}</h3>
                  </div>
                  <p className="text-foreground/85 text-sm leading-relaxed">{aiAnalysis.marketImpact}</p>
                </div>
                <div className="relative overflow-hidden p-4 rounded-xl bg-card border border-border/60">
                  <div className="flex items-center gap-2 mb-2.5">
                    <Target className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('news_detail_suggested_strategy')}</h3>
                  </div>
                  <p className="text-foreground/85 text-sm leading-relaxed">{aiAnalysis.tradingStrategy}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-card border border-border/60 space-y-3">
              <h2 className="text-xs font-bold text-primary uppercase tracking-widest">{t('news_detail_summary')}</h2>
              <p className="text-foreground/90 leading-relaxed">{news.summary}</p>
              {aiError && (
                <p className="text-xs text-muted-foreground">{t('news_detail_ai_unavailable')}</p>
              )}
            </div>
          )}
          
          {/* Currency Impact Section */}
          {news.affected_currencies.length > 0 && (
            <CurrencyImpactModal currencies={news.affected_currencies}>
              <div className="p-4 rounded-xl bg-card border border-border/60 space-y-3 cursor-pointer hover:border-primary/40 transition-all group">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-primary" />
                    {t('news_detail_affected_currencies')}
                  </h2>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {news.affected_currencies.map((currency) => (
                    <span key={currency} className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-semibold border border-primary/15 group-hover:border-primary/30 transition-colors">
                      {currency}
                    </span>
                  ))}
                </div>
              </div>
            </CurrencyImpactModal>
          )}

          {news.affected_currencies.length > 0 && (
            <RealtimeCurrencyImpact currencies={news.affected_currencies} />
          )}

          {news.affected_currencies.length > 0 && (
            <CurrencyImpactCharts
              newsId={news.id}
              newsTitle={news.title}
              category={news.category as EconomicCategory}
              currencies={news.affected_currencies}
            />
          )}
          
          {/* Read Full Article */}
          <a href={news.url} target="_blank" rel="noopener noreferrer" className="block">
            <Button variant="outline" className="w-full gap-2 rounded-xl h-11 border-border/60 hover:border-primary/40 hover:bg-primary/5">
              <ExternalLink className="w-4 h-4" />
              {t('news_detail_view_full_article')} {news.source}
            </Button>
          </a>

          {/* Related News */}
          {recentNews.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                {t('news_detail_recent')}
              </h3>
              <div className="space-y-2.5">
                {recentNews.map((item) => (
                  <Link
                    key={item.id}
                    to={`/news/${item.id}`}
                    className="flex gap-3 p-3 rounded-xl bg-card/80 border border-border/50 hover:border-primary/40 hover:bg-card transition-all group"
                  >
                    {item.image_url ? (
                      <img src={item.image_url} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-5 h-5 text-primary/60" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 space-y-1">
                      <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{item.source}</span>
                        <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/50" />
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.time_ago}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0 self-center group-hover:text-primary/60 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </PageShell>
  );
};

export default NewsDetail;
