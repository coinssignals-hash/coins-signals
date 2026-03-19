import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { GlowCard } from '@/components/ui/glow-card';
import { CardContent } from '@/components/ui/card';
import { Star, Mail, MessageCircle, Loader2 } from 'lucide-react';
import { FavoriteUser } from '@/hooks/useFavoriteUsers';
import { cn } from '@/lib/utils';
import { isLegendaryAvatar, LEGENDARY_RING_CLASS } from '@/lib/legendaryAvatar';

interface Props {
  favorites: FavoriteUser[];
  loading: boolean;
  onOpenDM: (userId: string, name: string) => void;
  onRemove: (userId: string, name: string) => void;
}

export function FavoriteUsersPanel({ favorites, loading, onOpenDM, onRemove }: Props) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <GlowCard color="210 70% 55%">
        <div className="p-6 text-center space-y-2">
          <Star className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-xs text-muted-foreground">
            No tienes usuarios favoritos aún
          </p>
          <p className="text-[10px] text-muted-foreground">
            Toca la ⭐ en el chat para agregar amigos
          </p>
        </div>
      </GlowCard>
    );
  }

  return (
    <div className="space-y-1.5">
      {favorites.map(fav => {
        const legendary = isLegendaryAvatar(fav.avatar_url);
        return (
          <GlowCard key={fav.id} color="210 70% 55%" className="rounded-xl">
            <div className="flex items-center gap-3 p-3">
            <div className="relative">
              <Avatar className={cn("w-9 h-9", legendary && LEGENDARY_RING_CLASS)}>
                <AvatarImage src={fav.avatar_url || ''} />
                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                  {fav.name[0]}
                </AvatarFallback>
              </Avatar>
              {legendary && <span className="absolute -bottom-0.5 -right-0.5 text-[8px]">👑</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                {fav.name}
                {legendary && <span className="text-[9px]">👑</span>}
              </p>
              <p className="text-[10px] text-muted-foreground">
                <Star className="w-3 h-3 inline text-yellow-500 mr-0.5" />
                Favorito
              </p>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => onOpenDM(fav.favorite_user_id, fav.name)}
                className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
                title="Enviar mensaje"
              >
                <Mail className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onRemove(fav.favorite_user_id, fav.name)}
                className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-yellow-500 hover:text-destructive hover:border-destructive/30 transition-colors"
                title="Quitar de favoritos"
              >
                <Star className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
