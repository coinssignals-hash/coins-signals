import { useState, useMemo } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, ArrowLeft, Info, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { useTranslation } from '@/i18n/LanguageContext';

const PAIRS = [
  { symbol: 'EUR/USD', pipSize: 0.0001 },
  { symbol: 'GBP/USD', pipSize: 0.0001 },
  { symbol: 'USD/JPY', pipSize: 0.01 },
  { symbol: 'USD/CHF', pipSize: 0.0001 },
  { symbol: 'AUD/USD', pipSize: 0.0001 },
  { symbol: 'NZD/USD', pipSize: 0.0001 },
  { symbol: 'USD/CAD', pipSize: 0.0001 },
  { symbol: 'EUR/GBP', pipSize: 0.0001 },
  { symbol: 'EUR/JPY', pipSize: 0.01 },
  { symbol: 'GBP/JPY', pipSize: 0.01 },
  { symbol: 'AUD/JPY', pipSize: 0.01 },
  { symbol: 'XAU/USD', pipSize: 0.01 },
];

export default function LotCalculator() {
  const { t } = useTranslation();
  const [pair, setPair] = useState('EUR/USD');
  const [accountBalance, setAccountBalance] = useState('10000');
  const [riskPercent, setRiskPercent] = useState('2');
  const [stopLossPips, setStopLossPips] = useState('50');
  const [exchangeRate, setExchangeRate] = useState('1.0850');

  const selectedPair = PAIRS.find(p => p.symbol === pair) || PAIRS[0];

  const result = useMemo(() => {
    const balance = parseFloat(accountBalance) || 0;
    const risk = parseFloat(riskPercent) || 0;
    const slPips = parseFloat(stopLossPips) || 1;
    const rate = parseFloat(exchangeRate) || 1;
    const pipSize = selectedPair.pipSize;
    const riskAmount = balance * (risk / 100);
    const quoteCurrency = pair.split('/')[1];
    let pipValuePerStandard: number;
    if (quoteCurrency === 'USD') {
      pipValuePerStandard = pipSize * 100000;
    } else {
      pipValuePerStandard = (pipSize * 100000) / rate;
    }
    const lotSize = pipValuePerStandard > 0 ? riskAmount / (slPips * pipValuePerStandard) : 0;
    return {
      riskAmount, lotSize,
      miniLots: lotSize * 10, microLots: lotSize * 100,
      units: lotSize * 100000, pipValuePerStandard,
    };
  }, [pair, accountBalance, riskPercent, stopLossPips, exchangeRate, selectedPair]);

  return (
    <PageShell>
      <Header />
      <main className="container py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/tools" className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t('lot_title')}</h1>
            <p className="text-xs text-muted-foreground">{t('lot_subtitle')}</p>
          </div>
        </div>

        <Card className="bg-card border-border mb-4">
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t('tool_currency_pair')}</Label>
              <Select value={pair} onValueChange={setPair}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PAIRS.map(p => <SelectItem key={p.symbol} value={p.symbol}>{p.symbol}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{t('tool_account_balance')}</Label>
                <Input type="number" value={accountBalance} onChange={e => setAccountBalance(e.target.value)} min="0" step="100" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{t('tool_risk_pct')}</Label>
                <Input type="number" value={riskPercent} onChange={e => setRiskPercent(e.target.value)} min="0.1" max="100" step="0.5" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{t('tool_stop_loss_pips')}</Label>
                <Input type="number" value={stopLossPips} onChange={e => setStopLossPips(e.target.value)} min="1" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{t('tool_exchange_rate')}</Label>
                <Input type="number" value={exchangeRate} onChange={e => setExchangeRate(e.target.value)} step="0.0001" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-primary">{t('lot_monetary_risk')}</h2>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{t('lot_risk_amount')} ({riskPercent}%)</span>
              <span className="text-lg font-mono font-bold text-foreground">${result.riskAmount.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-primary">{t('lot_recommended_size')}</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('lot_standard')}</span>
                <span className="text-base font-mono font-bold text-foreground">{result.lotSize.toFixed(2)}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('lot_mini')}</span>
                <span className="text-sm font-mono font-semibold text-muted-foreground">{result.miniLots.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('lot_micro')}</span>
                <span className="text-sm font-mono font-semibold text-muted-foreground">{result.microLots.toFixed(2)}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('lot_units')}</span>
                <span className="text-sm font-mono font-semibold text-muted-foreground">{Math.round(result.units).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('lot_pip_value_standard')}</span>
                <span className="text-sm font-mono font-semibold text-muted-foreground">${result.pipValuePerStandard.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border">
          <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">{t('lot_info_text')}</p>
        </div>
      </main>
    </PageShell>
  );
}
