import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useUserRole() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin',
      });

      if (!cancelled) {
        setIsAdmin(data === true && !error);
        setLoading(false);
      }
    };

    checkRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      setLoading(true);
      checkRole();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return { isAdmin, loading };
}
