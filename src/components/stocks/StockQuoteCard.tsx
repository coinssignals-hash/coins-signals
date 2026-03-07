import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { StockQuote } from '@/hooks/useStockData';
import brandLogo from '@/assets/g174.svg';

interface StockQuoteCardProps {
  quote: StockQuote | undefined;
  loading: boolean;
}

export function StockQuoteCard({ quote, loading }: StockQuoteCardProps) {
  if (loading || !quote) {
    return (
      <div className="relative rounded-xl border border-cyan-800/30 overflow-hidden p-4 space-y-3"
        style={{ background: 'radial-gradient(ellipse at center 40%, hsl(200, 100%, 15%) 0%, hsl(205, 100%, 7%) 70%, hsl(210, 100%, 5%) 100%)' }}>
        <Skeleton className="h-8 w-32 bg-slate-800/50" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-12 w-full bg-slate-800/50" />)}
        </div>
      </div>
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
    <div className="relative rounded-xl border border-cyan-800/30 overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center 40%, hsl(200, 100%, 15%) 0%, hsl(205, 100%, 7%) 70%, hsl(210, 100%, 5%) 100%)' }}>
      
      {/* Brand watermark */}
      <div className="absolute top-2 right-2 z-[1] pointer-events-none">
        <img src={brandLogo} alt="" aria-hidden="true" className="w-24 h-24 opacity-[0.05] select-none" />
      </div>
      
      {/* Top glow line */}
      <div className="absolute top-0 left-[15%] right-[15%] h-[1px]" style={{ background: 'radial-gradient(ellipse at center, hsl(200, 80%, 55%) 0%, transparent 70%)' }} />

      <div className="relative p-4">
        {/* Price header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-mono font-bold text-white">${quote.price?.toFixed(2)}</span>
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-sm font-mono font-semibold ${
              isPositive ? 'bg-[hsl(142,70%,45%)]/15 text-[hsl(142,70%,45%)]' : 'bg-[hsl(0,70%,55%)]/15 text-[hsl(0,70%,55%)]'
            }`}>
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {isPositive ? '+' : ''}{quote.changesPercentage?.toFixed(2)}%
            </div>
          </div>
          <span className="text-xs text-cyan-300/50 font-mono">
            {isPositive ? '+' : ''}{quote.change?.toFixed(2)} USD
          </span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="bg-[hsl(210,50%,10%)]/80 border border-cyan-800/15 rounded-lg p-2">
              <p className="text-[10px] text-cyan-300/40 font-medium uppercase tracking-wider">{s.label}</p>
              <p className="text-xs font-mono font-semibold text-white mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
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
