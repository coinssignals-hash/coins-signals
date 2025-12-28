import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { DateTabs } from '@/components/news/DateTabs';
import { NewsCard } from '@/components/news/NewsCard';
import { CurrencyFilter } from '@/components/news/CurrencyFilter';
import { useNewsByDate, useRefreshNews } from '@/hooks/useNews';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Filter, ChevronDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Currency } from '@/types/news';

const Index = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCurrencies, setSelectedCurrencies] = useState<Currency[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  const { data: news, isLoading, error, dataUpdatedAt } = useNewsByDate(selectedDate);
  const { mutate: refreshNews, isPending: isRefreshing } = useRefreshNews();
  
  // Filter news by selected currencies
  const filteredNews = useMemo(() => {
    if (!news) return [];
    if (selectedCurrencies.length === 0) return news;
    
    return news.filter((item) =>
      item.affected_currencies.some((currency) =>
        selectedCurrencies.includes(currency)
      )
    );
  }, [news, selectedCurrencies]);
  
  const handleRefresh = () => {
    refreshNews();
  };
  
  const featuredNews = filteredNews[0];
  const otherNews = filteredNews.slice(1);
  
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
        
        {/* Currency Filters */}
        <div className="space-y-3">
          <button 
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full justify-between p-3 rounded-lg bg-card border border-border"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span>Filtros</span>
              {selectedCurrencies.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                  {selectedCurrencies.length}
                </span>
              )}
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${filtersOpen ? 'rotate-180' : ''}`} />
          </button>
          {filtersOpen && (
            <div className="p-4 rounded-lg bg-card border border-border animate-fade-in">
              <CurrencyFilter
                selected={selectedCurrencies}
                onChange={setSelectedCurrencies}
              />
            </div>
          )}
        </div>
        
        {/* Section Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">Principales Noticias</h1>
            {selectedCurrencies.length > 0 && (
              <span className="text-sm text-muted-foreground">
                ({filteredNews.length} resultados)
              </span>
            )}
          </div>
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
        {!isLoading && !error && (
          <>
            {filteredNews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">
                  {selectedCurrencies.length > 0
                    ? 'No hay noticias para las divisas seleccionadas'
                    : 'No hay noticias para esta fecha'}
                </p>
                {selectedCurrencies.length > 0 && (
                  <button
                    onClick={() => setSelectedCurrencies([])}
                    className="mt-3 text-sm text-primary hover:text-primary/80"
                  >
                    Limpiar filtros
                  </button>
                )}
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
