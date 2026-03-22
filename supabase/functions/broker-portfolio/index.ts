import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── bytea helpers ─────────────────────────────────────────────────────────

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

async function decryptCredentials(
  encryptedRaw: unknown,
  ivRaw: unknown,
  keyStr: string
): Promise<Record<string, string>> {
  try {
    const encB64 = unwrapByteaToBase64(encryptedRaw);
    const ivB64 = ivRaw ? unwrapByteaToBase64(ivRaw) : null;

    if (!ivB64) {
      const keyBytes = new TextEncoder().encode(keyStr);
      const encryptedBytes = Uint8Array.from(atob(encB64), c => c.charCodeAt(0));
      const decrypted = new Uint8Array(encryptedBytes.length);
      for (let i = 0; i < encryptedBytes.length; i++) {
        decrypted[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
      }
      return JSON.parse(new TextDecoder().decode(decrypted));
    }

    const rawKey = new TextEncoder().encode(keyStr);
    const keyHash = await crypto.subtle.digest('SHA-256', rawKey);
    const cryptoKey = await crypto.subtle.importKey(
      'raw', keyHash, { name: 'AES-GCM', length: 256 }, false, ['decrypt']
    );
    const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
    const encryptedData = Uint8Array.from(atob(encB64), c => c.charCodeAt(0));
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, encryptedData);
    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch (e) {
    console.error('Decryption error:', e);
    return {};
  }
}

// ─── Types ─────────────────────────────────────────────────────────────────

interface AccountData {
  connection_id: string;
  broker_code: string;
  broker_name: string;
  environment: string;
  cash_balance: number;
  equity: number;
  buying_power: number;
  unrealized_pnl: number;
  realized_pnl_today: number;
  margin_used: number;
  margin_available: number;
  currency: string;
  positions: Position[];
  last_updated: string;
  error?: string;
}

interface Position {
  symbol: string;
  quantity: number;
  average_entry_price: number;
  current_price: number;
  market_value: number;
  unrealized_pnl: number;
  unrealized_pnl_percent: number;
  side: 'long' | 'short';
  commission?: number;
  swap?: number;
  spread?: number;
}

// ─── MetaAPI WebSocket Client (Socket.IO over WS) ─────────────────────────
// Connects directly via WebSocket, bypassing REST TLS issues.

function generateRequestId(): string {
  return crypto.randomUUID();
}

/**
 * Opens a Socket.IO WebSocket to MetaAPI and sends a single RPC request.
 * Returns the response payload.
 */
async function metaApiWSRequest(
  metaApiToken: string,
  accountId: string,
  region: string,
  requestPayload: Record<string, unknown>,
  timeoutMs = 30000,
): Promise<Record<string, unknown>> {
  const wsUrl = `wss://mt-client-api-v1.${region}.agiliumtrade.agiliumtrade.ai/ws/?EIO=4&transport=websocket&auth-token=${metaApiToken}`;
  const requestId = generateRequestId();

  return new Promise((resolve, reject) => {
    let ws: WebSocket;
    let settled = false;
    let sioConnected = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        try { ws.close(); } catch { /* ok */ }
        reject(new Error('MetaAPI WebSocket timeout'));
      }
    }, timeoutMs);

    const settle = (fn: () => void) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        try { ws.close(); } catch { /* ok */ }
        fn();
      }
    };

    try {
      ws = new WebSocket(wsUrl);
    } catch (e) {
      clearTimeout(timer);
      reject(new Error(`WS connect error: ${e}`));
      return;
    }

    ws.onopen = () => {
      console.log('[metaapi-ws] Connected to', region);
    };

    ws.onmessage = (event) => {
      const raw = String(event.data);

      // Engine.IO packets: 0=open, 2=ping, 3=pong, 4=message
      if (raw === '2') {
        // Ping → Pong
        ws.send('3');
        return;
      }

      if (raw.startsWith('0')) {
        // Engine.IO open packet — ignore, wait for Socket.IO connect
        return;
      }

      // Socket.IO messages are prefixed with '4'
      if (!raw.startsWith('4')) return;

      const sioPayload = raw.slice(1);

      // Socket.IO connect confirmation: '0' after the '4' prefix
      if (sioPayload === '0' || sioPayload.startsWith('0{')) {
        sioConnected = true;
        // Send the RPC request as Socket.IO event: 42["request", {...}]
        const request = {
          ...requestPayload,
          accountId,
          requestId,
          application: 'RPC',
        };
        ws.send(`42${JSON.stringify(['request', request])}`);
        return;
      }

      // Socket.IO event: '2[eventName, data]'
      if (sioPayload.startsWith('2')) {
        try {
          const arr = JSON.parse(sioPayload.slice(1));
          if (!Array.isArray(arr) || arr.length < 2) return;

          const [eventName, data] = arr;

          if (eventName === 'response' && data?.requestId === requestId) {
            if (data.error) {
              settle(() => reject(new Error(`MetaAPI: ${data.error} (${data.numericCode || ''})`)));
            } else {
              settle(() => resolve(data));
            }
          }

          if (eventName === 'processingError' && data?.requestId === requestId) {
            settle(() => reject(new Error(`MetaAPI processing error: ${data.message || JSON.stringify(data)}`)));
          }
        } catch (e) {
          console.warn('[metaapi-ws] Parse error:', e);
        }
      }
    };

    ws.onerror = (e) => {
      console.error('[metaapi-ws] WS error:', e);
      settle(() => reject(new Error('MetaAPI WebSocket error')));
    };

    ws.onclose = () => {
      settle(() => reject(new Error('MetaAPI WebSocket closed before response')));
    };
  });
}

