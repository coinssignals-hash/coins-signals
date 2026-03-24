import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { glossaryTerms, glossaryCategories } from '@/data/glossaryData';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, ChevronDown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Glossary() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let terms = glossaryTerms;
    if (activeCategory) terms = terms.filter(t => t.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      terms = terms.filter(t => t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q));
    }
    return terms;
  }, [search, activeCategory]);

  const color = activeCategory
    ? glossaryCategories.find(c => c.id === activeCategory)?.color || '217 91% 60%'
    : '217 91% 60%';

  return (
    <PageShell>
      <Header />
      <main className="container py-3 max-w-lg mx-auto px-3 space-y-3">
        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden" style={{
          background: `linear-gradient(165deg, hsl(${color} / 0.08) 0%, hsl(var(--card)) 40%, hsl(var(--background)) 100%)`,
          border: `1px solid hsl(${color} / 0.2)`,
        }}>
          <div className="absolute top-0 inset-x-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, hsl(${color} / 0.7), transparent)` }} />
          <div className="relative p-4">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                background: `linear-gradient(135deg, hsl(${color} / 0.2), hsl(${color} / 0.08))`,
                border: `1px solid hsl(${color} / 0.25)`,
              }}>
                <BookOpen className="w-5 h-5" style={{ color: `hsl(${color})` }} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground flex items-center gap-1.5">
                  Glosario de Trading <Sparkles className="w-4 h-4" style={{ color: 'hsl(40 80% 55%)' }} />
                </h1>
                <p className="text-xs text-muted-foreground">{glossaryTerms.length} términos esenciales</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar término..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm bg-background/50 border border-border/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
              />
            </div>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn('px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all shrink-0')}
            style={{
              background: !activeCategory ? `hsl(${color} / 0.15)` : 'hsl(var(--card) / 0.5)',
              border: `1px solid ${!activeCategory ? `hsl(${color} / 0.3)` : 'hsl(var(--border) / 0.3)'}`,
              color: !activeCategory ? `hsl(${color})` : undefined,
            }}
          >
            Todos
          </button>
          {glossaryCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all shrink-0"
              style={{
                background: activeCategory === cat.id ? `hsl(${cat.color} / 0.15)` : 'hsl(var(--card) / 0.5)',
                border: `1px solid ${activeCategory === cat.id ? `hsl(${cat.color} / 0.3)` : 'hsl(var(--border) / 0.3)'}`,
                color: activeCategory === cat.id ? `hsl(${cat.color})` : undefined,
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Terms list */}
        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">No se encontraron términos</div>
          )}
          {filtered.map((term, i) => {
            const cat = glossaryCategories.find(c => c.id === term.category);
            const termColor = cat?.color || '217 91% 60%';
            const isExpanded = expandedTerm === term.id;

            return (
              <motion.div
                key={term.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
              >
                <button
                  onClick={() => setExpandedTerm(isExpanded ? null : term.id)}
                  className="w-full text-left rounded-xl overflow-hidden transition-all"
                  style={{
                    background: `linear-gradient(165deg, hsl(${termColor} / ${isExpanded ? '0.08' : '0.03'}) 0%, hsl(var(--card)) 60%)`,
                    border: `1px solid hsl(${termColor} / ${isExpanded ? '0.3' : '0.12'})`,
                  }}
                >
                  <div className="p-3 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: `hsl(${termColor})` }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{term.term}</p>
                      {!isExpanded && <p className="text-xs text-muted-foreground truncate mt-0.5">{term.definition}</p>}
                    </div>
                    <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                    </motion.div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 space-y-2">
                          <p className="text-sm text-foreground/80">{term.definition}</p>
                          {term.example && (
                            <div className="p-2.5 rounded-lg text-xs" style={{
                              background: `hsl(${termColor} / 0.06)`,
                              border: `1px solid hsl(${termColor} / 0.15)`,
                            }}>
                              <span className="font-semibold" style={{ color: `hsl(${termColor})` }}>Ejemplo: </span>
                              <span className="text-muted-foreground">{term.example}</span>
                            </div>
                          )}
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{
                            background: `hsl(${termColor} / 0.1)`,
                            color: `hsl(${termColor})`,
                            border: `1px solid hsl(${termColor} / 0.2)`,
                          }}>
                            {cat?.name}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </motion.div>
            );
          })}
        </div>
      </main>
    </PageShell>
  );
}
