import { useState, useMemo } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  INSTRUMENTS, CATEGORY_LABELS, CATEGORY_ICONS,
  type Instrument, type InstrumentCategory,
} from '@/hooks/usePaperTrading';

const ACCENT = '270 70% 60%';
const categories: InstrumentCategory[] = ['forex', 'crypto', 'stocks', 'indices', 'commodities'];

interface Props {
  selected: string;
  prices: Record<string, number>;
  onSelect: (symbol: string) => void;
}

export function InstrumentSelector({ selected, prices, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<InstrumentCategory>('forex');

  const selectedInst = INSTRUMENTS.find(i => i.symbol === selected);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return INSTRUMENTS.filter(i =>
      i.category === activeCategory &&
      (i.symbol.toLowerCase().includes(q) || i.name.toLowerCase().includes(q))
    );
  }, [activeCategory, search]);

  const handleSelect = (symbol: string) => {
    onSelect(symbol);
    setOpen(false);
    setSearch('');
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between p-3 rounded-xl transition-all active:scale-[0.98]"
        style={{
          background: `hsl(${ACCENT} / 0.08)`,
          border: `1px solid hsl(${ACCENT} / 0.2)`,
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{selectedInst ? CATEGORY_ICONS[selectedInst.category] : '💱'}</span>
          <div className="text-left">
            <p className="text-sm font-bold text-foreground">{selected}</p>
            <p className="text-[10px] text-muted-foreground">{selectedInst?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono font-bold text-foreground">
            {(prices[selected] ?? 0).toFixed(selectedInst?.decimals ?? 4)}
          </span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </div>
      </button>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{
      background: 'hsl(var(--card))',
      border: `1px solid hsl(${ACCENT} / 0.3)`,
      boxShadow: `0 8px 32px hsl(${ACCENT} / 0.1)`,
    }}>
      {/* Search */}
      <div className="p-2 flex items-center gap-2" style={{ borderBottom: '1px solid hsl(var(--border) / 0.3)' }}>
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          autoFocus
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar instrumento..."
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />
        <button onClick={() => { setOpen(false); setSearch(''); }} className="p-1 rounded-lg hover:bg-muted/50">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex overflow-x-auto gap-1 p-2 no-scrollbar" style={{ borderBottom: '1px solid hsl(var(--border) / 0.3)' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all shrink-0',
            )}
            style={activeCategory === cat ? {
              background: `hsl(${ACCENT} / 0.15)`,
              color: `hsl(${ACCENT})`,
              border: `1px solid hsl(${ACCENT} / 0.3)`,
            } : {
              color: 'hsl(var(--muted-foreground))',
              border: '1px solid transparent',
            }}
          >
            <span>{CATEGORY_ICONS[cat]}</span>
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Instrument list */}
      <div className="max-h-56 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-6">No se encontraron instrumentos</p>
        )}
        {filtered.map(inst => {
          const price = prices[inst.symbol] ?? inst.basePrice;
          const isSelected = inst.symbol === selected;
          return (
            <button
              key={inst.symbol}
              onClick={() => handleSelect(inst.symbol)}
              className="w-full flex items-center justify-between px-3 py-2.5 transition-colors hover:bg-muted/40 active:bg-muted/60"
              style={isSelected ? { background: `hsl(${ACCENT} / 0.08)` } : undefined}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-sm">{CATEGORY_ICONS[inst.category]}</span>
                <div className="text-left">
                  <p className={cn('text-xs font-semibold', isSelected ? 'text-foreground' : 'text-foreground/80')}>
                    {inst.symbol}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{inst.name}</p>
                </div>
              </div>
              <span className="text-xs font-mono text-foreground/70">{price.toFixed(inst.decimals)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
