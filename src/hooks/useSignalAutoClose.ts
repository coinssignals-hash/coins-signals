import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AutoCloseParams {
  signalId: string;
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
 * Updates the trading_signals table with closed_price, closed_result, and status='completed'.
 */
export function useSignalAutoClose({
  signalId,
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
      }
    } catch (err) {
      console.error('[AutoClose] Error:', err);
      closingRef.current = false;
    }
  }, [signalId]);

  useEffect(() => {
    // Only monitor active/pending signals
    if (status === 'completed' || status === 'cancelled') return;
    if (!currentPrice || closingRef.current) return;

    const isBuy = action === 'BUY';

    // Check TP hit
    if (isBuy && currentPrice >= takeProfit) {
      closeSignal(currentPrice, 'tp_hit');
      return;
    }
    if (!isBuy && currentPrice <= takeProfit) {
      closeSignal(currentPrice, 'tp_hit');
      return;
    }

    // Check SL hit
    if (isBuy && currentPrice <= stopLoss) {
      closeSignal(currentPrice, 'sl_hit');
      return;
    }
    if (!isBuy && currentPrice >= stopLoss) {
      closeSignal(currentPrice, 'sl_hit');
      return;
    }
  }, [currentPrice, action, takeProfit, stopLoss, status, closeSignal]);

  // Reset ref when signal changes
  useEffect(() => {
    closingRef.current = false;
  }, [signalId]);
}
