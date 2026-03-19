import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Achievement {
  code: string;
  name: string;
  description: string;
  icon: string;
  requirementType: 'trades_count' | 'win_streak' | 'total_pips';
  requirementValue: number;
  avatarId: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Trades completados
  { code: 'first-trade', name: 'Primera Operación', description: 'Completa tu primer trade', icon: '🎯', requirementType: 'trades_count', requirementValue: 1, avatarId: 'legend-frost-wolf' },
  { code: 'trader-10', name: 'Trader Activo', description: 'Completa 10 trades', icon: '📊', requirementType: 'trades_count', requirementValue: 10, avatarId: 'legend-shadow-ninja' },
  { code: 'trader-50', name: 'Veterano', description: 'Completa 50 trades', icon: '⚔️', requirementType: 'trades_count', requirementValue: 50, avatarId: 'legend-anubis-god' },
  { code: 'trader-100', name: 'Centurión', description: 'Completa 100 trades', icon: '🏛️', requirementType: 'trades_count', requirementValue: 100, avatarId: 'legend-golden-warrior' },
  // Racha de ganancias
  { code: 'streak-3', name: 'Racha Caliente', description: '3 trades ganadores consecutivos', icon: '🔥', requirementType: 'win_streak', requirementValue: 3, avatarId: 'legend-crystal-phoenix' },
  { code: 'streak-5', name: 'Imparable', description: '5 trades ganadores consecutivos', icon: '💎', requirementType: 'win_streak', requirementValue: 5, avatarId: 'legend-diamond-bull' },
  { code: 'streak-10', name: 'Leyenda Viva', description: '10 trades ganadores consecutivos', icon: '👑', requirementType: 'win_streak', requirementValue: 10, avatarId: 'legend-infernal-king' },
  // Rentabilidad acumulada (pips)
  { code: 'pips-100', name: 'Cazador de Pips', description: 'Acumula +100 pips', icon: '🎖️', requirementType: 'total_pips', requirementValue: 100, avatarId: 'legend-celestial-tiger' },
  { code: 'pips-500', name: 'Maestro del Mercado', description: 'Acumula +500 pips', icon: '🌟', requirementType: 'total_pips', requirementValue: 500, avatarId: 'legend-obsidian-dragon' },
  { code: 'pips-1000', name: 'Dios del Trading', description: 'Acumula +1000 pips', icon: '🌌', requirementType: 'total_pips', requirementValue: 1000, avatarId: 'legend-void-entity' },
];

interface TradingStats {
  totalTrades: number;
  maxWinStreak: number;
  totalPips: number;
}

async function calculateTradingStats(userId: string): Promise<TradingStats> {
  // Fetch journal trades
  const { data: journalTrades } = await supabase
    .from('trading_journal')
    .select('result, pips')
    .eq('user_id', userId)
    .order('trade_date', { ascending: true });

  // Fetch imported trades
  const { data: importedTrades } = await supabase
    .from('imported_trades')
    .select('status, net_profit, profit')
    .eq('user_id', userId)
    .eq('status', 'closed')
    .order('entry_time', { ascending: true });

  const jTrades = journalTrades || [];
  const iTrades = importedTrades || [];

  const totalTrades = jTrades.length + iTrades.length;

  // Calculate total pips from journal
  const journalPips = jTrades.reduce((sum, t) => sum + (t.pips || 0), 0);
  // Approximate pips from imported trades (use profit as proxy)
  const importedPips = iTrades.reduce((sum, t) => sum + (t.net_profit || t.profit || 0), 0);
  const totalPips = journalPips + Math.max(0, importedPips);

  // Calculate max win streak from both sources combined chronologically
  let maxWinStreak = 0;
  let currentStreak = 0;

  // Journal wins
  for (const t of jTrades) {
    if (t.result === 'win' || t.result === 'ganancia') {
      currentStreak++;
      maxWinStreak = Math.max(maxWinStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  // Also check imported trades streak
  currentStreak = 0;
  for (const t of iTrades) {
    if ((t.net_profit || t.profit || 0) > 0) {
      currentStreak++;
      maxWinStreak = Math.max(maxWinStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return { totalTrades, maxWinStreak, totalPips };
}

export function useAchievements() {
  const { user } = useAuth();

  const { data: unlockedCodes = [], refetch: refetchUnlocked } = useQuery({
    queryKey: ['user-achievements', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('user_achievements')
        .select('achievement_code')
        .eq('user_id', user.id);
      return (data || []).map(d => d.achievement_code);
    },
    enabled: !!user?.id,
  });

  const { data: stats } = useQuery({
    queryKey: ['trading-stats', user?.id],
    queryFn: () => calculateTradingStats(user!.id),
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  const checkAndUnlockAchievements = async () => {
    if (!user?.id || !stats) return;

    const newUnlocks: string[] = [];

    for (const achievement of ACHIEVEMENTS) {
      if (unlockedCodes.includes(achievement.code)) continue;

      let met = false;
      switch (achievement.requirementType) {
        case 'trades_count':
          met = stats.totalTrades >= achievement.requirementValue;
          break;
        case 'win_streak':
          met = stats.maxWinStreak >= achievement.requirementValue;
          break;
        case 'total_pips':
          met = stats.totalPips >= achievement.requirementValue;
          break;
      }

      if (met) {
        newUnlocks.push(achievement.code);
      }
    }

    if (newUnlocks.length > 0) {
      const rows = newUnlocks.map(code => ({
        user_id: user.id,
        achievement_code: code,
      }));
      await supabase.from('user_achievements').upsert(rows, { onConflict: 'user_id,achievement_code' });
      await refetchUnlocked();
    }

    return newUnlocks;
  };

  // Map avatar IDs to their unlock status
  const unlockedAvatarIds = new Set(
    ACHIEVEMENTS
      .filter(a => unlockedCodes.includes(a.code))
      .map(a => a.avatarId)
  );

  const getAchievementForAvatar = (avatarId: string) =>
    ACHIEVEMENTS.find(a => a.avatarId === avatarId);

  const getProgress = (achievement: Achievement): number => {
    if (!stats) return 0;
    switch (achievement.requirementType) {
      case 'trades_count':
        return Math.min(1, stats.totalTrades / achievement.requirementValue);
      case 'win_streak':
        return Math.min(1, stats.maxWinStreak / achievement.requirementValue);
      case 'total_pips':
        return Math.min(1, stats.totalPips / achievement.requirementValue);
    }
  };

  return {
    achievements: ACHIEVEMENTS,
    unlockedCodes,
    unlockedAvatarIds,
    stats,
    checkAndUnlockAchievements,
    getAchievementForAvatar,
    getProgress,
  };
}
