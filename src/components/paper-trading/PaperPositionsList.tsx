import { GlowSection } from '@/components/ui/glow-section';
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
      <GlowSection color="270 70% 60%">
        <div className="p-8 text-center">
          <p className="text-muted-foreground text-sm">No tienes posiciones abiertas</p>
        </div>
      </GlowSection>
    );
  }

  return (
    <div className="space-y-2">
      {positions.map(pos => {
        const pnl = getPnl(pos);
        const isJpy = pos.symbol.includes('JPY');
        const pnlColor = pnl >= 0 ? '160 84% 39%' : '0 84% 60%';
        return (
          <div key={pos.id} className="relative rounded-2xl overflow-hidden" style={{
            background: `linear-gradient(165deg, hsl(${pnlColor} / 0.05) 0%, hsl(var(--card)) 40%, hsl(var(--background)) 100%)`,
            border: `1px solid hsl(${pnlColor} / 0.2)`,
          }}>
            <div className="relative p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge className="text-[10px]" style={{
                    background: `hsl(${pos.side === 'buy' ? '160 84% 39%' : '0 84% 60%'} / 0.2)`,
                    color: `hsl(${pos.side === 'buy' ? '160 84% 39%' : '0 84% 60%'})`,
                  }}>
                    {pos.side === 'buy' ? 'LONG' : 'SHORT'}
                  </Badge>
                  <span className="text-sm font-bold text-foreground">{pos.symbol}</span>
                </div>
                <span className="text-xs font-mono font-bold" style={{ color: `hsl(${pnlColor})` }}>
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
                }} className="h-7 text-[10px] rounded-lg border-border/30">
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
