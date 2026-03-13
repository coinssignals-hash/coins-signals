import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, Zap, TrendingUp, TrendingDown, Check, X, AlertTriangle, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from '@/i18n/LanguageContext';

interface SignalDraft {
  currencyPair: string;
  action: 'BUY' | 'SELL';
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  support?: number;
  resistance?: number;
  probability: number;
  trend: 'bullish' | 'bearish';
  notes?: string;
}

interface Props {
  draft: SignalDraft;
  onCreated: () => void;
  onCancel: () => void;
}

export function AISignalCreator({ draft, onCreated, onCancel }: Props) {
  const { t } = useTranslation();
  const formatPair = (raw: string) => {
    const clean = raw.replace(/[^A-Z]/g, '');
    return clean.length >= 6 ? clean.slice(0, 3) + '/' + clean.slice(3, 6) : clean;
  };
  const [signal, setSignal] = useState<SignalDraft>(() => ({
    ...draft,
    currencyPair: formatPair(draft.currencyPair.toUpperCase()),
  }));
  const [notes, setNotes] = useState(draft.notes || '');
  const [showNotes, setShowNotes] = useState(!!draft.notes);
  const [creating, setCreating] = useState(false);

  const isBuy = signal.action === 'BUY';
  const pips = isBuy
    ? Math.round((signal.takeProfit - signal.entryPrice) * 10000)
    : Math.round((signal.entryPrice - signal.takeProfit) * 10000);
  const slPips = isBuy
    ? Math.round((signal.entryPrice - signal.stopLoss) * 10000)
    : Math.round((signal.stopLoss - signal.entryPrice) * 10000);
  const rr = slPips > 0 ? (pips / slPips).toFixed(2) : '—';

  const handleCreate = async () => {
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('insert-signal-admin', {
        body: {
          currency_pair: signal.currencyPair,
          action: signal.action,
          entry_price: signal.entryPrice,
          take_profit: signal.takeProfit,
          stop_loss: signal.stopLoss,
          support: signal.support ?? null,
          resistance: signal.resistance ?? null,
          probability: signal.probability,
           trend: signal.trend,
           status: 'active',
           source: 'ai-center',
           ...(notes.trim() ? { notes: notes.trim() } : {}),
         },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: `✅ ${t('ai_center_signal_created')}`,
        description: `${signal.action} ${signal.currencyPair} @ ${signal.entryPrice}`,
      });
      onCreated();
    } catch (err) {
      console.error('Error creating signal:', err);
      toast({
        title: t('ai_center_status_error'),
        description: err instanceof Error ? err.message : t('ai_center_signal_error'),
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const formatCurrencyPair = (raw: string): string => {
    const clean = raw.replace(/[^A-Z]/g, '');
    if (clean.length >= 6) {
      return clean.slice(0, 3) + '/' + clean.slice(3, 6);
    }
    return clean;
  };

  const updateField = (field: keyof SignalDraft, value: number | string) => {
    if (field === 'currencyPair' && typeof value === 'string') {
      value = formatCurrencyPair(value.toUpperCase());
    }
    setSignal(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="border border-primary/30 rounded-xl bg-card p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Zap className="w-4 h-4 text-accent" />
          {t('ai_center_create_signal_ia')}
        </h4>
        <button onClick={onCancel} className="p-1 rounded hover:bg-secondary text-muted-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Action Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => updateField('action', 'BUY')}
          className={cn(
            "flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2",
            signal.action === 'BUY'
              ? "bg-bullish/15 text-bullish border border-bullish/30"
              : "bg-secondary/30 text-muted-foreground border border-border hover:border-bullish/20"
          )}
        >
          <TrendingUp className="w-4 h-4" />
          BUY
        </button>
        <button
          onClick={() => updateField('action', 'SELL')}
          className={cn(
            "flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2",
            signal.action === 'SELL'
              ? "bg-destructive/15 text-destructive border border-destructive/30"
              : "bg-secondary/30 text-muted-foreground border border-border hover:border-destructive/20"
          )}
        >
          <TrendingDown className="w-4 h-4" />
          SELL
        </button>
      </div>

      {/* Currency Pair */}
      <div className="space-y-1">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">{t('ai_center_pair')}</label>
        <input
          type="text"
          value={signal.currencyPair}
          onChange={(e) => updateField('currencyPair', e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-secondary/30 border border-border text-sm text-foreground font-mono focus:outline-none focus:border-primary"
        />
      </div>

      {/* Price Fields Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Entry</label>
          <input
            type="number"
            step="0.00001"
            value={signal.entryPrice}
            onChange={(e) => updateField('entryPrice', parseFloat(e.target.value) || 0)}
            className="w-full px-2 py-2 rounded-lg bg-secondary/30 border border-border text-xs text-foreground font-mono focus:outline-none focus:border-primary"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-bullish uppercase tracking-wider">TP</label>
          <input
            type="number"
            step="0.00001"
            value={signal.takeProfit}
            onChange={(e) => updateField('takeProfit', parseFloat(e.target.value) || 0)}
            className="w-full px-2 py-2 rounded-lg bg-bullish/5 border border-bullish/20 text-xs text-foreground font-mono focus:outline-none focus:border-bullish"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-destructive uppercase tracking-wider">SL</label>
          <input
            type="number"
            step="0.00001"
            value={signal.stopLoss}
            onChange={(e) => updateField('stopLoss', parseFloat(e.target.value) || 0)}
            className="w-full px-2 py-2 rounded-lg bg-destructive/5 border border-destructive/20 text-xs text-foreground font-mono focus:outline-none focus:border-destructive"
          />
        </div>
      </div>

      {/* Probability slider */}
      <div className="space-y-1">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center justify-between">
          <span>{t('ai_center_probability')}</span>
          <span className="text-foreground font-mono text-xs">{signal.probability}%</span>
        </label>
        <input
          type="range"
          min="10"
          max="95"
          value={signal.probability}
          onChange={(e) => updateField('probability', parseInt(e.target.value))}
          className="w-full accent-primary h-1.5"
        />
      </div>

      {/* Quick Stats */}
      <div className="flex items-center justify-between text-xs px-2 py-2 rounded-lg bg-secondary/20 border border-border">
        <div>
          <span className="text-muted-foreground">TP: </span>
          <span className={cn("font-mono font-medium", pips > 0 ? "text-bullish" : "text-destructive")}>
            {pips > 0 ? '+' : ''}{pips} pips
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">SL: </span>
          <span className="font-mono font-medium text-destructive">-{slPips} pips</span>
        </div>
        <div>
          <span className="text-muted-foreground">R:R </span>
          <span className="font-mono font-medium text-foreground">{rr}</span>
        </div>
      </div>

      {/* Warnings */}
      {(pips <= 0 || slPips <= 0) && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/5 border border-accent/20">
          <AlertTriangle className="w-4 h-4 text-accent" />
          <span className="text-[10px] text-accent">{t('ai_center_verify_tp_sl')} {signal.action}</span>
        </div>
      )}

      {/* AI Notes Toggle */}
      <div className="space-y-2">
        <button
          onClick={() => setShowNotes(!showNotes)}
          className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{t('ai_center_attach_notes') || 'Adjuntar notas del análisis'}</span>
          {showNotes ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
          {notes.trim() && <span className="text-primary text-[9px]">✓</span>}
        </button>
        {showNotes && (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder={t('ai_center_notes_placeholder') || 'Resumen del análisis IA, patrones detectados, niveles clave...'}
            className="w-full px-3 py-2 rounded-lg bg-secondary/30 border border-border text-xs text-foreground resize-none focus:outline-none focus:border-primary placeholder:text-muted-foreground/50"
          />
        )}
      </div>

      {/* Create Button */}
      <button
        onClick={handleCreate}
        disabled={creating || pips <= 0 || slPips <= 0}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-40"
      >
        {creating ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Check className="w-5 h-5" />
        )}
        {creating ? t('ai_center_creating_signal') : t('ai_center_create_trading_signal')}
      </button>

      {/* Info */}
      <p className="text-[10px] text-muted-foreground text-center">
        {t('ai_center_auto_chart_info')}
      </p>
    </div>
  );
}
