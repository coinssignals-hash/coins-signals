import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface SyncResult {
  success: boolean;
  broker: string;
  broker_name: string;
  imported: number;
  duplicates: number;
  total_fetched: number;
  account?: Record<string, unknown>;
  error?: string;
  needs_reconnect?: boolean;
  retry_after?: number;
  csv_only?: boolean;
}

export function useBrokerSync() {
  const { session } = useAuth();
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  const [lastSync, setLastSync] = useState<Record<string, { time: Date; result: SyncResult }>>({});

  const syncBroker = useCallback(async (connectionId: string): Promise<SyncResult | null> => {
    if (!session?.access_token) {
      toast.error('Debes iniciar sesión para sincronizar');
      return null;
    }

    setSyncing(prev => ({ ...prev, [connectionId]: true }));

    try {
      const { data, error } = await supabase.functions.invoke('sync-broker-trades', {
        body: { connection_id: connectionId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) {
        throw new Error(error.message || 'Error de sincronización');
      }

      const result = data as SyncResult;

      if (result.error) {
        if (result.csv_only) {
          toast.info(result.error);
        } else if (result.needs_reconnect) {
          toast.error('Credenciales expiradas. Reconecta tu broker.');
        } else if (result.retry_after) {
          toast.warning(`Rate limit. Reintenta en ${result.retry_after}s`);
        } else {
          toast.error(result.error);
        }
        return result;
      }

      setLastSync(prev => ({
        ...prev,
        [connectionId]: { time: new Date(), result },
      }));

      if (result.imported > 0) {
        toast.success(`${result.imported} operaciones sincronizadas de ${result.broker_name}`);
      } else if (result.duplicates > 0) {
        toast.info('Sin nuevas operaciones');
      } else {
        toast.info('Sincronización completa — sin operaciones encontradas');
      }

      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error de sincronización';
      toast.error(msg);
      return null;
    } finally {
      setSyncing(prev => ({ ...prev, [connectionId]: false }));
    }
  }, [session?.access_token]);

  return {
    syncBroker,
    syncing,
    lastSync,
    isSyncing: (id: string) => syncing[id] || false,
  };
}
