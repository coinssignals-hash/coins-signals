import { useState, useEffect } from 'react';
import { BookOpen, Clock, Play, CheckCircle2, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useTranslation } from '@/i18n/LanguageContext';
import { useDateLocale } from '@/hooks/useDateLocale';
import type { TradingSignal } from '@/hooks/useSignals';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SaveSignalToJournalProps {
  signal: TradingSignal;
  className?: string;
}

export function SaveSignalToJournal({ signal, className }: SaveSignalToJournalProps) {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alreadySaved, setAlreadySaved] = useState(false);

  // Check if signal is already in journal
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;
      const { count } = await supabase
        .from('trading_journal')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('signal_id', signal.id);
      if (!cancelled && count && count > 0) setAlreadySaved(true);
    };
    check();
    return () => { cancelled = true; };
  }, [signal.id]);

  // Pre-filled from signal
  const [lotSize, setLotSize] = useState('0.1');
  const [executedAt, setExecutedAt] = useState('');
  const [completedAt, setCompletedAt] = useState('');
  const [result, setResult] = useState<'win' | 'loss' | 'breakeven'>(
    signal.closedResult === 'tp_hit' ? 'win' : signal.closedResult === 'sl_hit' ? 'loss' : 'win'
  );
  const [notes, setNotes] = useState('');

  const signalArrivedAt = signal.datetime;
  const exitPrice = signal.closedPrice ?? signal.entryPrice;

  // Calculate pips
  const calcPips = () => {
    const pair = signal.currencyPair.toUpperCase();
    const diff = exitPrice - signal.entryPrice;
    const direction = signal.action === 'BUY' ? 1 : -1;
    const isJPY = pair.includes('JPY');
    return Math.round((diff * direction * (isJPY ? 100 : 10000)) * 10) / 10;
  };

  const handleSave = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      toast.error(t('journal_login_required') || 'Inicia sesión para guardar en el diario');
      return;
    }

    setSaving(true);

    const pips = calcPips();
    const payload = {
      user_id: session.user.id,
      trade_date: format(new Date(signal.datetime), 'yyyy-MM-dd'),
      pair: signal.currencyPair,
      action: signal.action,
      entry_price: signal.entryPrice,
      exit_price: exitPrice,
      lot_size: parseFloat(lotSize) || 0.1,
      stop_loss: signal.stopLoss,
      take_profit: signal.takeProfit,
      result,
      pips,
      notes: notes || `Señal ${signal.source || 'server'} — ${signal.currencyPair}`,
      signal_id: signal.id,
      signal_arrived_at: signalArrivedAt,
      executed_at: executedAt || null,
      completed_at: completedAt || null,
    };

    const { error } = await supabase.from('trading_journal').insert(payload);
    setSaving(false);

    if (error) {
      console.error(error);
      toast.error('Error al guardar en el diario');
      return;
    }

    toast.success('Señal guardada en tu Diario de Trading');
    setAlreadySaved(true);
    setOpen(false);
  };

  const formatDateTimeLocal = (iso: string) => {
    if (!iso) return '';
    try { return format(new Date(iso), "yyyy-MM-dd'T'HH:mm"); } catch { return ''; }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all active:scale-95",
            "bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20",
            className
          )}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Diario</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm mx-auto bg-card border-border" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <BookOpen className="w-5 h-5 text-primary" />
            Guardar en Diario
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Signal Summary */}
          <div className="rounded-lg p-3 bg-muted/50 border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">{signal.currencyPair}</span>
              <span className={cn(
                "text-xs font-bold px-2 py-0.5 rounded",
                signal.action === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              )}>
                {signal.action}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-[10px] text-muted-foreground block">Entrada</span>
                <span className="text-xs font-mono font-bold text-foreground">{signal.entryPrice}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">TP</span>
                <span className="text-xs font-mono font-bold text-emerald-400">{signal.takeProfit}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">SL</span>
                <span className="text-xs font-mono font-bold text-rose-400">{signal.stopLoss}</span>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span className="font-medium">Tiempos de la operación</span>
            </div>

            {/* Signal Arrived */}
            <div>
              <Label className="text-[11px] text-muted-foreground flex items-center gap-1.5 mb-1">
                <Clock className="w-3 h-3" /> Llegada de señal
              </Label>
              <Input
                type="datetime-local"
                value={formatDateTimeLocal(signalArrivedAt)}
                disabled
                className="text-xs bg-muted/30 border-border"
              />
            </div>

            {/* Execution Time */}
            <div>
              <Label className="text-[11px] text-muted-foreground flex items-center gap-1.5 mb-1">
                <Play className="w-3 h-3" /> Hora de ejecución
              </Label>
              <Input
                type="datetime-local"
                value={executedAt}
                onChange={(e) => setExecutedAt(e.target.value)}
                className="text-xs bg-input border-border"
              />
            </div>

            {/* Completion Time */}
            <div>
              <Label className="text-[11px] text-muted-foreground flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-3 h-3" /> Hora de finalización
              </Label>
              <Input
                type="datetime-local"
                value={completedAt}
                onChange={(e) => setCompletedAt(e.target.value)}
                className="text-xs bg-input border-border"
              />
            </div>
          </div>

          {/* Result & Lot Size */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px] text-muted-foreground mb-1 block">Resultado</Label>
              <Select value={result} onValueChange={(v) => setResult(v as any)}>
                <SelectTrigger className="text-xs bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="win">✅ Win</SelectItem>
                  <SelectItem value="loss">❌ Loss</SelectItem>
                  <SelectItem value="breakeven">➖ Breakeven</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground mb-1 block">Lote</Label>
              <Input
                type="number"
                step="0.01"
                value={lotSize}
                onChange={(e) => setLotSize(e.target.value)}
                className="text-xs bg-input border-border"
              />
            </div>
          </div>

          {/* Pips preview */}
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30 border border-border">
            <span className="text-[11px] text-muted-foreground">Pips calculados</span>
            <span className={cn(
              "text-sm font-bold font-mono tabular-nums",
              calcPips() > 0 ? 'text-emerald-400' : calcPips() < 0 ? 'text-rose-400' : 'text-muted-foreground'
            )}>
              {calcPips() > 0 ? '+' : ''}{calcPips()}
            </span>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-[11px] text-muted-foreground mb-1 block">Notas (opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones sobre la operación..."
              className="text-xs bg-input border-border min-h-[60px] resize-none"
            />
          </div>

          {/* Save button */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BookOpen className="w-4 h-4 mr-2" />}
            Guardar en Diario
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
