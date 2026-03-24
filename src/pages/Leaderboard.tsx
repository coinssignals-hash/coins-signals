import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { useTranslation } from '@/i18n/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Flame, Target, Star, Users, AlertCircle, ArrowLeft, Crown } from 'lucide-react';
import { GlowSection } from '@/components/ui/glow-section';
import { useLeaderboard, LeaderboardPeriod, LeaderboardCategory } from '@/hooks/useLeaderboard';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
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

      {/* ── Premium Hero Header ── */}
      <div className="relative overflow-hidden" style={{
        background: `linear-gradient(165deg, hsl(${ACCENT} / 0.15) 0%, hsl(var(--background)) 50%)`,
      }}>
        <div className="absolute top-0 inset-x-0 h-[2px]" style={{
          background: `linear-gradient(90deg, transparent, hsl(${ACCENT} / 0.8), transparent)`,
        }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-40 rounded-full opacity-20 pointer-events-none" style={{
          background: `radial-gradient(circle, hsl(${ACCENT} / 0.5), transparent 70%)`,
        }} />

        <div className="relative px-4 py-5">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)}
              className="flex items-center justify-center w-8 h-8 rounded-xl transition-all active:scale-90"
              style={{ background: `hsl(${ACCENT} / 0.1)`, border: `1px solid hsl(${ACCENT} / 0.2)` }}>
              <ArrowLeft className="w-4 h-4" style={{ color: `hsl(${ACCENT})` }} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{
                background: `linear-gradient(165deg, hsl(${ACCENT} / 0.25), hsl(${ACCENT} / 0.08))`,
                border: `1px solid hsl(${ACCENT} / 0.3)`,
                boxShadow: `0 0 20px hsl(${ACCENT} / 0.15)`,
              }}>
                <Crown className="w-5 h-5" style={{ color: `hsl(${ACCENT})` }} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground tracking-tight">
                  {t('drawer_leaderboard') || 'Leaderboard'}
                </h1>
                <p className="text-[11px] text-muted-foreground">
                  Ranking de los mejores traders
                </p>
              </div>
            </div>
            {total > 0 && (
              <Badge variant="outline" className="ml-auto text-[10px] font-semibold" style={{
                borderColor: `hsl(${ACCENT} / 0.3)`, color: `hsl(${ACCENT})`,
                background: `hsl(${ACCENT} / 0.08)`,
              }}>
                <Users className="w-2.5 h-2.5 mr-0.5" /> {total}
              </Badge>
            )}
          </div>
        </div>

        <div className="h-px" style={{
          background: `linear-gradient(90deg, transparent, hsl(${ACCENT} / 0.3), transparent)`,
        }} />
      </div>

      <div className="max-w-lg mx-auto space-y-4 pb-24 px-4 pt-4">
        {/* Period tabs — glassmorphic */}
        <div className="flex rounded-xl p-1" style={{
          background: 'hsl(var(--card) / 0.6)',
          border: '1px solid hsl(var(--border) / 0.15)',
          backdropFilter: 'blur(8px)',
        }}>
          {([['weekly', 'Semanal'], ['monthly', 'Mensual'], ['alltime', 'Histórico']] as const).map(([key, label]) => (
            <button key={key}
              className="flex-1 py-2 text-xs font-semibold rounded-lg transition-all"
              style={period === key ? {
                background: `linear-gradient(165deg, hsl(${ACCENT}), hsl(${ACCENT} / 0.8))`,
                color: 'hsl(var(--primary-foreground))',
                boxShadow: `0 2px 10px hsl(${ACCENT} / 0.3)`,
              } : { color: 'hsl(var(--muted-foreground))' }}
              onClick={() => setPeriod(key)}
            >{label}</button>
          ))}
        </div>

        {/* Category filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {([
            { key: 'pnl' as const, icon: TrendingUp, label: 'P&L', color: '160 84% 39%' },
            { key: 'winrate' as const, icon: Target, label: 'Win Rate', color: '210 80% 55%' },
            { key: 'streak' as const, icon: Flame, label: 'Racha', color: '25 95% 55%' },
            { key: 'signals' as const, icon: Star, label: 'Trades', color: '45 95% 55%' },
          ]).map(cat => (
            <button key={cat.key}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all active:scale-95"
              style={category === cat.key ? {
                background: `hsl(${cat.color} / 0.15)`,
                border: `1px solid hsl(${cat.color} / 0.4)`,
                color: `hsl(${cat.color})`,
                boxShadow: `0 0 8px hsl(${cat.color} / 0.1)`,
              } : { background: 'hsl(var(--muted) / 0.5)', border: '1px solid transparent', color: 'hsl(var(--muted-foreground))' }}
              onClick={() => setCategory(cat.key)}
            >
              <cat.icon className="w-3 h-3" /> {cat.label}
            </button>
          ))}
        </div>

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
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center" style={{
                background: `linear-gradient(165deg, hsl(${ACCENT} / 0.15), hsl(var(--background)))`,
                border: `1px solid hsl(${ACCENT} / 0.15)`,
              }}>
                <Trophy className="w-6 h-6" style={{ color: `hsl(${ACCENT} / 0.5)` }} />
              </div>
              <p className="text-sm text-muted-foreground">No hay datos de trading aún</p>
              <p className="text-xs text-muted-foreground/70">Importa tus operaciones desde el Portfolio para aparecer en el ranking</p>
            </div>
          </GlowSection>
        )}

        {/* Podium */}
        {!loading && top3.length >= 3 && (
          <GlowSection color={ACCENT}>
            <div className="flex items-end justify-center gap-3 pt-6 pb-4 px-4">
              {podiumOrder.map((trader, i) => trader && (
                <motion.div key={trader.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}
                  className="flex flex-col items-center">
                  <div className="text-2xl mb-1">{podiumLabels[i]}</div>
                  <div className="relative p-0.5 rounded-full" style={{
                    border: `2px solid hsl(${TIER_COLORS[trader.tier] || ACCENT} / 0.5)`,
                    boxShadow: `0 0 12px hsl(${TIER_COLORS[trader.tier] || ACCENT} / 0.2)`,
                  }}>
                    <Avatar className="w-12 h-12">
                      {trader.avatar_url && <AvatarImage src={trader.avatar_url} />}
                      <AvatarFallback className="text-xs font-bold" style={{
                        background: `hsl(${TIER_COLORS[trader.tier] || ACCENT} / 0.15)`,
                      }}>{getInitials(trader.alias)}</AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-1 -right-1 text-sm">{getFlag(trader.country)}</span>
                  </div>
                  <div className="text-xs font-bold mt-1 text-center max-w-[80px] truncate text-foreground">{trader.alias}</div>
                  <div className="text-[10px] font-mono font-bold" style={{
                    color: category === 'pnl' ? (trader.pnl > 0 ? 'hsl(160 84% 39%)' : 'hsl(0 84% 60%)') : `hsl(${ACCENT})`,
                  }}>{formatValue(trader)}</div>
                  <div className="w-16 rounded-t-lg mt-2" style={{
                    height: podiumHeights[i],
                    background: `linear-gradient(165deg, hsl(${ACCENT} / 0.3), hsl(${ACCENT} / 0.05))`,
                    border: `1px solid hsl(${ACCENT} / 0.2)`,
                    borderBottom: 'none',
                  }} />
                </motion.div>
              ))}
            </div>
          </GlowSection>
        )}

        {/* Rankings list */}
        {!loading && (
          <div className="space-y-2">
            {rest.length > 0 && (
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
                <Trophy className="w-3.5 h-3.5" style={{ color: `hsl(${ACCENT})` }} />
                RANKING COMPLETO
              </h3>
            )}
            {rest.map((trader, i) => {
              const tierColor = TIER_COLORS[trader.tier] || ACCENT;
              return (
                <motion.div key={trader.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                  <GlowSection color={tierColor}>
                    <div className="p-3 flex items-center gap-3" style={{ borderLeft: `3px solid hsl(${tierColor})` }}>
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
                          <Badge variant="outline" className="text-[9px] px-1 py-0 font-semibold" style={{
                            color: `hsl(${tierColor})`, borderColor: `hsl(${tierColor} / 0.4)`,
                            background: `hsl(${tierColor} / 0.08)`,
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
                  </GlowSection>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}
