import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { ToolPageHeader } from '@/components/tools/ToolCard';
import { useTranslation } from '@/i18n/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import {
  Copy, Users, TrendingUp, Eye, EyeOff,
  DollarSign, Percent, Zap, CheckCircle2
} from 'lucide-react';
import { GlowSection } from '@/components/ui/glow-section';
import { useNavigate } from 'react-router-dom';

interface TopTrader {
  id: string; alias: string; avatar: string; country: string;
  pnl30d: number; winRate: number; trades30d: number; followers: number;
  maxDrawdown: number; riskScore: 'low' | 'medium' | 'high'; tier: string;
  equityData: { v: number }[]; pairs: string[]; avgHoldTime: string; copiers: number;
}

const generateEquity = () => { let v = 1000; return Array.from({ length: 30 }, () => { v += (Math.random() - 0.35) * 40; return { v: +v.toFixed(0) }; }); };

const TRADERS: TopTrader[] = [
  { id: '1', alias: 'AlphaTrader', avatar: 'AT', country: '🇪🇸', pnl30d: 4250, winRate: 72, trades30d: 45, followers: 489, maxDrawdown: 8.2, riskScore: 'low', tier: 'diamond', equityData: generateEquity(), pairs: ['EUR/USD', 'GBP/USD'], avgHoldTime: '4h', copiers: 156 },
  { id: '2', alias: 'ForexKing', avatar: 'FK', country: '🇺🇸', pnl30d: 3890, winRate: 68, trades30d: 62, followers: 412, maxDrawdown: 12.1, riskScore: 'medium', tier: 'gold', equityData: generateEquity(), pairs: ['XAU/USD', 'USD/JPY'], avgHoldTime: '2h', copiers: 98 },
  { id: '3', alias: 'PipMaster', avatar: 'PM', country: '🇬🇧', pnl30d: 3100, winRate: 65, trades30d: 78, followers: 321, maxDrawdown: 15.5, riskScore: 'medium', tier: 'gold', equityData: generateEquity(), pairs: ['EUR/USD', 'AUD/USD'], avgHoldTime: '6h', copiers: 67 },
  { id: '4', alias: 'ScalpQueen', avatar: 'SQ', country: '🇧🇷', pnl30d: 2800, winRate: 71, trades30d: 120, followers: 256, maxDrawdown: 6.3, riskScore: 'low', tier: 'diamond', equityData: generateEquity(), pairs: ['EUR/USD', 'GBP/JPY'], avgHoldTime: '15m', copiers: 203 },
  { id: '5', alias: 'SwingPro', avatar: 'SP', country: '🇩🇪', pnl30d: 2400, winRate: 62, trades30d: 22, followers: 189, maxDrawdown: 18.7, riskScore: 'high', tier: 'silver', equityData: generateEquity(), pairs: ['USD/CHF', 'NZD/USD'], avgHoldTime: '2d', copiers: 34 },
  { id: '6', alias: 'GoldHunter', avatar: 'GH', country: '🇲🇽', pnl30d: 2100, winRate: 59, trades30d: 38, followers: 145, maxDrawdown: 14.0, riskScore: 'medium', tier: 'silver', equityData: generateEquity(), pairs: ['XAU/USD'], avgHoldTime: '8h', copiers: 45 },
];

const RISK_COLORS: Record<string, string> = { low: '160 84% 39%', medium: '45 95% 55%', high: '0 84% 60%' };
const RISK_LABELS: Record<string, string> = { low: 'Bajo', medium: 'Medio', high: 'Alto' };
const ACCENT = '190 90% 50%';

