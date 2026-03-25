import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Trophy, RefreshCw, Award, Ban, Eye, Medal,
  Calendar, Loader2, Crown, ChevronDown, ChevronUp,
  Send, Star, Trash2
} from 'lucide-react';

type PeriodType = 'weekly' | 'monthly' | 'alltime';
type RankingStatus = 'active' | 'disqualified' | 'winner' | 'published';

interface Ranking {
  id: string;
  user_id: string;
  period_type: PeriodType;
  period_label: string;
  total_trades: number;
  winning_trades: number;
  total_pnl: number;
  win_rate: number;
  max_drawdown: number;
  consistency_score: number;
  composite_score: number;
  rank: number;
  status: RankingStatus;
  admin_notes: string | null;
  badge_awarded: string | null;
  prize_description: string | null;
  calculated_at: string;
}

interface Profile {
  id: string;
  alias: string | null;
  avatar_url: string | null;
}

const PERIOD_TABS: { key: PeriodType; label: string; icon: any }[] = [
  { key: 'weekly', label: 'Semanal', icon: Calendar },
  { key: 'monthly', label: 'Mensual', icon: Calendar },
  { key: 'alltime', label: 'All-time', icon: Trophy },
];

const STATUS_COLORS: Record<RankingStatus, string> = {
  active: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  disqualified: 'bg-red-500/15 text-red-400 border-red-500/30',
  winner: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  published: 'bg-green-500/15 text-green-400 border-green-500/30',
};

const BADGES = ['🥇 Oro', '🥈 Plata', '🥉 Bronce', '⭐ Top 5', '🏆 Legendario', '🔥 Racha'];
const PRIZES = ['1 mes Premium', '3 meses Premium', '6 meses Premium', 'Badge exclusivo', 'Coaching 1:1', 'Personalizado'];

