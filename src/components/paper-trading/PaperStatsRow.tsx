import { GlowSection } from '@/components/ui/glow-section';
import { Wallet, BarChart3, TrendingUp } from 'lucide-react';

interface Props {
  balance: number;
  totalPnl: number;
  winRate: number;
}

export function PaperStatsRow({ balance, totalPnl, winRate }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {[
        { label: 'Balance', value: `$${balance.toFixed(2)}`, icon: Wallet, color: '270 70% 60%' },
        { label: 'P&L Total', value: `$${totalPnl.toFixed(2)}`, icon: BarChart3, color: totalPnl >= 0 ? '160 84% 39%' : '0 84% 60%' },
        { label: 'Win Rate', value: `${winRate.toFixed(0)}%`, icon: TrendingUp, color: '160 84% 39%' },
      ].map(s => (
        <GlowSection key={s.label} color={s.color}>
          <div className="p-3 text-center">
            <s.icon className="h-4 w-4 mx-auto mb-1" style={{ color: `hsl(${s.color})` }} />
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
            <p className="text-sm font-bold text-foreground">{s.value}</p>
          </div>
        </GlowSection>
      ))}
    </div>
  );
}
