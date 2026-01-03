import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Decrypt credentials
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
}

async function fetchAlpacaAccount(credentials: Record<string, string>, environment: string): Promise<Partial<AccountData>> {
  const baseUrl = environment === 'live' 
    ? 'https://api.alpaca.markets' 
    : 'https://paper-api.alpaca.markets';

  try {
    // Fetch account
    const accountRes = await fetch(`${baseUrl}/v2/account`, {
      headers: {
        'APCA-API-KEY-ID': credentials.api_key,
        'APCA-API-SECRET-KEY': credentials.api_secret,
      },
    });

    if (!accountRes.ok) {
      throw new Error('Failed to fetch Alpaca account');
    }

    const account = await accountRes.json();

    // Fetch positions
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
    // Get accounts list first
    const accountsRes = await fetch(`${baseUrl}/v3/accounts`, {
      headers: {
        'Authorization': `Bearer ${credentials.api_key}`,
        'Content-Type': 'application/json',
      },
    });

    if (!accountsRes.ok) {
      throw new Error('Failed to fetch OANDA accounts');
    }

    const accountsData = await accountsRes.json();
    const accountId = credentials.account_id || accountsData.accounts?.[0]?.id;

    if (!accountId) {
      throw new Error('No OANDA account found');
    }

    // Fetch account details
    const accountRes = await fetch(`${baseUrl}/v3/accounts/${accountId}`, {
      headers: {
        'Authorization': `Bearer ${credentials.api_key}`,
        'Content-Type': 'application/json',
      },
    });

    if (!accountRes.ok) {
      throw new Error('Failed to fetch OANDA account details');
    }

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const encryptionKey = Deno.env.get('ENCRYPTION_KEY') || 'default-key';
    
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
      const encryptedStr = new TextDecoder().decode(conn.encrypted_credentials);
      const credentials = decryptCredentials(encryptedStr, encryptionKey);
      const brokerCode = conn.broker?.code;

      let accountData: Partial<AccountData> = {};

      switch (brokerCode) {
        case 'alpaca':
          accountData = await fetchAlpacaAccount(credentials, conn.environment);
          break;
        case 'oanda':
          accountData = await fetchOandaAccount(credentials, conn.environment);
          break;
        default:
          accountData = { 
            error: 'Broker not supported for live data',
            cash_balance: 0,
            equity: 0,
            positions: [],
          };
      }

      // Save snapshot
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

        // Update connection last sync
        await supabase
          .from('user_broker_connections')
          .update({ last_sync_at: new Date().toISOString(), is_connected: true })
          .eq('id', conn.id);
      }

      return {
        connection_id: conn.id,
        broker_code: brokerCode || 'unknown',
        broker_name: conn.broker?.display_name || conn.connection_name,
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
