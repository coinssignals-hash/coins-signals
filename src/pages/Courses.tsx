import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { SignalStyleCard } from '@/components/ui/signal-style-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useCourseProgress } from '@/hooks/useCourseProgress';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, FileText, Video, Headphones, Play, Clock, CheckCircle,
  BookOpen, Trophy, TrendingUp, BarChart3, Gem, Bitcoin, Flame,
  ChevronRight, Lock, Star, Zap, GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/utils';

const categories = [
  {
    id: 'inicio',
    name: 'Inicio',
    icon: BookOpen,
    gradient: 'from-blue-500/20 to-cyan-500/10',
    accent: 'text-blue-400',
    modules: [
      {
        title: 'Introducción al trading',
        icon: FileText,
        type: 'pdf',
        difficulty: 'Principiante',
        lessons: [
          { id: '1.1', title: '¿Qué es el trading?', duration: '15 min', type: 'pdf' },
          { id: '1.2', title: 'Diferencia entre invertir y tradear', duration: '12 min', type: 'pdf' },
          { id: '1.3', title: 'Principales mercados', duration: '20 min', type: 'pdf' },
        ]
      },
      {
        title: 'Cómo funciona una operación',
        icon: Video,
        type: 'video',
        difficulty: 'Principiante',
        lessons: [
          { id: '2.1', title: 'Qué es una orden (market, límite, stop)', duration: '18 min', type: 'video' },
          { id: '2.2', title: 'Spread, comisión, apalancamiento, margen', duration: '25 min', type: 'video' },
          { id: '2.3', title: 'Operaciones: compra (largo) y venta (corto)', duration: '15 min', type: 'video' },
          { id: '2.4', title: 'Stop loss y take profit', duration: '22 min', type: 'video' },
        ]
      }
    ]
  },
  {
    id: 'forex',
    name: 'Forex',
    icon: TrendingUp,
    gradient: 'from-cyan-500/20 to-teal-500/10',
    accent: 'text-cyan-400',
    modules: [
      {
        title: 'Introducción al Forex',
        icon: FileText,
        type: 'pdf',
        difficulty: 'Principiante',
        lessons: [
          { id: '1.1', title: '¿Qué es el Forex?', duration: '10 min', type: 'pdf' },
          { id: '1.2', title: 'Pares de divisas principales', duration: '15 min', type: 'pdf' },
          { id: '1.3', title: 'Horarios del mercado Forex', duration: '12 min', type: 'pdf' },
        ]
      },
      {
        title: 'Análisis Técnico en Forex',
        icon: Video,
        type: 'video',
        difficulty: 'Intermedio',
        lessons: [
          { id: '2.1', title: 'Lectura de gráficos de velas', duration: '20 min', type: 'video' },
          { id: '2.2', title: 'Indicadores técnicos esenciales', duration: '30 min', type: 'video' },
          { id: '2.3', title: 'Patrones de precio', duration: '25 min', type: 'video' },
        ]
      }
    ]
  },
  {
    id: 'acciones',
    name: 'Acciones',
    icon: BarChart3,
    gradient: 'from-emerald-500/20 to-green-500/10',
    accent: 'text-emerald-400',
    modules: [
      {
        title: 'Fundamentos de la Bolsa',
        icon: FileText,
        type: 'pdf',
        difficulty: 'Principiante',
        lessons: [
          { id: '1.1', title: '¿Qué es la bolsa de valores?', duration: '12 min', type: 'pdf' },
          { id: '1.2', title: 'Cómo comprar y vender acciones', duration: '18 min', type: 'pdf' },
        ]
      }
    ]
  },
  {
    id: 'metales',
    name: 'Metales',
    icon: Gem,
    gradient: 'from-amber-500/20 to-yellow-500/10',
    accent: 'text-amber-400',
    modules: [
      {
        title: 'Trading con Materias Primas',
        icon: Headphones,
        type: 'podcast',
        difficulty: 'Intermedio',
        lessons: [
          { id: 'p1.1', title: 'Oro y Plata: guía completa', duration: '45 min', type: 'podcast' },
          { id: 'p1.2', title: 'Petróleo: factores que mueven el precio', duration: '35 min', type: 'podcast' },
        ]
      }
    ]
  },
  {
    id: 'criptomonedas',
    name: 'Cripto',
    icon: Bitcoin,
    gradient: 'from-purple-500/20 to-violet-500/10',
    accent: 'text-purple-400',
    modules: [
      {
        title: 'Introducción a las Criptomonedas',
        icon: Video,
        type: 'video',
        difficulty: 'Principiante',
        lessons: [
          { id: '1.1', title: '¿Qué es Bitcoin?', duration: '20 min', type: 'video' },
          { id: '1.2', title: 'Altcoins: Ethereum, Solana y más', duration: '25 min', type: 'video' },
          { id: '1.3', title: 'Wallets y exchanges', duration: '18 min', type: 'video' },
        ]
      }
    ]
  }
];

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

