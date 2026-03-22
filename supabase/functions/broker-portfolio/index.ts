import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Decode Supabase bytea to base64 string
function decodeBytea(raw: unknown): string {
  if (!raw) return '';
  
  // If it's already a string
  if (typeof raw === 'string') {
    // Supabase returns bytea as hex: \x4142...
    if (raw.startsWith('\\x')) {
      const hex = raw.slice(2);
      const bytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
      }
      return new TextDecoder().decode(bytes);
    }
    // Supabase JS client may serialize bytea as JSON object string: '{"0":53,"1":120,...}'
    if (raw.startsWith('{"0":')) {
      try {
        const obj = JSON.parse(raw) as Record<string, number>;
        const keys = Object.keys(obj).map(Number).sort((a, b) => a - b);
        const bytes = new Uint8Array(keys.length);
        for (let i = 0; i < keys.length; i++) {
          bytes[i] = obj[String(keys[i])];
        }
        return new TextDecoder().decode(bytes);
      } catch { /* fall through */ }
    }
    return raw;
  }
  
  // Handle object form { "0": byte, "1": byte, ... }
  if (typeof raw === 'object' && raw !== null && !(raw instanceof Uint8Array)) {
    const obj = raw as Record<string, number>;
    const keys = Object.keys(obj).map(Number).sort((a, b) => a - b);
    if (keys.length > 0) {
      const bytes = new Uint8Array(keys.length);
      for (let i = 0; i < keys.length; i++) {
        bytes[i] = obj[String(keys[i])];
      }
      return new TextDecoder().decode(bytes);
    }
  }
  
  if (raw instanceof Uint8Array) {
    return new TextDecoder().decode(raw);
  }
  
  return String(raw);
}

