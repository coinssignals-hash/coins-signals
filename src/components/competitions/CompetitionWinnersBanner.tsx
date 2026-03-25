import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GlowSection } from '@/components/ui/glow-section';
import { motion } from 'framer-motion';
import { Trophy, Crown, Medal } from 'lucide-react';

interface Winner {
  id: string;
  user_id: string;
  period_type: string;
  period_label: string;
  rank: number;
  composite_score: number;
  total_pnl: number;
  win_rate: number;
  total_trades: number;
  badge: string | null;
  prize: string | null;
  published_at: string;
}

interface Profile {
  id: string;
  alias: string | null;
  avatar_url: string | null;
}

const PERIOD_LABELS: Record<string, string> = {
  weekly: '🗓️ Semanal',
  monthly: '📅 Mensual',
  alltime: '🏆 All-time',
};

const RANK_ICONS = [
  <Crown key="1" className="w-5 h-5 text-amber-400" />,
  <Medal key="2" className="w-5 h-5 text-gray-300" />,
  <Medal key="3" className="w-5 h-5 text-amber-600" />,
];

export function CompetitionWinnersBanner() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [activePeriod, setActivePeriod] = useState<string>('weekly');

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('competition_winners')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(50);

      if (data && data.length > 0) {
        setWinners(data as unknown as Winner[]);
        const userIds = [...new Set(data.map((w: any) => w.user_id))];
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, alias, avatar_url')
          .in('id', userIds);
        const map: Record<string, Profile> = {};
        (profs || []).forEach((p: any) => { map[p.id] = p; });
        setProfiles(map);
      }
    };
    fetch();
  }, []);

  const filtered = winners.filter(w => w.period_type === activePeriod);
  // Group by period_label
  const grouped: Record<string, Winner[]> = {};
  filtered.forEach(w => {
    if (!grouped[w.period_label]) grouped[w.period_label] = [];
    grouped[w.period_label].push(w);
  });

  if (winners.length === 0) return null;

  const periods = [...new Set(winners.map(w => w.period_type))];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Trophy className="w-4 h-4" style={{ color: 'hsl(45 95% 55%)' }} />
        <h3 className="text-sm font-bold text-foreground">Hall de la Fama</h3>
      </div>

      {/* Period filter */}
      <div className="flex gap-1.5">
        {periods.map(p => (
          <button
            key={p}
            onClick={() => setActivePeriod(p)}
            className={`text-[10px] px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activePeriod === p
                ? 'text-foreground'
                : 'text-muted-foreground'
            }`}
            style={activePeriod === p ? {
              background: 'hsl(45 95% 55% / 0.15)',
              border: '1px solid hsl(45 95% 55% / 0.3)',
            } : {
              background: 'hsl(var(--card) / 0.4)',
              border: '1px solid hsl(var(--border) / 0.1)',
            }}
          >
            {PERIOD_LABELS[p] || p}
          </button>
        ))}
      </div>

      {/* Winners */}
      {Object.entries(grouped).map(([label, ws]) => (
        <GlowSection key={label} color="45 95% 55%">
          <div className="p-3 space-y-2">
            <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{label}</div>
            {ws.sort((a, b) => a.rank - b.rank).map((w, i) => {
              const profile = profiles[w.user_id];
              return (
                <motion.div
                  key={w.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 py-1.5"
                >
                  <div className="w-6 text-center">{RANK_ICONS[w.rank - 1] || <span className="text-xs text-muted-foreground">#{w.rank}</span>}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-foreground truncate">
                      {profile?.alias || 'Trader'}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {w.total_trades} trades · WR {w.win_rate.toFixed(0)}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-bold font-mono ${w.total_pnl >= 0 ? 'text-[hsl(160_84%_39%)]' : 'text-[hsl(0_84%_60%)]'}`}>
                      {w.total_pnl >= 0 ? '+' : ''}{w.total_pnl.toFixed(2)}
                    </div>
                    {w.badge && <div className="text-[9px]">{w.badge}</div>}
                  </div>
                </motion.div>
              );
            })}
            {ws[0]?.prize && (
              <div className="text-[10px] pt-1 border-t text-muted-foreground" style={{ borderColor: 'hsl(45 95% 55% / 0.1)' }}>
                🎁 Premio: {ws[0].prize}
              </div>
            )}
          </div>
        </GlowSection>
      ))}
    </div>
  );
}
