-- =====================================================
-- SISTEMA COMPLETO DE TRADING MULTI-BROKER
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. TABLA: brokers (Catálogo de brokers soportados)
-- =====================================================
CREATE TABLE IF NOT EXISTS brokers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  auth_type TEXT NOT NULL,
  supported_assets TEXT[] NOT NULL DEFAULT '{}',
  supported_order_types TEXT[] NOT NULL DEFAULT '{}',
  api_documentation_url TEXT,
  base_url_live TEXT,
  base_url_demo TEXT,
  supports_websocket BOOLEAN DEFAULT false,
  websocket_url_live TEXT,
  websocket_url_demo TEXT,
  min_deposit DECIMAL,
  trading_fees_description TEXT,
  is_active BOOLEAN DEFAULT true,
  requires_2fa BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 2. TABLA: user_broker_connections
-- =====================================================
CREATE TABLE IF NOT EXISTS user_broker_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  broker_id UUID NOT NULL REFERENCES brokers(id) ON DELETE CASCADE,
  connection_name TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'demo' CHECK (environment IN ('demo', 'live')),
  encrypted_credentials BYTEA NOT NULL,
  credentials_iv BYTEA,
  config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  is_connected BOOLEAN DEFAULT false,
  last_connected_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  connection_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, broker_id, connection_name, environment)
);

-- =====================================================
-- 3. TABLA: orders
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES user_broker_connections(id) ON DELETE CASCADE,
  broker_order_id TEXT,
  client_order_id TEXT NOT NULL UNIQUE,
  symbol TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  order_type TEXT NOT NULL CHECK (order_type IN ('market', 'limit', 'stop', 'stop_limit', 'trailing_stop')),
  time_in_force TEXT NOT NULL DEFAULT 'gtc' CHECK (time_in_force IN ('day', 'gtc', 'ioc', 'fok')),
  quantity DECIMAL NOT NULL CHECK (quantity > 0),
  filled_quantity DECIMAL DEFAULT 0 CHECK (filled_quantity >= 0),
  limit_price DECIMAL,
  stop_price DECIMAL,
  trailing_percent DECIMAL,
  trailing_amount DECIMAL,
  average_fill_price DECIMAL,
  stop_loss_price DECIMAL,
  take_profit_price DECIMAL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'submitted', 'accepted', 'partial_fill', 'filled', 
    'cancelled', 'rejected', 'expired', 'replaced'
  )),
  submitted_at TIMESTAMPTZ,
  filled_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  rejection_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 4. TABLA: trades (ejecuciones)
-- =====================================================
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES user_broker_connections(id) ON DELETE CASCADE,
  broker_trade_id TEXT,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  quantity DECIMAL NOT NULL CHECK (quantity > 0),
  price DECIMAL NOT NULL CHECK (price > 0),
  commission DECIMAL DEFAULT 0,
  fees DECIMAL DEFAULT 0,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 5. TABLA: positions
-- =====================================================
CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES user_broker_connections(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  quantity DECIMAL NOT NULL,
  available_quantity DECIMAL NOT NULL DEFAULT 0,
  average_entry_price DECIMAL NOT NULL CHECK (average_entry_price > 0),
  current_price DECIMAL,
  last_price_update_at TIMESTAMPTZ,
  unrealized_pnl DECIMAL DEFAULT 0,
  unrealized_pnl_percent DECIMAL DEFAULT 0,
  realized_pnl DECIMAL DEFAULT 0,
  total_cost DECIMAL NOT NULL DEFAULT 0,
  total_commission DECIMAL DEFAULT 0,
  total_fees DECIMAL DEFAULT 0,
  market_value DECIMAL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(connection_id, symbol)
);

-- =====================================================
-- 6. TABLA: account_snapshots
-- =====================================================
CREATE TABLE IF NOT EXISTS account_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES user_broker_connections(id) ON DELETE CASCADE,
  cash_balance DECIMAL NOT NULL DEFAULT 0,
  equity DECIMAL NOT NULL DEFAULT 0,
  portfolio_value DECIMAL NOT NULL DEFAULT 0,
  buying_power DECIMAL DEFAULT 0,
  margin_used DECIMAL DEFAULT 0,
  margin_available DECIMAL DEFAULT 0,
  maintenance_margin DECIMAL DEFAULT 0,
  unrealized_pnl DECIMAL DEFAULT 0,
  realized_pnl_today DECIMAL DEFAULT 0,
  realized_pnl_total DECIMAL DEFAULT 0,
  total_positions_count INTEGER DEFAULT 0,
  total_open_orders_count INTEGER DEFAULT 0,
  long_exposure DECIMAL DEFAULT 0,
  short_exposure DECIMAL DEFAULT 0,
  net_exposure DECIMAL DEFAULT 0,
  snapshot_data JSONB DEFAULT '{}'::jsonb,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 7. TABLA: audit_logs
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- ÍNDICES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_brokers_active ON brokers(is_active);
CREATE INDEX IF NOT EXISTS idx_brokers_code ON brokers(code);

