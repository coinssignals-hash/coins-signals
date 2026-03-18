import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Signal {
  id: string;
  currency_pair: string;
  action: string;
  entry_price: number;
  take_profit: number;
  stop_loss: number;
  probability: number;
  status: string;
  trend: string;
  created_at: string;
}

interface SignalPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (signal: Signal) => void;
}

export function SignalPicker({ open, onOpenChange, onSelect }: SignalPickerProps) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase
      .from('trading_signals')
      .select('id, currency_pair, action, entry_price, take_profit, stop_loss, probability, status, trend, created_at, source')
      .in('status', ['active', 'pending'])
      .eq('source', 'ai-center')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setSignals(data || []);
        setLoading(false);
      });
  }, [open]);

  const filtered = signals.filter(s =>
    !search || s.currency_pair.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-sm max-h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-foreground text-sm">Compartir Señal</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar par..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-8 text-xs bg-secondary border-border"
          />
        </div>
        <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-6">No hay señales activas</p>
          ) : (
            filtered.map(signal => {
              const isBuy = signal.action === 'BUY';
              return (
                <button
                  key={signal.id}
                  onClick={() => { onSelect(signal); onOpenChange(false); }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-secondary/50 border border-border hover:border-primary/40 transition-colors text-left"
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    isBuy ? "bg-emerald-500/15" : "bg-red-500/15"
                  )}>
                    {isBuy
                      ? <TrendingUp className="w-4 h-4 text-emerald-400" />
                      : <TrendingDown className="w-4 h-4 text-red-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-foreground">{signal.currency_pair}</span>
                      <Badge variant={isBuy ? 'default' : 'destructive'} className="text-[9px] px-1 py-0">
                        {signal.action}
                      </Badge>
                    </div>
                    <div className="flex gap-2 text-[10px] text-muted-foreground">
                      <span>E: {signal.entry_price}</span>
                      <span className="text-emerald-400">TP: {signal.take_profit}</span>
                      <span className="text-red-400">SL: {signal.stop_loss}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-primary">{signal.probability}%</span>
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
