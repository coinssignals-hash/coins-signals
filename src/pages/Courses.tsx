import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { Badge } from '@/components/ui/badge';
import { GlowSection } from '@/components/ui/glow-section';
import { useCourseProgress } from '@/hooks/useCourseProgress';
import { categories } from '@/data/coursesData';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Video, Headphones, Play, Clock, CheckCircle,
  ChevronRight, GraduationCap, Sparkles, ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/LanguageContext';

/* ─────────── HSL color per category (MarketSessions style) ─────────── */
const CATEGORY_COLORS: Record<string, string> = {
  inicio: '217 91% 60%',       // blue
  forex: '190 80% 55%',        // cyan
  acciones: '140 60% 50%',     // emerald
  metales: '40 80% 55%',       // amber/gold
  criptomonedas: '270 60% 60%', // purple
};

const getCatColor = (id: string) => CATEGORY_COLORS[id] || '210 70% 55%';

/* ─────────── Helpers ─────────── */

const getTypeIcon = (type: string, size = 'w-4 h-4') => {
  switch (type) {
    case 'pdf': return <FileText className={cn(size, 'text-rose-400')} />;
    case 'video': return <Video className={cn(size, 'text-blue-400')} />;
    case 'podcast': return <Headphones className={cn(size, 'text-purple-400')} />;
    default: return <FileText className={cn(size)} />;
  }
};

const difficultyColor = (d: string) => {
  if (d === 'Principiante') return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  if (d === 'Intermedio') return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
  return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
};

/* ─────────── Module Card (GlowCard style like SessionCard) ─────────── */

