import { LeaderboardTrader, LeaderboardCategory } from '@/hooks/useLeaderboard';

export const TIER_COLORS: Record<string, string> = {
  bronze: '30 60% 45%', silver: '220 10% 60%', gold: '45 95% 55%',
  diamond: '190 90% 55%', legendary: '270 70% 60%',
};

export const COUNTRY_FLAGS: Record<string, string> = {
  AR: '🇦🇷', BR: '🇧🇷', CL: '🇨🇱', CO: '🇨🇴', MX: '🇲🇽', PE: '🇵🇪',
  UY: '🇺🇾', US: '🇺🇸', GB: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷', ES: '🇪🇸',
  IT: '🇮🇹', NL: '🇳🇱', JP: '🇯🇵', AU: '🇦🇺', CA: '🇨🇦',
};

export const getFlag = (c: string | null) => c ? COUNTRY_FLAGS[c.toUpperCase().trim()] || '🌍' : '🌍';
export const getInitials = (a: string) => a.substring(0, 2).toUpperCase();

export function formatValue(trader: LeaderboardTrader, category: LeaderboardCategory) {
  switch (category) {
    case 'pnl': return `$${trader.pnl.toLocaleString()}`;
    case 'winrate': return `${trader.winRate}%`;
    case 'streak': return `🔥 ${trader.streak}`;
    case 'signals': return `${trader.trades}`;
  }
}
