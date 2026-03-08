import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';

interface AlertConfig {
  rsiOverbought: number;
  rsiOversold: number;
  enableRSI: boolean;
  enableMACD: boolean;
  enableSMACross: boolean;
  enableSupportResistance: boolean;
  srProximityPercent: number;
  srEnableSound: boolean;
  enablePatternAlerts: boolean;
  patternAlertTypes: { bullish: boolean; bearish: boolean; neutral: boolean };
  patternEnableSound: boolean;
  enableCalendarAlerts: boolean;
}

const DEFAULT_CONFIG: AlertConfig = {
  rsiOverbought: 70,
  rsiOversold: 30,
  enableRSI: false,
  enableMACD: false,
  enableSMACross: false,
  enableSupportResistance: false,
  srProximityPercent: 5,
  srEnableSound: true,
  enablePatternAlerts: false,
  patternAlertTypes: { bullish: true, bearish: true, neutral: false },
  patternEnableSound: true,
  enableCalendarAlerts: false,
};

export function useAlertConfig() {
  const { user } = useAuth();
  const [config, setConfig] = useState<AlertConfig>(DEFAULT_CONFIG);
  const [loaded, setLoaded] = useState(false);
  const debouncedConfig = useDebounce(config, 1000);
  const isFirstLoad = useRef(true);

  // Load config from DB
  useEffect(() => {
    if (!user) {
      setConfig(DEFAULT_CONFIG);
      setLoaded(true);
      return;
    }

    (async () => {
      const { data } = await (supabase as any)
        .from('user_alert_configs')
        .select('config')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data?.config) {
        setConfig({ ...DEFAULT_CONFIG, ...data.config });
      }
      setLoaded(true);
      isFirstLoad.current = false;
    })();
  }, [user]);

  // Save config to DB on changes (debounced)
  useEffect(() => {
    if (!user || !loaded || isFirstLoad.current) return;

    (async () => {
      // Upsert using user_id unique constraint
      await (supabase as any)
        .from('user_alert_configs')
        .upsert(
          { user_id: user.id, config: debouncedConfig },
          { onConflict: 'user_id' }
        );
    })();
  }, [debouncedConfig, user, loaded]);

  const updateConfig = useCallback((newConfig: AlertConfig) => {
    if (isFirstLoad.current) isFirstLoad.current = false;
    setConfig(newConfig);
  }, []);

  return { config, updateConfig, loaded };
}
