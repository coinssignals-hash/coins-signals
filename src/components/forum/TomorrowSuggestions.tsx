import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GlowCard } from '@/components/ui/glow-card';
import { CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Sunrise, TrendingUp, Target, MessageCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/i18n/LanguageContext';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';

interface Category {
  key: string;
  icon: typeof Sunrise;
  label: string;
  color: string;
  options: string[];
}

const CATEGORIES: Category[] = [
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

type VotesMap = Record<string, Record<string, number>>;
type UserVotes = Record<string, string>;

export function TomorrowSuggestions() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [votes, setVotes] = useState<VotesMap>({});
  const [userVotes, setUserVotes] = useState<UserVotes>({});
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const tomorrow = useMemo(() => format(addDays(new Date(), 1), 'yyyy-MM-dd'), []);

  const fetchVotes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('forum_suggestion_votes')
        .select('category, option_value, user_id')
        .eq('poll_date', tomorrow);

      if (error) throw error;

      const vMap: VotesMap = {};
      const uVotes: UserVotes = {};

      for (const row of data || []) {
        if (!vMap[row.category]) vMap[row.category] = {};
        vMap[row.category][row.option_value] = (vMap[row.category][row.option_value] || 0) + 1;
        if (row.user_id === user?.id) {
          uVotes[row.category] = row.option_value;
        }
      }

      setVotes(vMap);
      setUserVotes(uVotes);
    } catch (err) {
      console.error('Error fetching suggestion votes:', err);
    } finally {
      setLoading(false);
    }
  }, [tomorrow, user?.id]);

  useEffect(() => {
    fetchVotes();
  }, [fetchVotes]);

  const handleVote = async (category: string, option: string) => {
    if (!user) {
      toast.error('Inicia sesión para votar');
      return;
    }
    if (voting) return;

    setVoting(category);
    try {
      const currentVote = userVotes[category];

      if (currentVote === option) {
        // Remove vote
        await supabase
          .from('forum_suggestion_votes')
          .delete()
          .eq('user_id', user.id)
          .eq('category', category)
          .eq('poll_date', tomorrow);
      } else if (currentVote) {
        // Change vote
        await supabase
          .from('forum_suggestion_votes')
          .update({ option_value: option })
          .eq('user_id', user.id)
          .eq('category', category)
          .eq('poll_date', tomorrow);
      } else {
        // New vote
        await supabase
          .from('forum_suggestion_votes')
          .insert({ user_id: user.id, category, option_value: option, poll_date: tomorrow });
      }

      await fetchVotes();
    } catch (err: any) {
      toast.error('Error al votar');
    } finally {
      setVoting(null);
    }
  };

  if (loading) {
    return (
      <GlowCard color="210 70% 55%">
        <div className="p-4 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      </GlowCard>
    );
  }

  return (
    <GlowCard color="210 70% 55%">
      <div className="p-0">
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-4 pb-3 hover:bg-secondary/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🗓️</span>
            <div className="text-left">
              <p className="text-xs font-bold text-primary uppercase tracking-wider">Sugerencias para mañana</p>
              <p className="text-[10px] text-muted-foreground">{format(addDays(new Date(), 1), 'EEEE dd MMM')}</p>
            </div>
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {expanded && (
          <div className="px-4 pb-4 space-y-4">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const catVotes = votes[cat.key] || {};
              const totalVotes = Object.values(catVotes).reduce((a, b) => a + b, 0);
              const userVote = userVotes[cat.key];

              return (
                <div key={cat.key} className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Icon className={cn('w-3.5 h-3.5', cat.color)} />
                    <span className={cn('text-[11px] font-bold uppercase tracking-wider', cat.color)}>{cat.label}</span>
                    {totalVotes > 0 && (
                      <span className="text-[9px] text-muted-foreground ml-auto">{totalVotes} votos</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {cat.options.map((opt) => {
                      const count = catVotes[opt] || 0;
                      const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                      const isSelected = userVote === opt;
                      const isVoting = voting === cat.key;

                      return (
                        <button
                          key={opt}
                          onClick={() => handleVote(cat.key, opt)}
                          disabled={isVoting}
                          className={cn(
                            'relative overflow-hidden rounded-lg border p-2 text-left transition-all active:scale-[0.97]',
                            isSelected
                              ? 'border-primary bg-primary/10'
                              : 'border-border bg-secondary/50 hover:border-primary/40'
                          )}
                        >
                          {totalVotes > 0 && (
                            <div
                              className="absolute inset-0 bg-primary/8 transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          )}
                          <span className="relative text-[11px] font-medium text-foreground leading-tight block">{opt}</span>
                          {totalVotes > 0 && (
                            <div className="relative flex items-center gap-1 mt-0.5">
                              <span className="text-[9px] text-muted-foreground">{count}</span>
                              <span className="text-[9px] font-bold text-primary">{pct}%</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </GlowCard>
  );
}
