import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Gift, Clock, CheckCircle2, DollarSign, CalendarDays } from 'lucide-react';

interface ReferralRow {
  id: string;
  referrer_id: string;
  referred_id: string;
  status: string;
  reward_amount: number;
  reward_days: number;
  reward_type: string;
  created_at: string;
  completed_at: string | null;
}

interface ReferrerStats {
  referrer_id: string;
  referrer_email: string;
  referrer_alias: string | null;
  total: number;
  completed: number;
  pending: number;
  totalEarned: number;
  totalDays: number;
  referrals: ReferralRow[];
}

export function AdminReferralsTab() {
  const [referrers, setReferrers] = useState<ReferrerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      // Fetch all referrals
      const { data: allReferrals } = await supabase
        .from('referrals')
        .select('*')
        .order('created_at', { ascending: false });

      if (!allReferrals || allReferrals.length === 0) {
        setLoading(false);
        return;
      }

      // Get unique referrer IDs
      const referrerIds = [...new Set(allReferrals.map(r => r.referrer_id))];

      // Fetch profiles for referrers
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, alias, first_name, last_name')
        .in('id', referrerIds);

      const profileMap = new Map(
        (profiles || []).map(p => [p.id, p])
      );

      // Group by referrer
      const grouped: Record<string, ReferralRow[]> = {};
      for (const r of allReferrals) {
        if (!grouped[r.referrer_id]) grouped[r.referrer_id] = [];
        grouped[r.referrer_id].push(r as ReferralRow);
      }

      const stats: ReferrerStats[] = Object.entries(grouped).map(([referrerId, refs]) => {
        const profile = profileMap.get(referrerId);
        const completed = refs.filter(r => r.status === 'completed');
        const pending = refs.filter(r => r.status === 'pending');
        return {
          referrer_id: referrerId,
          referrer_email: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || referrerId.slice(0, 8) : referrerId.slice(0, 8),
          referrer_alias: profile?.alias || null,
          total: refs.length,
          completed: completed.length,
          pending: pending.length,
          totalEarned: completed.reduce((s, r) => s + Number(r.reward_amount || 0), 0),
          totalDays: completed.reduce((s, r) => s + Number(r.reward_days || 0), 0),
          referrals: refs,
        };
      });

      stats.sort((a, b) => b.total - a.total);
      setReferrers(stats);
      setLoading(false);
    };
    fetchAll();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const globalTotal = referrers.reduce((s, r) => s + r.total, 0);
  const globalCompleted = referrers.reduce((s, r) => s + r.completed, 0);
  const globalPending = referrers.reduce((s, r) => s + r.pending, 0);
  const globalEarned = referrers.reduce((s, r) => s + r.totalEarned, 0);

  return (
    <div className="space-y-4">
      {/* Global summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3 bg-card border-border text-center">
          <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
          <p className="text-lg font-bold text-foreground">{globalTotal}</p>
          <p className="text-[10px] text-muted-foreground">Total Referidos</p>
        </Card>
        <Card className="p-3 bg-card border-border text-center">
          <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
          <p className="text-lg font-bold text-foreground">{globalCompleted}</p>
          <p className="text-[10px] text-muted-foreground">Completados</p>
        </Card>
        <Card className="p-3 bg-card border-border text-center">
          <Clock className="h-5 w-5 mx-auto mb-1 text-amber-400" />
          <p className="text-lg font-bold text-foreground">{globalPending}</p>
          <p className="text-[10px] text-muted-foreground">Pendientes</p>
        </Card>
        <Card className="p-3 bg-card border-border text-center">
          <DollarSign className="h-5 w-5 mx-auto mb-1 text-chart-2" />
          <p className="text-lg font-bold text-foreground">${globalEarned}</p>
          <p className="text-[10px] text-muted-foreground">Total Ganado</p>
        </Card>
      </div>

      {referrers.length === 0 ? (
        <Card className="p-8 bg-card border-border text-center">
          <Gift className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No hay referidos aún</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {referrers.map((r) => (
            <Card
              key={r.referrer_id}
              className="bg-card border-border overflow-hidden"
            >
              <button
                onClick={() => setExpandedUser(expandedUser === r.referrer_id ? null : r.referrer_id)}
                className="w-full p-3 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {r.referrer_alias || r.referrer_email}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">{r.referrer_id.slice(0, 12)}…</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="secondary" className="text-[10px]">{r.total} ref.</Badge>
                  {r.completed > 0 && (
                    <Badge className="bg-emerald-500/15 text-emerald-400 text-[10px] border-0">{r.completed} ✓</Badge>
                  )}
                  {r.pending > 0 && (
                    <Badge className="bg-amber-500/15 text-amber-400 text-[10px] border-0">{r.pending} ⏳</Badge>
                  )}
                </div>
              </button>

              {expandedUser === r.referrer_id && (
                <div className="border-t border-border px-3 py-2 space-y-2 bg-muted/30">
                  <div className="flex gap-4 text-[11px] text-muted-foreground">
                    <span>Ganado: <strong className="text-foreground">${r.totalEarned}</strong></span>
                    <span>Días extra: <strong className="text-foreground">{r.totalDays}</strong></span>
                  </div>
                  <div className="space-y-1.5">
                    {r.referrals.map((ref) => (
                      <div key={ref.id} className="flex items-center justify-between text-[11px] py-1 px-2 rounded bg-background/50">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-muted-foreground">{ref.referred_id.slice(0, 10)}…</span>
                          <Badge
                            className={
                              ref.status === 'completed'
                                ? 'bg-emerald-500/15 text-emerald-400 border-0 text-[9px]'
                                : 'bg-amber-500/15 text-amber-400 border-0 text-[9px]'
                            }
                          >
                            {ref.status === 'completed' ? 'Suscrito ✓' : 'Pendiente'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                          <span>${ref.reward_amount}</span>
                          <span>·</span>
                          <span>{ref.reward_days}d</span>
                          <span>·</span>
                          <span>{new Date(ref.created_at).toLocaleDateString()}</span>
                          {ref.completed_at && (
                            <>
                              <span>→</span>
                              <span className="text-emerald-400">{new Date(ref.completed_at).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
