import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export type RequirementType =
  | 'trades_count'
  | 'win_streak'
  | 'total_pips'
  | 'trading_days'
  | 'journal_entries'
  | 'courses_completed'
  | 'favorite_signals'
  | 'win_rate';

export interface Achievement {
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirementType: RequirementType;
  requirementValue: number;
  avatarId?: string; // optional — not all achievements unlock avatars
  xp: number;
}

// ─── Achievement Categories ───
export const ACHIEVEMENT_CATEGORIES = {
  trades_count: { label: 'Volumen de Trades', icon: '📊', color: '190 80% 55%' },
  win_streak: { label: 'Rachas Ganadoras', icon: '🔥', color: '25 95% 55%' },
  total_pips: { label: 'Pips Acumulados', icon: '📈', color: '142 60% 50%' },
  trading_days: { label: 'Días Operando', icon: '📅', color: '217 91% 60%' },
  journal_entries: { label: 'Diario de Trading', icon: '📝', color: '270 70% 60%' },
  courses_completed: { label: 'Formación', icon: '🎓', color: '45 90% 55%' },
  favorite_signals: { label: 'Señales Guardadas', icon: '⭐', color: '340 75% 55%' },
  win_rate: { label: 'Consistencia', icon: '🎯', color: '160 65% 45%' },
} as const;

