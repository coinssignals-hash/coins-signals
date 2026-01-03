import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple encryption using base64 encoding with a key-based XOR
// In production, consider using Web Crypto API for AES encryption
function encryptCredentials(credentials: Record<string, string>, key: string): string {
  const json = JSON.stringify(credentials);
  const keyBytes = new TextEncoder().encode(key);
  const dataBytes = new TextEncoder().encode(json);
  const encrypted = new Uint8Array(dataBytes.length);
  
  for (let i = 0; i < dataBytes.length; i++) {
    encrypted[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  
  return btoa(String.fromCharCode(...encrypted));
}

function decryptCredentials(encrypted: string, key: string): Record<string, string> {
  try {
    const keyBytes = new TextEncoder().encode(key);
    const encryptedBytes = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
    const decrypted = new Uint8Array(encryptedBytes.length);
    
    for (let i = 0; i < encryptedBytes.length; i++) {
      decrypted[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch {
    return {};
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const encryptionKey = Deno.env.get('ENCRYPTION_KEY') || 'default-key-change-in-production';
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();
    
    // GET /broker-connections - List all brokers
    if (req.method === 'GET' && path === 'brokers') {
      const { data: brokers, error } = await supabase
        .from('brokers')
        .select('*')
        .eq('is_active', true)
        .order('display_name');
      
      if (error) throw error;
      
      return new Response(JSON.stringify(brokers), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /broker-connections - List user connections
    if (req.method === 'GET' && (path === 'broker-connections' || path === 'connections')) {
      const { data: connections, error } = await supabase
        .from('user_broker_connections')
        .select(`
          *,
          broker:brokers(id, code, display_name, logo_url, auth_type, supported_assets)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Don't return encrypted credentials
      const sanitized = connections?.map(c => ({
        ...c,
        encrypted_credentials: undefined,
        credentials_iv: undefined,
      }));
      
      return new Response(JSON.stringify(sanitized), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /broker-connections - Create new connection
    if (req.method === 'POST') {
      const body = await req.json();
      const { broker_id, connection_name, environment, credentials, config } = body;
      
      if (!broker_id || !connection_name || !credentials) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Encrypt credentials
      const encryptedCreds = encryptCredentials(credentials, encryptionKey);
      const encryptedBytes = new TextEncoder().encode(encryptedCreds);
      
      const { data: connection, error } = await supabase
        .from('user_broker_connections')
        .insert({
          user_id: user.id,
          broker_id,
          connection_name,
          environment: environment || 'demo',
          encrypted_credentials: encryptedBytes,
          config: config || {},
          is_active: true,
          is_connected: false,
        })
        .select(`
          *,
          broker:brokers(id, code, display_name, logo_url, auth_type)
        `)
        .single();
      
      if (error) {
        console.error('Error creating connection:', error);
        if (error.code === '23505') {
          return new Response(JSON.stringify({ error: 'Connection with this name already exists' }), {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        throw error;
      }

      // Log audit
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'broker_connection_created',
        resource_type: 'user_broker_connections',
        resource_id: connection.id,
        details: { broker_id, connection_name, environment },
        success: true,
      });
      
      return new Response(JSON.stringify({
        ...connection,
        encrypted_credentials: undefined,
        credentials_iv: undefined,
      }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /broker-connections/test - Test connection
    if (req.method === 'POST' && path === 'test') {
      const body = await req.json();
      const { connection_id, broker_code, credentials, environment } = body;
      
      // If connection_id provided, get credentials from DB
      let testCredentials = credentials;
      let brokerCode = broker_code;
      let testEnvironment = environment || 'demo';
      
      if (connection_id) {
        const { data: conn, error } = await supabase
          .from('user_broker_connections')
          .select(`
            *,
            broker:brokers(code, base_url_live, base_url_demo)
          `)
          .eq('id', connection_id)
          .eq('user_id', user.id)
          .single();
        
        if (error || !conn) {
          return new Response(JSON.stringify({ error: 'Connection not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        // Decrypt credentials
        const encryptedStr = new TextDecoder().decode(conn.encrypted_credentials);
        testCredentials = decryptCredentials(encryptedStr, encryptionKey);
        brokerCode = conn.broker?.code;
        testEnvironment = conn.environment;
      }
      
      // Test connection based on broker type
      let testResult = { success: false, message: '', account_info: null as Record<string, unknown> | null };
      
      try {
        switch (brokerCode) {
          case 'alpaca': {
            const baseUrl = testEnvironment === 'live' 
              ? 'https://api.alpaca.markets' 
              : 'https://paper-api.alpaca.markets';
            
            const response = await fetch(`${baseUrl}/v2/account`, {
              headers: {
                'APCA-API-KEY-ID': testCredentials.api_key,
                'APCA-API-SECRET-KEY': testCredentials.api_secret,
              },
            });
            
            if (response.ok) {
              const account = await response.json();
              testResult = {
                success: true,
                message: 'Connection successful',
                account_info: {
                  account_number: account.account_number,
                  status: account.status,
                  currency: account.currency,
                  buying_power: account.buying_power,
                  equity: account.equity,
                },
              };
            } else {
              const error = await response.json();
              testResult = {
                success: false,
                message: error.message || 'Authentication failed',
                account_info: null,
              };
            }
            break;
          }
          
          case 'oanda': {
            const baseUrl = testEnvironment === 'live'
              ? 'https://api-fxtrade.oanda.com'
              : 'https://api-fxpractice.oanda.com';
            
            const response = await fetch(`${baseUrl}/v3/accounts`, {
              headers: {
                'Authorization': `Bearer ${testCredentials.api_key}`,
                'Content-Type': 'application/json',
              },
            });
            
            if (response.ok) {
              const data = await response.json();
              const account = data.accounts?.[0];
              testResult = {
                success: true,
                message: 'Connection successful',
                account_info: account ? {
                  account_id: account.id,
                  tags: account.tags,
                } : null,
              };
            } else {
              testResult = {
                success: false,
                message: 'Authentication failed',
                account_info: null,
              };
            }
            break;
          }
          
          default:
            // For brokers without direct API test, simulate success
            testResult = {
              success: true,
              message: 'Credentials saved. Connection will be tested on first trade.',
              account_info: null,
            };
        }
        
        // Update connection status if connection_id provided
        if (connection_id && testResult.success) {
          await supabase
            .from('user_broker_connections')
            .update({
              is_connected: true,
              last_connected_at: new Date().toISOString(),
              connection_error: null,
            })
            .eq('id', connection_id);
        } else if (connection_id && !testResult.success) {
          await supabase
            .from('user_broker_connections')
            .update({
              is_connected: false,
              connection_error: testResult.message,
            })
            .eq('id', connection_id);
        }
        
      } catch (err) {
        console.error('Connection test error:', err);
        testResult = {
          success: false,
          message: err instanceof Error ? err.message : 'Connection test failed',
          account_info: null,
        };
      }
      
      return new Response(JSON.stringify(testResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE /broker-connections/:id
    if (req.method === 'DELETE') {
      const connectionId = url.searchParams.get('id');
      
      if (!connectionId) {
        return new Response(JSON.stringify({ error: 'Connection ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const { error } = await supabase
        .from('user_broker_connections')
        .delete()
        .eq('id', connectionId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Log audit
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'broker_connection_deleted',
        resource_type: 'user_broker_connections',
        resource_id: connectionId,
        success: true,
      });
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PUT /broker-connections - Update connection
    if (req.method === 'PUT') {
      const body = await req.json();
      const { id, connection_name, environment, credentials, config, is_active } = body;
      
      if (!id) {
        return new Response(JSON.stringify({ error: 'Connection ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const updateData: Record<string, unknown> = {};
      if (connection_name) updateData.connection_name = connection_name;
      if (environment) updateData.environment = environment;
      if (config) updateData.config = config;
      if (typeof is_active === 'boolean') updateData.is_active = is_active;
      
      if (credentials) {
        const encryptedCreds = encryptCredentials(credentials, encryptionKey);
        updateData.encrypted_credentials = new TextEncoder().encode(encryptedCreds);
        updateData.is_connected = false; // Require re-test after credential update
      }
      
      const { data: connection, error } = await supabase
        .from('user_broker_connections')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select(`
          *,
          broker:brokers(id, code, display_name, logo_url)
        `)
        .single();
      
      if (error) throw error;
      
      return new Response(JSON.stringify({
        ...connection,
        encrypted_credentials: undefined,
        credentials_iv: undefined,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in broker-connections:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
