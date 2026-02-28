import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { DateTabs } from '@/components/news/DateTabs';
import { CurrencyFilter } from '@/components/news/CurrencyFilter';
import { useRealNewsByDate, RealNewsItem } from '@/hooks/useRealNews';
import { useNewsHistoricalImpactCached, MonthlyImpact } from '@/hooks/useNewsHistoricalImpact';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Filter, Clock, TrendingUp, TrendingDown, Minus, ExternalLink, Rss, ArrowUpDown, Zap, BarChart3, ChevronDown, Languages, Loader2 } from 'lucide-react';
import { useNewsTranslation } from '@/hooks/useNewsTranslation';
import { NewsAISummaryInline } from '@/components/news/NewsAISummaryInline';
import { formatDistanceToNow } from 'date-fns';
import { es, enUS, ptBR, fr } from 'date-fns/locale';
import { useTranslation } from '@/i18n/LanguageContext';
import { Currency, CURRENCIES, EconomicCategory } from '@/types/news';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

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


// Sentiment circle indicator (mirrors SignalCardV2 price circle)
function SentimentCircle({ sentiment, relevance }: {sentiment: 'bullish' | 'bearish' | 'neutral';relevance: number;}) {
  const circlePercent = Math.min(100, relevance);
  const isBullish = sentiment === 'bullish';
  const isBearish = sentiment === 'bearish';
  const gradId = `sent-${Math.random().toString(36).slice(2, 8)}`;
  const SentIcon = isBullish ? TrendingUp : isBearish ? TrendingDown : Minus;
  const label = isBullish ? 'Bull' : isBearish ? 'Bear' : 'Neutral';
  const textColor = isBullish ? 'text-green-400' : isBearish ? 'text-red-400' : 'text-cyan-300';
  return (
    <div className="relative w-[56px] h-[56px] flex-shrink-0">
      <div className={cn('absolute -inset-0.5 rounded-full opacity-25 blur-md transition-all duration-700', isBullish ? 'bg-green-500' : isBearish ? 'bg-red-500' : 'bg-cyan-500')} />
      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90 rounded-full overflow-hidden">
        <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(225, 20%, 12%)" strokeWidth="2.5" />
        <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(225, 15%, 18%)" strokeWidth="1" strokeDasharray="1.5 2" opacity="0.5" />
        <circle cx="18" cy="18" r="15" fill="none" stroke={`url(#${gradId})`} strokeWidth="2.8" strokeLinecap="round"
        strokeDasharray={`${circlePercent * 0.942} ${100 * 0.942}`} className="transition-all duration-700 ease-out"
        style={{ filter: 'drop-shadow(0 0 3px currentColor)' }} />
        <circle cx="18" cy="18" r="12" fill="hsl(225, 25%, 8%)" fillOpacity="0.85" />
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            {isBullish ? <><stop offset="0%" stopColor="hsl(160, 80%, 55%)" /><stop offset="100%" stopColor="hsl(120, 70%, 40%)" /></> :
            isBearish ? <><stop offset="0%" stopColor="hsl(10, 80%, 60%)" /><stop offset="100%" stopColor="hsl(350, 70%, 45%)" /></> :
            <><stop offset="0%" stopColor="hsl(200, 100%, 55%)" /><stop offset="100%" stopColor="hsl(180, 100%, 50%)" /></>}
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <SentIcon className={cn('w-3.5 h-3.5', textColor)} />
        <span className={cn('text-[8px] font-bold mt-0.5', textColor)}>{label}</span>
      </div>
    </div>);

}

// Currency impact bar (matches SignalCardV2 ImpactBar)
function NewsImpactBar({ label, value, color }: {label: string;value: number;color: string;}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] w-12 text-right" style={{ color }}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-[11px] font-semibold w-8 text-right" style={{ color }}>{value}%</span>
    </div>);

}

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

