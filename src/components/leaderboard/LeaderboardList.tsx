import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { GlowSection } from '@/components/ui/glow-section';
import { Trophy } from 'lucide-react';
import { LeaderboardTrader, LeaderboardCategory } from '@/hooks/useLeaderboard';

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

function formatValue(trader: LeaderboardTrader, category: LeaderboardCategory) {
  switch (category) {
    case 'pnl': return `$${trader.pnl.toLocaleString()}`;
    case 'winrate': return `${trader.winRate}%`;
    case 'streak': return `🔥 ${trader.streak}`;
    case 'signals': return `${trader.trades}`;
  }
}

interface Props {
  traders: LeaderboardTrader[];
  category: LeaderboardCategory;
  accent: string;
  total: number;
}

export function LeaderboardList({ traders, category, accent, total }: Props) {
  if (traders.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
        <Trophy className="w-3.5 h-3.5" style={{ color: `hsl(${accent})` }} />
        RANKING COMPLETO
        <span className="ml-auto text-[10px] font-mono" style={{ color: `hsl(${accent} / 0.7)` }}>{total} traders</span>
      </h3>
      {traders.map((trader, i) => {
        const tierColor = TIER_COLORS[trader.tier] || accent;
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
                  }}>{formatValue(trader, category)}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {category !== 'winrate' ? `WR ${trader.winRate}%` : `${trader.trades} ops`}
                  </div>
                </div>
              </div>
            </GlowSection>
          </motion.div>
        );
      })}
    </div>
  );
}
