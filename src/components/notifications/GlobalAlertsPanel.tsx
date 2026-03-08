import { useStockPriceAlerts, StockPriceAlert } from '@/hooks/useStockPriceAlerts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, BellOff, TrendingUp, TrendingDown, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/i18n/LanguageContext';
import { useDateLocale } from '@/hooks/useDateLocale';

function AlertRow({ alert, onDelete }: { alert: StockPriceAlert; onDelete: (id: string) => void }) {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const isAbove = alert.direction === 'above';
  const Icon = isAbove ? TrendingUp : TrendingDown;
  const dirLabel = isAbove ? t('ga_above') : t('ga_below');
  const dirColor = isAbove ? 'text-green-500' : 'text-red-500';

  let timeLabel = '';
  try {
    timeLabel = formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: dateLocale });
  } catch { /* empty */ }

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border transition-colors',
        alert.is_triggered
          ? 'bg-muted/30 border-muted-foreground/10 opacity-70'
          : 'bg-secondary/40 border-border hover:border-primary/30'
      )}
    >
      <div className={cn('p-2 rounded-full shrink-0', isAbove ? 'bg-green-500/10' : 'bg-red-500/10')}>
        <Icon className={cn('w-4 h-4', dirColor)} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-foreground">{alert.symbol}</span>
          {alert.symbol_name && (
            <span className="text-xs text-muted-foreground truncate">{alert.symbol_name}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={cn('text-xs font-medium', dirColor)}>{dirLabel}</span>
          <span className="text-xs font-mono font-semibold text-foreground">
            ${alert.target_price.toFixed(2)}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground">{timeLabel}</span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {alert.is_triggered ? (
          <Badge variant="outline" className="text-[9px] border-green-500/30 text-green-500 gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Disparada
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[9px] border-yellow-500/30 text-yellow-500 gap-1 animate-pulse">
            <Bell className="w-3 h-3" />
            Activa
          </Badge>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(alert.id)}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function GlobalAlertsPanel() {
  const { user } = useAuth();
  const { alerts, isLoading, deleteAlert } = useStockPriceAlerts();

  if (!user) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-6 text-center">
          <BellOff className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Inicia sesión para ver tus alertas de precio</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  const activeAlerts = alerts.filter(a => !a.is_triggered);
  const triggeredAlerts = alerts.filter(a => a.is_triggered).slice(0, 5);

  // Group active alerts by symbol
  const groupedActive = activeAlerts.reduce<Record<string, StockPriceAlert[]>>((acc, alert) => {
    if (!acc[alert.symbol]) acc[alert.symbol] = [];
    acc[alert.symbol].push(alert);
    return acc;
  }, {});

  return (
    <Card className="bg-card border-border border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-primary flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Alertas de Precio ({activeAlerts.length} activas)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.length === 0 ? (
          <div className="text-center py-6">
            <BellOff className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No tienes alertas de precio configuradas</p>
            <p className="text-xs text-muted-foreground mt-1">
              Ve a la sección de Acciones para crear alertas en tus activos favoritos.
            </p>
          </div>
        ) : (
          <>
            {/* Active alerts grouped by symbol */}
            {Object.entries(groupedActive).length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <Bell className="w-3 h-3 text-yellow-500" />
                  Activas ({activeAlerts.length})
                </p>
                {Object.entries(groupedActive).map(([symbol, symbolAlerts]) => (
                  <div key={symbol} className="space-y-1.5">
                    {symbolAlerts.map(alert => (
                      <AlertRow key={alert.id} alert={alert} onDelete={(id) => deleteAlert.mutate(id)} />
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Recently triggered */}
            {triggeredAlerts.length > 0 && (
              <div className="space-y-2 mt-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  Disparadas recientemente
                </p>
                {triggeredAlerts.map(alert => (
                  <AlertRow key={alert.id} alert={alert} onDelete={(id) => deleteAlert.mutate(id)} />
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
