import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  TrendingUp, TrendingDown, Send, Loader2,
  Eye, EyeOff, Download, Image, Save, X,
  XCircle, FileText, List, Sparkles
} from 'lucide-react';
import { SignalCardCompact } from '@/components/signals/SignalCardCompact';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

export function AdminCreateSignalTab() {
  const [activeTab, setActiveTab] = useState('create');

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
        id: s.id as string, currency_pair: s.currency_pair as string,
        action: s.action as string, entry_price: s.entry_price as number,
        take_profit: s.take_profit as number, take_profit_2: s.take_profit_2 as number | null,
        take_profit_3: s.take_profit_3 as number | null, stop_loss: s.stop_loss as number,
        support: s.support as number | null, resistance: s.resistance as number | null,
        notes: s.notes as string | null, status: s.status as string,
        probability: s.probability as number, trend: s.trend as string,
        datetime: s.datetime as string, closed_price: s.closed_price as number | null,
        closed_result: s.closed_result as string | null,
      })));
    }
    setLoadingSignals(false);
  }, []);

  useEffect(() => {
    if (activeTab === 'manage') fetchActiveSignals();
  }, [activeTab, fetchActiveSignals]);

  const resetForm = () => {
    setCurrencyPair(''); setEntryPrice(''); setTakeProfit('');
    setTakeProfit2(''); setTakeProfit3(''); setStopLoss('');
    setSupport(''); setResistance(''); setNotes('');
    setEditingSignal(null);
  };

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      const probability = calculateProbability();
      const body: Record<string, unknown> = {
        currency_pair: currencyPair.toUpperCase(), entry_price: entry,
        take_profit: tp, stop_loss: sl, probability, trend, action, status: 'active',
        support: support ? parseFloat(support) : null,
        resistance: resistance ? parseFloat(resistance) : null,
      };
      if (takeProfit2) body.take_profit_2 = parseFloat(takeProfit2);
      if (takeProfit3) body.take_profit_3 = parseFloat(takeProfit3);
      if (notes.trim()) body.notes = notes.trim();

      const { data, error: fnError } = await supabase.functions.invoke('insert-signal-admin', { body });
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      toast({ title: '✅ Señal creada', description: `${action} ${currencyPair}` });
      resetForm();
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Error al crear señal', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSignal = async (signalId: string) => {
    if (!closePrice) { toast({ title: 'Ingresa precio de cierre', variant: 'destructive' }); return; }
    setLoading(true);
    try {
      const { error } = await supabase.from('trading_signals')
        .update({ status: 'completed', closed_price: parseFloat(closePrice), closed_result: closeResult })
        .eq('id', signalId);
      if (error) throw error;
      toast({ title: '✅ Señal cerrada' });
      setClosingSignalId(null); setClosePrice('');
      fetchActiveSignals();
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Error al cerrar', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const handleUpdateSignal = async () => {
    if (!editingSignal) return;
    setLoading(true);
    try {
      const updates: Record<string, unknown> = {
        entry_price: parseFloat(entryPrice), take_profit: parseFloat(takeProfit),
        stop_loss: parseFloat(stopLoss), support: support ? parseFloat(support) : null,
        resistance: resistance ? parseFloat(resistance) : null,
        take_profit_2: takeProfit2 ? parseFloat(takeProfit2) : null,
        take_profit_3: takeProfit3 ? parseFloat(takeProfit3) : null,
        notes: notes.trim() || null, action, trend: action === 'BUY' ? 'bullish' : 'bearish',
        probability: calculateProbability(),
      };
      const { error } = await supabase.from('trading_signals').update(updates).eq('id', editingSignal.id);
      if (error) throw error;
      toast({ title: '✅ Señal actualizada' });
      resetForm(); setActiveTab('manage'); fetchActiveSignals();
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Error al actualizar', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const startEditSignal = (signal: Signal) => {
    setEditingSignal(signal); setCurrencyPair(signal.currency_pair);
    setAction(signal.action as 'BUY' | 'SELL'); setEntryPrice(String(signal.entry_price));
    setTakeProfit(String(signal.take_profit));
    setTakeProfit2(signal.take_profit_2 ? String(signal.take_profit_2) : '');
    setTakeProfit3(signal.take_profit_3 ? String(signal.take_profit_3) : '');
    setStopLoss(String(signal.stop_loss)); setSupport(signal.support ? String(signal.support) : '');
    setResistance(signal.resistance ? String(signal.resistance) : '');
    setNotes(signal.notes || ''); setActiveTab('create');
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
          canvas.width = 1560; canvas.height = 800;
          const ctx = canvas.getContext('2d');
          if (!ctx) { reject(new Error('No canvas context')); return; }
          ctx.drawImage(img, 0, 0, 1560, 800);
          canvas.toBlob((pngBlob) => {
            if (!pngBlob) { reject(new Error('No blob')); return; }
            const a = document.createElement('a');
            a.href = URL.createObjectURL(pngBlob);
            a.download = `${currencyPair.replace('/', '-')}_7d_chart.png`;
            a.click(); URL.revokeObjectURL(a.href); resolve();
          }, 'image/png', 1);
        };
        img.onerror = () => reject(new Error('Image load failed'));
        img.src = url;
      });
      URL.revokeObjectURL(url);
      toast({ title: '📊 Gráfico descargado' });
    } catch {
      toast({ title: 'Error al descargar gráfico', variant: 'destructive' });
    } finally { setDownloadingChart(false); }
  }, [currencyPair, tp, sl]);

  const handleGenerateNotes = async () => {
    if (!isValid) { toast({ title: 'Completa los precios primero', variant: 'destructive' }); return; }
    setGeneratingNotes(true);
    try {
      const signal = {
        currencyPair: currencyPair.toUpperCase(), action, trend,
        entryPrice: entry, takeProfit: tp,
        takeProfit2: takeProfit2 ? parseFloat(takeProfit2) : undefined,
        takeProfit3: takeProfit3 ? parseFloat(takeProfit3) : undefined,
        stopLoss: sl, probability: calculateProbability(),
        support: support ? parseFloat(support) : undefined,
        resistance: resistance ? parseFloat(resistance) : undefined,
      };
      const { data, error } = await supabase.functions.invoke('analyze-signal', { body: { signal, mode: 'notes' } });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (data?.notes) { setNotes(data.notes); toast({ title: '✨ Notas generadas con IA' }); }
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Error generando notas', variant: 'destructive' });
    } finally { setGeneratingNotes(false); }
  };

  const inputClass = "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm font-mono text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/30";
  const labelClass = "text-[10px] uppercase tracking-wider mb-1.5 block";

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full mb-4 bg-white/[0.03] border border-white/[0.06]">
          <TabsTrigger value="create" className="flex-1 gap-2 text-xs data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-400">
            <Send className="w-3.5 h-3.5" />
            {editingSignal ? 'Editando' : 'Crear Señal'}
          </TabsTrigger>
          <TabsTrigger value="manage" className="flex-1 gap-2 text-xs data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-400">
            <List className="w-3.5 h-3.5" />
            Gestionar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          {/* Pair selector */}
          <div>
            <label className={`${labelClass} text-white/40`}>Par / Activo</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {POPULAR_PAIRS.map((pair) => (
                <button key={pair} onClick={() => setCurrencyPair(pair)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
                    currencyPair === pair
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-white/[0.03] text-white/40 border border-white/[0.06] hover:bg-white/[0.06] hover:text-white/60'
                  }`}
                >{pair}</button>
              ))}
            </div>
            <input type="text" value={currencyPair} onChange={(e) => setCurrencyPair(e.target.value.toUpperCase())}
              placeholder="Ej: EUR/USD" disabled={!!editingSignal} className={`${inputClass} disabled:opacity-40`} />
          </div>

          {/* BUY / SELL */}
          <div>
            <label className={`${labelClass} text-white/40`}>Acción</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setAction('BUY')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-xs transition-all ${
                  action === 'BUY'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40'
                    : 'bg-white/[0.03] text-white/40 border border-white/[0.06] hover:bg-white/[0.06]'
                }`}>
                <TrendingUp className="w-3.5 h-3.5" /> BUY
              </button>
              <button onClick={() => setAction('SELL')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-xs transition-all ${
                  action === 'SELL'
                    ? 'bg-red-500/15 text-red-400 border border-red-500/40'
                    : 'bg-white/[0.03] text-white/40 border border-white/[0.06] hover:bg-white/[0.06]'
                }`}>
                <TrendingDown className="w-3.5 h-3.5" /> SELL
              </button>
            </div>
          </div>

          {/* Prices */}
          <div className="space-y-3">
            <div>
              <label className={`${labelClass} text-white/40`}>Precio de Entrada</label>
              <input type="number" step="any" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} placeholder="0.00000" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={`${labelClass} text-emerald-400/70`}><TrendingUp className="w-3 h-3 inline mr-1" />Take Profit 1</label>
                <input type="number" step="any" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} placeholder="0.00000" className={inputClass} />
              </div>
              <div>
                <label className={`${labelClass} text-red-400/70`}><TrendingDown className="w-3 h-3 inline mr-1" />Stop Loss</label>
                <input type="number" step="any" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} placeholder="0.00000" className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={`${labelClass} text-emerald-400/40`}>TP 2 (opcional)</label>
                <input type="number" step="any" value={takeProfit2} onChange={(e) => setTakeProfit2(e.target.value)} placeholder="0.00000" className={inputClass} />
              </div>
              <div>
                <label className={`${labelClass} text-emerald-400/40`}>TP 3 (opcional)</label>
                <input type="number" step="any" value={takeProfit3} onChange={(e) => setTakeProfit3(e.target.value)} placeholder="0.00000" className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={`${labelClass} text-amber-400/70`}>Soporte</label>
                <input type="number" step="any" value={support} onChange={(e) => setSupport(e.target.value)} placeholder="0.00000" className={inputClass} />
              </div>
              <div>
                <label className={`${labelClass} text-blue-400/70`}>Resistencia</label>
                <input type="number" step="any" value={resistance} onChange={(e) => setResistance(e.target.value)} placeholder="0.00000" className={inputClass} />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`${labelClass} text-white/40 mb-0`}>
                <FileText className="w-3 h-3 inline mr-1" /> Notas / Análisis
              </label>
              <button type="button" onClick={handleGenerateNotes} disabled={generatingNotes || !isValid}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 disabled:opacity-30 transition-all">
                {generatingNotes ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {generatingNotes ? 'Generando...' : 'Generar con IA'}
              </button>
            </div>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Análisis técnico, patrones, confluencias..."
              rows={3} maxLength={500}
              className={`${inputClass} resize-none font-sans`} />
            <p className="text-[9px] text-white/20 text-right mt-0.5">{notes.length}/500</p>
          </div>

          {/* Preview */}
          {isValid && (
            <div className="space-y-2">
              <button onClick={() => setShowCardPreview(!showCardPreview)}
                className="w-full py-2 rounded-lg font-medium text-xs flex items-center justify-center gap-2 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] text-white/50">
                {showCardPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showCardPreview ? 'Ocultar Preview' : 'Ver Preview'}
              </button>
              {showCardPreview && (
                <div className="space-y-2">
                  <SignalCardCompact signal={{
                    id: 'preview', currencyPair, datetime: new Date().toISOString(),
                    status: 'active', probability: calculateProbability(), trend, action,
                    entryPrice: entry, takeProfit: tp, stopLoss: sl,
                  }} />
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-2.5 grid grid-cols-3 gap-2 text-center text-[10px]">
                    <div><p className="text-white/30">Probabilidad</p><p className="text-amber-400 font-bold text-sm">{calculateProbability()}%</p></div>
                    <div><p className="text-white/30">R:R</p><p className="text-white font-bold text-sm">1:{(Math.abs(tp - entry) / Math.abs(entry - sl)).toFixed(1)}</p></div>
                    <div><p className="text-white/30">Trend</p><p className={`font-bold text-sm ${isBuy ? 'text-emerald-400' : 'text-rose-400'}`}>{trend}</p></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Download Chart */}
          {currencyPair && (
            <button onClick={handleDownloadChart} disabled={downloadingChart}
              className="w-full py-2 rounded-lg font-medium text-xs flex items-center justify-center gap-2 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] text-white/50 disabled:opacity-30">
              {downloadingChart ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <Image className="w-3.5 h-3.5" /> Descargar Gráfico HD
            </button>
          )}

          {/* Submit / Update */}
          {editingSignal ? (
            <div className="flex gap-2">
              <button onClick={resetForm}
                className="flex-1 py-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 bg-white/[0.04] border border-white/[0.08] text-white/40 hover:bg-white/[0.06]">
                <X className="w-3.5 h-3.5" /> Cancelar
              </button>
              <button onClick={handleUpdateSignal} disabled={!isValid || loading}
                className="flex-1 py-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 bg-amber-500 text-black hover:bg-amber-600 disabled:opacity-40">
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Guardar Cambios
              </button>
            </div>
          ) : (
            <button onClick={handleSubmit} disabled={!isValid || loading}
              className="w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 bg-amber-500 text-black hover:bg-amber-600 disabled:opacity-40 shadow-lg shadow-amber-500/20">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Crear Señal
            </button>
          )}
        </TabsContent>

        <TabsContent value="manage" className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-white/40">Señales activas y pendientes</p>
            <button onClick={fetchActiveSignals} disabled={loadingSignals}
              className="text-[10px] text-amber-400 hover:underline">
              {loadingSignals ? 'Cargando...' : 'Refrescar'}
            </button>
          </div>

          {loadingSignals ? (
            <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-amber-400" /></div>
          ) : activeSignals.length === 0 ? (
            <div className="text-center py-12 text-white/30 text-xs">No hay señales activas</div>
          ) : (
            activeSignals.map((signal) => (
              <div key={signal.id} className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      signal.action === 'BUY' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                    }`}>{signal.action}</span>
                    <span className="font-bold text-xs text-white">{signal.currency_pair}</span>
                  </div>
                  <span className="text-[9px] text-white/25">
                    {new Date(signal.datetime).toLocaleDateString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[10px] text-center">
                  <div><p className="text-white/30">Entry</p><p className="font-mono font-semibold text-white">{signal.entry_price}</p></div>
                  <div><p className="text-emerald-400/60">TP</p><p className="font-mono font-semibold text-emerald-400">{signal.take_profit}</p></div>
                  <div><p className="text-red-400/60">SL</p><p className="font-mono font-semibold text-red-400">{signal.stop_loss}</p></div>
                </div>

                {signal.notes && (
                  <p className="text-[10px] text-white/30 bg-white/[0.02] rounded px-2.5 py-1.5 italic line-clamp-2">{signal.notes}</p>
                )}

                {closingSignalId === signal.id ? (
                  <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                    <div>
                      <label className="text-[10px] text-white/30 mb-1 block">Precio de cierre</label>
                      <input type="number" step="any" value={closePrice} onChange={(e) => setClosePrice(e.target.value)}
                        placeholder="0.00000" className={inputClass} />
                    </div>
                    <div className="flex gap-1.5">
                      {(['tp', 'sl', 'manual'] as const).map((r) => (
                        <button key={r} onClick={() => setCloseResult(r)}
                          className={`flex-1 py-1.5 rounded text-[10px] font-semibold transition-all ${
                            closeResult === r
                              ? r === 'tp' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40'
                                : r === 'sl' ? 'bg-red-500/15 text-red-400 border border-red-500/40'
                                : 'bg-amber-500/15 text-amber-400 border border-amber-500/40'
                              : 'bg-white/[0.03] text-white/30 border border-white/[0.06]'
                          }`}>
                          {r === 'tp' ? 'Hit TP' : r === 'sl' ? 'Hit SL' : 'Manual'}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => { setClosingSignalId(null); setClosePrice(''); }}
                        className="flex-1 py-1.5 rounded text-[10px] font-semibold bg-white/[0.04] text-white/30 border border-white/[0.06]">
                        Cancelar
                      </button>
                      <button onClick={() => handleCloseSignal(signal.id)} disabled={loading}
                        className="flex-1 py-1.5 rounded text-[10px] font-semibold bg-amber-500 text-black">
                        {loading ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Confirmar Cierre'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-1.5 pt-1">
                    <button onClick={() => startEditSignal(signal)}
                      className="flex-1 py-1.5 rounded text-[10px] font-semibold flex items-center justify-center gap-1 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06] text-white/50">
                      <Save className="w-3 h-3" /> Editar
                    </button>
                    <button onClick={() => setClosingSignalId(signal.id)}
                      className="flex-1 py-1.5 rounded text-[10px] font-semibold flex items-center justify-center gap-1 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/15">
                      <XCircle className="w-3 h-3" /> Cerrar
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
