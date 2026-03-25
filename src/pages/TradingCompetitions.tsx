import { useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { useTranslation } from '@/i18n/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import {
  Trophy, Swords, Clock, Users, Gift, Target,
  Medal, Timer, Zap, Lock, Shield, CheckCircle2
} from 'lucide-react';
import { GlowSection } from '@/components/ui/glow-section';
import { useNavigate } from 'react-router-dom';
import { ToolPageHeader } from '@/components/tools/ToolCard';
import { CompetitionWinnersBanner } from '@/components/competitions/CompetitionWinnersBanner';

type CompStatus = 'active' | 'upcoming' | 'ended';

interface Competition {
  id: string; name: string; description: string;
  type: 'pnl' | 'winrate' | 'consistency' | 'speed';
  status: CompStatus; prizePool: string; participants: number; maxParticipants: number;
  startDate: string; endDate: string; entryFee: string;
  myRank?: number; myScore?: number;
  topPlayers: { alias: string; score: string; country: string }[];
  rules: string[]; tier: 'free' | 'premium';
}

const COMPETITIONS: Competition[] = [
  { id: '1', name: 'Torneo Semanal de P&L', description: 'Genera el mayor profit en 7 días de trading simulado', type: 'pnl', status: 'active', prizePool: '1 mes Premium + Badge exclusivo', participants: 234, maxParticipants: 500, startDate: '2026-03-22', endDate: '2026-03-29', entryFee: 'Gratis', myRank: 12, myScore: 1850, topPlayers: [{ alias: 'AlphaTrader', score: '$4,250', country: '🇪🇸' }, { alias: 'ForexKing', score: '$3,890', country: '🇺🇸' }, { alias: 'PipMaster', score: '$3,100', country: '🇬🇧' }], rules: ['Capital inicial: $10,000 simulados', 'Máx 2% riesgo por trade', 'Solo pares principales'], tier: 'free' },
  { id: '2', name: 'Challenge Win Rate 70%', description: 'Mantén un win rate superior al 70% durante 50 trades', type: 'winrate', status: 'active', prizePool: '3 meses Premium', participants: 89, maxParticipants: 200, startDate: '2026-03-20', endDate: '2026-04-03', entryFee: 'Gratis', myRank: 5, myScore: 73, topPlayers: [{ alias: 'ScalpQueen', score: '82%', country: '🇧🇷' }, { alias: 'SwingPro', score: '79%', country: '🇩🇪' }, { alias: 'YenSamurai', score: '76%', country: '🇯🇵' }], rules: ['Mínimo 50 trades', 'Sin martingala', 'Todos los pares'], tier: 'free' },
  { id: '3', name: 'Copa Consistencia', description: 'El trader más consistente gana: menor drawdown y profit estable', type: 'consistency', status: 'upcoming', prizePool: '6 meses Premium + Coaching 1:1', participants: 0, maxParticipants: 100, startDate: '2026-04-01', endDate: '2026-04-30', entryFee: 'Premium', topPlayers: [], rules: ['Max drawdown 5%', 'Mínimo 30 trades', 'Profit positivo cada semana'], tier: 'premium' },
  { id: '4', name: 'Speed Trading Sprint', description: 'Scalping challenge: más pips en 24 horas', type: 'speed', status: 'upcoming', prizePool: 'Badge Legendario + 1 mes Premium', participants: 0, maxParticipants: 300, startDate: '2026-04-05', endDate: '2026-04-06', entryFee: 'Gratis', topPlayers: [], rules: ['Solo scalping (< 15min por trade)', 'Todos los pares', '24 horas continuas'], tier: 'free' },
  { id: '5', name: 'Torneo Marzo Finalizado', description: 'Torneo mensual de marzo completado', type: 'pnl', status: 'ended', prizePool: '2 meses Premium', participants: 312, maxParticipants: 500, startDate: '2026-03-01', endDate: '2026-03-15', entryFee: 'Gratis', topPlayers: [{ alias: 'GoldHunter', score: '$5,800', country: '🇲🇽' }, { alias: 'CableCrusher', score: '$4,200', country: '🇦🇷' }, { alias: 'OilBaron', score: '$3,900', country: '🇸🇦' }], rules: [], tier: 'free' },
];

const TYPE_ICONS: Record<string, any> = { pnl: Trophy, winrate: Target, consistency: Shield, speed: Zap };
const TYPE_COLORS: Record<string, string> = { pnl: '45 95% 55%', winrate: '160 84% 39%', consistency: '210 80% 55%', speed: '0 84% 60%' };
const STATUS_CONFIG: Record<CompStatus, { label: string; color: string }> = {
  active: { label: '🟢 En curso', color: '160 84% 39%' },
  upcoming: { label: '🔜 Próximo', color: '210 80% 55%' },
  ended: { label: '✅ Finalizado', color: 'var(--muted-foreground)' },
};
const ACCENT = '45 95% 55%';

