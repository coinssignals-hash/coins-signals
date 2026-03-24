import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { useTranslation } from '@/i18n/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, CheckCircle2, XCircle, Zap, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  image?: string;
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

const diffColor = { easy: 'bg-[hsl(var(--bullish))]/20 text-[hsl(var(--bullish))]', medium: 'bg-accent/20 text-accent', hard: 'bg-[hsl(var(--bearish))]/20 text-[hsl(var(--bearish))]' };

export default function DailyChallenges() {
  const { t } = useTranslation();
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

  return (
    <PageShell title={t('daily_challenges_title') || 'Retos Diarios'} backTo="/tools">
      <div className="space-y-4 pb-24">
        {/* Header Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4 text-accent" />
              <span className="text-sm font-bold text-foreground">{totalXP} XP</span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="h-4 w-4 text-accent" />
              <span className="text-sm text-muted-foreground">Racha: {streak}</span>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">{currentIndex + 1}/{DAILY_CHALLENGES.length}</span>
        </div>

        <Progress value={progress} className="h-2" />

        {/* Challenge Card */}
        <AnimatePresence mode="wait">
          <motion.div key={challenge.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <Card className="p-4 bg-card border-border space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <span className="font-bold text-foreground text-sm">{challenge.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`text-[10px] ${diffColor[challenge.difficulty]}`}>
                    {challenge.difficulty === 'easy' ? 'Fácil' : challenge.difficulty === 'medium' ? 'Medio' : 'Difícil'}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] border-accent text-accent">+{challenge.xp} XP</Badge>
                </div>
              </div>

              <p className="text-sm text-foreground leading-relaxed">{challenge.question}</p>

              <div className="space-y-2">
                {challenge.options.map((opt, idx) => {
                  const isAnswered = answered.has(challenge.id);
                  const isCorrect = idx === challenge.correctIndex;
                  const isSelected = selected === idx;
                  let borderClass = 'border-border';
                  if (isAnswered) {
                    if (isCorrect) borderClass = 'border-[hsl(var(--bullish))] bg-[hsl(var(--bullish))]/10';
                    else if (isSelected) borderClass = 'border-[hsl(var(--bearish))] bg-[hsl(var(--bearish))]/10';
                  }

                  return (
                    <button key={idx} onClick={() => handleAnswer(idx)} disabled={isAnswered}
                      className={`w-full text-left p-3 rounded-lg border transition-all text-sm ${borderClass} ${!isAnswered ? 'hover:border-primary/50 active:scale-[0.98]' : ''}`}>
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
                  className="p-3 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    💡 {challenge.explanation}
                  </p>
                </motion.div>
              )}
            </Card>
          </motion.div>
        </AnimatePresence>

        {answered.has(challenge.id) && currentIndex < DAILY_CHALLENGES.length - 1 && (
          <Button onClick={next} className="w-full bg-primary text-primary-foreground">
            Siguiente Reto →
          </Button>
        )}

        {answered.size === DAILY_CHALLENGES.length && (
          <Card className="p-6 bg-card border-border text-center space-y-2">
            <Trophy className="h-10 w-10 mx-auto text-accent" />
            <p className="text-lg font-bold text-foreground">¡Retos completados!</p>
            <p className="text-sm text-muted-foreground">Has ganado {totalXP} XP hoy</p>
            <p className="text-xs text-muted-foreground">Vuelve mañana para nuevos retos</p>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
