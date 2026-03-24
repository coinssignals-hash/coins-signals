import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { useTranslation } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, CheckCircle2, XCircle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlowSection } from '@/components/ui/glow-section';

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'pattern' | 'quiz' | 'scenario';
  difficulty: 'easy' | 'medium' | 'hard';
  xp: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const DAILY_CHALLENGES: Challenge[] = [
  {
    id: '1', title: 'Identifica el Patrón', description: 'Reconoce patrones de velas',
    type: 'pattern', difficulty: 'easy', xp: 50,
    question: '¿Qué patrón representa una vela con cuerpo pequeño y sombra inferior larga?',
    options: ['Hammer', 'Doji', 'Engulfing', 'Shooting Star'],
    correctIndex: 0,
    explanation: 'El Hammer tiene un cuerpo pequeño en la parte superior y una sombra inferior al menos 2x el cuerpo. Indica posible reversión alcista.'
  },
  {
    id: '2', title: 'Soporte y Resistencia', description: 'Niveles clave',
    type: 'quiz', difficulty: 'medium', xp: 75,
    question: 'Un precio que rebota múltiples veces en el mismo nivel por debajo indica:',
    options: ['Nivel de resistencia', 'Nivel de soporte', 'Gap de precio', 'Zona de liquidez neutral'],
    correctIndex: 1,
    explanation: 'El soporte es un nivel donde la demanda es suficiente para detener la caída del precio. Los rebotes confirman la fuerza del nivel.'
  },
  {
    id: '3', title: 'Gestión de Riesgo', description: 'Money Management',
    type: 'scenario', difficulty: 'medium', xp: 100,
    question: 'Con una cuenta de $10,000 y riesgo del 2% por trade, ¿cuánto puedes arriesgar?',
    options: ['$100', '$200', '$500', '$1,000'],
    correctIndex: 1,
    explanation: 'El 2% de $10,000 = $200. Esta regla ayuda a proteger tu capital de rachas perdedoras consecutivas.'
  },
  {
    id: '4', title: 'Indicadores RSI', description: 'Lectura de RSI',
    type: 'quiz', difficulty: 'easy', xp: 50,
    question: '¿Qué valor de RSI indica sobrecompra?',
    options: ['Por debajo de 30', 'Entre 40-60', 'Por encima de 70', 'Exactamente 50'],
    correctIndex: 2,
    explanation: 'RSI por encima de 70 indica sobrecompra (posible corrección a la baja). Por debajo de 30 indica sobreventa.'
  },
  {
    id: '5', title: 'Ratio Riesgo/Beneficio', description: 'R:R óptimo',
    type: 'scenario', difficulty: 'hard', xp: 150,
    question: 'Si tu SL está a 20 pips y tu TP a 60 pips, ¿cuál es tu ratio R:R?',
    options: ['1:1', '1:2', '1:3', '3:1'],
    correctIndex: 2,
    explanation: 'Ratio R:R = TP/SL = 60/20 = 1:3. Con este ratio, necesitas ganar solo el 25% de trades para ser rentable.'
  },
];

const ACCENT = '45 95% 55%'; // amber accent

