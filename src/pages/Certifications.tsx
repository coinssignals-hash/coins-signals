import { useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { learningPaths } from '@/data/learningPathsData';
import { useCourseProgress } from '@/hooks/useCourseProgress';
import { GlowSection } from '@/components/ui/glow-section';
import { motion } from 'framer-motion';
import { Award, Lock, CheckCircle, Sparkles, GraduationCap } from 'lucide-react';

export default function Certifications() {
  const { isLessonCompleted } = useCourseProgress();

  const certs = useMemo(() => {
    return learningPaths.map(path => {
      const allLessons = path.steps.flatMap(s => s.lessonIds);
      const completed = allLessons.filter(id => isLessonCompleted(id)).length;
      const total = allLessons.length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { ...path, completed, total, percentage, unlocked: percentage === 100 };
    });
  }, [isLessonCompleted]);

  const totalUnlocked = certs.filter(c => c.unlocked).length;

  return (
    <PageShell>
      <Header />
      <main className="container py-3 max-w-lg mx-auto px-3 space-y-3">
        <GlowSection color="40 80% 55%">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, hsl(40 80% 55% / 0.2), hsl(40 80% 55% / 0.08))',
                  border: '1px solid hsl(40 80% 55% / 0.25)',
                }}>
                  <GraduationCap className="w-5 h-5" style={{ color: 'hsl(40 80% 55%)' }} />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground flex items-center gap-1.5">
                    Certificaciones <Sparkles className="w-4 h-4" style={{ color: 'hsl(40 80% 55%)' }} />
                  </h1>
                  <p className="text-xs text-muted-foreground">Completa rutas para obtener diplomas</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold tabular-nums" style={{ color: 'hsl(40 80% 55%)' }}>{totalUnlocked}</span>
                <p className="text-[10px] text-muted-foreground">/{certs.length} obtenidos</p>
              </div>
            </div>
          </div>
        </GlowSection>

        {/* Certificates */}
        <div className="space-y-3">
          {certs.map((cert, ci) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ci * 0.1 }}
              className="relative rounded-2xl overflow-hidden"
              style={{
                background: cert.unlocked
                  ? `linear-gradient(165deg, hsl(${cert.color} / 0.12) 0%, hsl(var(--card)) 50%)`
                  : 'linear-gradient(165deg, hsl(var(--muted) / 0.05) 0%, hsl(var(--card)) 50%)',
                border: `1px solid ${cert.unlocked ? `hsl(${cert.color} / 0.35)` : 'hsl(var(--border) / 0.3)'}`,
                boxShadow: cert.unlocked ? `0 4px 24px hsl(${cert.color} / 0.15)` : undefined,
              }}
            >
              {cert.unlocked && (
                <div className="absolute top-0 inset-x-0 h-[2px]" style={{
                  background: `linear-gradient(90deg, transparent, hsl(${cert.color} / 0.8), transparent)`,
                }} />
              )}

              <div className="relative p-5">
                <div className="flex items-center gap-4">
                  {/* Certificate Icon */}
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0" style={{
                    background: cert.unlocked
                      ? `linear-gradient(135deg, hsl(${cert.color} / 0.25), hsl(${cert.color} / 0.1))`
                      : 'hsl(var(--muted) / 0.1)',
                    border: `2px solid ${cert.unlocked ? `hsl(${cert.color} / 0.4)` : 'hsl(var(--border) / 0.3)'}`,
                    boxShadow: cert.unlocked ? `0 0 20px hsl(${cert.color} / 0.2)` : undefined,
                  }}>
                    {cert.unlocked ? (
                      <Award className="w-8 h-8" style={{ color: `hsl(${cert.color})`, filter: `drop-shadow(0 0 6px hsl(${cert.color} / 0.5))` }} />
                    ) : (
                      <Lock className="w-6 h-6 text-muted-foreground/50" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{cert.icon}</span>
                      <p className={`text-sm font-bold ${cert.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {cert.name}
                      </p>
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-2">{cert.level}</p>

                    {/* Progress */}
                    <div className="h-2 rounded-full overflow-hidden" style={{
                      background: cert.unlocked ? `hsl(${cert.color} / 0.15)` : 'hsl(var(--muted) / 0.15)',
                    }}>
                      <motion.div className="h-full rounded-full" style={{
                        background: cert.unlocked
                          ? `linear-gradient(90deg, hsl(${cert.color} / 0.6), hsl(${cert.color}))`
                          : 'hsl(var(--muted-foreground) / 0.3)',
                      }} animate={{ width: `${cert.percentage}%` }} transition={{ duration: 1 }} />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground">{cert.completed}/{cert.total} lecciones</span>
                      {cert.unlocked ? (
                        <span className="text-[10px] font-bold flex items-center gap-0.5" style={{ color: `hsl(${cert.color})` }}>
                          <CheckCircle className="w-3 h-3" /> Completado
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">{cert.percentage}%</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </PageShell>
  );
}
