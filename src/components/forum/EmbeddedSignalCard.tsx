import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface SignalData {
  id: string;
  currency_pair: string;
  action: string;
  entry_price: number;
  take_profit: number;
  stop_loss: number;
  probability: number;
  status: string;
  trend: string;
}

export function EmbeddedSignalCard({ signalId }: { signalId: string }) {
  const [signal, setSignal] = useState<SignalData | null>(null);

  useEffect(() => {
    supabase
      .from('trading_signals')
      .select('id, currency_pair, action, entry_price, take_profit, stop_loss, probability, status, trend')
      .eq('id', signalId)
      .maybeSingle()
      .then(({ data }) => { if (data) setSignal(data); });
  }, [signalId]);

  if (!signal) return null;

  const isBuy = signal.action === 'BUY';

  return (
    <Link
      to="/signals"
      className={cn(
        "block rounded-lg border p-2.5 mt-1 transition-colors hover:border-primary/40",
        isBuy ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"
      )}
    >
      <div className="flex items-center gap-2 mb-1.5">
        {isBuy
          ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          : <TrendingDown className="w-3.5 h-3.5 text-red-400" />
        }
        <span className="text-[11px] font-bold text-foreground">{signal.currency_pair}</span>
        <Badge
          variant={isBuy ? 'default' : 'destructive'}
          className="text-[9px] px-1.5 py-0 h-4"
        >
          {signal.action}
        </Badge>
        <span className="ml-auto text-[9px] font-bold text-primary">{signal.probability}%</span>
      </div>
      <div className="grid grid-cols-3 gap-1 text-[10px]">
        <div className="text-center">
          <p className="text-muted-foreground">Entrada</p>
          <p className="font-mono font-bold text-foreground">{signal.entry_price}</p>
        </div>
        <div className="text-center">
          <p className="text-emerald-400 flex items-center justify-center gap-0.5"><Target className="w-2.5 h-2.5" />TP</p>
          <p className="font-mono font-bold text-emerald-400">{signal.take_profit}</p>
        </div>
        <div className="text-center">
          <p className="text-red-400 flex items-center justify-center gap-0.5"><ShieldAlert className="w-2.5 h-2.5" />SL</p>
          <p className="font-mono font-bold text-red-400">{signal.stop_loss}</p>
        </div>
      </div>
    </Link>
  );
}
