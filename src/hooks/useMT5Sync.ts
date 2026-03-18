import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { SyncResult } from './useBrokerSync';

export function useMT5Sync() {
  const { session } = useAuth();
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});

  const syncMT5 = useCallback(async (connectionId: string): Promise<SyncResult | null> => {
    if (!session?.access_token) {
      toast.error('Debes iniciar sesión para sincronizar');
      return null;
    }

    setSyncing(prev => ({ ...prev, [connectionId]: true }));

    try {
      const { data, error } = await supabase.functions.invoke('mt5-bridge', {
        body: { connection_id: connectionId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw new Error(error.message || 'Error de sincronización MT5');

      const result = data as SyncResult & { needs_config?: boolean };

      if (result.needs_config) {
        toast.error('Sincronización MT5 no disponible todavía. Contacta al administrador.');
        return null;
      }

      if (result.error) {
        if (result.needs_reconnect) {
          toast.error('Credenciales MT5 inválidas. Reconecta tu cuenta.');
        } else if (result.retry_after) {
          toast.warning(`Rate limit. Reintenta en ${result.retry_after}s`);
        } else {
          toast.error(result.error);
        }
        return result;
      }

      if (result.imported > 0) {
        toast.success(`${result.imported} operaciones sincronizadas vía MT5 de ${result.broker_name}`);
      } else if (result.duplicates > 0) {
        toast.info('Sin nuevas operaciones (todo ya sincronizado)');
      } else {
        toast.info('Sincronización completa — sin operaciones encontradas');
      }

      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error de sincronización MT5';
      toast.error(msg);
      return null;
    } finally {
      setSyncing(prev => ({ ...prev, [connectionId]: false }));
    }
  }, [session?.access_token]);

  return {
    syncMT5,
    syncing,
    isSyncing: (id: string) => syncing[id] || false,
  };
}