export function AdminCompetitionRankingsTab() {
  const [period, setPeriod] = useState<PeriodType>('weekly');
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState<Record<string, string>>({});

  const fetchRankings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('competition_rankings')
      .select('*')
      .eq('period_type', period)
      .order('rank', { ascending: true })
      .limit(100);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setRankings((data || []) as unknown as Ranking[]);
      // Fetch profiles for users
      const userIds = [...new Set((data || []).map((r: any) => r.user_id))];
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, alias, avatar_url')
          .in('id', userIds);
        const map: Record<string, Profile> = {};
        (profs || []).forEach((p: any) => { map[p.id] = p; });
        setProfiles(map);
      }
    }
    setLoading(false);
  }, [period]);

  useEffect(() => { fetchRankings(); }, [fetchRankings]);

  const calculateScores = async () => {
    setCalculating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('calculate-competition-rankings', {
        body: { period_type: period },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error) throw error;
      toast({ title: '✅ Rankings calculados', description: `${data.count} usuarios procesados para ${data.period}` });
      fetchRankings();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setCalculating(false);
  };

  const updateStatus = async (id: string, status: RankingStatus) => {
    const { error } = await supabase
      .from('competition_rankings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      toast({ title: `Estado actualizado: ${status}` });
      setRankings(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    }
  };

  const updateField = async (id: string, field: string, value: string | null) => {
    const { error } = await supabase
      .from('competition_rankings')
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Actualizado' });
      setRankings(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    }
  };

  const publishWinners = async (topN = 3) => {
    const winners = rankings
      .filter(r => r.status !== 'disqualified')
      .slice(0, topN);

    if (winners.length === 0) {
      toast({ title: 'No hay ganadores para publicar', variant: 'destructive' });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();

    const inserts = winners.map(r => ({
      ranking_id: r.id,
      user_id: r.user_id,
      period_type: r.period_type,
      period_label: r.period_label,
      rank: r.rank,
      composite_score: r.composite_score,
      total_pnl: r.total_pnl,
      win_rate: r.win_rate,
      total_trades: r.total_trades,
      badge: r.badge_awarded,
      prize: r.prize_description,
      published_by: session?.user?.id,
    }));

    const { error } = await supabase.from('competition_winners').insert(inserts);
    if (error) {
      toast({ title: 'Error publicando', description: error.message, variant: 'destructive' });
    } else {
      // Update status to published
      for (const w of winners) {
        await updateStatus(w.id, 'published');
      }
      toast({ title: '🏆 Ganadores publicados', description: `Top ${topN} publicados para todos los usuarios` });

      // Send push notification to all users
      const winnerAlias = winners.map(w => {
        const p = profiles[w.user_id];
        return p?.alias || 'Trader';
      });
      const periodLabel = winners[0]?.period_label || '';
      const notifTitle = `🏆 ¡Ganadores ${periodLabel}!`;
      const notifBody = `Top ${topN}: ${winnerAlias.slice(0, 3).join(', ')}. ¡Mira los resultados!`;

      try {
        await supabase.functions.invoke('send-push-notification', {
          body: {
            title: notifTitle,
            body: notifBody,
            url: '/competitions',
            tag: 'competition-winners',
          },
        });
        toast({ title: '📢 Notificación enviada a todos los usuarios' });
      } catch (pushErr: any) {
        toast({ title: 'Push fallido', description: pushErr.message, variant: 'destructive' });
      }
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-4 h-4 text-amber-400" />;
    if (rank === 2) return <Medal className="w-4 h-4 text-gray-300" />;
    if (rank === 3) return <Medal className="w-4 h-4 text-amber-600" />;
    return <span className="text-xs text-white/30 font-mono">#{rank}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" /> Rankings de Competencia
          </h2>
          <p className="text-xs text-white/40 mt-1">
            Calcula, revisa y publica rankings basados en datos reales de trading
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={calculateScores}
            disabled={calculating}
            size="sm"
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
          >
            {calculating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
            Calcular Scores
          </Button>
          <Button
            onClick={() => publishWinners(3)}
            size="sm"
            variant="outline"
            className="border-green-500/30 text-green-400 hover:bg-green-500/10"
          >
            <Send className="w-3.5 h-3.5 mr-1" /> Publicar Top 3
          </Button>
        </div>
      </div>

      {/* Period tabs */}
      <div className="flex rounded-xl p-1 bg-white/[0.04] border border-white/[0.06]">
        {PERIOD_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setPeriod(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              period === t.key
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* Rankings list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
        </div>
      ) : rankings.length === 0 ? (
        <div className="text-center py-12 text-white/30">
          <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hay rankings para este período</p>
          <p className="text-xs mt-1">Pulsa "Calcular Scores" para generar</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Period label */}
          {rankings[0] && (
            <div className="text-xs text-white/50 font-medium mb-3">
              📅 {rankings[0].period_label} · {rankings.length} participantes · Calculado: {new Date(rankings[0].calculated_at).toLocaleString()}
            </div>
          )}

          {rankings.map(r => {
            const profile = profiles[r.user_id];
            const expanded = expandedId === r.id;

            return (
              <div key={r.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                {/* Row */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.03] transition-colors"
                  onClick={() => setExpandedId(expanded ? null : r.id)}
                >
                  <div className="w-7 text-center">{getRankIcon(r.rank)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">
                      {profile?.alias || r.user_id.slice(0, 8)}
                    </div>
                    <div className="text-[10px] text-white/30 font-mono">{r.total_trades} trades</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-sm font-bold font-mono ${r.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {r.total_pnl >= 0 ? '+' : ''}{r.total_pnl.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-white/30">WR: {r.win_rate.toFixed(1)}%</div>
                  </div>
                  <div className="text-right shrink-0 w-20">
                    <div className="text-xs font-bold text-amber-400 font-mono">{r.composite_score.toFixed(1)}</div>
                    <div className="text-[10px] text-white/25">score</div>
                  </div>
                  <Badge variant="outline" className={`text-[9px] shrink-0 ${STATUS_COLORS[r.status]}`}>
                    {r.status}
                  </Badge>
                  {expanded ? <ChevronUp className="w-3.5 h-3.5 text-white/30" /> : <ChevronDown className="w-3.5 h-3.5 text-white/30" />}
                </div>

                {/* Expanded admin controls */}
                {expanded && (
                  <div className="border-t border-white/[0.06] px-4 py-3 space-y-3 bg-white/[0.01]">
                    {/* Stats grid */}
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[
                        { label: 'P&L', value: `$${r.total_pnl.toFixed(2)}`, color: r.total_pnl >= 0 ? 'text-green-400' : 'text-red-400' },
                        { label: 'Win Rate', value: `${r.win_rate.toFixed(1)}%`, color: 'text-blue-400' },
                        { label: 'Drawdown', value: `$${r.max_drawdown.toFixed(2)}`, color: 'text-orange-400' },
                        { label: 'Consistencia', value: r.consistency_score.toFixed(1), color: 'text-purple-400' },
                      ].map(s => (
                        <div key={s.label} className="rounded-lg bg-white/[0.03] p-2">
                          <div className={`text-sm font-bold font-mono ${s.color}`}>{s.value}</div>
                          <div className="text-[9px] text-white/30">{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" className="text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                        onClick={() => updateStatus(r.id, 'winner')}>
                        <Award className="w-3 h-3 mr-1" /> Marcar Ganador
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
                        onClick={() => updateStatus(r.id, 'disqualified')}>
                        <Ban className="w-3 h-3 mr-1" /> Descalificar
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                        onClick={() => updateStatus(r.id, 'active')}>
                        Restaurar
                      </Button>
                    </div>

                    {/* Badge selector */}
                    <div>
                      <label className="text-[10px] text-white/40 uppercase tracking-wider">Badge</label>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {BADGES.map(b => (
                          <button key={b}
                            onClick={() => updateField(r.id, 'badge_awarded', r.badge_awarded === b ? null : b)}
                            className={`text-[10px] px-2 py-1 rounded-lg border transition-all ${
                              r.badge_awarded === b
                                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                                : 'bg-white/[0.03] border-white/[0.08] text-white/40 hover:text-white/60'
                            }`}
                          >{b}</button>
                        ))}
                      </div>
                    </div>

                    {/* Prize selector */}
                    <div>
                      <label className="text-[10px] text-white/40 uppercase tracking-wider">Premio</label>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {PRIZES.map(p => (
                          <button key={p}
                            onClick={() => updateField(r.id, 'prize_description', r.prize_description === p ? null : p)}
                            className={`text-[10px] px-2 py-1 rounded-lg border transition-all ${
                              r.prize_description === p
                                ? 'bg-green-500/20 border-green-500/40 text-green-400'
                                : 'bg-white/[0.03] border-white/[0.08] text-white/40 hover:text-white/60'
                            }`}
                          >{p}</button>
                        ))}
                      </div>
                    </div>

                    {/* Admin notes */}
                    <div>
                      <label className="text-[10px] text-white/40 uppercase tracking-wider">Notas Admin</label>
                      <div className="flex gap-2 mt-1">
                        <input
                          className="flex-1 text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/30"
                          placeholder="Agregar nota..."
                          value={editNotes[r.id] ?? r.admin_notes ?? ''}
                          onChange={e => setEditNotes(prev => ({ ...prev, [r.id]: e.target.value }))}
                        />
                        <Button size="sm" variant="ghost" className="text-amber-400 hover:bg-amber-500/10 text-xs"
                          onClick={() => {
                            updateField(r.id, 'admin_notes', editNotes[r.id] || null);
                          }}>
                          Guardar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
