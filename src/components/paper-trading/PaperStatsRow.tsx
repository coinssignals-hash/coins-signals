import { GlowSection } from '@/components/ui/glow-section';
import { Wallet, BarChart3, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/i18n/LanguageContext';

interface Props {
  balance: number;
  totalPnl: number;
  winRate: number;
}

export function PaperStatsRow({ balance, totalPnl, winRate }: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <GlowSection color="270 70% 60%">
        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Wallet className="h-5 w-5" style={{ color: 'hsl(270 70% 60%)' }} />
            <p className="text-xs text-muted-foreground font-medium">{t('pt_balance')}</p>
          </div>
          <p className="text-3xl font-extrabold font-mono text-foreground tracking-tight">
            ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </GlowSection>

      <div className="grid grid-cols-2 gap-2">
        {[
          { label: t('pt_total_pnl'), value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`, icon: BarChart3, color: totalPnl >= 0 ? '160 84% 39%' : '0 84% 60%' },
          { label: t('pt_win_rate'), value: `${winRate.toFixed(0)}%`, icon: TrendingUp, color: '160 84% 39%' },
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
    </div>
  );
}
