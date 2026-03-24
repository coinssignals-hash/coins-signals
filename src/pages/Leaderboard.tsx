import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { useTranslation } from '@/i18n/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Flame, Target, Star, Users, AlertCircle } from 'lucide-react';
import { useLeaderboard, LeaderboardPeriod, LeaderboardCategory } from '@/hooks/useLeaderboard';

const ACCENT = '45 95% 55%';

const TIER_COLORS: Record<string, string> = {
  bronze: '30 60% 45%', silver: '220 10% 60%', gold: '45 95% 55%',
  diamond: '190 90% 55%', legendary: '270 70% 60%',
};
const COUNTRY_FLAGS: Record<string, string> = {
  AR: '🇦🇷', BR: '🇧🇷', CL: '🇨🇱', CO: '🇨🇴', MX: '🇲🇽', PE: '🇵🇪',
  UY: '🇺🇾', US: '🇺🇸', GB: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷', ES: '🇪🇸',
  IT: '🇮🇹', NL: '🇳🇱', JP: '🇯🇵', AU: '🇦🇺', CA: '🇨🇦',
};
const getFlag = (c: string | null) => c ? COUNTRY_FLAGS[c.toUpperCase().trim()] || '🌍' : '🌍';
const getInitials = (a: string) => a.substring(0, 2).toUpperCase();

