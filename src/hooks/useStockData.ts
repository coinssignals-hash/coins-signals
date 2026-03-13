import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StockProfile {
  symbol: string;
  companyName: string;
  currency: string;
  exchange: string;
  industry: string;
  sector: string;
  description: string;
  image: string;
  mktCap: number;
  price: number;
  changes: number;
  changesPercentage: number;
  beta: number;
  volAvg: number;
  ceo: string;
  website: string;
  country: string;
  ipoDate: string;
  fullTimeEmployees: string;
}

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  changesPercentage: number;
  change: number;
  dayLow: number;
  dayHigh: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number;
  volume: number;
  avgVolume: number;
  open: number;
  previousClose: number;
  eps: number;
  pe: number;
  exchange: string;
  timestamp: number;
}

export interface HistoricalPrice {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  changePercent: number;
}

export interface SearchResult {
  symbol: string;
  name: string;
  currency: string;
  stockExchange: string;
  exchangeShortName: string;
}

async function fmpFetch(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('fmp-data', { body });
  if (error) throw error;
  return data;
}

async function stockAnalysisFetch(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('stock-analysis', { body });
  if (error) throw error;
  return data;
}

export function useStockSearch(query: string) {
  return useQuery({
    queryKey: ['stock-search', query],
    queryFn: () => fmpFetch({ action: 'search', symbol: query, limit: 10 }),
    enabled: query.length >= 2,
    staleTime: 60_000,
    select: (data: SearchResult[]) => data?.filter(r => r.exchangeShortName && !r.exchangeShortName.includes('CRYPTO')),
  });
}

export function useStockProfile(symbol: string) {
  return useQuery({
    queryKey: ['stock-profile', symbol],
    queryFn: () => fmpFetch({ action: 'profile', symbol }),
    enabled: !!symbol,
    staleTime: 5 * 60_000,
    select: (data: StockProfile[]) => data?.[0],
  });
}

export function useStockQuote(symbol: string) {
  return useQuery({
    queryKey: ['stock-quote', symbol],
    queryFn: () => fmpFetch({ action: 'quote', symbol }),
    enabled: !!symbol,
    staleTime: 30_000,
    refetchInterval: 30_000,
    select: (data: StockQuote[]) => data?.[0],
  });
}

export function useStockHistorical(symbol: string, period: string = '3m') {
  const { from, to, limit } = (() => {
    const now = new Date();
    const toStr = now.toISOString().slice(0, 10);
    const d = new Date(now);
    let lim = 90;
    switch (period) {
      case '1w': d.setDate(d.getDate() - 7); lim = 7; break;
      case '1m': d.setMonth(d.getMonth() - 1); lim = 30; break;
      case '3m': d.setMonth(d.getMonth() - 3); lim = 90; break;
      case '1y': d.setFullYear(d.getFullYear() - 1); lim = 365; break;
      case '5y': d.setFullYear(d.getFullYear() - 5); lim = 1260; break;
      default: d.setMonth(d.getMonth() - 3); break;
    }
    return { from: d.toISOString().slice(0, 10), to: toStr, limit: lim };
  })();

  return useQuery({
    queryKey: ['stock-historical', symbol, period],
    queryFn: () => fmpFetch({ action: 'historical', symbol, from, to }),
    enabled: !!symbol,
    staleTime: 5 * 60_000,
    select: (data: { historical?: HistoricalPrice[] }) => data?.historical?.slice(0, limit)?.reverse() ?? [],
  });
}

// ---- Financial Statements ----
export function useStockFinancials(symbol: string) {
  return useQuery({
    queryKey: ['stock-financials', symbol],
    queryFn: async () => {
      const [income, balance, cashFlow] = await Promise.all([
        fmpFetch({ action: 'income-statement', symbol, limit: 5 }),
        fmpFetch({ action: 'balance-sheet', symbol, limit: 5 }),
        fmpFetch({ action: 'cash-flow', symbol, limit: 5 }),
      ]);
      return { income: income || [], balance: balance || [], cashFlow: cashFlow || [] };
    },
    enabled: !!symbol,
    staleTime: 30 * 60_000,
  });
}

// ---- Technical Indicators ----
export function useStockTechnicals(symbol: string) {
  return useQuery({
    queryKey: ['stock-technicals', symbol],
    queryFn: () => stockAnalysisFetch({ action: 'technicals', symbol }),
    enabled: !!symbol,
    staleTime: 5 * 60_000,
  });
}

// ---- Sentiment Analysis ----
export function useStockSentiment(symbol: string) {
  return useQuery({
    queryKey: ['stock-sentiment', symbol],
    queryFn: () => stockAnalysisFetch({ action: 'sentiment', symbol }),
    enabled: !!symbol,
    staleTime: 5 * 60_000,
  });
}

// ---- Stock News ----
export function useStockNews(symbol: string) {
  return useQuery({
    queryKey: ['stock-news', symbol],
    queryFn: () => stockAnalysisFetch({ action: 'news', symbol }),
    enabled: !!symbol,
    staleTime: 3 * 60_000,
  });
}

// ---- AI Summary ----
export function useStockAISummary(symbol: string, language: string = 'es') {
  return useQuery({
    queryKey: ['stock-ai-summary', symbol, language],
    queryFn: () => stockAnalysisFetch({ action: 'ai-summary', symbol, language }),
    enabled: !!symbol,
    staleTime: 15 * 60_000,
    retry: 1,
  });
}
