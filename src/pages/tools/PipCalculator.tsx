import { useState, useMemo } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { ToolCard, ToolPageHeader } from '@/components/tools/ToolCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Info, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/LanguageContext';

const ACCENT = '200 80% 55%';

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
      <main className="container py-3 max-w-lg mx-auto px-3 space-y-3">
        <ToolPageHeader
          icon={<Calculator className="w-5 h-5" style={{ color: `hsl(${ACCENT})` }} />}
          title={t('pip_title')}
          subtitle={t('pip_subtitle')}
          accent={ACCENT}
        />

        <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('tool_parameters')}</h2>
        <ToolCard accent={ACCENT}>
          <div className="relative z-[2] p-4 space-y-4">
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
          </div>
        </ToolCard>

        <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('tool_result')}</h2>
        <ToolCard accent={ACCENT}>
          <div className="relative z-[2] p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('pip_pip_size')}</span>
                <span className="text-sm font-mono font-semibold text-foreground">{result.pipSize}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('pip_position_size')}</span>
                <span className="text-sm font-mono font-semibold text-foreground">{result.positionSize.toLocaleString()}</span>
              </div>
              <div className="h-px" style={{ background: `hsl(${ACCENT} / 0.15)` }} />
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
        </ToolCard>

        <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: "hsl(var(--card) / 0.6)", border: "1px solid hsl(var(--border) / 0.5)" }}>
          <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">{t('pip_info_text')}</p>
        </div>
      </main>
    </PageShell>
  );
}
