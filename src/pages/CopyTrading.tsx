import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { useTranslation } from '@/i18n/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import {
  Copy, Users, TrendingUp, Shield, Star, Zap, Eye, EyeOff,
  DollarSign, Percent, Clock, ChevronRight, CheckCircle2, XCircle
} from 'lucide-react';

interface TopTrader {
  id: string;
  alias: string;
  avatar: string;
  country: string;
  pnl30d: number;
  winRate: number;
  trades30d: number;
  followers: number;
  maxDrawdown: number;
  riskScore: 'low' | 'medium' | 'high';
  tier: string;
  equityData: { v: number }[];
  pairs: string[];
  avgHoldTime: string;
  copiers: number;
}

const generateEquity = () => {
  let v = 1000;
  return Array.from({ length: 30 }, () => {
    v += (Math.random() - 0.35) * 40;
    return { v: +v.toFixed(0) };
  });
};

const TRADERS: TopTrader[] = [
  { id: '1', alias: 'AlphaTrader', avatar: 'AT', country: '🇪🇸', pnl30d: 4250, winRate: 72, trades30d: 45, followers: 489, maxDrawdown: 8.2, riskScore: 'low', tier: 'diamond', equityData: generateEquity(), pairs: ['EUR/USD', 'GBP/USD'], avgHoldTime: '4h', copiers: 156 },
  { id: '2', alias: 'ForexKing', avatar: 'FK', country: '🇺🇸', pnl30d: 3890, winRate: 68, trades30d: 62, followers: 412, maxDrawdown: 12.1, riskScore: 'medium', tier: 'gold', equityData: generateEquity(), pairs: ['XAU/USD', 'USD/JPY'], avgHoldTime: '2h', copiers: 98 },
  { id: '3', alias: 'PipMaster', avatar: 'PM', country: '🇬🇧', pnl30d: 3100, winRate: 65, trades30d: 78, followers: 321, maxDrawdown: 15.5, riskScore: 'medium', tier: 'gold', equityData: generateEquity(), pairs: ['EUR/USD', 'AUD/USD'], avgHoldTime: '6h', copiers: 67 },
  { id: '4', alias: 'ScalpQueen', avatar: 'SQ', country: '🇧🇷', pnl30d: 2800, winRate: 71, trades30d: 120, followers: 256, maxDrawdown: 6.3, riskScore: 'low', tier: 'diamond', equityData: generateEquity(), pairs: ['EUR/USD', 'GBP/JPY'], avgHoldTime: '15m', copiers: 203 },
  { id: '5', alias: 'SwingPro', avatar: 'SP', country: '🇩🇪', pnl30d: 2400, winRate: 62, trades30d: 22, followers: 189, maxDrawdown: 18.7, riskScore: 'high', tier: 'silver', equityData: generateEquity(), pairs: ['USD/CHF', 'NZD/USD'], avgHoldTime: '2d', copiers: 34 },
  { id: '6', alias: 'GoldHunter', avatar: 'GH', country: '🇲🇽', pnl30d: 2100, winRate: 59, trades30d: 38, followers: 145, maxDrawdown: 14.0, riskScore: 'medium', tier: 'silver', equityData: generateEquity(), pairs: ['XAU/USD'], avgHoldTime: '8h', copiers: 45 },
];

const RISK_COLORS: Record<string, string> = { low: 'text-emerald-400', medium: 'text-amber-400', high: 'text-red-400' };
const RISK_LABELS: Record<string, string> = { low: 'Bajo', medium: 'Medio', high: 'Alto' };

