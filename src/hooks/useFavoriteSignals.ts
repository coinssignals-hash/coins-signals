import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useFavoriteSignals() {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUserId(session?.user?.id ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) {
      setFavoriteIds(new Set());
      setLoading(false);
      return;
    }

    const fetchFavorites = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('favorite_signals')
        .select('signal_id')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching favorites:', error);
      } else {
        setFavoriteIds(new Set(data?.map((f) => f.signal_id) || []));
      }
      setLoading(false);
    };

    fetchFavorites();

    // Subscribe to changes
    const channel = supabase
      .channel('favorite-signals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'favorite_signals',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newFav = payload.new as { signal_id: string };
            setFavoriteIds((prev) => new Set([...prev, newFav.signal_id]));
          } else if (payload.eventType === 'DELETE') {
            const oldFav = payload.old as { signal_id: string };
            setFavoriteIds((prev) => {
              const newSet = new Set(prev);
              newSet.delete(oldFav.signal_id);
              return newSet;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const toggleFavorite = useCallback(async (signalId: string) => {
    if (!userId) {
      toast.error('Inicia sesión para guardar favoritos');
      return;
    }

    const isFavorite = favoriteIds.has(signalId);

    if (isFavorite) {
      // Remove from favorites
      const { error } = await supabase
        .from('favorite_signals')
        .delete()
        .eq('user_id', userId)
        .eq('signal_id', signalId);

      if (error) {
        console.error('Error removing favorite:', error);
        toast.error('Error al eliminar favorito');
      } else {
        toast.success('Eliminado de favoritos');
      }
    } else {
      // Add to favorites
      const { error } = await supabase
        .from('favorite_signals')
        .insert({ user_id: userId, signal_id: signalId });

      if (error) {
        console.error('Error adding favorite:', error);
        toast.error('Error al añadir favorito');
      } else {
        toast.success('Añadido a favoritos');
      }
    }
  }, [userId, favoriteIds]);

  const isFavorite = useCallback((signalId: string) => {
    return favoriteIds.has(signalId);
  }, [favoriteIds]);

  return {
    favoriteIds,
    loading,
    toggleFavorite,
    isFavorite,
    isAuthenticated: !!userId,
  };
}