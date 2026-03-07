import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ReferralStats {
  total: number;
  completed: number;
  pending: number;
  totalEarned: number;
  totalDays: number;
  referrals: {
    id: string;
    status: string;
    reward_amount: number;
    reward_days: number;
    created_at: string;
    completed_at: string | null;
  }[];
}

export function useReferrals() {
  const [code, setCode] = useState<string | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [codeLoading, setCodeLoading] = useState(false);

  const fetchCode = useCallback(async () => {
    setCodeLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('referrals', {
        body: { action: 'get-code' },
      });
      if (error) throw error;
      setCode(data?.code ?? null);
    } catch (err) {
      console.error('Error fetching referral code:', err);
    } finally {
      setCodeLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('referrals', {
        body: { action: 'stats' },
      });
      if (error) throw error;
      setStats(data ?? null);
    } catch (err) {
      console.error('Error fetching referral stats:', err);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchCode(), fetchStats()]);
    setLoading(false);
  }, [fetchCode, fetchStats]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        loadAll();
      } else {
        setLoading(false);
      }
    };
    checkAuth();
  }, [loadAll]);

  const getReferralLink = useCallback(() => {
    if (!code) return '';
    return `${window.location.origin}/auth?ref=${code}`;
  }, [code]);

  return {
    code,
    stats,
    loading,
    codeLoading,
    referralLink: getReferralLink(),
    refresh: loadAll,
  };
}