export default function CopyTrading() {
  const { t } = useTranslation();
  const [following, setFollowing] = useState<Record<string, boolean>>({});
  const [copyConfig, setCopyConfig] = useState<string | null>(null);
  const [allocation, setAllocation] = useState('500');
  const [maxRisk, setMaxRisk] = useState('2');

  const toggleFollow = (id: string) => {
    setFollowing(prev => {
      const next = { ...prev, [id]: !prev[id] };
      toast({ title: next[id] ? '✅ Siguiendo trader' : '❌ Dejaste de seguir' });
      return next;
    });
  };

  const startCopying = (traderId: string) => {
    setFollowing(prev => ({ ...prev, [traderId]: true }));
    setCopyConfig(null);
    toast({ title: '🚀 Copy Trading activado', description: `Copiando con $${allocation} y ${maxRisk}% máx riesgo` });
  };

  const followingCount = Object.values(following).filter(Boolean).length;

  return (
    <PageShell>
      <div className="space-y-4 pb-24">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="bg-card/80"><CardContent className="p-3 text-center">
            <Users className="w-5 h-5 mx-auto mb-1 text-blue-400" />
            <div className="text-lg font-bold">{followingCount}</div>
            <div className="text-[10px] text-muted-foreground">Siguiendo</div>
          </CardContent></Card>
          <Card className="bg-card/80"><CardContent className="p-3 text-center">
            <Copy className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
            <div className="text-lg font-bold">{followingCount > 0 ? '$' + (+allocation * followingCount) : '—'}</div>
            <div className="text-[10px] text-muted-foreground">Asignado</div>
          </CardContent></Card>
          <Card className="bg-card/80"><CardContent className="p-3 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-amber-400" />
            <div className="text-lg font-bold">{followingCount > 0 ? '+$0' : '—'}</div>
            <div className="text-[10px] text-muted-foreground">P&L Copia</div>
          </CardContent></Card>
        </div>

        {/* Trader cards */}
        <div className="space-y-3">
          {TRADERS.map((trader, i) => (
            <motion.div
              key={trader.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Card className={`bg-card/70 backdrop-blur border ${following[trader.id] ? 'border-emerald-500/40' : 'border-border/40'} transition-colors`}>
                <CardContent className="p-3 space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="text-xs font-bold bg-primary/10">{trader.avatar}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold">{trader.alias}</span>
                          <span className="text-xs">{trader.country}</span>
                          <Badge variant="outline" className="text-[9px] px-1 py-0">{trader.tier}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span><Users className="w-2.5 h-2.5 inline" /> {trader.copiers} copian</span>
                          <span>· {trader.pairs.join(', ')}</span>
                        </div>
                      </div>
                    </div>
                    {following[trader.id] && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                  </div>

                  {/* Mini equity chart */}
                  <div className="h-12">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trader.equityData}>
                        <defs>
                          <linearGradient id={`cg${trader.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={trader.pnl30d > 0 ? 'hsl(160,84%,39%)' : 'hsl(0,84%,60%)'} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={trader.pnl30d > 0 ? 'hsl(160,84%,39%)' : 'hsl(0,84%,60%)'} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="v" stroke={trader.pnl30d > 0 ? 'hsl(160,84%,39%)' : 'hsl(0,84%,60%)'} fill={`url(#cg${trader.id})`} strokeWidth={1.5} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { label: 'P&L 30d', value: `$${trader.pnl30d.toLocaleString()}`, color: 'text-emerald-400' },
                      { label: 'Win Rate', value: `${trader.winRate}%`, color: '' },
                      { label: 'Max DD', value: `${trader.maxDrawdown}%`, color: 'text-red-400' },
                      { label: 'Riesgo', value: RISK_LABELS[trader.riskScore], color: RISK_COLORS[trader.riskScore] },
                    ].map(s => (
                      <div key={s.label} className="text-center">
                        <div className="text-[9px] text-muted-foreground">{s.label}</div>
                        <div className={`text-xs font-bold ${s.color}`}>{s.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => toggleFollow(trader.id)}>
                      {following[trader.id] ? <><EyeOff className="w-3 h-3 mr-1" /> Dejar</> : <><Eye className="w-3 h-3 mr-1" /> Seguir</>}
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 h-8 text-xs bg-gradient-to-r from-emerald-600 to-cyan-600"
                      onClick={() => setCopyConfig(copyConfig === trader.id ? null : trader.id)}
                    >
                      <Copy className="w-3 h-3 mr-1" /> Copiar
                    </Button>
                  </div>

                  {/* Copy config */}
                  <AnimatePresence>
                    {copyConfig === trader.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="pt-2 space-y-2 border-t border-border/30">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-muted-foreground flex items-center gap-1"><DollarSign className="w-3 h-3" /> Asignación</label>
                              <Input type="number" value={allocation} onChange={e => setAllocation(e.target.value)} className="h-8 text-xs" />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground flex items-center gap-1"><Percent className="w-3 h-3" /> Riesgo máx</label>
                              <Input type="number" value={maxRisk} onChange={e => setMaxRisk(e.target.value)} className="h-8 text-xs" />
                            </div>
                          </div>
                          <Button size="sm" className="w-full h-8 text-xs" onClick={() => startCopying(trader.id)}>
                            <Zap className="w-3 h-3 mr-1" /> Activar Copy Trading
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
