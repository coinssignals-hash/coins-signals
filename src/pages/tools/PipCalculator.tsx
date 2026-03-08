import { useState, useMemo } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/LanguageContext';

const PAIRS = [
  { symbol: 'EUR/USD', pipSize: 0.0001, label: 'EUR/USD' },
  { symbol: 'GBP/USD', pipSize: 0.0001, label: 'GBP/USD' },
  { symbol: 'USD/JPY', pipSize: 0.01, label: 'USD/JPY' },
  { symbol: 'USD/CHF', pipSize: 0.0001, label: 'USD/CHF' },
  { symbol: 'AUD/USD', pipSize: 0.0001, label: 'AUD/USD' },
  { symbol: 'NZD/USD', pipSize: 0.0001, label: 'NZD/USD' },
  { symbol: 'USD/CAD', pipSize: 0.0001, label: 'USD/CAD' },
  { symbol: 'EUR/GBP', pipSize: 0.0001, label: 'EUR/GBP' },
  { symbol: 'EUR/JPY', pipSize: 0.01, label: 'EUR/JPY' },
  { symbol: 'GBP/JPY', pipSize: 0.01, label: 'GBP/JPY' },
  { symbol: 'AUD/JPY', pipSize: 0.01, label: 'AUD/JPY' },
  { symbol: 'CAD/JPY', pipSize: 0.01, label: 'CAD/JPY' },
  { symbol: 'CHF/JPY', pipSize: 0.01, label: 'CHF/JPY' },
  { symbol: 'EUR/AUD', pipSize: 0.0001, label: 'EUR/AUD' },
  { symbol: 'GBP/AUD', pipSize: 0.0001, label: 'GBP/AUD' },
  { symbol: 'XAU/USD', pipSize: 0.01, label: 'XAU/USD (Gold)' },
];

const ACCOUNT_CURRENCIES = ['USD', 'EUR', 'GBP'];

export default function PipCalculator() {
  const { t } = useTranslation();
  const [pair, setPair] = useState('EUR/USD');
  const [lotSize, setLotSize] = useState(100000);
  const [numLots, setNumLots] = useState('1');
  const [exchangeRate, setExchangeRate] = useState('1.0850');
  const [accountCurrency, setAccountCurrency] = useState('USD');
  const [pips, setPips] = useState('10');

  const LOT_SIZES = [
    { value: 100000, label: t('pip_lot_standard') },
    { value: 10000, label: t('pip_lot_mini') },
    { value: 1000, label: t('pip_lot_micro') },
    { value: 100, label: t('pip_lot_nano') },
  ];

  const selectedPair = PAIRS.find(p => p.symbol === pair) || PAIRS[0];

  const result = useMemo(() => {
    const lots = parseFloat(numLots) || 0;
    const rate = parseFloat(exchangeRate) || 1;
    const pipCount = parseFloat(pips) || 0;
    const positionSize = lotSize * lots;
    const pipSize = selectedPair.pipSize;
    const quoteCurrency = pair.split('/')[1];
    let pipValueUSD: number;
    if (quoteCurrency === 'USD') {
      pipValueUSD = pipSize * positionSize;
    } else {
      pipValueUSD = (pipSize * positionSize) / rate;
    }
    const totalValue = pipValueUSD * pipCount;
    return { pipValue: pipValueUSD, totalValue, positionSize, pipSize };
  }, [pair, lotSize, numLots, exchangeRate, pips, selectedPair]);

  return (
    <PageShell>
      <Header />
      <main className="container py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/tools" className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t('pip_title')}</h1>
            <p className="text-xs text-muted-foreground">{t('pip_subtitle')}</p>
          </div>
        </div>

        <h2 className="text-sm font-semibold text-primary mb-3">{t('tool_parameters')}</h2>
        <Card className="bg-card border-border mb-4">
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t('tool_currency_pair')}</Label>
              <Select value={pair} onValueChange={setPair}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAIRS.map(p => (<SelectItem key={p.symbol} value={p.symbol}>{p.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{t('tool_lot_size')}</Label>
                <Select value={String(lotSize)} onValueChange={v => setLotSize(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LOT_SIZES.map(l => (<SelectItem key={l.value} value={String(l.value)}>{l.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{t('tool_num_lots')}</Label>
                <Input type="number" value={numLots} onChange={e => setNumLots(e.target.value)} step="0.01" min="0.01" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{t('tool_exchange_rate')}</Label>
                <Input type="number" value={exchangeRate} onChange={e => setExchangeRate(e.target.value)} step="0.0001" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{t('pip_amount')}</Label>
                <Input type="number" value={pips} onChange={e => setPips(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t('tool_account_currency')}</Label>
              <Select value={accountCurrency} onValueChange={setAccountCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACCOUNT_CURRENCIES.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <h2 className="text-sm font-semibold text-primary mb-3">{t('tool_result')}</h2>
        <Card className="bg-card border-border mb-4">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('pip_pip_size')}</span>
                <span className="text-sm font-mono font-semibold text-foreground">{result.pipSize}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('pip_position_size')}</span>
                <span className="text-sm font-mono font-semibold text-foreground">{result.positionSize.toLocaleString()}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('pip_value_per_pip')}</span>
                <span className="text-base font-mono font-bold text-foreground">${result.pipValue.toFixed(2)} {accountCurrency}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('pip_total_value')} ({pips} pips)</span>
                <span className={cn("text-lg font-mono font-bold", result.totalValue >= 0 ? "text-emerald-400" : "text-red-400")}>
                  ${result.totalValue.toFixed(2)} {accountCurrency}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border">
          <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">{t('pip_info_text')}</p>
        </div>
      </main>
    </PageShell>
  );
}
