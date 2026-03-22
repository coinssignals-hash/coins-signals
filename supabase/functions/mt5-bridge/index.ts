import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Decrypt helpers ───────────────────────────────────────────────────────

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

// ─── MetaAPI via FastAPI proxy ─────────────────────────────────────────────

async function metaApiClientRequest(
  fastApiUrl: string,
  metaApiToken: string,
  accountId: string,
  region: string,
  endpoint: string,
): Promise<Record<string, unknown>> {
  const res = await fetch(`${fastApiUrl}/api/v1/metaapi/proxy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      account_id: accountId,
      region,
      endpoint,
      method: 'GET',
      meta_token: metaApiToken,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`FastAPI proxy error (${res.status}): ${errText}`);
  }

  const result = await res.json();
  if (result.error) {
    throw new Error(`MetaAPI error (${result.status}): ${result.body}`);
  }

  return result.data;
}

// ─── MetaAPI provisioning (REST — works directly) ──────────────────────────

async function provisionMetaApiAccount(
  metaApiToken: string,
  server: string,
  login: string,
  password: string,
  platform: 'mt4' | 'mt5',
  brokerCode: string,
): Promise<{ accountId: string; region: string }> {
  const listRes = await fetch('https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts', {
    headers: { 'auth-token': metaApiToken },
  });

  if (listRes.ok) {
    const accounts = await listRes.json();
    const existing = accounts.find(
      (a: any) => String(a.login) === String(login) && a.server === server && a.state !== 'DELETED'
    );
    if (existing) {
      return { accountId: existing._id, region: existing.region || 'vint-hill' };
    }
  } else {
    await listRes.text(); // consume body
  }

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
  return { accountId: created.id || created._id, region: created.region || 'vint-hill' };
}

async function waitForConnection(metaApiToken: string, accountId: string, maxWaitMs = 45000): Promise<void> {
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
    } else {
      await res.text();
    }
    await new Promise(r => setTimeout(r, 3000));
  }
  throw new Error('MetaAPI: Timeout esperando conexión MT5');
}

// ─── MT5 history via proxy ─────────────────────────────────────────────────

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

async function fetchMT5History(
  fastApiUrl: string,
  metaApiToken: string,
  accountId: string,
  region: string,
): Promise<{ trades: MT5Trade[]; account: Record<string, unknown> }> {
  // Account info via proxy
  let accInfo: Record<string, unknown> = {};
  try {
    accInfo = await metaApiClientRequest(fastApiUrl, metaApiToken, accountId, region, 'account-information');
  } catch (e) {
    console.warn('[mt5-bridge] Account info error:', e);
  }

  // History deals via proxy (last 90 days)
  const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const endDate = new Date().toISOString();

  let deals: Record<string, unknown>[] = [];
  try {
    const result = await metaApiClientRequest(
      fastApiUrl, metaApiToken, accountId, region,
      `history-deals/time/${startDate}/${endDate}?limit=1000`
    );
    deals = Array.isArray(result) ? result : [];
  } catch (e) {
    console.warn('[mt5-bridge] History error:', e);
  }

  const trades: MT5Trade[] = (Array.isArray(deals) ? deals : [])
    .filter((d: any) => d.type === 'DEAL_TYPE_BUY' || d.type === 'DEAL_TYPE_SELL')
    .filter((d: any) => d.entryType !== 'DEAL_ENTRY_IN' || d.profit !== 0)
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

// ─── Main handler ──────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const encryptionKey = Deno.env.get('ENCRYPTION_KEY');
    const metaApiToken = Deno.env.get('METAAPI_TOKEN');
    const fastApiUrl = Deno.env.get('FASTAPI_BASE_URL');

    if (!encryptionKey) {
      return new Response(JSON.stringify({ error: 'Encryption key missing' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!metaApiToken) {
      return new Response(JSON.stringify({ error: 'MetaAPI no configurado', needs_config: true }), {
        status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!fastApiUrl) {
      return new Response(JSON.stringify({ error: 'FastAPI proxy URL not configured' }), {
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

    const encryptedStr = unwrapByteaToBase64(conn.encrypted_credentials);
    const ivStr = conn.credentials_iv ? unwrapByteaToBase64(conn.credentials_iv) : null;
    const credentials = await decryptCredentials(encryptedStr, ivStr, encryptionKey);

    console.log('[mt5-bridge] Credential keys:', Object.keys(credentials));

    if (!credentials.mt5_server || !credentials.mt5_login || !credentials.mt5_password) {
      return new Response(JSON.stringify({ error: 'Credenciales MT4/MT5 incompletas' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const platform = (credentials.mt5_platform || 'mt5') as 'mt4' | 'mt5';
    const brokerCode = conn.broker?.code || 'unknown';

    // 1. Provision
    const { accountId: metaAccountId, region } = await provisionMetaApiAccount(
      metaApiToken, credentials.mt5_server, credentials.mt5_login,
      credentials.mt5_password, platform, brokerCode,
    );

    // 2. Wait for connection
    await waitForConnection(metaApiToken, metaAccountId);

    // 3. Fetch history via FastAPI proxy
    const { trades, account } = await fetchMT5History(fastApiUrl, metaApiToken, metaAccountId, region);

    // 4. Upsert trades
    let imported = 0;
    let duplicates = 0;
    const batchId = `mt5_${brokerCode}_${Date.now()}`;

    if (trades.length > 0) {
      for (let i = 0; i < trades.length; i += 50) {
        const chunk = trades.slice(i, i + 50);
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
      .update({ is_connected: true, last_sync_at: new Date().toISOString(), connection_error: null })
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
      return new Response(JSON.stringify({ error: 'Credenciales MT5 inválidas.', needs_reconnect: true }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
