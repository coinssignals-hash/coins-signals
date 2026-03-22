import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, CheckCircle2, XCircle, Clock, SkipForward, Activity, Server, Database, Shield, HardDrive, Zap, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RedisCacheStatsPanel } from './RedisCacheStatsPanel';

interface ServiceCheck {
  name: string;
  status: 'ok' | 'error' | 'timeout' | 'skipped';
  latency_ms: number;
  message?: string;
  details?: Record<string, unknown>;
}

interface HealthResponse {
  status: 'healthy' | 'degraded';
  timestamp: string;
  total_latency_ms: number;
  summary: { total: number; ok: number; error: number; timeout: number; skipped: number };
  services: ServiceCheck[];
}

const SERVICE_ICONS: Record<string, React.ElementType> = {
  'PostgreSQL Database': Database,
  'Auth Service': Shield,
  'Storage Service': HardDrive,
  'FastAPI Backend': Server,
  'Lovable AI Gateway': Zap,
};

const STATUS_CONFIG = {
  ok: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'OK' },
  error: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', label: 'Error' },
  timeout: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Timeout' },
  skipped: { icon: SkipForward, color: 'text-white/30', bg: 'bg-white/5 border-white/10', label: 'Omitido' },
};

async function fetchHealthCheck(): Promise<HealthResponse> {
  const { data, error } = await supabase.functions.invoke('health-check');
  if (error) throw error;
  return data as HealthResponse;
}

export function AdminHealthCheckTab() {
  const { data, isLoading, refetch, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['admin-health-check'],
    queryFn: fetchHealthCheck,
    staleTime: 0,
    retry: false,
  });

  const infrastructure = data?.services.filter(s =>
    ['PostgreSQL Database', 'Auth Service', 'Storage Service', 'FastAPI Backend', 'Lovable AI Gateway'].includes(s.name)
  ) ?? [];

  const externalAPIs = data?.services.filter(s =>
    !['PostgreSQL Database', 'Auth Service', 'Storage Service', 'FastAPI Backend', 'Lovable AI Gateway'].includes(s.name)
  ) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            data?.status === 'healthy' ? 'bg-emerald-500/10' : data?.status === 'degraded' ? 'bg-amber-500/10' : 'bg-white/5'
          )}>
            <Activity className={cn('h-5 w-5', data?.status === 'healthy' ? 'text-emerald-400' : data?.status === 'degraded' ? 'text-amber-400' : 'text-white/40')} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white/90">Health Check</h2>
            {data && (
              <p className="text-xs text-white/40">
                {data.status === 'healthy' ? 'Todos los servicios operativos' : 'Algunos servicios con problemas'} · {data.total_latency_ms}ms total
              </p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="border-white/10 text-white/60 hover:bg-white/5 text-xs"
        >
          <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', isFetching && 'animate-spin')} />
          {isFetching ? 'Verificando...' : 'Verificar'}
        </Button>
      </div>

      {/* Summary cards */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'OK', value: data.summary.ok, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Errores', value: data.summary.error, color: 'text-red-400', bg: 'bg-red-500/10' },
            { label: 'Timeout', value: data.summary.timeout, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { label: 'Omitidos', value: data.summary.skipped, color: 'text-white/40', bg: 'bg-white/5' },
          ].map(card => (
            <div key={card.label} className={cn('rounded-xl p-4 border border-white/5', card.bg)}>
              <p className="text-[11px] text-white/40 uppercase tracking-wider">{card.label}</p>
              <p className={cn('text-2xl font-bold mt-1', card.color)}>{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-6 w-6 animate-spin text-amber-400" />
          <span className="ml-3 text-white/40 text-sm">Verificando servicios...</span>
        </div>
      )}

      {/* Infrastructure */}
      {infrastructure.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/30 flex items-center gap-2">
            <Server className="h-3.5 w-3.5" /> Infraestructura
          </h3>
          <div className="space-y-2">
            {infrastructure.map(svc => <ServiceRow key={svc.name} service={svc} />)}
          </div>
        </div>
      )}

      {/* External APIs */}
      {externalAPIs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/30 flex items-center gap-2">
            <Globe className="h-3.5 w-3.5" /> APIs Externas
          </h3>
          <div className="space-y-2">
            {externalAPIs.map(svc => <ServiceRow key={svc.name} service={svc} />)}
          </div>
        </div>
      )}

      {/* Redis Cache Stats */}
      <RedisCacheStatsPanel />

      {dataUpdatedAt > 0 && (
        <p className="text-[10px] text-white/20 text-center">
          Última verificación: {new Date(dataUpdatedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}

function ServiceRow({ service }: { service: ServiceCheck }) {
  const [expanded, setExpanded] = useState(false);
  const config = STATUS_CONFIG[service.status];
  const StatusIcon = config.icon;
  const Icon = SERVICE_ICONS[service.name] ?? Globe;

  return (
    <div
      className={cn('rounded-xl border p-3 cursor-pointer transition-all hover:bg-white/[0.02]', config.bg)}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center gap-3">
        <Icon className={cn('h-4 w-4 shrink-0', config.color)} />
        <span className="text-sm font-medium text-white/80 flex-1">{service.name}</span>
        <span className="text-[10px] text-white/30 font-mono">{service.latency_ms}ms</span>
        <StatusIcon className={cn('h-4 w-4 shrink-0', config.color)} />
      </div>
      {expanded && (service.message || service.details) && (
        <div className="mt-2 pl-7 space-y-1">
          {service.message && (
            <p className="text-xs text-white/40 break-all">{service.message}</p>
          )}
          {service.details && (
            <pre className="text-[10px] text-white/30 bg-black/30 rounded-lg p-2 overflow-x-auto">
              {JSON.stringify(service.details, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
