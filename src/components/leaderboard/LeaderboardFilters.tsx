import { LeaderboardPeriod, LeaderboardCategory } from '@/hooks/useLeaderboard';
import { TrendingUp, Target, Flame, Star } from 'lucide-react';
import { GlowSection } from '@/components/ui/glow-section';

interface Props {
  period: LeaderboardPeriod;
  setPeriod: (p: LeaderboardPeriod) => void;
  category: LeaderboardCategory;
  setCategory: (c: LeaderboardCategory) => void;
  accent: string;
}

const PERIODS: { key: LeaderboardPeriod; label: string }[] = [
  { key: 'weekly', label: 'Semanal' },
  { key: 'monthly', label: 'Mensual' },
  { key: 'alltime', label: 'Histórico' },
];

const CATEGORIES = [
  { key: 'pnl' as const, icon: TrendingUp, label: 'P&L', color: '160 84% 39%' },
  { key: 'winrate' as const, icon: Target, label: 'Win Rate', color: '210 80% 55%' },
  { key: 'streak' as const, icon: Flame, label: 'Racha', color: '25 95% 55%' },
  { key: 'signals' as const, icon: Star, label: 'Trades', color: '45 95% 55%' },
];

export function LeaderboardFilters({ period, setPeriod, category, setCategory, accent }: Props) {
  return (
    <div className="space-y-2">
      {/* Period tabs — glassmorphic */}
      <div className="flex rounded-xl p-1" style={{
        background: 'hsl(var(--card) / 0.6)',
        border: '1px solid hsl(var(--border) / 0.15)',
        backdropFilter: 'blur(8px)',
      }}>
        {PERIODS.map(({ key, label }) => (
          <button key={key}
            className="flex-1 py-2 text-xs font-semibold rounded-lg transition-all"
            style={period === key ? {
              background: `linear-gradient(165deg, hsl(${accent}), hsl(${accent} / 0.8))`,
              color: 'hsl(var(--primary-foreground))',
              boxShadow: `0 2px 10px hsl(${accent} / 0.3)`,
            } : { color: 'hsl(var(--muted-foreground))' }}
            onClick={() => setPeriod(key)}
          >{label}</button>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map(cat => (
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
    </div>
  );
}
