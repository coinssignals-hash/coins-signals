import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Returns a Set of signal IDs that have been saved to the trading journal
 * by the current user. Lightweight query — only fetches signal_id column.
 */
export function useJournalSignalIds() {
  const [ids, setIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    const fetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      const { data } = await supabase
        .from('trading_journal')
        .select('signal_id')
        .eq('user_id', session.user.id)
        .not('signal_id', 'is', null);

      if (!cancelled && data) {
        setIds(new Set(data.map((r) => r.signal_id).filter(Boolean) as string[]));
      }
    };

    fetch();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetch();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return ids;
}
