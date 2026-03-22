import { useState, useMemo } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { ToolCard } from '@/components/tools/ToolCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ArrowLeft, Clock, Moon, Calendar, Info, TrendingDown, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/i18n/LanguageContext';

interface SwapRate { symbol: string; longSwap: number; shortSwap: number; pipValue: number; }

const SWAP_DATA: SwapRate[] = [
  { symbol: 'EUR/USD', longSwap: -0.72, shortSwap: 0.35, pipValue: 10 },
  { symbol: 'GBP/USD', longSwap: -0.55, shortSwap: 0.18, pipValue: 10 },
  { symbol: 'USD/JPY', longSwap: 0.45, shortSwap: -0.82, pipValue: 6.7 },
  { symbol: 'USD/CHF', longSwap: 0.38, shortSwap: -0.65, pipValue: 10 },
  { symbol: 'AUD/USD', longSwap: -0.48, shortSwap: 0.12, pipValue: 10 },
  { symbol: 'NZD/USD', longSwap: -0.42, shortSwap: 0.08, pipValue: 10 },
  { symbol: 'USD/CAD', longSwap: 0.22, shortSwap: -0.58, pipValue: 7.5 },
  { symbol: 'EUR/GBP', longSwap: -0.35, shortSwap: 0.05, pipValue: 12.7 },
  { symbol: 'EUR/JPY', longSwap: 0.15, shortSwap: -0.55, pipValue: 6.7 },
  { symbol: 'GBP/JPY', longSwap: 0.52, shortSwap: -0.95, pipValue: 6.7 },
  { symbol: 'XAU/USD', longSwap: -2.85, shortSwap: 0.45, pipValue: 1 },
];

export default function SwapCalculator() {
  const { t } = useTranslation();
  const [pair, setPair] = useState('EUR/USD');
  const [direction, setDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [lotSize, setLotSize] = useState('1.0');
  const [holdDays, setHoldDays] = useState('5');

  const result = useMemo(() => {
    const lots = parseFloat(lotSize);
    const days = parseInt(holdDays);
    const pairData = SWAP_DATA.find(p => p.symbol === pair);
    if (!lots || !days || !pairData || days <= 0) return null;
    const swapRate = direction === 'BUY' ? pairData.longSwap : pairData.shortSwap;
    const dailyCostPips = swapRate * lots;
    const dailyCostUsd = dailyCostPips * pairData.pipValue;
    const tripleSwapDays = Math.floor(days / 7);
    const effectiveDays = days + (tripleSwapDays * 2);
    const totalPips = swapRate * lots * effectiveDays;
    const totalCostUsd = totalPips * pairData.pipValue;
    return {
      swapRate: swapRate.toFixed(2), dailyCostPips: dailyCostPips.toFixed(2),
      dailyCostUsd: dailyCostUsd.toFixed(2), totalPips: totalPips.toFixed(2),
      totalCostUsd: totalCostUsd.toFixed(2), effectiveDays, isPositive: totalCostUsd >= 0,
    };
  }, [pair, direction, lotSize, holdDays]);

  const pairData = SWAP_DATA.find(p => p.symbol === pair);

  return (
    <PageShell>
      <Header />
      <main className="container py-3 max-w-lg mx-auto px-3 space-y-3">
        <div className="flex items-center gap-3">
          <Link to="/tools" className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </Link>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground">{t('swap_title')}</h1>
          </div>
        </div>

        <ToolCard>
          <CardContent className="p-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{t('tool_parameters')}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t('tool_currency_pair')}</Label>
                <Select value={pair} onValueChange={setPair}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{SWAP_DATA.map(p => <SelectItem key={p.symbol} value={p.symbol}>{p.symbol}</SelectItem>)}</SelectContent>
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t('swap_lots')}</Label>
                <Input type="number" step="0.01" value={lotSize} onChange={e => setLotSize(e.target.value)} className="bg-secondary border-border text-foreground" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t('swap_hold_days')}</Label>
                <Input type="number" min="1" value={holdDays} onChange={e => setHoldDays(e.target.value)} className="bg-secondary border-border text-foreground" />
              </div>
            </div>
          </CardContent>
        </ToolCard>

        {pairData && (
          <ToolCard>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Moon className="w-4 h-4 text-primary" />{t('swap_rates')} — {pair}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] text-muted-foreground uppercase">{t('swap_long_buy')}</span>
                  </div>
                  <p className={cn('text-lg font-bold tabular-nums', pairData.longSwap >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                    {pairData.longSwap >= 0 ? '+' : ''}{pairData.longSwap} pips
                  </p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingDown className="w-3 h-3 text-rose-400" />
                    <span className="text-[10px] text-muted-foreground uppercase">{t('swap_short_sell')}</span>
                  </div>
                  <p className={cn('text-lg font-bold tabular-nums', pairData.shortSwap >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                    {pairData.shortSwap >= 0 ? '+' : ''}{pairData.shortSwap} pips
                  </p>
                </div>
              </div>
            </CardContent>
          </ToolCard>
        )}

        {result && (
          <>
            <Card className={cn('border', result.isPositive ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20')}>
              <CardContent className="p-4 text-center space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{t('swap_total_cost')}</p>
                <p className={cn('text-3xl font-bold tabular-nums', result.isPositive ? 'text-emerald-400' : 'text-rose-400')}>
                  {result.isPositive ? '+' : ''}${result.totalCostUsd}
                </p>
                <p className="text-xs text-muted-foreground">
                  {result.totalPips} {t('swap_pips_in_nights').replace('{count}', String(result.effectiveDays))}
                </p>
              </CardContent>
            </Card>
            <div className="grid grid-cols-2 gap-3">
              <ToolCard>
                <CardContent className="p-3 text-center">
                  <Moon className="w-4 h-4 mx-auto mb-1 text-primary" />
                  <p className="text-[10px] text-muted-foreground">{t('swap_cost_night')}</p>
                  <p className={cn('text-sm font-bold tabular-nums', parseFloat(result.dailyCostUsd) >= 0 ? 'text-emerald-400' : 'text-rose-400')}>${result.dailyCostUsd}</p>
                  <p className="text-[10px] text-muted-foreground tabular-nums">{result.dailyCostPips} pips</p>
                </CardContent>
              </ToolCard>
              <ToolCard>
                <CardContent className="p-3 text-center">
                  <Calendar className="w-4 h-4 mx-auto mb-1 text-primary" />
                  <p className="text-[10px] text-muted-foreground">{t('swap_effective_nights')}</p>
                  <p className="text-sm font-bold text-foreground tabular-nums">{result.effectiveDays}</p>
                  <p className="text-[10px] text-muted-foreground">{t('swap_includes_triple')}</p>
                </CardContent>
              </ToolCard>
            </div>
          </>
        )}

        <ToolCard>
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">{t('swap_info_text')}</p>
            </div>
          </CardContent>
        </ToolCard>
      </main>
    </PageShell>
  );
}
