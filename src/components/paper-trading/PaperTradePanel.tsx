import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrendingUp, TrendingDown, RotateCcw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${selectedPair === p ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}>
            {p}
          </button>
        ))}
      </div>

      <Card className="p-4 bg-card border-border text-center">
        <p className="text-xs text-muted-foreground mb-1">{selectedPair}</p>
        <p className="text-3xl font-mono font-bold text-foreground">{currentPrice.toFixed(isJpy ? 3 : 5)}</p>
        <p className="text-xs text-muted-foreground mt-1">Precio simulado · actualiza cada 2s</p>
      </Card>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground whitespace-nowrap">Unidades:</span>
        <Input type="number" value={quantity} onChange={e => setQuantity(e.target.value)}
          className="text-sm bg-input border-border" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button onClick={() => handleOpen('buy')} className="h-14 text-base font-bold bg-[hsl(var(--bullish))] hover:bg-[hsl(var(--bullish))]/90 text-white">
          <TrendingUp className="mr-2 h-5 w-5" /> COMPRAR
        </Button>
        <Button onClick={() => handleOpen('sell')} className="h-14 text-base font-bold bg-[hsl(var(--bearish))] hover:bg-[hsl(var(--bearish))]/90 text-white">
          <TrendingDown className="mr-2 h-5 w-5" /> VENDER
        </Button>
      </div>

      <Button variant="outline" onClick={() => { onReset(); toast({ title: 'Cuenta reseteada', description: 'Balance restaurado a $10,000' }); }}
        className="w-full border-border text-muted-foreground">
        <RotateCcw className="mr-2 h-4 w-4" /> Resetear Cuenta
      </Button>
    </div>
  );
}