/**
 * Provisioning API (REST — works fine directly from edge runtime)
 */
async function metaApiProvisioningFetch(path: string, opts: RequestInit = {}): Promise<Response> {
  return fetch(`https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai${path}`, opts);
}

// ─── Broker-specific fetchers ──────────────────────────────────────────────

async function fetchAlpacaAccount(credentials: Record<string, string>, environment: string): Promise<Partial<AccountData>> {
  const baseUrl = environment === 'live'
    ? 'https://api.alpaca.markets'
    : 'https://paper-api.alpaca.markets';

  try {
    const accountRes = await fetch(`${baseUrl}/v2/account`, {
      headers: {
        'APCA-API-KEY-ID': credentials.api_key,
        'APCA-API-SECRET-KEY': credentials.api_secret,
      },
    });
    if (!accountRes.ok) throw new Error('Failed to fetch Alpaca account');
    const account = await accountRes.json();

    const positionsRes = await fetch(`${baseUrl}/v2/positions`, {
      headers: {
        'APCA-API-KEY-ID': credentials.api_key,
        'APCA-API-SECRET-KEY': credentials.api_secret,
      },
    });
    const positionsData = positionsRes.ok ? await positionsRes.json() : [];

    const positions: Position[] = positionsData.map((p: Record<string, unknown>) => ({
      symbol: p.symbol,
      quantity: Math.abs(parseFloat(p.qty as string)),
      average_entry_price: parseFloat(p.avg_entry_price as string),
      current_price: parseFloat(p.current_price as string),
      market_value: parseFloat(p.market_value as string),
      unrealized_pnl: parseFloat(p.unrealized_pl as string),
      unrealized_pnl_percent: parseFloat(p.unrealized_plpc as string) * 100,
      side: parseFloat(p.qty as string) >= 0 ? 'long' : 'short',
    }));

    return {
      cash_balance: parseFloat(account.cash),
      equity: parseFloat(account.equity),
      buying_power: parseFloat(account.buying_power),
      unrealized_pnl: parseFloat(account.equity) - parseFloat(account.last_equity),
      realized_pnl_today: 0,
      margin_used: parseFloat(account.initial_margin || '0'),
      margin_available: parseFloat(account.buying_power),
      currency: 'USD',
      positions,
    };
  } catch (error) {
    console.error('Alpaca fetch error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to fetch Alpaca data' };
  }
}

