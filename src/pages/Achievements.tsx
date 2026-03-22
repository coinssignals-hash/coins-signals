import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trophy, Lock, CheckCircle2, LogIn, Zap, Star } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { useAchievements, ACHIEVEMENTS, Achievement, ACHIEVEMENT_CATEGORIES, RequirementType } from '@/hooks/useAchievements';
import { useAuth } from '@/hooks/useAuth';
import { TRADING_AVATARS } from '@/components/settings/AvatarPicker';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

function StatValue({ value, label, color }: { value: number | string; label: string; color: string }) {
  return (
    <div className="text-center p-3 rounded-xl" style={{ background: `hsl(${color} / 0.06)`, border: `1px solid hsl(${color} / 0.12)` }}>
      <p className="text-lg font-bold tabular-nums" style={{ color: `hsl(${color})` }}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function AchievementCard({ achievement, unlocked, progress }: { achievement: Achievement; unlocked: boolean; progress: number }) {
  const avatar = achievement.avatarId ? TRADING_AVATARS.find(a => a.id === achievement.avatarId) : null;
  const pct = Math.round(progress * 100);
  const catMeta = ACHIEVEMENT_CATEGORIES[achievement.category as RequirementType];
  const color = catMeta?.color || '217 91% 60%';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-xl overflow-hidden transition-all"
      style={{
        background: unlocked
          ? `linear-gradient(165deg, hsl(45 90% 55% / 0.1) 0%, hsl(var(--card)) 40%, hsl(var(--background)) 100%)`
          : `linear-gradient(165deg, hsl(${color} / 0.04) 0%, hsl(var(--card)) 40%, hsl(var(--background)) 100%)`,
        border: unlocked
          ? `1px solid hsl(45 90% 55% / 0.3)`
          : `1px solid hsl(${color} / 0.12)`,
      }}
    >
      {/* Top glow line */}
      <div className="absolute top-0 inset-x-0 h-[2px]" style={{
        background: unlocked
          ? `linear-gradient(90deg, transparent, hsl(45 90% 55% / 0.7), transparent)`
          : `linear-gradient(90deg, transparent, hsl(${color} / 0.3), transparent)`,
      }} />

      {unlocked && (
        <div className="absolute -top-1 -right-1 rounded-full p-1" style={{ background: 'hsl(45 90% 55%)' }}>
          <CheckCircle2 className="w-3 h-3" style={{ color: 'hsl(45 90% 15%)' }} />
        </div>
      )}

      <div className="flex gap-3 p-3.5">
        {/* Avatar or Icon */}
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-lg overflow-hidden" style={{
            border: unlocked ? '2px solid hsl(45 90% 55% / 0.6)' : `2px solid hsl(${color} / 0.2)`,
          }}>
            {avatar ? (
              <img src={avatar.src} alt={avatar.label} className={cn("w-full h-full object-cover", !unlocked && "grayscale opacity-40")} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl" style={{
                background: `hsl(${color} / 0.08)`,
              }}>
                {achievement.icon}
              </div>
            )}
          </div>
          {!unlocked && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Lock className="w-3.5 h-3.5 text-muted-foreground/60" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-base">{achievement.icon}</span>
            <h3 className={cn("text-xs font-bold truncate", unlocked ? "text-yellow-400" : "text-foreground")}>
              {achievement.name}
            </h3>
            <span className="ml-auto text-[9px] font-bold tabular-nums px-1.5 py-0.5 rounded-full" style={{
              background: unlocked ? 'hsl(45 90% 55% / 0.15)' : `hsl(${color} / 0.1)`,
              color: unlocked ? 'hsl(45 90% 55%)' : `hsl(${color})`,
            }}>
              +{achievement.xp} XP
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mb-1.5">{achievement.description}</p>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: `hsl(${color} / 0.1)` }}>
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{ background: unlocked ? 'hsl(45 90% 55%)' : `hsl(${color})` }}
              />
            </div>
            <span className={cn("text-[10px] font-bold tabular-nums", unlocked ? "text-yellow-400" : "text-muted-foreground")}>
              {pct}%
            </span>
          </div>

          {avatar && (
            <p className="text-[9px] text-muted-foreground mt-1 flex items-center gap-1">
              <Trophy className="w-2.5 h-2.5" /> Avatar: {avatar.label}
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
    categories,
    unlockedCodes,
    stats,
    totalXp,
    level,
    xpInLevel,
    getProgress,
    checkAndUnlockAchievements,
  } = useAchievements();

  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    checkAndUnlockAchievements();
  }, [stats]);

  const unlockedCount = unlockedCodes.length;
  const totalCount = achievements.length;

  const categoryKeys = Object.keys(categories) as RequirementType[];
  const filteredAchievements = activeCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === activeCategory);

  return (
    <PageShell>
      <Header />
      <main className="min-h-screen pb-24 px-4">
        {/* Back & Title */}
        <div className="flex items-center gap-3 py-4">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5" style={{ color: 'hsl(45 90% 55%)' }} />
            <h1 className="text-xl font-bold text-foreground">Logros</h1>
          </div>
        </div>

        {!user ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <LogIn className="w-10 h-10 text-muted-foreground" />
            <p className="text-muted-foreground">Inicia sesión para ver tus logros</p>
            <Button onClick={() => navigate('/auth')}><LogIn className="w-4 h-4 mr-2" /> Iniciar Sesión</Button>
          </div>
        ) : (
          <>
            {/* ─── XP & Level Card ─── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative rounded-2xl overflow-hidden mb-5"
              style={{
                background: 'linear-gradient(165deg, hsl(45 90% 55% / 0.08) 0%, hsl(var(--card)) 40%, hsl(var(--background)) 100%)',
                border: '1px solid hsl(45 90% 55% / 0.2)',
              }}
            >
              <div className="absolute top-0 inset-x-0 h-[2px]" style={{
                background: 'linear-gradient(90deg, transparent, hsl(45 90% 55% / 0.7), transparent)',
              }} />

              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                      background: 'hsl(45 90% 55% / 0.12)',
                      border: '1px solid hsl(45 90% 55% / 0.2)',
                    }}>
                      <Zap className="w-5 h-5" style={{ color: 'hsl(45 90% 55%)' }} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Nivel</p>
                      <p className="text-2xl font-black tabular-nums" style={{ color: 'hsl(45 90% 55%)' }}>{level}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">XP Total</p>
                    <p className="text-lg font-bold tabular-nums text-foreground">{totalXp.toLocaleString()}</p>
                  </div>
                </div>

                {/* XP progress to next level */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'hsl(45 90% 55% / 0.1)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(xpInLevel / 500) * 100}%` }}
                      style={{ background: 'linear-gradient(90deg, hsl(45 90% 55%), hsl(35 95% 60%))' }}
                    />
                  </div>
                  <span className="text-[10px] font-bold tabular-nums" style={{ color: 'hsl(45 90% 55%)' }}>
                    {xpInLevel}/500
                  </span>
                </div>

                {/* Achievement count */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-foreground">Logros Desbloqueados</span>
                  <span className="text-xs font-bold" style={{ color: 'hsl(45 90% 55%)' }}>{unlockedCount}/{totalCount}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted) / 0.3)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(unlockedCount / totalCount) * 100}%` }}
                    style={{ background: 'hsl(45 90% 55%)' }}
                  />
                </div>

                {/* Stats grid */}
                {stats && (
                  <div className="grid grid-cols-4 gap-2 mt-4">
                    <StatValue value={stats.totalTrades} label="Trades" color="190 80% 55%" />
                    <StatValue value={stats.maxWinStreak} label="Racha" color="25 95% 55%" />
                    <StatValue value={Math.round(stats.totalPips)} label="Pips" color="142 60% 50%" />
                    <StatValue value={`${stats.winRate}%`} label="Win Rate" color="160 65% 45%" />
                  </div>
                )}
              </div>
            </motion.div>

            {/* ─── Category Filter ─── */}
            <div className="flex gap-1.5 overflow-x-auto pb-3 mb-4 no-scrollbar">
              <button
                onClick={() => setActiveCategory('all')}
                className={cn("shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border",
                  activeCategory === 'all'
                    ? 'border-primary/30 text-primary'
                    : 'border-border/50 text-muted-foreground'
                )}
                style={activeCategory === 'all' ? { background: 'hsl(var(--primary) / 0.1)' } : { background: 'hsl(var(--card) / 0.5)' }}
              >
                Todos ({totalCount})
              </button>
              {categoryKeys.map(key => {
                const cat = categories[key];
                const catAchievements = achievements.filter(a => a.category === key);
                const catUnlocked = catAchievements.filter(a => unlockedCodes.includes(a.code)).length;
                const isActive = activeCategory === key;

                return (
                  <button
                    key={key}
                    onClick={() => setActiveCategory(key)}
                    className={cn("shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border")}
                    style={{
                      background: isActive ? `hsl(${cat.color} / 0.12)` : 'hsl(var(--card) / 0.5)',
                      borderColor: isActive ? `hsl(${cat.color} / 0.3)` : 'hsl(var(--border) / 0.5)',
                      color: isActive ? `hsl(${cat.color})` : 'hsl(var(--muted-foreground))',
                    }}
                  >
                    {cat.icon} {catUnlocked}/{catAchievements.length}
                  </button>
                );
              })}
            </div>

            {/* ─── Achievement Cards ─── */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-2.5"
              >
                {activeCategory !== 'all' && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{categories[activeCategory as RequirementType]?.icon}</span>
                    <h2 className="text-sm font-bold text-foreground">{categories[activeCategory as RequirementType]?.label}</h2>
                  </div>
                )}

                {filteredAchievements
                  .sort((a, b) => {
                    const aUnlocked = unlockedCodes.includes(a.code) ? 0 : 1;
                    const bUnlocked = unlockedCodes.includes(b.code) ? 0 : 1;
                    if (aUnlocked !== bUnlocked) return aUnlocked - bUnlocked;
                    return getProgress(b) - getProgress(a);
                  })
                  .map(achievement => (
                    <AchievementCard
                      key={achievement.code}
                      achievement={achievement}
                      unlocked={unlockedCodes.includes(achievement.code)}
                      progress={getProgress(achievement)}
                    />
                  ))}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </main>
    </PageShell>
  );
}
