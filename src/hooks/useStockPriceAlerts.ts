import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useEffect, useRef } from 'react';
import { playNotificationSound } from '@/utils/notificationSound';

export interface StockPriceAlert {
  id: string;
  user_id: string;
  symbol: string;
  symbol_name: string | null;
  target_price: number;
  direction: 'above' | 'below';
  is_triggered: boolean;
  triggered_at: string | null;
  created_at: string;
}

export function useStockPriceAlerts(symbol?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const alertsQuery = useQuery({
    queryKey: ['stock-price-alerts', user?.id, symbol],
    queryFn: async () => {
      let query = supabase
        .from('stock_price_alerts' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (symbol) {
        query = query.eq('symbol', symbol);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as StockPriceAlert[];
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const createAlert = useMutation({
    mutationFn: async (alert: { symbol: string; symbol_name?: string; target_price: number; direction: 'above' | 'below' }) => {
      const { data, error } = await supabase
        .from('stock_price_alerts' as any)
        .insert({
          user_id: user!.id,
          symbol: alert.symbol,
          symbol_name: alert.symbol_name || null,
          target_price: alert.target_price,
          direction: alert.direction,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-price-alerts'] });
      toast({ title: '🔔 Alerta creada', description: 'Recibirás una notificación cuando el precio alcance el nivel.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'No se pudo crear la alerta.', variant: 'destructive' });
    },
  });

  const deleteAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('stock_price_alerts' as any)
        .delete()
        .eq('id', alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-price-alerts'] });
      toast({ title: 'Alerta eliminada' });
    },
  });

  return {
    alerts: alertsQuery.data || [],
    isLoading: alertsQuery.isLoading,
    createAlert,
    deleteAlert,
  };
}

// Hook that monitors current price and triggers alerts
export function useStockAlertMonitor(symbol: string, currentPrice: number | undefined | null) {
  const { user } = useAuth();
  const { alerts } = useStockPriceAlerts(symbol);
  const queryClient = useQueryClient();
  const triggeredRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!currentPrice || !user || alerts.length === 0) return;

    const activeAlerts = alerts.filter(a => !a.is_triggered);

    for (const alert of activeAlerts) {
      if (triggeredRef.current.has(alert.id)) continue;

      const shouldTrigger =
        (alert.direction === 'above' && currentPrice >= alert.target_price) ||
        (alert.direction === 'below' && currentPrice <= alert.target_price);

      if (shouldTrigger) {
        triggeredRef.current.add(alert.id);

        // Mark as triggered in DB
        supabase
          .from('stock_price_alerts' as any)
          .update({ is_triggered: true, triggered_at: new Date().toISOString() } as any)
          .eq('id', alert.id)
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ['stock-price-alerts'] });
          });

        const dirLabel = alert.direction === 'above' ? 'superó' : 'cayó por debajo de';
        toast({
          title: `🚨 Alerta ${alert.symbol}`,
          description: `El precio ${dirLabel} $${alert.target_price.toFixed(2)} (actual: $${currentPrice.toFixed(2)})`,
          variant: 'destructive',
        });

        playNotificationSound(alert.direction === 'above' ? 'buy' : 'sell');
      }
    }
  }, [currentPrice, alerts, user, queryClient]);

  // Reset triggered ref when symbol changes
  useEffect(() => {
    triggeredRef.current = new Set();
  }, [symbol]);
}
