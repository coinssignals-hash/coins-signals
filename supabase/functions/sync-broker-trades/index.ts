import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Decrypt credentials (same as broker-connections) ──────────────────────

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

// ─── Trade normalization ───────────────────────────────────────────────────

interface NormalizedTrade {
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

// ─── OANDA sync ────────────────────────────────────────────────────────────

async function syncOanda(creds: Record<string, string>, env: string): Promise<{ trades: NormalizedTrade[]; account: Record<string, unknown> }> {
  const baseUrl = env === 'live' ? 'https://api-fxtrade.oanda.com' : 'https://api-fxpractice.oanda.com';
  const headers = { 'Authorization': `Bearer ${creds.api_key}`, 'Content-Type': 'application/json' };
  const accountId = creds.account_id;

  // Get account summary
  const accRes = await fetch(`${baseUrl}/v3/accounts/${accountId}/summary`, { headers });
  if (!accRes.ok) throw new Error(`OANDA auth failed: ${accRes.status}`);
  const accData = await accRes.json();

  // Get transactions (last 500)
  const txRes = await fetch(`${baseUrl}/v3/accounts/${accountId}/transactions?count=500&type=ORDER_FILL`, { headers });
  const txData = txRes.ok ? await txRes.json() : { transactions: [] };

  const trades: NormalizedTrade[] = (txData.transactions || [])
    .filter((tx: any) => tx.type === 'ORDER_FILL' && tx.instrument)
    .map((tx: any) => ({
      external_trade_id: tx.id,
      symbol: tx.instrument?.replace('_', '/') || '',
      side: parseFloat(tx.units || '0') >= 0 ? 'buy' : 'sell',
      quantity: Math.abs(parseFloat(tx.units || '0')),
      entry_price: parseFloat(tx.price || '0'),
      exit_price: null,
      entry_time: tx.time,
      exit_time: null,
      commission: Math.abs(parseFloat(tx.commission || '0')),
      swap: parseFloat(tx.financing || '0'),
      profit: parseFloat(tx.pl || '0'),
      status: 'closed',
      notes: `Order: ${tx.reason || ''}`,
    }));

  return {
    trades,
    account: {
      balance: parseFloat(accData.account?.balance || '0'),
      equity: parseFloat(accData.account?.NAV || '0'),
      unrealized_pnl: parseFloat(accData.account?.unrealizedPL || '0'),
      currency: accData.account?.currency || 'USD',
    },
  };
}

// ─── ALPACA sync ───────────────────────────────────────────────────────────

async function syncAlpaca(creds: Record<string, string>, env: string): Promise<{ trades: NormalizedTrade[]; account: Record<string, unknown> }> {
  const baseUrl = env === 'live' ? 'https://api.alpaca.markets' : 'https://paper-api.alpaca.markets';
  const headers = { 'APCA-API-KEY-ID': creds.api_key, 'APCA-API-SECRET-KEY': creds.api_secret };

  // Account
  const accRes = await fetch(`${baseUrl}/v2/account`, { headers });
  if (!accRes.ok) throw new Error(`Alpaca auth failed: ${accRes.status}`);
  const account = await accRes.json();

  // Orders (filled, last 500)
  const ordRes = await fetch(`${baseUrl}/v2/orders?status=closed&limit=500&direction=desc`, { headers });
  const orders = ordRes.ok ? await ordRes.json() : [];

  const trades: NormalizedTrade[] = orders
    .filter((o: any) => o.status === 'filled')
    .map((o: any) => ({
      external_trade_id: o.id,
      symbol: o.symbol,
      side: o.side,
      quantity: parseFloat(o.filled_qty || o.qty || '0'),
      entry_price: parseFloat(o.filled_avg_price || '0'),
      exit_price: null,
      entry_time: o.filled_at || o.created_at,
      exit_time: null,
      commission: 0,
      swap: 0,
      profit: 0,
      status: 'closed',
      notes: `Type: ${o.type} | TIF: ${o.time_in_force}`,
    }));

  // Get portfolio history for equity curve
  return {
    trades,
    account: {
      balance: parseFloat(account.cash || '0'),
      equity: parseFloat(account.equity || '0'),
      buying_power: parseFloat(account.buying_power || '0'),
      unrealized_pnl: parseFloat(account.equity || '0') - parseFloat(account.last_equity || '0'),
      currency: account.currency || 'USD',
    },
  };
}

// ─── TRADOVATE sync ────────────────────────────────────────────────────────

async function syncTradovate(creds: Record<string, string>, env: string): Promise<{ trades: NormalizedTrade[]; account: Record<string, unknown> }> {
  const baseUrl = env === 'live' ? 'https://live.tradovateapi.com/v1' : 'https://demo.tradovateapi.com/v1';

  // Authenticate
  const authRes = await fetch(`${baseUrl}/auth/accesstokenrequest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: creds.api_key,
      password: creds.api_secret,
      appId: creds.account_id || 'TradeSync',
      appVersion: '1.0',
    }),
  });
  if (!authRes.ok) throw new Error(`Tradovate auth failed: ${authRes.status}`);
  const authData = await authRes.json();
  const token = authData.accessToken;
  if (!token) throw new Error('No access token from Tradovate');

  const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  // Accounts
  const accRes = await fetch(`${baseUrl}/account/list`, { headers: authHeaders });
  const accounts = accRes.ok ? await accRes.json() : [];

  // Orders
  const ordRes = await fetch(`${baseUrl}/order/list`, { headers: authHeaders });
  const orders = ordRes.ok ? await ordRes.json() : [];

  const trades: NormalizedTrade[] = orders
    .filter((o: any) => o.ordStatus === 'Filled')
    .map((o: any) => ({
      external_trade_id: String(o.id),
      symbol: o.contractSpec?.name || o.name || 'UNKNOWN',
      side: o.action?.toLowerCase() === 'buy' ? 'buy' : 'sell',
      quantity: o.qty || 0,
      entry_price: o.avgPx || 0,
      exit_price: null,
      entry_time: o.timestamp || new Date().toISOString(),
      exit_time: null,
      commission: 0,
      swap: 0,
      profit: 0,
      status: 'closed',
      notes: `Account: ${o.accountId || ''}`,
    }));

  const acc = accounts[0] || {};
  return {
    trades,
    account: {
      balance: acc.cashBalance || 0,
      equity: acc.totalUsedMarginMarketValue || 0,
      currency: 'USD',
    },
  };
}

// ─── INTERACTIVE BROKERS sync ──────────────────────────────────────────────

async function syncIBKR(creds: Record<string, string>, _env: string): Promise<{ trades: NormalizedTrade[]; account: Record<string, unknown> }> {
  // IBKR Client Portal API runs locally via TWS
  const baseUrl = creds.base_url || 'https://localhost:5000/v1/api';

  // Auth status check
  const authRes = await fetch(`${baseUrl}/iserver/auth/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!authRes.ok) throw new Error('IBKR: TWS no está ejecutándose o no autenticado. Abre TWS en tu máquina local.');
  const authData = await authRes.json();
  if (!authData.authenticated) throw new Error('IBKR: Sesión no autenticada en TWS');

  // Portfolio accounts
  const accRes = await fetch(`${baseUrl}/portfolio/accounts`);
  const accounts = accRes.ok ? await accRes.json() : [];
  const accountId = accounts[0]?.accountId;
  if (!accountId) throw new Error('IBKR: No se encontraron cuentas');

  // Summary
  const sumRes = await fetch(`${baseUrl}/portfolio/${accountId}/summary`);
  const summary = sumRes.ok ? await sumRes.json() : {};

  // Trades
  const tradeRes = await fetch(`${baseUrl}/iserver/account/trades`);
  const ibTrades = tradeRes.ok ? await tradeRes.json() : [];

  const trades: NormalizedTrade[] = (ibTrades || []).map((t: any) => ({
    external_trade_id: t.execution_id || String(t.order_ref || Math.random()),
    symbol: t.symbol || t.conid || '',
    side: t.side?.toLowerCase() === 'b' || t.side?.toLowerCase() === 'buy' ? 'buy' : 'sell',
    quantity: Math.abs(t.size || t.shares || 0),
    entry_price: t.price || 0,
    exit_price: null,
    entry_time: t.trade_time || new Date().toISOString(),
    exit_time: null,
    commission: Math.abs(t.commission || 0),
    swap: 0,
    profit: t.realized_pnl || 0,
    status: 'closed',
    notes: `Account: ${accountId}`,
  }));

  return {
    trades,
    account: {
      balance: summary.totalcashvalue?.amount || 0,
      equity: summary.netliquidation?.amount || 0,
      unrealized_pnl: summary.unrealizedpnl?.amount || 0,
      currency: summary.netliquidation?.currency || 'USD',
    },
  };
}

// ─── TRADESTATION sync ─────────────────────────────────────────────────────

async function syncTradeStation(creds: Record<string, string>, _env: string): Promise<{ trades: NormalizedTrade[]; account: Record<string, unknown> }> {
  const baseUrl = 'https://api.tradestation.com/v3';
  // TradeStation uses OAuth; access_token should be pre-obtained
  const headers = { 'Authorization': `Bearer ${creds.access_token || creds.api_key}`, 'Content-Type': 'application/json' };

  // Accounts
  const accRes = await fetch(`${baseUrl}/brokerage/accounts`, { headers });
  if (!accRes.ok) throw new Error(`TradeStation auth failed: ${accRes.status}`);
  const accData = await accRes.json();
  const accountId = accData.Accounts?.[0]?.AccountID;
  if (!accountId) throw new Error('TradeStation: No accounts found');

  // Balances
  const balRes = await fetch(`${baseUrl}/brokerage/accounts/${accountId}/balances`, { headers });
  const balData = balRes.ok ? await balRes.json() : { Balances: [] };
  const balance = balData.Balances?.[0] || {};

  // Orders
  const ordRes = await fetch(`${baseUrl}/brokerage/accounts/${accountId}/orders`, { headers });
  const ordData = ordRes.ok ? await ordRes.json() : { Orders: [] };

  const trades: NormalizedTrade[] = (ordData.Orders || [])
    .filter((o: any) => o.Status === 'FLL')
    .map((o: any) => ({
      external_trade_id: o.OrderID,
      symbol: o.Legs?.[0]?.Symbol || '',
      side: o.Legs?.[0]?.BuyOrSell?.toLowerCase() === 'buy' ? 'buy' : 'sell',
      quantity: parseFloat(o.Legs?.[0]?.QuantityOrdered || '0'),
      entry_price: parseFloat(o.FilledPrice || '0'),
      exit_price: null,
      entry_time: o.ClosedDateTime || o.OpenedDateTime || new Date().toISOString(),
      exit_time: null,
      commission: parseFloat(o.CommissionFee || '0'),
      swap: 0,
      profit: 0,
      status: 'closed',
      notes: `Route: ${o.Routing || ''}`,
    }));

  return {
    trades,
    account: {
      balance: parseFloat(balance.CashBalance || '0'),
      equity: parseFloat(balance.Equity || '0'),
      buying_power: parseFloat(balance.BuyingPower || '0'),
      unrealized_pnl: parseFloat(balance.UnrealizedProfitLoss || '0'),
      currency: 'USD',
    },
  };
}

// ─── PEPPERSTONE sync (cTrader Open API) ───────────────────────────────────

async function syncPepperstone(creds: Record<string, string>, _env: string): Promise<{ trades: NormalizedTrade[]; account: Record<string, unknown> }> {
  // Pepperstone uses cTrader Open API
  const baseUrl = 'https://api.pepperstone.com';
  const headers = { 'Authorization': `Bearer ${creds.access_token || creds.api_key}`, 'Content-Type': 'application/json' };

  // Account info
  const accRes = await fetch(`${baseUrl}/v1/accounts`, { headers });
  if (!accRes.ok) throw new Error(`Pepperstone auth failed: ${accRes.status}`);
  const accData = await accRes.json();
  const acc = accData[0] || {};

  // Deal history
  const histRes = await fetch(`${baseUrl}/v1/dealing/history?maxResults=500`, { headers });
  const histData = histRes.ok ? await histRes.json() : { activities: [] };

  const trades: NormalizedTrade[] = (histData.activities || [])
    .filter((a: any) => a.type === 'POSITION')
    .map((a: any) => ({
      external_trade_id: a.dealId || crypto.randomUUID(),
      symbol: a.epic || a.marketName || '',
      side: a.direction?.toLowerCase() === 'buy' ? 'buy' : 'sell',
      quantity: Math.abs(a.size || 0),
      entry_price: a.level || a.openLevel || 0,
      exit_price: a.closeLevel || null,
      entry_time: a.date || new Date().toISOString(),
      exit_time: a.closeDate || null,
      commission: 0,
      swap: 0,
      profit: a.profit || 0,
      status: a.closeLevel ? 'closed' : 'open',
      notes: a.channel || '',
    }));

  return {
    trades,
    account: {
      balance: acc.balance || 0,
      equity: acc.equity || acc.balance || 0,
      currency: acc.currency || 'USD',
    },
  };
}

// ─── AVATRADE sync ─────────────────────────────────────────────────────────

async function syncAvaTrade(creds: Record<string, string>, _env: string): Promise<{ trades: NormalizedTrade[]; account: Record<string, unknown> }> {
  const baseUrl = 'https://www.avatrade.com/api/v2';
  const headers = { 'Authorization': `Bearer ${creds.access_token || creds.api_key}`, 'Content-Type': 'application/json' };

  const accRes = await fetch(`${baseUrl}/account`, { headers });
  if (!accRes.ok) throw new Error(`AvaTrade auth failed: ${accRes.status}`);
  const account = await accRes.json();

  const histRes = await fetch(`${baseUrl}/orders?status=closed&limit=500`, { headers });
  const orders = histRes.ok ? await histRes.json() : [];

  const trades: NormalizedTrade[] = (Array.isArray(orders) ? orders : orders.orders || []).map((o: any) => ({
    external_trade_id: o.id || o.orderId || crypto.randomUUID(),
    symbol: o.instrument || o.symbol || '',
    side: o.side?.toLowerCase() === 'buy' ? 'buy' : 'sell',
    quantity: Math.abs(o.quantity || o.amount || 0),
    entry_price: o.openPrice || o.price || 0,
    exit_price: o.closePrice || null,
    entry_time: o.openTime || o.createdAt || new Date().toISOString(),
    exit_time: o.closeTime || null,
    commission: o.commission || 0,
    swap: o.swap || o.financing || 0,
    profit: o.profit || o.pnl || 0,
    status: o.closePrice ? 'closed' : 'open',
    notes: '',
  }));

  return {
    trades,
    account: {
      balance: account.balance || 0,
      equity: account.equity || 0,
      currency: account.currency || 'USD',
    },
  };
}

// ─── IC MARKETS sync ───────────────────────────────────────────────────────

async function syncICMarkets(creds: Record<string, string>, _env: string): Promise<{ trades: NormalizedTrade[]; account: Record<string, unknown> }> {
  // IC Markets uses cTrader API
  const baseUrl = 'https://api.icmarkets.com';
  const headers = { 'Authorization': `Bearer ${creds.access_token || creds.api_key}`, 'Content-Type': 'application/json' };

  const accRes = await fetch(`${baseUrl}/v1/accounts`, { headers });
  if (!accRes.ok) throw new Error(`IC Markets auth failed: ${accRes.status}`);
  const accData = await accRes.json();
  const acc = accData[0] || {};

  const histRes = await fetch(`${baseUrl}/v1/history/deals?limit=500`, { headers });
  const deals = histRes.ok ? await histRes.json() : [];

  const trades: NormalizedTrade[] = (Array.isArray(deals) ? deals : deals.deals || []).map((d: any) => ({
    external_trade_id: d.dealId || d.positionId || crypto.randomUUID(),
    symbol: d.symbol || '',
    side: d.direction?.toLowerCase() === 'buy' ? 'buy' : 'sell',
    quantity: Math.abs(d.volume || d.quantity || 0),
    entry_price: d.entryPrice || d.price || 0,
    exit_price: d.closePrice || null,
    entry_time: d.entryTime || d.openTime || new Date().toISOString(),
    exit_time: d.closeTime || null,
    commission: d.commission || 0,
    swap: d.swap || 0,
    profit: d.profit || d.netProfit || 0,
    status: d.closePrice ? 'closed' : 'open',
    notes: d.label || '',
  }));

  return {
    trades,
    account: {
      balance: acc.balance || 0,
      equity: acc.equity || 0,
      currency: acc.currency || 'USD',
    },
  };
}

// ─── Router ────────────────────────────────────────────────────────────────

const SYNC_HANDLERS: Record<string, (c: Record<string, string>, e: string) => Promise<{ trades: NormalizedTrade[]; account: Record<string, unknown> }>> = {
  oanda: syncOanda,
  alpaca: syncAlpaca,
  tradovate: syncTradovate,
  interactive_brokers: syncIBKR,
  ibkr: syncIBKR,
  tradestation: syncTradeStation,
  pepperstone: syncPepperstone,
  avatrade: syncAvaTrade,
  ic_markets: syncICMarkets,
  icmarkets: syncICMarkets,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const encryptionKey = Deno.env.get('ENCRYPTION_KEY');
    if (!encryptionKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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

    // Get connection with broker info
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

    const brokerCode = conn.broker?.code;
    const handler = SYNC_HANDLERS[brokerCode];
    if (!handler) {
      return new Response(JSON.stringify({ 
        error: `Broker '${brokerCode}' no soporta sincronización API. Usa importación CSV.`,
        csv_only: true,
      }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Decrypt credentials
    const encryptedStr = new TextDecoder().decode(conn.encrypted_credentials);
    const ivStr = conn.credentials_iv ? new TextDecoder().decode(conn.credentials_iv) : null;
    const credentials = await decryptCredentials(encryptedStr, ivStr, encryptionKey);

    if (!credentials || Object.keys(credentials).length === 0) {
      return new Response(JSON.stringify({ error: 'No se pudieron descifrar las credenciales' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Execute sync
    const { trades, account } = await handler(credentials, conn.environment);

    // Save trades to imported_trades table (upsert to deduplicate)
    let imported = 0;
    let duplicates = 0;
    const batchId = `sync_${brokerCode}_${Date.now()}`;

    if (trades.length > 0) {
      const chunks: NormalizedTrade[][] = [];
      for (let i = 0; i < trades.length; i += 50) {
        chunks.push(trades.slice(i, i + 50));
      }

      for (const chunk of chunks) {
        const rows = chunk.map(t => ({
          user_id: user.id,
          broker_source: brokerCode,
          connection_id: connection_id,
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

    // Update connection status
    await supabase
      .from('user_broker_connections')
      .update({
        is_connected: true,
        last_sync_at: new Date().toISOString(),
        connection_error: null,
      })
      .eq('id', connection_id);

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'broker_sync',
      resource_type: 'imported_trades',
      resource_id: connection_id,
      details: { broker: brokerCode, imported, duplicates, total_fetched: trades.length },
      success: true,
    });

    return new Response(JSON.stringify({
      success: true,
      broker: brokerCode,
      broker_name: conn.broker?.display_name,
      imported,
      duplicates,
      total_fetched: trades.length,
      account,
      batch_id: batchId,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Sync error:', err);
    const message = err instanceof Error ? err.message : 'Error de sincronización';

    // Detect rate limiting
    if (message.includes('429') || message.toLowerCase().includes('rate limit')) {
      return new Response(JSON.stringify({
        error: 'Rate limit alcanzado. Intenta de nuevo en 60 segundos.',
        retry_after: 60,
      }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Detect auth errors
    if (message.includes('401') || message.includes('403') || message.toLowerCase().includes('auth')) {
      return new Response(JSON.stringify({
        error: 'Credenciales inválidas o expiradas. Reconecta tu broker.',
        needs_reconnect: true,
      }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
