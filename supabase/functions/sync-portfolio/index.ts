import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Notification thresholds
const PNL_CHANGE_THRESHOLD_PERCENT = 5; // 5% change triggers notification
const PNL_CHANGE_THRESHOLD_ABSOLUTE = 100; // $100 change triggers notification

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

interface PortfolioAlert {
  type: 'pnl_change' | 'order_executed' | 'margin_warning' | 'position_closed';
  title: string;
  body: string;
  severity: 'info' | 'warning' | 'critical';
  userId: string;
  connectionId: string;
}

interface SyncResult {
  connection_id: string;
  broker_code: string;
  success: boolean;
  error?: string;
  equity?: number;
  positions_count?: number;
  alerts?: PortfolioAlert[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = SupabaseClient<any, any, any>;

async function syncAlpacaAccount(
  credentials: Record<string, string>, 
  environment: string,
  supabase: SupabaseAny,
  userId: string,
  connectionId: string,
  previousSnapshot: Record<string, unknown> | null
): Promise<SyncResult> {
  const baseUrl = environment === 'live' 
    ? 'https://api.alpaca.markets' 
    : 'https://paper-api.alpaca.markets';
  const alerts: PortfolioAlert[] = [];

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

    const positions = positionsRes.ok ? await positionsRes.json() : [];

    // Fetch recent orders
    const ordersRes = await fetch(`${baseUrl}/v2/orders?status=filled&limit=10`, {
      headers: {
        'APCA-API-KEY-ID': credentials.api_key,
        'APCA-API-SECRET-KEY': credentials.api_secret,
      },
    });

    const orders = ordersRes.ok ? await ordersRes.json() : [];

    // Calculate totals
    const equity = parseFloat(account.equity);
    const cash = parseFloat(account.cash);
    const buyingPower = parseFloat(account.buying_power);
    const unrealizedPnl = positions.reduce((sum: number, p: Record<string, string>) => 
      sum + parseFloat(p.unrealized_pl || '0'), 0);

    // Check for significant PnL changes
    if (previousSnapshot) {
      const prevEquity = previousSnapshot.equity as number || 0;
      const equityChange = equity - prevEquity;
      const equityChangePercent = prevEquity > 0 ? (equityChange / prevEquity) * 100 : 0;

      if (Math.abs(equityChangePercent) >= PNL_CHANGE_THRESHOLD_PERCENT || 
          Math.abs(equityChange) >= PNL_CHANGE_THRESHOLD_ABSOLUTE) {
        const isPositive = equityChange > 0;
        alerts.push({
          type: 'pnl_change',
          title: isPositive ? '📈 Portfolio Up!' : '📉 Portfolio Down',
          body: `Your Alpaca portfolio ${isPositive ? 'gained' : 'lost'} $${Math.abs(equityChange).toFixed(2)} (${Math.abs(equityChangePercent).toFixed(1)}%)`,
          severity: Math.abs(equityChangePercent) >= 10 ? 'critical' : 'warning',
          userId,
          connectionId,
        });
      }

      // Check for margin warning
      const marginUsedPercent = (parseFloat(account.initial_margin || '0') / equity) * 100;
      if (marginUsedPercent >= 80) {
        alerts.push({
          type: 'margin_warning',
          title: '⚠️ High Margin Usage',
          body: `Your Alpaca margin usage is at ${marginUsedPercent.toFixed(1)}%`,
          severity: marginUsedPercent >= 90 ? 'critical' : 'warning',
          userId,
          connectionId,
        });
      }
    }

    // Check for recently executed orders (within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    for (const order of orders) {
      if (order.filled_at && order.filled_at > fiveMinutesAgo) {
        alerts.push({
          type: 'order_executed',
          title: `✅ Order Executed: ${order.side.toUpperCase()} ${order.symbol}`,
          body: `${order.filled_qty} shares at $${parseFloat(order.filled_avg_price).toFixed(2)}`,
          severity: 'info',
          userId,
          connectionId,
        });
      }
    }

    // Save snapshot
    await supabase.from('account_snapshots').insert({
      user_id: userId,
      connection_id: connectionId,
      cash_balance: cash,
      equity: equity,
      portfolio_value: equity,
      buying_power: buyingPower,
      margin_used: parseFloat(account.initial_margin || '0'),
      margin_available: buyingPower,
      unrealized_pnl: unrealizedPnl,
      realized_pnl_today: 0,
      total_positions_count: positions.length,
      snapshot_data: { account, positions_count: positions.length },
    });

    // Update positions in DB
    for (const pos of positions) {
      await supabase.from('positions').upsert({
        user_id: userId,
        connection_id: connectionId,
        symbol: pos.symbol,
        asset_type: pos.asset_class || 'stock',
        quantity: parseFloat(pos.qty),
        available_quantity: parseFloat(pos.qty),
        average_entry_price: parseFloat(pos.avg_entry_price),
        current_price: parseFloat(pos.current_price),
        market_value: parseFloat(pos.market_value),
        unrealized_pnl: parseFloat(pos.unrealized_pl),
        unrealized_pnl_percent: parseFloat(pos.unrealized_plpc) * 100,
      }, { onConflict: 'connection_id,symbol' });
    }

    // Update connection status
    await supabase.from('user_broker_connections').update({
      is_connected: true,
      last_sync_at: new Date().toISOString(),
      connection_error: null,
    }).eq('id', connectionId);

    return {
      connection_id: connectionId,
      broker_code: 'alpaca',
      success: true,
      equity,
      positions_count: positions.length,
      alerts,
    };
  } catch (error) {
    console.error('Alpaca sync error:', error);
    
    await supabase.from('user_broker_connections').update({
      connection_error: error instanceof Error ? error.message : 'Sync failed',
    }).eq('id', connectionId);

    return {
      connection_id: connectionId,
      broker_code: 'alpaca',
      success: false,
      error: error instanceof Error ? error.message : 'Sync failed',
    };
  }
}

