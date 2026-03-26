import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlowSection } from '@/components/ui/glow-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { PaperTrade } from '@/hooks/usePaperTrading';
import { INSTRUMENTS } from '@/hooks/usePaperTrading';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  history: PaperTrade[];
}

const CLOSE_REASON_LABEL: Record<string, string> = {
  manual: 'Manual',
  sl: '🛑 Stop Loss',
  tp: '🎯 Take Profit',
};

export function PaperTradeHistory({ history }: Props) {
  const navigate = useNavigate();
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState<string | null>(null);

  const sendToJournal = async (trade: PaperTrade) => {
    setSending(trade.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: 'Inicia sesión', description: 'Debes estar autenticado para guardar en el diario', variant: 'destructive' });
        setSending(null);
        return;
      }

      const pips = Math.abs(trade.exitPrice - trade.entryPrice) / (INSTRUMENTS.find(i => i.symbol === trade.symbol)?.pipSize ?? 0.0001);

      const { error } = await supabase.from('trading_journal').insert({
        user_id: user.id,
        pair: trade.symbol,
        action: trade.side === 'buy' ? 'BUY' : 'SELL',
        entry_price: trade.entryPrice,
        exit_price: trade.exitPrice,
        lot_size: trade.lotSize,
        pips: Math.round(pips),
        result: trade.pnl >= 0 ? 'win' : 'loss',
        notes: `[DEMO] Operación simulada · Cierre: ${CLOSE_REASON_LABEL[trade.closeReason]} · Apalancamiento: x${trade.leverage} · P&L: $${trade.pnl.toFixed(2)}`,
        stop_loss: null,
        take_profit: null,
      });

      if (error) throw error;

      setSentIds(prev => new Set(prev).add(trade.id));
      toast({ title: '📓 Guardado en Diario', description: `${trade.symbol} añadido con marca DEMO` });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'No se pudo guardar', variant: 'destructive' });
    }
    setSending(null);
  };

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
        const inst = INSTRUMENTS.find(i => i.symbol === trade.symbol);
        const decimals = inst?.decimals ?? 4;
        const pnlColor = trade.pnl >= 0 ? '160 84% 39%' : '0 84% 60%';
        const alreadySent = sentIds.has(trade.id);

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
                  <Badge className="text-[8px] px-1.5 py-0" style={{
                    background: 'hsl(270 70% 60% / 0.15)',
                    color: 'hsl(270 70% 60%)',
                    border: '1px solid hsl(270 70% 60% / 0.3)',
                  }}>
                    DEMO
                  </Badge>
                </div>
                <span className="text-sm font-bold font-mono" style={{ color: `hsl(${pnlColor})` }}>
                  {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">
                  {trade.entryPrice.toFixed(decimals)} → {trade.exitPrice.toFixed(decimals)} · {trade.lotSize} lotes · x{trade.leverage}
                </span>
                <span className="text-[10px] text-muted-foreground">{CLOSE_REASON_LABEL[trade.closeReason] || 'Manual'}</span>
              </div>

              <div className="flex items-center justify-between mt-2">
                <span className="text-[9px] text-muted-foreground">{trade.closedAt}</span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={alreadySent || sending === trade.id}
                  onClick={() => sendToJournal(trade)}
                  className="h-7 text-[10px] rounded-lg border-border/30 gap-1"
                >
                  {alreadySent ? (
                    <><Check className="w-3 h-3" /> Enviado</>
                  ) : sending === trade.id ? (
                    'Enviando...'
                  ) : (
                    <><BookOpen className="w-3 h-3" /> Enviar al Diario</>
                  )}
                </Button>
              </div>
            </div>
          </GlowSection>
        );
      })}
    </div>
  );
}
