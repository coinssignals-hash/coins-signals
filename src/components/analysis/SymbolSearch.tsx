import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, Star, X, Loader2, TrendingUp, Bitcoin, Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useFavoriteSymbols } from '@/hooks/useFavoriteSymbols';

interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
  country: string;
  currency: string;
}

interface SymbolSearchProps {
  value: string;
  onChange: (symbol: string) => void;
  className?: string;
}

// Pre-defined Forex pairs
const FOREX_PAIRS: SearchResult[] = [
  // Majors
  { symbol: 'EUR/USD', name: 'Euro / Dólar', exchange: 'Forex', type: 'Forex', country: 'EU', currency: 'USD' },
  { symbol: 'GBP/USD', name: 'Libra / Dólar', exchange: 'Forex', type: 'Forex', country: 'GB', currency: 'USD' },
  { symbol: 'USD/JPY', name: 'Dólar / Yen', exchange: 'Forex', type: 'Forex', country: 'US', currency: 'JPY' },
  { symbol: 'USD/CHF', name: 'Dólar / Franco', exchange: 'Forex', type: 'Forex', country: 'US', currency: 'CHF' },
  { symbol: 'AUD/USD', name: 'Aussie / Dólar', exchange: 'Forex', type: 'Forex', country: 'AU', currency: 'USD' },
  { symbol: 'USD/CAD', name: 'Dólar / Canadiense', exchange: 'Forex', type: 'Forex', country: 'US', currency: 'CAD' },
  { symbol: 'NZD/USD', name: 'Kiwi / Dólar', exchange: 'Forex', type: 'Forex', country: 'NZ', currency: 'USD' },
  // Euro Crosses
  { symbol: 'EUR/GBP', name: 'Euro / Libra', exchange: 'Forex', type: 'Forex', country: 'EU', currency: 'GBP' },
  { symbol: 'EUR/JPY', name: 'Euro / Yen', exchange: 'Forex', type: 'Forex', country: 'EU', currency: 'JPY' },
  { symbol: 'EUR/CHF', name: 'Euro / Franco', exchange: 'Forex', type: 'Forex', country: 'EU', currency: 'CHF' },
  { symbol: 'EUR/AUD', name: 'Euro / Aussie', exchange: 'Forex', type: 'Forex', country: 'EU', currency: 'AUD' },
  { symbol: 'EUR/CAD', name: 'Euro / Canadiense', exchange: 'Forex', type: 'Forex', country: 'EU', currency: 'CAD' },
  { symbol: 'EUR/NZD', name: 'Euro / Kiwi', exchange: 'Forex', type: 'Forex', country: 'EU', currency: 'NZD' },
  // GBP Crosses
  { symbol: 'GBP/JPY', name: 'Libra / Yen', exchange: 'Forex', type: 'Forex', country: 'GB', currency: 'JPY' },
  { symbol: 'GBP/CHF', name: 'Libra / Franco', exchange: 'Forex', type: 'Forex', country: 'GB', currency: 'CHF' },
  { symbol: 'GBP/AUD', name: 'Libra / Aussie', exchange: 'Forex', type: 'Forex', country: 'GB', currency: 'AUD' },
  { symbol: 'GBP/CAD', name: 'Libra / Canadiense', exchange: 'Forex', type: 'Forex', country: 'GB', currency: 'CAD' },
  { symbol: 'GBP/NZD', name: 'Libra / Kiwi', exchange: 'Forex', type: 'Forex', country: 'GB', currency: 'NZD' },
  // JPY Crosses
  { symbol: 'AUD/JPY', name: 'Aussie / Yen', exchange: 'Forex', type: 'Forex', country: 'AU', currency: 'JPY' },
  { symbol: 'CAD/JPY', name: 'Canadiense / Yen', exchange: 'Forex', type: 'Forex', country: 'CA', currency: 'JPY' },
  { symbol: 'CHF/JPY', name: 'Franco / Yen', exchange: 'Forex', type: 'Forex', country: 'CH', currency: 'JPY' },
  { symbol: 'NZD/JPY', name: 'Kiwi / Yen', exchange: 'Forex', type: 'Forex', country: 'NZ', currency: 'JPY' },
  // Commodity Pairs
  { symbol: 'AUD/CAD', name: 'Aussie / Canadiense', exchange: 'Forex', type: 'Forex', country: 'AU', currency: 'CAD' },
  { symbol: 'AUD/NZD', name: 'Aussie / Kiwi', exchange: 'Forex', type: 'Forex', country: 'AU', currency: 'NZD' },
  { symbol: 'AUD/CHF', name: 'Aussie / Franco', exchange: 'Forex', type: 'Forex', country: 'AU', currency: 'CHF' },
  { symbol: 'CAD/CHF', name: 'Canadiense / Franco', exchange: 'Forex', type: 'Forex', country: 'CA', currency: 'CHF' },
  { symbol: 'NZD/CAD', name: 'Kiwi / Canadiense', exchange: 'Forex', type: 'Forex', country: 'NZ', currency: 'CAD' },
  { symbol: 'NZD/CHF', name: 'Kiwi / Franco', exchange: 'Forex', type: 'Forex', country: 'NZ', currency: 'CHF' },
  // Exotics
  { symbol: 'USD/MXN', name: 'Dólar / Peso Mexicano', exchange: 'Forex', type: 'Forex', country: 'US', currency: 'MXN' },
  { symbol: 'USD/BRL', name: 'Dólar / Real Brasileño', exchange: 'Forex', type: 'Forex', country: 'US', currency: 'BRL' },
  { symbol: 'USD/ZAR', name: 'Dólar / Rand', exchange: 'Forex', type: 'Forex', country: 'US', currency: 'ZAR' },
  { symbol: 'USD/TRY', name: 'Dólar / Lira Turca', exchange: 'Forex', type: 'Forex', country: 'US', currency: 'TRY' },
  { symbol: 'USD/PLN', name: 'Dólar / Zloty', exchange: 'Forex', type: 'Forex', country: 'US', currency: 'PLN' },
  { symbol: 'USD/SGD', name: 'Dólar / Singapur', exchange: 'Forex', type: 'Forex', country: 'US', currency: 'SGD' },
  { symbol: 'USD/HKD', name: 'Dólar / Hong Kong', exchange: 'Forex', type: 'Forex', country: 'US', currency: 'HKD' },
  { symbol: 'USD/CNH', name: 'Dólar / Yuan Offshore', exchange: 'Forex', type: 'Forex', country: 'US', currency: 'CNH' },
  { symbol: 'USD/INR', name: 'Dólar / Rupia India', exchange: 'Forex', type: 'Forex', country: 'US', currency: 'INR' },
  { symbol: 'USD/THB', name: 'Dólar / Baht', exchange: 'Forex', type: 'Forex', country: 'US', currency: 'THB' },
  { symbol: 'EUR/TRY', name: 'Euro / Lira Turca', exchange: 'Forex', type: 'Forex', country: 'EU', currency: 'TRY' },
  { symbol: 'EUR/PLN', name: 'Euro / Zloty', exchange: 'Forex', type: 'Forex', country: 'EU', currency: 'PLN' },
  { symbol: 'EUR/SEK', name: 'Euro / Corona Sueca', exchange: 'Forex', type: 'Forex', country: 'EU', currency: 'SEK' },
  { symbol: 'EUR/NOK', name: 'Euro / Corona Noruega', exchange: 'Forex', type: 'Forex', country: 'EU', currency: 'NOK' },
  { symbol: 'EUR/CZK', name: 'Euro / Corona Checa', exchange: 'Forex', type: 'Forex', country: 'EU', currency: 'CZK' },
];

