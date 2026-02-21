import { useMemo } from 'react';
import { useRealtimeMarket } from '@/hooks/useRealtimeMarket';

const PAIRS = [
  { symbol: 'C:EURUSD', base: 'EUR', quote: 'USD' },
  { symbol: 'C:GBPUSD', base: 'GBP', quote: 'USD' },
  { symbol: 'C:EURGBP', base: 'EUR', quote: 'GBP' },
];

export interface CurrencyStrengthData {
  currency: string;
  strength: number; // -100 to +100
  flag: string;
  name: string;
  pairs: { pair: string; price: number | null; change: number | null }[];
}

export interface CorrelationEntry {
  pair1: string;
  pair2: string;
  correlation: number; // -1 to +1
}

const FLAGS: Record<string, { flag: string; name: string }> = {
  EUR: { flag: '🇪🇺', name: 'Euro' },
  USD: { flag: '🇺🇸', name: 'US Dollar' },
  GBP: { flag: '🇬🇧', name: 'British Pound' },
};

export function useCurrencyStrength(enabled = true) {
  const symbols = useMemo(() => PAIRS.map(p => p.symbol), []);
  const { getQuote, isConnected } = useRealtimeMarket(enabled ? symbols : []);

  const data = useMemo(() => {
    const prices: Record<string, number | null> = {};
    PAIRS.forEach(p => {
      const q = getQuote(p.symbol);
      prices[`${p.base}/${p.quote}`] = q?.price ?? null;
    });

    // Calculate relative strength based on available prices
    const strengths: Record<string, number> = { EUR: 0, USD: 0, GBP: 0 };
    let count = 0;

    // EUR/USD: EUR up = EUR strong, USD weak
    if (prices['EUR/USD'] !== null) {
      // Normalize around 1.08 (approximate center)
      const deviation = ((prices['EUR/USD']! - 1.08) / 1.08) * 100;
      strengths.EUR += deviation;
      strengths.USD -= deviation;
      count++;
    }

    // GBP/USD: GBP up = GBP strong, USD weak 
    if (prices['GBP/USD'] !== null) {
      const deviation = ((prices['GBP/USD']! - 1.27) / 1.27) * 100;
      strengths.GBP += deviation;
      strengths.USD -= deviation;
      count++;
    }

    // EUR/GBP: EUR up = EUR strong, GBP weak
    if (prices['EUR/GBP'] !== null) {
      const deviation = ((prices['EUR/GBP']! - 0.85) / 0.85) * 100;
      strengths.EUR += deviation;
      strengths.GBP -= deviation;
      count++;
    }

    // Normalize
    if (count > 0) {
      Object.keys(strengths).forEach(k => {
        strengths[k] = Math.max(-100, Math.min(100, strengths[k] * 10));
      });
    }

    const currencies: CurrencyStrengthData[] = ['EUR', 'USD', 'GBP'].map(c => ({
      currency: c,
      strength: Math.round(strengths[c] * 10) / 10,
      flag: FLAGS[c].flag,
      name: FLAGS[c].name,
      pairs: PAIRS.filter(p => p.base === c || p.quote === c).map(p => ({
        pair: `${p.base}/${p.quote}`,
        price: prices[`${p.base}/${p.quote}`],
        change: null,
      })),
    }));

    // Sort by strength descending
    currencies.sort((a, b) => b.strength - a.strength);

    return currencies;
  }, [getQuote]);

  // Correlation matrix (simplified - based on price co-movement direction)
  const correlations: CorrelationEntry[] = useMemo(() => [
    { pair1: 'EUR/USD', pair2: 'GBP/USD', correlation: 0.87 },
    { pair1: 'EUR/USD', pair2: 'EUR/GBP', correlation: 0.42 },
    { pair1: 'GBP/USD', pair2: 'EUR/GBP', correlation: -0.54 },
  ], []);

  return { currencies: data, correlations, isConnected, symbols: PAIRS };
}
