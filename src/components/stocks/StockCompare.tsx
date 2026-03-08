import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, X, ArrowUpDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useStockSearch, useStockQuote, useStockHistorical } from '@/hooks/useStockData';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/LanguageContext';

const COLOR_A = 'hsl(210, 80%, 60%)';
const COLOR_B = 'hsl(340, 70%, 55%)';

interface StockCompareProps {
  onClose: () => void;
}

function SymbolPicker({ label, color, selected, onSelect, onClear, t }: {
  label: string; color: string; selected: string; onSelect: (s: string) => void; onClear: () => void; t: (k: any) => string;
}) {
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 400);
  const { data: results, isLoading } = useStockSearch(debounced);

  if (selected) {
    return (
      <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-sm font-bold text-foreground">{selected}</span>
        <button onClick={onClear} className="ml-auto p-0.5 rounded hover:bg-secondary">
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
      <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`${label}...`}
        className="pl-8 h-9 text-sm bg-card border-border" />
      {debounced.length >= 2 && (
        <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-lg shadow-xl max-h-40 overflow-y-auto">
          {isLoading ? (
            <div className="p-3"><Skeleton className="h-6 w-full" /></div>
          ) : results && results.length > 0 ? (
            results.slice(0, 5).map((r) => (
              <button key={r.symbol} onClick={() => { onSelect(r.symbol); setQuery(''); }}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-secondary text-left text-sm">
                <span className="font-semibold text-foreground">{r.symbol}</span>
                <span className="text-xs text-muted-foreground">{r.name}</span>
              </button>
            ))
          ) : (
            <p className="p-3 text-xs text-muted-foreground text-center">{t('stock_no_results')}</p>
          )}
        </div>
      )}
    </div>
  );
}

function MetricRow({ label, valueA, valueB, format = 'number', higherIsBetter = true }: {
  label: string; valueA?: number | null; valueB?: number | null; format?: 'number' | 'currency' | 'percent' | 'large'; higherIsBetter?: boolean;
}) {
  const fmt = (v: number | null | undefined) => {
    if (v == null) return '—';
    switch (format) {
      case 'currency': return `$${v.toFixed(2)}`;
      case 'percent': return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
      case 'large': return v >= 1e12 ? `$${(v / 1e12).toFixed(1)}T` : v >= 1e9 ? `$${(v / 1e9).toFixed(1)}B` : v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : `$${v.toFixed(0)}`;
      default: return v.toFixed(2);
    }
  };

  const aWins = valueA != null && valueB != null && (higherIsBetter ? valueA > valueB : valueA < valueB);
  const bWins = valueA != null && valueB != null && (higherIsBetter ? valueB > valueA : valueB < valueA);

  return (
    <div className="grid grid-cols-3 items-center py-1.5 border-b border-border/20 last:border-0">
      <span className={cn("text-xs font-mono", aWins ? "text-foreground font-semibold" : "text-muted-foreground")}>{fmt(valueA)}</span>
      <span className="text-[10px] text-muted-foreground text-center font-medium">{label}</span>
      <span className={cn("text-xs font-mono text-right", bWins ? "text-foreground font-semibold" : "text-muted-foreground")}>{fmt(valueB)}</span>
    </div>
  );
}