// Pre-defined Crypto pairs
const CRYPTO_PAIRS: SearchResult[] = [
  // Major Cryptos
  { symbol: 'BTC/USD', name: 'Bitcoin', exchange: 'Crypto', type: 'Crypto', country: '', currency: 'USD' },
  { symbol: 'ETH/USD', name: 'Ethereum', exchange: 'Crypto', type: 'Crypto', country: '', currency: 'USD' },
  { symbol: 'BNB/USD', name: 'Binance Coin', exchange: 'Crypto', type: 'Crypto', country: '', currency: 'USD' },
  { symbol: 'XRP/USD', name: 'Ripple', exchange: 'Crypto', type: 'Crypto', country: '', currency: 'USD' },
  { symbol: 'SOL/USD', name: 'Solana', exchange: 'Crypto', type: 'Crypto', country: '', currency: 'USD' },
  { symbol: 'ADA/USD', name: 'Cardano', exchange: 'Crypto', type: 'Crypto', country: '', currency: 'USD' },
  { symbol: 'DOGE/USD', name: 'Dogecoin', exchange: 'Crypto', type: 'Crypto', country: '', currency: 'USD' },
  { symbol: 'DOT/USD', name: 'Polkadot', exchange: 'Crypto', type: 'Crypto', country: '', currency: 'USD' },
  { symbol: 'AVAX/USD', name: 'Avalanche', exchange: 'Crypto', type: 'Crypto', country: '', currency: 'USD' },
  { symbol: 'MATIC/USD', name: 'Polygon', exchange: 'Crypto', type: 'Crypto', country: '', currency: 'USD' },
  { symbol: 'LTC/USD', name: 'Litecoin', exchange: 'Crypto', type: 'Crypto', country: '', currency: 'USD' },
  { symbol: 'ATOM/USD', name: 'Cosmos', exchange: 'Crypto', type: 'Crypto', country: '', currency: 'USD' },
  { symbol: 'NEAR/USD', name: 'NEAR Protocol', exchange: 'Crypto', type: 'Crypto', country: '', currency: 'USD' },
  { symbol: 'FTM/USD', name: 'Fantom', exchange: 'Crypto', type: 'Crypto', country: '', currency: 'USD' },
  { symbol: 'ALGO/USD', name: 'Algorand', exchange: 'Crypto', type: 'Crypto', country: '', currency: 'USD' },
  // DeFi
  { symbol: 'LINK/USD', name: 'Chainlink', exchange: 'Crypto', type: 'DeFi', country: '', currency: 'USD' },
  { symbol: 'UNI/USD', name: 'Uniswap', exchange: 'Crypto', type: 'DeFi', country: '', currency: 'USD' },
  { symbol: 'AAVE/USD', name: 'Aave', exchange: 'Crypto', type: 'DeFi', country: '', currency: 'USD' },
  { symbol: 'MKR/USD', name: 'Maker', exchange: 'Crypto', type: 'DeFi', country: '', currency: 'USD' },
  { symbol: 'CRV/USD', name: 'Curve DAO', exchange: 'Crypto', type: 'DeFi', country: '', currency: 'USD' },
  { symbol: 'SNX/USD', name: 'Synthetix', exchange: 'Crypto', type: 'DeFi', country: '', currency: 'USD' },
  { symbol: 'COMP/USD', name: 'Compound', exchange: 'Crypto', type: 'DeFi', country: '', currency: 'USD' },
  { symbol: 'SUSHI/USD', name: 'SushiSwap', exchange: 'Crypto', type: 'DeFi', country: '', currency: 'USD' },
  { symbol: '1INCH/USD', name: '1inch', exchange: 'Crypto', type: 'DeFi', country: '', currency: 'USD' },
  // Layer 2
  { symbol: 'ARB/USD', name: 'Arbitrum', exchange: 'Crypto', type: 'Layer2', country: '', currency: 'USD' },
  { symbol: 'OP/USD', name: 'Optimism', exchange: 'Crypto', type: 'Layer2', country: '', currency: 'USD' },
  { symbol: 'IMX/USD', name: 'Immutable X', exchange: 'Crypto', type: 'Layer2', country: '', currency: 'USD' },
  { symbol: 'LRC/USD', name: 'Loopring', exchange: 'Crypto', type: 'Layer2', country: '', currency: 'USD' },
  { symbol: 'STRK/USD', name: 'StarkNet', exchange: 'Crypto', type: 'Layer2', country: '', currency: 'USD' },
  // Memecoins
  { symbol: 'SHIB/USD', name: 'Shiba Inu', exchange: 'Crypto', type: 'Meme', country: '', currency: 'USD' },
  { symbol: 'PEPE/USD', name: 'Pepe', exchange: 'Crypto', type: 'Meme', country: '', currency: 'USD' },
  { symbol: 'FLOKI/USD', name: 'Floki Inu', exchange: 'Crypto', type: 'Meme', country: '', currency: 'USD' },
  { symbol: 'BONK/USD', name: 'Bonk', exchange: 'Crypto', type: 'Meme', country: '', currency: 'USD' },
  { symbol: 'WIF/USD', name: 'Dogwifhat', exchange: 'Crypto', type: 'Meme', country: '', currency: 'USD' },
  // New/Emerging
  { symbol: 'SUI/USD', name: 'Sui', exchange: 'Crypto', type: 'Crypto', country: '', currency: 'USD' },
  { symbol: 'APT/USD', name: 'Aptos', exchange: 'Crypto', type: 'Crypto', country: '', currency: 'USD' },
  { symbol: 'SEI/USD', name: 'Sei', exchange: 'Crypto', type: 'Crypto', country: '', currency: 'USD' },
  { symbol: 'TIA/USD', name: 'Celestia', exchange: 'Crypto', type: 'Crypto', country: '', currency: 'USD' },
  { symbol: 'INJ/USD', name: 'Injective', exchange: 'Crypto', type: 'Crypto', country: '', currency: 'USD' },
  { symbol: 'JUP/USD', name: 'Jupiter', exchange: 'Crypto', type: 'Crypto', country: '', currency: 'USD' },
  { symbol: 'PYTH/USD', name: 'Pyth Network', exchange: 'Crypto', type: 'Crypto', country: '', currency: 'USD' },
  { symbol: 'WLD/USD', name: 'Worldcoin', exchange: 'Crypto', type: 'Crypto', country: '', currency: 'USD' },
  { symbol: 'BLUR/USD', name: 'Blur', exchange: 'Crypto', type: 'Crypto', country: '', currency: 'USD' },
  // BTC Pairs
  { symbol: 'ETH/BTC', name: 'Ethereum', exchange: 'Crypto', type: 'BTC Pair', country: '', currency: 'BTC' },
  { symbol: 'BNB/BTC', name: 'Binance Coin', exchange: 'Crypto', type: 'BTC Pair', country: '', currency: 'BTC' },
  { symbol: 'XRP/BTC', name: 'Ripple', exchange: 'Crypto', type: 'BTC Pair', country: '', currency: 'BTC' },
  { symbol: 'SOL/BTC', name: 'Solana', exchange: 'Crypto', type: 'BTC Pair', country: '', currency: 'BTC' },
  { symbol: 'ADA/BTC', name: 'Cardano', exchange: 'Crypto', type: 'BTC Pair', country: '', currency: 'BTC' },
  { symbol: 'DOGE/BTC', name: 'Dogecoin', exchange: 'Crypto', type: 'BTC Pair', country: '', currency: 'BTC' },
];