export default function DailyChallenges() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState<Set<string>>(new Set());
  const [totalXP, setTotalXP] = useState(0);
  const [streak, setStreak] = useState(0);

  const challenge = DAILY_CHALLENGES[currentIndex];
  const progress = (answered.size / DAILY_CHALLENGES.length) * 100;

  const handleAnswer = (idx: number) => {
    if (answered.has(challenge.id)) return;
    setSelected(idx);
    setAnswered(prev => new Set(prev).add(challenge.id));
    if (idx === challenge.correctIndex) {
      setTotalXP(prev => prev + challenge.xp);
      setStreak(s => s + 1);
    } else {
      setStreak(0);
    }
  };

  const next = () => {
    if (currentIndex < DAILY_CHALLENGES.length - 1) {
      setCurrentIndex(i => i + 1);
      setSelected(null);
    }
  };

  const diffColor = {
    easy: 'bg-[hsl(var(--bullish))]/20 text-[hsl(var(--bullish))]',
    medium: 'bg-accent/20 text-accent',
    hard: 'bg-[hsl(var(--bearish))]/20 text-[hsl(var(--bearish))]',
  };

  return (
    <PageShell>
      <Header />
      <div className="max-w-lg mx-auto space-y-4 pb-24 px-4 pt-4">
        <GlowSection color={ACCENT}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-foreground">{t('daily_challenges_title') || 'Retos Diarios'}</h2>
              <span className="text-xs text-muted-foreground">{currentIndex + 1}/{DAILY_CHALLENGES.length}</span>
            </div>
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1.5">
                <Zap className="h-4 w-4" style={{ color: `hsl(${ACCENT})` }} />
                <span className="text-sm font-bold text-foreground">{totalXP} XP</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Trophy className="h-4 w-4" style={{ color: `hsl(${ACCENT})` }} />
                <span className="text-sm text-muted-foreground">Racha: {streak}</span>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </GlowSection>

        {/* Challenge Card */}
        <AnimatePresence mode="wait">
          <motion.div key={challenge.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <GlowSection color="270 70% 55%">
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    <span className="font-bold text-foreground text-sm">{challenge.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-[10px] ${diffColor[challenge.difficulty]}`}>
                      {challenge.difficulty === 'easy' ? 'Fácil' : challenge.difficulty === 'medium' ? 'Medio' : 'Difícil'}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]" style={{
                      borderColor: `hsl(${ACCENT} / 0.5)`,
                      color: `hsl(${ACCENT})`,
                    }}>+{challenge.xp} XP</Badge>
                  </div>
                </div>

                <p className="text-sm text-foreground leading-relaxed">{challenge.question}</p>

                <div className="space-y-2">
                  {challenge.options.map((opt, idx) => {
                    const isAnswered = answered.has(challenge.id);
                    const isCorrect = idx === challenge.correctIndex;
                    const isSelected = selected === idx;
                    let borderStyle = 'border-border/50';
                    let bgStyle = '';
                    if (isAnswered) {
                      if (isCorrect) { borderStyle = 'border-[hsl(var(--bullish))]'; bgStyle = 'bg-[hsl(var(--bullish))]/10'; }
                      else if (isSelected) { borderStyle = 'border-[hsl(var(--bearish))]'; bgStyle = 'bg-[hsl(var(--bearish))]/10'; }
                    }

                    return (
                      <button key={idx} onClick={() => handleAnswer(idx)} disabled={isAnswered}
                        className={`w-full text-left p-3 rounded-xl border transition-all text-sm ${borderStyle} ${bgStyle} ${!isAnswered ? 'hover:border-primary/50 active:scale-[0.98]' : ''}`}
                        style={{ background: !isAnswered ? 'hsl(var(--background) / 0.4)' : undefined }}>
                        <div className="flex items-center justify-between">
                          <span className="text-foreground">{opt}</span>
                          {isAnswered && isCorrect && <CheckCircle2 className="h-4 w-4 text-[hsl(var(--bullish))]" />}
                          {isAnswered && isSelected && !isCorrect && <XCircle className="h-4 w-4 text-[hsl(var(--bearish))]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {answered.has(challenge.id) && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    className="p-3 rounded-xl border border-border/30" style={{
                      background: 'hsl(var(--secondary) / 0.3)',
                    }}>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      💡 {challenge.explanation}
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {answered.has(challenge.id) && currentIndex < DAILY_CHALLENGES.length - 1 && (
          <Button onClick={next} className="w-full rounded-xl backdrop-blur" style={{
            background: `linear-gradient(135deg, hsl(${ACCENT}), hsl(${ACCENT} / 0.8))`,
            border: `1px solid hsl(${ACCENT} / 0.4)`,
          }}>
            Siguiente Reto →
          </Button>
        )}

        {answered.size === DAILY_CHALLENGES.length && (
          <div className="relative rounded-2xl overflow-hidden text-center" style={{
            background: `linear-gradient(165deg, hsl(${ACCENT} / 0.1) 0%, hsl(var(--card)) 40%, hsl(var(--background)) 100%)`,
            border: `1px solid hsl(${ACCENT} / 0.3)`,
          }}>
            <div className="absolute top-0 inset-x-0 h-[2px]" style={{
              background: `linear-gradient(90deg, transparent, hsl(${ACCENT} / 0.8), transparent)`,
            }} />
            <div className="relative p-6 space-y-2">
              <Trophy className="h-10 w-10 mx-auto" style={{ color: `hsl(${ACCENT})` }} />
              <p className="text-lg font-bold text-foreground">¡Retos completados!</p>
              <p className="text-sm text-muted-foreground">Has ganado {totalXP} XP hoy</p>
              <p className="text-xs text-muted-foreground">Vuelve mañana para nuevos retos</p>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
