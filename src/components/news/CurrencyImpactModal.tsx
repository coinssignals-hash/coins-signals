import { useMemo, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useRealtimeMarket } from '@/hooks/useRealtimeMarket';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, Minus, Activity, Loader2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { Currency } from '@/types/news';

interface SignalMatch {
  currency_pair: string;
  entry_price: number;
  action: string;
  polygonSymbol: string;
}

function buildPolygonSymbol(pair: string): string {
  const clean = pair.replace(/[^A-Z]/g, '');
  return `C:${clean}`;
}

interface CurrencyImpactModalProps {
  currencies: Currency[];
  children: React.ReactNode;
}

export function CurrencyImpactModal({ currencies, children }: CurrencyImpactModalProps) {
  const [signals, setSignals] = useState<SignalMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Fetch all related signals on open
  useEffect(() => {
    if (!open || currencies.length < 2) {
      setLoading(false);
      return;
    }

    const possiblePairs: string[] = [];
    for (let i = 0; i < currencies.length; i++) {
      for (let j = i + 1; j < currencies.length; j++) {
        possiblePairs.push(`${currencies[i]}/${currencies[j]}`);
        possiblePairs.push(`${currencies[j]}/${currencies[i]}`);
        possiblePairs.push(`${currencies[i]}${currencies[j]}`);
        possiblePairs.push(`${currencies[j]}${currencies[i]}`);
      }
    }

    setLoading(true);
    supabase
      .from('trading_signals')
      .select('currency_pair, entry_price, action')
      .in('currency_pair', possiblePairs)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) {
          // Deduplicate by currency_pair
          const seen = new Set<string>();
          const unique = data.filter(s => {
            if (seen.has(s.currency_pair)) return false;
            seen.add(s.currency_pair);
            return true;
          });
          setSignals(unique.map(s => ({
            currency_pair: s.currency_pair,
            entry_price: Number(s.entry_price),
            action: s.action,
            polygonSymbol: buildPolygonSymbol(s.currency_pair),
          })));
        }
        setLoading(false);
      });
  }, [open, currencies]);

  const polygonSymbols = useMemo(() => signals.map(s => s.polygonSymbol), [signals]);
  const { getQuote, isConnected } = useRealtimeMarket(open ? polygonSymbols : []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Activity className="w-4 h-4 text-primary" />
            Impacto en Divisas
            {isConnected && (
              <span className="ml-auto flex items-center gap-1 text-xs font-normal text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Live
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Buscando señales...</span>
            </div>
          ) : signals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No hay señales activas para estas divisas.
            </div>
          ) : (
            signals.map((signal) => (
              <SignalRow key={signal.currency_pair} signal={signal} getQuote={getQuote} />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SignalRow({ signal, getQuote }: { signal: SignalMatch; getQuote: (s: string) => { price: number } | null }) {
  const quote = getQuote(signal.polygonSymbol);
  const diff = useMemo(() => {
    if (!quote?.price) return null;
    const pct = ((quote.price - signal.entry_price) / signal.entry_price) * 100;
    return { percent: pct, isPositive: pct >= 0, currentPrice: quote.price };
  }, [quote?.price, signal.entry_price]);

  const circlePercent = diff ? Math.min(100, Math.abs(diff.percent) * 100) : 0;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
      {/* Mini circle */}
      <div className="relative w-11 h-11 flex-shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="14" fill="none"
            stroke={diff
              ? diff.isPositive ? 'hsl(135, 70%, 50%)' : 'hsl(0, 70%, 55%)'
              : 'hsl(var(--muted-foreground) / 0.3)'}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${circlePercent * 0.88} ${100 * 0.88}`}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-[9px] font-bold ${
            !diff ? 'text-muted-foreground' :
            diff.isPositive ? 'text-green-400' : 'text-red-400'
          }`}>
            {diff ? `${diff.isPositive ? '+' : ''}${diff.percent.toFixed(3)}%` : '—'}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{signal.currency_pair}</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
            signal.action === 'BUY' 
              ? 'bg-green-500/10 text-green-400' 
              : 'bg-red-500/10 text-red-400'
          }`}>
            {signal.action}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
          <span>Entrada: {signal.entry_price.toFixed(4)}</span>
          {diff && (
            <span className={diff.isPositive ? 'text-green-400' : 'text-red-400'}>
              Actual: {diff.currentPrice.toFixed(4)}
            </span>
          )}
        </div>
      </div>

      {/* Trend icon */}
      <div className="flex-shrink-0">
        {!diff ? <Minus className="w-5 h-5 text-muted-foreground" /> :
         diff.isPositive ? <TrendingUp className="w-5 h-5 text-green-400" /> :
         <TrendingDown className="w-5 h-5 text-red-400" />}
      </div>
    </div>
  );
}
