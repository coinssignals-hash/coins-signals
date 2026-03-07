import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Search, Loader2, X, TrendingUp, Coins, Building2, BarChart3, Globe, Star, Sparkles } from 'lucide-react';
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

interface Props {
  value: string;
  onChange: (symbol: string) => void;
  onSelect: (symbol: string) => void;
  activeCategory?: string;
}

export const INSTRUMENT_TABS = [
  { key: 'all', label: 'Todos', icon: Sparkles, color: 'hsl(200, 90%, 55%)' },
  { key: 'favorites', label: 'Favoritos', icon: Star, color: 'hsl(45, 90%, 55%)' },
  { key: 'forex', label: 'Forex', icon: TrendingUp, color: 'hsl(200, 90%, 55%)' },
  { key: 'stock', label: 'Acciones', icon: Building2, color: 'hsl(160, 70%, 50%)' },
  { key: 'etf', label: 'ETFs', icon: BarChart3, color: 'hsl(270, 70%, 60%)' },
  { key: 'crypto', label: 'Crypto', icon: Coins, color: 'hsl(45, 90%, 55%)' },
  { key: 'index', label: 'Índices', icon: Globe, color: 'hsl(350, 70%, 55%)' },
] as const;

const TYPE_CONFIG: Record<string, { icon: typeof TrendingUp; color: string; bg: string }> = {
  'forex': { icon: TrendingUp, color: 'hsl(200, 90%, 55%)', bg: 'hsl(200, 80%, 15%)' },
  'currency': { icon: TrendingUp, color: 'hsl(200, 90%, 55%)', bg: 'hsl(200, 80%, 15%)' },
  'cryptocurrency': { icon: Coins, color: 'hsl(45, 90%, 55%)', bg: 'hsl(45, 60%, 12%)' },
  'digital currency': { icon: Coins, color: 'hsl(45, 90%, 55%)', bg: 'hsl(45, 60%, 12%)' },
  'common stock': { icon: Building2, color: 'hsl(160, 70%, 50%)', bg: 'hsl(160, 50%, 10%)' },
  'equity': { icon: Building2, color: 'hsl(160, 70%, 50%)', bg: 'hsl(160, 50%, 10%)' },
  'etf': { icon: BarChart3, color: 'hsl(270, 70%, 60%)', bg: 'hsl(270, 50%, 12%)' },
  'index': { icon: Globe, color: 'hsl(350, 70%, 55%)', bg: 'hsl(350, 50%, 12%)' },
};

function getTypeLabel(type: string): string {
  const t = type?.toLowerCase() || '';
  if (t === 'forex' || t === 'currency') return 'Forex';
  if (t === 'cryptocurrency' || t === 'digital currency') return 'Crypto';
  if (t === 'common stock' || t === 'equity') return 'Acción';
  if (t === 'etf') return 'ETF';
  if (t === 'index') return 'Índice';
  return type || '—';
}

