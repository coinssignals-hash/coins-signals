import { useState, useEffect, useRef } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ArrowLeft, Scale, Target, ShieldAlert, Info, Calculator, Layers } from 'lucide-react';
import { useTranslation } from '@/i18n/LanguageContext';
import { toast } from 'sonner';

const PAIRS = [
  { symbol: 'EUR/USD', pipSize: 0.0001, pipValue: 10 },
  { symbol: 'GBP/USD', pipSize: 0.0001, pipValue: 10 },
  { symbol: 'USD/JPY', pipSize: 0.01, pipValue: 6.7 },
  { symbol: 'USD/CHF', pipSize: 0.0001, pipValue: 10.3 },
  { symbol: 'AUD/USD', pipSize: 0.0001, pipValue: 10 },
  { symbol: 'NZD/USD', pipSize: 0.0001, pipValue: 10 },
  { symbol: 'USD/CAD', pipSize: 0.0001, pipValue: 7.4 },
  { symbol: 'EUR/GBP', pipSize: 0.0001, pipValue: 12.7 },
  { symbol: 'EUR/JPY', pipSize: 0.01, pipValue: 6.7 },
  { symbol: 'GBP/JPY', pipSize: 0.01, pipValue: 6.7 },
  { symbol: 'XAU/USD', pipSize: 0.01, pipValue: 1 },
];

interface Result {
  riskPips: string;
  rewardPips: string;
  ratio: string;
  riskAmount: string;
  potentialProfit: string;
  isGoodRatio: boolean;
  isAcceptable: boolean;
  verdict: string;
  optimalLots: string;
  miniLots: string;
  microLots: string;
}

