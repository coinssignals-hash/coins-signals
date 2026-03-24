import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GlowSection } from '@/components/ui/glow-section';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/LanguageContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Brain, Smile, Frown, Meh, Angry, Heart,
  TrendingUp, TrendingDown, AlertTriangle,
  Plus, Flame,
} from 'lucide-react';

export interface PsychEntry {
  id: string;
  date: string;
  emotion: Emotion;
  discipline: number;
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
  'Entré sin confirmación', 'Moví el SL', 'Sobre-apalancamiento', 'Revenge trading',
  'No esperé setup', 'Cerré antes de TP', 'Ignoré el plan', 'Opero cansado',
];

const STORAGE_KEY = 'trading-psychology-entries';

function loadEntries(): PsychEntry[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveEntries(entries: PsychEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

const ACCENT = '270 70% 60%';
const ACCENT_GREEN = '142 60% 55%';
const ACCENT_ROSE = '0 70% 55%';
const ACCENT_AMBER = '45 80% 55%';

interface PsychologyTrackerProps {
  entries: PsychEntry[];
  onEntriesChange: (entries: PsychEntry[]) => void;
}

export function PsychologyTracker({ entries, onEntriesChange }: PsychologyTrackerProps) {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
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
      emotion, discipline, followed_plan: followedPlan,
      notes, result, mistakes,
    };
    const updated = [entry, ...entries];
    onEntriesChange(updated);
    saveEntries(updated);
    setShowForm(false);
    setNotes(''); setMistakes([]); setDiscipline(3);
  };

  const stats = useMemo(() => {
    if (entries.length === 0) return null;
    const avgDiscipline = entries.reduce((s, e) => s + e.discipline, 0) / entries.length;
    const planFollowed = entries.filter(e => e.followed_plan).length;
    const emotionCounts = entries.reduce((acc, e) => {
      acc[e.emotion] = (acc[e.emotion] || 0) + 1; return acc;
    }, {} as Record<string, number>);
    const mistakeCounts = entries.flatMap(e => e.mistakes).reduce((acc, m) => {
      acc[m] = (acc[m] || 0) + 1; return acc;
    }, {} as Record<string, number>);
    const topMistakes = Object.entries(mistakeCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const emotionWinRate = EMOTIONS.map(em => {
      const emEntries = entries.filter(e => e.emotion === em.key && e.result);
      const wins = emEntries.filter(e => e.result === 'win').length;
      return { emotion: em.key, label: em.label, winRate: emEntries.length > 0 ? (wins / emEntries.length) * 100 : 0, count: emEntries.length };
    }).filter(e => e.count > 0);

    return { avgDiscipline, planRate: (planFollowed / entries.length) * 100, topMistakes, emotionWinRate };
  }, [entries]);

  return (
    <div className="space-y-3">
      <Button onClick={() => setShowForm(!showForm)} className="w-full rounded-xl" size="sm"
        variant={showForm ? 'secondary' : 'default'}
        style={!showForm ? { background: `linear-gradient(135deg, hsl(${ACCENT}), hsl(${ACCENT} / 0.8))`, boxShadow: `0 4px 12px hsl(${ACCENT} / 0.3)` } : undefined}
      >
        <Plus className="w-4 h-4 mr-2" /> {showForm ? 'Cancelar' : 'Registrar Sesión'}
      </Button>

      {showForm && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
          <GlowSection color={ACCENT}>
            <div className="p-3 space-y-3">
              {/* Emotion picker */}
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">¿Cómo te sientes?</span>
                <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                  {EMOTIONS.map(em => {
                    const Icon = em.icon;
                    return (
                      <button key={em.key} onClick={() => setEmotion(em.key)}
                        className={cn("flex items-center gap-1.5 p-2 rounded-lg border text-[10px] font-medium transition-colors",
                          emotion === em.key ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground')}>
                        <Icon className={cn("w-3.5 h-3.5", em.color)} /> {em.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Discipline */}
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Disciplina: {discipline}/5</span>
                <div className="flex gap-1 mt-1">
                  {[1,2,3,4,5].map(v => (
                    <button key={v} onClick={() => setDiscipline(v)}
                      className={cn("flex-1 h-8 rounded-md text-xs font-bold transition-colors",
                        v <= discipline ? 'bg-primary text-primary-foreground' : 'bg-muted/40 text-muted-foreground')}>{v}</button>
                  ))}
                </div>
              </div>

              {/* Followed plan */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">¿Seguiste el plan?</span>
                <div className="flex gap-1">
                  <button onClick={() => setFollowedPlan(true)}
                    className={cn("text-[10px] px-3 py-1 rounded-full border", followedPlan ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-border text-muted-foreground')}>✅ Sí</button>
                  <button onClick={() => setFollowedPlan(false)}
                    className={cn("text-[10px] px-3 py-1 rounded-full border", !followedPlan ? 'border-red-500 bg-red-500/10 text-red-400' : 'border-border text-muted-foreground')}>❌ No</button>
                </div>
              </div>

              {/* Result */}
              <div className="flex gap-1">
                {(['win','loss','breakeven'] as const).map(r => (
                  <button key={r} onClick={() => setResult(r)}
                    className={cn("flex-1 text-[10px] py-1.5 rounded-md border font-medium transition-colors",
                      result === r
                        ? r === 'win' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                          : r === 'loss' ? 'border-red-500 bg-red-500/10 text-red-400'
                            : 'border-amber-500 bg-amber-500/10 text-amber-400'
                        : 'border-border text-muted-foreground')}>
                    {r === 'win' ? '✅ Win' : r === 'loss' ? '❌ Loss' : '➖ BE'}
                  </button>
                ))}
              </div>

              {/* Mistakes */}
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Errores cometidos</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {COMMON_MISTAKES.map(m => (
                    <button key={m} onClick={() => setMistakes(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])}
                      className={cn("text-[9px] px-2 py-1 rounded-full border transition-colors",
                        mistakes.includes(m) ? 'border-red-500 bg-red-500/10 text-red-400' : 'border-border text-muted-foreground')}>{m}</button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas sobre la sesión..."
                className="w-full bg-muted/30 border border-border rounded-lg p-2 text-xs text-foreground placeholder:text-muted-foreground resize-none h-16" />

              <Button onClick={handleSave} className="w-full" size="sm">Guardar Registro</Button>
            </div>
          </GlowSection>
        </motion.div>
      )}

      {/* Stats */}
      {stats && (
        <div className="space-y-3">
          <div className="flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5" style={{ color: `hsl(${ACCENT})` }} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Análisis Psicológico</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <GlowSection color={stats.avgDiscipline >= 3.5 ? ACCENT_GREEN : ACCENT_AMBER}>
              <div className="p-2.5">
                <span className="text-[8px] uppercase tracking-wider text-muted-foreground">Disciplina Promedio</span>
                <p className="text-lg font-bold" style={{ color: `hsl(${stats.avgDiscipline >= 3.5 ? ACCENT_GREEN : stats.avgDiscipline >= 2.5 ? ACCENT_AMBER : ACCENT_ROSE})` }}>
                  {stats.avgDiscipline.toFixed(1)}/5
                </p>
              </div>
            </GlowSection>
            <GlowSection color={stats.planRate >= 70 ? ACCENT_GREEN : ACCENT_AMBER}>
              <div className="p-2.5">
                <span className="text-[8px] uppercase tracking-wider text-muted-foreground">Plan Seguido</span>
                <p className="text-lg font-bold" style={{ color: `hsl(${stats.planRate >= 70 ? ACCENT_GREEN : ACCENT_AMBER})` }}>
                  {stats.planRate.toFixed(0)}%
                </p>
              </div>
            </GlowSection>
          </div>

          {/* Win rate by emotion */}
          {stats.emotionWinRate.length > 0 && (
            <GlowSection color={ACCENT}>
              <div className="p-3 space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Win Rate por Emoción</span>
                {stats.emotionWinRate.map(e => (
                  <div key={e.emotion} className="flex items-center gap-2">
                    <span className="text-[10px] text-foreground w-20">{e.label}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted/40 overflow-hidden">
                      <div className={cn("h-full rounded-full")}
                        style={{ width: `${e.winRate}%`, background: `hsl(${e.winRate >= 50 ? ACCENT_GREEN : ACCENT_ROSE})` }} />
                    </div>
                    <span className="text-[9px] text-muted-foreground tabular-nums w-10 text-right">{e.winRate.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </GlowSection>
          )}

          {/* Top mistakes */}
          {stats.topMistakes.length > 0 && (
            <GlowSection color={ACCENT_ROSE}>
              <div className="p-3 space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Errores Más Frecuentes</span>
                {stats.topMistakes.map(([mistake, count]) => (
                  <div key={mistake} className="flex items-center justify-between">
                    <span className="text-xs text-foreground">{mistake}</span>
                    <span className="text-[10px] font-bold" style={{ color: `hsl(${ACCENT_ROSE})` }}>{count}x</span>
                  </div>
                ))}
              </div>
            </GlowSection>
          )}
        </div>
      )}

      {/* History */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Historial ({entries.length})</span>
        {entries.slice(0, 15).map(entry => {
          const emotionData = EMOTIONS.find(e => e.key === entry.emotion)!;
          const Icon = emotionData.icon;
          return (
            <GlowSection key={entry.id} color={entry.result === 'win' ? ACCENT_GREEN : entry.result === 'loss' ? ACCENT_ROSE : ACCENT_AMBER}>
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted/30">
                      <Icon className={cn("w-4 h-4", emotionData.color)} />
                    </div>
                    <div>
                      <span className="text-xs text-foreground font-medium">{emotionData.label}</span>
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(entry.date), "dd MMM HH:mm", { locale: es })} · Disciplina {entry.discipline}/5
                      </p>
                    </div>
                  </div>
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full")}
                    style={{
                      background: `hsl(${entry.result === 'win' ? ACCENT_GREEN : entry.result === 'loss' ? ACCENT_ROSE : ACCENT_AMBER} / 0.15)`,
                      color: `hsl(${entry.result === 'win' ? ACCENT_GREEN : entry.result === 'loss' ? ACCENT_ROSE : ACCENT_AMBER})`,
                    }}>
                    {entry.result === 'win' ? 'WIN' : entry.result === 'loss' ? 'LOSS' : 'BE'}
                  </span>
                </div>
                {entry.notes && <p className="text-[10px] text-muted-foreground mt-2">{entry.notes}</p>}
                {entry.mistakes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {entry.mistakes.map(m => (
                      <span key={m} className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: `hsl(${ACCENT_ROSE} / 0.1)`, color: `hsl(${ACCENT_ROSE})` }}>{m}</span>
                    ))}
                  </div>
                )}
              </div>
            </GlowSection>
          );
        })}
        {entries.length === 0 && !showForm && (
          <GlowSection color={ACCENT}>
            <div className="py-8 text-center">
              <Brain className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-sm text-muted-foreground">Sin registros psicológicos</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Registra tus emociones para mejorar tu trading</p>
            </div>
          </GlowSection>
        )}
      </div>
    </div>
  );
}

// Export helpers for loading
export { loadEntries as loadPsychEntries, saveEntries as savePsychEntries };
