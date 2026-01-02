import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { DateTabs } from '@/components/news/DateTabs';
import { CurrencyFilter } from '@/components/news/CurrencyFilter';
import { useNewsByDate, useRefreshNews } from '@/hooks/useNews';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Filter, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Currency, CURRENCIES, NewsListItem } from '@/types/news';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

// Generate mock historical data for a news item
function generateHistoricalData() {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
  return months.map(month => ({
    month,
    impact: Math.round((Math.random() - 0.5) * 60) // -30 to +30
  }));
}

// Mini historical chart component
function MiniHistoricalChart({ data }: { data: { month: string; impact: number }[] }) {
  const maxAbsValue = Math.max(...data.map(d => Math.abs(d.impact)));
  
  return (
    <div className="flex items-end gap-0.5 h-8">
      {data.map((point, i) => {
        const height = maxAbsValue > 0 ? (Math.abs(point.impact) / maxAbsValue) * 100 : 0;
        const isPositive = point.impact >= 0;
        
        return (
          <div
            key={i}
            className="flex flex-col items-center justify-end flex-1"
          >
            <div
              className={cn(
                'w-full rounded-t-sm transition-all',
                isPositive ? 'bg-green-500' : 'bg-red-500'
              )}
              style={{ height: `${Math.max(height, 10)}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}

// Historical impact section for cards
function HistoricalImpactSection({ newsId }: { newsId: string }) {
  const historicalData = useMemo(() => generateHistoricalData(), [newsId]);
  const avgImpact = historicalData.reduce((sum, d) => sum + d.impact, 0) / historicalData.length;
  const isPositiveAvg = avgImpact >= 0;
  
  return (
    <div className="mt-3 pt-3 border-t border-border/30">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          Impacto Histórico
        </span>
        <span className={cn(
          'text-xs font-bold',
          isPositiveAvg ? 'text-green-400' : 'text-red-400'
        )}>
          Promedio: {isPositiveAvg ? '+' : ''}{avgImpact.toFixed(1)}%
        </span>
      </div>
      <MiniHistoricalChart data={historicalData} />
      <div className="flex justify-between mt-1">
        {historicalData.map((point, i) => (
          <span key={i} className="text-[9px] text-muted-foreground/70 flex-1 text-center">
            {point.month}
          </span>
        ))}
      </div>
    </div>
  );
}

// Currency pills for quick filter
const QUICK_CURRENCIES: Currency[] = ['EUR', 'USD', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'];

// Impact badge component
function ImpactBadge({ currency, impact }: { currency: Currency; impact: number }) {
  const isPositive = impact >= 0;
  const info = CURRENCIES[currency];
  
  return (
    <div className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
      isPositive 
        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
        : 'bg-red-500/20 text-red-400 border border-red-500/30'
    )}>
      <span className="text-sm">{info.flag}</span>
      <span className="font-mono">{currency}</span>
      <span className="font-bold">
        {isPositive ? '+' : ''}{impact.toFixed(1)}%
      </span>
    </div>
  );
}

// Modern news card component matching the reference design
function ModernNewsCard({ news, index }: { news: NewsListItem; index: number }) {
  // Generate random impact values for demo (in production, this would come from the API)
  const impacts = useMemo(() => {
    return news.affected_currencies.slice(0, 2).map(currency => ({
      currency,
      impact: (Math.random() - 0.5) * 40 // Random between -20% and +20%
    }));
  }, [news.affected_currencies]);

  return (
    <Link
      to={`/news/${news.id}`}
      className={cn(
        'group flex gap-3 p-3 rounded-xl bg-card/50 border border-border/50',
        'hover:bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
        'transition-all duration-300 animate-fade-in'
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Thumbnail */}
      {news.image_url && (
        <div className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden">
          <img
            src={news.image_url}
            alt={news.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>
      )}
      
      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        {/* Title */}
        <h3 className="font-semibold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-tight">
          {news.title}
        </h3>
        
        {/* Source and Date */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          <span className="font-medium text-foreground/70">{news.source}</span>
          <span className="text-border">•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {news.time_ago}
          </span>
        </div>
        
        {/* Currency Impacts */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {impacts.map(({ currency, impact }) => (
            <ImpactBadge key={currency} currency={currency} impact={impact} />
          ))}
        </div>
        {/* Historical Impact */}
        <HistoricalImpactSection newsId={news.id} />
      </div>
    </Link>
  );
}

// Featured news card for top story
function FeaturedCard({ news }: { news: NewsListItem }) {
  const impacts = useMemo(() => {
    return news.affected_currencies.slice(0, 3).map(currency => ({
      currency,
      impact: (Math.random() - 0.5) * 40
    }));
  }, [news.affected_currencies]);

  return (
    <Link
      to={`/news/${news.id}`}
      className={cn(
        'group block rounded-2xl overflow-hidden bg-gradient-to-br from-card to-card/50',
        'border border-border/50 hover:border-primary/40',
        'transition-all duration-500 hover:shadow-xl hover:shadow-primary/10',
        'animate-fade-in'
      )}
    >
      {/* Image Section */}
      <div className="relative aspect-[16/9] overflow-hidden">
        {news.image_url && (
          <img
            src={news.image_url}
            alt={news.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        
        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 rounded-full bg-primary/90 text-primary-foreground text-xs font-semibold backdrop-blur-sm">
            🔥 Top News
          </span>
        </div>
        
        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
          <h2 className="text-lg md:text-xl font-bold text-white line-clamp-2 group-hover:text-primary transition-colors">
            {news.title}
          </h2>
          
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <span className="font-medium">{news.source}</span>
              <span>•</span>
              <span>{news.time_ago}</span>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              {impacts.map(({ currency, impact }) => (
                <ImpactBadge key={currency} currency={currency} impact={impact} />
              ))}
            </div>
          </div>
          
          {/* Historical Impact Mini Chart */}
          <div className="absolute bottom-3 right-3 w-24 bg-black/60 backdrop-blur-sm rounded-lg p-2">
            <MiniHistoricalChart data={generateHistoricalData()} />
          </div>
        </div>
      </div>
    </Link>
  );
}

// Currency quick filter pills
function QuickCurrencyFilter({ 
  selected, 
  onChange 
}: { 
  selected: Currency[]; 
  onChange: (currencies: Currency[]) => void;
}) {
  const toggleCurrency = (currency: Currency) => {
    if (selected.includes(currency)) {
      onChange(selected.filter(c => c !== currency));
    } else {
      onChange([...selected, currency]);
    }
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {QUICK_CURRENCIES.map(currency => {
        const info = CURRENCIES[currency];
        const isSelected = selected.includes(currency);
        
        return (
          <button
            key={currency}
            onClick={() => toggleCurrency(currency)}
            className={cn(
              'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium',
              'border transition-all duration-200',
              isSelected
                ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30'
                : 'bg-card/50 border-border/50 text-muted-foreground hover:border-primary/50 hover:text-foreground'
            )}
          >
            <span className="text-base">{info.flag}</span>
            <span className="font-mono">{currency}</span>
          </button>
        );
      })}
    </div>
  );
}

const News = () => {
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
    <div className="min-h-screen bg-black pb-20 md:pb-0">
      <Header />
      
      <main className="container py-4 space-y-4 max-w-2xl mx-auto">
        {/* Date Tabs */}
        <DateTabs
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
        
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-foreground">Principales Noticias</h1>
            {selectedCurrencies.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                {filteredNews.length}
              </span>
            )}
          </div>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium',
              'border transition-all',
              filtersOpen
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-card/50 border-border/50 text-muted-foreground hover:text-foreground'
            )}
          >
            <Filter className="w-4 h-4" />
            <span>Monedas</span>
            {selectedCurrencies.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {selectedCurrencies.length}
              </span>
            )}
          </button>
        </div>
        
        {/* Quick Currency Filter */}
        <QuickCurrencyFilter
          selected={selectedCurrencies}
          onChange={setSelectedCurrencies}
        />
        
        {/* Advanced Filters */}
        {filtersOpen && (
          <div className="p-4 rounded-xl bg-card/50 border border-border/50 animate-fade-in">
            <CurrencyFilter
              selected={selectedCurrencies}
              onChange={setSelectedCurrencies}
            />
          </div>
        )}
        
        {/* Last Updated */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>Última actualización: {lastUpdated}</span>
        </div>
        
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-2xl" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-6 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Error State */}
        {error && (
          <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl bg-red-500/10 border border-red-500/30">
            <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
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
              <div className="space-y-4">
                {/* Featured News */}
                {featuredNews && <FeaturedCard news={featuredNews} />}
                
                {/* Top News Label */}
                {otherNews.length > 0 && (
                  <div className="flex items-center gap-2 pt-2">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      <span>📰</span>
                      <span>Top News</span>
                    </div>
                    <div className="flex-1 h-px bg-border/50" />
                  </div>
                )}
                
                {/* News List */}
                <div className="space-y-3">
                  {otherNews.map((newsItem, index) => (
                    <ModernNewsCard key={newsItem.id} news={newsItem} index={index} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
      
      <BottomNav />
    </div>
  );
};

export default News;
