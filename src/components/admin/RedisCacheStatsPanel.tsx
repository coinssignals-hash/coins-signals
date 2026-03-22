import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Trash2, Loader2, Zap, HardDrive, Clock, BarChart3 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { API_CONFIG } from '@/config/api';

interface RedisCacheStats {
  available: boolean;
  message?: string;
  hits: number;
  misses: number;
  hit_rate: number;
  total_keys: number;
  memory_used: string;
  uptime_seconds: number;
  connected_clients?: number;
  total_commands?: number;
  evicted_keys?: number;
  expired_keys?: number;
}

async function fetchRedisStats(): Promise<RedisCacheStats> {
  const res = await fetch(`${API_CONFIG.baseUrl}/api/v1/cache/stats`);
  if (!res.ok) throw new Error('Failed to fetch Redis stats');
  return res.json();
}

async function flushRedisCache(): Promise<{ deleted: number; message: string }> {
  const res = await fetch(`${API_CONFIG.baseUrl}/api/v1/cache/flush`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to flush cache');
  return res.json();
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function RedisCacheStatsPanel() {
  const queryClient = useQueryClient();

  const { data: stats, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['redis-cache-stats'],
    queryFn: fetchRedisStats,
    staleTime: 30_000,
    retry: 1,
  });

  const flushMutation = useMutation({
    mutationFn: flushRedisCache,
    onSuccess: (data) => {
      toast({ title: 'Cache limpiado', description: data.message });
      queryClient.invalidateQueries({ queryKey: ['redis-cache-stats'] });
    },
    onError: () => {
      toast({ title: 'Error', description: 'No se pudo limpiar el cache', variant: 'destructive' });
    },
  });

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
          <span className="ml-2 text-sm text-muted-foreground">Cargando Redis stats...</span>
        </CardContent>
      </Card>
    );
  }

  const available = stats?.available ?? false;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="w-4 h-4 text-red-400" />
            Redis Cache (FastAPI)
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => flushMutation.mutate()}
              disabled={flushMutation.isPending || !available || (stats?.total_keys === 0)}
              className="text-destructive hover:text-destructive"
            >
              {flushMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5 mr-1" />
              )}
              Flush
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!available ? (
          <div className="text-center py-4 text-muted-foreground">
            <HardDrive className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Redis no disponible</p>
            <p className="text-xs">{stats?.message || 'El servidor Redis no está conectado'}</p>
          </div>
        ) : (
          <>
            {/* Hit Rate Hero */}
            <div className="text-center p-4 rounded-lg bg-secondary/50">
              <p className="text-xs text-muted-foreground mb-1">Hit Rate</p>
              <p className={`text-4xl font-bold ${
                (stats?.hit_rate ?? 0) >= 70 ? 'text-emerald-400' :
                (stats?.hit_rate ?? 0) >= 40 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {stats?.hit_rate ?? 0}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.hits?.toLocaleString()} hits / {stats?.misses?.toLocaleString()} misses
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-1.5 mb-1">
                  <BarChart3 className="w-3.5 h-3.5 text-primary" />
                  <p className="text-xs text-muted-foreground">Keys</p>
                </div>
                <p className="text-xl font-bold text-foreground">{stats?.total_keys ?? 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-1.5 mb-1">
                  <HardDrive className="w-3.5 h-3.5 text-primary" />
                  <p className="text-xs text-muted-foreground">Memoria</p>
                </div>
                <p className="text-xl font-bold text-foreground">{stats?.memory_used ?? '0B'}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <p className="text-xs text-muted-foreground">Uptime</p>
                </div>
                <p className="text-xl font-bold text-foreground">{formatUptime(stats?.uptime_seconds ?? 0)}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-1.5 mb-1">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  <p className="text-xs text-muted-foreground">Comandos</p>
                </div>
                <p className="text-xl font-bold text-foreground">
                  {(stats?.total_commands ?? 0) > 1000
                    ? `${((stats?.total_commands ?? 0) / 1000).toFixed(1)}k`
                    : stats?.total_commands ?? 0}
                </p>
              </div>
            </div>

            {/* Extra info */}
            <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t border-border">
              <span>Expiradas: {stats?.expired_keys?.toLocaleString() ?? 0}</span>
              <span>Evicted: {stats?.evicted_keys?.toLocaleString() ?? 0}</span>
              <span>Clientes: {stats?.connected_clients ?? 0}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
