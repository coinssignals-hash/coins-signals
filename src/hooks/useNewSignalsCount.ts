import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { playNotificationSound, SoundType } from '@/utils/notificationSound';

const LAST_SEEN_KEY = 'signals_last_seen_timestamp';
const SOUND_ENABLED_KEY = 'signals_sound_enabled';

interface SignalPayload {
  action?: string;
}

export function useNewSignalsCount() {
  const [newCount, setNewCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem(SOUND_ENABLED_KEY);
    return stored !== 'false'; // Default to true
  });
  const isFirstLoad = useRef(true);

  const getLastSeenTimestamp = useCallback(() => {
    const stored = localStorage.getItem(LAST_SEEN_KEY);
    return stored ? new Date(stored) : new Date(0);
  }, []);

  const markAsSeen = useCallback(() => {
    localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
    setNewCount(0);
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const newValue = !prev;
      localStorage.setItem(SOUND_ENABLED_KEY, String(newValue));
      return newValue;
    });
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
        (payload) => {
          setNewCount((prev) => prev + 1);
          
          // Play sound for new signals (not on first load)
          if (!isFirstLoad.current && soundEnabled) {
            const signalData = payload.new as SignalPayload;
            const action = signalData?.action?.toUpperCase();
            
            // Play different sound based on signal type
            let soundType: SoundType = 'signal';
            if (action === 'BUY') {
              soundType = 'buy';
            } else if (action === 'SELL') {
              soundType = 'sell';
            }
            
            playNotificationSound(soundType);
          }
        }
      )
      .subscribe();

    // Mark first load as complete after initial fetch
    isFirstLoad.current = false;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNewSignalsCount, soundEnabled]);

  return { newCount, markAsSeen, soundEnabled, toggleSound };
}
