import { useState, useMemo } from 'react';
import { PageShell } from '@/components/layout/PageShell';

import { ToolCard, ToolPageHeader } from '@/components/tools/ToolCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Percent, ArrowLeft, Info, Shield, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Header } from '@/components/layout/Header';
import { useTranslation } from '@/i18n/LanguageContext';

const PAIRS = [
  { symbol: 'EUR/USD', pipSize: 0.0001 }, { symbol: 'GBP/USD', pipSize: 0.0001 },
  { symbol: 'USD/JPY', pipSize: 0.01 }, { symbol: 'USD/CHF', pipSize: 0.0001 },
  { symbol: 'AUD/USD', pipSize: 0.0001 }, { symbol: 'NZD/USD', pipSize: 0.0001 },
  { symbol: 'USD/CAD', pipSize: 0.0001 }, { symbol: 'EUR/GBP', pipSize: 0.0001 },
  { symbol: 'EUR/JPY', pipSize: 0.01 }, { symbol: 'GBP/JPY', pipSize: 0.01 },
  { symbol: 'AUD/JPY', pipSize: 0.01 }, { symbol: 'XAU/USD', pipSize: 0.01 },
];

const LEVERAGE_OPTIONS = [
  { value: 10, label: '1:10' }, { value: 20, label: '1:20' }, { value: 30, label: '1:30' },
  { value: 50, label: '1:50' }, { value: 100, label: '1:100' }, { value: 200, label: '1:200' },
  { value: 500, label: '1:500' },
];

const ACCENT = '25 85% 55%';

export default function MarginCalculator() {
  const { t } = useTranslation();
  const [pair, setPair] = useState('EUR/USD');
  const [lotSize, setLotSize] = useState(100000);
  const [numLots, setNumLots] = useState('1');
  const [leverage, setLeverage] = useState(100);
  const [exchangeRate, setExchangeRate] = useState('1.0850');
  const [accountBalance, setAccountBalance] = useState('10000');

  const LOT_SIZES = [
    { value: 100000, label: t('pip_lot_standard') },
    { value: 10000, label: t('pip_lot_mini') },
    { value: 1000, label: t('pip_lot_micro') },
  ];

  const result = useMemo(() => {
    const lots = parseFloat(numLots) || 0;
    const rate = parseFloat(exchangeRate) || 1;
    const balance = parseFloat(accountBalance) || 0;
    const positionSize = lotSize * lots;
    const baseCurrency = pair.split('/')[0];
    const quoteCurrency = pair.split('/')[1];
    let positionValueUSD: number;
    if (quoteCurrency === 'USD') positionValueUSD = positionSize * rate;
    else if (baseCurrency === 'USD') positionValueUSD = positionSize;
    else positionValueUSD = positionSize * rate;
    const requiredMargin = positionValueUSD / leverage;
    const freeMargin = balance - requiredMargin;
    const marginLevel = requiredMargin > 0 ? (balance / requiredMargin) * 100 : 0;
    const marginUsedPercent = balance > 0 ? (requiredMargin / balance) * 100 : 0;
    return { positionSize, positionValueUSD, requiredMargin, freeMargin, marginLevel, marginUsedPercent };
  }, [pair, lotSize, numLots, leverage, exchangeRate, accountBalance]);

  const marginStatus = result.marginLevel >= 200 ? 'safe' : result.marginLevel >= 100 ? 'warning' : 'danger';
  const statusConfig = {
    safe: { label: t('margin_safe'), color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
    warning: { label: t('margin_caution'), color: 'text-amber-400', bg: 'bg-amber-500/15' },
    danger: { label: t('margin_danger'), color: 'text-red-400', bg: 'bg-red-500/15' },
  };

  return (
    <PageShell>
      <Header />
      <main className="container py-3 max-w-lg mx-auto px-3 space-y-3">
        <ToolPageHeader
          icon={<Percent className="w-5 h-5" style={{ color: `hsl(${ACCENT})` }} />}
          title={t('margin_title')}
          accent={ACCENT}
        />

        <ToolCard accent={ACCENT} className="mb-3">
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t('tool_currency_pair')}</Label>
              <Select value={pair} onValueChange={setPair}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PAIRS.map(p => <SelectItem key={p.symbol} value={p.symbol}>{p.symbol}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{t('tool_lot_size')}</Label>
                <Select value={String(lotSize)} onValueChange={v => setLotSize(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LOT_SIZES.map(l => <SelectItem key={l.value} value={String(l.value)}>{l.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{t('tool_num_lots')}</Label>
                <Input type="number" value={numLots} onChange={e => setNumLots(e.target.value)} step="0.01" min="0.01" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{t('margin_leverage')}</Label>
                <Select value={String(leverage)} onValueChange={v => setLeverage(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LEVERAGE_OPTIONS.map(l => <SelectItem key={l.value} value={String(l.value)}>{l.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{t('tool_exchange_rate')}</Label>
                <Input type="number" value={exchangeRate} onChange={e => setExchangeRate(e.target.value)} step="0.0001" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t('tool_account_balance')}</Label>
              <Input type="number" value={accountBalance} onChange={e => setAccountBalance(e.target.value)} min="0" step="100" />
            </div>
          </div>
        </ToolCard>

        <ToolCard accent={ACCENT} className="mb-3">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-primary">{t('margin_status')}</h2>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground">{t('margin_level')}</span>
              <div className="flex items-center gap-2">
                <span className={cn("text-lg font-mono font-bold", statusConfig[marginStatus].color)}>{result.marginLevel.toFixed(1)}%</span>
                <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-semibold", statusConfig[marginStatus].bg, statusConfig[marginStatus].color)}>{statusConfig[marginStatus].label}</span>
              </div>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full transition-all", marginStatus === 'safe' ? 'bg-emerald-500' : marginStatus === 'warning' ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${Math.min(result.marginUsedPercent, 100)}%` }} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 text-right">{result.marginUsedPercent.toFixed(1)}% {t('margin_balance_used')}</p>
          </div>
        </ToolCard>

        <ToolCard accent={ACCENT} className="mb-3">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Percent className="w-4 h-4 " style={{ color: `hsl(${ACCENT})` }} />
              <h2 className="text-sm font-semibold text-primary">{t('margin_breakdown')}</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('pip_position_size')}</span>
                <span className="text-sm font-mono font-semibold text-foreground">{result.positionSize.toLocaleString()} {t('margin_units')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('margin_position_value')}</span>
                <span className="text-sm font-mono font-semibold text-foreground">${result.positionValueUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="h-px" style={{ background: "hsl(var(--border) / 0.3)" }} />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('margin_required')}</span>
                <span className="text-base font-mono font-bold text-foreground">${result.requiredMargin.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('margin_free')}</span>
                <span className={cn("text-base font-mono font-bold", result.freeMargin >= 0 ? "text-emerald-400" : "text-red-400")}>${result.freeMargin.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </ToolCard>

        {marginStatus !== 'safe' && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border mb-4">
            <AlertTriangle className={cn("w-4 h-4 shrink-0 mt-0.5", statusConfig[marginStatus].color)} />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {marginStatus === 'danger' ? t('margin_danger_text') : t('margin_warning_text')}
            </p>
          </div>
        )}

        <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: "hsl(var(--card) / 0.6)", border: "1px solid hsl(var(--border) / 0.5)" }}>
          <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">{t('margin_info_text')}</p>
        </div>
      </main>
    </PageShell>
  );
}
