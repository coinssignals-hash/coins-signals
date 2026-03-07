import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Search, Loader2, X, TrendingUp, Coins, Building2, BarChart3, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
}

const TYPE_TABS = [
  { key: 'all', label: 'Todos' },
  { key: 'forex', label: 'Forex' },
  { key: 'stock', label: 'Acciones' },
  { key: 'etf', label: 'ETFs' },
  { key: 'crypto', label: 'Crypto' },
  { key: 'index', label: 'Índices' },
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

export function AISymbolSearch({ value, onChange, onSelect }: Props) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const loadDefaults = useCallback(async (type: string) => {
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
      searchSymbols(upper, activeTab);
    }, 350);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (query.length >= 2) {
      searchSymbols(query, tab);
    }
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

  return (
    <div ref={containerRef} className="relative flex-1">
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400/40" />
        <input
          type="text"
          placeholder="Buscar símbolo: AAPL, EUR/USD, BTC..."
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => { if (results.length > 0 || query.length >= 2) setOpen(true); }}
          className="w-full pl-9 pr-16 py-2.5 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 transition-all"
          style={{
            background: 'hsl(210, 100%, 8%)',
            border: '1px solid hsl(200, 60%, 20%)',
          }}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {loading && <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />}
          {query && !loading && (
            <button onClick={handleClear} className="p-1 rounded hover:bg-slate-700/50 text-slate-500 hover:text-slate-300 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {open && (query.length >= 2) && (
        <div
          className="absolute z-50 top-full mt-1.5 left-0 right-0 rounded-xl overflow-hidden shadow-2xl"
          style={{
            background: 'hsl(210, 80%, 6%)',
            border: '1px solid hsl(200, 50%, 20%)',
            maxHeight: '380px',
          }}
        >
          {/* Type filter tabs */}
          <div className="flex items-center gap-0.5 px-2 py-2 overflow-x-auto scrollbar-none"
            style={{ borderBottom: '1px solid hsl(210, 50%, 14%)' }}>
            {TYPE_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all",
                  activeTab === tab.key
                    ? "text-white"
                    : "text-slate-500 hover:text-slate-300"
                )}
                style={activeTab === tab.key ? {
                  background: 'hsl(200, 80%, 15%)',
                  border: '1px solid hsl(200, 60%, 30%)',
                } : {
                  border: '1px solid transparent',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Results */}
          <div className="overflow-y-auto" style={{ maxHeight: '310px' }}>
            {results.length === 0 && !loading && (
              <div className="py-8 text-center">
                <Search className="w-5 h-5 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500">
                  {query.length < 2 ? 'Escribe al menos 2 caracteres' : 'Sin resultados'}
                </p>
              </div>
            )}

            {results.map((item, i) => {
              const typeKey = item.type?.toLowerCase() || '';
              const config = TYPE_CONFIG[typeKey] || TYPE_CONFIG['forex'];
              const IconComp = config.icon;

              return (
                <button
                  key={`${item.symbol}-${item.exchange}-${i}`}
                  onClick={() => handleSelect(item.symbol)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 transition-colors hover:bg-white/5 text-left"
                  style={{ borderBottom: '1px solid hsl(210, 50%, 10%)' }}
                >
                  {/* Type icon */}
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: config.bg, border: `1px solid ${config.color}30` }}
                  >
                    <IconComp className="w-3.5 h-3.5" style={{ color: config.color }} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-bold text-white font-mono">{item.symbol}</span>
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide"
                        style={{ background: config.bg, color: config.color, border: `1px solid ${config.color}30` }}
                      >
                        {getTypeLabel(item.type)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{item.name}</p>
                  </div>

                  {/* Exchange */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-[10px] text-slate-400 font-mono">{item.exchange}</div>
                    {item.country && (
                      <div className="text-[9px] text-slate-600">{item.country}</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
