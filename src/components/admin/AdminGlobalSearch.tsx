import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, User, TrendingUp, ScrollText, Loader2, X } from 'lucide-react';
import { format } from 'date-fns';

interface SearchResult {
  type: 'user' | 'signal' | 'audit';
  id: string;
  title: string;
  subtitle: string;
  meta?: string;
  tabTarget: string;
}

interface AdminGlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (tab: string) => void;
}

export function AdminGlobalSearch({ open, onOpenChange, onNavigate }: AdminGlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const performSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);

    const searchLower = q.toLowerCase();
    const combined: SearchResult[] = [];

    // Search in parallel: profiles, signals, audit_logs
    const [profilesRes, signalsRes, auditRes] = await Promise.all([
      supabase.from('profiles')
        .select('id, first_name, last_name, country, created_at')
        .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,country.ilike.%${q}%,id.ilike.%${q}%`)
        .limit(8),
      supabase.from('trading_signals')
        .select('id, currency_pair, action, status, probability, created_at')
        .or(`currency_pair.ilike.%${q}%,action.ilike.%${q}%,status.ilike.%${q}%`)
        .limit(8),
      supabase.from('audit_logs')
        .select('id, action, resource_type, user_id, created_at')
        .or(`action.ilike.%${q}%,resource_type.ilike.%${q}%`)
        .order('created_at', { ascending: false })
        .limit(6),
    ]);

    // Map profiles
    (profilesRes.data || []).forEach(p => {
      const name = [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Sin nombre';
      combined.push({
        type: 'user',
        id: p.id,
        title: name,
        subtitle: p.country || 'Sin país',
        meta: format(new Date(p.created_at), 'dd/MM/yyyy'),
        tabTarget: 'users',
      });
    });

    // Map signals
    (signalsRes.data || []).forEach(s => {
      combined.push({
        type: 'signal',
        id: s.id,
        title: `${s.currency_pair} — ${s.action}`,
        subtitle: `${s.status} · ${s.probability}%`,
        meta: format(new Date(s.created_at), 'dd/MM HH:mm'),
        tabTarget: 'signals',
      });
    });

    // Map audit
    (auditRes.data || []).forEach(a => {
      combined.push({
        type: 'audit',
        id: a.id,
        title: a.action,
        subtitle: a.resource_type,
        meta: format(new Date(a.created_at), 'dd/MM HH:mm'),
        tabTarget: 'audit',
      });
    });

    setResults(combined);
    setLoading(false);
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch(value), 300);
  };

  const handleSelect = (result: SearchResult) => {
    onNavigate(result.tabTarget);
    onOpenChange(false);
  };

  const iconMap = {
    user: User,
    signal: TrendingUp,
    audit: ScrollText,
  };

  const colorMap = {
    user: 'text-blue-400 bg-blue-500/10',
    signal: 'text-emerald-400 bg-emerald-500/10',
    audit: 'text-amber-400 bg-amber-500/10',
  };

  const labelMap = {
    user: 'Usuario',
    signal: 'Señal',
    audit: 'Auditoría',
  };

  const grouped = {
    user: results.filter(r => r.type === 'user'),
    signal: results.filter(r => r.type === 'signal'),
    audit: results.filter(r => r.type === 'audit'),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0c0c14] border-white/10 p-0 max-w-lg gap-0 overflow-hidden [&>button]:hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-white/5">
          <Search className="h-4 w-4 text-white/30 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            placeholder="Buscar usuarios, señales, logs..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 outline-none"
            autoComplete="off"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-amber-400 shrink-0" />}
          {query && !loading && (
            <button onClick={() => { setQuery(''); setResults([]); }} className="text-white/20 hover:text-white/50">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Results */}
        <ScrollArea className="max-h-[400px]">
          {query.length < 2 ? (
            <div className="px-4 py-10 text-center">
              <Search className="h-8 w-8 text-white/10 mx-auto mb-2" />
              <p className="text-xs text-white/20">Escribe al menos 2 caracteres para buscar</p>
              <p className="text-[10px] text-white/10 mt-1">Tip: Ctrl+K para abrir búsqueda rápida</p>
            </div>
          ) : results.length === 0 && !loading ? (
            <div className="px-4 py-10 text-center">
              <p className="text-xs text-white/25">Sin resultados para "<span className="text-amber-400/60">{query}</span>"</p>
            </div>
          ) : (
            <div className="py-2">
              {(['user', 'signal', 'audit'] as const).map(type => {
                const items = grouped[type];
                if (items.length === 0) return null;
                const Icon = iconMap[type];
                return (
                  <div key={type} className="mb-1">
                    <div className="px-4 py-1.5">
                      <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">{labelMap[type]}s ({items.length})</p>
                    </div>
                    {items.map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.04] transition-colors text-left"
                      >
                        <div className={`shrink-0 h-8 w-8 rounded-lg flex items-center justify-center ${colorMap[type]}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white/80 font-medium truncate">{item.title}</p>
                          <p className="text-[10px] text-white/30 truncate">{item.subtitle}</p>
                        </div>
                        {item.meta && (
                          <span className="text-[10px] text-white/15 font-mono shrink-0">{item.meta}</span>
                        )}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="h-9 border-t border-white/5 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <span className="text-[9px] text-white/15">↑↓ navegar</span>
            <span className="text-[9px] text-white/15">↵ seleccionar</span>
            <span className="text-[9px] text-white/15">esc cerrar</span>
          </div>
          {results.length > 0 && (
            <span className="text-[9px] text-white/15">{results.length} resultados</span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
