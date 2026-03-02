import { useState, useMemo } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, TrendingUp, TrendingDown, Building2, Globe, Users, DollarSign, BarChart3, ArrowLeft, Activity, Brain, Newspaper } from 'lucide-react';
import { useStockSearch, useStockProfile, useStockQuote, useStockHistorical, useStockFinancials, useStockTechnicals, useStockSentiment, useStockNews, useStockAISummary } from '@/hooks/useStockData';
import { useDebounce } from '@/hooks/useDebounce';
import { StockChart } from '@/components/stocks/StockChart';
import { StockQuoteCard } from '@/components/stocks/StockQuoteCard';
import { StockProfileCard } from '@/components/stocks/StockProfileCard';
import { StockFinancialsCard } from '@/components/stocks/StockFinancialsCard';
import { StockTechnicalsCard } from '@/components/stocks/StockTechnicalsCard';
import { StockSentimentCard } from '@/components/stocks/StockSentimentCard';
import { StockNewsCard } from '@/components/stocks/StockNewsCard';
import { StockAISummaryCard } from '@/components/stocks/StockAISummaryCard';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 400);
  const { data: searchResults, isLoading: searchLoading } = useStockSearch(debouncedQuery);

  const handleSelect = (symbol: string) => {
    setSelectedSymbol(symbol);
    setSearchQuery('');
  };

  return (
    <PageShell>
      <Header />

      <div className="px-4 pt-4 pb-2 space-y-4">
        {/* Title */}
        <div className="flex items-center gap-3">
          {selectedSymbol && (
            <button
              onClick={() => setSelectedSymbol('')}
              className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              {selectedSymbol ? selectedSymbol : 'Mercado de Acciones'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {selectedSymbol ? 'Cotización y análisis' : 'Busca y analiza acciones globales'}
            </p>
          </div>
        </div>

        {/* Search */}
        {!selectedSymbol && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar acción (ej. AAPL, TSLA, MSFT)..."
              className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground"
            />
            {/* Search Results Dropdown */}
            {debouncedQuery.length >= 2 && (
              <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-xl shadow-xl max-h-60 overflow-y-auto">
                {searchLoading ? (
                  <div className="p-4 space-y-2">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                ) : searchResults && searchResults.length > 0 ? (
                  searchResults.map((r) => (
                    <button
                      key={r.symbol}
                      onClick={() => handleSelect(r.symbol)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary transition-colors text-left"
                    >
                      <div>
                        <span className="text-sm font-semibold text-foreground">{r.symbol}</span>
                        <span className="text-xs text-muted-foreground ml-2">{r.name}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{r.exchangeShortName}</Badge>
                    </button>
                  ))
                ) : (
                  <p className="p-4 text-sm text-muted-foreground text-center">Sin resultados</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {selectedSymbol ? (
        <StockDetail symbol={selectedSymbol} />
      ) : (
        <div className="px-4 space-y-4 pb-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Acciones populares</h2>
          <div className="grid grid-cols-2 gap-3">
            {POPULAR_STOCKS.map((stock) => (
              <PopularStockCard key={stock.symbol} symbol={stock.symbol} name={stock.name} onSelect={handleSelect} />
            ))}
          </div>
        </div>
      )}
    </PageShell>
  );
}

function PopularStockCard({ symbol, name, onSelect }: { symbol: string; name: string; onSelect: (s: string) => void }) {
  const { data: quote } = useStockQuote(symbol);
  const isPositive = (quote?.changesPercentage ?? 0) >= 0;

  return (
    <Card
      onClick={() => onSelect(symbol)}
      className="p-3 cursor-pointer bg-card border-border hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/5 group"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{symbol}</span>
        {isPositive ? (
          <TrendingUp className="w-4 h-4 text-[hsl(var(--bullish))]" />
        ) : (
          <TrendingDown className="w-4 h-4 text-[hsl(var(--bearish))]" />
        )}
      </div>
      <p className="text-xs text-muted-foreground truncate mb-1">{name}</p>
      {quote ? (
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-mono font-semibold text-foreground">${quote.price?.toFixed(2)}</span>
          <span className={`text-xs font-mono font-medium ${isPositive ? 'text-[hsl(var(--bullish))]' : 'text-[hsl(var(--bearish))]'}`}>
            {isPositive ? '+' : ''}{quote.changesPercentage?.toFixed(2)}%
          </span>
        </div>
      ) : (
        <Skeleton className="h-4 w-20" />
      )}
    </Card>
  );
}

function StockDetail({ symbol }: { symbol: string }) {
  const { data: profile, isLoading: profileLoading } = useStockProfile(symbol);
  const { data: quote, isLoading: quoteLoading } = useStockQuote(symbol);
  const { data: financials, isLoading: financialsLoading } = useStockFinancials(symbol);
  const { data: technicals, isLoading: technicalsLoading } = useStockTechnicals(symbol);
  const { data: sentiment, isLoading: sentimentLoading } = useStockSentiment(symbol);
  const { data: news, isLoading: newsLoading } = useStockNews(symbol);
  const { data: aiSummary, isLoading: aiLoading } = useStockAISummary(symbol);

  const [chartPeriod, setChartPeriod] = useState('3m');
  const { data: historical, isLoading: histLoading } = useStockHistorical(symbol, chartPeriod);

  return (
    <div className="px-4 space-y-3 pb-4">
      <StockQuoteCard quote={quote} loading={quoteLoading} />
      <StockAISummaryCard data={aiSummary} loading={aiLoading} currentPrice={quote?.price} />
      <StockChart data={historical ?? []} loading={histLoading} symbol={symbol} period={chartPeriod} onPeriodChange={setChartPeriod} />

      {/* Tabbed sections */}
      <Tabs defaultValue="technicals" className="w-full">
        <TabsList className="w-full bg-secondary/50">
          <TabsTrigger value="technicals" className="flex-1 text-[11px] gap-1">
            <Activity className="w-3.5 h-3.5" /> Técnico
          </TabsTrigger>
          <TabsTrigger value="sentiment" className="flex-1 text-[11px] gap-1">
            <Brain className="w-3.5 h-3.5" /> Sentimiento
          </TabsTrigger>
          <TabsTrigger value="financials" className="flex-1 text-[11px] gap-1">
            <DollarSign className="w-3.5 h-3.5" /> Finanzas
          </TabsTrigger>
          <TabsTrigger value="news" className="flex-1 text-[11px] gap-1">
            <Newspaper className="w-3.5 h-3.5" /> Noticias
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
