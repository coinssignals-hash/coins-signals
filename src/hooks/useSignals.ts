import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, isBefore } from 'date-fns';

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
  stopLoss: number;
  support?: number;
  resistance?: number;
  sessionData?: { session: string; volume: string; volatility: string }[];
  analysisData?: { label: string; value: number }[];
  chartImageUrl?: string;
  closedPrice?: number;
  closedResult?: 'tp_hit' | 'sl_hit';
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
  stop_loss: number;
  support: number | null;
  resistance: number | null;
  session_data: unknown;
  analysis_data: unknown;
  chart_image_url: string | null;
  closed_price: number | null;
  closed_result: string | null;
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
  stopLoss: Number(dbSignal.stop_loss),
  support: dbSignal.support ? Number(dbSignal.support) : undefined,
  resistance: dbSignal.resistance ? Number(dbSignal.resistance) : undefined,
  sessionData: dbSignal.session_data as TradingSignal['sessionData'],
  analysisData: dbSignal.analysis_data as TradingSignal['analysisData'],
  chartImageUrl: dbSignal.chart_image_url ?? undefined,
  closedPrice: dbSignal.closed_price ? Number(dbSignal.closed_price) : undefined,
  closedResult: dbSignal.closed_result as TradingSignal['closedResult'],
});

export function useSignals(selectedDate?: string) {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSignals = async () => {
      setLoading(true);
      setError(null);

      try {
        let query = supabase
          .from('trading_signals')
          .select('*')
          .order('datetime', { ascending: false });

        if (selectedDate) {
          const dateStart = startOfDay(new Date(selectedDate)).toISOString();
          const dateEnd = endOfDay(new Date(selectedDate)).toISOString();
          query = query.gte('datetime', dateStart).lte('datetime', dateEnd);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) {
          throw fetchError;
        }

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
          
          // Update local state with deactivated status
          const deactivatedIds = new Set(ids);
          const updatedSignals = mappedSignals.map((s) =>
            deactivatedIds.has(s.id) ? { ...s, status: 'completed' as const } : s
          );
          setSignals(updatedSignals);
        } else {
          setSignals(mappedSignals);
        }
      } catch (err) {
        console.error('Error fetching signals:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar señales');
      } finally {
        setLoading(false);
      }
    };

    fetchSignals();

    // Set up realtime subscription
    const channel = supabase
      .channel('trading-signals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trading_signals',
        },
        (payload) => {
          console.log('Realtime update:', payload);

          if (payload.eventType === 'INSERT') {
            const newSignal = mapDbSignalToTradingSignal(payload.new as DbSignal);
            setSignals((prev) => [newSignal, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedSignal = mapDbSignalToTradingSignal(payload.new as DbSignal);
            setSignals((prev) =>
              prev.map((signal) =>
                signal.id === updatedSignal.id ? updatedSignal : signal
              )
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id;
            setSignals((prev) => prev.filter((signal) => signal.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDate]);

  return { signals, loading, error };
}
