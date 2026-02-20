import { useMemo, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useRealtimeMarket } from '@/hooks/useRealtimeMarket';
import { supabase } from '@/integrations/supabase/client';
import type { Currency } from '@/types/news';

interface RelatedSignal {
  currency_pair: string;
  entry_price: number;
  action: string;
}

// Map currency codes to Polygon.io forex symbols
function buildPolygonSymbol(pair: string): string {
  // currency_pair is like "USD/JPY" or "EUR/USD"
  const clean = pair.replace(/[^A-Z]/g, '');
  return `C:${clean}`;
}

// Find best currency pair from affected currencies
function findBestPair(currencies: Currency[]): string | null {
  if (currencies.length < 2) return null;
  const majors = ['EUR', 'USD', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'];
  const sorted = [...currencies].sort((a, b) => {
    const aIdx = majors.indexOf(a);
    const bIdx = majors.indexOf(b);
    return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
  });
  return `${sorted[0]}/${sorted[1]}`;
}

interface LivePriceCircleProps {
  currencies: Currency[];
  size?: 'sm' | 'md';
  className?: string;
}

export function LivePriceCircle({ currencies, size = 'sm', className }: LivePriceCircleProps) {
  const [signal, setSignal] = useState<RelatedSignal | null>(null);
  const [loading, setLoading] = useState(true);

  // Find related signal from DB
  useEffect(() => {
    if (currencies.length < 2) {
      setLoading(false);
      return;
    }

    const possiblePairs: string[] = [];
    for (let i = 0; i < currencies.length; i++) {
      for (let j = i + 1; j < currencies.length; j++) {
        possiblePairs.push(`${currencies[i]}/${currencies[j]}`);
        possiblePairs.push(`${currencies[j]}/${currencies[i]}`);
        // Also try without slash
        possiblePairs.push(`${currencies[i]}${currencies[j]}`);
        possiblePairs.push(`${currencies[j]}${currencies[i]}`);
      }
    }

    supabase
      .from('trading_signals')
      .select('currency_pair, entry_price, action')
      .in('currency_pair', possiblePairs)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setSignal({
            currency_pair: data[0].currency_pair,
            entry_price: Number(data[0].entry_price),
            action: data[0].action,
          });
        }
        setLoading(false);
      });
  }, [currencies]);

  // Build symbol for realtime
  const polygonSymbol = useMemo(() => {
    if (signal) return buildPolygonSymbol(signal.currency_pair);
    const pair = findBestPair(currencies);
    return pair ? buildPolygonSymbol(pair) : null;
  }, [signal, currencies]);

  const { getQuote, isConnected } = useRealtimeMarket(polygonSymbol ? [polygonSymbol] : []);
  const quote = polygonSymbol ? getQuote(polygonSymbol) : null;

  const priceDiff = useMemo(() => {
    if (!signal || !quote?.price) return { percent: 0, isPositive: true, hasData: false };
    const diff = ((quote.price - signal.entry_price) / signal.entry_price) * 100;
    return { percent: diff, isPositive: diff >= 0, hasData: true };
  }, [quote?.price, signal]);

  // Don't render if no signal found or still loading
  if (loading || !signal) return null;

  const circlePercent = Math.min(100, Math.abs(priceDiff.percent) * 100);
  const isSm = size === 'sm';
  const circleSize = isSm ? 'w-10 h-10' : 'w-14 h-14';

  return (
    <div className={cn('relative flex-shrink-0', circleSize, className)} title={`vs ${signal.currency_pair} @ ${signal.entry_price}`}>
      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
        <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(200, 60%, 15%)" strokeWidth="3" />
        <circle
          cx="18" cy="18" r="14" fill="none"
          stroke={priceDiff.hasData
            ? priceDiff.isPositive ? 'hsl(135, 70%, 50%)' : 'hsl(0, 70%, 55%)'
            : 'hsl(200, 60%, 35%)'}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${circlePercent * 0.88} ${100 * 0.88}`}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn(
          "font-bold transition-colors duration-300",
          isSm ? "text-[9px]" : "text-[11px]",
          !priceDiff.hasData ? "text-cyan-300/60" :
          priceDiff.isPositive ? "text-green-400" : "text-red-400"
        )}>
          {priceDiff.hasData
            ? `${priceDiff.isPositive ? '+' : ''}${priceDiff.percent.toFixed(2)}%`
            : '—'}
        </span>
      </div>
      {/* Live indicator dot */}
      {isConnected && priceDiff.hasData && (
        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400 shadow-[0_0_4px_hsl(135,80%,50%)]" />
      )}
    </div>
  );
}
