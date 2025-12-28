import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { CategoryBadge } from '@/components/news/CategoryBadge';
import { CurrencyBadgeList } from '@/components/news/CurrencyBadge';
import { BiasBadge } from '@/components/news/BiasBadge';
import { ImpactChart } from '@/components/news/ImpactChart';
import { HistoricalChart } from '@/components/news/HistoricalChart';
import { useNewsDetail } from '@/hooks/useNews';
import { ArrowLeft, Clock, ExternalLink, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

const NewsDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: news, isLoading, error } = useNewsDetail(id || '');
  
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
            <Skeleton className="h-48 w-full" />
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
            {error instanceof Error ? error.message : 'La noticia que buscas no existe'}
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
            <CategoryBadge category={news.category} />
            <BiasBadge bias={news.trader_conclusion.bias} strength={news.trader_conclusion.bias_strength} />
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{news.title}</h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{news.source}</span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {news.formatted_date}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              {news.reading_time_minutes} min lectura
            </span>
          </div>
          
          <CurrencyBadgeList currencies={news.affected_currencies} size="md" />
        </div>
        
        {/* AI Summary */}
        <div className="p-4 rounded-lg bg-card border border-border space-y-3">
          <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">Resumen IA</h2>
          <p className="text-foreground leading-relaxed whitespace-pre-line">{news.ai_summary}</p>
        </div>
        
        {/* Key Points */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Puntos Clave</h2>
          <ul className="space-y-2">
            {news.key_points.map((point, i) => (
              <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
                <span className="text-lg">{point.icon}</span>
                <span className="text-foreground">{point.text}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Trader Conclusion */}
        <div className="p-4 rounded-lg bg-secondary/50 border border-primary/20 space-y-3">
          <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">Conclusión para Traders</h2>
          <p className="text-foreground">{news.trader_conclusion.summary}</p>
          <div className="flex flex-wrap gap-2">
            {news.trader_conclusion.recommended_pairs.map((pair) => (
              <span key={pair} className="px-2 py-1 rounded bg-primary/10 text-primary text-sm font-medium">{pair}</span>
            ))}
          </div>
        </div>
        
        {/* Impact Chart */}
        <div className="p-4 rounded-lg bg-card border border-border">
          <ImpactChart impacts={news.currency_impacts} />
        </div>
        
        {/* Historical Analysis */}
        <div className="p-4 rounded-lg bg-card border border-border">
          <HistoricalChart analysis={news.historical_analysis} />
        </div>
        
        {/* Source Link */}
        <a href={news.original_url} target="_blank" rel="noopener noreferrer" className="block">
          <Button variant="outline" className="w-full gap-2">
            <ExternalLink className="w-4 h-4" />
            Ver fuente original: {news.source}
          </Button>
        </a>
      </main>
      
      <BottomNav />
    </div>
  );
};

export default NewsDetail;
