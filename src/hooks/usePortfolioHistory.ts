import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SnapshotData {
  id: string;
  connection_id: string;
  cash_balance: number;
  equity: number;
  portfolio_value: number;
  buying_power: number;
  unrealized_pnl: number;
  realized_pnl_today: number;
  realized_pnl_total: number;
  total_positions_count: number;
  snapshot_at: string;
  broker_name?: string;
  broker_code?: string;
}

export interface AggregatedSnapshot {
  timestamp: string;
  date: string;
  total_equity: number;
  total_cash: number;
  total_unrealized_pnl: number;
  total_realized_pnl: number;
  total_positions: number;
  accounts: {
    connection_id: string;
    broker_name: string;
    equity: number;
    unrealized_pnl: number;
  }[];
}

export type TimeRange = '1D' | '1W' | '1M' | '3M' | 'ALL';

export function usePortfolioHistory(timeRange: TimeRange = '1W') {
  const { user } = useAuth();
  const [snapshots, setSnapshots] = useState<AggregatedSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getDateRange = useCallback((range: TimeRange): Date => {
    const now = new Date();
    switch (range) {
      case '1D':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '1W':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '1M':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '3M':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case 'ALL':
        return new Date(0);
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const startDate = getDateRange(timeRange);

      const { data, error: queryError } = await supabase
        .from('account_snapshots')
        .select(`
          *,
          connection:user_broker_connections(
            id,
            connection_name,
            broker:brokers(code, display_name)
          )
        `)
        .eq('user_id', user.id)
        .gte('snapshot_at', startDate.toISOString())
        .order('snapshot_at', { ascending: true });

      if (queryError) throw queryError;

      // Group snapshots by timestamp (rounded to nearest hour for aggregation)
      const groupedByTime = new Map<string, SnapshotData[]>();
      
      (data || []).forEach((snapshot) => {
        const date = new Date(snapshot.snapshot_at);
        // Round to nearest hour for grouping
        date.setMinutes(0, 0, 0);
        const timeKey = date.toISOString();
        
        const connection = snapshot.connection as { 
          id: string; 
          connection_name: string;
          broker: { code: string; display_name: string } | null;
        } | null;

        const snapshotData: SnapshotData = {
          id: snapshot.id,
          connection_id: snapshot.connection_id,
          cash_balance: Number(snapshot.cash_balance) || 0,
          equity: Number(snapshot.equity) || 0,
          portfolio_value: Number(snapshot.portfolio_value) || 0,
          buying_power: Number(snapshot.buying_power) || 0,
          unrealized_pnl: Number(snapshot.unrealized_pnl) || 0,
          realized_pnl_today: Number(snapshot.realized_pnl_today) || 0,
          realized_pnl_total: Number(snapshot.realized_pnl_total) || 0,
          total_positions_count: snapshot.total_positions_count || 0,
          snapshot_at: snapshot.snapshot_at,
          broker_name: connection?.broker?.display_name || connection?.connection_name || 'Unknown',
          broker_code: connection?.broker?.code,
        };

        if (!groupedByTime.has(timeKey)) {
          groupedByTime.set(timeKey, []);
        }
        groupedByTime.get(timeKey)!.push(snapshotData);
      });

      // Aggregate snapshots by time
      const aggregated: AggregatedSnapshot[] = [];
      
      groupedByTime.forEach((timeSnapshots, timeKey) => {
        // Get latest snapshot per connection for this time period
        const latestByConnection = new Map<string, SnapshotData>();
        timeSnapshots.forEach(s => {
          const existing = latestByConnection.get(s.connection_id);
          if (!existing || new Date(s.snapshot_at) > new Date(existing.snapshot_at)) {
            latestByConnection.set(s.connection_id, s);
          }
        });

        const snapshotsArray = Array.from(latestByConnection.values());
        
        aggregated.push({
          timestamp: timeKey,
          date: new Date(timeKey).toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          }),
          total_equity: snapshotsArray.reduce((sum, s) => sum + s.equity, 0),
          total_cash: snapshotsArray.reduce((sum, s) => sum + s.cash_balance, 0),
          total_unrealized_pnl: snapshotsArray.reduce((sum, s) => sum + s.unrealized_pnl, 0),
          total_realized_pnl: snapshotsArray.reduce((sum, s) => sum + s.realized_pnl_today, 0),
          total_positions: snapshotsArray.reduce((sum, s) => sum + s.total_positions_count, 0),
          accounts: snapshotsArray.map(s => ({
            connection_id: s.connection_id,
            broker_name: s.broker_name || 'Unknown',
            equity: s.equity,
            unrealized_pnl: s.unrealized_pnl,
          })),
        });
      });

      // Sort by timestamp
      aggregated.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      setSnapshots(aggregated);
    } catch (err) {
      console.error('Error fetching portfolio history:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch history');
    } finally {
      setLoading(false);
    }
  }, [user, timeRange, getDateRange]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Calculate statistics
  const stats = {
    startEquity: snapshots[0]?.total_equity || 0,
    endEquity: snapshots[snapshots.length - 1]?.total_equity || 0,
    minEquity: Math.min(...snapshots.map(s => s.total_equity), 0),
    maxEquity: Math.max(...snapshots.map(s => s.total_equity), 0),
    equityChange: (snapshots[snapshots.length - 1]?.total_equity || 0) - (snapshots[0]?.total_equity || 0),
    equityChangePercent: snapshots[0]?.total_equity 
      ? (((snapshots[snapshots.length - 1]?.total_equity || 0) - snapshots[0].total_equity) / snapshots[0].total_equity) * 100
      : 0,
    avgPnl: snapshots.length > 0 
      ? snapshots.reduce((sum, s) => sum + s.total_unrealized_pnl, 0) / snapshots.length 
      : 0,
  };

  return {
    snapshots,
    stats,
    loading,
    error,
    refetch: fetchHistory,
  };
}
