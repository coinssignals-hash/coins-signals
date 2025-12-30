import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Star, X, Loader2, TrendingUp, Bitcoin } from 'lucide-react';
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

export function SymbolSearch({ value, onChange, className }: SymbolSearchProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'forex' | 'crypto'>('all');
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavoriteSymbols();

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
      setResults(data?.data || []);
    } catch (error) {
      console.error('Error searching symbols:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchSymbols(query, activeTab);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, activeTab, searchSymbols]);

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
    if (t.includes('crypto') || t.includes('digital')) {
      return <Bitcoin className="h-3 w-3" />;
    }
    return <TrendingUp className="h-3 w-3" />;
  };

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
          placeholder="Buscar símbolo (ej: EUR/USD, BTC/USD)..."
          className="pl-9 pr-9"
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
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-border">
            {(['all', 'forex', 'crypto'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-1 px-3 py-2 text-xs font-medium transition-colors",
                  activeTab === tab
                    ? "bg-primary/10 text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {tab === 'all' ? 'Todos' : tab === 'forex' ? 'Forex' : 'Crypto'}
              </button>
            ))}
          </div>

          {/* Favorites Section */}
          {favorites.length > 0 && query.length < 2 && (
            <div className="p-2 border-b border-border">
              <p className="text-xs text-muted-foreground mb-2 px-1">Favoritos</p>
              <div className="flex flex-wrap gap-1">
                {favorites.slice(0, 8).map((fav) => (
                  <Badge
                    key={fav.id}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary/20 transition-colors"
                    onClick={() => handleSelect(fav.symbol)}
                  >
                    <Star className="h-2.5 w-2.5 mr-1 fill-yellow-500 text-yellow-500" />
                    {fav.symbol}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          <div className="max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : results.length > 0 ? (
              results.map((result) => (
                <div
                  key={`${result.symbol}-${result.exchange}`}
                  onClick={() => handleSelect(result.symbol)}
                  className="flex items-center justify-between px-3 py-2 hover:bg-muted cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex items-center justify-center w-6 h-6 rounded bg-primary/10 text-primary">
                      {getTypeIcon(result.type)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{result.symbol}</p>
                      <p className="text-xs text-muted-foreground truncate">{result.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="outline" className="text-[10px]">
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
            ) : query.length >= 2 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                No se encontraron símbolos
              </p>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-8">
                Escribe al menos 2 caracteres para buscar
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
