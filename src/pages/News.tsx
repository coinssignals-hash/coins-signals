import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { DateTabs } from '@/components/news/DateTabs';
import { CurrencyFilter } from '@/components/news/CurrencyFilter';
import { useRealNewsByDate, RealNewsItem } from '@/hooks/useRealNews';
import { useNewsHistoricalImpactCached, MonthlyImpact } from '@/hooks/useNewsHistoricalImpact';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Filter, Clock, TrendingUp, TrendingDown, Minus, ExternalLink, Rss, ArrowUpDown, Zap, BarChart3 } from 'lucide-react';
import { NewsAISummaryInline } from '@/components/news/NewsAISummaryInline';
import { formatDistanceToNow } from 'date-fns';
import { es, enUS, ptBR, fr } from 'date-fns/locale';
import { useTranslation } from '@/i18n/LanguageContext';
import { Currency, CURRENCIES, EconomicCategory } from '@/types/news';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

// Use RealNewsItem as NewsListItem for compatibility
type NewsListItem = RealNewsItem;

// Mini historical chart component with real data and tooltips
function MiniHistoricalChart({ data, isLoading }: {data: MonthlyImpact[];isLoading?: boolean;}) {
  if (isLoading) {
    return (
      <div className="flex items-end gap-0.5 h-8">
        {[1, 2, 3, 4, 5, 6].map((i) =>
        <div key={i} className="flex-1 h-full bg-muted/30 rounded-t-sm animate-pulse" />
        )}
      </div>);

  }

  const maxAbsValue = Math.max(...data.map((d) => Math.abs(d.impact)), 1);

  return (
    <div className="flex items-end gap-0.5 h-8">
      {data.map((point, i) => {
        const height = Math.abs(point.impact) / maxAbsValue * 100;
        const isPositive = point.impact >= 0;
        const confidencePercent = Math.round((point.confidence || 0.7) * 100);

        return (
          <div
            key={i}
            className="flex flex-col items-center justify-end flex-1 group relative cursor-pointer">

            {/* Tooltip */}
            <div className={cn(
              'absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50',
              'opacity-0 group-hover:opacity-100 pointer-events-none',
              'transition-all duration-200 scale-90 group-hover:scale-100'
            )}>
              <div className={cn(
                'px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap',
                'bg-popover border border-border shadow-xl',
                'flex flex-col items-center gap-0.5'
              )}>
                <span className="font-semibold text-foreground">{point.month}</span>
                <span className={cn(
                  'font-bold text-sm',
                  isPositive ? 'text-green-400' : 'text-red-400'
                )}>
                  {isPositive ? '+' : ''}{point.impact}%
                </span>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <span className="text-[10px]">Confianza:</span>
                  <span className={cn(
                    'text-[10px] font-medium',
                    confidencePercent >= 80 ? 'text-green-400' :
                    confidencePercent >= 60 ? 'text-yellow-400' : 'text-red-400'
                  )}>
                    {confidencePercent}%
                  </span>
                </div>
              </div>
              {/* Arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-popover" />
              </div>
            </div>
            
            {/* Bar */}
            <div
              className={cn(
                'w-full rounded-t-sm transition-all duration-200',
                isPositive ? 'bg-green-500' : 'bg-red-500',
                'group-hover:scale-110 group-hover:shadow-lg',
                isPositive ? 'group-hover:shadow-green-500/30' : 'group-hover:shadow-red-500/30'
              )}
              style={{
                height: `${Math.max(height, 10)}%`,
                opacity: 0.5 + (point.confidence || 0.7) * 0.5
              }} />

          </div>);

      })}
    </div>);

}

