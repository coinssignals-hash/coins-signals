import { Card } from '@/components/ui/card';
import { Wallet, BarChart3, TrendingUp } from 'lucide-react';

interface Props {
  balance: number;
  totalPnl: number;
  winRate: number;
}

export function PaperStatsRow({ balance, totalPnl, winRate }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <Card className="p-3 bg-card border-border text-center">
        <Wallet className="h-4 w-4 mx-auto mb-1 text-primary" />
        <p className="text-[10px] text-muted-foreground">Balance</p>
        <p className="text-sm font-bold text-foreground">${balance.toFixed(2)}</p>
      </Card>
      <Card className="p-3 bg-card border-border text-center">
        <BarChart3 className="h-4 w-4 mx-auto mb-1 text-accent" />
        <p className="text-[10px] text-muted-foreground">P&L Total</p>
        <p className={`text-sm font-bold ${totalPnl >= 0 ? 'text-[hsl(var(--bullish))]' : 'text-[hsl(var(--bearish))]'}`}>
          ${totalPnl.toFixed(2)}
        </p>
      </Card>
      <Card className="p-3 bg-card border-border text-center">
        <TrendingUp className="h-4 w-4 mx-auto mb-1 text-[hsl(var(--bullish))]" />
        <p className="text-[10px] text-muted-foreground">Win Rate</p>
        <p className="text-sm font-bold text-foreground">{winRate.toFixed(0)}%</p>
      </Card>
    </div>
  );
}
