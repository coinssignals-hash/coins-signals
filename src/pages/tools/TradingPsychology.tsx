import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Brain, Smile, Frown, Meh, Angry, Heart,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  Plus, ChevronDown, Flame,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/layout/PageShell';
import { ToolPageHeader } from '@/components/tools/ToolCard';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PsychEntry {
  id: string;
  date: string;
  emotion: Emotion;
  discipline: number; // 1-5
  followed_plan: boolean;
  notes: string;
  result?: 'win' | 'loss' | 'breakeven';
  mistakes: string[];
}

type Emotion = 'confident' | 'calm' | 'anxious' | 'frustrated' | 'euphoric' | 'fearful';

const EMOTIONS: { key: Emotion; icon: React.ElementType; label: string; color: string }[] = [
  { key: 'confident', icon: TrendingUp, label: 'Confiado', color: 'text-emerald-400' },
  { key: 'calm', icon: Smile, label: 'Tranquilo', color: 'text-blue-400' },
  { key: 'anxious', icon: AlertTriangle, label: 'Ansioso', color: 'text-amber-400' },
  { key: 'frustrated', icon: Angry, label: 'Frustrado', color: 'text-red-400' },
  { key: 'euphoric', icon: Flame, label: 'Eufórico', color: 'text-orange-400' },
  { key: 'fearful', icon: Frown, label: 'Temeroso', color: 'text-purple-400' },
];

const COMMON_MISTAKES = [
  'Entré sin confirmación',
  'Moví el SL',
  'Sobre-apalancamiento',
  'Revenge trading',
  'No esperé setup',
  'Cerré antes de TP',
  'Ignoré el plan',
  'Opero cansado',
];

const STORAGE_KEY = 'trading-psychology-entries';

function loadEntries(): PsychEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

