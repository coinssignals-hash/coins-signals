import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { PageTransition } from '@/components/layout/PageTransition';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, TrendingUp, TrendingDown, DollarSign, BarChart3, ArrowLeft, Activity, Brain, Newspaper, Star, ArrowUpDown } from 'lucide-react';
import { useStockSearch, useStockProfile, useStockQuote, useStockHistorical, useStockFinancials, useStockTechnicals, useStockSentiment, useStockNews, useStockAISummary } from '@/hooks/useStockData';
import { useFavoriteSymbols } from '@/hooks/useFavoriteSymbols';
import { useDebounce } from '@/hooks/useDebounce';
import { StockChart } from '@/components/stocks/StockChart';
import { StockQuoteCard } from '@/components/stocks/StockQuoteCard';
import { StockProfileCard } from '@/components/stocks/StockProfileCard';
import { StockFinancialsCard } from '@/components/stocks/StockFinancialsCard';
import { StockTechnicalsCard } from '@/components/stocks/StockTechnicalsCard';
import { StockSentimentCard } from '@/components/stocks/StockSentimentCard';
import { StockNewsCard } from '@/components/stocks/StockNewsCard';
import { StockAISummaryCard } from '@/components/stocks/StockAISummaryCard';
import { cn } from '@/lib/utils';
import { StockCompare } from '@/components/stocks/StockCompare';
import { StockPriceAlerts } from '@/components/stocks/StockPriceAlerts';
import { useStockAlertMonitor } from '@/hooks/useStockPriceAlerts';
import brandLogo from '@/assets/g174.svg';
import { MarketIndicesTicker } from '@/components/stocks/MarketIndicesTicker';
import { useTranslation } from '@/i18n/LanguageContext';

const POPULAR_STOCKS = [
  { symbol: 'AAPL', name: 'Apple' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'GOOGL', name: 'Alphabet' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'TSLA', name: 'Tesla' },
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'META', name: 'Meta' },
  { symbol: 'JPM', name: 'JPMorgan' },
];

