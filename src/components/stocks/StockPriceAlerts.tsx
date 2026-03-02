import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Trash2, TrendingUp, TrendingDown, Plus } from 'lucide-react';
import { useStockPriceAlerts } from '@/hooks/useStockPriceAlerts';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface StockPriceAlertsProps {
  symbol: string;
  symbolName?: string;
  currentPrice?: number;
}

export function StockPriceAlerts({ symbol, symbolName, currentPrice }: StockPriceAlertsProps) {
  const { user } = useAuth();
  const { alerts, isLoading, createAlert, deleteAlert } = useStockPriceAlerts(symbol);
  const [targetPrice, setTargetPrice] = useState('');
  const [direction, setDirection] = useState<'above' | 'below'>('above');
  const [showForm, setShowForm] = useState(false);

  if (!user) return null;

  const activeAlerts = alerts.filter(a => !a.is_triggered);
  const triggeredAlerts = alerts.filter(a => a.is_triggered);

  const handleCreate = () => {
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) return;
    createAlert.mutate({ symbol, symbol_name: symbolName, target_price: price, direction });
    setTargetPrice('');
    setShowForm(false);
  };

  return (
    <Card className="p-3 bg-card border-border space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Alertas de precio</h3>
          {activeAlerts.length > 0 && (
            <Badge variant="secondary" className="text-[10px]">{activeAlerts.length}</Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Nueva
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="space-y-2 p-2 rounded-lg bg-secondary/50 border border-border">
          {currentPrice && (
            <p className="text-[11px] text-muted-foreground">
              Precio actual: <span className="font-mono font-semibold text-foreground">${currentPrice.toFixed(2)}</span>
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setDirection('above')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors border',
                direction === 'above'
                  ? 'bg-[hsl(var(--bullish))]/15 border-[hsl(var(--bullish))]/40 text-[hsl(var(--bullish))]'
                  : 'bg-secondary border-border text-muted-foreground'
              )}
            >
              <TrendingUp className="w-3.5 h-3.5" /> Sube a
            </button>
            <button
              onClick={() => setDirection('below')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors border',
                direction === 'below'
                  ? 'bg-[hsl(var(--bearish))]/15 border-[hsl(var(--bearish))]/40 text-[hsl(var(--bearish))]'
                  : 'bg-secondary border-border text-muted-foreground'
              )}
            >
              <TrendingDown className="w-3.5 h-3.5" /> Baja a
            </button>
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.01"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="Precio objetivo..."
              className="flex-1 h-8 text-sm bg-card"
            />
            <Button
              size="sm"
              className="h-8 px-3"
              onClick={handleCreate}
              disabled={createAlert.isPending || !targetPrice}
            >
              {createAlert.isPending ? '...' : 'Crear'}
            </Button>
          </div>
        </div>
      )}

      {/* Active alerts */}
      {activeAlerts.length > 0 && (
        <div className="space-y-1.5">
          {activeAlerts.map((alert) => (
            <div key={alert.id} className="flex items-center justify-between py-1.5 px-2 rounded-md bg-secondary/30">
              <div className="flex items-center gap-2">
                {alert.direction === 'above' ? (
                  <TrendingUp className="w-3.5 h-3.5 text-[hsl(var(--bullish))]" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-[hsl(var(--bearish))]" />
                )}
                <span className="text-xs text-muted-foreground">
                  {alert.direction === 'above' ? 'Sube a' : 'Baja a'}
                </span>
                <span className="text-sm font-mono font-semibold text-foreground">${alert.target_price}</span>
              </div>
              <button
                onClick={() => deleteAlert.mutate(alert.id)}
                className="p-1 rounded hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Triggered alerts */}
      {triggeredAlerts.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Activadas</p>
          {triggeredAlerts.slice(0, 3).map((alert) => (
            <div key={alert.id} className="flex items-center justify-between py-1.5 px-2 rounded-md bg-secondary/20 opacity-60">
              <div className="flex items-center gap-2">
                <BellOff className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground line-through">
                  {alert.direction === 'above' ? '↑' : '↓'} ${alert.target_price}
                </span>
              </div>
              <button
                onClick={() => deleteAlert.mutate(alert.id)}
                className="p-1 rounded hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}

      {alerts.length === 0 && !showForm && (
        <p className="text-xs text-muted-foreground text-center py-2">
          Sin alertas configuradas para {symbol}
        </p>
      )}
    </Card>
  );
}