export function StockCompare({ onClose }: StockCompareProps) {
  const { t } = useTranslation();
  const [symbolA, setSymbolA] = useState('');
  const [symbolB, setSymbolB] = useState('');

  const { data: quoteA } = useStockQuote(symbolA);
  const { data: quoteB } = useStockQuote(symbolB);
  const { data: histA, isLoading: loadA } = useStockHistorical(symbolA, '3m');
  const { data: histB, isLoading: loadB } = useStockHistorical(symbolB, '3m');

  const overlayData = useMemo(() => {
    if (!histA?.length || !histB?.length) return [];
    const baseA = histA[0].close;
    const baseB = histB[0].close;
    const mapB = new Map(histB.map(d => [d.date, d]));
    return histA.map(d => {
      const bPoint = mapB.get(d.date);
      return {
        date: d.date,
        [symbolA]: ((d.close - baseA) / baseA * 100),
        [symbolB]: bPoint ? ((bPoint.close - baseB) / baseB * 100) : null,
      };
    });
  }, [histA, histB, symbolA, symbolB]);

  const bothSelected = symbolA && symbolB;

  return (
    <div className="px-4 space-y-3 pb-4">
      <Card className="p-3 bg-card border-border space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <ArrowUpDown className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('stock_compare_stocks')}</span>
          <button onClick={onClose} className="ml-auto text-xs text-muted-foreground hover:text-foreground">{t('stock_close')}</button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <SymbolPicker label={t('stock_stock_a')} color={COLOR_A} selected={symbolA} onSelect={setSymbolA} onClear={() => setSymbolA('')} t={t} />
          <SymbolPicker label={t('stock_stock_b')} color={COLOR_B} selected={symbolB} onSelect={setSymbolB} onClear={() => setSymbolB('')} t={t} />
        </div>
      </Card>

      {bothSelected && (
        <Card className="p-4 bg-card border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3">{t('stock_relative_perf')}</h3>
          {loadA || loadB ? (
            <Skeleton className="h-48 w-full" />
          ) : overlayData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={overlayData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => v?.slice(5)} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => `${v > 0 ? '+' : ''}${v.toFixed(0)}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }}
                  formatter={(value: number | null, name: string) => [
                    value != null ? `${value > 0 ? '+' : ''}${value.toFixed(2)}%` : '—', name
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }}
                  formatter={(value) => <span className="text-foreground text-xs font-semibold">{value}</span>} />
                <Line type="monotone" dataKey={symbolA} stroke={COLOR_A} strokeWidth={2} dot={false} connectNulls />
                <Line type="monotone" dataKey={symbolB} stroke={COLOR_B} strokeWidth={2} dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">{t('stock_no_data_available')}</p>
          )}
        </Card>
      )}

      {bothSelected && quoteA && quoteB && (
        <Card className="p-4 bg-card border-border">
          <div className="grid grid-cols-3 items-center mb-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLOR_A }} />
              <span className="text-sm font-bold text-foreground">{symbolA}</span>
            </div>
            <span className="text-[10px] text-muted-foreground text-center uppercase font-semibold">{t('stock_metric')}</span>
            <div className="flex items-center gap-1.5 justify-end">
              <span className="text-sm font-bold text-foreground">{symbolB}</span>
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLOR_B }} />
            </div>
          </div>

          <MetricRow label={t('stock_price')} valueA={quoteA.price} valueB={quoteB.price} format="currency" />
          <MetricRow label={t('stock_change_pct')} valueA={quoteA.changesPercentage} valueB={quoteB.changesPercentage} format="percent" />
          <MetricRow label="Market Cap" valueA={quoteA.marketCap} valueB={quoteB.marketCap} format="large" />
          <MetricRow label="P/E" valueA={quoteA.pe} valueB={quoteB.pe} higherIsBetter={false} />
          <MetricRow label="EPS" valueA={quoteA.eps} valueB={quoteB.eps} format="currency" />
          <MetricRow label={t('stock_volume')} valueA={quoteA.volume} valueB={quoteB.volume} format="large" />
          <MetricRow label={t('stock_day_high')} valueA={quoteA.dayHigh} valueB={quoteB.dayHigh} format="currency" />
          <MetricRow label={t('stock_day_low')} valueA={quoteA.dayLow} valueB={quoteB.dayLow} format="currency" higherIsBetter={false} />
          <MetricRow label={t('stock_52w_high')} valueA={quoteA.yearHigh} valueB={quoteB.yearHigh} format="currency" />
          <MetricRow label={t('stock_52w_low')} valueA={quoteA.yearLow} valueB={quoteB.yearLow} format="currency" higherIsBetter={false} />
        </Card>
      )}

      {!bothSelected && (
        <Card className="p-6 bg-card border-border">
          <p className="text-sm text-muted-foreground text-center">{t('stock_select_two')}</p>
        </Card>
      )}
    </div>
  );
}