export default function Leaderboard() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<LeaderboardPeriod>('alltime');
  const [category, setCategory] = useState<LeaderboardCategory>('pnl');
  const { traders, total, loading, error } = useLeaderboard(period, category);

  const top3 = traders.slice(0, 3);
  const rest = traders.slice(3);
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;
  const podiumHeights = [100, 130, 80];
  const podiumLabels = ['🥈', '🥇', '🥉'];

  const formatValue = (trader: typeof traders[0]) => {
    switch (category) {
      case 'pnl': return `$${trader.pnl.toLocaleString()}`;
      case 'winrate': return `${trader.winRate}%`;
      case 'streak': return `🔥 ${trader.streak}`;
      case 'signals': return `${trader.trades}`;
    }
  };

  return (
    <PageShell>
      <Header />
      <div className="max-w-lg mx-auto space-y-4 pb-24 px-4 pt-4">
        {/* Period tabs */}
        <div className="flex rounded-xl p-1" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border) / 0.3)' }}>
          {([['weekly', 'Semanal'], ['monthly', 'Mensual'], ['alltime', 'Histórico']] as const).map(([key, label]) => (
            <button key={key}
              className="flex-1 py-2 text-xs font-semibold rounded-lg transition-all"
              style={period === key ? {
                background: `linear-gradient(135deg, hsl(${ACCENT}), hsl(${ACCENT} / 0.8))`,
                color: 'hsl(var(--primary-foreground))',
                boxShadow: `0 2px 8px hsl(${ACCENT} / 0.3)`,
              } : { color: 'hsl(var(--muted-foreground))' }}
              onClick={() => setPeriod(key)}
            >{label}</button>
          ))}
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {([
            { key: 'pnl' as const, icon: TrendingUp, label: 'P&L', color: '160 84% 39%' },
            { key: 'winrate' as const, icon: Target, label: 'Win Rate', color: '210 80% 55%' },
            { key: 'streak' as const, icon: Flame, label: 'Racha', color: '25 95% 55%' },
            { key: 'signals' as const, icon: Star, label: 'Trades', color: '45 95% 55%' },
          ]).map(cat => (
            <button key={cat.key}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all"
              style={category === cat.key ? {
                background: `hsl(${cat.color} / 0.15)`,
                border: `1px solid hsl(${cat.color} / 0.4)`,
                color: `hsl(${cat.color})`,
              } : { background: 'hsl(var(--muted))', border: '1px solid transparent', color: 'hsl(var(--muted-foreground))' }}
              onClick={() => setCategory(cat.key)}
            >
              <cat.icon className="w-3 h-3" /> {cat.label}
            </button>
          ))}
        </div>

        {total > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="w-3 h-3" /> <span>{total} traders participando</span>
          </div>
        )}

        {loading && (
          <div className="space-y-3 pt-4">
            <div className="flex items-end justify-center gap-3">
              {[0, 1, 2].map(i => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <Skeleton className="w-16 h-3" />
                  <Skeleton className="w-16 rounded-t-lg" style={{ height: podiumHeights[i] }} />
                </div>
              ))}
            </div>
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
        )}

        {error && !loading && (
          <GlowSection color="0 84% 60%">
            <div className="p-4 flex items-center gap-3 text-sm">
              <AlertCircle className="w-5 h-5" style={{ color: 'hsl(0 84% 60%)' }} />
              <span className="text-foreground">Error al cargar el leaderboard. Intenta de nuevo.</span>
            </div>
          </GlowSection>
        )}

        {!loading && !error && traders.length === 0 && (
          <GlowSection color={ACCENT}>
            <div className="p-8 text-center space-y-2">
              <Trophy className="w-10 h-10 mx-auto" style={{ color: `hsl(${ACCENT} / 0.5)` }} />
              <p className="text-sm text-muted-foreground">No hay datos de trading aún</p>
              <p className="text-xs text-muted-foreground/70">Importa tus operaciones desde el Portfolio para aparecer en el ranking</p>
            </div>
          </GlowSection>
        )}

        {/* Podium */}
        {!loading && top3.length >= 3 && (
          <div className="flex items-end justify-center gap-3 pt-4 pb-2">
            {podiumOrder.map((trader, i) => trader && (
              <motion.div key={trader.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}
                className="flex flex-col items-center">
                <div className="text-2xl mb-1">{podiumLabels[i]}</div>
                <div className="relative p-0.5 rounded-full" style={{ border: `2px solid hsl(${TIER_COLORS[trader.tier] || ACCENT} / 0.5)` }}>
                  <Avatar className="w-12 h-12">
                    {trader.avatar_url && <AvatarImage src={trader.avatar_url} />}
                    <AvatarFallback className="text-xs font-bold" style={{
                      background: `hsl(${TIER_COLORS[trader.tier] || ACCENT} / 0.15)`,
                    }}>{getInitials(trader.alias)}</AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-1 -right-1 text-sm">{getFlag(trader.country)}</span>
                </div>
                <div className="text-xs font-bold mt-1 text-center max-w-[80px] truncate text-foreground">{trader.alias}</div>
                <div className="text-[10px] font-mono" style={{
                  color: category === 'pnl' ? (trader.pnl > 0 ? 'hsl(160 84% 39%)' : 'hsl(0 84% 60%)') : 'hsl(var(--foreground))',
                }}>{formatValue(trader)}</div>
                <div className="w-16 rounded-t-lg mt-2" style={{
                  height: podiumHeights[i],
                  background: `linear-gradient(to top, hsl(${ACCENT} / 0.3), hsl(${ACCENT} / 0.05))`,
                  border: `1px solid hsl(${ACCENT} / 0.2)`,
                  borderBottom: 'none',
                }} />
              </motion.div>
            ))}
          </div>
        )}

        {/* Rankings list */}
        {!loading && (
          <div className="space-y-2">
            {rest.map((trader, i) => {
              const tierColor = TIER_COLORS[trader.tier] || ACCENT;
              return (
                <motion.div key={trader.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                  <div className="relative rounded-2xl overflow-hidden" style={{
                    background: `linear-gradient(165deg, hsl(${tierColor} / 0.04) 0%, hsl(var(--card)) 40%, hsl(var(--background)) 100%)`,
                    border: `1px solid hsl(${tierColor} / 0.15)`,
                  }}>
                    <div className="relative p-3 flex items-center gap-3">
                      <div className="text-sm font-bold text-muted-foreground w-6 text-center">{trader.rank}</div>
                      <Avatar className="w-9 h-9">
                        {trader.avatar_url && <AvatarImage src={trader.avatar_url} />}
                        <AvatarFallback className="text-[10px] font-bold" style={{
                          background: `hsl(${tierColor} / 0.15)`,
                        }}>{getInitials(trader.alias)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium truncate text-foreground">{trader.alias}</span>
                          <span className="text-xs">{getFlag(trader.country)}</span>
                          <Badge variant="outline" className="text-[9px] px-1 py-0" style={{
                            color: `hsl(${tierColor})`, borderColor: `hsl(${tierColor} / 0.4)`,
                          }}>{trader.tier}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>{trader.trades} trades</span><span>·</span>
                          <span>W{trader.winners}/L{trader.losers}</span><span>·</span>
                          <span>{trader.symbolsTraded} pares</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold" style={{
                          color: category === 'pnl' ? (trader.pnl > 0 ? 'hsl(160 84% 39%)' : 'hsl(0 84% 60%)') : 'hsl(var(--foreground))',
                        }}>{formatValue(trader)}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {category !== 'winrate' && `WR ${trader.winRate}%`}
                          {category === 'winrate' && `${trader.trades} ops`}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}