async function syncOandaAccount(
  credentials: Record<string, string>, 
  environment: string,
  supabase: SupabaseAny,
  userId: string,
  connectionId: string,
  previousSnapshot: Record<string, unknown> | null
): Promise<SyncResult> {
  const baseUrl = environment === 'live'
    ? 'https://api-fxtrade.oanda.com'
    : 'https://api-fxpractice.oanda.com';
  const alerts: PortfolioAlert[] = [];

  try {
    // Get accounts list
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

    // Fetch recent transactions (orders)
    const transactionsRes = await fetch(`${baseUrl}/v3/accounts/${accountId}/transactions?count=50`, {
      headers: {
        'Authorization': `Bearer ${credentials.api_key}`,
        'Content-Type': 'application/json',
      },
    });

    const transactionsData = transactionsRes.ok ? await transactionsRes.json() : { transactions: [] };

    const equity = parseFloat(account.NAV);
    const cash = parseFloat(account.balance);
    const unrealizedPnl = parseFloat(account.unrealizedPL || '0');
    const positionsCount = (account.positions || []).filter((p: Record<string, unknown>) => {
      const long = p.long as Record<string, string> | undefined;
      const short = p.short as Record<string, string> | undefined;
      return long?.units !== '0' || short?.units !== '0';
    }).length;

    // Check for significant PnL changes
    if (previousSnapshot) {
      const prevEquity = previousSnapshot.equity as number || 0;
      const equityChange = equity - prevEquity;
      const equityChangePercent = prevEquity > 0 ? (equityChange / prevEquity) * 100 : 0;

      if (Math.abs(equityChangePercent) >= PNL_CHANGE_THRESHOLD_PERCENT || 
          Math.abs(equityChange) >= PNL_CHANGE_THRESHOLD_ABSOLUTE) {
        const isPositive = equityChange > 0;
        alerts.push({
          type: 'pnl_change',
          title: isPositive ? '📈 Portfolio Up!' : '📉 Portfolio Down',
          body: `Your OANDA portfolio ${isPositive ? 'gained' : 'lost'} $${Math.abs(equityChange).toFixed(2)} (${Math.abs(equityChangePercent).toFixed(1)}%)`,
          severity: Math.abs(equityChangePercent) >= 10 ? 'critical' : 'warning',
          userId,
          connectionId,
        });
      }

      // Check for margin warning
      const marginUsed = parseFloat(account.marginUsed || '0');
      const marginAvailable = parseFloat(account.marginAvailable || '0');
      const marginUsedPercent = marginAvailable > 0 ? (marginUsed / (marginUsed + marginAvailable)) * 100 : 0;
      if (marginUsedPercent >= 80) {
        alerts.push({
          type: 'margin_warning',
          title: '⚠️ High Margin Usage',
          body: `Your OANDA margin usage is at ${marginUsedPercent.toFixed(1)}%`,
          severity: marginUsedPercent >= 90 ? 'critical' : 'warning',
          userId,
          connectionId,
        });
      }
    }

    // Check for recently filled orders (within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    for (const tx of transactionsData.transactions || []) {
      if (tx.type === 'ORDER_FILL' && tx.time > fiveMinutesAgo) {
        const units = Math.abs(parseFloat(tx.units || '0'));
        const side = parseFloat(tx.units || '0') > 0 ? 'BUY' : 'SELL';
        alerts.push({
          type: 'order_executed',
          title: `✅ Order Executed: ${side} ${tx.instrument}`,
          body: `${units} units at ${tx.price}`,
          severity: 'info',
          userId,
          connectionId,
        });
      }
    }

    // Save snapshot
    await supabase.from('account_snapshots').insert({
      user_id: userId,
      connection_id: connectionId,
      cash_balance: cash,
      equity: equity,
      portfolio_value: equity,
      buying_power: parseFloat(account.marginAvailable || account.balance),
      margin_used: parseFloat(account.marginUsed || '0'),
      margin_available: parseFloat(account.marginAvailable || '0'),
      unrealized_pnl: unrealizedPnl,
      realized_pnl_today: parseFloat(account.pl || '0'),
      total_positions_count: positionsCount,
      snapshot_data: { 
        account_id: accountId, 
        currency: account.currency,
        positions_count: positionsCount 
      },
    });

    // Update connection status
    await supabase.from('user_broker_connections').update({
      is_connected: true,
      last_sync_at: new Date().toISOString(),
      connection_error: null,
    }).eq('id', connectionId);

    return {
      connection_id: connectionId,
      broker_code: 'oanda',
      success: true,
      equity,
      positions_count: positionsCount,
      alerts,
    };
  } catch (error) {
    console.error('OANDA sync error:', error);
    
    await supabase.from('user_broker_connections').update({
      connection_error: error instanceof Error ? error.message : 'Sync failed',
    }).eq('id', connectionId);

    return {
      connection_id: connectionId,
      broker_code: 'oanda',
      success: false,
      error: error instanceof Error ? error.message : 'Sync failed',
    };
  }
}

