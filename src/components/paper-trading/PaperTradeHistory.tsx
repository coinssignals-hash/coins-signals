import { GlowSection } from '@/components/ui/glow-section';
import { Badge } from '@/components/ui/badge';
import type { PaperTrade } from '@/hooks/usePaperTrading';

interface Props {
  history: PaperTrade[];
}

export function PaperTradeHistory({ history }: Props) {
  if (history.length === 0) {
    return (
      <GlowSection color="270 70% 60%">
        <div className="p-8 text-center">
          <p className="text-muted-foreground text-sm">Aún no has cerrado operaciones</p>
        </div>
      </GlowSection>
    );
  }

  return (
    <div className="space-y-2">
      {history.map(trade => {
        const isJpy = trade.symbol.includes('JPY');
        const pnlColor = trade.pnl >= 0 ? '160 84% 39%' : '0 84% 60%';
        return (
          <GlowSection key={trade.id} color={pnlColor}>
            <div className="relative p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="text-[10px]" style={{
                    background: `hsl(${trade.side === 'buy' ? '160 84% 39%' : '0 84% 60%'} / 0.2)`,
                    color: `hsl(${trade.side === 'buy' ? '160 84% 39%' : '0 84% 60%'})`,
                  }}>
                    {trade.side === 'buy' ? 'LONG' : 'SHORT'}
                  </Badge>
                  <span className="text-sm font-medium text-foreground">{trade.symbol}</span>
                </div>
                <span className="text-sm font-bold font-mono" style={{ color: `hsl(${pnlColor})` }}>
                  {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">
                  {trade.entryPrice.toFixed(isJpy ? 3 : 5)} → {trade.exitPrice.toFixed(isJpy ? 3 : 5)}
                </span>
                <span className="text-[10px] text-muted-foreground">{trade.closedAt}</span>
              </div>
            </div>
          </GlowSection>
        );
      })}
    </div>
  );
}
