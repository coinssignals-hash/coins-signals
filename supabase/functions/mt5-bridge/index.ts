import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Decrypt MT5 credentials ───────────────────────────────────────────────

async function decryptCredentials(encryptedB64: string, ivB64: string | null, keyBase64: string): Promise<Record<string, string>> {
  try {
    if (!ivB64) {
      const keyBytes = new TextEncoder().encode(keyBase64);
      const encryptedBytes = Uint8Array.from(atob(encryptedB64), c => c.charCodeAt(0));
      const decrypted = new Uint8Array(encryptedBytes.length);
      for (let i = 0; i < encryptedBytes.length; i++) {
        decrypted[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
      }
      return JSON.parse(new TextDecoder().decode(decrypted));
    }
    const rawKey = new TextEncoder().encode(keyBase64);
    const keyHash = await crypto.subtle.digest('SHA-256', rawKey);
    const cryptoKey = await crypto.subtle.importKey('raw', keyHash, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
    const encryptedData = Uint8Array.from(atob(encryptedB64), c => c.charCodeAt(0));
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, encryptedData);
    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch {
    return {};
  }
}

// ─── MetaAPI MT4/MT5 bridge ────────────────────────────────────────────────

interface MT5Trade {
  external_trade_id: string;
  symbol: string;
  side: string;
  quantity: number;
  entry_price: number;
  exit_price: number | null;
  entry_time: string;
  exit_time: string | null;
  commission: number;
  swap: number;
  profit: number;
  status: string;
  notes: string;
}

// Provision a MetaAPI account for an MT4/MT5 login
async function provisionMetaApiAccount(
  metaApiToken: string,
  server: string,
  login: string,
  password: string,
  platform: 'mt4' | 'mt5',
  brokerCode: string,
): Promise<string> {
  // Check if account already exists for this login+server
  const listRes = await fetch('https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts', {
    headers: { 'auth-token': metaApiToken },
  });

  if (listRes.ok) {
    const accounts = await listRes.json();
    const existing = accounts.find(
      (a: any) => a.login === login && a.server === server && a.state !== 'DELETED'
    );
    if (existing) return existing._id;
  }

  // Create new account
  const createRes = await fetch('https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts', {
    method: 'POST',
    headers: {
      'auth-token': metaApiToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `${brokerCode}-${login}`,
      type: 'cloud',
      login,
      password,
      server,
      platform,
      magic: 0,
      quoteStreamingIntervalInSeconds: 0,
      reliability: 'regular',
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`MetaAPI provision failed (${createRes.status}): ${err}`);
  }

  const created = await createRes.json();
  return created.id || created._id;
}

// Wait for MetaAPI account to deploy and connect
async function waitForConnection(metaApiToken: string, accountId: string, maxWaitMs = 60000): Promise<void> {
  // Deploy
  await fetch(`https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts/${accountId}/deploy`, {
    method: 'POST',
    headers: { 'auth-token': metaApiToken },
  });

  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const res = await fetch(`https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts/${accountId}`, {
      headers: { 'auth-token': metaApiToken },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.connectionStatus === 'CONNECTED' || data.state === 'DEPLOYED') {
        return;
      }
    }
    await new Promise(r => setTimeout(r, 3000));
  }
  throw new Error('MetaAPI: Timeout esperando conexión MT5. Verifica servidor y credenciales.');
}

// Fetch history from MetaAPI
async function fetchMT5History(metaApiToken: string, accountId: string): Promise<{ trades: MT5Trade[]; account: Record<string, unknown> }> {
  const baseUrl = `https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts/${accountId}`;
  const headers = { 'auth-token': metaApiToken };

  // Account info
  const accRes = await fetch(`${baseUrl}/account-information`, { headers });
  const accInfo = accRes.ok ? await accRes.json() : {};

  // History deals (last 90 days)
  const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const endDate = new Date().toISOString();

  const histRes = await fetch(
    `${baseUrl}/history-deals/time/${startDate}/${endDate}?limit=1000`,
    { headers }
  );
  const deals = histRes.ok ? await histRes.json() : [];

  const trades: MT5Trade[] = (Array.isArray(deals) ? deals : [])
    .filter((d: any) => d.type === 'DEAL_TYPE_BUY' || d.type === 'DEAL_TYPE_SELL')
    .filter((d: any) => d.entryType !== 'DEAL_ENTRY_IN' || d.profit !== 0) // skip partial entries with no PnL
    .map((d: any) => ({
      external_trade_id: String(d.id || d.positionId || d.orderId),
      symbol: d.symbol || '',
      side: d.type === 'DEAL_TYPE_BUY' ? 'buy' : 'sell',
      quantity: Math.abs(d.volume || 0),
      entry_price: d.price || 0,
      exit_price: d.entryType === 'DEAL_ENTRY_OUT' ? d.price : null,
      entry_time: d.time || new Date().toISOString(),
      exit_time: d.entryType === 'DEAL_ENTRY_OUT' ? d.time : null,
      commission: Math.abs(d.commission || 0),
      swap: d.swap || 0,
      profit: d.profit || 0,
      status: d.entryType === 'DEAL_ENTRY_OUT' ? 'closed' : 'open',
      notes: `Magic: ${d.magic || 0} | Comment: ${d.comment || ''}`,
    }));

  return {
    trades,
    account: {
      balance: accInfo.balance || 0,
      equity: accInfo.equity || 0,
      margin: accInfo.margin || 0,
      freeMargin: accInfo.freeMargin || 0,
      leverage: accInfo.leverage || 0,
      currency: accInfo.currency || 'USD',
      server: accInfo.server || '',
      platform: accInfo.platform || 'mt5',
    },
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const encryptionKey = Deno.env.get('ENCRYPTION_KEY');
    const metaApiToken = Deno.env.get('METAAPI_TOKEN');

    if (!encryptionKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error: encryption key missing' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!metaApiToken) {
      return new Response(JSON.stringify({ 
        error: 'MetaAPI no configurado. Contacta al administrador para habilitar la sincronización MT4/MT5.',
        needs_config: true,
      }), {
        status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { connection_id } = body;

    if (!connection_id) {
      return new Response(JSON.stringify({ error: 'connection_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get connection
    const { data: conn, error: connError } = await supabase
      .from('user_broker_connections')
      .select(`*, broker:brokers(code, display_name)`)
      .eq('id', connection_id)
      .eq('user_id', user.id)
      .single();

    if (connError || !conn) {
      return new Response(JSON.stringify({ error: 'Connection not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Decrypt credentials (mt5_server, mt5_login, mt5_password, mt5_platform)
    // bytea columns: stored as hex of JSON {"0":byteVal,...} wrapping UTF-8 of base64
    function unwrapByteaToBase64(raw: unknown): string {
      if (!raw) return '';
      const s = String(raw);
      let text = s;
      if (s.startsWith('\\x')) {
        const hex = s.slice(2);
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
          bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
        }
        text = new TextDecoder().decode(bytes);
      }
      if (text.startsWith('{"') && text.includes('"0":')) {
        try {
          const obj = JSON.parse(text) as Record<string, number>;
          const keys = Object.keys(obj).map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b);
          const bytes = new Uint8Array(keys.length);
          for (let i = 0; i < keys.length; i++) {
            bytes[i] = obj[String(keys[i])];
          }
          return new TextDecoder().decode(bytes);
        } catch { /* fall through */ }
      }
      return text;
    }

    const encryptedStr = unwrapByteaToBase64(conn.encrypted_credentials);
    const ivStr = conn.credentials_iv ? unwrapByteaToBase64(conn.credentials_iv) : null;

    const credentials = await decryptCredentials(encryptedStr, ivStr, encryptionKey);

    console.log('[mt5-bridge] Credential keys found:', Object.keys(credentials));

    if (!credentials.mt5_server || !credentials.mt5_login || !credentials.mt5_password) {
      return new Response(JSON.stringify({ error: 'Credenciales MT4/MT5 incompletas. Reconecta tu cuenta.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const platform = (credentials.mt5_platform || 'mt5') as 'mt4' | 'mt5';
    const brokerCode = conn.broker?.code || 'unknown';

    // 1. Provision MetaAPI account
    const metaAccountId = await provisionMetaApiAccount(
      metaApiToken,
      credentials.mt5_server,
      credentials.mt5_login,
      credentials.mt5_password,
      platform,
      brokerCode,
    );

    // 2. Wait for connection
    await waitForConnection(metaApiToken, metaAccountId);

    // 3. Fetch history
    const { trades, account } = await fetchMT5History(metaApiToken, metaAccountId);

    // 4. Upsert trades
    let imported = 0;
    let duplicates = 0;
    const batchId = `mt5_${brokerCode}_${Date.now()}`;

    if (trades.length > 0) {
      const chunks: MT5Trade[][] = [];
      for (let i = 0; i < trades.length; i += 50) {
        chunks.push(trades.slice(i, i + 50));
      }

      for (const chunk of chunks) {
        const rows = chunk.map(t => ({
          user_id: user.id,
          broker_source: brokerCode,
          connection_id,
          external_trade_id: t.external_trade_id,
          symbol: t.symbol,
          side: t.side,
          quantity: t.quantity,
          entry_price: t.entry_price,
          exit_price: t.exit_price,
          entry_time: t.entry_time,
          exit_time: t.exit_time,
          commission: t.commission,
          swap: t.swap,
          profit: t.profit,
          status: t.status,
          notes: t.notes,
          import_batch_id: batchId,
        }));

        const { data, error } = await supabase
          .from('imported_trades')
          .upsert(rows, { onConflict: 'user_id,broker_source,external_trade_id', ignoreDuplicates: true })
          .select('id');

        if (!error) {
          imported += (data?.length || 0);
          duplicates += chunk.length - (data?.length || 0);
        }
      }
    }

    // 5. Update connection
    await supabase
      .from('user_broker_connections')
      .update({
        is_connected: true,
        last_sync_at: new Date().toISOString(),
        connection_error: null,
      })
      .eq('id', connection_id);

    // 6. Audit
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'mt5_bridge_sync',
      resource_type: 'imported_trades',
      resource_id: connection_id,
      details: { broker: brokerCode, platform, imported, duplicates, total_fetched: trades.length },
      success: true,
    });

    return new Response(JSON.stringify({
      success: true,
      broker: brokerCode,
      broker_name: conn.broker?.display_name,
      platform,
      imported,
      duplicates,
      total_fetched: trades.length,
      account,
      batch_id: batchId,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('MT5 Bridge error:', err);
    const message = err instanceof Error ? err.message : 'Error de sincronización MT5';

    if (message.includes('429') || message.toLowerCase().includes('rate limit')) {
      return new Response(JSON.stringify({ error: 'Rate limit. Reintenta en 60s.', retry_after: 60 }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (message.includes('401') || message.includes('auth') || message.includes('credentials')) {
      return new Response(JSON.stringify({ error: 'Credenciales MT5 inválidas. Verifica servidor, login y contraseña.', needs_reconnect: true }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
