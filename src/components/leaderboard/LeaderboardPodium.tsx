import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GlowSection } from '@/components/ui/glow-section';
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
}

export function LeaderboardPodium({ traders, category, accent }: Props) {
  const podiumOrder = [traders[1], traders[0], traders[2]];
  const podiumHeights = [100, 130, 80];
  const podiumLabels = ['🥈', '🥇', '🥉'];

  return (
    <GlowSection color={accent} className="mb-3">
      <div className="flex items-end justify-center gap-3 pt-6 pb-4 px-4">
        {podiumOrder.map((trader, i) => trader && (
          <motion.div key={trader.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}
            className="flex flex-col items-center">
            <div className="text-2xl mb-1">{podiumLabels[i]}</div>
            <div className="relative p-0.5 rounded-full" style={{
              border: `2px solid hsl(${TIER_COLORS[trader.tier] || accent} / 0.5)`,
              boxShadow: `0 0 12px hsl(${TIER_COLORS[trader.tier] || accent} / 0.2)`,
            }}>
              <Avatar className="w-12 h-12">
                {trader.avatar_url && <AvatarImage src={trader.avatar_url} />}
                <AvatarFallback className="text-xs font-bold" style={{
                  background: `hsl(${TIER_COLORS[trader.tier] || accent} / 0.15)`,
                }}>{getInitials(trader.alias)}</AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-1 -right-1 text-sm">{getFlag(trader.country)}</span>
            </div>
            <div className="text-xs font-bold mt-1 text-center max-w-[80px] truncate text-foreground">{trader.alias}</div>
            <div className="text-[10px] font-mono font-bold" style={{
              color: category === 'pnl' ? (trader.pnl > 0 ? 'hsl(160 84% 39%)' : 'hsl(0 84% 60%)') : `hsl(${accent})`,
            }}>{formatValue(trader, category)}</div>
            <div className="w-16 rounded-t-lg mt-2" style={{
              height: podiumHeights[i],
              background: `linear-gradient(165deg, hsl(${accent} / 0.3), hsl(${accent} / 0.05))`,
              border: `1px solid hsl(${accent} / 0.2)`,
              borderBottom: 'none',
            }} />
          </motion.div>
        ))}
      </div>
    </GlowSection>
  );
}