// Decrypt credentials (AES-256-GCM with XOR legacy fallback)
async function decryptCredentials(encryptedB64: string, ivB64: string | null, key: string): Promise<Record<string, string>> {
  try {
    // Legacy XOR decryption fallback (no IV means old format)
    if (!ivB64) {
      const keyBytes = new TextEncoder().encode(key);
      const encryptedBytes = Uint8Array.from(atob(encryptedB64), c => c.charCodeAt(0));
      const decrypted = new Uint8Array(encryptedBytes.length);
      for (let i = 0; i < encryptedBytes.length; i++) {
        decrypted[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
      }
      return JSON.parse(new TextDecoder().decode(decrypted));
    }

    // AES-GCM decryption
    const rawKey = new TextEncoder().encode(key);
    const keyHash = await crypto.subtle.digest('SHA-256', rawKey);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyHash,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
    const encryptedData = Uint8Array.from(atob(encryptedB64), c => c.charCodeAt(0));

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      encryptedData
    );

    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch (e) {
    console.error('Decryption error:', e);
    return {};
  }
}

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

    console.log('[broker-portfolio] MT creds check:', { login: !!login, password: !!password, server: !!server, keys: Object.keys(credentials) });

    if (!login || !password || !server) {
      return { error: 'MT5 credentials incomplete' };
    }

    // Step 1: Find or provision the MetaAPI account
    const listRes = await fetch('https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts', {
      headers: { 'auth-token': metaApiToken },
    });

    let accountId: string | null = null;

    if (listRes.ok) {
      const accounts = await listRes.json();
      const match = accounts.find((a: Record<string, unknown>) =>
        String(a.login) === String(login) && a.server === server
      );
      if (match) {
        accountId = match._id;
        // Ensure it's deployed
        if (match.state !== 'DEPLOYED') {
          await fetch(`https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts/${accountId}/deploy`, {
            method: 'POST',
            headers: { 'auth-token': metaApiToken },
          });
          // Wait for deployment
          await new Promise(r => setTimeout(r, 3000));
        }
      }
    }

    if (!accountId) {
      // Create new MetaAPI account
      const createRes = await fetch('https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts', {
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

      // Deploy
      await fetch(`https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts/${accountId}/deploy`, {
        method: 'POST',
        headers: { 'auth-token': metaApiToken },
      });

      // Wait for deployment
      await new Promise(r => setTimeout(r, 5000));
    }

    // Step 2: Get account information
    const infoRes = await fetch(`https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts/${accountId}/account-information`, {
      headers: { 'auth-token': metaApiToken },
    });

    if (!infoRes.ok) {
      const errText = await infoRes.text();
      console.error('MetaAPI account info error:', infoRes.status, errText);
      // If not connected yet, return partial data
      if (infoRes.status === 404 || infoRes.status === 502) {
        return {
          error: 'Account connecting... try again in a few seconds',
          cash_balance: 0,
          equity: 0,
          positions: [],
        };
      }
      return { error: `MetaAPI error: ${infoRes.status}` };
    }

    const info = await infoRes.json();

    // Step 3: Get open positions
    const posRes = await fetch(`https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts/${accountId}/positions`, {
      headers: { 'auth-token': metaApiToken },
    });

    const positionsData = posRes.ok ? await posRes.json() : [];

    const positions: Position[] = (positionsData || []).map((p: Record<string, unknown>) => {
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

    const balance = Number(info.balance || 0);
    const equity = Number(info.equity || 0);
    const margin = Number(info.margin || 0);
    const freeMargin = Number(info.freeMargin || 0);
    const unrealizedPnl = equity - balance;

    return {
      cash_balance: balance,
      equity,
      buying_power: freeMargin,
      unrealized_pnl: unrealizedPnl,
      realized_pnl_today: Number(info.todayProfit || 0),
      margin_used: margin,
      margin_available: freeMargin,
      currency: String(info.currency || 'USD'),
      positions,
    };
  } catch (error) {
    console.error('MetaAPI fetch error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to fetch MT5 data' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const encryptionKey = Deno.env.get('ENCRYPTION_KEY');
    if (!encryptionKey || encryptionKey === 'default-key') {
      return new Response(JSON.stringify({ error: 'Server configuration error: encryption key not set' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
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

    // Get all active connections for user
    const { data: connections, error: connError } = await supabase
      .from('user_broker_connections')
      .select(`
        *,
        broker:brokers(id, code, display_name)
      `)
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (connError) throw connError;

    if (!connections || connections.length === 0) {
      return new Response(JSON.stringify({ 
        accounts: [],
        summary: {
          total_equity: 0,
          total_cash: 0,
          total_unrealized_pnl: 0,
          total_realized_pnl: 0,
          total_positions: 0,
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch data from each connected broker
    const accountPromises = connections.map(async (conn): Promise<AccountData> => {
      const encryptedStr = decodeBytea(conn.encrypted_credentials);
      const rawIv = conn.credentials_iv;
      const ivStr = rawIv ? decodeBytea(rawIv) : null;
      
      console.log('[broker-portfolio] Connection:', conn.id, 'broker:', conn.broker?.code, 
        'has_iv:', !!rawIv, 'iv_decoded:', ivStr?.substring(0, 20),
        'encrypted_preview:', encryptedStr?.substring(0, 30));
      
      const credentials = await decryptCredentials(encryptedStr, ivStr, encryptionKey);
      console.log('[broker-portfolio] Credential keys:', Object.keys(credentials));
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
          // Check config for MT5 platform hint
          if (config.platform === 'mt5' || config.platform === 'mt4') {
            accountData = await fetchMetaApiAccount(credentials, config);
          } else {
            accountData = { 
              error: `Broker "${brokerCode}" not supported for live data`,
              cash_balance: 0,
              equity: 0,
              positions: [],
            };
          }
      }

      // Save snapshot on success
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

    // Calculate summary
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
      total_equity: 0,
      total_cash: 0,
      total_unrealized_pnl: 0,
      total_realized_pnl: 0,
      total_positions: 0,
    });

    return new Response(JSON.stringify({ accounts, summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in broker-portfolio:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
