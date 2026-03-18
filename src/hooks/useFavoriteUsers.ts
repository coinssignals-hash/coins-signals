import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface FavoriteUser {
  id: string;
  user_id: string;
  favorite_user_id: string;
  created_at: string;
  // Joined
  name: string;
  avatar_url: string | null;
}

export function useFavoriteUsers() {
  const [favorites, setFavorites] = useState<FavoriteUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchFavorites = useCallback(async () => {
    if (!user) { setFavorites([]); setLoading(false); return; }
    
    const { data } = await supabase
      .from('favorite_users' as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!data || data.length === 0) { setFavorites([]); setLoading(false); return; }

    const favUserIds = (data as any[]).map((d: any) => d.favorite_user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, alias, avatar_url')
      .in('id', favUserIds);

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    setFavorites((data as any[]).map((d: any) => {
      const p = profileMap.get(d.favorite_user_id);
      return {
        ...d,
        name: p ? ((p as any).alias || `${p.first_name || ''} ${p.last_name || ''}`.trim()) || 'Anónimo' : 'Anónimo',
        avatar_url: p?.avatar_url || null,
      };
    }));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchFavorites(); }, [fetchFavorites]);

  const isFavorite = useCallback((userId: string) => {
    return favorites.some(f => f.favorite_user_id === userId);
  }, [favorites]);

  const toggleFavorite = useCallback(async (targetUserId: string, targetName?: string) => {
    if (!user) { toast.error('Inicia sesión para agregar amigos'); return; }
    if (targetUserId === user.id) { toast.error('No puedes agregarte a ti mismo'); return; }

    const existing = favorites.find(f => f.favorite_user_id === targetUserId);
    if (existing) {
      await supabase.from('favorite_users' as any).delete().eq('id', existing.id);
      toast.success(`${targetName || 'Usuario'} eliminado de favoritos`);
    } else {
      await supabase.from('favorite_users' as any).insert({
        user_id: user.id,
        favorite_user_id: targetUserId,
      });
      toast.success(`${targetName || 'Usuario'} agregado a favoritos ⭐`);
    }
    fetchFavorites();
  }, [user, favorites, fetchFavorites]);

  return { favorites, loading, isFavorite, toggleFavorite };
}
