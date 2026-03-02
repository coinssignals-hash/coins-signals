import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import type { StockQuote } from '@/hooks/useStockData';

interface StockQuoteCardProps {
  quote: StockQuote | undefined;
  loading: boolean;
}

export function StockQuoteCard({ quote, loading }: StockQuoteCardProps) {
  if (loading || !quote) {
    return (
      <Card className="p-4 bg-card border-border space-y-3">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      </Card>
    );
  }

  const isPositive = quote.changesPercentage >= 0;

  const stats = [
    { label: 'Apertura', value: `$${quote.open?.toFixed(2)}` },
    { label: 'Cierre Ant.', value: `$${quote.previousClose?.toFixed(2)}` },
    { label: 'Mín. Día', value: `$${quote.dayLow?.toFixed(2)}` },
    { label: 'Máx. Día', value: `$${quote.dayHigh?.toFixed(2)}` },
    { label: 'Mín. 52S', value: `$${quote.yearLow?.toFixed(2)}` },
    { label: 'Máx. 52S', value: `$${quote.yearHigh?.toFixed(2)}` },
    { label: 'Volumen', value: formatNumber(quote.volume) },
    { label: 'Vol. Prom.', value: formatNumber(quote.avgVolume) },
    { label: 'P/E', value: quote.pe ? quote.pe.toFixed(2) : 'N/A' },
    { label: 'EPS', value: quote.eps ? `$${quote.eps.toFixed(2)}` : 'N/A' },
    { label: 'Cap. Mercado', value: formatMarketCap(quote.marketCap) },
    { label: 'Exchange', value: quote.exchange || 'N/A' },
  ];

  return (
    <Card className="p-4 bg-card border-border">
      {/* Price header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-mono font-bold text-foreground">${quote.price?.toFixed(2)}</span>
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-sm font-mono font-semibold ${
            isPositive ? 'bg-[hsl(var(--bullish))]/10 text-[hsl(var(--bullish))]' : 'bg-[hsl(var(--bearish))]/10 text-[hsl(var(--bearish))]'
          }`}>
            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {isPositive ? '+' : ''}{quote.changesPercentage?.toFixed(2)}%
          </div>
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {isPositive ? '+' : ''}{quote.change?.toFixed(2)} USD
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="bg-secondary/50 rounded-lg p-2">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{s.label}</p>
            <p className="text-xs font-mono font-semibold text-foreground mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function formatNumber(n: number | undefined): string {
  if (!n) return 'N/A';
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toString();
}

function formatMarketCap(n: number | undefined): string {
  if (!n) return 'N/A';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n}`;
}
