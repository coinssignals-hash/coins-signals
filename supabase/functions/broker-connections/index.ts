import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple encryption using base64 encoding with a key-based XOR
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

// Test broker connection directly
async function testBrokerConnection(
  brokerCode: string,
  credentials: Record<string, string>,
  environment: string
): Promise<{ success: boolean; message: string; account_info: Record<string, unknown> | null }> {
  try {
    switch (brokerCode) {
      case 'alpaca': {
        const baseUrl = environment === 'live' 
          ? 'https://api.alpaca.markets' 
          : 'https://paper-api.alpaca.markets';
        
        const response = await fetch(`${baseUrl}/v2/account`, {
          headers: {
            'APCA-API-KEY-ID': credentials.api_key,
            'APCA-API-SECRET-KEY': credentials.api_secret,
          },
        });
        
        if (response.ok) {
          const account = await response.json();
          return {
            success: true,
            message: 'Conexión exitosa',
            account_info: {
              account_number: account.account_number,
              status: account.status,
              currency: account.currency,
              buying_power: account.buying_power,
              equity: account.equity,
            },
          };
        } else {
          const error = await response.json().catch(() => ({ message: 'Authentication failed' }));
          return {
            success: false,
            message: error.message || 'Credenciales inválidas',
            account_info: null,
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
          const account = data.accounts?.[0];
          return {
            success: true,
            message: 'Conexión exitosa',
            account_info: account ? {
              account_id: account.id,
              tags: account.tags,
            } : null,
          };
        } else {
          return {
            success: false,
            message: 'Token de API inválido',
            account_info: null,
          };
        }
      }
      
      case 'binance': {
        const baseUrl = environment === 'live' 
          ? 'https://api.binance.com' 
          : 'https://testnet.binance.vision';
        
        // Create signature for authenticated endpoint
        const timestamp = Date.now();
        const queryString = `timestamp=${timestamp}`;
        
        // HMAC-SHA256 signature
        const encoder = new TextEncoder();
        const keyData = encoder.encode(credentials.api_secret);
        const messageData = encoder.encode(queryString);
        
        const cryptoKey = await crypto.subtle.importKey(
          'raw',
          keyData,
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );
        
        const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
        const signatureHex = Array.from(new Uint8Array(signature))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        
        const response = await fetch(
          `${baseUrl}/api/v3/account?${queryString}&signature=${signatureHex}`,
          {
            headers: {
              'X-MBX-APIKEY': credentials.api_key,
            },
          }
        );
        
        if (response.ok) {
          const account = await response.json();
          // Calculate total balance
          const balances = account.balances?.filter((b: { free: string; locked: string }) => 
            parseFloat(b.free) > 0 || parseFloat(b.locked) > 0
          ) || [];
          
          return {
            success: true,
            message: 'Conexión exitosa',
            account_info: {
              account_type: account.accountType,
              can_trade: account.canTrade,
              can_withdraw: account.canWithdraw,
              can_deposit: account.canDeposit,
              assets_count: balances.length,
              permissions: account.permissions,
            },
          };
        } else {
          const error = await response.json().catch(() => ({ msg: 'Authentication failed' }));
          return {
            success: false,
            message: error.msg || 'API Key o Secret inválidos',
            account_info: null,
          };
        }
      }
      
      default:
        return {
          success: true,
          message: 'Credenciales guardadas. La conexión se verificará al operar.',
          account_info: null,
        };
    }
  } catch (err) {
    console.error('Broker test error:', err);
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Error de conexión',
      account_info: null,
    };
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

    // Parse body for POST/PUT requests
    let body: Record<string, unknown> = {};
    if (req.method === 'POST' || req.method === 'PUT') {
      body = await req.json();
    }

    const action = body.action as string | undefined;

    // TEST CONNECTION
    if (action === 'test') {
      const { connection_id, broker_code, credentials, environment } = body;
      
      let testCredentials = credentials as Record<string, string>;
      let brokerCode = broker_code as string;
      let testEnvironment = (environment as string) || 'demo';
      
      // If connection_id provided, get credentials from DB
      if (connection_id) {
        const { data: conn, error } = await supabase
          .from('user_broker_connections')
          .select(`
            *,
            broker:brokers(code)
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
        
        const encryptedStr = new TextDecoder().decode(conn.encrypted_credentials);
        testCredentials = decryptCredentials(encryptedStr, encryptionKey);
        brokerCode = conn.broker?.code;
        testEnvironment = conn.environment;
      }
      
      const testResult = await testBrokerConnection(brokerCode, testCredentials, testEnvironment);
      
      // Update connection status if connection_id provided
      if (connection_id) {
        await supabase
          .from('user_broker_connections')
          .update({
            is_connected: testResult.success,
            last_connected_at: testResult.success ? new Date().toISOString() : null,
            connection_error: testResult.success ? null : testResult.message,
          })
          .eq('id', connection_id);
      }
      
      return new Response(JSON.stringify(testResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // UPDATE CONNECTION
    if (action === 'update' || req.method === 'PUT') {
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
        const encryptedCreds = encryptCredentials(credentials as Record<string, string>, encryptionKey);
        updateData.encrypted_credentials = new TextEncoder().encode(encryptedCreds);
        updateData.is_connected = false;
      }
      
      const { data: connection, error } = await supabase
        .from('user_broker_connections')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select(`*, broker:brokers(id, code, display_name, logo_url)`)
        .single();
      
      if (error) throw error;
      
      return new Response(JSON.stringify({
        ...connection,
        encrypted_credentials: undefined,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // CREATE CONNECTION (POST without action)
    if (req.method === 'POST' && !action) {
      const { broker_id, connection_name, environment, credentials, config } = body;
      
      if (!broker_id || !connection_name || !credentials) {
        return new Response(JSON.stringify({ error: 'Campos requeridos: broker_id, connection_name, credentials' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get broker info for testing
      const { data: broker } = await supabase
        .from('brokers')
        .select('code')
        .eq('id', broker_id)
        .single();

      // Test connection before saving
      const testResult = await testBrokerConnection(
        broker?.code || '',
        credentials as Record<string, string>,
        (environment as string) || 'demo'
      );

      // Encrypt credentials
      const encryptedCreds = encryptCredentials(credentials as Record<string, string>, encryptionKey);
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
          is_connected: testResult.success,
          last_connected_at: testResult.success ? new Date().toISOString() : null,
          connection_error: testResult.success ? null : testResult.message,
        })
        .select(`*, broker:brokers(id, code, display_name, logo_url, auth_type)`)
        .single();
      
      if (error) {
        console.error('Error creating connection:', error);
        if (error.code === '23505') {
          return new Response(JSON.stringify({ error: 'Ya existe una conexión con este nombre' }), {
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
        details: { 
          broker_id, 
          connection_name, 
          environment,
          test_success: testResult.success,
        },
        success: true,
      });
      
      return new Response(JSON.stringify({
        ...connection,
        encrypted_credentials: undefined,
        test_result: testResult,
      }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET requests
    if (req.method === 'GET') {
      const { data: connections, error } = await supabase
        .from('user_broker_connections')
        .select(`*, broker:brokers(id, code, display_name, logo_url, auth_type, supported_assets)`)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const sanitized = connections?.map(c => ({
        ...c,
        encrypted_credentials: undefined,
        credentials_iv: undefined,
      }));
      
      return new Response(JSON.stringify(sanitized), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE
    if (req.method === 'DELETE') {
      const url = new URL(req.url);
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

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in broker-connections:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
