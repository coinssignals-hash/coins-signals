import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { learningPaths } from '@/data/learningPathsData';
import { useCourseProgress } from '@/hooks/useCourseProgress';
import { GlowSection } from '@/components/ui/glow-section';
import { motion, AnimatePresence } from 'framer-motion';
import { Route, CheckCircle, ChevronRight, Lock, Sparkles, Clock, BookOpen, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LearningPaths() {
  const navigate = useNavigate();
  const { isLessonCompleted } = useCourseProgress();
  const [expandedPath, setExpandedPath] = useState<string | null>(null);

  const pathProgress = useMemo(() => {
    return learningPaths.map(path => {
      const allLessons = path.steps.flatMap(s => s.lessonIds);
      const completed = allLessons.filter(id => isLessonCompleted(id)).length;
      return { id: path.id, total: allLessons.length, completed, percentage: allLessons.length > 0 ? Math.round((completed / allLessons.length) * 100) : 0 };
    });
  }, [isLessonCompleted]);

  const levelColor = (level: string) => {
    if (level === 'Principiante') return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    if (level === 'Intermedio') return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
  };

  return (
    <PageShell>
      <Header />
      <main className="container py-3 max-w-lg mx-auto px-3 space-y-3">
        {/* Hero */}
        <GlowSection color="217 91% 60%">
          <div className="p-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                background: 'linear-gradient(135deg, hsl(217 91% 60% / 0.2), hsl(217 91% 60% / 0.08))',
                border: '1px solid hsl(217 91% 60% / 0.25)',
              }}>
                <Route className="w-5 h-5" style={{ color: 'hsl(217 91% 60%)' }} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground flex items-center gap-1.5">
                  Rutas de Aprendizaje <Sparkles className="w-4 h-4" style={{ color: 'hsl(40 80% 55%)' }} />
                </h1>
                <p className="text-xs text-muted-foreground">Sigue un camino estructurado de principiante a profesional</p>
              </div>
            </div>
          </div>
        </GlowSection>

        {/* Path cards */}
        <div className="space-y-3">
          {learningPaths.map((path, pi) => {
            const progress = pathProgress.find(p => p.id === path.id)!;
            const isExpanded = expandedPath === path.id;
            const isCompleted = progress.percentage === 100;

            return (
              <motion.div
                key={path.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: pi * 0.1 }}
              >
                <div className="relative rounded-2xl overflow-hidden" style={{
                  background: `linear-gradient(165deg, hsl(${path.color} / 0.08) 0%, hsl(var(--card)) 40%)`,
                  border: `1px solid hsl(${path.color} / ${isExpanded ? '0.35' : '0.2'})`,
                  boxShadow: isExpanded ? `0 4px 24px hsl(${path.color} / 0.1)` : undefined,
                }}>
                  <div className="absolute top-0 inset-x-0 h-[2px]" style={{
                    background: `linear-gradient(90deg, transparent, hsl(${path.color} / 0.7), transparent)`,
                  }} />

                  {/* Path Header */}
                  <button onClick={() => setExpandedPath(isExpanded ? null : path.id)} className="w-full text-left p-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{path.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-bold text-foreground truncate">{path.name}</p>
                          {isCompleted && (
                            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'hsl(var(--bullish) / 0.15)' }}>
                              <CheckCircle className="w-3.5 h-3.5" style={{ color: 'hsl(var(--bullish))' }} />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-medium', levelColor(path.level))}>
                            {path.level}
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" /> {path.estimatedHours}h
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <BookOpen className="w-2.5 h-2.5" /> {path.steps.length} módulos
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-lg font-bold tabular-nums" style={{ color: `hsl(${path.color})` }}>
                          {progress.percentage}%
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mt-2">{path.description}</p>

                    {/* Progress bar */}
                    <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: `hsl(${path.color} / 0.1)` }}>
                      <motion.div className="h-full rounded-full" style={{
                        background: `linear-gradient(90deg, hsl(${path.color} / 0.5), hsl(${path.color}))`,
                        boxShadow: progress.percentage > 30 ? `0 0 6px hsl(${path.color} / 0.3)` : undefined,
                      }} animate={{ width: `${progress.percentage}%` }} transition={{ duration: 0.8 }} />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground">{progress.completed}/{progress.total} lecciones</span>
                      <motion.div animate={{ rotate: isExpanded ? 90 : 0 }}>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </motion.div>
                    </div>
                  </button>

                  {/* Steps */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="px-4 pb-4 space-y-2">
                          {path.steps.map((step, si) => {
                            const stepCompleted = step.lessonIds.filter(id => isLessonCompleted(id)).length;
                            const stepTotal = step.lessonIds.length;
                            const stepDone = stepCompleted === stepTotal;

                            return (
                              <motion.div
                                key={si}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: si * 0.05 }}
                                onClick={() => navigate('/courses')}
                                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:bg-muted/10"
                                style={{
                                  background: stepDone ? `hsl(${path.color} / 0.06)` : undefined,
                                  border: `1px solid ${stepDone ? `hsl(${path.color} / 0.2)` : 'hsl(var(--border) / 0.15)'}`,
                                }}
                              >
                                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold" style={{
                                  background: stepDone ? `hsl(${path.color})` : 'hsl(var(--muted) / 0.3)',
                                  color: stepDone ? 'white' : 'hsl(var(--muted-foreground))',
                                  boxShadow: stepDone ? `0 0 8px hsl(${path.color} / 0.3)` : undefined,
                                }}>
                                  {stepDone ? <CheckCircle className="w-3.5 h-3.5" /> : si + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-foreground truncate">{step.moduleTitle}</p>
                                  <span className="text-[10px] text-muted-foreground">{stepCompleted}/{stepTotal} lecciones</span>
                                </div>
                                {step.hasQuiz && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{
                                    background: `hsl(${path.color} / 0.1)`,
                                    color: `hsl(${path.color})`,
                                    border: `1px solid hsl(${path.color} / 0.2)`,
                                  }}>Quiz</span>
                                )}
                              </motion.div>
                            );
                          })}

                          {/* Certificate badge */}
                          {isCompleted && (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-3 rounded-xl text-center" style={{
                              background: `linear-gradient(135deg, hsl(${path.color} / 0.15), hsl(${path.color} / 0.05))`,
                              border: `1px solid hsl(${path.color} / 0.3)`,
                            }}>
                              <Award className="w-6 h-6 mx-auto mb-1" style={{ color: `hsl(${path.color})` }} />
                              <p className="text-xs font-bold" style={{ color: `hsl(${path.color})` }}>¡Certificado desbloqueado!</p>
                              <p className="text-[10px] text-muted-foreground">{path.name}</p>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>
    </PageShell>
  );
}
