import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Position {
  symbol: string;
  quantity: number;
  average_entry_price: number;
  current_price: number;
  market_value: number;
  unrealized_pnl: number;
  unrealized_pnl_percent: number;
  side: 'long' | 'short';
  commission?: number;
  spread?: number;
  swap?: number;
}

export interface AccountData {
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

export interface PortfolioSummary {
  total_equity: number;
  total_cash: number;
  total_unrealized_pnl: number;
  total_realized_pnl: number;
  total_positions: number;
}

export interface RealtimePriceUpdate {
  symbol: string;
  price: number;
  timestamp: number;
}

// Demo data for non-authenticated users
const DEMO_ACCOUNTS: AccountData[] = [
  {
    connection_id: 'demo-1',
    broker_code: 'alpaca',
    broker_name: 'Alpaca (Demo)',
    environment: 'paper',
    cash_balance: 25420.50,
    equity: 48750.25,
    buying_power: 50000,
    unrealized_pnl: 1823.45,
    realized_pnl_today: 342.80,
    margin_used: 12500,
    margin_available: 37500,
    currency: 'USD',
    last_updated: new Date().toISOString(),
    positions: [
      { symbol: 'AAPL', quantity: 50, average_entry_price: 178.50, current_price: 192.30, market_value: 9615, unrealized_pnl: 690, unrealized_pnl_percent: 7.72, side: 'long', commission: 1.50, spread: 0.02 },
      { symbol: 'TSLA', quantity: 25, average_entry_price: 245.00, current_price: 268.40, market_value: 6710, unrealized_pnl: 585, unrealized_pnl_percent: 9.55, side: 'long', commission: 1.50, spread: 0.05 },
      { symbol: 'NVDA', quantity: 30, average_entry_price: 485.20, current_price: 512.80, market_value: 15384, unrealized_pnl: 828, unrealized_pnl_percent: 5.69, side: 'long', commission: 1.50, spread: 0.10 },
    ],
  },
  {
    connection_id: 'demo-2',
    broker_code: 'ibkr',
    broker_name: 'Interactive Brokers (Demo)',
    environment: 'paper',
    cash_balance: 15320.75,
    equity: 32180.50,
    buying_power: 40000,
    unrealized_pnl: -456.30,
    realized_pnl_today: 128.50,
    margin_used: 8000,
    margin_available: 32000,
    currency: 'USD',
    last_updated: new Date().toISOString(),
    positions: [
      { symbol: 'EUR/USD', quantity: 10000, average_entry_price: 1.0892, current_price: 1.0845, market_value: 10845, unrealized_pnl: -470, unrealized_pnl_percent: -4.31, side: 'long', spread: 1.2, swap: -3.50 },
      { symbol: 'BTC/USD', quantity: 0.15, average_entry_price: 42500, current_price: 43200, market_value: 6480, unrealized_pnl: 105, unrealized_pnl_percent: 1.65, side: 'long', spread: 15.0, swap: -1.20 },
    ],
  },
];

const DEMO_SUMMARY: PortfolioSummary = {
  total_equity: 80930.75,
  total_cash: 40741.25,
  total_unrealized_pnl: 1367.15,
  total_realized_pnl: 471.30,
  total_positions: 5,
};

export function usePortfolio() {
  const { session } = useAuth();
  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary>({
    total_equity: 0,
    total_cash: 0,
    total_unrealized_pnl: 0,
    total_realized_pnl: 0,
    total_positions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [realtimePrices, setRealtimePrices] = useState<Map<string, RealtimePriceUpdate>>(new Map());
  const wsRef = useRef<WebSocket | null>(null);
  const liveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDemo = !session?.access_token;

  const fetchPortfolio = useCallback(async () => {
    // Return demo data for non-authenticated users
    if (!session?.access_token) {
      setAccounts(DEMO_ACCOUNTS);
      setSummary(DEMO_SUMMARY);
      setLastRefresh(new Date());
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const { data, error: fetchError } = await supabase.functions.invoke('broker-portfolio', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (fetchError) throw fetchError;

      setAccounts(data.accounts || []);
      setSummary(data.summary || {
        total_equity: 0,
        total_cash: 0,
        total_unrealized_pnl: 0,
        total_realized_pnl: 0,
        total_positions: 0,
      });
      setLastRefresh(new Date());
      
      // Trigger live indicator
      setIsLive(true);
      if (liveTimeoutRef.current) clearTimeout(liveTimeoutRef.current);
      liveTimeoutRef.current = setTimeout(() => setIsLive(false), 2000);
    } catch (err) {
      console.error('Error fetching portfolio:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch portfolio');
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  // Connect to realtime price WebSocket for position symbols
  useEffect(() => {
    if (accounts.length === 0) return;
    
    const symbols = accounts.flatMap(a => a.positions.map(p => p.symbol));
    const uniqueSymbols = [...new Set(symbols)];
    
    if (uniqueSymbols.length === 0) return;

    const connectWebSocket = async () => {
      try {
        const { data } = await supabase.functions.invoke('realtime-market', {
          body: { symbols: uniqueSymbols.slice(0, 10) }, // Limit to 10 symbols
        });
        
        if (data?.wsUrl) {
          wsRef.current = new WebSocket(data.wsUrl);
          
          wsRef.current.onmessage = (event) => {
            try {
              const msg = JSON.parse(event.data);
              if (msg.ev === 'C' || msg.ev === 'A' || msg.ev === 'T') { // Forex, Crypto, Stock quotes
                const symbol = msg.pair || msg.sym || msg.S;
                const price = msg.c || msg.p || msg.bp || 0;
                
                if (symbol && price) {
                  setRealtimePrices(prev => {
                    const next = new Map(prev);
                    next.set(symbol, { symbol, price, timestamp: Date.now() });
                    return next;
                  });
                  
                  // Trigger live indicator
                  setIsLive(true);
                  if (liveTimeoutRef.current) clearTimeout(liveTimeoutRef.current);
                  liveTimeoutRef.current = setTimeout(() => setIsLive(false), 1000);
                }
              }
            } catch (e) {
              console.error('WS parse error:', e);
            }
          };
        }
      } catch (err) {
        console.error('WebSocket connection failed:', err);
      }
    };

    connectWebSocket();

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [accounts]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!session?.access_token) return;

    const interval = setInterval(() => {
      fetchPortfolio();
    }, 30000);

    return () => clearInterval(interval);
  }, [session?.access_token, fetchPortfolio]);

  // Compute positions with realtime prices
  const getAccountsWithRealtimePrices = useCallback((): AccountData[] => {
    if (realtimePrices.size === 0) return accounts;
    
    return accounts.map(account => ({
      ...account,
      positions: account.positions.map(pos => {
        const rtPrice = realtimePrices.get(pos.symbol);
        if (!rtPrice) return pos;
        
        const current_price = rtPrice.price;
        const market_value = pos.quantity * current_price;
        const cost_basis = pos.quantity * pos.average_entry_price;
        const unrealized_pnl = pos.side === 'long' 
          ? market_value - cost_basis 
          : cost_basis - market_value;
        const unrealized_pnl_percent = cost_basis !== 0 
          ? (unrealized_pnl / Math.abs(cost_basis)) * 100 
          : 0;
        
        return {
          ...pos,
          current_price,
          market_value,
          unrealized_pnl,
          unrealized_pnl_percent,
        };
      }),
    }));
  }, [accounts, realtimePrices]);

  const getAllPositions = useCallback((): (Position & { broker: string })[] => {
    const accountsWithRT = getAccountsWithRealtimePrices();
    return accountsWithRT.flatMap(account => 
      account.positions.map(pos => ({
        ...pos,
        broker: account.broker_name,
      }))
    );
  }, [getAccountsWithRealtimePrices]);

  // Compute summary with realtime prices
  const getRealtimeSummary = useCallback((): PortfolioSummary => {
    const accountsWithRT = getAccountsWithRealtimePrices();
    
    if (accountsWithRT.length === 0) return summary;
    
    const total_unrealized_pnl = accountsWithRT.reduce((sum, acc) => 
      sum + acc.positions.reduce((pSum, p) => pSum + p.unrealized_pnl, 0), 0);
    
    const total_positions = accountsWithRT.reduce((sum, acc) => sum + acc.positions.length, 0);
    
    return {
      ...summary,
      total_unrealized_pnl,
      total_positions,
    };
  }, [summary, getAccountsWithRealtimePrices]);

  return {
    accounts: getAccountsWithRealtimePrices(),
    summary: getRealtimeSummary(),
    loading,
    error,
    lastRefresh,
    isLive,
    isDemo,
    realtimePrices,
    refetch: fetchPortfolio,
    getAllPositions,
  };
}
