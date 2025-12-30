import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const LAST_SEEN_KEY = 'signals_last_seen_timestamp';

export function useNewSignalsCount() {
  const [newCount, setNewCount] = useState(0);

  const getLastSeenTimestamp = useCallback(() => {
    const stored = localStorage.getItem(LAST_SEEN_KEY);
    return stored ? new Date(stored) : new Date(0);
  }, []);

  const markAsSeen = useCallback(() => {
    localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
    setNewCount(0);
  }, []);

  const fetchNewSignalsCount = useCallback(async () => {
    const lastSeen = getLastSeenTimestamp();
    
    try {
      const { count, error } = await supabase
        .from('trading_signals')
        .select('*', { count: 'exact', head: true })
        .gt('created_at', lastSeen.toISOString());

      if (error) {
        console.error('Error fetching new signals count:', error);
        return;
      }

      setNewCount(count || 0);
    } catch (err) {
      console.error('Error fetching new signals count:', err);
    }
  }, [getLastSeenTimestamp]);

  useEffect(() => {
    fetchNewSignalsCount();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('new-signals-counter')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trading_signals',
        },
        () => {
          setNewCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNewSignalsCount]);

  return { newCount, markAsSeen };
}