// Send push notification
async function sendPortfolioNotification(alert: PortfolioAlert, apiKey: string, supabaseUrl: string): Promise<void> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        title: alert.title,
        body: alert.body,
        url: '/portfolio',
        tag: `portfolio-${alert.type}`,
      }),
    });

    if (!response.ok) {
      console.error('Failed to send notification:', await response.text());
    } else {
      console.log(`[sync-portfolio] Notification sent: ${alert.title}`);
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[sync-portfolio] Starting portfolio sync job...');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const encryptionKey = Deno.env.get('ENCRYPTION_KEY') || 'default-key';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all active connections
    const { data: connections, error: connError } = await supabase
      .from('user_broker_connections')
      .select(`
        *,
        broker:brokers(id, code, display_name)
      `)
      .eq('is_active', true);

    if (connError) {
      throw connError;
    }

    if (!connections || connections.length === 0) {
      console.log('[sync-portfolio] No active connections found');
      return new Response(JSON.stringify({ 
        message: 'No active connections',
        synced: 0,
        duration_ms: Date.now() - startTime 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[sync-portfolio] Found ${connections.length} active connections`);

    // Sync each connection
    const results: SyncResult[] = [];
    const allAlerts: PortfolioAlert[] = [];
    const signalsApiKey = Deno.env.get('SIGNALS_API_KEY') || '';

    for (const conn of connections) {
      const encryptedStr = new TextDecoder().decode(conn.encrypted_credentials);
      const credentials = decryptCredentials(encryptedStr, encryptionKey);
      const brokerCode = conn.broker?.code;

      console.log(`[sync-portfolio] Syncing ${brokerCode} connection ${conn.id}`);

      // Get previous snapshot for comparison
      const { data: prevSnapshots } = await supabase
        .from('account_snapshots')
        .select('*')
        .eq('connection_id', conn.id)
        .order('snapshot_at', { ascending: false })
        .limit(1);

      const previousSnapshot = prevSnapshots?.[0] || null;

      let result: SyncResult;

      switch (brokerCode) {
        case 'alpaca':
          result = await syncAlpacaAccount(
            credentials, 
            conn.environment, 
            supabase, 
            conn.user_id, 
            conn.id,
            previousSnapshot
          );
          break;
        case 'oanda':
          result = await syncOandaAccount(
            credentials, 
            conn.environment, 
            supabase, 
            conn.user_id, 
            conn.id,
            previousSnapshot
          );
          break;
        default:
          result = {
            connection_id: conn.id,
            broker_code: brokerCode || 'unknown',
            success: false,
            error: 'Broker not supported for automatic sync',
          };
      }

      // Collect alerts
      if (result.alerts && result.alerts.length > 0) {
        allAlerts.push(...result.alerts);
      }

      results.push(result);

      // Log to audit
      await supabase.from('audit_logs').insert({
        user_id: conn.user_id,
        action: 'portfolio_sync',
        resource_type: 'user_broker_connections',
        resource_id: conn.id,
        details: {
          broker_code: brokerCode,
          success: result.success,
          equity: result.equity,
          positions_count: result.positions_count,
          alerts_count: result.alerts?.length || 0,
          error: result.error,
        },
        success: result.success,
        error_message: result.error,
      });
    }

    // Send push notifications for all alerts
    for (const alert of allAlerts) {
      await sendPortfolioNotification(alert, signalsApiKey, supabaseUrl);
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const duration = Date.now() - startTime;

    console.log(`[sync-portfolio] Completed: ${successCount} success, ${failCount} failed, ${allAlerts.length} alerts in ${duration}ms`);

    return new Response(JSON.stringify({
      message: 'Portfolio sync completed',
      synced: successCount,
      failed: failCount,
      total: results.length,
      alerts_sent: allAlerts.length,
      duration_ms: duration,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[sync-portfolio] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      duration_ms: Date.now() - startTime
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
