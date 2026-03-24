import { useState } from 'react';
import { GlowSection } from '@/components/ui/glow-section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrendingUp, TrendingDown, RotateCcw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const ACCENT = '270 70% 60%';

interface Props {
  pairs: string[];
  prices: Record<string, number>;
  onOpen: (symbol: string, side: 'buy' | 'sell', qty: number) => false | object;
  onReset: () => void;
}

export function PaperTradePanel({ pairs, prices, onOpen, onReset }: Props) {
  const [selectedPair, setSelectedPair] = useState(pairs[0]);
  const [quantity, setQuantity] = useState('1000');
  const currentPrice = prices[selectedPair] ?? 0;
  const isJpy = selectedPair.includes('JPY');

  const handleOpen = (side: 'buy' | 'sell') => {
    const qty = parseInt(quantity) || 1000;
    const result = onOpen(selectedPair, side, qty);
    if (result === false) {
      toast({ title: 'Saldo insuficiente', variant: 'destructive' });
    } else {
      toast({
        title: `${side === 'buy' ? '🟢 Compra' : '🔴 Venta'} abierta`,
        description: `${selectedPair} x${qty} @ ${currentPrice.toFixed(isJpy ? 3 : 5)}`,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {pairs.map(p => (
          <button key={p} onClick={() => setSelectedPair(p)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
            style={selectedPair === p ? {
              background: `hsl(${ACCENT} / 0.15)`,
              border: `1px solid hsl(${ACCENT} / 0.4)`,
              color: `hsl(${ACCENT})`,
            } : {
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border) / 0.3)',
              color: 'hsl(var(--muted-foreground))',
            }}>
            {p}
          </button>
        ))}
      </div>

      <GlowSection color={ACCENT}>
        <div className="p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">{selectedPair}</p>
          <p className="text-3xl font-mono font-bold text-foreground">{currentPrice.toFixed(isJpy ? 3 : 5)}</p>
          <p className="text-xs text-muted-foreground mt-1">Precio simulado · actualiza cada 2s</p>
        </div>
      </GlowSection>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground whitespace-nowrap">Unidades:</span>
        <Input type="number" value={quantity} onChange={e => setQuantity(e.target.value)}
          className="text-sm bg-background/40 border-border/30" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button onClick={() => handleOpen('buy')} className="h-14 text-base font-bold rounded-xl text-white"
          style={{ background: 'linear-gradient(135deg, hsl(160 84% 39%), hsl(160 84% 45%))', border: '1px solid hsl(160 84% 39% / 0.4)' }}>
          <TrendingUp className="mr-2 h-5 w-5" /> COMPRAR
        </Button>
        <Button onClick={() => handleOpen('sell')} className="h-14 text-base font-bold rounded-xl text-white"
          style={{ background: 'linear-gradient(135deg, hsl(0 84% 55%), hsl(0 84% 60%))', border: '1px solid hsl(0 84% 55% / 0.4)' }}>
          <TrendingDown className="mr-2 h-5 w-5" /> VENDER
        </Button>
      </div>

      <Button variant="outline" onClick={() => { onReset(); toast({ title: 'Cuenta reseteada', description: 'Balance restaurado a $10,000' }); }}
        className="w-full rounded-xl border-border/30 text-muted-foreground">
        <RotateCcw className="mr-2 h-4 w-4" /> Resetear Cuenta
      </Button>
    </div>
  );
}