export function AISymbolSearch({ value, onChange, onSelect, activeCategory = 'all' }: Props) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const prevCategoryRef = useRef(activeCategory);

  const { favorites, isFavorite, addFavorite, removeFavorite } = useFavoriteSymbols();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // React to external category changes
  useEffect(() => {
    if (prevCategoryRef.current !== activeCategory) {
      prevCategoryRef.current = activeCategory;
      if (activeCategory === 'favorites') return;
      if (query.length >= 2) {
        searchSymbols(query, activeCategory);
      } else {
        loadDefaults(activeCategory);
      }
      setOpen(true);
    }
  }, [activeCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDefaults = useCallback(async (type: string) => {
    if (type === 'favorites') return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('symbol-search', {
        body: { query: 'popular', type, defaults: true },
      });
      if (!error && data?.data) {
        setResults(data.data);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  const searchSymbols = useCallback(async (q: string, type: string) => {
    if (type === 'favorites') return;
    if (q.length < 2) {
      await loadDefaults(type);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('symbol-search', {
        body: { query: q, type },
      });
      if (!error && data?.data) {
        setResults(data.data);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [loadDefaults]);

  const handleInputChange = (val: string) => {
    const upper = val.toUpperCase();
    setQuery(upper);
    onChange(upper);
    setOpen(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchSymbols(upper, activeCategory === 'favorites' ? 'all' : activeCategory);
    }, 350);
  };

  const handleSelect = (symbol: string) => {
    setQuery(symbol);
    onChange(symbol);
    onSelect(symbol);
    setOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    onChange('');
    setResults([]);
  };

  const handleToggleFavorite = (e: React.MouseEvent, item: SearchResult) => {
    e.stopPropagation();
    if (isFavorite(item.symbol)) {
      removeFavorite(item.symbol);
    } else {
      addFavorite(item.symbol, item.name, getTypeLabel(item.type));
    }
  };

  const handleToggleFavoriteBySymbol = (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation();
    removeFavorite(symbol);
  };

  const showFavorites = activeCategory === 'favorites';
  const favoriteResults: SearchResult[] = favorites.map(f => ({
    symbol: f.symbol,
    name: f.symbol_name || '',
    exchange: '',
    type: f.symbol_type?.toLowerCase() || 'forex',
    country: '',
    currency: '',
  }));

  const displayResults = showFavorites ? favoriteResults : results;

  return (
    <div ref={containerRef} className="relative flex-1">
      {/* Search Input */}
      <div className="relative group">
        <div
          className="absolute -inset-[1px] rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, hsl(200, 90%, 50%), hsl(270, 80%, 55%), hsl(200, 90%, 50%))',
            filter: 'blur(4px)',
          }}
        />
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors"
            style={{ color: 'hsl(200, 60%, 40%)' }} />
          <input
            type="text"
            placeholder="Buscar: AAPL, EUR/USD, BTC..."
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => { setOpen(true); if (results.length === 0 && !showFavorites) loadDefaults(activeCategory); }}
            className="w-full pl-10 pr-16 py-3 rounded-2xl text-sm text-white placeholder:text-slate-600 focus:outline-none transition-all font-medium"
            style={{
              background: 'radial-gradient(ellipse at top left, hsl(210, 80%, 10%) 0%, hsl(210, 100%, 6%) 100%)',
              border: '1px solid hsl(200, 50%, 18%)',
            }}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {loading && <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'hsl(200, 90%, 55%)' }} />}
            {query && !loading && (
              <button
                onClick={handleClear}
                className="p-1 rounded-lg transition-all hover:scale-110 active:scale-90"
                style={{ background: 'hsl(210, 40%, 14%)', color: 'hsl(210, 20%, 50%)' }}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dropdown Panel */}
      {open && (
        <div
          className="absolute z-50 top-full mt-2 left-0 right-0 rounded-2xl overflow-hidden"
          style={{
            background: 'radial-gradient(ellipse at top center, hsl(210, 70%, 8%) 0%, hsl(210, 100%, 4%) 100%)',
            border: '1px solid hsl(200, 40%, 16%)',
            boxShadow: '0 20px 60px -12px hsla(210, 80%, 5%, 0.8), 0 0 40px -8px hsla(200, 90%, 50%, 0.08)',
            maxHeight: '400px',
          }}
        >
          {/* Accent top line */}
          <div
            className="h-[1.5px]"
            style={{
              background: 'linear-gradient(90deg, transparent, hsl(200, 90%, 50%), hsl(270, 80%, 55%), hsl(200, 90%, 50%), transparent)',
            }}
          />

          {/* Favorites quick-access chips */}
          {!showFavorites && favorites.length > 0 && (
            <div
              className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto scrollbar-none"
              style={{
                borderBottom: '1px solid hsl(210, 40%, 10%)',
                background: 'hsl(45, 30%, 5%)',
              }}
            >
              <Star className="w-3 h-3 flex-shrink-0 fill-current" style={{ color: 'hsl(45, 90%, 50%)' }} />
              {favorites.slice(0, 8).map((fav) => {
                const favType = fav.symbol_type?.toLowerCase() || 'forex';
                const favConfig = TYPE_CONFIG[favType] || TYPE_CONFIG['forex'];
                return (
                  <button
                    key={fav.id}
                    onClick={() => handleSelect(fav.symbol)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono text-white whitespace-nowrap transition-all duration-150 hover:scale-105 active:scale-95"
                    style={{
                      background: `linear-gradient(135deg, ${favConfig.bg}, hsl(210, 60%, 8%))`,
                      border: `1px solid ${favConfig.color}25`,
                    }}
                  >
                    {fav.symbol}
                  </button>
                );
              })}
            </div>
          )}

          {/* Results List */}
          <div className="overflow-y-auto" style={{ maxHeight: '320px' }}>
            {showFavorites && favorites.length === 0 && (
              <div className="py-10 text-center">
                <div
                  className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, hsl(45, 60%, 12%), hsl(45, 40%, 8%))',
                    border: '1px solid hsl(45, 40%, 20%)',
                  }}
                >
                  <Star className="w-5 h-5" style={{ color: 'hsl(45, 50%, 35%)' }} />
                </div>
                <p className="text-[12px] text-slate-400 font-medium">No tienes favoritos aún</p>
                <p className="text-[10px] text-slate-600 mt-1">Toca ⭐ en cualquier símbolo para guardarlo</p>
              </div>
            )}

            {!showFavorites && displayResults.length === 0 && !loading && (
              <div className="py-10 text-center">
                <div
                  className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, hsl(210, 60%, 12%), hsl(210, 40%, 8%))',
                    border: '1px solid hsl(210, 40%, 18%)',
                  }}
                >
                  <Search className="w-5 h-5" style={{ color: 'hsl(210, 40%, 35%)' }} />
                </div>
                <p className="text-[12px] text-slate-400 font-medium">
                  {query.length < 2 ? 'Escribe al menos 2 caracteres' : 'Sin resultados'}
                </p>
              </div>
            )}

            {loading && displayResults.length === 0 && (
              <div className="px-3 py-2 space-y-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-2 py-2.5 rounded-xl animate-pulse">
                    <div className="w-8 h-8 rounded-xl" style={{ background: 'hsl(210, 40%, 12%)' }} />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-20 rounded" style={{ background: 'hsl(210, 40%, 12%)' }} />
                      <div className="h-2.5 w-32 rounded" style={{ background: 'hsl(210, 40%, 10%)' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {displayResults.map((item, i) => {
              const typeKey = item.type?.toLowerCase() || '';
              const config = TYPE_CONFIG[typeKey] || TYPE_CONFIG['forex'];
              const IconComp = config.icon;
              const starred = isFavorite(item.symbol);

              return (
                <button
                  key={`${item.symbol}-${item.exchange}-${i}`}
                  onClick={() => handleSelect(item.symbol)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 transition-all duration-150 text-left group hover:bg-white/[0.04]"
                  style={{ borderBottom: '1px solid hsl(210, 40%, 8%)' }}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-150 group-hover:scale-110"
                    style={{
                      background: `linear-gradient(135deg, ${config.bg}, ${config.color}10)`,
                      border: `1px solid ${config.color}25`,
                    }}
                  >
                    <IconComp className="w-3.5 h-3.5" style={{ color: config.color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold text-white font-mono tracking-wide">{item.symbol}</span>
                      <span
                        className="text-[8px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider"
                        style={{
                          background: `${config.color}12`,
                          color: config.color,
                          border: `1px solid ${config.color}20`,
                        }}
                      >
                        {getTypeLabel(item.type)}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{item.name}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {showFavorites ? (
                      <button
                        onClick={(e) => handleToggleFavoriteBySymbol(e, item.symbol)}
                        className="p-1.5 rounded-lg transition-all duration-150 hover:scale-110 active:scale-90"
                        style={{
                          background: 'linear-gradient(135deg, hsl(45, 60%, 15%), hsl(45, 40%, 10%))',
                          border: '1px solid hsl(45, 50%, 28%)',
                        }}
                        title="Eliminar de favoritos"
                      >
                        <Star className="w-3 h-3 fill-current" style={{ color: 'hsl(45, 90%, 55%)' }} />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handleToggleFavorite(e, item)}
                        className={cn(
                          "p-1.5 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100",
                          starred && "opacity-100"
                        )}
                        style={starred ? {
                          background: 'linear-gradient(135deg, hsl(45, 60%, 15%), hsl(45, 40%, 10%))',
                          border: '1px solid hsl(45, 50%, 28%)',
                        } : {
                          background: 'hsl(210, 30%, 10%)',
                          border: '1px solid hsl(210, 25%, 18%)',
                        }}
                        title={starred ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                      >
                        <Star
                          className={cn("w-3 h-3 transition-all", starred && "fill-current")}
                          style={{ color: starred ? 'hsl(45, 90%, 55%)' : 'hsl(210, 15%, 35%)' }}
                        />
                      </button>
                    )}
                    {item.exchange && (
                      <div className="text-right min-w-[40px]">
                        <div className="text-[9px] font-mono" style={{ color: 'hsl(210, 20%, 45%)' }}>{item.exchange}</div>
                        {item.country && (
                          <div className="text-[8px]" style={{ color: 'hsl(210, 15%, 30%)' }}>{item.country}</div>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-between px-3.5 py-2"
            style={{
              borderTop: '1px solid hsl(210, 40%, 10%)',
              background: 'hsl(210, 80%, 4%)',
            }}
          >
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'hsl(160, 70%, 50%)' }} />
              <span className="text-[9px]" style={{ color: 'hsl(210, 20%, 35%)' }}>
                {displayResults.length} resultados
              </span>
            </div>
            <span className="text-[9px] font-mono" style={{ color: 'hsl(210, 20%, 30%)' }}>
              Twelve Data
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
