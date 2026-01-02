import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { CategoryBadge } from '@/components/news/CategoryBadge';
import { CurrencyBadgeList } from '@/components/news/CurrencyBadge';
import { BiasBadge } from '@/components/news/BiasBadge';
import { useRealNews, RealNewsItem } from '@/hooks/useRealNews';
import { useNewsAIAnalysis } from '@/hooks/useNewsAIAnalysis';
import { ArrowLeft, Clock, ExternalLink, TrendingUp, TrendingDown, Minus, Sparkles, Target, AlertTriangle, Timer, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { useMemo } from 'react';
import { EconomicCategory } from '@/types/news';

const NewsDetail = () => {
  const { id } = useParams<{ id: string }>();
  
  // Fetch all news and find the one matching the ID
  const { data: allNews, isLoading, error, refetch } = useRealNews(undefined, undefined, 100);
  
  const news = useMemo(() => {
    if (!allNews || !id) return null;
    return allNews.find((item: RealNewsItem) => item.id === id) || null;
  }, [allNews, id]);

  // Fetch AI analysis for the news
  const { data: aiAnalysis, isLoading: isLoadingAI, error: aiError } = useNewsAIAnalysis(news);

  // Get recent news to show as suggestions when news not found
  // These are guaranteed to be fresh from the current API response
  const recentNews = useMemo(() => {
    if (news || !allNews) return [];
    // Return latest 6 news items (they're already fresh from the API)
    return allNews.slice(0, 6);
  }, [news, allNews]);
  
  // Map sentiment to bias format
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
    if (horizon === 'short_term') return 'Corto Plazo';
    if (horizon === 'medium_term') return 'Mediano Plazo';
    return 'Largo Plazo';
  };

  const getImportanceColor = (importance: string) => {
    if (importance === 'high') return 'border-l-red-500 bg-red-500/5';
    if (importance === 'medium') return 'border-l-yellow-500 bg-yellow-500/5';
    return 'border-l-green-500 bg-green-500/5';
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Header />
        <main className="container py-4 space-y-6 max-w-4xl">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }
  
  if (error || !news) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Header />
        <main className="container py-4 space-y-6 max-w-4xl">
          {/* Error message */}
          <div className="p-6 rounded-xl bg-card border border-border text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              {error ? 'Error al cargar la noticia' : 'Noticia no disponible'}
            </h2>
            <p className="text-muted-foreground text-sm">
              {error instanceof Error 
                ? error.message 
                : 'Esta noticia ya no está en el feed. Aquí tienes las noticias más recientes.'}
            </p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => refetch()} 
              className="text-primary hover:text-primary/80"
            >
              <Loader2 className="w-3 h-3 mr-1" />
              Actualizar noticias
            </Button>
          </div>

          {/* Related/Recent news suggestions */}
          {recentNews.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Noticias Recientes
              </h3>
              <div className="space-y-3">
                {recentNews.map((item) => (
                  <Link 
                    key={item.id} 
                    to={`/news/${item.id}`}
                    className="flex gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-all group"
                  >
                    {item.image_url && (
                      <img 
                        src={item.image_url} 
                        alt="" 
                        className="w-16 h-16 rounded-md object-cover flex-shrink-0"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
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
                      <div className="flex flex-wrap gap-1">
                        {item.affected_currencies.slice(0, 3).map((currency) => (
                          <span 
                            key={currency}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary font-medium"
                          >
                            {currency}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex flex-col gap-2">
            <Link to="/news">
              <Button className="w-full gap-2">
                <ArrowLeft className="w-4 h-4" />
                Ver todas las noticias
              </Button>
            </Link>
            <Link to="/">
              <Button variant="ghost" className="w-full text-muted-foreground">
                Ir al inicio
              </Button>
            </Link>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      <main className="container py-4 space-y-6 max-w-4xl">
        {/* Back button */}
        <Link to="/news" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Volver a noticias</span>
        </Link>
        
        {/* Hero Image */}
        {news.image_url && (
          <div className="relative aspect-video rounded-xl overflow-hidden">
            <img src={news.image_url} alt={news.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </div>
        )}
        
        {/* Header */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge category={news.category as EconomicCategory} />
            <BiasBadge 
              bias={aiAnalysis?.traderConclusion.bias || getBiasFromSentiment(news.sentiment)} 
              strength={aiAnalysis?.traderConclusion.biasStrength || 'moderate'} 
            />
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{news.title}</h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {news.source_logo && (
              <img 
                src={news.source_logo} 
                alt={news.source} 
                className="w-5 h-5 rounded object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            )}
            <span className="font-medium text-foreground">{news.source}</span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {news.time_ago}
            </span>
          </div>
          
          <CurrencyBadgeList currencies={news.affected_currencies} size="md" />
        </div>

        {/* AI Analysis Section */}
        {isLoadingAI ? (
          <div className="p-6 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 space-y-4">
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <span className="text-sm font-medium text-primary">Analizando con IA...</span>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        ) : aiAnalysis ? (
          <>
            {/* AI Summary */}
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">Análisis IA</h2>
              </div>
              <p className="text-foreground leading-relaxed">{aiAnalysis.aiSummary}</p>
            </div>

            {/* Key Points */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Puntos Clave</h2>
              <div className="space-y-2">
                {aiAnalysis.keyPoints.map((point, i) => (
                  <div 
                    key={i} 
                    className={`flex items-start gap-3 p-3 rounded-lg border-l-4 ${getImportanceColor(point.importance)}`}
                  >
                    <span className="text-lg flex-shrink-0">{point.icon}</span>
                    <span className="text-foreground">{point.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trader Conclusion */}
            <div className="p-4 rounded-lg bg-secondary/50 border border-primary/20 space-y-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">Conclusión para Traders</h2>
              </div>
              
              <p className="text-foreground">{aiAnalysis.traderConclusion.summary}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-2 rounded bg-background/50">
                  <div className="text-xs text-muted-foreground mb-1">Riesgo</div>
                  <div className="flex items-center gap-1.5">
                    {getRiskIcon(aiAnalysis.traderConclusion.riskLevel)}
                    <span className="text-sm font-medium capitalize">
                      {aiAnalysis.traderConclusion.riskLevel === 'high' ? 'Alto' : 
                       aiAnalysis.traderConclusion.riskLevel === 'medium' ? 'Medio' : 'Bajo'}
                    </span>
                  </div>
                </div>
                <div className="p-2 rounded bg-background/50">
                  <div className="text-xs text-muted-foreground mb-1">Horizonte</div>
                  <div className="flex items-center gap-1.5">
                    <Timer className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">
                      {getTimeHorizonLabel(aiAnalysis.traderConclusion.timeHorizon)}
                    </span>
                  </div>
                </div>
                <div className="p-2 rounded bg-background/50 col-span-2 md:col-span-1">
                  <div className="text-xs text-muted-foreground mb-1">Sesgo</div>
                  <div className="flex items-center gap-1.5">
                    {getSentimentIcon(aiAnalysis.traderConclusion.bias)}
                    <span className="text-sm font-medium capitalize">
                      {aiAnalysis.traderConclusion.bias === 'bullish' ? 'Alcista' :
                       aiAnalysis.traderConclusion.bias === 'bearish' ? 'Bajista' : 'Neutral'}
                      {' '}({aiAnalysis.traderConclusion.biasStrength === 'strong' ? 'Fuerte' :
                             aiAnalysis.traderConclusion.biasStrength === 'moderate' ? 'Moderado' : 'Débil'})
                    </span>
                  </div>
                </div>
              </div>

              {aiAnalysis.traderConclusion.recommendedPairs.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-2">Pares Recomendados</div>
                  <div className="flex flex-wrap gap-2">
                    {aiAnalysis.traderConclusion.recommendedPairs.map((pair) => (
                      <span 
                        key={pair} 
                        className="px-2 py-1 rounded bg-primary/10 text-primary text-sm font-medium"
                      >
                        {pair}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Market Impact & Strategy */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-card border border-border space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Impacto en Mercado</h3>
                <p className="text-foreground text-sm">{aiAnalysis.marketImpact}</p>
              </div>
              <div className="p-4 rounded-lg bg-card border border-border space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Estrategia Sugerida</h3>
                <p className="text-foreground text-sm">{aiAnalysis.tradingStrategy}</p>
              </div>
            </div>
          </>
        ) : (
          /* Fallback to basic summary if AI analysis fails */
          <div className="p-4 rounded-lg bg-card border border-border space-y-3">
            <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">Resumen</h2>
            <p className="text-foreground leading-relaxed">{news.summary}</p>
            {aiError && (
              <p className="text-xs text-muted-foreground">
                El análisis IA no está disponible en este momento.
              </p>
            )}
          </div>
        )}
        
        {/* Affected Currencies Detail */}
        {news.affected_currencies.length > 0 && (
          <div className="p-4 rounded-lg bg-card border border-border space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Divisas Afectadas</h2>
            <div className="flex flex-wrap gap-2">
              {news.affected_currencies.map((currency) => (
                <span 
                  key={currency} 
                  className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium"
                >
                  {currency}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Relevance Score */}
        <div className="p-4 rounded-lg bg-card border border-border space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Relevancia</h2>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-primary transition-all"
                style={{ width: `${news.relevance_score * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium text-foreground">
              {Math.round(news.relevance_score * 100)}%
            </span>
          </div>
        </div>
        
        {/* Source Link */}
        <a href={news.url} target="_blank" rel="noopener noreferrer" className="block">
          <Button variant="outline" className="w-full gap-2">
            <ExternalLink className="w-4 h-4" />
            Ver artículo completo en {news.source}
          </Button>
        </a>
      </main>
      
      <BottomNav />
    </div>
  );
};

export default NewsDetail;
