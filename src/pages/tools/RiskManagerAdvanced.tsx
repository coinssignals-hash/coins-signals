import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';

import { ToolCard, ToolPageHeader } from '@/components/tools/ToolCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ArrowLeft, Shield, Plus, Trash2, AlertTriangle, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTranslation } from '@/i18n/LanguageContext';

interface Account {
  id: string;
  name: string;
  balance: number;
  maxRiskPercent: number;
  openPositions: Position[];
}

interface Position {
  id: string;
  pair: string;
  lots: number;
  direction: 'buy' | 'sell';
  entryPrice: number;
  stopLoss: number;
  currentPrice: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(142 71% 45%)', 'hsl(38 92% 50%)', 'hsl(0 84% 60%)'];
const SAMPLE_PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD', 'USD/CHF', 'AUD/USD'];

function generateSamplePositions(): Position[] {
  const count = Math.floor(Math.random() * 3) + 1;
  return Array.from({ length: count }, (_, i) => {
    const pair = SAMPLE_PAIRS[Math.floor(Math.random() * SAMPLE_PAIRS.length)];
    const dir = Math.random() > 0.5 ? 'buy' : 'sell' as const;
    const entry = pair.includes('JPY') ? 145 + Math.random() * 5 : 1 + Math.random() * 0.5;
    const sl = dir === 'buy' ? entry * 0.99 : entry * 1.01;
    const curr = entry * (1 + (Math.random() - 0.5) * 0.02);
    return {
      id: `pos-${i}-${Date.now()}`,
      pair,
      lots: +(Math.random() * 2 + 0.1).toFixed(2),
      direction: dir,
      entryPrice: +entry.toFixed(pair.includes('JPY') ? 3 : 5),
      stopLoss: +sl.toFixed(pair.includes('JPY') ? 3 : 5),
      currentPrice: +curr.toFixed(pair.includes('JPY') ? 3 : 5),
    };
  });
}

const ACCENT = '340 85% 60%';

export default function RiskManagerAdvanced() {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<Account[]>([
    { id: '1', name: t('rm_main_account'), balance: 25000, maxRiskPercent: 2, openPositions: generateSamplePositions() },
    { id: '2', name: t('rm_demo_account'), balance: 50000, maxRiskPercent: 3, openPositions: generateSamplePositions() },
  ]);
  const [dailyMaxLoss, setDailyMaxLoss] = useState(5);
  const [weeklyMaxLoss, setWeeklyMaxLoss] = useState(10);

  const addAccount = () => {
    setAccounts(prev => [...prev, {
      id: Date.now().toString(),
      name: `${t('tp_account')} ${prev.length + 1}`,
      balance: 10000,
      maxRiskPercent: 2,
      openPositions: generateSamplePositions(),
    }]);
  };

  const removeAccount = (id: string) => setAccounts(prev => prev.filter(a => a.id !== id));

  const updateAccount = (id: string, field: keyof Account, value: string | number) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const totalRiskAtSL = accounts.reduce((s, a) => {
    return s + a.openPositions.reduce((ps, p) => {
      const risk = Math.abs(p.entryPrice - p.stopLoss) * p.lots * 100000;
      return ps + risk;
    }, 0);
  }, 0);
  const riskPercent = totalBalance > 0 ? (totalRiskAtSL / totalBalance) * 100 : 0;

  const exposureByPair = accounts.flatMap(a => a.openPositions).reduce<Record<string, number>>((acc, p) => {
    const val = Math.abs(p.currentPrice - p.entryPrice) * p.lots * 100000;
    acc[p.pair] = (acc[p.pair] || 0) + val;
    return acc;
  }, {});
  const pieData = Object.entries(exposureByPair).map(([name, value]) => ({ name, value: +value.toFixed(0) }));

  const alerts: string[] = [];
  if (riskPercent > dailyMaxLoss) alerts.push(`⚠️ ${t('tp_risk_pct')} (${riskPercent.toFixed(1)}%) > ${t('tp_max_daily_loss')} (${dailyMaxLoss}%)`);
  accounts.forEach(a => {
    const accRisk = a.openPositions.reduce((s, p) => s + Math.abs(p.entryPrice - p.stopLoss) * p.lots * 100000, 0);
    const accRiskPct = a.balance > 0 ? (accRisk / a.balance) * 100 : 0;
    if (accRiskPct > a.maxRiskPercent * 2) {
      alerts.push(`🔴 ${a.name}: ${t('tp_risk_pct')} ${accRiskPct.toFixed(1)}% > ${a.maxRiskPercent * 2}%`);
    }
  });

  return (
    <PageShell>
      <Header />
      <main className="container py-3 max-w-lg mx-auto px-3 space-y-3">
        <div className="flex items-center justify-between">
        <ToolPageHeader
          icon={<Shield className="w-5 h-5" style={{ color: `hsl(${ACCENT})` }} />}
          title={t('rm_title')}
          accent={ACCENT}
        />
          <Button variant="outline" size="sm" onClick={addAccount} className="gap-1 text-xs">
            <Plus className="w-3 h-3" /> {t('tp_account')}
          </Button>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="rounded-xl overflow-hidden" style={{ background: "hsl(0 70% 50% / 0.08)", border: "1px solid hsl(0 70% 50% / 0.25)" }}>
            <div className="p-3 space-y-1">
              {alerts.map((a, i) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-xs text-destructive">{a}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Global Limits */}
        <ToolCard accent={ACCENT}>
          <div className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">{t('tp_global_limits')}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">{t('tp_max_daily_loss')}</Label>
                <Input type="number" step="0.5" value={dailyMaxLoss} onChange={e => setDailyMaxLoss(+e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">{t('tp_max_weekly_loss')}</Label>
                <Input type="number" step="0.5" value={weeklyMaxLoss} onChange={e => setWeeklyMaxLoss(+e.target.value)} className="mt-1" />
              </div>
            </div>
          </div>
        </ToolCard>

        {/* Overview Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: t('tp_total_balance'), value: `$${totalBalance.toLocaleString()}`, color: 'text-foreground' },
            { label: t('tp_risk_at_sl'), value: `$${totalRiskAtSL.toFixed(0)}`, color: riskPercent > dailyMaxLoss ? 'text-destructive' : 'text-emerald-400' },
            { label: t('tp_risk_pct'), value: `${riskPercent.toFixed(1)}%`, color: riskPercent > dailyMaxLoss ? 'text-destructive' : 'text-emerald-400' },
          ].map(s => (
            <div key={s.label} className="rounded-xl overflow-hidden" style={{ background: "hsl(var(--card) / 0.6)", border: "1px solid hsl(var(--border) / 0.5)" }}>
              <div className="p-3 text-center">
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
                <p className={cn('text-sm font-bold tabular-nums mt-1', s.color)}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Exposure Pie */}
        {pieData.length > 0 && (
          <ToolCard accent={ACCENT}>
            <div className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">{t('tp_exposure_by_pair')}</h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={55} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => `$${v}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ToolCard>
        )}

        {/* Account Cards */}
        {accounts.map(account => {
          const accRisk = account.openPositions.reduce((s, p) => s + Math.abs(p.entryPrice - p.stopLoss) * p.lots * 100000, 0);
          const accRiskPct = account.balance > 0 ? (accRisk / account.balance) * 100 : 0;
          return (
            <div key={account.id} className="rounded-xl overflow-hidden" style={{ background: "hsl(var(--card) / 0.6)", border: "1px solid hsl(var(--border) / 0.5)" }}>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Input
                    value={account.name}
                    onChange={e => updateAccount(account.id, 'name', e.target.value)}
                    className="h-7 text-sm font-semibold w-40 border-none p-0 bg-transparent"
                  />
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => removeAccount(account.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[9px] text-muted-foreground">{t('tp_balance')}</p>
                    <Input type="number" value={account.balance} onChange={e => updateAccount(account.id, 'balance', +e.target.value)} className="h-7 text-xs text-center mt-0.5" />
                  </div>
                  <div>
                    <p className="text-[9px] text-muted-foreground">{t('tp_max_risk')}</p>
                    <Input type="number" step="0.5" value={account.maxRiskPercent} onChange={e => updateAccount(account.id, 'maxRiskPercent', +e.target.value)} className="h-7 text-xs text-center mt-0.5" />
                  </div>
                  <div>
                    <p className="text-[9px] text-muted-foreground">{t('tp_current_risk')}</p>
                    <p className={cn('text-sm font-bold tabular-nums mt-1.5', accRiskPct > account.maxRiskPercent * 2 ? 'text-destructive' : 'text-emerald-400')}>
                      {accRiskPct.toFixed(1)}%
                    </p>
                  </div>
                </div>
                {account.openPositions.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground font-medium">{t('tp_open_positions')}</p>
                    {account.openPositions.map(pos => {
                      const pnl = pos.direction === 'buy'
                        ? (pos.currentPrice - pos.entryPrice) * pos.lots * 100000
                        : (pos.entryPrice - pos.currentPrice) * pos.lots * 100000;
                      return (
                        <div key={pos.id} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
                          <div className="flex items-center gap-2">
                            {pos.direction === 'buy' ? <TrendingUp className="w-3 h-3 text-emerald-400" /> : <TrendingDown className="w-3 h-3 text-rose-400" />}
                            <span className="text-xs font-medium text-foreground">{pos.pair}</span>
                            <span className="text-[9px] text-muted-foreground">{pos.lots}L</span>
                          </div>
                          <span className={cn('text-xs font-bold tabular-nums', pnl >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                            {pnl >= 0 ? '+' : ''}{pnl.toFixed(0)}$
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <ToolCard accent={ACCENT}>
          <div className="p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {t('tp_risk_manager_info')}
              </p>
            </div>
          </div>
        </ToolCard>
      </main>
    </PageShell>
  );
}
