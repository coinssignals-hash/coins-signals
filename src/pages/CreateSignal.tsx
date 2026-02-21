import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, TrendingUp, TrendingDown, Send, Loader2, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SignalCardCompact } from '@/components/signals/SignalCardCompact';

const POPULAR_PAIRS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'NZD/USD', 'USD/CAD',
  'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'XAU/USD', 'BTC/USD', 'US30', 'NAS100',
];

export default function CreateSignal() {
  const navigate = useNavigate();
  const [currencyPair, setCurrencyPair] = useState('');
  const [action, setAction] = useState<'BUY' | 'SELL'>('BUY');
  const [entryPrice, setEntryPrice] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCardPreview, setShowCardPreview] = useState(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(225,30%,8%)] to-[hsl(225,25%,5%)] text-foreground">
      <div className="max-w-2xl mx-auto px-4 py-6">
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
    </div>
  );
}