CREATE INDEX IF NOT EXISTS idx_connections_user ON user_broker_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_broker ON user_broker_connections(broker_id);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_connection_id ON orders(connection_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_symbol ON orders(symbol);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_order_id ON trades(order_id);
CREATE INDEX IF NOT EXISTS idx_trades_executed_at ON trades(executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_positions_user_id ON positions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_connection_id ON positions(connection_id);
CREATE INDEX IF NOT EXISTS idx_positions_symbol ON positions(symbol);

CREATE INDEX IF NOT EXISTS idx_snapshots_user_id ON account_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_connection_id ON account_snapshots(connection_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_snapshot_at ON account_snapshots(snapshot_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- =====================================================
-- TRIGGERS para updated_at
-- =====================================================
CREATE TRIGGER update_brokers_updated_at BEFORE UPDATE ON brokers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_connections_updated_at BEFORE UPDATE ON user_broker_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_broker_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies para brokers (lectura pública para autenticados)
CREATE POLICY "Anyone can view active brokers"
  ON brokers FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Policies para user_broker_connections
CREATE POLICY "Users can view own broker connections"
  ON user_broker_connections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own broker connections"
  ON user_broker_connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own broker connections"
  ON user_broker_connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own broker connections"
  ON user_broker_connections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies para orders
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own orders"
  ON orders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies para trades
CREATE POLICY "Users can view own trades"
  ON trades FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades"
  ON trades FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policies para positions
CREATE POLICY "Users can view own positions"
  ON positions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own positions"
  ON positions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own positions"
  ON positions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own positions"
  ON positions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies para account_snapshots
CREATE POLICY "Users can view own account snapshots"
  ON account_snapshots FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own account snapshots"
  ON account_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policies para audit_logs
CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =====================================================
-- DATOS INICIALES: Insertar brokers soportados
-- =====================================================
INSERT INTO brokers (code, display_name, description, auth_type, supported_assets, supported_order_types, api_documentation_url, base_url_live, base_url_demo, supports_websocket, websocket_url_live, websocket_url_demo, is_active, logo_url)
VALUES
  (
    'alpaca',
    'Alpaca',
    'Commission-free trading for stocks, ETFs, and crypto with developer-friendly API',
    'api_key',
    ARRAY['stocks', 'etfs', 'crypto'],
    ARRAY['market', 'limit', 'stop', 'stop_limit', 'trailing_stop'],
    'https://docs.alpaca.markets/docs',
    'https://api.alpaca.markets',
    'https://paper-api.alpaca.markets',
    true,
    'wss://stream.data.alpaca.markets',
    'wss://stream.data.alpaca.markets',
    true,
    'https://files.alpaca.markets/webassets/alpaca-logo.svg'
  ),
  (
    'oanda',
    'OANDA',
    'Forex and CFD trading with competitive spreads and powerful API',
    'api_key',
    ARRAY['forex', 'cfds'],
    ARRAY['market', 'limit', 'stop', 'market_if_touched'],
    'https://developer.oanda.com/rest-live-v20/introduction/',
    'https://api-fxtrade.oanda.com',
    'https://api-fxpractice.oanda.com',
    true,
    'wss://stream-fxtrade.oanda.com',
    'wss://stream-fxpractice.oanda.com',
    true,
    'https://www.oanda.com/assets/images/logo/oanda-logo.svg'
  ),
  (
    'interactive_brokers',
    'Interactive Brokers',
    'Multi-asset broker with access to 150+ markets worldwide',
    'oauth2',
    ARRAY['stocks', 'options', 'futures', 'forex', 'bonds', 'funds'],
    ARRAY['market', 'limit', 'stop', 'stop_limit', 'trailing_stop'],
    'https://www.interactivebrokers.com/api/doc.html',
    'https://api.ibkr.com/v1/api',
    'https://api.ibkr.com/v1/api',
    true,
    null,
    null,
    true,
    'https://www.interactivebrokers.com/images/web/ibkr-logo.svg'
  ),
  (
    'metatrader4',
    'MetaTrader 4',
    'Industry-standard forex trading platform',
    'api_key',
    ARRAY['forex', 'cfds'],
    ARRAY['market', 'limit', 'stop'],
    'https://www.mql5.com/en/docs',
    null,
    null,
    true,
    null,
    null,
    true,
    'https://c.mql5.com/i/community/logo_metatrader4.png'
  ),
  (
    'metatrader5',
    'MetaTrader 5',
    'Advanced multi-asset trading platform',
    'api_key',
    ARRAY['forex', 'stocks', 'futures', 'cfds'],
    ARRAY['market', 'limit', 'stop', 'stop_limit'],
    'https://www.mql5.com/en/docs',
    null,
    null,
    true,
    null,
    null,
    true,
    'https://c.mql5.com/i/community/logo_metatrader5.png'
  ),
  (
    'ig_markets',
    'IG Markets',
    'CFD and spread betting on stocks, forex, indices and more',
    'api_key',
    ARRAY['stocks', 'forex', 'cfds', 'options', 'futures'],
    ARRAY['market', 'limit', 'stop', 'trailing_stop'],
    'https://labs.ig.com/rest-trading-api-reference',
    'https://api.ig.com/gateway/deal',
    'https://demo-api.ig.com/gateway/deal',
    true,
    'wss://apd.ig.com',
    'wss://demo-apd.ig.com',
    true,
    'https://www.ig.com/en/images/global/ig-logo.svg'
  ),
  (
    'forex_com',
    'FOREX.com',
    'Forex and CFD trading with advanced platforms',
    'api_key',
    ARRAY['forex', 'cfds', 'crypto'],
    ARRAY['market', 'limit', 'stop'],
    'https://www.forex.com/en-us/trading-platforms/api-trading/',
    'https://api.forex.com',
    'https://demo-api.forex.com',
    true,
    null,
    null,
    true,
    'https://www.forex.com/assets/images/logo.svg'
  )
ON CONFLICT (code) DO NOTHING;