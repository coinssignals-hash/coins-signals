import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, RefreshCw, Trash2, Clock, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { useDateLocale } from '@/hooks/useDateLocale';
import { useTranslation } from '@/i18n/LanguageContext';

interface CacheStats {
  total: number;
  byType: Record<string, number>;
  expired: number;
  oldestEntry: string | null;
  newestEntry: string | null;
}

interface CacheEntry {
  id: string;
  symbol: string;
  analysis_type: string;
  created_at: string;
  expires_at: string;
  current_price: number | null;
}

export function CacheStatsPanel() {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [entries, setEntries] = useState<CacheEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      // Fetch all cache entries
      const { data, error } = await supabase
        .from('ai_analysis_cache')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const now = new Date();
      const entries = data || [];
      
      // Calculate stats
      const byType: Record<string, number> = {};
      let expired = 0;
      
      entries.forEach((entry: CacheEntry) => {
        byType[entry.analysis_type] = (byType[entry.analysis_type] || 0) + 1;
        if (new Date(entry.expires_at) < now) {
          expired++;
        }
      });

      setEntries(entries);
      setStats({
        total: entries.length,
        byType,
        expired,
        oldestEntry: entries.length > 0 ? entries[entries.length - 1].created_at : null,
        newestEntry: entries.length > 0 ? entries[0].created_at : null,
      });
    } catch (error) {
      console.error('Error fetching cache stats:', error);
      toast({
        title: 'Error',
        description: t('cache_error_load'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearExpired = async () => {
    setIsClearing(true);
    try {
      const { data, error } = await supabase.functions.invoke('cleanup-ai-cache');
      
      if (error) throw error;
      
      toast({
        title: t('cache_cleaned'),
        description: t('cache_cleaned_desc').replace('{count}', String(data.deleted)),
      });
      
      await fetchStats();
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast({
        title: 'Error',
        description: t('cache_error_clean'),
        variant: 'destructive',
      });
    } finally {
      setIsClearing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      sentiment: t('cache_type_sentiment'),
      prediction: t('cache_type_prediction'),
      conclusions: t('cache_type_conclusions'),
      recommendations: t('cache_type_recommendations'),
      technical_levels: t('cache_type_technical'),
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      sentiment: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      prediction: 'bg-green-500/20 text-green-400 border-green-500/30',
      conclusions: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      recommendations: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      technical_levels: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    };
    return colors[type] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <span className="ml-2 text-muted-foreground">{t('cache_loading')}</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="w-5 h-5 text-primary" />
            {t('cache_title')}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStats}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearExpired}
              disabled={isClearing || (stats?.expired === 0)}
              className="text-destructive hover:text-destructive"
            >
              {isClearing ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-1" />
              )}
              Limpiar Expirados
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-secondary/50">
            <p className="text-xs text-muted-foreground">Total Entradas</p>
            <p className="text-2xl font-bold text-foreground">{stats?.total || 0}</p>
          </div>
          <div className="p-3 rounded-lg bg-secondary/50">
            <p className="text-xs text-muted-foreground">Activas</p>
            <p className="text-2xl font-bold text-green-400">
              {(stats?.total || 0) - (stats?.expired || 0)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-secondary/50">
            <p className="text-xs text-muted-foreground">Expiradas</p>
            <p className="text-2xl font-bold text-red-400">{stats?.expired || 0}</p>
          </div>
          <div className="p-3 rounded-lg bg-secondary/50">
            <p className="text-xs text-muted-foreground">Tipos</p>
            <p className="text-2xl font-bold text-foreground">
              {Object.keys(stats?.byType || {}).length}
            </p>
          </div>
        </div>

        {/* By Type Breakdown */}
        {stats && Object.keys(stats.byType).length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Por Tipo de Análisis</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byType).map(([type, count]) => (
                <span
                  key={type}
                  className={`px-3 py-1.5 text-sm rounded-full border ${getTypeColor(type)}`}
                >
                  {getTypeLabel(type)}: <span className="font-bold">{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recent Entries */}
        {entries.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Entradas Recientes</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {entries.slice(0, 10).map((entry) => {
                const isExpired = new Date(entry.expires_at) < new Date();
                return (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between p-2 rounded-lg bg-secondary/30 ${
                      isExpired ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 text-xs rounded border ${getTypeColor(entry.analysis_type)}`}>
                        {getTypeLabel(entry.analysis_type)}
                      </span>
                      <span className="text-sm font-medium text-foreground">{entry.symbol}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale: es })}
                      {isExpired && (
                        <span className="text-red-400 font-medium">(expirado)</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Timestamps */}
        {stats?.newestEntry && (
          <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t border-border">
            <span>
              Más reciente: {format(new Date(stats.newestEntry), 'dd/MM/yyyy HH:mm', { locale: es })}
            </span>
            {stats.oldestEntry && (
              <span>
                Más antiguo: {format(new Date(stats.oldestEntry), 'dd/MM/yyyy HH:mm', { locale: es })}
              </span>
            )}
          </div>
        )}

        {/* Empty State */}
        {stats?.total === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No hay entradas en el cache</p>
            <p className="text-xs">Los análisis IA se guardarán aquí automáticamente</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