export const ACHIEVEMENTS: Achievement[] = [
  // ─── Trades completados ───
  { code: 'first-trade', name: 'Primera Operación', description: 'Completa tu primer trade', icon: '🎯', category: 'trades_count', requirementType: 'trades_count', requirementValue: 1, avatarId: 'legend-frost-wolf', xp: 50 },
  { code: 'trader-10', name: 'Trader Activo', description: 'Completa 10 trades', icon: '📊', category: 'trades_count', requirementType: 'trades_count', requirementValue: 10, avatarId: 'legend-shadow-ninja', xp: 100 },
  { code: 'trader-50', name: 'Veterano', description: 'Completa 50 trades', icon: '⚔️', category: 'trades_count', requirementType: 'trades_count', requirementValue: 50, avatarId: 'legend-anubis-god', xp: 250 },
  { code: 'trader-100', name: 'Centurión', description: 'Completa 100 trades', icon: '🏛️', category: 'trades_count', requirementType: 'trades_count', requirementValue: 100, avatarId: 'legend-golden-warrior', xp: 500 },
  { code: 'trader-250', name: 'Máquina de Trading', description: 'Completa 250 trades', icon: '⚡', category: 'trades_count', requirementType: 'trades_count', requirementValue: 250, xp: 750 },
  { code: 'trader-500', name: 'Élite Absoluta', description: 'Completa 500 trades', icon: '💠', category: 'trades_count', requirementType: 'trades_count', requirementValue: 500, xp: 1000 },

  // ─── Racha de ganancias ───
  { code: 'streak-3', name: 'Racha Caliente', description: '3 trades ganadores consecutivos', icon: '🔥', category: 'win_streak', requirementType: 'win_streak', requirementValue: 3, avatarId: 'legend-crystal-phoenix', xp: 100 },
  { code: 'streak-5', name: 'Imparable', description: '5 trades ganadores consecutivos', icon: '💎', category: 'win_streak', requirementType: 'win_streak', requirementValue: 5, avatarId: 'legend-diamond-bull', xp: 250 },
  { code: 'streak-7', name: 'En Llamas', description: '7 trades ganadores consecutivos', icon: '🌋', category: 'win_streak', requirementType: 'win_streak', requirementValue: 7, xp: 400 },
  { code: 'streak-10', name: 'Leyenda Viva', description: '10 trades ganadores consecutivos', icon: '👑', category: 'win_streak', requirementType: 'win_streak', requirementValue: 10, avatarId: 'legend-infernal-king', xp: 750 },

  // ─── Pips acumulados ───
  { code: 'pips-100', name: 'Cazador de Pips', description: 'Acumula +100 pips', icon: '🎖️', category: 'total_pips', requirementType: 'total_pips', requirementValue: 100, avatarId: 'legend-celestial-tiger', xp: 100 },
  { code: 'pips-500', name: 'Maestro del Mercado', description: 'Acumula +500 pips', icon: '🌟', category: 'total_pips', requirementType: 'total_pips', requirementValue: 500, avatarId: 'legend-obsidian-dragon', xp: 300 },
  { code: 'pips-1000', name: 'Dios del Trading', description: 'Acumula +1000 pips', icon: '🌌', category: 'total_pips', requirementType: 'total_pips', requirementValue: 1000, avatarId: 'legend-void-entity', xp: 750 },
  { code: 'pips-2500', name: 'Leyenda de los Pips', description: 'Acumula +2500 pips', icon: '🏆', category: 'total_pips', requirementType: 'total_pips', requirementValue: 2500, xp: 1500 },

  // ─── Días operando ───
  { code: 'days-1', name: 'Primer Día', description: 'Opera tu primer día', icon: '🌅', category: 'trading_days', requirementType: 'trading_days', requirementValue: 1, xp: 25 },
  { code: 'days-5', name: 'Semana Completa', description: 'Opera 5 días distintos', icon: '📅', category: 'trading_days', requirementType: 'trading_days', requirementValue: 5, xp: 75 },
  { code: 'days-20', name: 'Mes Activo', description: 'Opera 20 días distintos', icon: '🗓️', category: 'trading_days', requirementType: 'trading_days', requirementValue: 20, xp: 200 },
  { code: 'days-60', name: 'Trimestre Sólido', description: 'Opera 60 días distintos', icon: '📆', category: 'trading_days', requirementType: 'trading_days', requirementValue: 60, xp: 500 },
  { code: 'days-120', name: 'Trader Dedicado', description: 'Opera 120 días distintos', icon: '🏅', category: 'trading_days', requirementType: 'trading_days', requirementValue: 120, xp: 1000 },
  { code: 'days-250', name: 'Año de Mercado', description: 'Opera 250 días distintos', icon: '👑', category: 'trading_days', requirementType: 'trading_days', requirementValue: 250, xp: 2000 },

  // ─── Diario de trading ───
  { code: 'journal-1', name: 'Primera Nota', description: 'Registra tu primer trade en el diario', icon: '📝', category: 'journal_entries', requirementType: 'journal_entries', requirementValue: 1, xp: 25 },
  { code: 'journal-10', name: 'Diario Activo', description: 'Registra 10 trades en el diario', icon: '📓', category: 'journal_entries', requirementType: 'journal_entries', requirementValue: 10, xp: 100 },
  { code: 'journal-50', name: 'Analista Disciplinado', description: 'Registra 50 trades en el diario', icon: '📋', category: 'journal_entries', requirementType: 'journal_entries', requirementValue: 50, xp: 300 },
  { code: 'journal-100', name: 'Historiador del Mercado', description: 'Registra 100 trades en el diario', icon: '📚', category: 'journal_entries', requirementType: 'journal_entries', requirementValue: 100, xp: 600 },
  { code: 'journal-250', name: 'Archivista Legendario', description: 'Registra 250 trades en el diario', icon: '🏛️', category: 'journal_entries', requirementType: 'journal_entries', requirementValue: 250, xp: 1200 },

  // ─── Cursos completados ───
  { code: 'course-1', name: 'Estudiante', description: 'Completa 1 lección', icon: '📖', category: 'courses_completed', requirementType: 'courses_completed', requirementValue: 1, xp: 25 },
  { code: 'course-5', name: 'Aprendiz', description: 'Completa 5 lecciones', icon: '📘', category: 'courses_completed', requirementType: 'courses_completed', requirementValue: 5, xp: 75 },
  { code: 'course-15', name: 'Conocedor', description: 'Completa 15 lecciones', icon: '🎓', category: 'courses_completed', requirementType: 'courses_completed', requirementValue: 15, xp: 200 },
  { code: 'course-30', name: 'Erudito', description: 'Completa 30 lecciones', icon: '🧠', category: 'courses_completed', requirementType: 'courses_completed', requirementValue: 30, xp: 500 },
  { code: 'course-50', name: 'Maestro Académico', description: 'Completa 50 lecciones', icon: '🏆', category: 'courses_completed', requirementType: 'courses_completed', requirementValue: 50, xp: 1000 },

  // ─── Señales guardadas ───
  { code: 'fav-1', name: 'Primera Favorita', description: 'Guarda tu primera señal', icon: '⭐', category: 'favorite_signals', requirementType: 'favorite_signals', requirementValue: 1, xp: 15 },
  { code: 'fav-10', name: 'Coleccionista', description: 'Guarda 10 señales', icon: '🌟', category: 'favorite_signals', requirementType: 'favorite_signals', requirementValue: 10, xp: 75 },
  { code: 'fav-50', name: 'Curador de Señales', description: 'Guarda 50 señales', icon: '💫', category: 'favorite_signals', requirementType: 'favorite_signals', requirementValue: 50, xp: 200 },

  // ─── Win rate / Consistencia (mínimo 10 trades) ───
  { code: 'winrate-50', name: 'Equilibrio', description: 'Mantén un 50%+ de win rate (mín. 10 trades)', icon: '⚖️', category: 'win_rate', requirementType: 'win_rate', requirementValue: 50, xp: 100 },
  { code: 'winrate-60', name: 'Constante', description: 'Mantén un 60%+ de win rate (mín. 10 trades)', icon: '📐', category: 'win_rate', requirementType: 'win_rate', requirementValue: 60, xp: 200 },
  { code: 'winrate-70', name: 'Precisión Quirúrgica', description: 'Mantén un 70%+ de win rate (mín. 10 trades)', icon: '🎯', category: 'win_rate', requirementType: 'win_rate', requirementValue: 70, xp: 400 },
  { code: 'winrate-80', name: 'Francotirador', description: 'Mantén un 80%+ de win rate (mín. 10 trades)', icon: '🔫', category: 'win_rate', requirementType: 'win_rate', requirementValue: 80, xp: 750 },
];

