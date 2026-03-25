import { GlowSection } from '@/components/ui/glow-section';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Target } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { PaperPosition } from '@/hooks/usePaperTrading';
import { INSTRUMENTS } from '@/hooks/usePaperTrading';

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
        const inst = INSTRUMENTS.find(i => i.symbol === pos.symbol);
        const decimals = inst?.decimals ?? 4;
        const pnlColor = pnl >= 0 ? '160 84% 39%' : '0 84% 60%';
        return (
          <GlowSection key={pos.id} color={pnlColor}>
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
                  <span className="text-[9px] text-muted-foreground">x{pos.leverage}</span>
                </div>
                <span className="text-xs font-mono font-bold" style={{ color: `hsl(${pnlColor})` }}>
                  {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-2">
                <span>Entrada: {pos.entryPrice.toFixed(decimals)} · {pos.lotSize} lotes</span>
                <span>{pos.openedAt}</span>
              </div>
              {(pos.stopLoss || pos.takeProfit) && (
                <div className="flex gap-3 mb-2">
                  {pos.stopLoss && (
                    <span className="flex items-center gap-1 text-[9px]" style={{ color: 'hsl(0 84% 60%)' }}>
                      <Shield className="w-3 h-3" /> SL: {pos.stopLoss.toFixed(decimals)}
                    </span>
                  )}
                  {pos.takeProfit && (
                    <span className="flex items-center gap-1 text-[9px]" style={{ color: 'hsl(160 84% 39%)' }}>
                      <Target className="w-3 h-3" /> TP: {pos.takeProfit.toFixed(decimals)}
                    </span>
                  )}
                </div>
              )}
              <div className="flex justify-end">
                <Button size="sm" variant="outline" onClick={() => {
                  onClose(pos.id);
                  toast({ title: pnl >= 0 ? '✅ Trade ganador' : '❌ Trade perdedor', description: `P&L: $${pnl.toFixed(2)}` });
                }} className="h-7 text-[10px] rounded-lg border-border/30">
                  Cerrar Posición
                </Button>
              </div>
            </div>
          </GlowSection>
        );
      })}
    </div>
  );
}
