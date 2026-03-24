import { useState, useMemo } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { useTranslation } from '@/i18n/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import {
  Trophy, TrendingUp, Flame, Target, Star, Users, AlertCircle,
} from 'lucide-react';
import { useLeaderboard, LeaderboardPeriod, LeaderboardCategory } from '@/hooks/useLeaderboard';

const TIER_COLORS: Record<string, string> = {
  bronze: 'text-amber-700',
  silver: 'text-slate-400',
  gold: 'text-amber-400',
  diamond: 'text-cyan-400',
  legendary: 'text-purple-400',
};

const TIER_BG: Record<string, string> = {
  bronze: 'bg-amber-900/20 border-amber-700/30',
  silver: 'bg-slate-800/30 border-slate-500/30',
  gold: 'bg-amber-900/20 border-amber-400/30',
  diamond: 'bg-cyan-900/20 border-cyan-400/30',
  legendary: 'bg-purple-900/20 border-purple-400/30',
};

const COUNTRY_FLAGS: Record<string, string> = {
  AR: '🇦🇷', BR: '🇧🇷', CL: '🇨🇱', CO: '🇨🇴', MX: '🇲🇽', PE: '🇵🇪',
  UY: '🇺🇾', US: '🇺🇸', GB: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷', ES: '🇪🇸',
  IT: '🇮🇹', NL: '🇳🇱', JP: '🇯🇵', AU: '🇦🇺', CA: '🇨🇦',
};

function getFlag(country: string | null): string {
  if (!country) return '🌍';
  const code = country.toUpperCase().trim();
  return COUNTRY_FLAGS[code] || '🌍';
}

function getInitials(alias: string): string {
  return alias.substring(0, 2).toUpperCase();
}

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
  const podiumColors = ['border-slate-400/50', 'border-amber-400/50', 'border-amber-700/50'];

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
      <div className="space-y-4 pb-24">
        {/* Period tabs */}
        <div className="flex bg-muted rounded-xl p-1">
          {([['weekly', 'Semanal'], ['monthly', 'Mensual'], ['alltime', 'Histórico']] as const).map(([key, label]) => (
            <button
              key={key}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${period === key ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground'}`}
              onClick={() => setPeriod(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {([
            { key: 'pnl' as const, icon: TrendingUp, label: 'P&L' },
            { key: 'winrate' as const, icon: Target, label: 'Win Rate' },
            { key: 'streak' as const, icon: Flame, label: 'Racha' },
            { key: 'signals' as const, icon: Star, label: 'Trades' },
          ]).map(cat => (
            <button
              key={cat.key}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                category === cat.key ? 'bg-primary/20 border border-primary/40 text-primary' : 'bg-muted text-muted-foreground'
              }`}
              onClick={() => setCategory(cat.key)}
            >
              <cat.icon className="w-3 h-3" /> {cat.label}
            </button>
          ))}
        </div>

        {/* Total participants */}
        {total > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="w-3 h-3" />
            <span>{total} traders participando</span>
          </div>
        )}

        {/* Loading state */}
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
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <Card className="bg-destructive/10 border-destructive/30">
            <CardContent className="p-4 flex items-center gap-3 text-sm">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <span>Error al cargar el leaderboard. Intenta de nuevo.</span>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {!loading && !error && traders.length === 0 && (
          <Card className="bg-muted/50 border-border/40">
            <CardContent className="p-8 text-center space-y-2">
              <Trophy className="w-10 h-10 mx-auto text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No hay datos de trading aún</p>
              <p className="text-xs text-muted-foreground/70">Importa tus operaciones desde el Portfolio para aparecer en el ranking</p>
            </CardContent>
          </Card>
        )}

        {/* Podium */}
        {!loading && top3.length >= 3 && (
          <div className="flex items-end justify-center gap-3 pt-4 pb-2">
            {podiumOrder.map((trader, i) => trader && (
              <motion.div
                key={trader.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className="flex flex-col items-center"
              >
                <div className="text-2xl mb-1">{podiumLabels[i]}</div>
                <div className={`relative p-0.5 rounded-full border-2 ${podiumColors[i]}`}>
                  <Avatar className="w-12 h-12">
                    {trader.avatar_url && <AvatarImage src={trader.avatar_url} />}
                    <AvatarFallback className={`text-xs font-bold ${TIER_BG[trader.tier]}`}>
                      {getInitials(trader.alias)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-1 -right-1 text-sm">{getFlag(trader.country)}</span>
                </div>
                <div className="text-xs font-bold mt-1 text-center max-w-[80px] truncate">{trader.alias}</div>
                <div className={`text-[10px] font-mono ${category === 'pnl' ? (trader.pnl > 0 ? 'text-emerald-400' : 'text-red-400') : 'text-foreground'}`}>
                  {formatValue(trader)}
                </div>
                <div className="w-16 rounded-t-lg mt-2 bg-gradient-to-t from-primary/30 to-primary/10 border border-primary/20 border-b-0"
                  style={{ height: podiumHeights[i] }} />
              </motion.div>
            ))}
          </div>
        )}

        {/* Rankings list */}
        {!loading && (
          <div className="space-y-2">
            {rest.map((trader, i) => (
              <motion.div
                key={trader.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="bg-card/70 backdrop-blur border-border/40 hover:border-primary/30 transition-colors">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="text-sm font-bold text-muted-foreground w-6 text-center">{trader.rank}</div>
                    <Avatar className="w-9 h-9">
                      {trader.avatar_url && <AvatarImage src={trader.avatar_url} />}
                      <AvatarFallback className={`text-[10px] font-bold ${TIER_BG[trader.tier]}`}>
                        {getInitials(trader.alias)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium truncate">{trader.alias}</span>
                        <span className="text-xs">{getFlag(trader.country)}</span>
                        <Badge variant="outline" className={`text-[9px] px-1 py-0 ${TIER_COLORS[trader.tier]}`}>
                          {trader.tier}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{trader.trades} trades</span>
                        <span>·</span>
                        <span>W{trader.winners}/L{trader.losers}</span>
                        <span>·</span>
                        <span>{trader.symbolsTraded} pares</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${category === 'pnl' ? (trader.pnl > 0 ? 'text-emerald-400' : 'text-red-400') : 'text-foreground'}`}>
                        {formatValue(trader)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {category !== 'winrate' && `WR ${trader.winRate}%`}
                        {category === 'winrate' && `${trader.trades} ops`}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
