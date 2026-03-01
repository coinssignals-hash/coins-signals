import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AutoCloseParams {
  signalId: string;
  currencyPair: string;
  action: 'BUY' | 'SELL';
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  status: string;
  currentPrice: number | null;
}

type CloseResult = 'tp_hit' | 'sl_hit';

/**
 * Monitors live price and auto-closes a signal when TP or SL is hit.
 * Updates the trading_signals table and sends push notifications.
 */
export function useSignalAutoClose({
  signalId,
  currencyPair,
  action,
  entryPrice,
  takeProfit,
  stopLoss,
  status,
  currentPrice,
}: AutoCloseParams) {
  const closingRef = useRef(false);

  const closeSignal = useCallback(async (price: number, result: CloseResult) => {
    if (closingRef.current) return;
    closingRef.current = true;

    console.log(`[AutoClose] Signal ${signalId} hit ${result} at price ${price}`);

    try {
      const { error } = await supabase
        .from('trading_signals')
        .update({
          status: 'completed',
          closed_price: price,
          closed_result: result,
        } as any)
        .eq('id', signalId);

      if (error) {
        console.error('[AutoClose] Failed to close signal:', error);
        closingRef.current = false;
        return;
      }

      // Send push notification
      supabase.functions.invoke('signal-closed-notify', {
        body: {
          currencyPair,
          closedResult: result,
          closedPrice: price,
          signalId,
        },
      }).then(({ error: notifError }) => {
        if (notifError) {
          console.error('[AutoClose] Push notification failed:', notifError);
        } else {
          console.log('[AutoClose] Push notification sent for', currencyPair, result);
        }
      });
    } catch (err) {
      console.error('[AutoClose] Error:', err);
      closingRef.current = false;
    }
  }, [signalId, currencyPair]);

  useEffect(() => {
    if (status === 'completed' || status === 'cancelled') return;
    if (!currentPrice || closingRef.current) return;

    const isBuy = action === 'BUY';

    if (isBuy && currentPrice >= takeProfit) {
      closeSignal(currentPrice, 'tp_hit');
      return;
    }
    if (!isBuy && currentPrice <= takeProfit) {
      closeSignal(currentPrice, 'tp_hit');
      return;
    }
    if (isBuy && currentPrice <= stopLoss) {
      closeSignal(currentPrice, 'sl_hit');
      return;
    }
    if (!isBuy && currentPrice >= stopLoss) {
      closeSignal(currentPrice, 'sl_hit');
      return;
    }
  }, [currentPrice, action, takeProfit, stopLoss, status, closeSignal]);

  useEffect(() => {
    closingRef.current = false;
  }, [signalId]);
}
