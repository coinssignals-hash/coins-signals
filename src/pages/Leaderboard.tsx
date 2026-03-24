import { useState, useMemo } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { useTranslation } from '@/i18n/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import {
  Trophy, Medal, Crown, TrendingUp, Flame, Target,
  ChevronRight, Star, Award, Users
} from 'lucide-react';

type Period = 'weekly' | 'monthly' | 'alltime';
type Category = 'pnl' | 'winrate' | 'streak' | 'signals';

interface Trader {
  id: string;
  alias: string;
  avatar: string;
  country: string;
  pnl: number;
  winRate: number;
  trades: number;
  streak: number;
  signalsShared: number;
  followers: number;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond' | 'legendary';
  badges: string[];
}

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

const generateTraders = (): Trader[] => {
  const names = ['AlphaTrader', 'ForexKing', 'PipMaster', 'GoldHunter', 'ScalpQueen', 'SwingPro', 'TrendRider', 'VixBull',
    'YenSamurai', 'EuroEagle', 'CableCrusher', 'OilBaron', 'CryptoFox', 'IndexHawk', 'DeltaForce',
    'Nikkei_Ninja', 'FibWizard', 'RsiRanger', 'MacdMaestro', 'BollingerBoss'];
  const countries = ['🇪🇸', '🇺🇸', '🇧🇷', '🇲🇽', '🇦🇷', '🇬🇧', '🇩🇪', '🇫🇷', '🇯🇵', '🇦🇺', '🇨🇦', '🇮🇹', '🇨🇴', '🇨🇱', '🇵🇪', '🇳🇱', '🇨🇭', '🇸🇬', '🇰🇷', '🇮🇳'];
  const tiers: Trader['tier'][] = ['legendary', 'diamond', 'diamond', 'gold', 'gold', 'gold', 'silver', 'silver', 'silver', 'silver',
    'bronze', 'bronze', 'bronze', 'bronze', 'bronze', 'bronze', 'bronze', 'bronze', 'bronze', 'bronze'];
  const badgePool = ['🎯', '🔥', '💎', '⚡', '🏆', '🦅', '🐋', '👑'];

  return names.map((name, i) => ({
    id: `t${i}`,
    alias: name,
    avatar: name.substring(0, 2).toUpperCase(),
    country: countries[i],
    pnl: Math.round((20000 - i * 900 + Math.random() * 500) * 100) / 100,
    winRate: Math.round((75 - i * 1.5 + Math.random() * 5) * 10) / 10,
    trades: 150 + Math.floor(Math.random() * 300),
    streak: Math.max(0, 15 - i + Math.floor(Math.random() * 5)),
    signalsShared: Math.floor(50 + Math.random() * 200),
    followers: Math.floor(500 - i * 20 + Math.random() * 100),
    tier: tiers[i],
    badges: badgePool.slice(0, Math.max(1, 4 - Math.floor(i / 5))),
  }));
};

const TRADERS = generateTraders();

export default function Leaderboard() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<Period>('weekly');
  const [category, setCategory] = useState<Category>('pnl');

  const sorted = useMemo(() => {
    const copy = [...TRADERS];
    switch (category) {
      case 'pnl': return copy.sort((a, b) => b.pnl - a.pnl);
      case 'winrate': return copy.sort((a, b) => b.winRate - a.winRate);
      case 'streak': return copy.sort((a, b) => b.streak - a.streak);
      case 'signals': return copy.sort((a, b) => b.signalsShared - a.signalsShared);
    }
  }, [category]);

  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  const podiumOrder = [top3[1], top3[0], top3[2]];
  const podiumHeights = [100, 130, 80];
  const podiumLabels = ['🥈', '🥇', '🥉'];
  const podiumColors = ['border-slate-400/50', 'border-amber-400/50', 'border-amber-700/50'];

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
            { key: 'pnl', icon: TrendingUp, label: 'P&L' },
            { key: 'winrate', icon: Target, label: 'Win Rate' },
            { key: 'streak', icon: Flame, label: 'Racha' },
            { key: 'signals', icon: Star, label: 'Señales' },
          ] as const).map(cat => (
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

        {/* Podium */}
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
                  <AvatarFallback className={`text-xs font-bold ${TIER_BG[trader.tier]}`}>
                    {trader.avatar}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-1 -right-1 text-sm">{trader.country}</span>
              </div>
              <div className="text-xs font-bold mt-1 text-center max-w-[80px] truncate">{trader.alias}</div>
              <div className={`text-[10px] font-mono ${trader.pnl > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {category === 'pnl' && `$${trader.pnl.toLocaleString()}`}
                {category === 'winrate' && `${trader.winRate}%`}
                {category === 'streak' && `🔥 ${trader.streak}`}
                {category === 'signals' && `📡 ${trader.signalsShared}`}
              </div>
              <div className="w-16 rounded-t-lg mt-2 bg-gradient-to-t from-primary/30 to-primary/10 border border-primary/20 border-b-0"
                style={{ height: podiumHeights[i] }} />
            </motion.div>
          ))}
        </div>

        {/* Rankings list */}
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
                  <div className="text-sm font-bold text-muted-foreground w-6 text-center">{i + 4}</div>
                  <Avatar className="w-9 h-9">
                    <AvatarFallback className={`text-[10px] font-bold ${TIER_BG[trader.tier]}`}>
                      {trader.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium truncate">{trader.alias}</span>
                      <span className="text-xs">{trader.country}</span>
                      <Badge variant="outline" className={`text-[9px] px-1 py-0 ${TIER_COLORS[trader.tier]}`}>
                        {trader.tier}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{trader.trades} trades</span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5"><Users className="w-2.5 h-2.5" /> {trader.followers}</span>
                      <span>{trader.badges.join('')}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${category === 'pnl' ? (trader.pnl > 0 ? 'text-emerald-400' : 'text-red-400') : 'text-foreground'}`}>
                      {category === 'pnl' && `$${trader.pnl.toLocaleString()}`}
                      {category === 'winrate' && `${trader.winRate}%`}
                      {category === 'streak' && `🔥 ${trader.streak}`}
                      {category === 'signals' && trader.signalsShared}
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
      </div>
    </PageShell>
  );
}