export default function CopyTrading() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [following, setFollowing] = useState<Record<string, boolean>>({});
  const [copyConfig, setCopyConfig] = useState<string | null>(null);
  const [allocation, setAllocation] = useState('500');
  const [maxRisk, setMaxRisk] = useState('2');

  const toggleFollow = (id: string) => {
    setFollowing(prev => { const next = { ...prev, [id]: !prev[id] }; toast({ title: next[id] ? '✅ Siguiendo trader' : '❌ Dejaste de seguir' }); return next; });
  };
  const startCopying = (traderId: string) => {
    setFollowing(prev => ({ ...prev, [traderId]: true }));
    setCopyConfig(null);
    toast({ title: '🚀 Copy Trading activado', description: `Copiando con $${allocation} y ${maxRisk}% máx riesgo` });
  };
  const followingCount = Object.values(following).filter(Boolean).length;

  return (
    <PageShell>
      <Header />

      {/* ── Premium Hero Header ── */}
      <div className="relative overflow-hidden" style={{
        background: `linear-gradient(165deg, hsl(${ACCENT} / 0.15) 0%, hsl(var(--background)) 50%)`,
      }}>
        <div className="absolute top-0 inset-x-0 h-[2px]" style={{
          background: `linear-gradient(90deg, transparent, hsl(${ACCENT} / 0.8), transparent)`,
        }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-40 rounded-full opacity-20 pointer-events-none" style={{
          background: `radial-gradient(circle, hsl(${ACCENT} / 0.5), transparent 70%)`,
        }} />

        <div className="relative px-4 py-5">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)}
              className="flex items-center justify-center w-8 h-8 rounded-xl transition-all active:scale-90"
              style={{ background: `hsl(${ACCENT} / 0.1)`, border: `1px solid hsl(${ACCENT} / 0.2)` }}>
              <ArrowLeft className="w-4 h-4" style={{ color: `hsl(${ACCENT})` }} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{
                background: `linear-gradient(165deg, hsl(${ACCENT} / 0.25), hsl(${ACCENT} / 0.08))`,
                border: `1px solid hsl(${ACCENT} / 0.3)`,
                boxShadow: `0 0 20px hsl(${ACCENT} / 0.15)`,
              }}>
                <Copy className="w-5 h-5" style={{ color: `hsl(${ACCENT})` }} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground tracking-tight">
                  {t('drawer_copy_trading') || 'Copy Trading'}
                </h1>
                <p className="text-[11px] text-muted-foreground">
                  Copia las estrategias de los mejores traders
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="h-px" style={{
          background: `linear-gradient(90deg, transparent, hsl(${ACCENT} / 0.3), transparent)`,
        }} />
      </div>

      <div className="max-w-lg mx-auto space-y-4 pb-24 px-4 pt-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Siguiendo', value: followingCount, icon: Users, color: '210 80% 55%' },
            { label: 'Asignado', value: followingCount > 0 ? '$' + (+allocation * followingCount) : '—', icon: Copy, color: '160 84% 39%' },
            { label: 'P&L Copia', value: followingCount > 0 ? '+$0' : '—', icon: TrendingUp, color: '45 95% 55%' },
          ].map(s => (
            <GlowSection key={s.label} color={s.color}>
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
          ))}
        </div>

        {/* Trader cards */}
        <div className="space-y-3">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
            <Users className="w-3.5 h-3.5" style={{ color: `hsl(${ACCENT})` }} />
            TOP TRADERS
          </h3>
          {TRADERS.map((trader, i) => {
            const isFollowing = following[trader.id];
            const riskColor = RISK_COLORS[trader.riskScore];
            return (
              <motion.div key={trader.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <GlowSection color={isFollowing ? '160 84% 39%' : ACCENT} style={{
                  borderColor: isFollowing ? `hsl(160 84% 39% / 0.35)` : undefined,
                }}>
                  <div className="relative p-3 space-y-3" style={{
                    borderLeft: isFollowing ? '3px solid hsl(160 84% 39%)' : `3px solid hsl(${ACCENT} / 0.3)`,
                  }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="text-xs font-bold" style={{ background: `hsl(${ACCENT} / 0.15)` }}>{trader.avatar}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-foreground">{trader.alias}</span>
                            <span className="text-xs">{trader.country}</span>
                            <Badge variant="outline" className="text-[9px] px-1 py-0 font-semibold" style={{
                              background: `hsl(${ACCENT} / 0.08)`,
                            }}>{trader.tier}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span><Users className="w-2.5 h-2.5 inline" /> {trader.copiers} copian</span>
                            <span>· {trader.pairs.join(', ')}</span>
                          </div>
                        </div>
                      </div>
                      {isFollowing && <CheckCircle2 className="w-5 h-5" style={{ color: 'hsl(160 84% 39%)' }} />}
                    </div>

                    <div className="h-12 rounded-lg overflow-hidden" style={{
                      background: 'hsl(var(--background) / 0.3)',
                    }}>
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

                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { label: 'P&L 30d', value: `$${trader.pnl30d.toLocaleString()}`, color: '160 84% 39%' },
                        { label: 'Win Rate', value: `${trader.winRate}%`, color: '' },
                        { label: 'Max DD', value: `${trader.maxDrawdown}%`, color: '0 84% 60%' },
                        { label: 'Riesgo', value: RISK_LABELS[trader.riskScore], color: riskColor },
                      ].map(s => (
                        <div key={s.label} className="text-center rounded-lg py-1" style={{
                          background: 'hsl(var(--background) / 0.3)',
                        }}>
                          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</div>
                          <div className="text-xs font-bold" style={s.color ? { color: `hsl(${s.color})` } : {}}>{s.value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => toggleFollow(trader.id)}
                        className="flex-1 flex items-center justify-center gap-1 h-8 text-[11px] font-semibold rounded-xl transition-all active:scale-[0.97]"
                        style={{
                          background: 'hsl(var(--card) / 0.6)',
                          border: '1px solid hsl(var(--border) / 0.2)',
                          backdropFilter: 'blur(8px)',
                          color: 'hsl(var(--foreground) / 0.8)',
                        }}>
                        {isFollowing ? <><EyeOff className="w-3 h-3" /> Dejar</> : <><Eye className="w-3 h-3" /> Seguir</>}
                      </button>
                      <button onClick={() => setCopyConfig(copyConfig === trader.id ? null : trader.id)}
                        className="flex-1 flex items-center justify-center gap-1 h-8 text-[11px] font-bold text-white rounded-xl transition-all active:scale-[0.97]"
                        style={{
                          background: `linear-gradient(165deg, hsl(160 84% 39%), hsl(${ACCENT}))`,
                          border: '1px solid hsl(160 84% 39% / 0.4)',
                          boxShadow: '0 0 12px hsl(160 84% 39% / 0.2)',
                        }}>
                        <Copy className="w-3 h-3" /> Copiar
                      </button>
                    </div>

                    <AnimatePresence>
                      {copyConfig === trader.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="pt-2 space-y-2 border-t" style={{ borderColor: `hsl(${ACCENT} / 0.15)` }}>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase tracking-wider"><DollarSign className="w-3 h-3" /> Asignación</label>
                                <Input type="number" value={allocation} onChange={e => setAllocation(e.target.value)} className="h-8 text-xs bg-background/40 border-border/30 mt-1" />
                              </div>
                              <div>
                                <label className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase tracking-wider"><Percent className="w-3 h-3" /> Riesgo máx</label>
                                <Input type="number" value={maxRisk} onChange={e => setMaxRisk(e.target.value)} className="h-8 text-xs bg-background/40 border-border/30 mt-1" />
                              </div>
                            </div>
                            <button onClick={() => startCopying(trader.id)}
                              className="w-full flex items-center justify-center gap-1 h-9 text-xs font-bold text-white rounded-xl transition-all active:scale-[0.97]"
                              style={{
                                background: `linear-gradient(165deg, hsl(${ACCENT}), hsl(${ACCENT} / 0.8))`,
                                border: `1px solid hsl(${ACCENT} / 0.4)`,
                                boxShadow: `0 0 15px hsl(${ACCENT} / 0.2)`,
                              }}>
                              <Zap className="w-3 h-3" /> Activar Copy Trading
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </GlowSection>
              </motion.div>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}
