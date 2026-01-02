import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { CategoryBadge } from '@/components/news/CategoryBadge';
import { CurrencyBadgeList } from '@/components/news/CurrencyBadge';
import { BiasBadge } from '@/components/news/BiasBadge';
import { useRealNews, RealNewsItem } from '@/hooks/useRealNews';
import { ArrowLeft, Clock, ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { useMemo } from 'react';
import { EconomicCategory } from '@/types/news';

const NewsDetail = () => {
  const { id } = useParams<{ id: string }>();
  
  // Fetch all news and find the one matching the ID
  const { data: allNews, isLoading, error } = useRealNews(undefined, undefined, 100);
  
  const news = useMemo(() => {
    if (!allNews || !id) return null;
    return allNews.find((item: RealNewsItem) => item.id === id) || null;
  }, [allNews, id]);
  
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
        <main className="container py-4 flex flex-col items-center justify-center min-h-[50vh]">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">
            {error ? 'Error al cargar la noticia' : 'Noticia no encontrada'}
          </h2>
          <p className="text-muted-foreground text-sm mb-4">
            {error instanceof Error ? error.message : 'La noticia que buscas no existe o ha expirado'}
          </p>
          <Link to="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Volver a noticias
            </Button>
          </Link>
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
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
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
            <BiasBadge bias={getBiasFromSentiment(news.sentiment)} strength="moderate" />
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
        
        {/* Summary */}
        <div className="p-4 rounded-lg bg-card border border-border space-y-3">
          <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">Resumen</h2>
          <p className="text-foreground leading-relaxed">{news.summary}</p>
        </div>
        
        {/* Sentiment Analysis */}
        <div className="p-4 rounded-lg bg-secondary/50 border border-primary/20 space-y-3">
          <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">Análisis de Sentimiento</h2>
          <div className="flex items-center gap-3">
            {getSentimentIcon(news.sentiment)}
            <div>
              <p className="font-medium text-foreground capitalize">{news.sentiment}</p>
              <p className="text-sm text-muted-foreground">
                {news.sentiment === 'bullish' && 'Esta noticia tiene un sesgo positivo para los mercados'}
                {news.sentiment === 'bearish' && 'Esta noticia tiene un sesgo negativo para los mercados'}
                {news.sentiment === 'neutral' && 'Esta noticia tiene un impacto neutral en los mercados'}
              </p>
            </div>
          </div>
        </div>
        
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