// Historical impact section for cards with real data
function HistoricalImpactSection({
  newsId,
  title,
  category,
  currencies





}: {newsId: string;title: string;category: EconomicCategory;currencies: Currency[];}) {
  const { data, isLoading } = useNewsHistoricalImpactCached(newsId, title, category, currencies);

  const avgImpact = data?.averageImpact ?? 0;
  const isPositiveAvg = avgImpact >= 0;
  const trend = data?.trend ?? 'neutral';

  const TrendIcon = trend === 'bullish' ? TrendingUp : trend === 'bearish' ? TrendingDown : Minus;

  return (
    <div className="mt-3 pt-3 border-t border-border/30">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            Historical Impact
          </span>
          <TrendIcon className={cn(
            'w-3 h-3',
            trend === 'bullish' ? 'text-green-400' : trend === 'bearish' ? 'text-red-400' : 'text-muted-foreground'
          )} />
        </div>
        <span className={cn(
          'text-xs font-bold',
          isLoading ? 'text-muted-foreground' : isPositiveAvg ? 'text-green-400' : 'text-red-400'
        )}>
          {isLoading ? '...' : `Promedio: ${isPositiveAvg ? '+' : ''}${avgImpact.toFixed(1)}%`}
        </span>
      </div>
      <MiniHistoricalChart data={data?.monthlyData ?? []} isLoading={isLoading} />
      {!isLoading && data?.monthlyData &&
      <div className="flex justify-between mt-1">
          {data.monthlyData.map((point, i) =>
        <span key={i} className="text-[9px] text-muted-foreground/70 flex-1 text-center">
              {point.month}
            </span>
        )}
        </div>
      }
    </div>);

}

// Mini chart for featured card
function FeaturedHistoricalChart({
  newsId,
  title,
  category,
  currencies





}: {newsId: string;title: string;category: EconomicCategory;currencies: Currency[];}) {
  const { data, isLoading } = useNewsHistoricalImpactCached(newsId, title, category, currencies);

  return (
    <div className="absolute bottom-3 right-3 w-24 bg-black/60 backdrop-blur-sm rounded-lg p-2">
      <MiniHistoricalChart data={data?.monthlyData ?? []} isLoading={isLoading} />
    </div>);

}

// Currency pills for quick filter
const QUICK_CURRENCIES: Currency[] = ['EUR', 'USD', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'];

// Impact badge component
function ImpactBadge({ currency, impact }: {currency: Currency;impact: number;}) {
  const isPositive = impact >= 0;
  const info = CURRENCIES[currency];

  return (
    <div className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
      isPositive ?
      'bg-green-500/20 text-green-400 border border-green-500/30' :
      'bg-red-500/20 text-red-400 border border-red-500/30'
    )}>
      <span className="text-sm">{info.flag}</span>
      <span className="font-mono">{currency}</span>
      <span className="font-bold">
        {isPositive ? '+' : ''}{impact.toFixed(1)}%
      </span>
    </div>);

}

