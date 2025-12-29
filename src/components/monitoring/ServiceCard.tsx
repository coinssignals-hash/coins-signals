import { ServiceStatus } from '@/types/monitoring';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServiceCardProps {
  service: ServiceStatus;
}

const statusConfig = {
  running: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Running' },
  stopped: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Stopped' },
  error: { icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Error' },
  starting: { icon: Loader2, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Starting' },
};

export const ServiceCard = ({ service }: ServiceCardProps) => {
  const config = statusConfig[service.status];
  const Icon = config.icon;
  
  return (
    <Card className="border-border bg-card hover:bg-card/80 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn('p-2 rounded-lg', config.bg)}>
              <Icon className={cn('w-5 h-5', config.color, service.status === 'starting' && 'animate-spin')} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground capitalize">{service.name}</h3>
              <p className="text-xs text-muted-foreground">Port: {service.port}</p>
            </div>
          </div>
          <span className={cn('text-xs font-medium px-2 py-1 rounded-full', config.bg, config.color)}>
            {config.label}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-muted-foreground text-xs">Uptime</p>
            <p className="font-medium text-foreground">{service.uptime}</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-muted-foreground text-xs">Health</p>
            <p className={cn('font-medium', service.healthCheck ? 'text-green-500' : 'text-destructive')}>
              {service.healthCheck ? 'Healthy' : 'Unhealthy'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