export default function TradingCompetitions() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | CompStatus>('all');
  const [joined, setJoined] = useState<Record<string, boolean>>({ '1': true, '2': true });

  const filtered = filter === 'all' ? COMPETITIONS : COMPETITIONS.filter(c => c.status === filter);
  const fireConfetti = useCallback(() => {
    const end = Date.now() + 600;
    const colors = ['#FFD700', '#FF6B35', '#00E676', '#00BCD4', '#E040FB'];
    (function frame() {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, []);

  const joinComp = (id: string) => {
    setJoined(prev => ({ ...prev, [id]: true }));
    toast({ title: '🎉 ¡Inscrito en la competencia!' });
    fireConfetti();
    if (navigator.vibrate) navigator.vibrate([50, 30, 80]);
  };
  const daysRemaining = (end: string) => Math.max(0, Math.ceil((new Date(end).getTime() - Date.now()) / 86400000));

  return (
    <PageShell>
      <Header />

      <main className="container py-3 max-w-lg mx-auto px-3 space-y-4">
        <ToolPageHeader
          icon={<Swords className="w-5 h-5" style={{ color: `hsl(${ACCENT})` }} />}
          title={t('drawer_competitions') || 'Competencias'}
          subtitle="Torneos de trading y desafíos competitivos"
          accent={ACCENT}
        />

      <div className="space-y-4 pb-24">
        {/* Stats */}
        <motion.div className="grid grid-cols-3 gap-2"
          initial="hidden" animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
        >
          {[
            { label: 'Activas', value: Object.values(joined).filter(Boolean).length, icon: Swords, color: '45 95% 55%' },
            { label: 'Top 10', value: 2, icon: Medal, color: '160 84% 39%' },
            { label: 'Ganados', value: 0, icon: Trophy, color: '270 70% 60%' },
          ].map(s => (
            <motion.div key={s.label}
              variants={{ hidden: { opacity: 0, scale: 0.85, y: 12 }, visible: { opacity: 1, scale: 1, y: 0 } }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
            <GlowSection color={s.color}>
              <div className="p-3 text-center">
                <div className="w-7 h-7 mx-auto mb-1.5 rounded-lg flex items-center justify-center" style={{
                  background: `hsl(${s.color} / 0.15)`,
                  boxShadow: `0 0 10px hsl(${s.color} / 0.1)`,
                }}>
                  <s.icon className="w-4 h-4" style={{ color: `hsl(${s.color})` }} />
                </div>
                <div className="text-lg font-bold text-foreground">{s.value}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</div>
              </div>
            </GlowSection>
            </motion.div>
          ))}
        </motion.div>

        {/* Filter — glassmorphic */}
        <div className="flex rounded-xl p-1" style={{
          background: 'hsl(var(--card) / 0.6)',
          border: '1px solid hsl(var(--border) / 0.15)',
          backdropFilter: 'blur(8px)',
        }}>
          {([['all', 'Todos'], ['active', 'Activos'], ['upcoming', 'Próximos'], ['ended', 'Finalizados']] as const).map(([key, label]) => (
            <button key={key}
              className="flex-1 py-2 text-[11px] font-semibold rounded-lg transition-all"
              style={filter === key ? {
                background: `linear-gradient(165deg, hsl(${ACCENT}), hsl(${ACCENT} / 0.8))`,
                color: 'hsl(var(--primary-foreground))',
                boxShadow: `0 2px 10px hsl(${ACCENT} / 0.3)`,
              } : { color: 'hsl(var(--muted-foreground))' }}
              onClick={() => setFilter(key)}
            >{label}</button>
          ))}
        </div>

        {/* Competition cards */}
        <motion.div className="space-y-3"
          initial="hidden" animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.25 } } }}
        >
          {filtered.map((comp) => {
            const Icon = TYPE_ICONS[comp.type];
            const typeColor = TYPE_COLORS[comp.type];
            const statusCfg = STATUS_CONFIG[comp.status];
            const days = daysRemaining(comp.endDate);
            const fillPct = (comp.participants / comp.maxParticipants) * 100;

            return (
              <motion.div key={comp.id}
                variants={{ hidden: { opacity: 0, y: 20, scale: 0.97 }, visible: { opacity: 1, y: 0, scale: 1 } }}
                transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              >
                <GlowSection color={typeColor}>
                  <div className="p-4 space-y-3" style={{ borderLeft: `3px solid hsl(${typeColor})` }}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{
                          background: `hsl(${typeColor} / 0.15)`,
                          boxShadow: `0 0 10px hsl(${typeColor} / 0.1)`,
                        }}>
                          <Icon className="w-4 h-4" style={{ color: `hsl(${typeColor})` }} />
                        </div>
                        <div>
                          <div className="text-sm font-bold leading-tight text-foreground">{comp.name}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{comp.description}</div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[9px] shrink-0 font-semibold" style={{
                        borderColor: `hsl(${statusCfg.color} / 0.4)`,
                        color: `hsl(${statusCfg.color})`,
                        background: `hsl(${statusCfg.color} / 0.1)`,
                      }}>{statusCfg.label}</Badge>
                    </div>

                    <div className="flex items-center gap-2 text-xs rounded-lg px-2.5 py-1.5" style={{
                      background: `hsl(${ACCENT} / 0.06)`,
                      border: `1px solid hsl(${ACCENT} / 0.1)`,
                      color: `hsl(${ACCENT})`,
                    }}>
                      <Gift className="w-3.5 h-3.5" /> <span className="font-semibold">{comp.prizePool}</span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {comp.participants}/{comp.maxParticipants}</span>
                      {comp.status === 'active' && <span className="flex items-center gap-1"><Timer className="w-3 h-3" /> {days}d restantes</span>}
                      {comp.status === 'upcoming' && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Inicia {comp.startDate}</span>}
                      <span>{comp.entryFee === 'Gratis' ? '🆓 Gratis' : `🔒 ${comp.entryFee}`}</span>
                    </div>

                    <Progress value={fillPct} className="h-1.5" />

                    {comp.myRank && joined[comp.id] && (
                      <div className="flex items-center justify-between p-2.5 rounded-xl" style={{
                        background: `linear-gradient(165deg, hsl(${typeColor} / 0.08), hsl(var(--background) / 0.4))`,
                        border: `1px solid hsl(${typeColor} / 0.15)`,
                      }}>
                        <span className="text-xs text-foreground font-medium">Tu posición</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs font-bold" style={{
                            borderColor: `hsl(${typeColor} / 0.3)`, color: `hsl(${typeColor})`,
                          }}>#{comp.myRank}</Badge>
                          <span className="text-xs font-bold" style={{ color: 'hsl(160 84% 39%)' }}>
                            {comp.type === 'pnl' && `$${comp.myScore?.toLocaleString()}`}
                            {comp.type === 'winrate' && `${comp.myScore}%`}
                          </span>
                        </div>
                      </div>
                    )}

                    {comp.topPlayers.length > 0 && (
                      <div className="space-y-1 rounded-xl p-2" style={{
                        background: 'hsl(var(--background) / 0.3)',
                        border: '1px solid hsl(var(--border) / 0.1)',
                      }}>
                        {comp.topPlayers.map((p, pi) => (
                          <div key={pi} className="flex items-center justify-between text-xs py-1 px-1">
                            <div className="flex items-center gap-2">
                              <span className="w-5 text-center">{pi === 0 ? '🥇' : pi === 1 ? '🥈' : '🥉'}</span>
                              <span className="text-foreground font-medium">{p.alias}</span>
                              <span className="text-[10px]">{p.country}</span>
                            </div>
                            <span className="font-bold font-mono" style={{ color: `hsl(${typeColor})` }}>{p.score}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {comp.rules.length > 0 && (
                      <div className="text-[10px] text-muted-foreground space-y-0.5 border-t pt-2" style={{ borderColor: `hsl(${typeColor} / 0.1)` }}>
                        {comp.rules.map((r, ri) => (
                          <div key={ri} className="flex items-center gap-1">
                            <span style={{ color: `hsl(${typeColor})` }}>•</span> {r}
                          </div>
                        ))}
                      </div>
                    )}

                    {comp.status !== 'ended' && (
                      <button
                        className="w-full flex items-center justify-center gap-1 h-9 text-xs font-bold rounded-xl transition-all active:scale-[0.97]"
                        onClick={() => !joined[comp.id] && joinComp(comp.id)}
                        disabled={joined[comp.id]}
                        style={joined[comp.id] ? {
                          background: 'hsl(var(--muted) / 0.5)',
                          color: 'hsl(var(--muted-foreground))',
                          border: '1px solid hsl(var(--border) / 0.15)',
                        } : {
                          background: `linear-gradient(165deg, hsl(${typeColor}), hsl(${typeColor} / 0.8))`,
                          border: `1px solid hsl(${typeColor} / 0.5)`,
                          boxShadow: `0 0 15px hsl(${typeColor} / 0.2)`,
                          color: 'white',
                        }}>
                        {joined[comp.id] ? <><CheckCircle2 className="w-3 h-3" /> Inscrito</> : comp.tier === 'premium' ? <><Lock className="w-3 h-3" /> Inscribirse (Premium)</> : <><Swords className="w-3 h-3" /> Participar</>}
                      </button>
                    )}
                  </div>
                </GlowSection>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
      </main>
    </PageShell>
  );
}
