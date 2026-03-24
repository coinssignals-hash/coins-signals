import { useState, useEffect, useCallback } from 'react';

export interface LeaderboardTrader {
  id: string;
  rank: number;
  alias: string;
  avatar_url: string | null;
  country: string | null;
  pnl: number;
  winRate: number;
  trades: number;
  streak: number;
  winners: number;
  losers: number;
  symbolsTraded: number;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond' | 'legendary';
}

export type LeaderboardPeriod = 'weekly' | 'monthly' | 'alltime';
export type LeaderboardCategory = 'pnl' | 'winrate' | 'streak' | 'signals';

export function useLeaderboard(period: LeaderboardPeriod, category: LeaderboardCategory) {
  const [traders, setTraders] = useState<LeaderboardTrader[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const url = `https://${projectId}.supabase.co/functions/v1/leaderboard-stats?period=${period}&category=${category}&limit=50`;

      const res = await fetch(url, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      setTraders(json.traders || []);
      setTotal(json.total || 0);
    } catch (e: any) {
      console.error('Leaderboard fetch error:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [period, category]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { traders, total, loading, error, refetch: fetchData };
}