function Stocks() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [compareMode, setCompareMode] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, 400);
  const { data: searchResults, isLoading: searchLoading } = useStockSearch(debouncedQuery);
  const { favorites, isFavorite, addFavorite, removeFavorite } = useFavoriteSymbols();

  const stockFavorites = useMemo(
    () => favorites.filter(f => f.symbol_type === 'Stock'),
    [favorites]
  );

  const handleSelect = (symbol: string) => {
    setSelectedSymbol(symbol);
    setSearchQuery('');
  };

  const toggleFavorite = (symbol: string, name?: string) => {
    if (isFavorite(symbol)) {
      removeFavorite(symbol);
    } else {
      addFavorite(symbol, name, 'Stock');
    }
  };

  return (
    <PageTransition>
      <div className="min-h-[100dvh] bg-[hsl(225,45%,3%)] flex justify-center">
        <div className="relative w-full max-w-2xl min-h-[100dvh] bg-gradient-to-b from-[hsl(222,45%,7%)] via-[hsl(218,52%,8%)] to-[hsl(222,45%,7%)] pb-20 shadow-2xl">
          <Header />

          <div className="px-4 pt-4 pb-2 space-y-4">
            {/* Title with brand watermark */}
            <div className="relative flex items-center gap-3">
              {selectedSymbol && (
                <button
                  onClick={() => setSelectedSymbol('')}
                  className="p-2 rounded-lg bg-[hsl(210,40%,12%)] border border-cyan-800/20 hover:border-cyan-600/40 transition-all active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4 text-cyan-300" />
                </button>
              )}
              <div className="flex-1">
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                  {selectedSymbol ? selectedSymbol : t('stock_market_title')}
                </h1>
                <p className="text-xs text-cyan-300/50">
                  {selectedSymbol ? t('stock_quote_analysis') : t('stock_search_global')}
                </p>
              </div>
              {selectedSymbol && (
                <button
                  onClick={() => toggleFavorite(selectedSymbol)}
                  className="p-2 rounded-lg hover:bg-[hsl(210,40%,12%)] transition-colors active:scale-95"
                >
                  <Star className={cn("w-5 h-5 transition-colors", isFavorite(selectedSymbol) ? "fill-[hsl(45,90%,55%)] text-[hsl(45,90%,55%)]" : "text-slate-500")} />
                </button>
              )}
            </div>

            {/* Market Indices Ticker */}
            {!selectedSymbol && <MarketIndicesTicker />}

            {/* Search */}
            {!selectedSymbol && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400/60" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('stock_search_placeholder')}
                  className="pl-10 bg-[hsl(210,40%,10%)] border-cyan-800/30 text-white placeholder:text-slate-500 focus:border-cyan-500/50 transition-colors"
                />
                {debouncedQuery.length >= 2 && (
                  <div className="absolute z-50 mt-1 w-full bg-[hsl(220,40%,8%)] border border-cyan-800/30 rounded-xl shadow-xl shadow-black/40 max-h-60 overflow-y-auto">
                    {searchLoading ? (
                      <div className="p-4 space-y-2">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full bg-slate-800/50" />)}
                      </div>
                    ) : searchResults && searchResults.length > 0 ? (
                      searchResults.map((r) => (
                        <button
                          key={r.symbol}
                          onClick={() => handleSelect(r.symbol)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-cyan-500/10 transition-colors text-left border-b border-cyan-800/10 last:border-0"
                        >
                          <div>
                            <span className="text-sm font-semibold text-white">{r.symbol}</span>
                            <span className="text-xs text-slate-400 ml-2">{r.name}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] border-cyan-800/30 text-cyan-300/60">{r.exchangeShortName}</Badge>
                        </button>
                      ))
                    ) : (
                      <p className="p-4 text-sm text-slate-500 text-center">{t('stock_no_results')}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Content */}
          {compareMode ? (
            <StockCompare onClose={() => setCompareMode(false)} />
          ) : selectedSymbol ? (
            <StockDetail symbol={selectedSymbol} />
          ) : (
            <div className="px-4 space-y-4 pb-4">
              {/* Compare button */}
              <button
                onClick={() => setCompareMode(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-cyan-800/30 bg-[hsl(210,40%,10%)] hover:border-cyan-500/40 hover:bg-[hsl(210,40%,12%)] transition-all active:scale-[0.98]"
              >
                <ArrowUpDown className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-cyan-200">{t('stock_compare')}</span>
              </button>

              {/* Favorites section */}
              {stockFavorites.length > 0 && (
                <>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 fill-[hsl(45,90%,55%)] text-[hsl(45,90%,55%)]" />
                    <h2 className="text-xs font-semibold text-cyan-300/60 uppercase tracking-wider">{t('stock_my_favorites')}</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {stockFavorites.map((fav) => (
                      <FavoriteStockCard
                        key={fav.symbol}
                        symbol={fav.symbol}
                        name={fav.symbol_name || fav.symbol}
                        onSelect={handleSelect}
                        onRemove={() => removeFavorite(fav.symbol)}
                      />
                    ))}
                  </div>
                </>
              )}

              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400/60" />
                <h2 className="text-xs font-semibold text-cyan-300/60 uppercase tracking-wider">{t('stock_popular')}</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {POPULAR_STOCKS.map((stock) => (
                  <PopularStockCard key={stock.symbol} symbol={stock.symbol} name={stock.name} onSelect={handleSelect} />
                ))}
              </div>
            </div>
          )}

          <BottomNav />
        </div>
      </div>
    </PageTransition>
  );
}

function FavoriteStockCard({ symbol, name, onSelect, onRemove }: { symbol: string; name: string; onSelect: (s: string) => void; onRemove: () => void }) {
  const { data: quote } = useStockQuote(symbol);
  const isPositive = (quote?.changesPercentage ?? 0) >= 0;

  return (
    <div
      onClick={() => onSelect(symbol)}
      className="relative cursor-pointer rounded-xl overflow-hidden active:scale-[0.97] transition-transform"
    >
      <div
        className="relative rounded-xl border border-[hsl(45,60%,40%)]/20 overflow-hidden p-3"
        style={{
          background: 'radial-gradient(ellipse at center 40%, hsl(200, 100%, 15%) 0%, hsl(205, 100%, 7%) 70%, hsl(210, 100%, 5%) 100%)'
        }}
      >
        <div className="absolute top-0 left-[15%] right-[15%] h-[1px]" style={{ background: 'radial-gradient(ellipse at center, hsl(45, 80%, 55%) 0%, transparent 70%)' }} />
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/5 transition-colors z-10"
        >
          <Star className="w-3.5 h-3.5 fill-[hsl(45,90%,55%)] text-[hsl(45,90%,55%)]" />
        </button>
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-sm font-bold text-white">{symbol}</span>
          {isPositive ? (
            <TrendingUp className="w-3.5 h-3.5 text-[hsl(142,70%,45%)]" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-[hsl(0,70%,55%)]" />
          )}
        </div>
        <p className="text-xs text-cyan-300/50 truncate mb-1">{name}</p>
        {quote ? (
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-mono font-semibold text-white">${quote.price?.toFixed(2)}</span>
            <span className={cn("text-xs font-mono font-medium", isPositive ? 'text-[hsl(142,70%,45%)]' : 'text-[hsl(0,70%,55%)]')}>
              {isPositive ? '+' : ''}{quote.changesPercentage?.toFixed(2)}%
            </span>
          </div>
        ) : (
          <Skeleton className="h-4 w-20 bg-slate-800/50" />
        )}
      </div>
    </div>
  );
}

function PopularStockCard({ symbol, name, onSelect }: { symbol: string; name: string; onSelect: (s: string) => void }) {
  const { data: quote } = useStockQuote(symbol);
  const isPositive = (quote?.changesPercentage ?? 0) >= 0;

  return (
    <div
      onClick={() => onSelect(symbol)}
      className="relative cursor-pointer rounded-xl overflow-hidden active:scale-[0.97] transition-transform"
    >
      <div
        className="relative rounded-xl border border-cyan-800/20 overflow-hidden p-3 group"
        style={{
          background: 'radial-gradient(ellipse at center 40%, hsl(200, 100%, 12%) 0%, hsl(205, 100%, 6%) 70%, hsl(210, 100%, 4%) 100%)'
        }}
      >
        <div className="absolute top-0 left-[15%] right-[15%] h-[1px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'radial-gradient(ellipse at center, hsl(200, 80%, 55%) 0%, transparent 70%)' }} />
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">{symbol}</span>
          {isPositive ? (
            <TrendingUp className="w-4 h-4 text-[hsl(142,70%,45%)]" />
          ) : (
            <TrendingDown className="w-4 h-4 text-[hsl(0,70%,55%)]" />
          )}
        </div>
        <p className="text-xs text-slate-500 truncate mb-1">{name}</p>
        {quote ? (
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-mono font-semibold text-white">${quote.price?.toFixed(2)}</span>
            <span className={cn("text-xs font-mono font-medium", isPositive ? 'text-[hsl(142,70%,45%)]' : 'text-[hsl(0,70%,55%)]')}>
              {isPositive ? '+' : ''}{quote.changesPercentage?.toFixed(2)}%
            </span>
          </div>
        ) : (
          <Skeleton className="h-4 w-20 bg-slate-800/50" />
        )}
      </div>
    </div>
  );
}

function StockDetail({ symbol }: { symbol: string }) {
  const { t, language } = useTranslation();
  const { data: profile, isLoading: profileLoading } = useStockProfile(symbol);
  const { data: quote, isLoading: quoteLoading } = useStockQuote(symbol);
  const { data: financials, isLoading: financialsLoading } = useStockFinancials(symbol);
  const { data: technicals, isLoading: technicalsLoading } = useStockTechnicals(symbol);
  const { data: sentiment, isLoading: sentimentLoading } = useStockSentiment(symbol);
  const { data: news, isLoading: newsLoading } = useStockNews(symbol);
  const { data: aiSummary, isLoading: aiLoading } = useStockAISummary(symbol, language);

  const [chartPeriod, setChartPeriod] = useState('3m');
  const { data: historical, isLoading: histLoading } = useStockHistorical(symbol, chartPeriod);

  useStockAlertMonitor(symbol, quote?.price);

  return (
    <div className="px-4 space-y-3 pb-4">
      <StockQuoteCard quote={quote} loading={quoteLoading} />
      <StockAISummaryCard data={aiSummary} loading={aiLoading} currentPrice={quote?.price} />
      <StockChart data={historical ?? []} loading={histLoading} symbol={symbol} period={chartPeriod} onPeriodChange={setChartPeriod} />

      <StockPriceAlerts symbol={symbol} symbolName={profile?.companyName} currentPrice={quote?.price} />

      <Tabs defaultValue="technicals" className="w-full">
        <TabsList className="w-full bg-[hsl(210,40%,10%)] border border-cyan-800/20 rounded-xl">
          <TabsTrigger value="technicals" className="flex-1 text-[11px] gap-1 data-[state=active]:bg-cyan-500/15 data-[state=active]:text-cyan-300 text-slate-500 rounded-lg">
            <Activity className="w-3.5 h-3.5" /> {t('stock_tab_technical')}
          </TabsTrigger>
          <TabsTrigger value="sentiment" className="flex-1 text-[11px] gap-1 data-[state=active]:bg-cyan-500/15 data-[state=active]:text-cyan-300 text-slate-500 rounded-lg">
            <Brain className="w-3.5 h-3.5" /> {t('stock_tab_sentiment')}
          </TabsTrigger>
          <TabsTrigger value="financials" className="flex-1 text-[11px] gap-1 data-[state=active]:bg-cyan-500/15 data-[state=active]:text-cyan-300 text-slate-500 rounded-lg">
            <DollarSign className="w-3.5 h-3.5" /> {t('stock_tab_financials')}
          </TabsTrigger>
          <TabsTrigger value="news" className="flex-1 text-[11px] gap-1 data-[state=active]:bg-cyan-500/15 data-[state=active]:text-cyan-300 text-slate-500 rounded-lg">
            <Newspaper className="w-3.5 h-3.5" /> {t('stock_tab_news')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="technicals" className="mt-3">
          <StockTechnicalsCard data={technicals} loading={technicalsLoading} currentPrice={quote?.price} />
        </TabsContent>
        <TabsContent value="sentiment" className="mt-3">
          <StockSentimentCard data={sentiment} loading={sentimentLoading} />
        </TabsContent>
        <TabsContent value="financials" className="mt-3">
          <StockFinancialsCard data={financials} loading={financialsLoading} />
        </TabsContent>
        <TabsContent value="news" className="mt-3">
          <StockNewsCard data={news} loading={newsLoading} />
        </TabsContent>
      </Tabs>

      <StockProfileCard profile={profile} loading={profileLoading} />
    </div>
  );
}

export default Stocks;
