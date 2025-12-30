import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface FavoriteSymbol {
  id: string;
  symbol: string;
  symbol_name: string | null;
  symbol_type: string;
  created_at: string;
}

export function useFavoriteSymbols() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteSymbol[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('favorite_symbols')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavorites((data as FavoriteSymbol[]) || []);
    } catch (error) {
      console.error('Error fetching favorite symbols:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const addFavorite = async (symbol: string, symbolName?: string, symbolType: string = 'Forex') => {
    if (!user) {
      toast.error('Inicia sesión para guardar favoritos');
      return false;
    }

    try {
      const { error } = await supabase
        .from('favorite_symbols')
        .insert({
          user_id: user.id,
          symbol,
          symbol_name: symbolName || null,
          symbol_type: symbolType
        });

      if (error) {
        if (error.code === '23505') {
          toast.info('Este símbolo ya está en favoritos');
          return false;
        }
        throw error;
      }

      toast.success(`${symbol} añadido a favoritos`);
      await fetchFavorites();
      return true;
    } catch (error) {
      console.error('Error adding favorite symbol:', error);
      toast.error('Error al añadir favorito');
      return false;
    }
  };

  const removeFavorite = async (symbol: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('favorite_symbols')
        .delete()
        .eq('user_id', user.id)
        .eq('symbol', symbol);

      if (error) throw error;

      toast.success(`${symbol} eliminado de favoritos`);
      await fetchFavorites();
      return true;
    } catch (error) {
      console.error('Error removing favorite symbol:', error);
      toast.error('Error al eliminar favorito');
      return false;
    }
  };

  const isFavorite = (symbol: string) => {
    return favorites.some(f => f.symbol === symbol);
  };

  return {
    favorites,
    loading,
    addFavorite,
    removeFavorite,
    isFavorite,
    refetch: fetchFavorites
  };
}
