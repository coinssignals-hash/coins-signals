import { GlowSection } from '@/components/ui/glow-section';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Target, TrendingUp, TrendingDown, Clock, Layers, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from '@/i18n/LanguageContext';
import type { PaperPosition } from '@/hooks/usePaperTrading';
import { INSTRUMENTS } from '@/hooks/usePaperTrading';

interface Props {
  positions: PaperPosition[];
  getPnl: (pos: PaperPosition) => number;
  onClose: (id: string) => void;
  prices: Record<string, number>;
}

export function PaperPositionsList({ positions, getPnl, onClose, prices }: Props) {
  const { t } = useTranslation();

  if (positions.length === 0) {
    return (
      <GlowSection color="270 70% 60%">
        <div className="p-8 text-center">
          <p className="text-muted-foreground text-sm">{t('pt_no_positions')}</p>
        </div>
      </GlowSection>
    );
  }

  return (
    <div className="space-y-3">
      {positions.map(pos => {
        const pnl = getPnl(pos);
        const inst = INSTRUMENTS.find(i => i.symbol === pos.symbol);
        const decimals = inst?.decimals ?? 4;
        const currentPrice = prices[pos.symbol] ?? pos.entryPrice;
        const pnlPct = pos.entryPrice > 0 ? ((pnl / ((pos.entryPrice * pos.quantity) / pos.leverage)) * 100) : 0;
        const isProfit = pnl >= 0;
        const pnlColor = isProfit ? '160 84% 39%' : '0 84% 60%';
        const sideColor = pos.side === 'buy' ? '160 84% 39%' : '0 84% 60%';
        const margin = (pos.entryPrice * pos.quantity) / pos.leverage;

        let openedFormatted = pos.openedAt;
        try { openedFormatted = new Date(pos.openedAt).toLocaleString(); } catch { /* keep raw */ }

        return (
          <GlowSection key={pos.id} color={pnlColor}>
            <div className="relative p-4">
              {/* Header: Symbol + Side + PnL */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                    background: `linear-gradient(135deg, hsl(${sideColor} / 0.25), hsl(${sideColor} / 0.08))`,
                    border: `1px solid hsl(${sideColor} / 0.3)`,
                  }}>
                    {pos.side === 'buy'
                      ? <TrendingUp className="w-5 h-5" style={{ color: `hsl(${sideColor})` }} />
                      : <TrendingDown className="w-5 h-5" style={{ color: `hsl(${sideColor})` }} />
                    }
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-foreground">{pos.symbol}</span>
                      <Badge className="text-[9px] px-1.5 py-0 font-bold" style={{
                        background: `hsl(${sideColor} / 0.15)`,
                        color: `hsl(${sideColor})`,
                        border: `1px solid hsl(${sideColor} / 0.3)`,
                      }}>
                        {pos.side === 'buy' ? 'LONG' : 'SHORT'}
                      </Badge>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{inst?.name}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold font-mono block" style={{ color: `hsl(${pnlColor})` }}>
                    {isProfit ? '+' : ''}${pnl.toFixed(2)}
                  </span>
                  <span className="text-[10px] font-mono font-semibold" style={{ color: `hsl(${pnlColor} / 0.8)` }}>
                    {isProfit ? '+' : ''}{pnlPct.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Price Grid */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="rounded-lg p-2" style={{ background: 'hsl(var(--muted) / 0.5)', border: '1px solid hsl(var(--border) / 0.2)' }}>
                  <span className="text-[9px] text-muted-foreground block">{t('pt_entry')}</span>
                  <span className="text-xs font-mono font-bold text-foreground">{pos.entryPrice.toFixed(decimals)}</span>
                </div>
                <div className="rounded-lg p-2" style={{
                  background: `hsl(${pnlColor} / 0.08)`,
                  border: `1px solid hsl(${pnlColor} / 0.2)`,
                }}>
                  <span className="text-[9px] text-muted-foreground block">{t('pt_current_price') || 'Actual'}</span>
                  <span className="text-xs font-mono font-bold" style={{ color: `hsl(${pnlColor})` }}>
                    {currentPrice.toFixed(decimals)}
                  </span>
                </div>
                <div className="rounded-lg p-2" style={{ background: 'hsl(var(--muted) / 0.5)', border: '1px solid hsl(var(--border) / 0.2)' }}>
                  <span className="text-[9px] text-muted-foreground block">{t('pt_margin') || 'Margen'}</span>
                  <span className="text-xs font-mono font-bold text-foreground">${margin.toFixed(2)}</span>
                </div>
              </div>

              {/* Trade Details Row */}
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Layers className="w-3 h-3" />
                  <span>{pos.lotSize} {t('pt_lot_size').toLowerCase()}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="font-semibold text-foreground/70">x{pos.leverage}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{openedFormatted}</span>
                </div>
              </div>

              {/* SL / TP Row */}
              {(pos.stopLoss || pos.takeProfit) && (
                <div className="flex gap-2 mb-3">
                  {pos.stopLoss && (
                    <div className="flex-1 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5" style={{
                      background: 'hsl(0 84% 60% / 0.08)',
                      border: '1px solid hsl(0 84% 60% / 0.2)',
                    }}>
                      <Shield className="w-3.5 h-3.5" style={{ color: 'hsl(0 84% 60%)' }} />
                      <div>
                        <span className="text-[8px] text-muted-foreground block">Stop Loss</span>
                        <span className="text-[11px] font-mono font-bold" style={{ color: 'hsl(0 84% 60%)' }}>
                          {pos.stopLoss.toFixed(decimals)}
                        </span>
                      </div>
                    </div>
                  )}
                  {pos.takeProfit && (
                    <div className="flex-1 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5" style={{
                      background: 'hsl(160 84% 39% / 0.08)',
                      border: '1px solid hsl(160 84% 39% / 0.2)',
                    }}>
                      <Target className="w-3.5 h-3.5" style={{ color: 'hsl(160 84% 39%)' }} />
                      <div>
                        <span className="text-[8px] text-muted-foreground block">Take Profit</span>
                        <span className="text-[11px] font-mono font-bold" style={{ color: 'hsl(160 84% 39%)' }}>
                          {pos.takeProfit.toFixed(decimals)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Close Button */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onClose(pos.id);
                  toast({ title: isProfit ? '✅' : '❌', description: `P&L: $${pnl.toFixed(2)}` });
                }}
                className="w-full h-9 text-xs font-semibold rounded-xl gap-1.5"
                style={{
                  borderColor: 'hsl(0 84% 60% / 0.3)',
                  color: 'hsl(0 84% 60%)',
                  background: 'hsl(0 84% 60% / 0.06)',
                }}
              >
                <X className="w-3.5 h-3.5" />
                {t('pt_close_position')}
              </Button>
            </div>
          </GlowSection>
        );
      })}
    </div>
  );
}