export interface TradingStats {
  totalTrades: number;
  maxWinStreak: number;
  totalPips: number;
  tradingDays: number;
  journalEntries: number;
  coursesCompleted: number;
  favoriteSignals: number;
  winRate: number;
  totalXp: number;
}

async function calculateTradingStats(userId: string): Promise<TradingStats> {
  // Fetch all data sources in parallel
  const [journalRes, importedRes, courseRes, favSignalsRes] = await Promise.all([
    supabase
      .from('trading_journal')
      .select('result, pips, trade_date')
      .eq('user_id', userId)
      .order('trade_date', { ascending: true }),
    supabase
      .from('imported_trades')
      .select('status, net_profit, profit, entry_time')
      .eq('user_id', userId)
      .eq('status', 'closed')
      .order('entry_time', { ascending: true }),
    supabase
      .from('course_progress')
      .select('id')
      .eq('user_id', userId)
      .eq('completed', true),
    supabase
      .from('favorite_signals')
      .select('id')
      .eq('user_id', userId),
  ]);

  const jTrades = journalRes.data || [];
  const iTrades = importedRes.data || [];

  const totalTrades = jTrades.length + iTrades.length;

  // Pips
  const journalPips = jTrades.reduce((sum, t) => sum + (t.pips || 0), 0);
  const importedPips = iTrades.reduce((sum, t) => sum + (t.net_profit || t.profit || 0), 0);
  const totalPips = journalPips + Math.max(0, importedPips);

  // Win streak
  let maxWinStreak = 0;
  let currentStreak = 0;
  for (const t of jTrades) {
    if (t.result === 'win' || t.result === 'ganancia') { currentStreak++; maxWinStreak = Math.max(maxWinStreak, currentStreak); } else { currentStreak = 0; }
  }
  currentStreak = 0;
  for (const t of iTrades) {
    if ((t.net_profit || t.profit || 0) > 0) { currentStreak++; maxWinStreak = Math.max(maxWinStreak, currentStreak); } else { currentStreak = 0; }
  }

  // Trading days (unique dates)
  const daySet = new Set<string>();
  jTrades.forEach(t => { if (t.trade_date) daySet.add(t.trade_date.slice(0, 10)); });
  iTrades.forEach(t => { if (t.entry_time) daySet.add(t.entry_time.slice(0, 10)); });

  // Win rate
  const jWins = jTrades.filter(t => t.result === 'win' || t.result === 'ganancia').length;
  const iWins = iTrades.filter(t => (t.net_profit || t.profit || 0) > 0).length;
  const totalWins = jWins + iWins;
  const winRate = totalTrades >= 10 ? Math.round((totalWins / totalTrades) * 100) : 0;

  // Journal entries (only from trading_journal)
  const journalEntries = jTrades.length;

  // Courses completed
  const coursesCompleted = courseRes.data?.length || 0;

  // Favorite signals
  const favoriteSignals = favSignalsRes.data?.length || 0;

  return {
    totalTrades,
    maxWinStreak,
    totalPips,
    tradingDays: daySet.size,
    journalEntries,
    coursesCompleted,
    favoriteSignals,
    winRate,
    totalXp: 0, // calculated from unlocked achievements
  };
}

