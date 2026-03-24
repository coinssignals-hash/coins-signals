import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import type { PaperPosition } from '@/hooks/usePaperTrading';

interface Props {
  positions: PaperPosition[];
  getPnl: (pos: PaperPosition) => number;
  onClose: (id: string) => void;
}

export function PaperPositionsList({ positions, getPnl, onClose }: Props) {
  if (positions.length === 0) {
    return (
      <Card className="p-8 bg-card border-border text-center">
        <p className="text-muted-foreground text-sm">No tienes posiciones abiertas</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {positions.map(pos => {
        const pnl = getPnl(pos);
        const isJpy = pos.symbol.includes('JPY');
        return (
          <Card key={pos.id} className="p-3 bg-card border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge variant={pos.side === 'buy' ? 'default' : 'destructive'} className="text-[10px]">
                  {pos.side === 'buy' ? 'LONG' : 'SHORT'}
                </Badge>
                <span className="text-sm font-bold text-foreground">{pos.symbol}</span>
              </div>
              <span className={`text-xs font-mono ${pnl >= 0 ? 'text-[hsl(var(--bullish))]' : 'text-[hsl(var(--bearish))]'}`}>
                {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                Entrada: {pos.entryPrice.toFixed(isJpy ? 3 : 5)} · x{pos.quantity}
              </span>
              <Button size="sm" variant="outline" onClick={() => {
                onClose(pos.id);
                toast({ title: pnl >= 0 ? '✅ Trade ganador' : '❌ Trade perdedor', description: `P&L: $${pnl.toFixed(2)}` });
              }} className="h-7 text-[10px] border-border">
                Cerrar
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
