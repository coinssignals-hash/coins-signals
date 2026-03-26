import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { useTranslation } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, CheckCircle2, XCircle, Zap, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlowSection } from '@/components/ui/glow-section';

interface Challenge {
  id: string;
  titleKey: string;
  descKey: string;
  type: 'pattern' | 'quiz' | 'scenario';
  difficulty: 'easy' | 'medium' | 'hard';
  xp: number;
  questionKey: string;
  optionKeys: string[];
  correctIndex: number;
  explanationKey: string;
}

const DAILY_CHALLENGES: Challenge[] = [
  { id: '1', titleKey: 'dc_q1_title', descKey: 'dc_q1_desc', type: 'pattern', difficulty: 'easy', xp: 50, questionKey: 'dc_q1_question', optionKeys: ['Hammer', 'Doji', 'Engulfing', 'Shooting Star'], correctIndex: 0, explanationKey: 'dc_q1_explanation' },
  { id: '2', titleKey: 'dc_q2_title', descKey: 'dc_q2_desc', type: 'quiz', difficulty: 'medium', xp: 75, questionKey: 'dc_q2_question', optionKeys: ['dc_q2_opt1', 'dc_q2_opt2', 'dc_q2_opt3', 'dc_q2_opt4'], correctIndex: 1, explanationKey: 'dc_q2_explanation' },
  { id: '3', titleKey: 'dc_q3_title', descKey: 'dc_q3_desc', type: 'scenario', difficulty: 'medium', xp: 100, questionKey: 'dc_q3_question', optionKeys: ['$100', '$200', '$500', '$1,000'], correctIndex: 1, explanationKey: 'dc_q3_explanation' },
  { id: '4', titleKey: 'dc_q4_title', descKey: 'dc_q4_desc', type: 'quiz', difficulty: 'easy', xp: 50, questionKey: 'dc_q4_question', optionKeys: ['dc_q4_opt1', 'dc_q4_opt2', 'dc_q4_opt3', 'dc_q4_opt4'], correctIndex: 2, explanationKey: 'dc_q4_explanation' },
  { id: '5', titleKey: 'dc_q5_title', descKey: 'dc_q5_desc', type: 'scenario', difficulty: 'hard', xp: 150, questionKey: 'dc_q5_question', optionKeys: ['1:1', '1:2', '1:3', '3:1'], correctIndex: 2, explanationKey: 'dc_q5_explanation' },
];

const ACCENT = '45 95% 55%';

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

  const resolveOption = (key: string) => {
    const translated = t(key);
    return translated === key && !key.startsWith('dc_') ? key : translated;
  };

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

  const diffLabel = (d: string) => d === 'easy' ? t('dc_easy') : d === 'medium' ? t('dc_medium') : t('dc_hard');
  const diffColor = {
    easy: 'bg-[hsl(var(--bullish))]/20 text-[hsl(var(--bullish))]',
    medium: 'bg-accent/20 text-accent',
    hard: 'bg-[hsl(var(--bearish))]/20 text-[hsl(var(--bearish))]',
  };

  return (
    <PageShell>
      <Header />
      <div className="relative overflow-hidden" style={{
        background: `linear-gradient(165deg, hsl(${ACCENT} / 0.15) 0%, hsl(var(--background)) 50%)`,
      }}>
        <div className="absolute top-0 inset-x-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, hsl(${ACCENT} / 0.8), transparent)` }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-40 rounded-full opacity-20 pointer-events-none" style={{ background: `radial-gradient(circle, hsl(${ACCENT} / 0.5), transparent 70%)` }} />
        <div className="relative px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="flex items-center justify-center w-8 h-8 rounded-xl transition-all active:scale-90" style={{ background: `hsl(${ACCENT} / 0.1)`, border: `1px solid hsl(${ACCENT} / 0.2)` }}>
              <ArrowLeft className="w-4 h-4" style={{ color: `hsl(${ACCENT})` }} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(165deg, hsl(${ACCENT} / 0.25), hsl(${ACCENT} / 0.08))`, border: `1px solid hsl(${ACCENT} / 0.3)`, boxShadow: `0 0 20px hsl(${ACCENT} / 0.15)` }}>
                <Target className="w-5 h-5" style={{ color: `hsl(${ACCENT})` }} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground tracking-tight">{t('daily_challenges_title')}</h1>
                <p className="text-[11px] text-muted-foreground">{t('dc_test_knowledge')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-lg mx-auto space-y-4 pb-24 px-4 pt-4">
        <GlowSection color={ACCENT}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-foreground">{t('daily_challenges_title')}</h2>
              <span className="text-xs text-muted-foreground">{currentIndex + 1}/{DAILY_CHALLENGES.length}</span>
            </div>
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1.5">
                <Zap className="h-4 w-4" style={{ color: `hsl(${ACCENT})` }} />
                <span className="text-sm font-bold text-foreground">{totalXP} XP</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Trophy className="h-4 w-4" style={{ color: `hsl(${ACCENT})` }} />
                <span className="text-sm text-muted-foreground">{t('dc_streak')}: {streak}</span>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </GlowSection>

        <AnimatePresence mode="wait">
          <motion.div key={challenge.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <GlowSection color="270 70% 55%">
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    <span className="font-bold text-foreground text-sm">{t(challenge.titleKey)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-[10px] ${diffColor[challenge.difficulty]}`}>{diffLabel(challenge.difficulty)}</Badge>
                    <Badge variant="outline" className="text-[10px]" style={{ borderColor: `hsl(${ACCENT} / 0.5)`, color: `hsl(${ACCENT})` }}>+{challenge.xp} XP</Badge>
                  </div>
                </div>

                <p className="text-sm text-foreground leading-relaxed">{t(challenge.questionKey)}</p>

                <div className="space-y-2">
                  {challenge.optionKeys.map((optKey, idx) => {
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
                          <span className="text-foreground">{resolveOption(optKey)}</span>
                          {isAnswered && isCorrect && <CheckCircle2 className="h-4 w-4 text-[hsl(var(--bullish))]" />}
                          {isAnswered && isSelected && !isCorrect && <XCircle className="h-4 w-4 text-[hsl(var(--bearish))]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {answered.has(challenge.id) && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    className="p-3 rounded-xl border border-border/30" style={{ background: 'hsl(var(--secondary) / 0.3)' }}>
                    <p className="text-xs text-muted-foreground leading-relaxed">💡 {t(challenge.explanationKey)}</p>
                  </motion.div>
                )}
              </div>
            </GlowSection>
          </motion.div>
        </AnimatePresence>

        {answered.has(challenge.id) && currentIndex < DAILY_CHALLENGES.length - 1 && (
          <Button onClick={next} className="w-full rounded-xl backdrop-blur" style={{
            background: `linear-gradient(135deg, hsl(${ACCENT}), hsl(${ACCENT} / 0.8))`,
            border: `1px solid hsl(${ACCENT} / 0.4)`,
          }}>
            {t('dc_next_challenge')} →
          </Button>
        )}

        {answered.size === DAILY_CHALLENGES.length && (
          <GlowSection color={ACCENT} className="text-center">
            <div className="p-6 space-y-2">
              <Trophy className="h-10 w-10 mx-auto" style={{ color: `hsl(${ACCENT})` }} />
              <p className="text-lg font-bold text-foreground">{t('dc_completed')}</p>
              <p className="text-sm text-muted-foreground">{t('dc_earned_xp').replace('{xp}', String(totalXP))}</p>
              <p className="text-xs text-muted-foreground">{t('dc_come_back')}</p>
            </div>
          </GlowSection>
        )}
      </div>
    </PageShell>
  );
}