export default function Courses() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('inicio');
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const { isLessonCompleted, progress } = useCourseProgress();

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
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>

        {/* Hero Card */}
        <SignalStyleCard>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/30 to-cyan-500/20 flex items-center justify-center border border-cyan-700/30">
                  <GraduationCap className="w-6 h-6 text-cyan-300" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground">Academia de Trading</h1>
                  <p className="text-xs text-muted-foreground">Domina los mercados paso a paso</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-primary tabular-nums">{stats.percentage}%</span>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Progreso</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{stats.completed} de {stats.total} lecciones</span>
                <span className="flex items-center gap-1 text-primary">
                  <Flame className="w-3 h-3" />
                  {stats.completed > 0 ? 'En progreso' : 'Comienza ahora'}
                </span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary via-cyan-400 to-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.percentage}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: BookOpen, label: 'Cursos', value: categories.length, color: 'text-blue-400' },
                { icon: Trophy, label: 'Completadas', value: stats.completed, color: 'text-amber-400' },
                { icon: Star, label: 'Módulos', value: categories.reduce((a, c) => a + c.modules.length, 0), color: 'text-cyan-400' },
              ].map((stat) => (
                <div key={stat.label} className="text-center p-2 rounded-lg bg-secondary/40 border border-border/30">
                  <stat.icon className={cn('w-4 h-4 mx-auto mb-1', stat.color)} />
                  <p className="text-base font-bold text-foreground tabular-nums">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </SignalStyleCard>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setExpandedModule(null); }}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border',
                  isActive
                    ? 'bg-primary/15 border-primary/40 text-primary shadow-[0_0_12px_hsl(217_91%_60%/0.2)]'
                    : 'bg-secondary/40 border-border/30 text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Modules */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="space-y-3"
          >
            {currentCategory.modules.map((module, idx) => {
              const moduleKey = `${activeCategory}-${idx}`;
              const isExpanded = expandedModule === moduleKey;
              const completedCount = module.lessons.filter(l => isLessonCompleted(l.id)).length;
              const modulePercent = Math.round((completedCount / module.lessons.length) * 100);

              return (
                <div key={moduleKey} className="rounded-xl border border-border/40 bg-card/60 overflow-hidden backdrop-blur-sm">
                  {/* Module Header */}
                  <button
                    onClick={() => setExpandedModule(isExpanded ? null : moduleKey)}
                    className="w-full text-left p-4 flex items-center gap-3 hover:bg-secondary/30 transition-colors"
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br',
                      currentCategory.gradient
                    )}>
                      {getTypeIcon(module.type, 'w-5 h-5')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-foreground truncate">{module.title}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded border', difficultyColor(module.difficulty))}>
                          {module.difficulty}
                        </span>
                        <span className="text-[11px] text-muted-foreground">{module.lessons.length} lecciones</span>
                        {completedCount > 0 && (
                          <span className="text-[11px] text-primary font-medium">{completedCount}/{module.lessons.length}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {modulePercent === 100 && (
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        </div>
                      )}
                      <ChevronRight className={cn(
                        'w-4 h-4 text-muted-foreground transition-transform duration-200',
                        isExpanded && 'rotate-90'
                      )} />
                    </div>
                  </button>

                  {/* Progress bar under header */}
                  {completedCount > 0 && (
                    <div className="px-4 pb-0">
                      <div className="h-0.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400 transition-all duration-700"
                          style={{ width: `${modulePercent}%` }}
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
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-3 space-y-1.5">
                          {module.lessons.map((lesson, lessonIdx) => {
                            const completed = isLessonCompleted(lesson.id);
                            return (
                              <motion.div
                                key={lesson.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: lessonIdx * 0.05 }}
                                onClick={() => navigate(`/courses/lesson/${lesson.id}`)}
                                className={cn(
                                  'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all group',
                                  completed
                                    ? 'bg-primary/8 hover:bg-primary/12 border border-primary/20'
                                    : 'bg-secondary/30 hover:bg-secondary/50 border border-transparent'
                                )}
                              >
                                {/* Number / Check */}
                                <div className={cn(
                                  'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold',
                                  completed
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-secondary border border-border text-muted-foreground'
                                )}>
                                  {completed ? <CheckCircle className="w-3.5 h-3.5" /> : lessonIdx + 1}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <p className={cn(
                                    'text-sm truncate',
                                    completed ? 'text-foreground' : 'text-foreground/80'
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

                                {/* Play */}
                                <div className={cn(
                                  'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                                  'bg-secondary/50 group-hover:bg-primary/20 group-hover:scale-110'
                                )}>
                                  <Play className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors ml-0.5" />
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Featured Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-blue-900/5 p-4 space-y-2">
            <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center">
              <Video className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-sm font-semibold text-foreground">Videos</p>
            <p className="text-[11px] text-muted-foreground">12 videos disponibles</p>
            <div className="flex items-center gap-1 text-[10px] text-blue-400">
              <Zap className="w-3 h-3" /> Nuevos cada semana
            </div>
          </div>
          <div className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-purple-900/5 p-4 space-y-2">
            <div className="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center">
              <Headphones className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-sm font-semibold text-foreground">Podcasts</p>
            <p className="text-[11px] text-muted-foreground">8 episodios</p>
            <div className="flex items-center gap-1 text-[10px] text-purple-400">
              <Zap className="w-3 h-3" /> Escucha offline
            </div>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
