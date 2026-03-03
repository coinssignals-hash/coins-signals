import { useState, useCallback } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, TrendingUp, TrendingDown, Send, Loader2, Eye, EyeOff, Download, Image, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SignalCardCompact } from '@/components/signals/SignalCardCompact';
import { useUserRole } from '@/hooks/useUserRole';

const POPULAR_PAIRS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'NZD/USD', 'USD/CAD',
  'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'XAU/USD', 'BTC/USD', 'US30', 'NAS100',
];

export default function CreateSignal() {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [currencyPair, setCurrencyPair] = useState('');
  const [action, setAction] = useState<'BUY' | 'SELL'>('BUY');
  const [entryPrice, setEntryPrice] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCardPreview, setShowCardPreview] = useState(false);
  const [downloadingChart, setDownloadingChart] = useState(false);
  const entry = parseFloat(entryPrice);
  const tp = parseFloat(takeProfit);
  const sl = parseFloat(stopLoss);
  const isValid = currencyPair && !isNaN(entry) && !isNaN(tp) && !isNaN(sl) && entry > 0;

  const isBuy = action === 'BUY';
  const trend = isBuy ? 'bullish' : 'bearish';

  // Auto-calculate probability based on risk/reward ratio
  const calculateProbability = () => {
    if (!isValid) return 50;
    const reward = Math.abs(tp - entry);
    const risk = Math.abs(entry - sl);
    if (risk === 0) return 50;
    const rr = reward / risk;
    // Higher RR = lower probability but better trade; clamp 40-85
    return Math.min(85, Math.max(40, Math.round(60 + (rr - 1) * 8)));
  };

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);

    try {
      const probability = calculateProbability();

      const { data, error: fnError } = await supabase.functions.invoke('insert-signal-admin', {
        body: {
          currency_pair: currencyPair.toUpperCase(),
          entry_price: entry,
          take_profit: tp,
          stop_loss: sl,
          probability,
          trend,
          action,
          status: 'active',
        },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      toast.success(`Señal ${action} ${currencyPair} creada`);
      setCurrencyPair('');
      setEntryPrice('');
      setTakeProfit('');
      setStopLoss('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear señal');
    } finally {
      setLoading(false);
    }
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

      // Convert SVG to high-quality PNG via canvas
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
      toast.success('Gráfico descargado en HD');
    } catch (err) {
      console.error('Chart download error:', err);
      toast.error('Error al descargar el gráfico');
    } finally {
      setDownloadingChart(false);
    }
  }, [currencyPair, tp, sl]);

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
          <h2 className="text-xl font-bold text-foreground">Acceso Restringido</h2>
          <p className="text-muted-foreground text-sm max-w-xs">
            Solo los administradores pueden crear señales de trading.
          </p>
          <button
            onClick={() => navigate('/signals')}
            className="mt-4 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition-all"
          >
            Volver a Señales
          </button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell showBottomNav={false}>
      <div className="px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-card/60 hover:bg-card">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Crear Señal</h1>
        </div>

        {/* Quick pair selector */}
        <div className="mb-6">
          <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Par / Activo</label>
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
            placeholder="O escribe el par..."
            className="w-full bg-card/60 border border-border/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* BUY / SELL selector */}
        <div className="mb-6">
          <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Acción</label>
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
              COMPRAR (BUY)
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
              VENDER (SELL)
            </button>
          </div>
        </div>

        {/* Price inputs */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Precio de Entrada</label>
            <input
              type="number"
              step="any"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              placeholder="0.00000"
              className="w-full bg-card/60 border border-border/40 rounded-xl px-4 py-3 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-green-400 uppercase tracking-wider mb-1.5 block flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Take Profit
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
              <label className="text-xs text-red-400 uppercase tracking-wider mb-1.5 block flex items-center gap-1">
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
        </div>

        {/* Quick Preview Card */}
        {isValid && (
          <div className="mb-6 space-y-3">
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
          <div className="mb-6">
            <button
              onClick={handleDownloadChart}
              disabled={downloadingChart}
              className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all bg-card/80 border border-border/40 hover:bg-card text-foreground disabled:opacity-40"
            >
              {downloadingChart ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <Image className="w-4 h-4" />
              Descargar gráfico 7 días (HD)
            </button>
            <p className="text-[10px] text-muted-foreground text-center mt-1.5">
              Resistencia (verde) y Soporte (rojo) con precios marcados
            </p>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!isValid || loading}
          className="w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-40 bg-primary text-primary-foreground hover:brightness-110 shadow-lg shadow-primary/30"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          Crear Señal
        </button>
      </div>
    </PageShell>
  );
}
