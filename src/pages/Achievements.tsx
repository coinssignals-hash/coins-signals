import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Target, Flame, TrendingUp, Lock, CheckCircle2, LogIn } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { useAchievements, ACHIEVEMENTS, Achievement } from '@/hooks/useAchievements';
import { useAuth } from '@/hooks/useAuth';
import { TRADING_AVATARS } from '@/components/settings/AvatarPicker';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const categoryMeta: Record<string, { icon: typeof Trophy; label: string; color: string }> = {
  trades_count: { icon: Target, label: 'Volumen de Trades', color: 'text-chart-2' },
  win_streak: { icon: Flame, label: 'Rachas Ganadoras', color: 'text-chart-4' },
  total_pips: { icon: TrendingUp, label: 'Pips Acumulados', color: 'text-primary' },
};

function AchievementCard({ achievement, unlocked, progress }: { achievement: Achievement; unlocked: boolean; progress: number }) {
  const avatar = TRADING_AVATARS.find(a => a.id === achievement.avatarId);
  const pct = Math.round(progress * 100);
  const meta = categoryMeta[achievement.requirementType];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative rounded-xl border p-4 transition-all",
        unlocked
          ? "bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-transparent border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)]"
          : "bg-card/50 border-border"
      )}
    >
      {/* Unlocked badge */}
      {unlocked && (
        <div className="absolute -top-2 -right-2 bg-yellow-500 text-yellow-950 rounded-full p-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
        </div>
      )}

      <div className="flex gap-3">
        {/* Avatar preview */}
        <div className="relative shrink-0">
          <div className={cn(
            "w-14 h-14 rounded-lg overflow-hidden border-2",
            unlocked ? "border-yellow-500/60" : "border-border"
          )}>
            {avatar ? (
              <img
                src={avatar.src}
                alt={avatar.label}
                className={cn("w-full h-full object-cover", !unlocked && "grayscale opacity-40")}
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center text-2xl">
                {achievement.icon}
              </div>
            )}
          </div>
          {!unlocked && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Lock className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-lg">{achievement.icon}</span>
            <h3 className={cn(
              "text-sm font-bold truncate",
              unlocked ? "text-yellow-400" : "text-foreground"
            )}>
              {achievement.name}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mb-2">{achievement.description}</p>

          {/* Progress bar */}
          <div className="flex items-center gap-2">
            <Progress value={pct} className="h-1.5 flex-1" />
            <span className={cn(
              "text-[10px] font-bold tabular-nums",
              unlocked ? "text-yellow-400" : "text-muted-foreground"
            )}>
              {pct}%
            </span>
          </div>

          {/* Avatar reward */}
          {avatar && (
            <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
              <Trophy className="w-2.5 h-2.5" />
              Avatar: {avatar.label}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function Achievements() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    achievements,
    unlockedCodes,
    stats,
    getProgress,
    checkAndUnlockAchievements,
  } = useAchievements();

  useEffect(() => {
    checkAndUnlockAchievements();
  }, [stats]);

  const unlockedCount = unlockedCodes.length;
  const totalCount = achievements.length;

  // Group achievements by category
  const grouped = {
    trades_count: achievements.filter(a => a.requirementType === 'trades_count'),
    win_streak: achievements.filter(a => a.requirementType === 'win_streak'),
    total_pips: achievements.filter(a => a.requirementType === 'total_pips'),
  };

  return (
    <PageShell>
      <Header />
      <main className="min-h-screen pb-24 px-4">
        {/* Back button & title */}
        <div className="flex items-center gap-3 py-4">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h1 className="text-xl font-bold text-foreground">Logros</h1>
          </div>
        </div>

        {!user ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <LogIn className="w-10 h-10 text-muted-foreground" />
            <p className="text-muted-foreground">Inicia sesión para ver tus logros</p>
            <Button onClick={() => navigate('/auth')}>
              <LogIn className="w-4 h-4 mr-2" /> Iniciar Sesión
            </Button>
          </div>
        ) : (
          <>
            {/* Overall stats */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl border border-border bg-gradient-to-br from-yellow-500/5 via-card to-card p-5 mb-6"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-foreground">Progreso General</span>
                <span className="text-sm font-bold text-yellow-400">{unlockedCount}/{totalCount}</span>
              </div>
              <Progress value={(unlockedCount / totalCount) * 100} className="h-2 mb-4" />

              {/* Stats row */}
              {stats && (
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div className="text-center p-2 rounded-lg bg-muted/30">
                    <Target className="w-4 h-4 mx-auto mb-1 text-chart-2" />
                    <p className="text-lg font-bold text-foreground tabular-nums">{stats.totalTrades}</p>
                    <p className="text-[10px] text-muted-foreground">Trades</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/30">
                    <Flame className="w-4 h-4 mx-auto mb-1 text-chart-4" />
                    <p className="text-lg font-bold text-foreground tabular-nums">{stats.maxWinStreak}</p>
                    <p className="text-[10px] text-muted-foreground">Mejor Racha</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/30">
                    <TrendingUp className="w-4 h-4 mx-auto mb-1 text-primary" />
                    <p className="text-lg font-bold text-foreground tabular-nums">{Math.round(stats.totalPips)}</p>
                    <p className="text-[10px] text-muted-foreground">Pips</p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Achievement categories */}
            {Object.entries(grouped).map(([type, items]) => {
              const meta = categoryMeta[type];
              const Icon = meta.icon;
              const catUnlocked = items.filter(a => unlockedCodes.includes(a.code)).length;

              return (
                <div key={type} className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={cn("w-4 h-4", meta.color)} />
                    <h2 className="text-sm font-bold text-foreground">{meta.label}</h2>
                    <span className="text-xs text-muted-foreground ml-auto">{catUnlocked}/{items.length}</span>
                  </div>
                  <div className="space-y-3">
                    {items.map((achievement) => (
                      <AchievementCard
                        key={achievement.code}
                        achievement={achievement}
                        unlocked={unlockedCodes.includes(achievement.code)}
                        progress={getProgress(achievement)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </main>
    </PageShell>
  );
}
