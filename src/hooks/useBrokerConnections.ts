import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Broker {
  id: string;
  code: string;
  display_name: string;
  description: string | null;
  logo_url: string | null;
  auth_type: string;
  supported_assets: string[];
  supported_order_types: string[];
  is_active: boolean;
}

export interface BrokerConnection {
  id: string;
  user_id: string;
  broker_id: string;
  connection_name: string;
  environment: string;
  config: unknown;
  is_active: boolean;
  is_connected: boolean;
  last_connected_at: string | null;
  last_sync_at: string | null;
  connection_error: string | null;
  created_at: string;
  broker?: Partial<Broker> | null;
}

export interface ConnectionCredentials {
  api_key?: string;
  api_secret?: string;
  account_id?: string;
  access_token?: string;
  refresh_token?: string;
}

export function useBrokerConnections() {
  const { user, session } = useAuth();
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [connections, setConnections] = useState<BrokerConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch available brokers (public - no auth required)
  const fetchBrokers = useCallback(async () => {
    try {
      const { data, error: queryError } = await supabase
        .from('brokers')
        .select('*')
        .eq('is_active', true)
        .order('display_name');
      
      if (queryError) throw queryError;
      setBrokers(data || []);
    } catch (err) {
      console.error('Error fetching brokers:', err);
      setError('Failed to load brokers');
    }
  }, []);

  // Fetch user connections (requires auth)
  const fetchConnections = useCallback(async () => {
    if (!user) {
      setConnections([]);
      return;
    }
    
    try {
      const { data, error: queryError } = await supabase
        .from('user_broker_connections')
        .select(`
          *,
          broker:brokers(id, code, display_name, logo_url, auth_type, supported_assets)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (queryError) throw queryError;
      setConnections(data || []);
    } catch (err) {
      console.error('Error fetching connections:', err);
      setError('Failed to load connections');
    }
  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      // Always fetch brokers (public data)
      await fetchBrokers();
      // Only fetch connections if user is authenticated
      if (user) {
        await fetchConnections();
      }
      setLoading(false);
    };
    
    loadData();
  }, [user, fetchBrokers, fetchConnections]);

  const createConnection = async (
    brokerId: string,
    connectionName: string,
    environment: 'demo' | 'live',
    credentials: ConnectionCredentials,
    config?: Record<string, unknown>
  ): Promise<BrokerConnection | null> => {
    if (!session?.access_token || !user) {
      toast.error('Debes iniciar sesión para conectar un broker');
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('broker-connections', {
        body: {
          broker_id: brokerId,
          connection_name: connectionName,
          environment,
          credentials,
          config,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Error al conectar broker');
      }
      
      if (data?.error) {
        throw new Error(data.error);
      }
      
      await fetchConnections();
      toast.success('¡Broker conectado exitosamente!');
      return data;
    } catch (err) {
      console.error('Error creating connection:', err);
      const message = err instanceof Error ? err.message : 'Error al conectar broker';
      toast.error(message);
      return null;
    }
  };

  const testConnection = async (
    connectionId?: string,
    brokerCode?: string,
    credentials?: ConnectionCredentials,
    environment?: 'demo' | 'live'
  ): Promise<{ success: boolean; message: string; account_info?: Record<string, unknown> }> => {
    // Allow testing without auth for preview
    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    try {
      // For non-authenticated users, we'll simulate the test
      if (!session?.access_token && credentials && brokerCode) {
        // Direct test to broker API
        return await testBrokerDirectly(brokerCode, credentials, environment || 'demo');
      }

      const { data, error } = await supabase.functions.invoke('broker-connections', {
        body: {
          action: 'test',
          connection_id: connectionId,
          broker_code: brokerCode,
          credentials,
          environment,
        },
        headers,
      });

      if (error) {
        console.error('Test connection error:', error);
        return {
          success: false,
          message: error.message || 'Error en la conexión',
        };
      }
      
      if (connectionId && data?.success) {
        await fetchConnections();
      }
      
      return data || { success: false, message: 'No response from server' };
    } catch (err) {
      console.error('Error testing connection:', err);
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Error al probar conexión',
      };
    }
  };

  // Direct test to broker API for preview mode
  const testBrokerDirectly = async (
    brokerCode: string,
    credentials: ConnectionCredentials,
    environment: 'demo' | 'live'
  ): Promise<{ success: boolean; message: string; account_info?: Record<string, unknown> }> => {
    try {
      switch (brokerCode) {
        case 'alpaca': {
          const baseUrl = environment === 'live' 
            ? 'https://api.alpaca.markets' 
            : 'https://paper-api.alpaca.markets';
          
          const response = await fetch(`${baseUrl}/v2/account`, {
            headers: {
              'APCA-API-KEY-ID': credentials.api_key || '',
              'APCA-API-SECRET-KEY': credentials.api_secret || '',
            },
          });
          
          if (response.ok) {
            const account = await response.json();
            return {
              success: true,
              message: '¡Conexión exitosa!',
              account_info: {
                account_number: account.account_number,
                status: account.status,
                currency: account.currency,
                buying_power: account.buying_power,
                equity: account.equity,
              },
            };
          } else {
            const errorData = await response.json().catch(() => ({}));
            return {
              success: false,
              message: errorData.message || 'Credenciales inválidas',
            };
          }
        }
        
        case 'oanda': {
          const baseUrl = environment === 'live'
            ? 'https://api-fxtrade.oanda.com'
            : 'https://api-fxpractice.oanda.com';
          
          const response = await fetch(`${baseUrl}/v3/accounts`, {
            headers: {
              'Authorization': `Bearer ${credentials.api_key}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            return {
              success: true,
              message: '¡Conexión exitosa!',
              account_info: data.accounts?.[0] ? {
                account_id: data.accounts[0].id,
              } : undefined,
            };
          } else {
            return {
              success: false,
              message: 'Token de API inválido',
            };
          }
        }
        
        case 'binance': {
          // For Binance, we need HMAC signature which requires crypto
          // In browser, we'll let the edge function handle this
          return {
            success: true,
            message: 'Credenciales recibidas. Usa "Guardar Conexión" para verificar con el servidor.',
          };
        }
        
        default:
          return {
            success: true,
            message: 'Credenciales guardadas. La conexión se verificará al operar.',
          };
      }
    } catch (err) {
      console.error('Direct broker test error:', err);
      return {
        success: false,
        message: 'Error de red. Verifica tu conexión.',
      };
    }
  };

  const updateConnection = async (
    connectionId: string,
    updates: Partial<{
      connection_name: string;
      environment: 'demo' | 'live';
      credentials: ConnectionCredentials;
      config: Record<string, unknown>;
      is_active: boolean;
    }>
  ): Promise<boolean> => {
    if (!session?.access_token) {
      toast.error('Debes iniciar sesión');
      return false;
    }

    try {
      const { error } = await supabase.functions.invoke('broker-connections', {
        body: { 
          action: 'update',
          id: connectionId, 
          ...updates 
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      
      await fetchConnections();
      toast.success('Conexión actualizada');
      return true;
    } catch (err) {
      console.error('Error updating connection:', err);
      toast.error('Error al actualizar conexión');
      return false;
    }
  };

  const deleteConnection = async (connectionId: string): Promise<boolean> => {
    if (!session?.access_token || !user) {
      toast.error('Debes iniciar sesión');
      return false;
    }

    try {
      const { error } = await supabase
        .from('user_broker_connections')
        .delete()
        .eq('id', connectionId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setConnections(prev => prev.filter(c => c.id !== connectionId));
      toast.success('Conexión eliminada');
      return true;
    } catch (err) {
      console.error('Error deleting connection:', err);
      toast.error('Error al eliminar conexión');
      return false;
    }
  };

  const refetch = useCallback(async () => {
    setLoading(true);
    await fetchBrokers();
    if (user) {
      await fetchConnections();
    }
    setLoading(false);
  }, [fetchBrokers, fetchConnections, user]);

  return {
    brokers,
    connections,
    loading,
    error,
    createConnection,
    testConnection,
    updateConnection,
    deleteConnection,
    refetch,
  };
}
