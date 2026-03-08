import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { Badge } from '@/components/ui/badge';
import { useCourseProgress } from '@/hooks/useCourseProgress';
import { categories } from '@/data/coursesData';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Video, Headphones, Play, Clock, CheckCircle, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/LanguageContext';

const difficultyColor = (d: string) => {
  if (d === 'Principiante') return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  if (d === 'Intermedio') return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
  return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
};

export default function MediaLibrary() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { isLessonCompleted } = useCourseProgress();
  const { t } = useTranslation();

  const isVideo = type === 'videos';
  const mediaType = isVideo ? 'video' : 'podcast';

  const groupedByCategory = useMemo(() => {
    return categories
      .map(cat => {
        const lessons = cat.modules.flatMap(mod =>
          mod.lessons
            .filter(l => l.type === mediaType)
            .map(l => ({ ...l, moduleName: mod.title, difficulty: mod.difficulty }))
        );
        return { ...cat, lessons };
      })
      .filter(cat => cat.lessons.length > 0);
  }, [mediaType]);

  const totalCount = groupedByCategory.reduce((a, c) => a + c.lessons.length, 0);
  const completedCount = groupedByCategory.reduce(
    (a, c) => a + c.lessons.filter(l => isLessonCompleted(l.id)).length, 0
  );

  return (
    <PageShell>
      <Header />
      <main className="py-4 px-4 pb-28 space-y-5">
        {/* Back */}
        <Link to="/courses" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Volver a Cursos
        </Link>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'rounded-2xl border p-5 relative overflow-hidden backdrop-blur-sm',
            isVideo
              ? 'border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-blue-900/5 to-transparent'
              : 'border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-purple-900/5 to-transparent'
          )}
        >
          <div className={cn(
            'absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl pointer-events-none',
            isVideo ? 'bg-blue-500/8' : 'bg-purple-500/8'
          )} />
          <div className="relative flex items-center gap-4">
            <div className={cn(
              'w-14 h-14 rounded-2xl flex items-center justify-center border',
              isVideo ? 'bg-blue-500/15 border-blue-500/20' : 'bg-purple-500/15 border-purple-500/20'
            )}>
              {isVideo
                ? <Video className="w-7 h-7 text-blue-400" />
                : <Headphones className="w-7 h-7 text-purple-400" />
              }
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {isVideo ? 'Biblioteca de Videos' : 'Biblioteca de Podcasts'}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {totalCount} {isVideo ? 'videos' : 'episodios'} • {completedCount} completados
              </p>
            </div>
          </div>

          {/* Progress */}
          {totalCount > 0 && (
            <div className="relative mt-4">
              <div className={cn(
                'h-2 rounded-full overflow-hidden border border-white/5',
                isVideo ? 'bg-blue-500/10' : 'bg-purple-500/10'
              )}>
                <motion.div
                  className={cn(
                    'h-full rounded-full',
                    isVideo
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
                      : 'bg-gradient-to-r from-purple-500 to-violet-400'
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round((completedCount / totalCount) * 100)}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Grouped by category */}
        <div className="space-y-6">
          {groupedByCategory.map((cat, catIdx) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: catIdx * 0.08 }}
            >
              {/* Category header */}
              <div className="flex items-center gap-2 mb-3">
                <cat.icon className={cn('w-4 h-4', cat.accent)} />
                <h2 className="text-sm font-bold text-foreground">{cat.name}</h2>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-border/40 text-muted-foreground">
                  {cat.lessons.length}
                </Badge>
              </div>

              {/* Lessons */}
              <div className="space-y-2">
                {cat.lessons.map((lesson, i) => {
                  const completed = isLessonCompleted(lesson.id);
                  return (
                    <motion.div
                      key={lesson.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: catIdx * 0.08 + i * 0.04 }}
                      onClick={() => navigate(`/courses/lesson/${lesson.id}`)}
                      whileHover={{ x: 4 }}
                      className={cn(
                        'flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all group border',
                        completed
                          ? 'bg-primary/8 border-primary/20 shadow-[0_0_12px_hsl(217_91%_60%/0.06)]'
                          : 'bg-card/60 border-border/30 hover:bg-secondary/40 hover:border-border/50'
                      )}
                    >
                      {/* Play/Check icon */}
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all',
                        completed
                          ? 'bg-primary text-primary-foreground shadow-[0_0_10px_hsl(217_91%_60%/0.3)]'
                          : isVideo
                            ? 'bg-blue-500/10 border border-blue-500/20 group-hover:bg-blue-500/20'
                            : 'bg-purple-500/10 border border-purple-500/20 group-hover:bg-purple-500/20'
                      )}>
                        {completed
                          ? <CheckCircle className="w-4.5 h-4.5" />
                          : <Play className="w-4 h-4 text-muted-foreground group-hover:text-foreground ml-0.5 transition-colors" />
                        }
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'text-sm truncate transition-colors',
                          completed ? 'text-foreground font-medium' : 'text-foreground/80 group-hover:text-foreground'
                        )}>
                          {lesson.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full border font-medium', difficultyColor(lesson.difficulty))}>
                            {lesson.difficulty}
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                            {lesson.moduleName}
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {lesson.duration}
                          </span>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </PageShell>
  );
}
