import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PaperTrade } from '@/hooks/usePaperTrading';

interface Props {
  history: PaperTrade[];
}

export function PaperTradeHistory({ history }: Props) {
  if (history.length === 0) {
    return (
      <Card className="p-8 bg-card border-border text-center">
        <p className="text-muted-foreground text-sm">Aún no has cerrado operaciones</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {history.map(trade => {
        const isJpy = trade.symbol.includes('JPY');
        return (
          <Card key={trade.id} className="p-3 bg-card border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={trade.side === 'buy' ? 'default' : 'destructive'} className="text-[10px]">
                  {trade.side === 'buy' ? 'LONG' : 'SHORT'}
                </Badge>
                <span className="text-sm font-medium text-foreground">{trade.symbol}</span>
              </div>
              <span className={`text-sm font-bold font-mono ${trade.pnl >= 0 ? 'text-[hsl(var(--bullish))]' : 'text-[hsl(var(--bearish))]'}`}>
                {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-muted-foreground">
                {trade.entryPrice.toFixed(isJpy ? 3 : 5)} → {trade.exitPrice.toFixed(isJpy ? 3 : 5)}
              </span>
              <span className="text-[10px] text-muted-foreground">{trade.closedAt}</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