function saveEntries(entries: PsychEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export default function TradingPsychology() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<PsychEntry[]>(loadEntries);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [emotion, setEmotion] = useState<Emotion>('calm');
  const [discipline, setDiscipline] = useState(3);
  const [followedPlan, setFollowedPlan] = useState(true);
  const [result, setResult] = useState<'win' | 'loss' | 'breakeven'>('win');
  const [notes, setNotes] = useState('');
  const [mistakes, setMistakes] = useState<string[]>([]);

  const handleSave = () => {
    const entry: PsychEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      emotion,
      discipline,
      followed_plan: followedPlan,
      notes,
      result,
      mistakes,
    };
    const updated = [entry, ...entries];
    setEntries(updated);
    saveEntries(updated);
    setShowForm(false);
    setNotes('');
    setMistakes([]);
    setDiscipline(3);
  };

  const stats = useMemo(() => {
    if (entries.length === 0) return null;
    const avgDiscipline = entries.reduce((s, e) => s + e.discipline, 0) / entries.length;
    const planFollowed = entries.filter(e => e.followed_plan).length;
    const emotionCounts = entries.reduce((acc, e) => {
      acc[e.emotion] = (acc[e.emotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as Emotion;
    const mistakeCounts = entries.flatMap(e => e.mistakes).reduce((acc, m) => {
      acc[m] = (acc[m] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topMistakes = Object.entries(mistakeCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

    // Win rate by emotion
    const emotionWinRate = EMOTIONS.map(em => {
      const emEntries = entries.filter(e => e.emotion === em.key && e.result);
      const wins = emEntries.filter(e => e.result === 'win').length;
      return { emotion: em.key, label: em.label, winRate: emEntries.length > 0 ? (wins / emEntries.length) * 100 : 0, count: emEntries.length };
    }).filter(e => e.count > 0);

    return { avgDiscipline, planFollowed, planRate: (planFollowed / entries.length) * 100, topEmotion, topMistakes, emotionWinRate };
  }, [entries]);

  const navigate = useNavigate();

  return (
    <PageShell>
      <div className="space-y-4 px-4 pb-24">
        <div className="flex items-center gap-3 pt-4">
          <button onClick={() => navigate('/tools')} className="text-muted-foreground"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-base font-bold text-foreground">{t('trading_psychology_title') || 'Psicología de Trading'}</h1>
        </div>
        {/* Add entry button */}
        <Button onClick={() => setShowForm(!showForm)} className="w-full" size="sm">
          <Plus className="w-4 h-4 mr-2" /> Registrar Sesión
        </Button>

        {/* Form */}
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
            <Card className="bg-card border-border">
              <CardContent className="p-3 space-y-3">
                {/* Emotion picker */}
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">¿Cómo te sientes?</span>
                  <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                    {EMOTIONS.map(em => {
                      const Icon = em.icon;
                      return (
                        <button
                          key={em.key}
                          onClick={() => setEmotion(em.key)}
                          className={cn(
                            "flex items-center gap-1.5 p-2 rounded-lg border text-[10px] font-medium transition-colors",
                            emotion === em.key ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
                          )}
                        >
                          <Icon className={cn("w-3.5 h-3.5", em.color)} />
                          {em.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Discipline slider */}
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    Disciplina: {discipline}/5
                  </span>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map(v => (
                      <button
                        key={v}
                        onClick={() => setDiscipline(v)}
                        className={cn(
                          "flex-1 h-8 rounded-md text-xs font-bold transition-colors",
                          v <= discipline ? 'bg-primary text-primary-foreground' : 'bg-muted/40 text-muted-foreground'
                        )}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Followed plan */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">¿Seguiste el plan?</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setFollowedPlan(true)}
                      className={cn("text-[10px] px-3 py-1 rounded-full border", followedPlan ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-border text-muted-foreground')}
                    >✅ Sí</button>
                    <button
                      onClick={() => setFollowedPlan(false)}
                      className={cn("text-[10px] px-3 py-1 rounded-full border", !followedPlan ? 'border-red-500 bg-red-500/10 text-red-400' : 'border-border text-muted-foreground')}
                    >❌ No</button>
                  </div>
                </div>

                {/* Result */}
                <div className="flex gap-1">
                  {(['win', 'loss', 'breakeven'] as const).map(r => (
                    <button
                      key={r}
                      onClick={() => setResult(r)}
                      className={cn(
                        "flex-1 text-[10px] py-1.5 rounded-md border font-medium transition-colors",
                        result === r
                          ? r === 'win' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                            : r === 'loss' ? 'border-red-500 bg-red-500/10 text-red-400'
                              : 'border-amber-500 bg-amber-500/10 text-amber-400'
                          : 'border-border text-muted-foreground'
                      )}
                    >
                      {r === 'win' ? '✅ Win' : r === 'loss' ? '❌ Loss' : '➖ BE'}
                    </button>
                  ))}
                </div>

                {/* Common mistakes */}
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Errores cometidos</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {COMMON_MISTAKES.map(m => (
                      <button
                        key={m}
                        onClick={() => setMistakes(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])}
                        className={cn(
                          "text-[9px] px-2 py-1 rounded-full border transition-colors",
                          mistakes.includes(m) ? 'border-red-500 bg-red-500/10 text-red-400' : 'border-border text-muted-foreground'
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Notas sobre la sesión..."
                  className="w-full bg-muted/30 border border-border rounded-lg p-2 text-xs text-foreground placeholder:text-muted-foreground resize-none h-16"
                />

                <Button onClick={handleSave} className="w-full" size="sm">
                  Guardar Registro
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Stats Dashboard */}
        {stats && (
          <>
            <h3 className="text-xs font-semibold text-primary flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5" /> Análisis Psicológico
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Card className="bg-card border-border">
                <CardContent className="p-2.5">
                  <span className="text-[8px] uppercase tracking-wider text-muted-foreground">Disciplina Promedio</span>
                  <p className={cn("text-lg font-bold", stats.avgDiscipline >= 3.5 ? 'text-emerald-400' : stats.avgDiscipline >= 2.5 ? 'text-amber-400' : 'text-red-400')}>
                    {stats.avgDiscipline.toFixed(1)}/5
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-2.5">
                  <span className="text-[8px] uppercase tracking-wider text-muted-foreground">Plan Seguido</span>
                  <p className={cn("text-lg font-bold", stats.planRate >= 70 ? 'text-emerald-400' : 'text-amber-400')}>
                    {stats.planRate.toFixed(0)}%
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Win rate by emotion */}
            {stats.emotionWinRate.length > 0 && (
              <Card className="bg-card border-border">
                <CardContent className="p-3 space-y-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Win Rate por Emoción</span>
                  {stats.emotionWinRate.map(e => (
                    <div key={e.emotion} className="flex items-center gap-2">
                      <span className="text-[10px] text-foreground w-20">{e.label}</span>
                      <div className="flex-1 h-2 rounded-full bg-muted/40 overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", e.winRate >= 50 ? 'bg-emerald-500' : 'bg-red-500')}
                          style={{ width: `${e.winRate}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-muted-foreground tabular-nums w-10 text-right">{e.winRate.toFixed(0)}%</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Top mistakes */}
            {stats.topMistakes.length > 0 && (
              <Card className="bg-card border-border">
                <CardContent className="p-3 space-y-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Errores Más Frecuentes</span>
                  {stats.topMistakes.map(([mistake, count]) => (
                    <div key={mistake} className="flex items-center justify-between">
                      <span className="text-xs text-foreground">{mistake}</span>
                      <span className="text-[10px] text-red-400 font-bold">{count}x</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Entries list */}
        <h3 className="text-xs font-semibold text-primary">Historial ({entries.length})</h3>
        {entries.slice(0, 20).map(entry => {
          const emotionData = EMOTIONS.find(e => e.key === entry.emotion)!;
          const Icon = emotionData.icon;
          return (
            <Card key={entry.id} className="bg-card border-border">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center bg-muted/30")}>
                      <Icon className={cn("w-4 h-4", emotionData.color)} />
                    </div>
                    <div>
                      <span className="text-xs text-foreground font-medium">{emotionData.label}</span>
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(entry.date), "dd MMM HH:mm", { locale: es })}
                        {' · '}Disciplina {entry.discipline}/5
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                    entry.result === 'win' ? 'bg-emerald-500/15 text-emerald-400' :
                      entry.result === 'loss' ? 'bg-red-500/15 text-red-400' :
                        'bg-amber-500/15 text-amber-400'
                  )}>
                    {entry.result === 'win' ? 'WIN' : entry.result === 'loss' ? 'LOSS' : 'BE'}
                  </span>
                </div>
                {entry.notes && <p className="text-[10px] text-muted-foreground mt-2">{entry.notes}</p>}
                {entry.mistakes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {entry.mistakes.map(m => (
                      <span key={m} className="text-[8px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">{m}</span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {entries.length === 0 && !showForm && (
          <Card className="bg-card border-border">
            <CardContent className="py-10 text-center">
              <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-foreground font-medium text-sm mb-1">Sin registros</h3>
              <p className="text-muted-foreground text-xs">Registra tus emociones para mejorar tu trading</p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
