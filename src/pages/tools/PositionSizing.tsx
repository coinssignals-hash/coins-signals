import { useState, useMemo } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ArrowLeft, Target, ShieldAlert, DollarSign, Layers, Info } from 'lucide-react';
import { useTranslation } from '@/i18n/LanguageContext';

const PAIRS = [
  { symbol: 'EUR/USD', pipSize: 0.0001, pipValuePerLot: 10 },
  { symbol: 'GBP/USD', pipSize: 0.0001, pipValuePerLot: 10 },
  { symbol: 'USD/JPY', pipSize: 0.01, pipValuePerLot: 6.7 },
  { symbol: 'USD/CHF', pipSize: 0.0001, pipValuePerLot: 10 },
  { symbol: 'AUD/USD', pipSize: 0.0001, pipValuePerLot: 10 },
  { symbol: 'NZD/USD', pipSize: 0.0001, pipValuePerLot: 10 },
  { symbol: 'USD/CAD', pipSize: 0.0001, pipValuePerLot: 7.5 },
  { symbol: 'EUR/GBP', pipSize: 0.0001, pipValuePerLot: 12.7 },
  { symbol: 'EUR/JPY', pipSize: 0.01, pipValuePerLot: 6.7 },
  { symbol: 'GBP/JPY', pipSize: 0.01, pipValuePerLot: 6.7 },
  { symbol: 'XAU/USD', pipSize: 0.01, pipValuePerLot: 1 },
];

export default function PositionSizing() {
  const { t } = useTranslation();
  const [pair, setPair] = useState('EUR/USD');
  const [accountBalance, setAccountBalance] = useState('10000');
  const [riskPercent, setRiskPercent] = useState('2');
  const [stopLossPips, setStopLossPips] = useState('30');

  const result = useMemo(() => {
    const balance = parseFloat(accountBalance);
    const riskPct = parseFloat(riskPercent);
    const slPips = parseFloat(stopLossPips);
    const pairData = PAIRS.find(p => p.symbol === pair);
    if (!balance || !riskPct || !slPips || !pairData || slPips <= 0) return null;
    const riskAmount = balance * (riskPct / 100);
    const pipValue = pairData.pipValuePerLot;
    const optimalLots = riskAmount / (slPips * pipValue);
    const riskLevel = riskPct <= 1 ? 'conservative' : riskPct <= 2 ? 'moderate' : riskPct <= 5 ? 'aggressive' : 'extreme';
    return {
      riskAmount: riskAmount.toFixed(2), standardLots: optimalLots.toFixed(2),
      miniLots: (optimalLots * 10).toFixed(2), microLots: (optimalLots * 100).toFixed(0),
      pipValue: pipValue.toFixed(2), maxLossPerPip: (riskAmount / slPips).toFixed(2), riskLevel,
    };
  }, [pair, accountBalance, riskPercent, stopLossPips]);

  const riskLevelConfig = {
    conservative: { label: t('ps_conservative'), color: 'text-emerald-400', bg: 'bg-emerald-500/15', desc: t('ps_conservative_desc') },
    moderate: { label: t('ps_moderate'), color: 'text-primary', bg: 'bg-primary/15', desc: t('ps_moderate_desc') },
    aggressive: { label: t('ps_aggressive'), color: 'text-amber-400', bg: 'bg-amber-500/15', desc: t('ps_aggressive_desc') },
    extreme: { label: t('ps_extreme'), color: 'text-rose-400', bg: 'bg-rose-500/15', desc: t('ps_extreme_desc') },
  };

  return (
    <PageShell>
      <Header />
      <main className="container py-6 space-y-5">
        <div className="flex items-center gap-3">
          <Link to="/tools" className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </Link>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground">{t('ps_title')}</h1>
          </div>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{t('tool_parameters')}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t('tool_currency_pair')}</Label>
                <Select value={pair} onValueChange={setPair}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{PAIRS.map(p => <SelectItem key={p.symbol} value={p.symbol}>{p.symbol}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t('rr_balance')}</Label>
                <Input type="number" value={accountBalance} onChange={e => setAccountBalance(e.target.value)} className="bg-secondary border-border text-foreground" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t('tool_risk_pct')}</Label>
                <Input type="number" step="0.5" min="0.1" max="100" value={riskPercent} onChange={e => setRiskPercent(e.target.value)} className="bg-secondary border-border text-foreground" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t('tool_stop_loss_pips')}</Label>
                <Input type="number" value={stopLossPips} onChange={e => setStopLossPips(e.target.value)} className="bg-secondary border-border text-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        {result && (
          <>
            {(() => {
              const cfg = riskLevelConfig[result.riskLevel as keyof typeof riskLevelConfig];
              return (
                <Card className={cn('border', cfg.bg, 'border-transparent')}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className={cn('w-4 h-4', cfg.color)} />
                      <div>
                        <p className={cn('text-sm font-bold', cfg.color)}>{cfg.label}</p>
                        <p className="text-[10px] text-muted-foreground">{cfg.desc}</p>
                      </div>
                    </div>
                    <span className={cn('text-lg font-bold tabular-nums', cfg.color)}>{parseFloat(riskPercent).toFixed(1)}%</span>
                  </CardContent>
                </Card>
              );
            })()}

            <Card className="bg-card border-border">
              <CardContent className="p-4 space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />{t('ps_optimal_size')}
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: t('ps_standard'), value: result.standardLots, sub: '100,000 u.' },
                    { label: t('ps_mini'), value: result.miniLots, sub: '10,000 u.' },
                    { label: t('ps_micro'), value: result.microLots, sub: '1,000 u.' },
                  ].map(l => (
                    <div key={l.label} className="bg-secondary/50 rounded-lg p-3 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{l.label}</p>
                      <p className="text-xl font-bold text-primary tabular-nums">{l.value}</p>
                      <p className="text-[9px] text-muted-foreground">{l.sub}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-card border-border">
                <CardContent className="p-3 text-center">
                  <DollarSign className="w-4 h-4 mx-auto mb-1 text-rose-400" />
                  <p className="text-[10px] text-muted-foreground">{t('ps_max_risk')}</p>
                  <p className="text-lg font-bold text-rose-400 tabular-nums">${result.riskAmount}</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-3 text-center">
                  <DollarSign className="w-4 h-4 mx-auto mb-1 text-primary" />
                  <p className="text-[10px] text-muted-foreground">$/Pip</p>
                  <p className="text-lg font-bold text-primary tabular-nums">${result.maxLossPerPip}</p>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">{t('ps_info_text')}</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </PageShell>
  );
}