export function useAchievements() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

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
    if (!user?.id) return;

    await queryClient.invalidateQueries({ queryKey: ['trading-stats', user.id] });
    const freshStats = await queryClient.fetchQuery({
      queryKey: ['trading-stats', user.id],
      queryFn: () => calculateTradingStats(user.id),
    });

    if (!freshStats) return;

    const newUnlocks: string[] = [];

    for (const achievement of ACHIEVEMENTS) {
      if (unlockedCodes.includes(achievement.code)) continue;

      let met = false;
      switch (achievement.requirementType) {
        case 'trades_count': met = freshStats.totalTrades >= achievement.requirementValue; break;
        case 'win_streak': met = freshStats.maxWinStreak >= achievement.requirementValue; break;
        case 'total_pips': met = freshStats.totalPips >= achievement.requirementValue; break;
        case 'trading_days': met = freshStats.tradingDays >= achievement.requirementValue; break;
        case 'journal_entries': met = freshStats.journalEntries >= achievement.requirementValue; break;
        case 'courses_completed': met = freshStats.coursesCompleted >= achievement.requirementValue; break;
        case 'favorite_signals': met = freshStats.favoriteSignals >= achievement.requirementValue; break;
        case 'win_rate': met = freshStats.totalTrades >= 10 && freshStats.winRate >= achievement.requirementValue; break;
      }

      if (met) newUnlocks.push(achievement.code);
    }

    if (newUnlocks.length > 0) {
      const rows = newUnlocks.map(code => ({ user_id: user.id, achievement_code: code }));
      await supabase.from('user_achievements').upsert(rows, { onConflict: 'user_id,achievement_code' });
      await refetchUnlocked();

      for (const code of newUnlocks) {
        const achievement = ACHIEVEMENTS.find(a => a.code === code);
        if (achievement) {
          const avatarMsg = achievement.avatarId ? ' ¡Nuevo avatar legendario disponible! 👑' : '';
          toast({
            title: `${achievement.icon} ¡Logro desbloqueado! +${achievement.xp} XP`,
            description: `${achievement.name}: ${achievement.description}.${avatarMsg}`,
            duration: 6000,
          });
        }
      }
    }

    return newUnlocks;
  };

  const unlockedAvatarIds = new Set(
    ACHIEVEMENTS.filter(a => unlockedCodes.includes(a.code) && a.avatarId).map(a => a.avatarId!)
  );

  const getAchievementForAvatar = (avatarId: string) =>
    ACHIEVEMENTS.find(a => a.avatarId === avatarId);

  const getProgress = (achievement: Achievement): number => {
    if (!stats) return 0;
    switch (achievement.requirementType) {
      case 'trades_count': return Math.min(1, stats.totalTrades / achievement.requirementValue);
      case 'win_streak': return Math.min(1, stats.maxWinStreak / achievement.requirementValue);
      case 'total_pips': return Math.min(1, stats.totalPips / achievement.requirementValue);
      case 'trading_days': return Math.min(1, stats.tradingDays / achievement.requirementValue);
      case 'journal_entries': return Math.min(1, stats.journalEntries / achievement.requirementValue);
      case 'courses_completed': return Math.min(1, stats.coursesCompleted / achievement.requirementValue);
      case 'favorite_signals': return Math.min(1, stats.favoriteSignals / achievement.requirementValue);
      case 'win_rate': return stats.totalTrades >= 10 ? Math.min(1, stats.winRate / achievement.requirementValue) : 0;
    }
  };

  const totalXp = ACHIEVEMENTS
    .filter(a => unlockedCodes.includes(a.code))
    .reduce((sum, a) => sum + a.xp, 0);

  const level = Math.floor(totalXp / 500) + 1;
  const xpInLevel = totalXp % 500;

  return {
    achievements: ACHIEVEMENTS,
    categories: ACHIEVEMENT_CATEGORIES,
    unlockedCodes,
    unlockedAvatarIds,
    stats,
    totalXp,
    level,
    xpInLevel,
    checkAndUnlockAchievements,
    getAchievementForAvatar,
    getProgress,
  };
}