// Modern news card component matching the reference design
function ModernNewsCard({ news, index }: {news: NewsListItem;index: number;}) {
  // Generate random impact values for demo (in production, this would come from the API)
  const impacts = useMemo(() => {
    return news.affected_currencies.slice(0, 2).map((currency) => ({
      currency,
      impact: (Math.random() - 0.5) * 40 // Random between -20% and +20%
    }));
  }, [news.affected_currencies]);

  return (
    <div
      className={cn(
        'group flex gap-3 p-3 rounded-xl bg-card/50 border border-border/50',
        'hover:bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
        'transition-all duration-300 animate-fade-in'
      )}
      style={{ animationDelay: `${index * 50}ms` }}>

      {/* Thumbnail */}
      {news.image_url &&
      <Link to={`/news/${news.id}`} className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden">
          <img
          src={news.image_url}
          alt={news.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </Link>
      }
      
      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        {/* Title */}
        <Link to={`/news/${news.id}`}>
          <h3 className="font-semibold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-tight">
            {news.title}
          </h3>
        </Link>
        
        {/* Source and Date */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          {news.source_logo ?
          <img
            src={news.source_logo}
            alt={news.source}
            className="w-4 h-4 rounded-sm object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }} /> :


          <Rss className="w-3 h-3 text-primary" />
          }
          <span className="font-medium text-foreground/70">{news.source}</span>
          <span className="text-border">•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {news.time_ago}
          </span>
          {news.url &&
          <a
            href={news.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="ml-auto text-primary hover:text-primary/80">

              <ExternalLink className="w-3 h-3" />
            </a>
          }
        </div>
        
        {/* Currency Impacts */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {impacts.map(({ currency, impact }) =>
          <ImpactBadge key={currency} currency={currency} impact={impact} />
          )}
        </div>
        {/* Historical Impact */}
        <HistoricalImpactSection
          newsId={news.id}
          title={news.title}
          category={news.category as EconomicCategory}
          currencies={news.affected_currencies} />

        {/* AI Trading Summary */}
        <div className="mt-2">
          <NewsAISummaryInline news={news} />
        </div>
      </div>
    </div>);

}

// Featured news card for top story
function FeaturedCard({ news }: {news: NewsListItem;}) {
  const impacts = useMemo(() => {
    return news.affected_currencies.slice(0, 3).map((currency) => ({
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
      )}>

      {/* Image Section */}
      <div className="relative aspect-[16/9] overflow-hidden">
        {news.image_url &&
        <img
          src={news.image_url}
          alt={news.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />

        }
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        
        {/* Source Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-primary/90 text-primary-foreground text-xs font-semibold backdrop-blur-sm">
            🔥 Top News
          </span>
          {news.source_logo &&
          <div className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm flex items-center gap-1.5">
              <img
              src={news.source_logo}
              alt={news.source}
              className="w-4 h-4 rounded-sm object-contain" />

              <span className="text-xs text-white font-medium">{news.source}</span>
            </div>
          }
        </div>
        
        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
          <h2 className="text-lg md:text-xl font-bold text-white line-clamp-2 group-hover:text-primary transition-colors">
            {news.title}
          </h2>
          
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              {!news.source_logo &&
              <>
                  <Rss className="w-3 h-3 text-primary" />
                  <span className="font-medium">{news.source}</span>
                  <span>•</span>
                </>
              }
              <Clock className="w-3 h-3" />
              <span>{news.time_ago}</span>
              {news.url &&
              <a
                href={news.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-primary hover:text-primary/80">

                  <ExternalLink className="w-3 h-3" />
                </a>
              }
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              {impacts.map(({ currency, impact }) =>
              <ImpactBadge key={currency} currency={currency} impact={impact} />
              )}
            </div>
          </div>
          
          {/* Historical Impact Mini Chart - Use inline hook for featured card */}
          <FeaturedHistoricalChart newsId={news.id} title={news.title} category={news.category as EconomicCategory} currencies={news.affected_currencies} />
        </div>
      </div>
    </Link>);

}

// Currency quick filter pills — ranked by impact
function QuickCurrencyFilter({
  selected,
  onChange,
  allLabel,
  news,
}: {selected: Currency[]; onChange: (currencies: Currency[]) => void; allLabel: string; news?: RealNewsItem[];}) {
  const toggleCurrency = (currency: Currency) => {
    if (selected.includes(currency)) {
      onChange(selected.filter((c) => c !== currency));
    } else {
      onChange([...selected, currency]);
    }
  };

  // Compute impact counts and sort currencies
  const rankedCurrencies = useMemo(() => {
    const counts: Record<string, number> = {};
    QUICK_CURRENCIES.forEach((c) => (counts[c] = 0));
    if (news) {
      news.forEach((item) =>
        item.affected_currencies.forEach((c) => {
          if (c in counts) counts[c]++;
        })
      );
    }
    return [...QUICK_CURRENCIES].sort((a, b) => counts[b] - counts[a]).map((c) => ({
      currency: c,
      count: counts[c],
    }));
  }, [news]);

  const totalNews = news?.length ?? 0;
  const isAll = selected.length === 0;

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1">
      {/* All button */}
      <button
        onClick={() => onChange([])}
        className={cn(
          'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border',
          isAll
            ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
            : 'bg-card/50 border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground'
        )}
      >
        🌍 {allLabel}
        {totalNews > 0 && (
          <span className="ml-1 opacity-70">{totalNews}</span>
        )}
      </button>

      {/* Currencies ranked by impact */}
      {rankedCurrencies.map(({ currency, count }) => {
        const info = CURRENCIES[currency];
        const isSelected = selected.includes(currency);
        return (
          <button
            key={currency}
            onClick={() => toggleCurrency(currency)}
            className={cn(
              'flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all border',
              isSelected
                ? 'bg-primary/15 border-primary/50 text-primary shadow-sm'
                : 'bg-card/50 border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground'
            )}
          >
            <span className="text-sm">{info.flag}</span>
            <span>{currency}</span>
            {count > 0 && (
              <span className={cn(
                'ml-0.5 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center',
                isSelected
                  ? 'bg-primary/25 text-primary'
                  : 'bg-muted text-muted-foreground'
              )}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
























}

const News = () => {
  const { t, language } = useTranslation();
  const DATE_LOCALES: Record<string, typeof es> = { es, en: enUS, pt: ptBR, fr };
  const dateLocale = DATE_LOCALES[language] ?? es;
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCurrencies, setSelectedCurrencies] = useState<Currency[]>(['EUR']);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sentimentFilters, setSentimentFilters] = useState<Set<'bullish' | 'bearish' | 'neutral'>>(new Set());
  const [sortMode, setSortMode] = useState<'recent' | 'impact' | 'volatility'>('recent');

  const { data: news, isLoading, error, dataUpdatedAt, refetch } = useRealNewsByDate(selectedDate);

  const toggleSentiment = (s: 'bullish' | 'bearish' | 'neutral') => {
    setSentimentFilters(prev => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  };

  // Filter and sort news
  const filteredNews = useMemo(() => {
    if (!news) return [];
    let result = [...news];

    // Currency filter
    if (selectedCurrencies.length > 0) {
      result = result.filter((item) =>
        item.affected_currencies.some((c) => selectedCurrencies.includes(c))
      );
    }

    // Sentiment filter
    if (sentimentFilters.size > 0) {
      result = result.filter((item) => sentimentFilters.has(item.sentiment));
    }

    // Sort
    if (sortMode === 'impact') {
      result.sort((a, b) => b.relevance_score - a.relevance_score);
    } else if (sortMode === 'volatility') {
      // Volatility = more affected currencies + higher relevance
      result.sort((a, b) =>
        (b.affected_currencies.length * 10 + b.relevance_score) -
        (a.affected_currencies.length * 10 + a.relevance_score)
      );
    }
    // 'recent' keeps the default chronological order

    return result;
  }, [news, selectedCurrencies, sentimentFilters, sortMode]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const featuredNews = filteredNews[0];
  const otherNews = filteredNews.slice(1);

  const lastUpdated = dataUpdatedAt ?
  formatDistanceToNow(dataUpdatedAt, { addSuffix: true, locale: dateLocale }) :
  '';

  return (
    <PageShell>
      <Header />
      
      <main className="container py-4 space-y-4 max-w-2xl mx-auto">
        {/* Date Tabs */}
        <DateTabs
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing} />

        
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-foreground">{t('news_title')}</h1>
            {selectedCurrencies.length > 0 &&
            <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                {filteredNews.length}
              </span>
            }
          </div>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium',
              'border transition-all',
              filtersOpen ?
              'bg-primary/10 border-primary/30 text-primary' :
              'bg-card/50 border-border/50 text-muted-foreground hover:text-foreground'
            )}>

            <Filter className="w-4 h-4" />
            <span>{t('news_currencies')}</span>
            {selectedCurrencies.length > 0 &&
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {selectedCurrencies.length}
              </span>
            }
          </button>
        </div>
        
        {/* Quick Currency Filter */}
        <QuickCurrencyFilter
          selected={selectedCurrencies}
          onChange={setSelectedCurrencies}
          allLabel={t('news_all_currencies')}
          news={news} />

        {/* Impact & Sentiment Filter Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          {/* Sort modes */}
          {([
            { key: 'recent' as const, icon: <Clock className="w-3 h-3" />, label: 'Recientes' },
            { key: 'impact' as const, icon: <Zap className="w-3 h-3" />, label: 'Impacto' },
            { key: 'volatility' as const, icon: <BarChart3 className="w-3 h-3" />, label: 'Volatilidad' },
          ]).map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => setSortMode(key)}
              className={cn(
                'flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all border',
                sortMode === key
                  ? 'bg-accent border-accent text-accent-foreground shadow-sm'
                  : 'bg-card/50 border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground'
              )}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}

          {/* Divider */}
          <div className="w-px h-5 bg-border/60 flex-shrink-0 mx-0.5" />

          {/* Sentiment toggles */}
          {([
            { key: 'bullish' as const, icon: <TrendingUp className="w-3 h-3" />, label: 'Alcista', activeClass: 'bg-emerald-500/15 border-emerald-500/50 text-emerald-500' },
            { key: 'bearish' as const, icon: <TrendingDown className="w-3 h-3" />, label: 'Bajista', activeClass: 'bg-red-500/15 border-red-500/50 text-red-500' },
            { key: 'neutral' as const, icon: <Minus className="w-3 h-3" />, label: 'Neutral', activeClass: 'bg-muted border-muted-foreground/40 text-muted-foreground' },
          ]).map(({ key, icon, label, activeClass }) => (
            <button
              key={key}
              onClick={() => toggleSentiment(key)}
              className={cn(
                'flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all border',
                sentimentFilters.has(key)
                  ? activeClass
                  : 'bg-card/50 border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground'
              )}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}

          {/* Clear all filters */}
          {(sentimentFilters.size > 0 || sortMode !== 'recent') && (
            <button
              onClick={() => { setSentimentFilters(new Set()); setSortMode('recent'); }}
              className="flex-shrink-0 px-2 py-1.5 rounded-full text-[10px] font-medium text-destructive hover:bg-destructive/10 transition-all"
            >
              ✕ Reset
            </button>
          )}
        </div>

        {/* Advanced Filters */}
        {filtersOpen






        }
        
        {/* Sources and Last Updated */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3" />
            <span>{t('news_last_updated')}: {lastUpdated}</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <span className="text-[10px] uppercase tracking-wider flex-shrink-0">{t('news_sources')}:</span>
            <div className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 text-[10px] font-medium">Finnhub</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-medium">Polygon</span>
              <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 text-[10px] font-medium">NewsAPI</span>
              <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px] font-medium">FXStreet</span>
              <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-[10px] font-medium">Investing</span>
              <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-[10px] font-medium">ForexFactory</span>
              <span className="px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-400 text-[10px] font-medium">Bloomberg</span>
            </div>
          </div>
        </div>
        
        {/* Loading State */}
        {isLoading &&
        <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-2xl" />
            {[1, 2, 3, 4].map((i) =>
          <div key={i} className="flex gap-3">
                <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-6 w-1/2" />
                </div>
              </div>
          )}
          </div>
        }
        
        {/* Error State */}
        {error &&
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl bg-red-500/10 border border-red-500/30">
            <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">{t('news_error_loading')}</h2>
            <p className="text-muted-foreground text-sm mb-4">
              {error instanceof Error ? error.message : t('news_unknown_error')}
            </p>
            <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">

              {t('news_retry')}
            </button>
          </div>
        }
        
        {/* News Content */}
        {!isLoading && !error &&
        <>
            {filteredNews.length === 0 ?
          <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">
                  {selectedCurrencies.length > 0 ?
              t('news_no_news_currencies') :
              t('news_no_news_date')}
                </p>
                {selectedCurrencies.length > 0 &&
            <button
              onClick={() => setSelectedCurrencies([])}
              className="mt-3 text-sm text-primary hover:text-primary/80">

                    {t('news_clear_filters')}
                  </button>
            }
              </div> :

          <div className="space-y-4">
                {/* Featured News */}
                {featuredNews && <FeaturedCard news={featuredNews} />}
                
                {/* Top News Label */}
                {otherNews.length > 0 &&
            <div className="flex items-center gap-2 pt-2">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      <span>📰</span>
                      <span>{t('news_top_news')}</span>
                    </div>
                    <div className="flex-1 h-px bg-border/50" />
                  </div>
            }
                
                {/* News List */}
                <div className="space-y-3">
                  {otherNews.map((newsItem, index) =>
              <ModernNewsCard key={newsItem.id} news={newsItem} index={index} />
              )}
                </div>
              </div>
          }
          </>
        }
      </main>
      
    </PageShell>);

};

export default News;