async function fetchOandaAccount(credentials: Record<string, string>, environment: string): Promise<Partial<AccountData>> {
  const baseUrl = environment === 'live'
    ? 'https://api-fxtrade.oanda.com'
    : 'https://api-fxpractice.oanda.com';

  try {
    const accountsRes = await fetch(`${baseUrl}/v3/accounts`, {
      headers: {
        'Authorization': `Bearer ${credentials.api_key}`,
        'Content-Type': 'application/json',
      },
    });
    if (!accountsRes.ok) throw new Error('Failed to fetch OANDA accounts');
    const accountsData = await accountsRes.json();
    const accountId = credentials.account_id || accountsData.accounts?.[0]?.id;
    if (!accountId) throw new Error('No OANDA account found');

    const accountRes = await fetch(`${baseUrl}/v3/accounts/${accountId}`, {
      headers: {
        'Authorization': `Bearer ${credentials.api_key}`,
        'Content-Type': 'application/json',
      },
    });
    if (!accountRes.ok) throw new Error('Failed to fetch OANDA account details');
    const { account } = await accountRes.json();

    const positions: Position[] = (account.positions || [])
      .filter((p: Record<string, unknown>) => {
        const long = p.long as Record<string, string> | undefined;
        const short = p.short as Record<string, string> | undefined;
        return long?.units !== '0' || short?.units !== '0';
      })
      .map((p: Record<string, unknown>) => {
        const long = p.long as Record<string, string> | undefined;
        const short = p.short as Record<string, string> | undefined;
        const longUnits = parseInt(long?.units || '0');
        const shortUnits = parseInt(short?.units || '0');
        const isLong = longUnits > 0;
        const units = isLong ? longUnits : Math.abs(shortUnits);
        const pl = isLong
          ? parseFloat(long?.unrealizedPL || '0')
          : parseFloat(short?.unrealizedPL || '0');
        const avgPrice = isLong
          ? parseFloat(long?.averagePrice || '0')
          : parseFloat(short?.averagePrice || '0');

        return {
          symbol: p.instrument as string,
          quantity: units,
          average_entry_price: avgPrice,
          current_price: avgPrice,
          market_value: units * avgPrice,
          unrealized_pnl: pl,
          unrealized_pnl_percent: avgPrice > 0 ? (pl / (units * avgPrice)) * 100 : 0,
          side: isLong ? 'long' : 'short',
        };
      });

    return {
      cash_balance: parseFloat(account.balance),
      equity: parseFloat(account.NAV),
      buying_power: parseFloat(account.marginAvailable || account.balance),
      unrealized_pnl: parseFloat(account.unrealizedPL || '0'),
      realized_pnl_today: parseFloat(account.pl || '0'),
      margin_used: parseFloat(account.marginUsed || '0'),
      margin_available: parseFloat(account.marginAvailable || '0'),
      currency: account.currency || 'USD',
      positions,
    };
  } catch (error) {
    console.error('OANDA fetch error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to fetch OANDA data' };
  }
}

// ─── MetaAPI via WebSocket (bypasses TLS issues) ──────────────────────────

