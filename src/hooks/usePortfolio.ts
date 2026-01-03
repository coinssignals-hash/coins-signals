import { useState, useEffect, useCallback } from 'react';
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

  const fetchPortfolio = useCallback(async () => {
    if (!session?.access_token) {
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
    } catch (err) {
      console.error('Error fetching portfolio:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch portfolio');
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

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

  const getAllPositions = useCallback((): (Position & { broker: string })[] => {
    return accounts.flatMap(account => 
      account.positions.map(pos => ({
        ...pos,
        broker: account.broker_name,
      }))
    );
  }, [accounts]);

  return {
    accounts,
    summary,
    loading,
    error,
    lastRefresh,
    refetch: fetchPortfolio,
    getAllPositions,
  };
}
