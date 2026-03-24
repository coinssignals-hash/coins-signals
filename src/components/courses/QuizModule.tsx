import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, ChevronRight, RotateCcw, Trophy, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ModuleQuiz } from '@/data/quizData';

interface QuizModuleProps {
  quiz: ModuleQuiz;
  color: string;
  onComplete?: (score: number, total: number) => void;
}

export function QuizModule({ quiz, color, onComplete }: QuizModuleProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const q = quiz.questions[currentQ];
  const isCorrect = selected === q?.correctIndex;
  const total = quiz.questions.length;
  const percentage = Math.round((score / total) * 100);

  const handleSelect = useCallback((idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    if (idx === q.correctIndex) setScore(s => s + 1);
  }, [answered, q?.correctIndex]);

  const handleNext = useCallback(() => {
    if (currentQ < total - 1) {
      setCurrentQ(c => c + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      setFinished(true);
      onComplete?.(score + (isCorrect ? 0 : 0), total); // score already updated
    }
  }, [currentQ, total, score, isCorrect, onComplete]);

  const handleRetry = useCallback(() => {
    setCurrentQ(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
    setFinished(false);
  }, []);

  if (finished) {
    const passed = percentage >= 70;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl overflow-hidden"
        style={{
          background: `linear-gradient(165deg, hsl(${color} / 0.1) 0%, hsl(var(--card)) 50%)`,
          border: `1px solid hsl(${color} / 0.25)`,
        }}
      >
        <div className="absolute top-0 inset-x-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, hsl(${color} / 0.7), transparent)` }} />
        <div className="p-6 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center" style={{
            background: passed ? 'hsl(var(--bullish) / 0.15)' : 'hsl(var(--bearish) / 0.15)',
            border: `2px solid ${passed ? 'hsl(var(--bullish) / 0.4)' : 'hsl(var(--bearish) / 0.4)'}`,
          }}>
            {passed ? <Trophy className="w-8 h-8" style={{ color: 'hsl(var(--bullish))' }} /> : <RotateCcw className="w-8 h-8" style={{ color: 'hsl(var(--bearish))' }} />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">{passed ? '¡Excelente!' : 'Sigue practicando'}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {passed ? 'Has aprobado el quiz del módulo' : 'Necesitas al menos 70% para aprobar'}
            </p>
          </div>
          <div className="text-3xl font-bold" style={{ color: passed ? 'hsl(var(--bullish))' : 'hsl(var(--bearish))' }}>
            {score}/{total} <span className="text-base font-normal text-muted-foreground">({percentage}%)</span>
          </div>
          {!passed && (
            <button onClick={handleRetry} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{
              background: `linear-gradient(135deg, hsl(${color} / 0.2), hsl(${color} / 0.1))`,
              border: `1px solid hsl(${color} / 0.3)`,
              color: `hsl(${color})`,
            }}>
              <RotateCcw className="w-3.5 h-3.5 inline mr-1.5" /> Reintentar
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden relative" style={{
      background: `linear-gradient(165deg, hsl(${color} / 0.06) 0%, hsl(var(--card)) 40%)`,
      border: `1px solid hsl(${color} / 0.2)`,
    }}>
      <div className="absolute top-0 inset-x-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, hsl(${color} / 0.6), transparent)` }} />

      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: `hsl(${color})` }} />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quiz</span>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{
            background: `hsl(${color} / 0.15)`,
            color: `hsl(${color})`,
          }}>
            {currentQ + 1} / {total}
          </span>
        </div>

        {/* Progress */}
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `hsl(${color} / 0.1)` }}>
          <motion.div className="h-full rounded-full" style={{ background: `hsl(${color})` }} animate={{ width: `${((currentQ + (answered ? 1 : 0)) / total) * 100}%` }} transition={{ duration: 0.3 }} />
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <p className="text-sm font-bold text-foreground mb-3">{q.question}</p>

            <div className="space-y-2">
              {q.options.map((opt, idx) => {
                const isThis = selected === idx;
                const correct = idx === q.correctIndex;
                let bg = 'hsl(var(--muted) / 0.1)';
                let border = 'hsl(var(--border) / 0.3)';
                let textColor = '';

                if (answered) {
                  if (correct) { bg = 'hsl(var(--bullish) / 0.12)'; border = 'hsl(var(--bullish) / 0.4)'; textColor = 'hsl(var(--bullish))'; }
                  else if (isThis && !correct) { bg = 'hsl(var(--bearish) / 0.12)'; border = 'hsl(var(--bearish) / 0.4)'; textColor = 'hsl(var(--bearish))'; }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    disabled={answered}
                    className={cn('w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all text-sm', !answered && 'hover:bg-muted/15 active:scale-[0.98]')}
                    style={{ background: bg, border: `1px solid ${border}` }}
                  >
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold" style={{
                      background: answered && correct ? 'hsl(var(--bullish))' : answered && isThis ? 'hsl(var(--bearish))' : 'hsl(var(--muted) / 0.3)',
                      color: answered && (correct || isThis) ? 'white' : 'hsl(var(--muted-foreground))',
                    }}>
                      {answered && correct ? <CheckCircle className="w-3.5 h-3.5" /> : answered && isThis ? <XCircle className="w-3.5 h-3.5" /> : String.fromCharCode(65 + idx)}
                    </div>
                    <span style={textColor ? { color: textColor } : undefined} className={cn(answered && correct && 'font-semibold')}>
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            <AnimatePresence>
              {answered && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="overflow-hidden">
                  <div className="mt-3 p-3 rounded-xl text-xs" style={{
                    background: isCorrect ? 'hsl(var(--bullish) / 0.08)' : 'hsl(var(--bearish) / 0.08)',
                    border: `1px solid ${isCorrect ? 'hsl(var(--bullish) / 0.2)' : 'hsl(var(--bearish) / 0.2)'}`,
                  }}>
                    <p className="font-semibold mb-1" style={{ color: isCorrect ? 'hsl(var(--bullish))' : 'hsl(var(--bearish))' }}>
                      {isCorrect ? '✓ ¡Correcto!' : '✗ Incorrecto'}
                    </p>
                    <p className="text-muted-foreground">{q.explanation}</p>
                  </div>
                  <button onClick={handleNext} className="mt-3 w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2" style={{
                    background: `linear-gradient(135deg, hsl(${color} / 0.2), hsl(${color} / 0.1))`,
                    border: `1px solid hsl(${color} / 0.3)`,
                    color: `hsl(${color})`,
                  }}>
                    {currentQ < total - 1 ? 'Siguiente' : 'Ver resultado'} <ChevronRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
