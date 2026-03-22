import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, isBefore } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { playNotificationSound } from '@/utils/notificationSound';

export interface TradingSignal {
  id: string;
  currencyPair: string;
  datetime: string;
  status: 'active' | 'pending' | 'completed' | 'cancelled';
  probability: number;
  trend: 'bullish' | 'bearish';
  action: 'BUY' | 'SELL';
  entryPrice: number;
  takeProfit: number;
  takeProfit2?: number;
  takeProfit3?: number;
  stopLoss: number;
  support?: number;
  resistance?: number;
  notes?: string;
  sessionData?: { session: string; volume: string; volatility: string }[];
  analysisData?: { label: string; value: number }[];
  chartImageUrl?: string;
  closedPrice?: number;
  closedResult?: 'tp_hit' | 'sl_hit';
  source?: 'server' | 'ai-center' | 'admin';
}

interface DbSignal {
  id: string;
  currency_pair: string;
  datetime: string;
  status: string;
  probability: number;
  trend: string;
  action: string;
  entry_price: number;
  take_profit: number;
  take_profit_2: number | null;
  take_profit_3: number | null;
  stop_loss: number;
  support: number | null;
  resistance: number | null;
  notes: string | null;
  session_data: unknown;
  analysis_data: unknown;
  chart_image_url: string | null;
  closed_price: number | null;
  closed_result: string | null;
  source: string | null;
}

const mapDbSignalToTradingSignal = (dbSignal: DbSignal): TradingSignal => ({
  id: dbSignal.id,
  currencyPair: dbSignal.currency_pair,
  datetime: dbSignal.datetime,
  status: dbSignal.status as TradingSignal['status'],
  probability: dbSignal.probability,
  trend: dbSignal.trend as TradingSignal['trend'],
  action: dbSignal.action as TradingSignal['action'],
  entryPrice: Number(dbSignal.entry_price),
  takeProfit: Number(dbSignal.take_profit),
  takeProfit2: dbSignal.take_profit_2 ? Number(dbSignal.take_profit_2) : undefined,
  takeProfit3: dbSignal.take_profit_3 ? Number(dbSignal.take_profit_3) : undefined,
  stopLoss: Number(dbSignal.stop_loss),
  support: dbSignal.support ? Number(dbSignal.support) : undefined,
  resistance: dbSignal.resistance ? Number(dbSignal.resistance) : undefined,
  notes: dbSignal.notes ?? undefined,
  sessionData: dbSignal.session_data as TradingSignal['sessionData'],
  analysisData: dbSignal.analysis_data as TradingSignal['analysisData'],
  chartImageUrl: dbSignal.chart_image_url ?? undefined,
  closedPrice: dbSignal.closed_price ? Number(dbSignal.closed_price) : undefined,
  closedResult: dbSignal.closed_result as TradingSignal['closedResult'],
  source: (dbSignal.source as TradingSignal['source']) ?? 'server',
});

async function fetchSignals(selectedDate?: string): Promise<TradingSignal[]> {
  let query = supabase
    .from('trading_signals')
    .select('*')
    .order('datetime', { ascending: false });

  if (selectedDate) {
    const dateStart = startOfDay(new Date(selectedDate)).toISOString();
    const dateEnd = endOfDay(new Date(selectedDate)).toISOString();
    query = query.gte('datetime', dateStart).lte('datetime', dateEnd);
  }

  const { data, error } = await query;
  if (error) throw error;

  const mappedSignals = (data || []).map(mapDbSignalToTradingSignal);

  // Auto-deactivate signals from previous days that are still active/pending
  const today = startOfDay(new Date());
  const signalsToDeactivate = mappedSignals.filter(
    (s) => (s.status === 'active' || s.status === 'pending') && isBefore(new Date(s.datetime), today)
  );

  if (signalsToDeactivate.length > 0) {
    const ids = signalsToDeactivate.map((s) => s.id);
    await supabase
      .from('trading_signals')
      .update({ status: 'completed' })
      .in('id', ids);

    const deactivatedIds = new Set(ids);
    return mappedSignals.map((s) =>
      deactivatedIds.has(s.id) ? { ...s, status: 'completed' as const } : s
    );
  }

  return mappedSignals;
}

export const signalKeys = {
  all: ['signals'] as const,
  list: (date?: string) => [...signalKeys.all, 'list', date] as const,
};

export function useSignals(selectedDate?: string) {
  const queryClient = useQueryClient();

  const { data: signals = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: signalKeys.list(selectedDate),
    queryFn: () => fetchSignals(selectedDate),
    staleTime: 2 * 60 * 1000, // 2 min
    gcTime: 15 * 60 * 1000,   // 15 min
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev, // keepPreviousData
  });

  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Error al cargar señales') : null;

  // Track if initial data has loaded to avoid toasting on first render
  const initialLoadRef = useRef(true);
  useEffect(() => {
    if (!loading) {
      // Delay clearing so we skip the first realtime event if it fires immediately
      const timer = setTimeout(() => { initialLoadRef.current = false; }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Realtime subscription for live updates + in-app toast notifications
  useEffect(() => {
    const channel = supabase
      .channel('trading-signals-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trading_signals' },
        (payload) => {
          console.log('Realtime update:', payload);

          queryClient.setQueryData<TradingSignal[]>(
            signalKeys.list(selectedDate),
            (old) => {
              if (!old) return old;

              if (payload.eventType === 'INSERT') {
                const newSignal = mapDbSignalToTradingSignal(payload.new as DbSignal);

                // Show in-app toast for new signals (skip initial load)
                if (!initialLoadRef.current) {
                  const actionText = newSignal.action === 'BUY' ? '🟢 COMPRAR' : '🔴 VENDER';
                  const soundType = newSignal.action === 'BUY' ? 'buy' as const : 'sell' as const;
                  playNotificationSound(soundType);
                  toast({
                    title: `📈 Nueva Señal: ${newSignal.currencyPair}`,
                    description: `${actionText} @ ${newSignal.entryPrice} · Probabilidad ${newSignal.probability}%`,
                    duration: 8000,
                  });
                }

                return [newSignal, ...old];
              } else if (payload.eventType === 'UPDATE') {
                const updatedSignal = mapDbSignalToTradingSignal(payload.new as DbSignal);

                // Notify when a signal is closed
                if (!initialLoadRef.current && updatedSignal.closedResult) {
                  const resultText = updatedSignal.closedResult === 'tp_hit' ? '✅ TP Alcanzado' : '❌ SL Tocado';
                  playNotificationSound(updatedSignal.closedResult === 'tp_hit' ? 'pattern_bullish' : 'pattern_bearish');
                  toast({
                    title: `${resultText}: ${updatedSignal.currencyPair}`,
                    description: `Cerrada @ ${updatedSignal.closedPrice}`,
                    duration: 6000,
                  });
                }

                return old.map((s) => s.id === updatedSignal.id ? updatedSignal : s);
              } else if (payload.eventType === 'DELETE') {
                const deletedId = (payload.old as { id: string }).id;
                return old.filter((s) => s.id !== deletedId);
              }
              return old;
            }
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedDate, queryClient]);

  return { signals, loading, error };
}