function ModuleCard({
  module,
  idx,
  color,
  gradient,
  isExpanded,
  onToggle,
  isLessonCompleted,
  navigate,
  t,
}: {
  module: (typeof categories)[0]['modules'][0];
  idx: number;
  color: string;
  gradient: string;
  isExpanded: boolean;
  onToggle: () => void;
  isLessonCompleted: (id: string) => boolean;
  navigate: ReturnType<typeof useNavigate>;
  t: (k: string) => string;
}) {
  const completedCount = module.lessons.filter(l => isLessonCompleted(l.id)).length;
  const modulePercent = Math.round((completedCount / module.lessons.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.07, duration: 0.35 }}
    >
      <GlowSection
        color={color}
      >
        <div className="relative">
          {/* Header */}
          <button
            onClick={onToggle}
            className="w-full text-left p-4 flex items-center gap-3"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
              style={{
                background: `linear-gradient(135deg, hsl(${color} / 0.2), hsl(${color} / 0.08))`,
                border: `1px solid hsl(${color} / 0.25)`,
                boxShadow: `0 4px 12px hsl(${color} / 0.1)`,
              }}
            >
              {getTypeIcon(module.type, 'w-5 h-5')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{module.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-medium', difficultyColor(module.difficulty))}>
                  {module.difficulty}
                </span>
                <span className="text-[11px] text-muted-foreground">{module.lessons.length} {t('courses_lessons')}</span>
                {completedCount > 0 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-primary/30 text-primary">
                    {completedCount}/{module.lessons.length}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {modulePercent === 100 && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: 'hsl(var(--bullish) / 0.15)', border: '1px solid hsl(var(--bullish) / 0.3)' }}>
                  <CheckCircle className="w-4 h-4" style={{ color: 'hsl(var(--bullish))' }} />
                </div>
              )}
              <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            </div>
          </button>

          {/* Progress bar */}
          {completedCount > 0 && (
            <div className="px-4 pb-1">
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `hsl(${color} / 0.1)` }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, hsl(${color} / 0.5), hsl(${color}))`,
                    boxShadow: modulePercent > 50 ? `0 0 6px hsl(${color} / 0.3)` : undefined,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${modulePercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}

          {/* Lessons */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 pt-2 space-y-1.5">
                  {module.lessons.map((lesson, li) => {
                    const completed = isLessonCompleted(lesson.id);
                    return (
                      <motion.div
                        key={lesson.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: li * 0.05 }}
                        onClick={() => navigate(`/courses/lesson/${lesson.id}`)}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all group',
                          completed
                            ? 'border shadow-sm'
                            : 'hover:bg-muted/10'
                        )}
                        style={{
                          background: completed ? `hsl(${color} / 0.06)` : undefined,
                          borderColor: completed ? `hsl(${color} / 0.2)` : 'transparent',
                        }}
                      >
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all',
                        )} style={{
                          background: completed ? `hsl(${color})` : 'hsl(var(--muted) / 0.3)',
                          color: completed ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                          border: completed ? undefined : '1px solid hsl(var(--border))',
                          boxShadow: completed ? `0 0 10px hsl(${color} / 0.3)` : undefined,
                        }}>
                          {completed ? <CheckCircle className="w-3.5 h-3.5" /> : li + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm truncate', completed ? 'text-foreground font-medium' : 'text-foreground/80 group-hover:text-foreground')}>
                            {lesson.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {getTypeIcon(lesson.type, 'w-3 h-3')}
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" /> {lesson.duration}
                            </span>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all"
                          style={{
                            background: 'hsl(var(--muted) / 0.15)',
                            border: '1px solid hsl(var(--border) / 0.3)',
                          }}>
                          <Play className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground ml-0.5 transition-colors" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </GlowSection>
    </motion.div>
  );
}

/* ─────────── Main Page ─────────── */

export default function Courses() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState('inicio');
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const { isLessonCompleted, progress } = useCourseProgress();

  const allByType = useMemo(() => {
    const all = categories.flatMap(cat => cat.modules.flatMap(mod => mod.lessons));
    return {
      video: all.filter(l => l.type === 'video').length,
      podcast: all.filter(l => l.type === 'podcast').length,
    };
  }, []);

  const currentCategory = categories.find(c => c.id === activeCategory)!;
  const color = getCatColor(activeCategory);

  const stats = useMemo(() => {
    const totalLessons = categories.flatMap(c => c.modules.flatMap(m => m.lessons)).length;
    const completedLessons = progress.totalCompletedLessons;
    return {
      total: totalLessons,
      completed: completedLessons,
      percentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
    };
  }, [progress.totalCompletedLessons]);

  // Category-level stats
  const catStats = useMemo(() => {
    const lessons = currentCategory.modules.flatMap(m => m.lessons);
    const completed = lessons.filter(l => isLessonCompleted(l.id)).length;
    return { total: lessons.length, completed, percentage: lessons.length > 0 ? Math.round((completed / lessons.length) * 100) : 0 };
  }, [currentCategory, isLessonCompleted]);

  return (
    <PageShell>
      <Header />
      <main className="container py-3 max-w-lg mx-auto px-3 space-y-3">
        {/* ── Hero Card (GlowCard style) ── */}
        <div className="relative rounded-2xl overflow-hidden" style={{
          background: `linear-gradient(165deg, hsl(${color} / 0.08) 0%, hsl(var(--card)) 40%, hsl(var(--background)) 100%)`,
          border: `1px solid hsl(${color} / 0.2)`,
        }}>
          <div className="absolute top-0 inset-x-0 h-[2px]" style={{
            background: `linear-gradient(90deg, transparent, hsl(${color} / 0.7), transparent)`,
          }} />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-32 rounded-full opacity-20 pointer-events-none" style={{
            background: `radial-gradient(circle, hsl(${color} / 0.4), transparent 70%)`,
          }} />

          <div className="relative p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                  background: `linear-gradient(135deg, hsl(${color} / 0.2), hsl(${color} / 0.08))`,
                  border: `1px solid hsl(${color} / 0.25)`,
                  boxShadow: `0 4px 12px hsl(${color} / 0.1)`,
                }}>
                  <GraduationCap className="w-5 h-5" style={{ color: `hsl(${color})` }} />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground flex items-center gap-1.5">
                    {t('courses_academy')}
                    <Sparkles className="w-4 h-4" style={{ color: `hsl(40 80% 55%)` }} />
                  </h1>
                  <p className="text-xs text-muted-foreground">{t('courses_master')}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold tabular-nums" style={{ color: `hsl(${color})` }}>
                  {stats.percentage}%
                </span>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t('courses_progress')}</p>
              </div>
            </div>

            {/* Global progress bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{stats.completed} / {stats.total} {t('courses_lessons')}</span>
                <span className="font-bold" style={{ color: `hsl(${color})` }}>
                  {stats.completed > 0 ? t('courses_in_progress') : t('courses_start_now')}
                </span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted) / 0.15)' }}>
                <motion.div
                  className="h-full rounded-full relative"
                  style={{
                    background: `linear-gradient(90deg, hsl(${color} / 0.5), hsl(${color}))`,
                    boxShadow: `0 0 8px hsl(${color} / 0.4)`,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.percentage}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                >
                  {stats.percentage > 0 && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-foreground shadow-lg" />
                  )}
                </motion.div>
              </div>
            </div>

            {/* Stats grid (like SessionCard stats) */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: t('courses_courses'), value: categories.length },
                { label: t('courses_completed'), value: stats.completed },
                { label: t('courses_modules'), value: categories.reduce((a, c) => a + c.modules.length, 0) },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl p-2.5 text-center" style={{
                  background: 'hsl(var(--card) / 0.6)',
                  border: '1px solid hsl(var(--border) / 0.5)',
                }}>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">{stat.label}</span>
                  <span className="text-base font-bold tabular-nums" style={{ color: `hsl(${color})` }}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Category Tabs (grid like MarketSessions) ── */}
        <div className={cn('grid gap-1', categories.length <= 5 ? 'grid-cols-5' : 'grid-cols-5')}>
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            const catColor = getCatColor(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setExpandedModule(null); }}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-2 rounded-xl text-[11px] font-semibold transition-all active:scale-95',
                  isActive ? 'text-foreground shadow-lg' : 'text-muted-foreground'
                )}
                style={{
                  background: isActive
                    ? `linear-gradient(135deg, hsl(${catColor} / 0.2), hsl(${catColor} / 0.08))`
                    : 'hsl(var(--card) / 0.5)',
                  border: `1px solid ${isActive ? `hsl(${catColor} / 0.35)` : 'hsl(var(--border) / 0.3)'}`,
                  boxShadow: isActive ? `0 2px 8px hsl(${catColor} / 0.15)` : undefined,
                }}
              >
                <Icon className="w-4 h-4" style={isActive ? { color: `hsl(${catColor})`, filter: `drop-shadow(0 0 4px hsl(${catColor} / 0.5))` } : undefined} />
                <span className="truncate w-full text-center leading-none">{cat.name.length > 6 ? cat.name.slice(0, 5) : cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* ── Category Progress ── */}
        <div className="rounded-xl p-3" style={{
          background: 'hsl(var(--card) / 0.4)',
          border: '1px solid hsl(var(--border) / 0.4)',
        }}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <currentCategory.icon className="w-3.5 h-3.5" style={{ color: `hsl(${color})` }} />
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{currentCategory.name}</span>
            </div>
            <span className="text-xs font-mono font-bold tabular-nums" style={{ color: `hsl(${color})` }}>
              {catStats.completed}/{catStats.total} • {catStats.percentage}%
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `hsl(${color} / 0.1)` }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, hsl(${color} / 0.4), hsl(${color}))` }}
              initial={{ width: 0 }}
              animate={{ width: `${catStats.percentage}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
        </div>

        {/* ── Modules ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="space-y-3"
          >
            {currentCategory.modules.map((module, idx) => {
              const moduleKey = `${activeCategory}-${idx}`;
              return (
                <ModuleCard
                  key={moduleKey}
                  module={module}
                  idx={idx}
                  color={color}
                  gradient={currentCategory.gradient}
                  isExpanded={expandedModule === moduleKey}
                  onToggle={() => setExpandedModule(expandedModule === moduleKey ? null : moduleKey)}
                  isLessonCompleted={isLessonCompleted}
                  navigate={navigate}
                  t={t}
                />
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* ── Featured Cards (Videos & Podcasts) ── */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { type: 'videos', icon: Video, label: t('courses_videos'), count: allByType.video, sublabel: t('courses_videos_available'), color: '217 91% 60%' },
            { type: 'podcasts', icon: Headphones, label: t('courses_podcasts'), count: allByType.podcast, sublabel: t('courses_episodes'), color: '270 60% 60%' },
          ].map(item => (
            <motion.div
              key={item.type}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/courses/media/${item.type}`)}
              className="relative rounded-2xl overflow-hidden cursor-pointer"
              style={{
                background: `linear-gradient(165deg, hsl(${item.color} / 0.08) 0%, hsl(var(--card)) 50%, hsl(var(--background)) 100%)`,
                border: `1px solid hsl(${item.color} / 0.2)`,
              }}
            >
              <div className="absolute top-0 inset-x-0 h-[2px]" style={{
                background: `linear-gradient(90deg, transparent, hsl(${item.color} / 0.5), transparent)`,
              }} />
              <div className="relative p-3.5 space-y-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{
                  background: `hsl(${item.color} / 0.12)`,
                  border: `1px solid hsl(${item.color} / 0.2)`,
                }}>
                  <item.icon className="w-4.5 h-4.5" style={{ color: `hsl(${item.color})` }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{item.label}</p>
                  <p className="text-[11px] text-muted-foreground">{item.count} {item.sublabel}</p>
                </div>
                <div className="flex items-center gap-0.5 text-[10px] font-medium" style={{ color: `hsl(${item.color})` }}>
                  <ChevronRight className="w-3 h-3" /> {t('courses_view_all')}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </PageShell>
  );
}