async function fetchMetaApiAccount(credentials: Record<string, string>, config: Record<string, unknown>): Promise<Partial<AccountData>> {
  const metaApiToken = Deno.env.get('METAAPI_TOKEN');

  if (!metaApiToken) {
    return { error: 'MetaAPI token not configured' };
  }

  try {
    const login = credentials.mt5_login || credentials.mt_login || credentials.login;
    const password = credentials.mt5_password || credentials.mt_password || credentials.password;
    const server = credentials.mt5_server || credentials.mt_server || credentials.server;
    const platform = (config?.platform as string) || credentials.mt5_platform || 'mt5';

    console.log('[broker-portfolio] MT creds check:', { login: !!login, password: !!password, server: !!server });

    if (!login || !password || !server) {
      return { error: 'MT5 credentials incomplete' };
    }

    // Step 1: Find or provision (REST provisioning API — works directly)
    const listRes = await metaApiProvisioningFetch('/users/current/accounts', {
      headers: { 'auth-token': metaApiToken },
    });

    let accountId: string | null = null;
    let accountRegion = 'vint-hill';

    if (listRes.ok) {
      const accounts = await listRes.json();
      console.log('[broker-portfolio] MetaAPI accounts found:', accounts.length);
      const match = accounts.find((a: Record<string, unknown>) =>
        String(a.login) === String(login) && a.server === server
      );
      if (match) {
        accountId = match._id;
        accountRegion = String(match.region || 'vint-hill');
        console.log('[broker-portfolio] Matched:', accountId, 'region:', accountRegion, 'state:', match.state);
        if (match.state !== 'DEPLOYED') {
          await metaApiProvisioningFetch(`/users/current/accounts/${accountId}/deploy`, {
            method: 'POST',
            headers: { 'auth-token': metaApiToken },
          });
          await new Promise(r => setTimeout(r, 3000));
        }
      }
    } else {
      const errText = await listRes.text();
      console.error('[broker-portfolio] List accounts failed:', listRes.status, errText);
      return { error: `MetaAPI provisioning error: ${listRes.status}` };
    }

    if (!accountId) {
      const createRes = await metaApiProvisioningFetch('/users/current/accounts', {
        method: 'POST',
        headers: {
          'auth-token': metaApiToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${server}-${login}`,
          type: 'cloud',
          login: String(login),
          password,
          server,
          platform,
          magic: 0,
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.text();
        console.error('MetaAPI create error:', err);
        return { error: 'Failed to provision MetaAPI account' };
      }

      const created = await createRes.json();
      accountId = created.id;
      accountRegion = String(created.region || 'vint-hill');

      await metaApiProvisioningFetch(`/users/current/accounts/${accountId}/deploy`, {
        method: 'POST',
        headers: { 'auth-token': metaApiToken },
      });
      await new Promise(r => setTimeout(r, 5000));
    }

    console.log('[broker-portfolio] Fetching via WebSocket, region:', accountRegion);

    // Step 2: Get account info via WebSocket RPC
    const info = await metaApiWSRequest(
      metaApiToken, accountId!, accountRegion,
      { type: 'getAccountInformation' },
    );

    // Step 3: Get positions via WebSocket RPC
    let positionsData: Record<string, unknown>[] = [];
    try {
      const posResult = await metaApiWSRequest(
        metaApiToken, accountId!, accountRegion,
        { type: 'getPositions' },
      );
      positionsData = Array.isArray(posResult.positions) ? posResult.positions as Record<string, unknown>[] : [];
    } catch (posErr) {
      console.warn('[broker-portfolio] Positions error (non-fatal):', posErr);
    }

    const positions: Position[] = positionsData.map((p: Record<string, unknown>) => {
      const volume = Number(p.volume || 0);
      const openPrice = Number(p.openPrice || 0);
      const currentPrice = Number(p.currentPrice || 0);
      const profit = Number(p.profit || 0);
      const swap = Number(p.swap || 0);
      const commission = Number(p.commission || 0);
      const type = String(p.type || 'POSITION_TYPE_BUY');
      const isLong = type.includes('BUY');
      const marketValue = volume * currentPrice;
      const costBasis = volume * openPrice;
      const pnlPercent = costBasis > 0 ? (profit / costBasis) * 100 : 0;

      return {
        symbol: String(p.symbol || ''),
        quantity: volume,
        average_entry_price: openPrice,
        current_price: currentPrice,
        market_value: marketValue,
        unrealized_pnl: profit,
        unrealized_pnl_percent: pnlPercent,
        side: isLong ? 'long' as const : 'short' as const,
        swap,
        commission,
      };
    });

    const accountInfo = info.accountInformation as Record<string, unknown> || info;
    const balance = Number(accountInfo.balance || 0);
    const equity = Number(accountInfo.equity || 0);
    const margin = Number(accountInfo.margin || 0);
    const freeMargin = Number(accountInfo.freeMargin || 0);

    return {
      cash_balance: balance,
      equity,
      buying_power: freeMargin,
      unrealized_pnl: equity - balance,
      realized_pnl_today: Number(accountInfo.todayProfit || 0),
      margin_used: margin,
      margin_available: freeMargin,
      currency: String(accountInfo.currency || 'USD'),
      positions,
    };
  } catch (error) {
    console.error('MetaAPI WS error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to fetch MT5 data via WebSocket' };
  }
}

// ─── Main handler ──────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const encryptionKey = Deno.env.get('ENCRYPTION_KEY');
    if (!encryptionKey || encryptionKey === 'default-key') {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: connections, error: connError } = await supabase
      .from('user_broker_connections')
      .select(`*, broker:brokers(id, code, display_name)`)
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (connError) throw connError;

    if (!connections || connections.length === 0) {
      return new Response(JSON.stringify({
        accounts: [],
        summary: { total_equity: 0, total_cash: 0, total_unrealized_pnl: 0, total_realized_pnl: 0, total_positions: 0 },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const accountPromises = connections.map(async (conn): Promise<AccountData> => {
      const credentials = await decryptCredentials(conn.encrypted_credentials, conn.credentials_iv, encryptionKey);
      const brokerCode = conn.broker?.code;
      const config = (conn.config || {}) as Record<string, unknown>;

      let accountData: Partial<AccountData> = {};

      switch (brokerCode) {
        case 'alpaca':
          accountData = await fetchAlpacaAccount(credentials, conn.environment);
          break;
        case 'oanda':
          accountData = await fetchOandaAccount(credentials, conn.environment);
          break;
        case 'metatrader5':
        case 'metatrader4':
          accountData = await fetchMetaApiAccount(credentials, config);
          break;
        default:
          if (config.platform === 'mt5' || config.platform === 'mt4') {
            accountData = await fetchMetaApiAccount(credentials, config);
          } else {
            accountData = {
              error: `Broker "${brokerCode}" not supported`,
              cash_balance: 0, equity: 0, positions: [],
            };
          }
      }

      if (!accountData.error) {
        await supabase.from('account_snapshots').insert({
          user_id: user.id,
          connection_id: conn.id,
          cash_balance: accountData.cash_balance || 0,
          equity: accountData.equity || 0,
          portfolio_value: accountData.equity || 0,
          buying_power: accountData.buying_power || 0,
          margin_used: accountData.margin_used || 0,
          margin_available: accountData.margin_available || 0,
          unrealized_pnl: accountData.unrealized_pnl || 0,
          realized_pnl_today: accountData.realized_pnl_today || 0,
          total_positions_count: accountData.positions?.length || 0,
          snapshot_data: accountData,
        });

        await supabase
          .from('user_broker_connections')
          .update({ last_sync_at: new Date().toISOString(), is_connected: true })
          .eq('id', conn.id);
      }

      return {
        connection_id: conn.id,
        broker_code: brokerCode || 'unknown',
        broker_name: conn.connection_name || conn.broker?.display_name || 'Unknown',
        environment: conn.environment,
        cash_balance: accountData.cash_balance || 0,
        equity: accountData.equity || 0,
        buying_power: accountData.buying_power || 0,
        unrealized_pnl: accountData.unrealized_pnl || 0,
        realized_pnl_today: accountData.realized_pnl_today || 0,
        margin_used: accountData.margin_used || 0,
        margin_available: accountData.margin_available || 0,
        currency: accountData.currency || 'USD',
        positions: accountData.positions || [],
        last_updated: new Date().toISOString(),
        error: accountData.error,
      };
    });

    const accounts = await Promise.all(accountPromises);

    const summary = accounts.reduce((acc, account) => {
      if (!account.error) {
        acc.total_equity += account.equity;
        acc.total_cash += account.cash_balance;
        acc.total_unrealized_pnl += account.unrealized_pnl;
        acc.total_realized_pnl += account.realized_pnl_today;
        acc.total_positions += account.positions.length;
      }
      return acc;
    }, {
      total_equity: 0, total_cash: 0, total_unrealized_pnl: 0,
      total_realized_pnl: 0, total_positions: 0,
    });

    return new Response(JSON.stringify({ accounts, summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in broker-portfolio:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
