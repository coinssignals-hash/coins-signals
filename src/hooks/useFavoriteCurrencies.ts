import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Currency } from '@/types/news';
import { toast } from 'sonner';

const STORAGE_KEY = 'favorite_currencies';

export function useFavoriteCurrencies() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);

  // Load favorites from database or localStorage
  const fetchFavorites = useCallback(async () => {
    if (user) {
      // Fetch from database for authenticated users
      try {
        const { data, error } = await supabase
          .from('favorite_currencies')
          .select('currency')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setFavorites((data?.map(d => d.currency as Currency)) || []);
      } catch (error) {
        console.error('Error fetching favorite currencies:', error);
        // Fallback to localStorage
        loadFromLocalStorage();
      }
    } else {
      // Use localStorage for guests
      loadFromLocalStorage();
    }
    setLoading(false);
  }, [user]);

  const loadFromLocalStorage = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch {
        setFavorites([]);
      }
    }
  };

  // Sync localStorage favorites to database when user logs in
  const syncLocalToDatabase = useCallback(async () => {
    if (!user) return;
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    
    try {
      const localFavorites: Currency[] = JSON.parse(stored);
      if (localFavorites.length === 0) return;

      // Insert local favorites to database (ignore duplicates)
      for (const currency of localFavorites) {
        await supabase
          .from('favorite_currencies')
          .upsert(
            { user_id: user.id, currency },
            { onConflict: 'user_id,currency', ignoreDuplicates: true }
          );
      }

      // Clear localStorage after syncing
      localStorage.removeItem(STORAGE_KEY);
      
      // Refresh from database
      await fetchFavorites();
    } catch (error) {
      console.error('Error syncing favorites to database:', error);
    }
  }, [user, fetchFavorites]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Sync local favorites when user logs in
  useEffect(() => {
    if (user) {
      syncLocalToDatabase();
    }
  }, [user, syncLocalToDatabase]);

  const addFavorite = useCallback(async (currency: Currency) => {
    if (favorites.includes(currency)) return;

    if (user) {
      // Save to database
      try {
        const { error } = await supabase
          .from('favorite_currencies')
          .insert({ user_id: user.id, currency });

        if (error) {
          if (error.code === '23505') {
            // Already exists, just update local state
            setFavorites(prev => [...prev, currency]);
            return;
          }
          throw error;
        }

        setFavorites(prev => [...prev, currency]);
      } catch (error) {
        console.error('Error adding favorite currency:', error);
        toast.error('Error al añadir divisa favorita');
      }
    } else {
      // Save to localStorage for guests
      const newFavorites = [...favorites, currency];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    }
  }, [favorites, user]);

  const removeFavorite = useCallback(async (currency: Currency) => {
    if (user) {
      // Remove from database
      try {
        const { error } = await supabase
          .from('favorite_currencies')
          .delete()
          .eq('user_id', user.id)
          .eq('currency', currency);

        if (error) throw error;

        setFavorites(prev => prev.filter(c => c !== currency));
      } catch (error) {
        console.error('Error removing favorite currency:', error);
        toast.error('Error al eliminar divisa favorita');
      }
    } else {
      // Remove from localStorage for guests
      const newFavorites = favorites.filter(c => c !== currency);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    }
  }, [favorites, user]);

  const toggleFavorite = useCallback(async (currency: Currency) => {
    if (favorites.includes(currency)) {
      await removeFavorite(currency);
    } else {
      await addFavorite(currency);
    }
  }, [favorites, addFavorite, removeFavorite]);

  const isFavorite = useCallback((currency: Currency) => {
    return favorites.includes(currency);
  }, [favorites]);

  return {
    favorites,
    loading,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    refetch: fetchFavorites,
  };
}
