import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

type Period = 'weekly' | 'monthly' | 'alltime';
type Category = 'pnl' | 'winrate' | 'streak' | 'signals';

export function useLeaderboard(period: Period, category: Category) {
  const [traders, setTraders] = useState<LeaderboardTrader[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke(
        'leaderboard-stats',
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          body: undefined,
        }
      );

      // supabase.functions.invoke doesn't support query params natively for GET,
      // so we use POST with body instead — let's fix the call:
      const { data: result, error: err2 } = await supabase.functions.invoke(
        'leaderboard-stats',
        {
          body: null,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      // Actually the edge function reads from URL params — we need to construct the URL manually
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/leaderboard-stats?period=${period}&category=${category}&limit=50`;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const res = await window.fetch(url, {
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
    fetch();
  }, [fetch]);

  return { traders, total, loading, error, refetch: fetch };
}
