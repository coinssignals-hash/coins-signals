import { useState, useMemo } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';

import { ToolCard, ToolPageHeader } from '@/components/tools/ToolCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { ArrowLeft, LineChart, TrendingUp, DollarSign, Calendar, Info, Percent } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useTranslation } from '@/i18n/LanguageContext';

const ACCENT = '142 70% 45%';

export default function CompoundInterestCalculator() {
  const { t } = useTranslation();
  const [initialBalance, setInitialBalance] = useState('10000');
  const [monthlyReturn, setMonthlyReturn] = useState('5');
  const [monthlyDeposit, setMonthlyDeposit] = useState('0');
  const [months, setMonths] = useState('12');
  const [withdrawalPercent, setWithdrawalPercent] = useState('0');

  const result = useMemo(() => {
    const balance = parseFloat(initialBalance) || 0;
    const retPct = parseFloat(monthlyReturn) || 0;
    const deposit = parseFloat(monthlyDeposit) || 0;
    const period = parseInt(months) || 0;
    const withdrawal = parseFloat(withdrawalPercent) || 0;
    if (balance <= 0 || period <= 0) return null;
    const chartData: { month: number; balance: number; deposited: number }[] = [];
    let current = balance;
    let totalDeposited = balance;
    chartData.push({ month: 0, balance: current, deposited: totalDeposited });
    for (let i = 1; i <= period; i++) {
      const gain = current * (retPct / 100);
      const withdrawAmount = current * (withdrawal / 100);
      current = current + gain + deposit - withdrawAmount;
      totalDeposited += deposit;
      chartData.push({ month: i, balance: Math.round(current * 100) / 100, deposited: totalDeposited });
    }
    const totalGain = current - totalDeposited;
    const totalReturnPct = totalDeposited > 0 ? ((current - totalDeposited) / totalDeposited) * 100 : 0;
    return { finalBalance: current.toFixed(2), totalGain: totalGain.toFixed(2), totalDeposited: totalDeposited.toFixed(2), totalReturnPct: totalReturnPct.toFixed(1), chartData };
  }, [initialBalance, monthlyReturn, monthlyDeposit, months, withdrawalPercent]);

  return (
    <PageShell>
      <Header />
      <main className="container py-3 max-w-lg mx-auto px-3 space-y-3">
        <div className="flex items-center gap-3">
          <Link to="/tools" className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 backdrop-blur-sm" style={{ background: "hsl(var(--card) / 0.85)", border: "1px solid hsl(var(--border) / 0.6)", boxShadow: "0 2px 8px hsl(0 0% 0% / 0.3)" }}>
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </Link>
          <div className="flex items-center gap-2">
            <LineChart className="w-5 h-5 " style={{ color: `hsl(${ACCENT})` }} />
            <h1 className="text-lg font-bold text-foreground">{t('ci_title')}</h1>
          </div>
        </div>

        <ToolCard accent={ACCENT}>
          <div className="p-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{t('tool_parameters')}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t('ci_initial_capital')}</Label>
                <Input type="number" value={initialBalance} onChange={e => setInitialBalance(e.target.value)} className="bg-secondary border-border text-foreground" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t('ci_monthly_return')}</Label>
                <Input type="number" step="0.5" value={monthlyReturn} onChange={e => setMonthlyReturn(e.target.value)} className="bg-secondary border-border text-foreground" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t('ci_monthly_deposit')}</Label>
                <Input type="number" value={monthlyDeposit} onChange={e => setMonthlyDeposit(e.target.value)} className="bg-secondary border-border text-foreground" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t('ci_months')}</Label>
                <Input type="number" min="1" max="120" value={months} onChange={e => setMonths(e.target.value)} className="bg-secondary border-border text-foreground" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t('ci_withdrawal')}</Label>
                <Input type="number" step="0.5" min="0" value={withdrawalPercent} onChange={e => setWithdrawalPercent(e.target.value)} className="bg-secondary border-border text-foreground" />
              </div>
            </div>
          </div>
        </ToolCard>

        {result && (
          <>
            <div className="rounded-xl overflow-hidden" style={{ background: "hsl(160 80% 45% / 0.06)", border: "1px solid hsl(160 80% 45% / 0.2)" }}>
              <div className="p-4 text-center space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{t('ci_final_balance')}</p>
                <p className="text-3xl font-bold text-emerald-400 tabular-nums">${Number(result.finalBalance).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {t('ci_total_return')}: <span className="text-emerald-400 font-semibold">{result.totalReturnPct}%</span>
                </p>
              </div>
            </div>

            <ToolCard accent={ACCENT}>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />{t('ci_growth_curve')}
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={result.chartData}>
                      <defs>
                        <linearGradient id="compoundGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="depositGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                        formatter={(val: number) => ['$' + val.toLocaleString()]}
                        labelFormatter={(l) => `${t('ci_month_label')} ${l}`}
                      />
                      <Area type="monotone" dataKey="deposited" stroke="hsl(var(--muted-foreground))" strokeWidth={1} fill="url(#depositGrad)" strokeDasharray="4 4" />
                      <Area type="monotone" dataKey="balance" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#compoundGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </ToolCard>

            <div className="grid grid-cols-3 gap-2">
              <ToolCard accent={ACCENT}>
                <div className="p-3 text-center">
                  <DollarSign className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                  <p className="text-[10px] text-muted-foreground">{t('ci_profit')}</p>
                  <p className="text-sm font-bold text-emerald-400 tabular-nums">${Number(result.totalGain).toLocaleString()}</p>
                </div>
              </ToolCard>
              <ToolCard accent={ACCENT}>
                <div className="p-3 text-center">
                  <Calendar className="w-4 h-4 mx-auto mb-1 text-primary" />
                  <p className="text-[10px] text-muted-foreground">{t('ci_deposited')}</p>
                  <p className="text-sm font-bold text-foreground tabular-nums">${Number(result.totalDeposited).toLocaleString()}</p>
                </div>
              </ToolCard>
              <ToolCard accent={ACCENT}>
                <div className="p-3 text-center">
                  <Percent className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                  <p className="text-[10px] text-muted-foreground">{t('ci_return')}</p>
                  <p className="text-sm font-bold text-amber-400 tabular-nums">{result.totalReturnPct}%</p>
                </div>
              </ToolCard>
            </div>
          </>
        )}

        <ToolCard accent={ACCENT}>
          <div className="p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">{t('ci_info_text')}</p>
            </div>
          </div>
        </ToolCard>
      </main>
    </PageShell>
  );
}
