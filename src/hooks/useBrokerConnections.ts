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

  const fetchBrokers = useCallback(async () => {
    if (!session?.access_token) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('broker-connections', {
        body: {},
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        method: 'GET',
      });
      
      // Fallback to direct query if edge function fails
      if (error) {
        const { data: directData, error: directError } = await supabase
          .from('brokers')
          .select('*')
          .eq('is_active', true)
          .order('display_name');
        
        if (directError) throw directError;
        setBrokers(directData || []);
        return;
      }
      
      setBrokers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching brokers:', err);
      // Try direct query as fallback
      try {
        const { data, error: directError } = await supabase
          .from('brokers')
          .select('*')
          .eq('is_active', true)
          .order('display_name');
        
        if (!directError) {
          setBrokers(data || []);
        }
      } catch {
        setError('Failed to load brokers');
      }
    }
  }, [session?.access_token]);

  const fetchConnections = useCallback(async () => {
    if (!user || !session?.access_token) return;
    
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
  }, [user, session?.access_token]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchBrokers(), fetchConnections()]);
      setLoading(false);
    };
    
    if (user && session) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user, session, fetchBrokers, fetchConnections]);

  const createConnection = async (
    brokerId: string,
    connectionName: string,
    environment: 'demo' | 'live',
    credentials: ConnectionCredentials,
    config?: Record<string, unknown>
  ): Promise<BrokerConnection | null> => {
    if (!session?.access_token || !user) {
      toast.error('You must be logged in to connect a broker');
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

      if (error) throw error;
      
      await fetchConnections();
      toast.success('Broker connected successfully');
      return data;
    } catch (err) {
      console.error('Error creating connection:', err);
      const message = err instanceof Error ? err.message : 'Failed to connect broker';
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
    if (!session?.access_token) {
      return { success: false, message: 'Not authenticated' };
    }

    try {
      const { data, error } = await supabase.functions.invoke('broker-connections/test', {
        body: {
          connection_id: connectionId,
          broker_code: brokerCode,
          credentials,
          environment,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      
      if (connectionId) {
        await fetchConnections();
      }
      
      return data;
    } catch (err) {
      console.error('Error testing connection:', err);
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Connection test failed',
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
      toast.error('Not authenticated');
      return false;
    }

    try {
      const { error } = await supabase.functions.invoke('broker-connections', {
        body: { id: connectionId, ...updates },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        method: 'PUT',
      });

      if (error) throw error;
      
      await fetchConnections();
      toast.success('Connection updated');
      return true;
    } catch (err) {
      console.error('Error updating connection:', err);
      toast.error('Failed to update connection');
      return false;
    }
  };

  const deleteConnection = async (connectionId: string): Promise<boolean> => {
    if (!session?.access_token) {
      toast.error('Not authenticated');
      return false;
    }

    try {
      const { error } = await supabase
        .from('user_broker_connections')
        .delete()
        .eq('id', connectionId)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      setConnections(prev => prev.filter(c => c.id !== connectionId));
      toast.success('Connection removed');
      return true;
    } catch (err) {
      console.error('Error deleting connection:', err);
      toast.error('Failed to remove connection');
      return false;
    }
  };

  return {
    brokers,
    connections,
    loading,
    error,
    createConnection,
    testConnection,
    updateConnection,
    deleteConnection,
    refetch: () => Promise.all([fetchBrokers(), fetchConnections()]),
  };
}
