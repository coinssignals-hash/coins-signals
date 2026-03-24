import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { useTranslation } from '@/i18n/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import {
  Trophy, Swords, Clock, Users, Gift, Star, Flame, Target,
  Medal, Crown, Timer, ChevronRight, Zap, Lock
} from 'lucide-react';

type CompStatus = 'active' | 'upcoming' | 'ended';

interface Competition {
  id: string;
  name: string;
  description: string;
  type: 'pnl' | 'winrate' | 'consistency' | 'speed';
  status: CompStatus;
  prizePool: string;
  participants: number;
  maxParticipants: number;
  startDate: string;
  endDate: string;
  entryFee: string;
  myRank?: number;
  myScore?: number;
  topPlayers: { alias: string; score: string; country: string }[];
  rules: string[];
  tier: 'free' | 'premium';
}

const COMPETITIONS: Competition[] = [
  {
    id: '1', name: 'Torneo Semanal de P&L', description: 'Genera el mayor profit en 7 días de trading simulado',
    type: 'pnl', status: 'active', prizePool: '1 mes Premium + Badge exclusivo',
    participants: 234, maxParticipants: 500, startDate: '2026-03-22', endDate: '2026-03-29',
    entryFee: 'Gratis', myRank: 12, myScore: 1850,
    topPlayers: [
      { alias: 'AlphaTrader', score: '$4,250', country: '🇪🇸' },
      { alias: 'ForexKing', score: '$3,890', country: '🇺🇸' },
      { alias: 'PipMaster', score: '$3,100', country: '🇬🇧' },
    ],
    rules: ['Capital inicial: $10,000 simulados', 'Máx 2% riesgo por trade', 'Solo pares principales'],
    tier: 'free',
  },
  {
    id: '2', name: 'Challenge Win Rate 70%', description: 'Mantén un win rate superior al 70% durante 50 trades',
    type: 'winrate', status: 'active', prizePool: '3 meses Premium',
    participants: 89, maxParticipants: 200, startDate: '2026-03-20', endDate: '2026-04-03',
    entryFee: 'Gratis', myRank: 5, myScore: 73,
    topPlayers: [
      { alias: 'ScalpQueen', score: '82%', country: '🇧🇷' },
      { alias: 'SwingPro', score: '79%', country: '🇩🇪' },
      { alias: 'YenSamurai', score: '76%', country: '🇯🇵' },
    ],
    rules: ['Mínimo 50 trades', 'Sin martingala', 'Todos los pares'],
    tier: 'free',
  },
  {
    id: '3', name: 'Copa Consistencia', description: 'El trader más consistente gana: menor drawdown y profit estable',
    type: 'consistency', status: 'upcoming', prizePool: '6 meses Premium + Coaching 1:1',
    participants: 0, maxParticipants: 100, startDate: '2026-04-01', endDate: '2026-04-30',
    entryFee: 'Premium', topPlayers: [],
    rules: ['Max drawdown 5%', 'Mínimo 30 trades', 'Profit positivo cada semana'],
    tier: 'premium',
  },
  {
    id: '4', name: 'Speed Trading Sprint', description: 'Scalping challenge: más pips en 24 horas',
    type: 'speed', status: 'upcoming', prizePool: 'Badge Legendario + 1 mes Premium',
    participants: 0, maxParticipants: 300, startDate: '2026-04-05', endDate: '2026-04-06',
    entryFee: 'Gratis', topPlayers: [],
    rules: ['Solo scalping (< 15min por trade)', 'Todos los pares', '24 horas continuas'],
    tier: 'free',
  },
  {
    id: '5', name: 'Torneo Marzo Finalizado', description: 'Torneo mensual de marzo completado',
    type: 'pnl', status: 'ended', prizePool: '2 meses Premium',
    participants: 312, maxParticipants: 500, startDate: '2026-03-01', endDate: '2026-03-15',
    entryFee: 'Gratis',
    topPlayers: [
      { alias: 'GoldHunter', score: '$5,800', country: '🇲🇽' },
      { alias: 'CableCrusher', score: '$4,200', country: '🇦🇷' },
      { alias: 'OilBaron', score: '$3,900', country: '🇸🇦' },
    ],
    rules: [], tier: 'free',
  },
];

