import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { useNewsCache } from '@/hooks/useNewsCache';
import { Archive, Clock, Trash2, ArrowLeft, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const SavedNews = () => {
  const { getAllCachedNews, clearCache } = useNewsCache();
  const [refreshKey, setRefreshKey] = useState(0);
  
  const cachedNews = getAllCachedNews();

  const handleClearCache = () => {
    clearCache();
    setRefreshKey(prev => prev + 1);
    toast.success('Caché de noticias limpiado');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(222,45%,7%)] via-[hsl(218,52%,8%)] to-[hsl(222,45%,7%)] pb-20 md:pb-0">
      <Header />
      
      <main className="container py-4 space-y-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/news" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Archive className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Noticias Guardadas</h1>
            </div>
          </div>
          
          {cachedNews.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4 mr-1" />
                  Limpiar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Limpiar todas las noticias guardadas?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción eliminará todas las noticias guardadas en el caché local. No podrás ver noticias antiguas que ya no estén en el feed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearCache} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Limpiar todo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Info banner */}
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-sm text-muted-foreground">
          <p>Las noticias que visitas se guardan automáticamente durante 7 días, permitiéndote verlas aunque ya no estén en el feed.</p>
        </div>

        {/* News list */}
        {cachedNews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
              <Newspaper className="w-10 h-10 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">No hay noticias guardadas</h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                Las noticias que visites se guardarán automáticamente aquí para que puedas verlas más tarde.
              </p>
            </div>
            <Link to="/news">
              <Button className="gap-2">
                <Newspaper className="w-4 h-4" />
                Ver noticias recientes
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {cachedNews.length} {cachedNews.length === 1 ? 'noticia guardada' : 'noticias guardadas'}
            </p>
            
            <div className="space-y-3">
              {cachedNews.map((item) => (
                <Link 
                  key={item.id} 
                  to={`/news/${item.id}`}
                  className="flex gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-all group"
                >
                  {item.image_url && (
                    <img 
                      src={item.image_url} 
                      alt="" 
                      className="w-20 h-20 rounded-md object-cover flex-shrink-0"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {item.summary}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{item.source}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.time_ago}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {item.affected_currencies.slice(0, 4).map((currency) => (
                        <span 
                          key={currency}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary font-medium"
                        >
                          {currency}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
      
      <BottomNav />
    </div>
  );
};

export default SavedNews;
