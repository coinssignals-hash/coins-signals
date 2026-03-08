import { useState, useCallback, useEffect } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  ArrowLeft, TrendingUp, TrendingDown, Send, Loader2,
  Eye, EyeOff, Download, Image, ShieldAlert,
  Save, X, CheckCircle2, XCircle, FileText, List, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SignalCardCompact } from '@/components/signals/SignalCardCompact';
import { useUserRole } from '@/hooks/useUserRole';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/i18n/LanguageContext';

const POPULAR_PAIRS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'NZD/USD', 'USD/CAD',
  'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'XAU/USD', 'BTC/USD', 'US30', 'NAS100',
];

interface Signal {
  id: string;
  currency_pair: string;
  action: string;
  entry_price: number;
  take_profit: number;
  take_profit_2?: number | null;
  take_profit_3?: number | null;
  stop_loss: number;
  support?: number | null;
  resistance?: number | null;
  notes?: string | null;
  status: string;
  probability: number;
  trend: string;
  datetime: string;
  closed_price?: number | null;
  closed_result?: string | null;
}

export default function CreateSignal() {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('create');

  // Create form state
  const [currencyPair, setCurrencyPair] = useState('');
  const [action, setAction] = useState<'BUY' | 'SELL'>('BUY');
  const [entryPrice, setEntryPrice] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [takeProfit2, setTakeProfit2] = useState('');
  const [takeProfit3, setTakeProfit3] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [support, setSupport] = useState('');
  const [resistance, setResistance] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCardPreview, setShowCardPreview] = useState(false);
  const [downloadingChart, setDownloadingChart] = useState(false);
  const [generatingNotes, setGeneratingNotes] = useState(false);

  // Manage signals state
  const [activeSignals, setActiveSignals] = useState<Signal[]>([]);
  const [loadingSignals, setLoadingSignals] = useState(false);
  const [closingSignalId, setClosingSignalId] = useState<string | null>(null);
  const [closePrice, setClosePrice] = useState('');
  const [closeResult, setCloseResult] = useState<'tp' | 'sl' | 'manual'>('tp');
  const [editingSignal, setEditingSignal] = useState<Signal | null>(null);

  const entry = parseFloat(entryPrice);
  const tp = parseFloat(takeProfit);
  const sl = parseFloat(stopLoss);
  const isValid = currencyPair && !isNaN(entry) && !isNaN(tp) && !isNaN(sl) && entry > 0;

  const isBuy = action === 'BUY';
  const trend = isBuy ? 'bullish' : 'bearish';

  const calculateProbability = () => {
    if (!isValid) return 50;
    const reward = Math.abs(tp - entry);
    const risk = Math.abs(entry - sl);
    if (risk === 0) return 50;
    const rr = reward / risk;
    return Math.min(85, Math.max(40, Math.round(60 + (rr - 1) * 8)));
  };

  const fetchActiveSignals = useCallback(async () => {
    setLoadingSignals(true);
    const { data, error } = await supabase
      .from('trading_signals')
      .select('*')
      .in('status', ['active', 'pending'])
      .order('created_at', { ascending: false });

    if (!error && data) {
      setActiveSignals(data.map((s: Record<string, unknown>) => ({
        id: s.id as string,
        currency_pair: s.currency_pair as string,
        action: s.action as string,
        entry_price: s.entry_price as number,
        take_profit: s.take_profit as number,
        take_profit_2: s.take_profit_2 as number | null,
        take_profit_3: s.take_profit_3 as number | null,
        stop_loss: s.stop_loss as number,
        support: s.support as number | null,
        resistance: s.resistance as number | null,
        notes: s.notes as string | null,
        status: s.status as string,
        probability: s.probability as number,
        trend: s.trend as string,
        datetime: s.datetime as string,
        closed_price: s.closed_price as number | null,
        closed_result: s.closed_result as string | null,
      })));
    }
    setLoadingSignals(false);
  }, []);

  useEffect(() => {
    if (activeTab === 'manage' && isAdmin) {
      fetchActiveSignals();
    }
  }, [activeTab, isAdmin, fetchActiveSignals]);

  const resetForm = () => {
    setCurrencyPair('');
    setEntryPrice('');
    setTakeProfit('');
    setTakeProfit2('');
    setTakeProfit3('');
    setStopLoss('');
    setSupport('');
    setResistance('');
    setNotes('');
    setEditingSignal(null);
  };

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      const probability = calculateProbability();
      const body: Record<string, unknown> = {
        currency_pair: currencyPair.toUpperCase(),
        entry_price: entry,
        take_profit: tp,
        stop_loss: sl,
        probability,
        trend,
        action,
        status: 'active',
        support: support ? parseFloat(support) : null,
        resistance: resistance ? parseFloat(resistance) : null,
      };
      if (takeProfit2) body.take_profit_2 = parseFloat(takeProfit2);
      if (takeProfit3) body.take_profit_3 = parseFloat(takeProfit3);
      if (notes.trim()) body.notes = notes.trim();

      const { data, error: fnError } = await supabase.functions.invoke('insert-signal-admin', { body });
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      toast.success(t('cs_signal_created').replace('{action}', action).replace('{pair}', currencyPair));
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('cs_error_create'));
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSignal = async (signalId: string) => {
    if (!closePrice) {
      toast.error(t('cs_enter_close'));
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from('trading_signals')
        .update({
          status: 'completed',
          closed_price: parseFloat(closePrice),
          closed_result: closeResult,
        })
        .eq('id', signalId);

      if (error) throw error;
      toast.success(t('cs_signal_closed'));
      setClosingSignalId(null);
      setClosePrice('');
      fetchActiveSignals();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('cs_error_close'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSignal = async () => {
    if (!editingSignal) return;
    setLoading(true);
    try {
      const updates: Record<string, unknown> = {
        entry_price: parseFloat(entryPrice),
        take_profit: parseFloat(takeProfit),
        stop_loss: parseFloat(stopLoss),
        support: support ? parseFloat(support) : null,
        resistance: resistance ? parseFloat(resistance) : null,
        take_profit_2: takeProfit2 ? parseFloat(takeProfit2) : null,
        take_profit_3: takeProfit3 ? parseFloat(takeProfit3) : null,
        notes: notes.trim() || null,
        action,
        trend: action === 'BUY' ? 'bullish' : 'bearish',
        probability: calculateProbability(),
      };

      const { error } = await supabase
        .from('trading_signals')
        .update(updates)
        .eq('id', editingSignal.id);

      if (error) throw error;
      toast.success(t('cs_signal_updated'));
      resetForm();
      setActiveTab('manage');
      fetchActiveSignals();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('cs_error_update'));
    } finally {
      setLoading(false);
    }
  };

  const startEditSignal = (signal: Signal) => {
    setEditingSignal(signal);
    setCurrencyPair(signal.currency_pair);
    setAction(signal.action as 'BUY' | 'SELL');
    setEntryPrice(String(signal.entry_price));
    setTakeProfit(String(signal.take_profit));
    setTakeProfit2(signal.take_profit_2 ? String(signal.take_profit_2) : '');
    setTakeProfit3(signal.take_profit_3 ? String(signal.take_profit_3) : '');
    setStopLoss(String(signal.stop_loss));
    setSupport(signal.support ? String(signal.support) : '');
    setResistance(signal.resistance ? String(signal.resistance) : '');
    setNotes(signal.notes || '');
    setActiveTab('create');
  };

  const handleDownloadChart = useCallback(async () => {
    if (!currencyPair) return;
    setDownloadingChart(true);
    try {
      const pairClean = currencyPair.replace(/[/\-_ ]/g, '');
      const params = new URLSearchParams({ pair: pairClean, hd: '1' });
      if (!isNaN(tp)) params.set('resistance', String(tp));
      if (!isNaN(sl)) params.set('support', String(sl));

      const chartUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/candlestick-chart?${params.toString()}`;
      const res = await fetch(chartUrl);
      const svgText = await res.text();

      const img = new window.Image();
      const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 1560;
          canvas.height = 800;
          const ctx = canvas.getContext('2d');
          if (!ctx) { reject(new Error('No canvas context')); return; }
          ctx.drawImage(img, 0, 0, 1560, 800);
          canvas.toBlob((pngBlob) => {
            if (!pngBlob) { reject(new Error('No blob')); return; }
            const a = document.createElement('a');
            a.href = URL.createObjectURL(pngBlob);
            a.download = `${currencyPair.replace('/', '-')}_7d_chart.png`;
            a.click();
            URL.revokeObjectURL(a.href);
            resolve();
          }, 'image/png', 1);
        };
        img.onerror = () => reject(new Error('Image load failed'));
        img.src = url;
      });

      URL.revokeObjectURL(url);
      toast.success(t('cs_chart_downloaded'));
    } catch (err) {
      console.error('Chart download error:', err);
      toast.error(t('cs_chart_error'));
    } finally {
      setDownloadingChart(false);
    }
  }, [currencyPair, tp, sl]);

  const handleGenerateNotes = async () => {
    if (!isValid) {
      toast.error(t('cs_fill_prices'));
      return;
    }
    setGeneratingNotes(true);
    try {
      const signal = {
        currencyPair: currencyPair.toUpperCase(),
        action,
        trend,
        entryPrice: entry,
        takeProfit: tp,
        takeProfit2: takeProfit2 ? parseFloat(takeProfit2) : undefined,
        takeProfit3: takeProfit3 ? parseFloat(takeProfit3) : undefined,
        stopLoss: sl,
        probability: calculateProbability(),
        support: support ? parseFloat(support) : undefined,
        resistance: resistance ? parseFloat(resistance) : undefined,
      };

      const { data, error } = await supabase.functions.invoke('analyze-signal', {
        body: { signal, mode: 'notes' },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (data?.notes) {
        setNotes(data.notes);
        toast.success(t('cs_notes_generated'));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('cs_error_notes'));
    } finally {
      setGeneratingNotes(false);
    }
  };

  if (roleLoading) {
    return (
      <PageShell showBottomNav={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageShell>
    );
  }

  if (!isAdmin) {
    return (
      <PageShell showBottomNav={false}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center gap-4">
          <ShieldAlert className="w-16 h-16 text-destructive/60" />
          <h2 className="text-xl font-bold text-foreground">{t('cs_restricted')}</h2>
          <p className="text-muted-foreground text-sm max-w-xs">
            {t('cs_restricted_desc')}
          </p>
          <button
            onClick={() => navigate('/signals')}
            className="mt-4 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition-all"
          >
            {t('cs_back_signals')}
          </button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell showBottomNav={false}>
      <div className="px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-card/60 hover:bg-card">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">
            {editingSignal ? t('cs_edit_signal') : t('cs_admin_panel')}
          </h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full mb-6 bg-card/60">
            <TabsTrigger value="create" className="flex-1 gap-2">
              <Send className="w-4 h-4" />
              {editingSignal ? t('cs_editing') : t('cs_create')}
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex-1 gap-2">
              <List className="w-4 h-4" />
              {t('cs_manage')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            {/* Quick pair selector */}
            <div className="mb-5">
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">{t('cs_pair_asset')}</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {POPULAR_PAIRS.map((pair) => (
                  <button
                    key={pair}
                    onClick={() => setCurrencyPair(pair)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      currencyPair === pair
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                        : 'bg-card/60 text-muted-foreground hover:bg-card hover:text-foreground'
                    }`}
                  >
                    {pair}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={currencyPair}
                onChange={(e) => setCurrencyPair(e.target.value.toUpperCase())}
                placeholder={t('cs_type_pair')}
                disabled={!!editingSignal}
                className="w-full bg-card/60 border border-border/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              />
            </div>

            {/* BUY / SELL selector */}
            <div className="mb-5">
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">{t('cs_action')}</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setAction('BUY')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                    action === 'BUY'
                      ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500 shadow-lg shadow-emerald-500/20'
                      : 'bg-card/60 text-muted-foreground border border-border/40 hover:bg-card'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  {t('cs_buy')}
                </button>
                <button
                  onClick={() => setAction('SELL')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                    action === 'SELL'
                      ? 'bg-red-500/20 text-red-400 border-2 border-red-500 shadow-lg shadow-red-500/20'
                      : 'bg-card/60 text-muted-foreground border border-border/40 hover:bg-card'
                  }`}
                >
                  <TrendingDown className="w-4 h-4" />
                  {t('cs_sell')}
                </button>
              </div>
            </div>

            {/* Price inputs */}
            <div className="space-y-4 mb-5">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">{t('cs_entry_price')}</label>
                <input
                  type="number"
                  step="any"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                  placeholder="0.00000"
                  className="w-full bg-card/60 border border-border/40 rounded-xl px-4 py-3 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* TP1 & SL */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-green-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Take Profit 1
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value)}
                    placeholder="0.00000"
                    className="w-full bg-card/60 border border-green-500/20 rounded-xl px-4 py-3 font-mono focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-red-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" /> Stop Loss
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    placeholder="0.00000"
                    className="w-full bg-card/60 border border-red-500/20 rounded-xl px-4 py-3 font-mono focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>
              </div>

              {/* TP2 & TP3 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-green-400/70 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> TP 2 <span className="text-muted-foreground">({t('cs_optional')})</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={takeProfit2}
                    onChange={(e) => setTakeProfit2(e.target.value)}
                    placeholder="0.00000"
                    className="w-full bg-card/60 border border-green-500/10 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30"
                  />
                </div>
                <div>
                  <label className="text-xs text-green-400/70 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> TP 3 <span className="text-muted-foreground">({t('cs_optional')})</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={takeProfit3}
                    onChange={(e) => setTakeProfit3(e.target.value)}
                    placeholder="0.00000"
                    className="w-full bg-card/60 border border-green-500/10 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30"
                  />
                </div>
              </div>

              {/* Support & Resistance */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-amber-400 uppercase tracking-wider mb-1.5 block">Soporte</label>
                  <input
                    type="number"
                    step="any"
                    value={support}
                    onChange={(e) => setSupport(e.target.value)}
                    placeholder="0.00000"
                    className="w-full bg-card/60 border border-amber-500/20 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
                <div>
                  <label className="text-xs text-blue-400 uppercase tracking-wider mb-1.5 block">Resistencia</label>
                  <input
                    type="number"
                    step="any"
                    value={resistance}
                    onChange={(e) => setResistance(e.target.value)}
                    placeholder="0.00000"
                    className="w-full bg-card/60 border border-blue-500/20 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Notas / Análisis
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateNotes}
                    disabled={generatingNotes || !isValid}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/15 text-primary hover:bg-primary/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {generatingNotes ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    {generatingNotes ? 'Generando...' : 'Generar con IA'}
                  </button>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Justificación del trade, confluencias técnicas, contexto fundamental..."
                  rows={3}
                  maxLength={500}
                  className="w-full bg-card/60 border border-border/40 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <p className="text-[10px] text-muted-foreground text-right mt-1">{notes.length}/500</p>
              </div>
            </div>

            {/* Quick Preview Card */}
            {isValid && (
              <div className="mb-5 space-y-3">
                <button
                  onClick={() => setShowCardPreview(!showCardPreview)}
                  className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all bg-card/80 border border-border/40 hover:bg-card text-foreground"
                >
                  {showCardPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showCardPreview ? 'Ocultar vista previa' : 'Vista previa de tarjeta'}
                </button>

                {showCardPreview && (
                  <div className="space-y-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest text-center">Así se verá la señal</p>
                    <SignalCardCompact
                      signal={{
                        id: 'preview',
                        currencyPair,
                        datetime: new Date().toISOString(),
                        status: 'active',
                        probability: calculateProbability(),
                        trend,
                        action,
                        entryPrice: entry,
                        takeProfit: tp,
                        stopLoss: sl,
                      }}
                    />
                    <div className="bg-card/60 border border-border/30 rounded-xl p-3 grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <p className="text-muted-foreground">Probabilidad</p>
                        <p className="text-primary font-bold text-sm">{calculateProbability()}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">R:R</p>
                        <p className="text-foreground font-bold text-sm">1:{(Math.abs(tp - entry) / Math.abs(entry - sl)).toFixed(1)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tendencia</p>
                        <p className={`font-bold text-sm ${isBuy ? 'text-emerald-400' : 'text-rose-400'}`}>{trend}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Download Chart HD */}
            {currencyPair && (
              <div className="mb-5">
                <button
                  onClick={handleDownloadChart}
                  disabled={downloadingChart}
                  className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all bg-card/80 border border-border/40 hover:bg-card text-foreground disabled:opacity-40"
                >
                  {downloadingChart ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <Image className="w-4 h-4" />
                  Descargar gráfico 7 días (HD)
                </button>
              </div>
            )}

            {/* Submit / Update */}
            {editingSignal ? (
              <div className="flex gap-3">
                <button
                  onClick={() => resetForm()}
                  className="flex-1 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 bg-card border border-border/40 text-muted-foreground hover:bg-card/80"
                >
                  <X className="w-4 h-4" /> Cancelar
                </button>
                <button
                  onClick={handleUpdateSignal}
                  disabled={!isValid || loading}
                  className="flex-1 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 bg-primary text-primary-foreground hover:brightness-110 shadow-lg shadow-primary/30"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Guardar Cambios
                </button>
              </div>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!isValid || loading}
                className="w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-40 bg-primary text-primary-foreground hover:brightness-110 shadow-lg shadow-primary/30"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Crear Señal
              </button>
            )}
          </TabsContent>

          <TabsContent value="manage">
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Señales activas</p>
                <button
                  onClick={fetchActiveSignals}
                  disabled={loadingSignals}
                  className="text-xs text-primary hover:underline"
                >
                  {loadingSignals ? 'Cargando...' : 'Refrescar'}
                </button>
              </div>

              {loadingSignals ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : activeSignals.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  No hay señales activas
                </div>
              ) : (
                activeSignals.map((signal) => (
                  <div key={signal.id} className="bg-card/60 border border-border/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          signal.action === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {signal.action}
                        </span>
                        <span className="font-bold text-sm">{signal.currency_pair}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(signal.datetime).toLocaleDateString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs text-center">
                      <div>
                        <p className="text-muted-foreground">Entry</p>
                        <p className="font-mono font-semibold">{signal.entry_price}</p>
                      </div>
                      <div>
                        <p className="text-green-400">TP</p>
                        <p className="font-mono font-semibold text-green-400">{signal.take_profit}</p>
                      </div>
                      <div>
                        <p className="text-red-400">SL</p>
                        <p className="font-mono font-semibold text-red-400">{signal.stop_loss}</p>
                      </div>
                    </div>

                    {signal.notes && (
                      <p className="text-xs text-muted-foreground bg-background/30 rounded-lg px-3 py-2 italic">
                        {signal.notes}
                      </p>
                    )}

                    {closingSignalId === signal.id ? (
                      <div className="space-y-3 pt-2 border-t border-border/30">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Precio de cierre</label>
                          <input
                            type="number"
                            step="any"
                            value={closePrice}
                            onChange={(e) => setClosePrice(e.target.value)}
                            placeholder="0.00000"
                            className="w-full bg-background/40 border border-border/40 rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                        </div>
                        <div className="flex gap-2">
                          {(['tp', 'sl', 'manual'] as const).map((r) => (
                            <button
                              key={r}
                              onClick={() => setCloseResult(r)}
                              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                                closeResult === r
                                  ? r === 'tp' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500'
                                    : r === 'sl' ? 'bg-red-500/20 text-red-400 border border-red-500'
                                    : 'bg-amber-500/20 text-amber-400 border border-amber-500'
                                  : 'bg-card/60 text-muted-foreground border border-border/40'
                              }`}
                            >
                              {r === 'tp' ? 'Hit TP' : r === 'sl' ? 'Hit SL' : 'Manual'}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setClosingSignalId(null); setClosePrice(''); }}
                            className="flex-1 py-2 rounded-lg text-xs font-semibold bg-card text-muted-foreground border border-border/40"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleCloseSignal(signal.id)}
                            disabled={loading}
                            className="flex-1 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground"
                          >
                            {loading ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Confirmar cierre'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => startEditSignal(signal)}
                          className="flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 bg-card/80 border border-border/40 hover:bg-card text-foreground"
                        >
                          <Save className="w-3 h-3" /> Editar
                        </button>
                        <button
                          onClick={() => setClosingSignalId(signal.id)}
                          className="flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20"
                        >
                          <XCircle className="w-3 h-3" /> Cerrar
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageShell>
  );
}