const TYPE_ICONS: Record<string, any> = { pnl: Trophy, winrate: Target, consistency: Shield, speed: Zap };
const TYPE_COLORS: Record<string, string> = { pnl: 'text-amber-400', winrate: 'text-emerald-400', consistency: 'text-blue-400', speed: 'text-red-400' };
const STATUS_BADGES: Record<CompStatus, { label: string; class: string }> = {
  active: { label: '🟢 En curso', class: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  upcoming: { label: '🔜 Próximo', class: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  ended: { label: '✅ Finalizado', class: 'bg-muted text-muted-foreground border-border' },
};

export default function TradingCompetitions() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'all' | CompStatus>('all');
  const [joined, setJoined] = useState<Record<string, boolean>>({ '1': true, '2': true });

  const filtered = filter === 'all' ? COMPETITIONS : COMPETITIONS.filter(c => c.status === filter);

  const joinComp = (id: string) => {
    setJoined(prev => ({ ...prev, [id]: true }));
    toast({ title: '🎉 ¡Inscrito en la competencia!' });
  };

  const daysRemaining = (end: string) => {
    const diff = new Date(end).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86400000));
  };

  return (
    <PageShell>
      <div className="space-y-4 pb-24">
        {/* My stats */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="bg-card/80"><CardContent className="p-3 text-center">
            <Swords className="w-5 h-5 mx-auto mb-1 text-amber-400" />
            <div className="text-lg font-bold">{Object.values(joined).filter(Boolean).length}</div>
            <div className="text-[10px] text-muted-foreground">Activas</div>
          </CardContent></Card>
          <Card className="bg-card/80"><CardContent className="p-3 text-center">
            <Medal className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
            <div className="text-lg font-bold">2</div>
            <div className="text-[10px] text-muted-foreground">Top 10</div>
          </CardContent></Card>
          <Card className="bg-card/80"><CardContent className="p-3 text-center">
            <Trophy className="w-5 h-5 mx-auto mb-1 text-purple-400" />
            <div className="text-lg font-bold">0</div>
            <div className="text-[10px] text-muted-foreground">Ganados</div>
          </CardContent></Card>
        </div>

        {/* Filter */}
        <div className="flex bg-muted rounded-xl p-1">
          {([['all', 'Todos'], ['active', 'Activos'], ['upcoming', 'Próximos'], ['ended', 'Finalizados']] as const).map(([key, label]) => (
            <button
              key={key}
              className={`flex-1 py-2 text-[11px] font-semibold rounded-lg transition-all ${filter === key ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground'}`}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Competition cards */}
        <div className="space-y-3">
          {filtered.map((comp, i) => {
            const Icon = TYPE_ICONS[comp.type];
            const sb = STATUS_BADGES[comp.status];
            const days = daysRemaining(comp.endDate);
            const fillPct = (comp.participants / comp.maxParticipants) * 100;

            return (
              <motion.div
                key={comp.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Card className="bg-card/70 backdrop-blur border-border/40">
                  <CardContent className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-xl bg-background/60 ${TYPE_COLORS[comp.type]}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold leading-tight">{comp.name}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{comp.description}</div>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-[9px] shrink-0 ${sb.class}`}>{sb.label}</Badge>
                    </div>

                    {/* Prize & timing */}
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1 text-amber-400"><Gift className="w-3 h-3" /> {comp.prizePool}</span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {comp.participants}/{comp.maxParticipants}</span>
                      {comp.status === 'active' && <span className="flex items-center gap-1"><Timer className="w-3 h-3" /> {days}d restantes</span>}
                      {comp.status === 'upcoming' && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Inicia {comp.startDate}</span>}
                      <span>{comp.entryFee === 'Gratis' ? '🆓 Gratis' : `🔒 ${comp.entryFee}`}</span>
                    </div>

                    <Progress value={fillPct} className="h-1.5" />

                    {/* My rank */}
                    {comp.myRank && joined[comp.id] && (
                      <div className="flex items-center justify-between p-2 bg-primary/5 rounded-lg border border-primary/20">
                        <span className="text-xs">Tu posición</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">#{comp.myRank}</Badge>
                          <span className="text-xs font-bold text-emerald-400">
                            {comp.type === 'pnl' && `$${comp.myScore?.toLocaleString()}`}
                            {comp.type === 'winrate' && `${comp.myScore}%`}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Top players */}
                    {comp.topPlayers.length > 0 && (
                      <div className="space-y-1">
                        {comp.topPlayers.map((p, pi) => (
                          <div key={pi} className="flex items-center justify-between text-xs py-1">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground w-4">{pi === 0 ? '🥇' : pi === 1 ? '🥈' : '🥉'}</span>
                              <span>{p.alias}</span>
                              <span className="text-[10px]">{p.country}</span>
                            </div>
                            <span className="font-bold font-mono">{p.score}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Rules (expandable) */}
                    {comp.rules.length > 0 && (
                      <div className="text-[10px] text-muted-foreground space-y-0.5 border-t border-border/30 pt-2">
                        {comp.rules.map((r, ri) => (
                          <div key={ri} className="flex items-center gap-1">
                            <span className="text-primary">•</span> {r}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action */}
                    {comp.status !== 'ended' && (
                      <Button
                        className={`w-full h-9 text-xs ${joined[comp.id] ? 'bg-muted text-muted-foreground' : 'bg-gradient-to-r from-amber-600 to-orange-600'}`}
                        onClick={() => !joined[comp.id] && joinComp(comp.id)}
                        disabled={joined[comp.id]}
                      >
                        {joined[comp.id] ? (
                          <><CheckCircle2 className="w-3 h-3 mr-1" /> Inscrito</>
                        ) : comp.tier === 'premium' ? (
                          <><Lock className="w-3 h-3 mr-1" /> Inscribirse (Premium)</>
                        ) : (
                          <><Swords className="w-3 h-3 mr-1" /> Participar</>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}
