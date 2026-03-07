import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { SignalStyleCard } from '@/components/ui/signal-style-card';
import { Badge } from '@/components/ui/badge';
import { useCourseProgress } from '@/hooks/useCourseProgress';
import { categories } from '@/data/coursesData';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, FileText, Video, Headphones, Play, Clock, CheckCircle,
  BookOpen, Trophy, TrendingUp, BarChart3, Gem, Bitcoin, Flame,
  ChevronRight, Star, Zap, GraduationCap, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

// categories imported from @/data/coursesData

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

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.4, ease: 'easeOut' as const } }),
};

export default function Courses() {
  const navigate = useNavigate();
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

  const stats = useMemo(() => {
    const totalLessons = categories.flatMap(c => c.modules.flatMap(m => m.lessons)).length;
    const completedLessons = progress.totalCompletedLessons;
    return {
      total: totalLessons,
      completed: completedLessons,
      percentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
    };
  }, [progress.totalCompletedLessons]);

  return (
    <PageShell>
      <Header />

      <main className="py-4 px-4 pb-28 space-y-5">
        {/* Back */}
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Volver
        </Link>

        {/* Hero Card — enhanced */}
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: 'easeOut' }}>
          <SignalStyleCard>
            <div className="relative p-5 space-y-4 overflow-hidden">
              {/* Decorative bg glow */}
              <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-cyan-500/6 blur-3xl pointer-events-none" />

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/30 via-cyan-500/20 to-blue-600/10 flex items-center justify-center border border-cyan-700/30 shadow-[0_0_20px_hsl(217_91%_60%/0.2)]"
                    whileHover={{ scale: 1.08, rotate: 3 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <GraduationCap className="w-6 h-6 text-cyan-300" />
                  </motion.div>
                  <div>
                    <h1 className="text-lg font-bold text-foreground flex items-center gap-1.5">
                      Academia de Trading
                      <Sparkles className="w-4 h-4 text-amber-400" />
                    </h1>
                    <p className="text-xs text-muted-foreground">Domina los mercados paso a paso</p>
                  </div>
                </div>
                <div className="text-right">
                  <motion.span
                    className="text-2xl font-bold text-primary tabular-nums"
                    key={stats.percentage}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                  >
                    {stats.percentage}%
                  </motion.span>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Progreso</p>
                </div>
              </div>

              {/* Progress Bar — enhanced */}
              <div className="relative space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{stats.completed} de {stats.total} lecciones</span>
                  <span className="flex items-center gap-1 text-primary">
                    <Flame className="w-3 h-3" />
                    {stats.completed > 0 ? 'En progreso' : 'Comienza ahora'}
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-secondary/60 overflow-hidden border border-border/20">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary via-cyan-400 to-primary relative"
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.percentage}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.15)_50%,transparent_100%)] animate-[shimmer_2s_ease-in-out_infinite]" />
                  </motion.div>
                </div>
              </div>

              {/* Quick Stats — enhanced */}
              <div className="relative grid grid-cols-3 gap-3">
                {[
                  { icon: BookOpen, label: 'Cursos', value: categories.length, color: 'text-blue-400', bg: 'from-blue-500/10 to-blue-500/5' },
                  { icon: Trophy, label: 'Completadas', value: stats.completed, color: 'text-amber-400', bg: 'from-amber-500/10 to-amber-500/5' },
                  { icon: Star, label: 'Módulos', value: categories.reduce((a, c) => a + c.modules.length, 0), color: 'text-cyan-400', bg: 'from-cyan-500/10 to-cyan-500/5' },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                    whileHover={{ scale: 1.04, y: -2 }}
                    className={cn(
                      'text-center p-3 rounded-xl bg-gradient-to-b border border-border/30 cursor-default',
                      stat.bg
                    )}
                  >
                    <stat.icon className={cn('w-4 h-4 mx-auto mb-1.5', stat.color)} />
                    <p className="text-lg font-bold text-foreground tabular-nums">{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </SignalStyleCard>
        </motion.div>

        {/* Category Tabs — centered icon + label */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <motion.button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setExpandedModule(null); }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-1 min-w-[68px] px-3 py-2.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all border',
                  isActive
                    ? cn('bg-primary/15 border-primary/40 text-primary', cat.glow)
                    : 'bg-secondary/40 border-border/30 text-muted-foreground hover:text-foreground hover:border-border hover:bg-secondary/60'
                )}
              >
                <Icon className={cn('w-4 h-4', isActive && 'drop-shadow-[0_0_4px_currentColor]')} />
                <span className="leading-none">{cat.name}</span>
                {isActive && (
                  <motion.div
                    layoutId="categoryIndicator"
                    className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Modules — enhanced cards */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            {currentCategory.modules.map((module, idx) => {
              const moduleKey = `${activeCategory}-${idx}`;
              const isExpanded = expandedModule === moduleKey;
              const completedCount = module.lessons.filter(l => isLessonCompleted(l.id)).length;
              const modulePercent = Math.round((completedCount / module.lessons.length) * 100);

              return (
                <motion.div
                  key={moduleKey}
                  custom={idx}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  className={cn(
                    'rounded-xl border overflow-hidden backdrop-blur-sm transition-all duration-300',
                    isExpanded
                      ? 'border-primary/30 bg-card/80 shadow-[0_4px_24px_rgba(0,0,0,0.15)]'
                      : 'border-border/40 bg-card/60 hover:border-border/60'
                  )}
                >
                  {/* Module Header */}
                  <button
                    onClick={() => setExpandedModule(isExpanded ? null : moduleKey)}
                    className="w-full text-left p-4 flex items-center gap-3 hover:bg-secondary/20 transition-all"
                  >
                    <motion.div
                      className={cn(
                        'w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br border border-white/5',
                        currentCategory.gradient
                      )}
                      whileHover={{ rotate: 5, scale: 1.05 }}
                    >
                      {getTypeIcon(module.type, 'w-5 h-5')}
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-foreground truncate">{module.title}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-medium', difficultyColor(module.difficulty))}>
                          {module.difficulty}
                        </span>
                        <span className="text-[11px] text-muted-foreground">{module.lessons.length} lecciones</span>
                        {completedCount > 0 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-primary/30 text-primary">
                            {completedCount}/{module.lessons.length}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {modulePercent === 100 && (
                        <motion.div
                          className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 300 }}
                        >
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        </motion.div>
                      )}
                      <motion.div
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </motion.div>
                    </div>
                  </button>

                  {/* Progress bar */}
                  {completedCount > 0 && (
                    <div className="px-4 pb-0">
                      <div className="h-1 rounded-full bg-secondary/60 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${modulePercent}%` }}
                          transition={{ duration: 0.7, ease: 'easeOut' }}
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
                        <div className="px-4 pb-4 pt-3 space-y-2">
                          {module.lessons.map((lesson, lessonIdx) => {
                            const completed = isLessonCompleted(lesson.id);
                            return (
                              <motion.div
                                key={lesson.id}
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: lessonIdx * 0.06, duration: 0.3 }}
                                onClick={() => navigate(`/courses/lesson/${lesson.id}`)}
                                whileHover={{ x: 4 }}
                                className={cn(
                                  'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all group',
                                  completed
                                    ? 'bg-primary/8 hover:bg-primary/12 border border-primary/20 shadow-[0_0_12px_hsl(217_91%_60%/0.06)]'
                                    : 'bg-secondary/20 hover:bg-secondary/40 border border-transparent hover:border-border/30'
                                )}
                              >
                                {/* Number / Check */}
                                <div className={cn(
                                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all',
                                  completed
                                    ? 'bg-primary text-primary-foreground shadow-[0_0_10px_hsl(217_91%_60%/0.3)]'
                                    : 'bg-secondary border border-border text-muted-foreground group-hover:border-primary/30 group-hover:text-foreground'
                                )}>
                                  {completed ? <CheckCircle className="w-3.5 h-3.5" /> : lessonIdx + 1}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <p className={cn(
                                    'text-sm truncate transition-colors',
                                    completed ? 'text-foreground font-medium' : 'text-foreground/80 group-hover:text-foreground'
                                  )}>
                                    {lesson.title}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {getTypeIcon(lesson.type, 'w-3 h-3')}
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                      <Clock className="w-2.5 h-2.5" />
                                      {lesson.duration}
                                    </span>
                                  </div>
                                </div>

                                {/* Play button — enhanced */}
                                <motion.div
                                  className={cn(
                                    'w-9 h-9 rounded-full flex items-center justify-center transition-all',
                                    'bg-secondary/50 group-hover:bg-primary/20 border border-transparent group-hover:border-primary/30'
                                  )}
                                  whileHover={{ scale: 1.15 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <Play className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors ml-0.5" />
                                </motion.div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Featured Cards — clickable to expand media lists */}
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileHover={{ y: -3, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setMediaFilter(mediaFilter === 'video' ? null : 'video')}
            className={cn(
              'rounded-xl border bg-gradient-to-br from-blue-500/10 via-blue-900/5 to-transparent p-4 space-y-2.5 backdrop-blur-sm relative overflow-hidden text-left transition-all',
              mediaFilter === 'video' ? 'border-blue-500/40 shadow-[0_0_20px_hsl(217_91%_60%/0.15)]' : 'border-blue-500/20'
            )}
          >
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-blue-500/8 blur-2xl" />
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center border border-blue-500/20">
                <Video className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-sm font-bold text-foreground mt-2">Videos</p>
              <p className="text-[11px] text-muted-foreground">{allByType.video.length} videos disponibles</p>
              <div className="flex items-center gap-1 text-[10px] text-blue-400 mt-1.5 font-medium">
                <Zap className="w-3 h-3" /> {mediaFilter === 'video' ? 'Toca para cerrar' : 'Toca para ver todos'}
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ y: -3, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setMediaFilter(mediaFilter === 'podcast' ? null : 'podcast')}
            className={cn(
              'rounded-xl border bg-gradient-to-br from-purple-500/10 via-purple-900/5 to-transparent p-4 space-y-2.5 backdrop-blur-sm relative overflow-hidden text-left transition-all',
              mediaFilter === 'podcast' ? 'border-purple-500/40 shadow-[0_0_20px_hsl(271_76%_53%/0.15)]' : 'border-purple-500/20'
            )}
          >
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-purple-500/8 blur-2xl" />
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center border border-purple-500/20">
                <Headphones className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-sm font-bold text-foreground mt-2">Podcasts</p>
              <p className="text-[11px] text-muted-foreground">{allByType.podcast.length} episodios</p>
              <div className="flex items-center gap-1 text-[10px] text-purple-400 mt-1.5 font-medium">
                <Zap className="w-3 h-3" /> {mediaFilter === 'podcast' ? 'Toca para cerrar' : 'Toca para ver todos'}
              </div>
            </div>
          </motion.button>
        </div>

        {/* Expanded media list */}
        <AnimatePresence>
          {mediaFilter && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className={cn(
                'rounded-xl border p-4 space-y-3 backdrop-blur-sm',
                mediaFilter === 'video'
                  ? 'border-blue-500/20 bg-blue-500/5'
                  : 'border-purple-500/20 bg-purple-500/5'
              )}>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    {mediaFilter === 'video' ? <Video className="w-4 h-4 text-blue-400" /> : <Headphones className="w-4 h-4 text-purple-400" />}
                    {mediaFilter === 'video' ? `Todos los Videos (${allByType.video.length})` : `Todos los Podcasts (${allByType.podcast.length})`}
                  </h3>
                  <button onClick={() => setMediaFilter(null)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Cerrar ✕
                  </button>
                </div>

                <div className="space-y-2">
                  {(mediaFilter === 'video' ? allByType.video : allByType.podcast).map((lesson, i) => {
                    const completed = isLessonCompleted(lesson.id);
                    return (
                      <motion.div
                        key={lesson.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => navigate(`/courses/lesson/${lesson.id}`)}
                        whileHover={{ x: 4 }}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all group',
                          completed
                            ? 'bg-primary/8 border border-primary/20'
                            : 'bg-secondary/20 hover:bg-secondary/40 border border-transparent hover:border-border/30'
                        )}
                      >
                        {/* Icon */}
                        <div className={cn(
                          'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0',
                          completed
                            ? 'bg-primary text-primary-foreground shadow-[0_0_10px_hsl(217_91%_60%/0.3)]'
                            : mediaFilter === 'video'
                              ? 'bg-blue-500/15 border border-blue-500/20'
                              : 'bg-purple-500/15 border border-purple-500/20'
                        )}>
                          {completed
                            ? <CheckCircle className="w-4 h-4" />
                            : <Play className="w-3.5 h-3.5 text-muted-foreground ml-0.5" />
                          }
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm truncate', completed ? 'text-foreground font-medium' : 'text-foreground/80')}>
                            {lesson.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <Badge variant="outline" className={cn(
                              'text-[9px] px-1.5 py-0 h-4 border-border/40',
                              lesson.categoryAccent
                            )}>
                              {lesson.categoryName}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{lesson.moduleName}</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              {lesson.duration}
                            </span>
                          </div>
                        </div>

                        {/* Arrow */}
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </PageShell>
  );
}