export default function RiskRewardCalculator() {
  const { t } = useTranslation();
  const [pair, setPair] = useState('EUR/USD');
  const [direction, setDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [entryPrice, setEntryPrice] = useState('1.08500');
  const [stopLoss, setStopLoss] = useState('1.08200');
  const [takeProfit, setTakeProfit] = useState('1.09100');
  const [accountBalance, setAccountBalance] = useState('10000');
  const [riskPercent, setRiskPercent] = useState('2');
  const [result, setResult] = useState<Result | null>(null);
  const initialCalcDone = useRef(false);

  // Auto-calculate on mount with default values
  useEffect(() => {
    if (!initialCalcDone.current) {
      initialCalcDone.current = true;
      handleCalculate(true);
    }
  }, []);

  const handleCalculate = (silent = false) => {
    const entry = parseFloat(entryPrice);
    const sl = parseFloat(stopLoss);
    const tp = parseFloat(takeProfit);
    const balance = parseFloat(accountBalance);
    const riskPct = parseFloat(riskPercent);

    if (!entry || !sl || !tp) {
      toast.error(t('rr_fill_prices') || 'Completa Entry, Stop Loss y Take Profit');
      return;
    }
    if (!balance || balance <= 0) {
      toast.error(t('rr_invalid_balance') || 'Ingresa un balance válido');
      return;
    }
    if (!riskPct || riskPct <= 0) {
      toast.error(t('rr_invalid_risk') || 'Ingresa un % de riesgo válido');
      return;
    }

    const pairData = PAIRS.find(p => p.symbol === pair);
    if (!pairData) return;

    const riskPips = Math.abs(entry - sl) / pairData.pipSize;
    const rewardPips = Math.abs(tp - entry) / pairData.pipSize;
    const ratio = riskPips > 0 ? rewardPips / riskPips : 0;
    const riskAmount = balance * (riskPct / 100);
    const potentialProfit = ratio * riskAmount;
    const isGoodRatio = ratio >= 2;
    const isAcceptable = ratio >= 1 && ratio < 2;

    // Lot size calculation: riskAmount / (riskPips * pipValue)
    const standardLots = riskPips > 0 ? riskAmount / (riskPips * pairData.pipValue) : 0;
    const miniLots = standardLots * 10;
    const microLots = standardLots * 100;

    setResult({
      riskPips: riskPips.toFixed(1),
      rewardPips: rewardPips.toFixed(1),
      ratio: ratio.toFixed(2),
      riskAmount: riskAmount.toFixed(2),
      potentialProfit: potentialProfit.toFixed(2),
      isGoodRatio,
      isAcceptable,
      verdict: isGoodRatio ? (t('rr_excellent') || 'Excelente') : isAcceptable ? (t('rr_acceptable') || 'Aceptable') : (t('rr_not_recommended') || 'No recomendado'),
      optimalLots: standardLots.toFixed(2),
      miniLots: miniLots.toFixed(2),
      microLots: microLots.toFixed(2),
    });

    if (!silent) toast.success(t('rr_calculated') || 'Resultado calculado');
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
            <Scale className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground">{t('rr_title')}</h1>
          </div>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{t('rr_trade_params')}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t('rr_pair')}</Label>
                <Select value={pair} onValueChange={setPair}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{PAIRS.map(p => <SelectItem key={p.symbol} value={p.symbol}>{p.symbol}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t('tool_direction')}</Label>
                <div className="flex gap-1">
                  {(['BUY', 'SELL'] as const).map(d => (
                    <button key={d} onClick={() => setDirection(d)}
                      className={cn('flex-1 py-2 rounded-md text-xs font-semibold transition-colors',
                        direction === d
                          ? d === 'BUY' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-secondary text-muted-foreground border border-border'
                      )}>{d}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t('tool_entry')}</Label>
                <Input type="number" step="0.00001" value={entryPrice} onChange={e => setEntryPrice(e.target.value)} placeholder="1.08500" className="bg-secondary border-border text-foreground" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Stop Loss</Label>
                <Input type="number" step="0.00001" value={stopLoss} onChange={e => setStopLoss(e.target.value)} placeholder="1.08200" className="bg-secondary border-border text-foreground" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Take Profit</Label>
                <Input type="number" step="0.00001" value={takeProfit} onChange={e => setTakeProfit(e.target.value)} placeholder="1.09100" className="bg-secondary border-border text-foreground" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t('rr_balance')}</Label>
                <Input type="number" value={accountBalance} onChange={e => setAccountBalance(e.target.value)} className="bg-secondary border-border text-foreground" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t('tool_risk_pct')}</Label>
                <Input type="number" step="0.5" value={riskPercent} onChange={e => setRiskPercent(e.target.value)} className="bg-secondary border-border text-foreground" />
              </div>
            </div>

            <Button onClick={handleCalculate} className="w-full gap-2 font-semibold">
              <Calculator className="w-4 h-4" />
              {t('rr_calculate_btn') || 'Calcular Riesgo / Recompensa'}
            </Button>
          </CardContent>
        </Card>

        {result && (() => {
          const riskVal = parseFloat(result.riskPips);
          const rewardVal = parseFloat(result.rewardPips);
          const total = riskVal + rewardVal;
          const riskPct = total > 0 ? (riskVal / total) * 100 : 50;
          const rewardPct = total > 0 ? (rewardVal / total) * 100 : 50;

          return (
          <>
            <Card className={cn('border',
              result.isGoodRatio ? 'bg-emerald-500/5 border-emerald-500/20' :
              result.isAcceptable ? 'bg-amber-500/5 border-amber-500/20' : 'bg-rose-500/5 border-rose-500/20'
            )}>
              <CardContent className="p-4 text-center space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{t('rr_ratio')}</p>
                <p className={cn('text-4xl font-bold tabular-nums',
                  result.isGoodRatio ? 'text-emerald-400' : result.isAcceptable ? 'text-amber-400' : 'text-rose-400'
                )}>1:{result.ratio}</p>
                <span className={cn('inline-block text-[10px] px-2.5 py-1 rounded-full font-semibold',
                  result.isGoodRatio ? 'bg-emerald-500/15 text-emerald-400' : result.isAcceptable ? 'bg-amber-500/15 text-amber-400' : 'bg-rose-500/15 text-rose-400'
                )}>{result.verdict}</span>
              </CardContent>
            </Card>

            {/* Visual bar chart */}
            <Card className="bg-card border-border">
              <CardContent className="p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">
                  {t('rr_visual') || 'Proporción Visual'}
                </p>
                <div className="flex items-end gap-4 justify-center h-36">
                  {/* Risk bar */}
                  <div className="flex flex-col items-center gap-1.5 flex-1 max-w-[120px]">
                    <span className="text-xs font-bold text-rose-400 tabular-nums">{result.riskPips} pips</span>
                    <div className="w-full bg-rose-500/10 rounded-t-lg overflow-hidden flex flex-col justify-end" style={{ height: '100%' }}>
                      <div
                        className="w-full bg-gradient-to-t from-rose-500 to-rose-400 rounded-t-lg transition-all duration-700 ease-out"
                        style={{ height: `${riskPct}%`, minHeight: '12px' }}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                      <span className="text-[11px] font-semibold text-rose-400">{t('rr_risk') || 'Riesgo'}</span>
                    </div>
                    <span className="text-[10px] text-rose-400/70 tabular-nums">${result.riskAmount}</span>
                  </div>
                  {/* Reward bar */}
                  <div className="flex flex-col items-center gap-1.5 flex-1 max-w-[120px]">
                    <span className="text-xs font-bold text-emerald-400 tabular-nums">{result.rewardPips} pips</span>
                    <div className="w-full bg-emerald-500/10 rounded-t-lg overflow-hidden flex flex-col justify-end" style={{ height: '100%' }}>
                      <div
                        className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg transition-all duration-700 ease-out"
                        style={{ height: `${rewardPct}%`, minHeight: '12px' }}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[11px] font-semibold text-emerald-400">{t('rr_reward') || 'Recompensa'}</span>
                    </div>
                    <span className="text-[10px] text-emerald-400/70 tabular-nums">${result.potentialProfit}</span>
                  </div>
                </div>
                {/* Horizontal proportion bar */}
                <div className="space-y-1">
                  <div className="flex w-full h-3 rounded-full overflow-hidden">
                    <div className="bg-rose-500 transition-all duration-700" style={{ width: `${riskPct}%` }} />
                    <div className="bg-emerald-500 transition-all duration-700" style={{ width: `${rewardPct}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] tabular-nums text-muted-foreground">
                    <span>{riskPct.toFixed(0)}% {t('rr_risk') || 'Riesgo'}</span>
                    <span>{rewardPct.toFixed(0)}% {t('rr_reward') || 'Recompensa'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-card border-border">
                <CardContent className="p-3 text-center">
                  <ShieldAlert className="w-4 h-4 mx-auto mb-1 text-rose-400" />
                  <p className="text-xs text-muted-foreground">{t('rr_risk')}</p>
                  <p className="text-sm font-bold text-rose-400 tabular-nums">{result.riskPips} pips</p>
                  <p className="text-xs text-rose-400/70 tabular-nums">${result.riskAmount}</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-3 text-center">
                  <Target className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                  <p className="text-xs text-muted-foreground">{t('rr_reward')}</p>
                  <p className="text-sm font-bold text-emerald-400 tabular-nums">{result.rewardPips} pips</p>
                  <p className="text-xs text-emerald-400/70 tabular-nums">${result.potentialProfit}</p>
                </CardContent>
              </Card>
            </div>

            {/* Optimal Lot Size */}
            <Card className="bg-card border-primary/20">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 justify-center">
                  <Layers className="w-4 h-4 text-primary" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t('rr_lot_size') || 'Tamaño de Lote Óptimo'}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 text-center">
                    <p className="text-[10px] text-muted-foreground mb-1">Standard</p>
                    <p className="text-lg font-bold text-primary tabular-nums">{result.optimalLots}</p>
                    <p className="text-[9px] text-muted-foreground">100K units</p>
                  </div>
                  <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 text-center">
                    <p className="text-[10px] text-muted-foreground mb-1">Mini</p>
                    <p className="text-lg font-bold text-primary tabular-nums">{result.miniLots}</p>
                    <p className="text-[9px] text-muted-foreground">10K units</p>
                  </div>
                  <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 text-center">
                    <p className="text-[10px] text-muted-foreground mb-1">Micro</p>
                    <p className="text-lg font-bold text-primary tabular-nums">{result.microLots}</p>
                    <p className="text-[9px] text-muted-foreground">1K units</p>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground text-center">
                  {t('rr_lot_info') || `Basado en ${riskPercent}% de riesgo ($${result.riskAmount}) sobre ${result.riskPips} pips de SL`}
                </p>
              </CardContent>
            </Card>
          </>
          );
        })()}

        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">{t('rr_info_text')}</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </PageShell>
  );
}
