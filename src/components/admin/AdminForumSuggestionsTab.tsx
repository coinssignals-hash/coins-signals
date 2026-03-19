import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Trash2, Save, Sunrise, TrendingUp, Target, MessageCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';

interface CategoryConfig {
  key: string;
  icon: typeof Sunrise;
  label: string;
  color: string;
  options: string[];
}

const DEFAULT_CATEGORIES: CategoryConfig[] = [
  {
    key: 'session',
    icon: Sunrise,
    label: 'Sesión de mercado',
    color: 'text-amber-400',
    options: ['🌏 Asia (Tokio)', '🇪🇺 Europa (Londres)', '🇺🇸 Nueva York', '🌐 Overlap Londres-NY'],
  },
  {
    key: 'pair',
    icon: TrendingUp,
    label: 'Par destacado',
    color: 'text-cyan-400',
    options: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'GBP/JPY', 'XAU/USD', 'BTC/USD'],
  },
  {
    key: 'strategy',
    icon: Target,
    label: 'Estrategia del día',
    color: 'text-emerald-400',
    options: ['📈 Scalping', '🔄 Swing Trading', '💥 Breakout', '📊 Rango / Mean Reversion'],
  },
  {
    key: 'topic',
    icon: MessageCircle,
    label: 'Tema de discusión',
    color: 'text-purple-400',
    options: ['📰 Noticias macro', '🧠 Psicología del trader', '📐 Análisis técnico', '💼 Gestión de riesgo'],
  },
];

interface VoteRow {
  category: string;
  option_value: string;
  count: number;
}

export function AdminForumSuggestionsTab() {
  const [categories, setCategories] = useState<CategoryConfig[]>(DEFAULT_CATEGORIES);
  const [votes, setVotes] = useState<VoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [newOption, setNewOption] = useState<Record<string, string>>({});

  const fetchVotes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('forum_suggestion_votes')
      .select('category, option_value')
      .eq('poll_date', selectedDate);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    // Aggregate counts
    const map: Record<string, Record<string, number>> = {};
    (data || []).forEach((v) => {
      if (!map[v.category]) map[v.category] = {};
      map[v.category][v.option_value] = (map[v.category][v.option_value] || 0) + 1;
    });

    const rows: VoteRow[] = [];
    Object.entries(map).forEach(([cat, opts]) => {
      Object.entries(opts).forEach(([opt, count]) => {
        rows.push({ category: cat, option_value: opt, count });
      });
    });
    setVotes(rows);
    setLoading(false);
  };

  useEffect(() => { fetchVotes(); }, [selectedDate]);

  const getVotesForCategory = (catKey: string) => {
    return votes.filter(v => v.category === catKey).sort((a, b) => b.count - a.count);
  };

  const getTotalVotes = (catKey: string) => {
    return getVotesForCategory(catKey).reduce((s, v) => s + v.count, 0);
  };

  const handleAddOption = (catKey: string) => {
    const val = newOption[catKey]?.trim();
    if (!val) return;
    setCategories(prev => prev.map(c =>
      c.key === catKey ? { ...c, options: [...c.options, val] } : c
    ));
    setNewOption(prev => ({ ...prev, [catKey]: '' }));
    toast({ title: 'Opción agregada', description: `"${val}" añadida a ${catKey}` });
  };

  const handleRemoveOption = (catKey: string, option: string) => {
    setCategories(prev => prev.map(c =>
      c.key === catKey ? { ...c, options: c.options.filter(o => o !== option) } : c
    ));
  };

  const handleClearVotes = async (catKey: string) => {
    const { error } = await supabase
      .from('forum_suggestion_votes')
      .delete()
      .eq('category', catKey)
      .eq('poll_date', selectedDate);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Votos eliminados', description: `Votos de "${catKey}" para ${selectedDate} eliminados.` });
      fetchVotes();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Sugerencias del Foro</h2>
          <p className="text-xs text-white/40">Gestiona las categorías, opciones y votos de "Sugerencias para mañana"</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-white/40">Fecha:</label>
          <Input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-40 bg-white/5 border-white/10 text-white text-xs h-8"
          />
          <Button variant="outline" size="sm" onClick={fetchVotes} className="border-white/10 text-white/60 h-8 text-xs">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Actualizar'}
          </Button>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {categories.map(cat => {
          const total = getTotalVotes(cat.key);
          const Icon = cat.icon;
          return (
            <Card key={cat.key} className="bg-white/[0.03] border-white/[0.06]">
              <CardContent className="p-3 flex items-center gap-3">
                <Icon className={`h-5 w-5 ${cat.color} shrink-0`} />
                <div>
                  <p className="text-[11px] text-white/40 truncate">{cat.label}</p>
                  <p className="text-lg font-bold text-white">{total}</p>
                  <p className="text-[10px] text-white/25">{cat.options.length} opciones</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Category management cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {categories.map(cat => {
          const Icon = cat.icon;
          const catVotes = getVotesForCategory(cat.key);
          const total = getTotalVotes(cat.key);

          return (
            <Card key={cat.key} className="bg-white/[0.02] border-white/[0.06]">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${cat.color}`} />
                    <span className="text-sm text-white">{cat.label}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleClearVotes(cat.key)}
                    className="text-red-400/60 hover:text-red-400 hover:bg-red-500/10 h-7 text-[10px]"
                  >
                    <Trash2 className="h-3 w-3 mr-1" /> Limpiar votos
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Current options with vote counts */}
                <div className="space-y-1.5">
                  {cat.options.map(opt => {
                    const voteData = catVotes.find(v => v.option_value === opt);
                    const count = voteData?.count || 0;
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;

                    return (
                      <div key={opt} className="flex items-center gap-2 group">
                        <div className="flex-1 relative h-8 rounded-lg bg-white/[0.04] overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 rounded-lg bg-white/[0.06] transition-all"
                            style={{ width: `${pct}%` }}
                          />
                          <div className="relative flex items-center justify-between px-3 h-full">
                            <span className="text-xs text-white/70 truncate">{opt}</span>
                            <span className="text-[10px] text-white/40 font-mono shrink-0 ml-2">
                              {count} ({pct}%)
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveOption(cat.key, opt)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-red-400/50 hover:text-red-400 transition-all"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Add new option */}
                <div className="flex items-center gap-2 pt-1 border-t border-white/[0.04]">
                  <Input
                    placeholder="Nueva opción..."
                    value={newOption[cat.key] || ''}
                    onChange={e => setNewOption(prev => ({ ...prev, [cat.key]: e.target.value }))}
                    className="h-7 text-xs bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/20"
                    onKeyDown={e => e.key === 'Enter' && handleAddOption(cat.key)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAddOption(cat.key)}
                    className="h-7 px-2 text-amber-400/60 hover:text-amber-400 hover:bg-amber-500/10"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