// Modern news card component matching the signal card design
function ModernNewsCard({ news, index, translateHook }: {news: NewsListItem;index: number;translateHook: ReturnType<typeof useNewsTranslation>;}) {
  const [expanded, setExpanded] = useState(false);
  const { language } = useTranslation();
  const { translateText, clearTranslation, translations, translating } = translateHook;
  const isTranslated = !!translations[news.id];
  const isTranslating = !!translating[news.id];
  const displayTitle = translations[news.id] || news.title;
  const targetLang = language === 'en' ? 'es' : language;
  const targetLabel = targetLang === 'es' ? '🇪🇸 ES' : targetLang === 'pt' ? '🇧🇷 PT' : targetLang === 'fr' ? '🇫🇷 FR' : '🇪🇸 ES';

  const impacts = useMemo(() => {
    return news.affected_currencies.slice(0, 2).map((currency) => ({
      currency, impact: (Math.random() - 0.5) * 40
    }));
  }, [news.affected_currencies]);

  const sentimentBreakdown = useMemo(() => {
    if (news.sentiment === 'bullish') return { pos: 65, neg: 15, neu: 20 };
    if (news.sentiment === 'bearish') return { pos: 15, neg: 65, neu: 20 };
    return { pos: 30, neg: 25, neu: 45 };
  }, [news.sentiment]);

  const sentimentColor = news.sentiment === 'bullish' ? 'hsl(135, 70%, 50%)' : news.sentiment === 'bearish' ? 'hsl(0, 70%, 55%)' : 'hsl(45, 80%, 55%)';
  const sentimentLabel = news.sentiment === 'bullish' ? 'Alcista' : news.sentiment === 'bearish' ? 'Bajista' : 'Neutral';
  const SentimentIcon = news.sentiment === 'bullish' ? TrendingUp : news.sentiment === 'bearish' ? TrendingDown : Minus;

  return (
    <div
      className={cn('group relative rounded-xl overflow-hidden animate-fade-in')}
      style={{
        animationDelay: `${index * 50}ms`,
        background: 'radial-gradient(ellipse at center 40%, hsl(200, 100%, 15%) 0%, hsl(205, 100%, 7%) 70%, hsl(210, 100%, 5%) 100%)',
        border: '1px solid hsla(200, 60%, 35%, 0.3)'
      }}>

      {/* Top glow line */}
      <div className="absolute top-0 left-[15%] right-[15%] h-[1px]"
      style={{ background: 'radial-gradient(ellipse at center, hsl(200, 80%, 55%) 0%, transparent 70%)' }} />

      {/* Header: Sentiment badge + Category */}
      <div className="relative flex items-center justify-between px-3 pt-3 pb-1">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
          style={{ background: `${sentimentColor}20`, border: `1px solid ${sentimentColor}40`, color: sentimentColor }}>
            <SentimentIcon className="w-3 h-3 inline mr-1" />
            {sentimentLabel}
          </span>
          <span className="text-[10px] text-cyan-300/50 uppercase tracking-wider font-medium">{news.category}</span>
        </div>
        <div className="text-[10px] text-cyan-300/50 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {news.time_ago}
        </div>
      </div>

      {/* Main content row */}
      <div className="flex gap-3 px-3 py-2">
        {/* Left: Thumbnail + Sentiment Circle */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          {news.image_url &&
          <Link to={`/news/${news.id}`} className="relative w-20 h-20 rounded-lg overflow-hidden border border-cyan-800/20">
              <img src={news.image_url} alt={news.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </Link>
          }
          <SentimentCircle sentiment={news.sentiment} relevance={news.relevance_score} />
        </div>

        {/* Right: Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          <Link to={`/news/${news.id}`}>
            <h3 className="font-semibold text-sm text-white line-clamp-2 group-hover:text-cyan-300 transition-colors leading-tight">
              {displayTitle}
            </h3>
            {isTranslated &&
            <span className="text-[9px] text-purple-400 mt-0.5 inline-flex items-center gap-0.5">
                <Languages className="w-2.5 h-2.5" /> Traducido
              </span>
            }
          </Link>

          <div className="flex items-center gap-2 text-xs text-cyan-300/50 mt-1">
            {news.source_logo ?
            <img src={news.source_logo} alt={news.source} className="w-4 h-4 rounded-sm object-contain"
            onError={(e) => {(e.target as HTMLImageElement).style.display = 'none';}} /> :
            <Rss className="w-3 h-3 text-cyan-400" />}
            <span className="font-medium text-cyan-200/70">{news.source}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isTranslated) {
                  clearTranslation(news.id);
                } else {
                  translateText(news.id, news.title, targetLang);
                }
              }}
              disabled={isTranslating}
              className={cn(
                "ml-auto flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-all",
                isTranslated ?
                "bg-purple-500/20 text-purple-400 border border-purple-500/30" :
                "text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
              )}>

              {isTranslating ?
              <Loader2 className="w-3 h-3 animate-spin" /> :

              <Languages className="w-3 h-3" />
              }
              {isTranslated ? 'Original' : targetLabel}
            </button>
            {news.url &&
            <a href={news.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
            className="text-cyan-400 hover:text-cyan-300"><ExternalLink className="w-3 h-3" /></a>
            }
          </div>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {impacts.map(({ currency, impact }) => <ImpactBadge key={currency} currency={currency} impact={impact} />)}
          </div>

          {/* Relevance bar (like entry price bar) */}
          <div className="relative rounded-md overflow-hidden mt-2"
          style={{ background: 'linear-gradient(180deg, hsl(0, 0%, 0%) 0%, hsl(205, 80%, 8%) 100%)', border: '1px solid hsla(210, 100%, 50%, 0.15)' }}>
            <div className="absolute top-0 left-[10%] right-[10%] h-[1px]"
            style={{ background: 'radial-gradient(ellipse at center, hsl(200, 100%, 50%) 0%, transparent 70%)' }} />
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-[10px] uppercase tracking-wider text-cyan-300/60 font-medium">Relevancia</span>
              <span className="font-mono text-sm font-bold text-white">{news.relevance_score}/100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable toggle */}
      <button onClick={() => setExpanded(!expanded)}
      className="w-full flex items-center justify-center py-1.5 text-cyan-400/60 hover:text-cyan-300 transition-colors">
        <ChevronDown className={cn('w-4 h-4 transition-transform duration-300', expanded && 'rotate-180')} />
      </button>

      {/* Expanded content */}
      {expanded &&
      <div className="px-3 pb-3 space-y-3 animate-fade-in">
          <div className="rounded-lg p-3 relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, hsl(210, 100%, 8%) 0%, hsl(200, 80%, 12%) 100%)', border: '1px solid hsla(200, 60%, 35%, 0.3)' }}>
            <div className="absolute top-0 left-[15%] right-[15%] h-[1px]"
          style={{ background: 'radial-gradient(ellipse at center, hsl(195, 100%, 54%) 0%, transparent 70%)' }} />
            <span className="text-[10px] uppercase tracking-wider text-cyan-300/60 font-medium mb-2 block">Análisis de Sentimiento</span>
            <div className="space-y-1.5">
              <NewsImpactBar label="Alcista" value={sentimentBreakdown.pos} color="hsl(135, 70%, 50%)" />
              <NewsImpactBar label="Bajista" value={sentimentBreakdown.neg} color="hsl(0, 70%, 55%)" />
              <NewsImpactBar label="Neutral" value={sentimentBreakdown.neu} color="hsl(45, 80%, 55%)" />
            </div>
          </div>

          <HistoricalImpactSection newsId={news.id} title={news.title} category={news.category as EconomicCategory} currencies={news.affected_currencies} />
          <NewsAISummaryInline news={news} />
        </div>
      }
    </div>);

}

// Featured news card for top story
function FeaturedCard({ news }: {news: NewsListItem;}) {
  const impacts = useMemo(() => {
    return news.affected_currencies.slice(0, 3).map((currency) => ({
      currency, impact: (Math.random() - 0.5) * 40
    }));
  }, [news.affected_currencies]);

  const sentimentColor = news.sentiment === 'bullish' ? 'hsl(135, 70%, 50%)' : news.sentiment === 'bearish' ? 'hsl(0, 70%, 55%)' : 'hsl(45, 80%, 55%)';
  const sentimentLabel = news.sentiment === 'bullish' ? 'Alcista' : news.sentiment === 'bearish' ? 'Bajista' : 'Neutral';

  return (
    <Link
      to={`/news/${news.id}`}
      className={cn('group block rounded-xl overflow-hidden relative transition-all duration-500 hover:shadow-xl animate-fade-in')}
      style={{
        background: 'radial-gradient(ellipse at center 40%, hsl(200, 100%, 15%) 0%, hsl(205, 100%, 7%) 70%, hsl(210, 100%, 5%) 100%)',
        border: '1px solid hsla(200, 60%, 35%, 0.3)'
      }}>

      <div className="absolute top-0 left-[15%] right-[15%] h-[1px] z-10"
      style={{ background: 'radial-gradient(ellipse at center, hsl(200, 80%, 55%) 0%, transparent 70%)' }} />

      <div className="relative aspect-[16/9] overflow-hidden">
        {news.image_url &&
        <img src={news.image_url} alt={news.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        }
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(210,100%,5%)] via-[hsl(210,100%,5%,0.4)] to-transparent" />

        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm"
          style={{ background: 'hsla(200, 100%, 50%, 0.2)', border: '1px solid hsla(200, 80%, 55%, 0.4)', color: 'hsl(200, 100%, 75%)' }}>
            🔥 Top News
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-sm"
          style={{ background: `${sentimentColor}20`, border: `1px solid ${sentimentColor}40`, color: sentimentColor }}>
            {sentimentLabel}
          </span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
          <h2 className="text-lg md:text-xl font-bold text-white line-clamp-2 group-hover:text-cyan-300 transition-colors">{news.title}</h2>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-sm text-cyan-300/60">
              <Rss className="w-3 h-3 text-cyan-400" />
              <span className="font-medium">{news.source}</span>
              <span>•</span>
              <Clock className="w-3 h-3" />
              <span>{news.time_ago}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {impacts.map(({ currency, impact }) => <ImpactBadge key={currency} currency={currency} impact={impact} />)}
            </div>
          </div>
          <FeaturedHistoricalChart newsId={news.id} title={news.title} category={news.category as EconomicCategory} currencies={news.affected_currencies} />
        </div>
      </div>
    </Link>);

}

// Currency quick filter pills
const QUICK_CURRENCIES: Currency[] = ['EUR', 'USD', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'];

function QuickCurrencyFilter({
  selected, onChange, allLabel, news
}: {selected: Currency[];onChange: (currencies: Currency[]) => void;allLabel: string;news?: RealNewsItem[];}) {
  const toggleCurrency = (currency: Currency) => {
    if (selected.includes(currency)) {
      onChange(selected.filter((c) => c !== currency));
    } else {
      onChange([...selected, currency]);
    }
  };

  const rankedCurrencies = useMemo(() => {
    const counts: Record<string, number> = {};
    QUICK_CURRENCIES.forEach((c) => counts[c] = 0);
    if (news) {
      news.forEach((item) =>
      item.affected_currencies.forEach((c) => {
        if (c in counts) counts[c]++;
      })
      );
    }
    return [...QUICK_CURRENCIES].sort((a, b) => counts[b] - counts[a]).map((c) => ({ currency: c, count: counts[c] }));
  }, [news]);

  const totalNews = news?.length ?? 0;
  const isAll = selected.length === 0;

  const selectedLabel = isAll ?
  `🌍 ${allLabel}` :
  selected.map((c) => `${CURRENCIES[c].flag} ${c}`).join(', ');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border',
          'bg-card/50 border-border/50 text-foreground hover:border-primary/40'
        )}>
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="truncate max-w-[200px]">{selectedLabel}</span>
          {!isAll &&
          <span className="min-w-[20px] h-5 rounded-full bg-primary/20 text-primary text-[11px] font-bold flex items-center justify-center">
              {selected.length}
            </span>
          }
          <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuCheckboxItem
          checked={isAll}
          onCheckedChange={() => onChange([])}>

          <span className="flex items-center gap-2">
            🌍 {allLabel}
            {totalNews > 0 && <span className="text-muted-foreground text-xs">({totalNews})</span>}
          </span>
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        {rankedCurrencies.map(({ currency, count }) => {
          const info = CURRENCIES[currency];
          const isSelected = selected.includes(currency);
          return (
            <DropdownMenuCheckboxItem
              key={currency}
              checked={isSelected}
              onCheckedChange={() => toggleCurrency(currency)}>

              <span className="flex items-center gap-2 w-full">
                <span>{info.flag}</span>
                <span>{currency}</span>
                {count > 0 &&
                <span className="ml-auto text-xs text-muted-foreground">{count}</span>
                }
              </span>
            </DropdownMenuCheckboxItem>);

        })}
      </DropdownMenuContent>
    </DropdownMenu>);

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
  const newsTranslateHook = useNewsTranslation();

  const { data: news, isLoading, error, dataUpdatedAt, refetch } = useRealNewsByDate(selectedDate);

  const toggleSentiment = (s: 'bullish' | 'bearish' | 'neutral') => {
    setSentimentFilters((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);else next.add(s);
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
      b.affected_currencies.length * 10 + b.relevance_score - (
      a.affected_currencies.length * 10 + a.relevance_score)
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
    <div className="min-h-screen bg-[#06080f] flex justify-center">
      <div className="relative w-full max-w-[390px] min-h-screen bg-gradient-to-b from-[#0a0f1a] via-[#0d1829] to-[#0a0f1a] pb-20 shadow-2xl">
      <Header />
      
      <main className="px-4 py-4 space-y-4">
        {/* Date Tabs */}
        <DateTabs
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing} />

        
        {/* Section Header + Currency Filter */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-foreground">{t('news_title')}</h1>
            {selectedCurrencies.length > 0 &&
              <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                {filteredNews.length}
              </span>
            }
          </div>
          <QuickCurrencyFilter
            selected={selectedCurrencies}
            onChange={setSelectedCurrencies}
            allLabel={t('news_all_currencies')}
            news={news} />
        </div>

        {/* Impact & Sentiment Filter Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          {/* Sort modes */}
          {[
            { key: 'recent' as const, icon: <Clock className="w-3 h-3" />, label: 'Recientes' },
            { key: 'impact' as const, icon: <Zap className="w-3 h-3" />, label: 'Impacto' },
            { key: 'volatility' as const, icon: <BarChart3 className="w-3 h-3" />, label: 'Volatilidad' }].
            map(({ key, icon, label }) =>
            <button
              key={key}
              onClick={() => setSortMode(key)}
              className={cn(
                'flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all border',
                sortMode === key ?
                'bg-accent border-accent text-accent-foreground shadow-sm' :
                'bg-card/50 border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground'
              )}>

              {icon}
              <span>{label}</span>
            </button>
            )}

          {/* Divider */}
          <div className="w-px h-5 bg-border/60 flex-shrink-0 mx-0.5" />

          {/* Sentiment toggles */}
          {[
            { key: 'bullish' as const, icon: <TrendingUp className="w-3 h-3" />, label: 'Alcista', activeClass: 'bg-emerald-500/15 border-emerald-500/50 text-emerald-500' },
            { key: 'bearish' as const, icon: <TrendingDown className="w-3 h-3" />, label: 'Bajista', activeClass: 'bg-red-500/15 border-red-500/50 text-red-500' },
            { key: 'neutral' as const, icon: <Minus className="w-3 h-3" />, label: 'Neutral', activeClass: 'bg-muted border-muted-foreground/40 text-muted-foreground' }].
            map(({ key, icon, label, activeClass }) =>
            <button
              key={key}
              onClick={() => toggleSentiment(key)}
              className={cn(
                'flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all border',
                sentimentFilters.has(key) ?
                activeClass :
                'bg-card/50 border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground'
              )}>

              {icon}
              <span>{label}</span>
            </button>
            )}

          {/* Clear all filters */}
          {(sentimentFilters.size > 0 || sortMode !== 'recent') &&
            <button
              onClick={() => {setSentimentFilters(new Set());setSortMode('recent');}}
              className="flex-shrink-0 px-2 py-1.5 rounded-full text-[10px] font-medium text-destructive hover:bg-destructive/10 transition-all">

              ✕ Reset
            </button>
            }
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
                <ModernNewsCard key={newsItem.id} news={newsItem} index={index} translateHook={newsTranslateHook} />
                )}
                </div>
              </div>
            }
          </>
          }
      </main>
      </div>
    </div>);

};

export default News;