import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { useNewsCache } from '@/hooks/useNewsCache';
import { Archive, Clock, Trash2, ArrowLeft, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n/LanguageContext';

const SavedNews = () => {
  const { getAllCachedNews, clearCache } = useNewsCache();
  const [refreshKey, setRefreshKey] = useState(0);
  const { t } = useTranslation();
  const cachedNews = getAllCachedNews();

  const handleClearCache = () => {
    clearCache();
    setRefreshKey(prev => prev + 1);
    toast.success(t('saved_clear'));
  };

  return (
    <PageShell>
      <Header />
      
      {/* ── Premium Hero Header ── */}
      <div className="relative overflow-hidden" style={{
        background: 'linear-gradient(165deg, hsl(210 80% 55% / 0.15) 0%, hsl(var(--background)) 50%)',
      }}>
        <div className="absolute top-0 inset-x-0 h-[2px]" style={{
          background: 'linear-gradient(90deg, transparent, hsl(210 80% 55% / 0.8), transparent)',
        }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-40 rounded-full opacity-20 pointer-events-none" style={{
          background: 'radial-gradient(circle, hsl(210 80% 55% / 0.5), transparent 70%)',
        }} />
        <div className="relative px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/news" className="flex items-center justify-center w-8 h-8 rounded-xl transition-all active:scale-90"
              style={{ background: 'hsl(210 80% 55% / 0.1)', border: '1px solid hsl(210 80% 55% / 0.2)' }}>
              <ArrowLeft className="w-4 h-4" style={{ color: 'hsl(210 80% 55%)' }} />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{
                background: 'linear-gradient(165deg, hsl(210 80% 55% / 0.25), hsl(210 80% 55% / 0.08))',
                border: '1px solid hsl(210 80% 55% / 0.3)',
                boxShadow: '0 0 20px hsl(210 80% 55% / 0.15)',
              }}>
                <Archive className="w-5 h-5" style={{ color: 'hsl(210 80% 55%)' }} />
              </div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">{t('saved_title')}</h1>
            </div>
          </div>
          
          {cachedNews.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4 mr-1" />
                  {t('saved_clear')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('saved_confirm_title')}</AlertDialogTitle>
                  <AlertDialogDescription>{t('saved_confirm_desc')}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common_cancel') || 'Cancelar'}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearCache} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {t('saved_clear_all')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <main className="px-4 space-y-6 pb-24">
        {/* Info banner */}
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-sm text-muted-foreground">
          <p>{t('saved_info')}</p>
        </div>

        {/* News list */}
        {cachedNews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
              <Newspaper className="w-10 h-10 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">{t('saved_empty_title')}</h2>
              <p className="text-sm text-muted-foreground max-w-sm">{t('saved_empty_desc')}</p>
            </div>
            <Link to="/news">
              <Button className="gap-2">
                <Newspaper className="w-4 h-4" />
                {t('saved_view_recent')}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {cachedNews.length} {cachedNews.length === 1 ? t('saved_count_one') : t('saved_count_many')}
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
    </PageShell>
  );
};

export default SavedNews;
