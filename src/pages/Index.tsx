import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { DateTabs } from '@/components/news/DateTabs';
import { NewsCard } from '@/components/news/NewsCard';
import { useNewsByDate, useRefreshNews } from '@/hooks/useNews';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const Index = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const { data: news, isLoading, error, dataUpdatedAt } = useNewsByDate(selectedDate);
  const { mutate: refreshNews, isPending: isRefreshing } = useRefreshNews();
  
  const handleRefresh = () => {
    refreshNews();
  };
  
  const featuredNews = news?.[0];
  const otherNews = news?.slice(1) || [];
  
  const lastUpdated = dataUpdatedAt 
    ? formatDistanceToNow(dataUpdatedAt, { addSuffix: true, locale: es })
    : 'hace unos momentos';
  
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      <main className="container py-4 space-y-6">
        {/* Date Tabs */}
        <DateTabs
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
        
        {/* Section Title */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Principales Noticias</h1>
          <span className="text-xs text-muted-foreground">
            Última actualización: {lastUpdated}
          </span>
        </div>
        
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-xl" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-48 w-full rounded-xl" />
              ))}
            </div>
          </div>
        )}
        
        {/* Error State */}
        {error && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Error al cargar noticias</h2>
            <p className="text-muted-foreground text-sm mb-4">
              {error instanceof Error ? error.message : 'Error desconocido'}
            </p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}
        
        {/* News Content */}
        {!isLoading && !error && news && (
          <>
            {news.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">No hay noticias para esta fecha</p>
              </div>
            ) : (
              <>
                {/* Featured News */}
                {featuredNews && <NewsCard news={featuredNews} variant="featured" />}
                
                {/* News Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
                  {otherNews.map((newsItem) => (
                    <NewsCard key={newsItem.id} news={newsItem} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>
      
      <BottomNav />
    </div>
  );
};

export default Index;