const ALL_LOCAL_PAIRS = [...FOREX_PAIRS, ...CRYPTO_PAIRS];

export function SymbolSearch({ value, onChange, className }: SymbolSearchProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'forex' | 'crypto'>('all');
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavoriteSymbols();

  // Filter local pairs based on query and tab
  const localResults = useMemo(() => {
    const searchQuery = query.toLowerCase().trim();
    let pairs: SearchResult[] = [];

    if (activeTab === 'all') {
      pairs = ALL_LOCAL_PAIRS;
    } else if (activeTab === 'forex') {
      pairs = FOREX_PAIRS;
    } else {
      pairs = CRYPTO_PAIRS;
    }

    if (!searchQuery) {
      return pairs.slice(0, 20);
    }

    return pairs.filter(pair =>
      pair.symbol.toLowerCase().includes(searchQuery) ||
      pair.name.toLowerCase().includes(searchQuery)
    );
  }, [query, activeTab]);

  const searchSymbols = useCallback(async (searchQuery: string, type: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('symbol-search', {
        body: { query: searchQuery, type }
      });

      if (error) throw error;
      
      // Merge API results with local matches, removing duplicates
      const apiResults = data?.data || [];
      const localMatches = localResults;
      const seen = new Set(localMatches.map(r => r.symbol));
      const uniqueApiResults = apiResults.filter((r: SearchResult) => !seen.has(r.symbol));
      
      setResults([...localMatches, ...uniqueApiResults]);
    } catch (error) {
      console.error('Error searching symbols:', error);
      // Fallback to local results only
      setResults(localResults);
    } finally {
      setIsLoading(false);
    }
  }, [localResults]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Show local results immediately
    setResults(localResults);

    // Search API only if query is long enough
    if (query.length >= 2) {
      debounceRef.current = setTimeout(() => {
        searchSymbols(query, activeTab);
      }, 300);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, activeTab, searchSymbols, localResults]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (symbol: string) => {
    setQuery(symbol);
    onChange(symbol);
    setIsOpen(false);
  };

  const handleFavoriteToggle = async (e: React.MouseEvent, result: SearchResult) => {
    e.stopPropagation();
    if (isFavorite(result.symbol)) {
      await removeFavorite(result.symbol);
    } else {
      await addFavorite(result.symbol, result.name, result.type);
    }
  };

  const getTypeIcon = (type: string) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('crypto') || t.includes('digital') || t.includes('defi') || t.includes('meme') || t.includes('layer2') || t.includes('btc pair')) {
      return <Bitcoin className="h-3 w-3" />;
    }
    if (t.includes('forex')) {
      return <Globe className="h-3 w-3" />;
    }
    return <TrendingUp className="h-3 w-3" />;
  };

  const getTypeColor = (type: string) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('defi')) return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
    if (t.includes('meme')) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    if (t.includes('layer2')) return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    if (t.includes('btc pair')) return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
    if (t.includes('crypto')) return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
    if (t.includes('forex')) return 'bg-green-500/20 text-green-400 border-green-500/50';
    return '';
  };

  // Count by category
  const forexCount = FOREX_PAIRS.length;
  const cryptoCount = CRYPTO_PAIRS.length;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Buscar símbolo..."
          className="pl-9 pr-9 bg-[#0a1a0a] border-green-900/50"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-[#0a1a0a] border border-green-900/50 rounded-lg shadow-lg overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-green-900/50">
            {([
              { key: 'all', label: 'Todos', count: forexCount + cryptoCount },
              { key: 'forex', label: 'Forex', count: forexCount },
              { key: 'crypto', label: 'Crypto', count: cryptoCount },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex-1 px-3 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1",
                  activeTab === tab.key
                    ? "bg-green-900/30 text-green-400 border-b-2 border-green-500"
                    : "text-muted-foreground hover:bg-green-900/10"
                )}
              >
                {tab.key === 'forex' && <Globe className="h-3 w-3" />}
                {tab.key === 'crypto' && <Bitcoin className="h-3 w-3" />}
                {tab.label}
                <span className="text-[10px] opacity-60">({tab.count})</span>
              </button>
            ))}
          </div>

          {/* Favorites Section */}
          {favorites.length > 0 && query.length < 2 && (
            <div className="p-2 border-b border-green-900/50">
              <p className="text-xs text-muted-foreground mb-2 px-1 flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                Favoritos
              </p>
              <div className="flex flex-wrap gap-1">
                {favorites.slice(0, 10).map((fav) => (
                  <Badge
                    key={fav.id}
                    variant="secondary"
                    className="cursor-pointer hover:bg-green-900/30 transition-colors text-xs"
                    onClick={() => handleSelect(fav.symbol)}
                  >
                    {fav.symbol}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          <div className="max-h-72 overflow-y-auto">
            {isLoading && results.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-green-500" />
              </div>
            ) : results.length > 0 ? (
              results.slice(0, 30).map((result) => (
                <div
                  key={`${result.symbol}-${result.exchange}`}
                  onClick={() => handleSelect(result.symbol)}
                  className="flex items-center justify-between px-3 py-2 hover:bg-green-900/20 cursor-pointer transition-colors border-b border-green-900/20 last:border-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={cn(
                      "flex items-center justify-center w-7 h-7 rounded",
                      result.type.toLowerCase().includes('forex') 
                        ? "bg-green-900/30 text-green-400"
                        : "bg-amber-900/30 text-amber-400"
                    )}>
                      {getTypeIcon(result.type)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono font-medium text-sm text-white">{result.symbol}</p>
                      <p className="text-xs text-muted-foreground truncate">{result.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge 
                      variant="outline" 
                      className={cn("text-[10px] border", getTypeColor(result.type))}
                    >
                      {result.type}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => handleFavoriteToggle(e, result)}
                    >
                      <Star
                        className={cn(
                          "h-3.5 w-3.5 transition-colors",
                          isFavorite(result.symbol)
                            ? "fill-yellow-500 text-yellow-500"
                            : "text-muted-foreground"
                        )}
                      />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-muted-foreground py-8">
                No se encontraron símbolos
              </p>
            )}
          </div>

          {/* Footer with loading indicator */}
          {isLoading && results.length > 0 && (
            <div className="px-3 py-2 border-t border-green-900/50 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Buscando más resultados...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
