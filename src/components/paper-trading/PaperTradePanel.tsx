import { useState, useEffect, useRef } from 'react';
import { GlowSection } from '@/components/ui/glow-section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, RotateCcw, Shield, Target, Zap, Zap as SignalIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { InstrumentSelector } from './InstrumentSelector';
import { INSTRUMENTS, type Instrument } from '@/hooks/usePaperTrading';
import type { SignalPrefill } from '@/pages/PaperTrading';

const ACCENT = '270 70% 60%';
const LEVERAGE_OPTIONS = [1, 5, 10, 20, 50, 100, 200, 500];

interface Props {
  instruments: Instrument[];
  prices: Record<string, number>;
  onOpen: (symbol: string, side: 'buy' | 'sell', qty: number, opts: {
    lotSize: number; leverage: number; stopLoss: number | null; takeProfit: number | null; orderType: 'market' | 'limit';
  }) => false | object;
  onReset: () => void;
  balance: number;
  signalPrefill?: SignalPrefill | null;
  onPrefillConsumed?: () => void;
}

export function PaperTradePanel({ instruments, prices, onOpen, onReset, balance, signalPrefill, onPrefillConsumed }: Props) {
  const [selectedSymbol, setSelectedSymbol] = useState(instruments[0]?.symbol ?? 'EUR/USD');
  const [lotSize, setLotSize] = useState('0.01');
  const [leverage, setLeverage] = useState(100);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [slEnabled, setSlEnabled] = useState(false);
  const [tpEnabled, setTpEnabled] = useState(false);
  const [slPips, setSlPips] = useState('50');
  const [tpPips, setTpPips] = useState('100');
  const [prefillSide, setPrefillSide] = useState<'buy' | 'sell' | null>(null);
  const prefillApplied = useRef(false);

  // Apply signal prefill and auto-execute
  useEffect(() => {
    if (signalPrefill && !prefillApplied.current) {
      prefillApplied.current = true;
      const inst = INSTRUMENTS.find(i => i.symbol === signalPrefill.symbol);
      if (inst) {
        setSelectedSymbol(signalPrefill.symbol);
        setSlEnabled(true);
        setTpEnabled(true);
        // Calculate pips from prices
        const slPipsVal = Math.abs(signalPrefill.entryPrice - signalPrefill.stopLoss) / inst.pipSize;
        const tpPipsVal = Math.abs(signalPrefill.takeProfit - signalPrefill.entryPrice) / inst.pipSize;
        setSlPips(Math.round(slPipsVal).toString());
        setTpPips(Math.round(tpPipsVal).toString());
        setPrefillSide(signalPrefill.side);

        // Auto-execute the trade after a short delay for prices to load
        const autoExecTimer = setTimeout(() => {
          const currentP = prices[signalPrefill.symbol] ?? signalPrefill.entryPrice;
          const lotsVal = parseFloat(lotSize) || 0.01;
          const unitsVal = Math.round(lotsVal * 100000);
          const slPrice = signalPrefill.side === 'buy'
            ? currentP - Math.round(slPipsVal) * inst.pipSize
            : currentP + Math.round(slPipsVal) * inst.pipSize;
          const tpPrice = signalPrefill.side === 'buy'
            ? currentP + Math.round(tpPipsVal) * inst.pipSize
            : currentP - Math.round(tpPipsVal) * inst.pipSize;

          const result = onOpen(signalPrefill.symbol, signalPrefill.side, unitsVal, {
            lotSize: lotsVal,
            leverage,
            stopLoss: slPrice,
            takeProfit: tpPrice,
            orderType: 'market',
          });

          if (result !== false) {
            toast({
              title: `📊 Señal ejecutada · ${signalPrefill.side === 'buy' ? '🟢 Compra' : '🔴 Venta'}`,
              description: `${signalPrefill.symbol} · SL: ${Math.round(slPipsVal)} pips · TP: ${Math.round(tpPipsVal)} pips`,
            });
            // Notify parent to switch to positions tab
            onPrefillConsumed?.();
          } else {
            toast({ title: 'Margen insuficiente', description: 'No se pudo abrir la posición automáticamente', variant: 'destructive' });
            onPrefillConsumed?.();
          }
          setPrefillSide(null);
        }, 500);

        return () => clearTimeout(autoExecTimer);
      }
      onPrefillConsumed?.();
    }
  }, [signalPrefill, prices]);

  const inst = INSTRUMENTS.find(i => i.symbol === selectedSymbol) || INSTRUMENTS[0];
  const currentPrice = prices[selectedSymbol] ?? 0;
  const lots = parseFloat(lotSize) || 0.01;
  const units = Math.round(lots * 100000);
  const margin = (currentPrice * units) / leverage;

  const getSLPrice = (side: 'buy' | 'sell') => {
    const pips = parseInt(slPips) || 50;
    return side === 'buy'
      ? currentPrice - pips * inst.pipSize
      : currentPrice + pips * inst.pipSize;
  };

  const getTPPrice = (side: 'buy' | 'sell') => {
    const pips = parseInt(tpPips) || 100;
    return side === 'buy'
      ? currentPrice + pips * inst.pipSize
      : currentPrice - pips * inst.pipSize;
  };

  const handleOpen = (side: 'buy' | 'sell') => {
    const result = onOpen(selectedSymbol, side, units, {
      lotSize: lots,
      leverage,
      stopLoss: slEnabled ? getSLPrice(side) : null,
      takeProfit: tpEnabled ? getTPPrice(side) : null,
      orderType,
    });
    if (result === false) {
      toast({ title: 'Margen insuficiente', description: `Necesitas $${margin.toFixed(2)} de margen`, variant: 'destructive' });
    } else {
      toast({
        title: `${side === 'buy' ? '🟢 Compra' : '🔴 Venta'} abierta`,
        description: `${selectedSymbol} · ${lots} lotes · Apal. x${leverage}`,
      });
    }
  };

  return (
    <div className="space-y-3">
      {/* Instrument Selector */}
      <InstrumentSelector selected={selectedSymbol} prices={prices} onSelect={setSelectedSymbol} />

      {/* Price Display */}
      <GlowSection color={ACCENT}>
        <div className="p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">{inst.name}</p>
          <p className="text-3xl font-mono font-bold text-foreground">
            {currentPrice.toFixed(inst.decimals)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">Precio simulado · actualiza cada 2s</p>
        </div>
      </GlowSection>

      {/* Order Type */}
      <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid hsl(var(--border) / 0.3)' }}>
        {(['market', 'limit'] as const).map(t => (
          <button key={t} onClick={() => setOrderType(t)}
            className="flex-1 py-2 text-xs font-semibold transition-all"
            style={orderType === t ? {
              background: `hsl(${ACCENT} / 0.15)`,
              color: `hsl(${ACCENT})`,
            } : { color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--muted) / 0.3)' }}>
            {t === 'market' ? '⚡ Mercado' : '📋 Límite'}
          </button>
        ))}
      </div>

      {/* Lot Size & Leverage */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-muted-foreground font-medium mb-1 block">📦 Tamaño Lote</label>
          <Input type="number" step="0.01" min="0.01" value={lotSize} onChange={e => setLotSize(e.target.value)}
            className="text-sm bg-background/40 border-border/30 h-9" />
          <p className="text-[9px] text-muted-foreground mt-0.5">{units.toLocaleString()} unidades</p>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground font-medium mb-1 flex items-center gap-1">
            <Zap className="w-3 h-3" /> Apalancamiento
          </label>
          <Select value={String(leverage)} onValueChange={v => setLeverage(Number(v))}>
            <SelectTrigger className="h-9 text-sm bg-background/40 border-border/30">
              <SelectValue placeholder="Leverage" />
            </SelectTrigger>
            <SelectContent>
              {LEVERAGE_OPTIONS.map(lev => (
                <SelectItem key={lev} value={String(lev)}>
                  x{lev}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Margin info */}
      <div className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: 'hsl(var(--muted) / 0.3)', border: '1px solid hsl(var(--border) / 0.2)' }}>
        <span className="text-[10px] text-muted-foreground">Margen requerido</span>
        <span className={`text-xs font-bold font-mono ${margin > balance ? 'text-destructive' : 'text-foreground'}`}>
          ${margin.toFixed(2)}
        </span>
      </div>

      {/* SL / TP */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg p-2.5" style={{ background: 'hsl(0 84% 60% / 0.05)', border: '1px solid hsl(0 84% 60% / 0.15)' }}>
          <label className="flex items-center gap-1.5 mb-1.5 cursor-pointer" onClick={() => setSlEnabled(!slEnabled)}>
            <div className="w-4 h-4 rounded flex items-center justify-center text-[10px]"
              style={slEnabled ? { background: 'hsl(0 84% 60% / 0.2)', color: 'hsl(0 84% 60%)' } : { background: 'hsl(var(--muted) / 0.5)', color: 'hsl(var(--muted-foreground))' }}>
              {slEnabled ? '✓' : ''}
            </div>
            <Shield className="w-3 h-3" style={{ color: 'hsl(0 84% 60%)' }} />
            <span className="text-[10px] font-semibold" style={{ color: 'hsl(0 84% 60%)' }}>Stop Loss</span>
          </label>
          {slEnabled && (
            <div className="flex items-center gap-1">
              <Input type="number" value={slPips} onChange={e => setSlPips(e.target.value)}
                className="text-xs h-7 bg-background/40 border-border/20" />
              <span className="text-[9px] text-muted-foreground whitespace-nowrap">pips</span>
            </div>
          )}
        </div>
        <div className="rounded-lg p-2.5" style={{ background: 'hsl(160 84% 39% / 0.05)', border: '1px solid hsl(160 84% 39% / 0.15)' }}>
          <label className="flex items-center gap-1.5 mb-1.5 cursor-pointer" onClick={() => setTpEnabled(!tpEnabled)}>
            <div className="w-4 h-4 rounded flex items-center justify-center text-[10px]"
              style={tpEnabled ? { background: 'hsl(160 84% 39% / 0.2)', color: 'hsl(160 84% 39%)' } : { background: 'hsl(var(--muted) / 0.5)', color: 'hsl(var(--muted-foreground))' }}>
              {tpEnabled ? '✓' : ''}
            </div>
            <Target className="w-3 h-3" style={{ color: 'hsl(160 84% 39%)' }} />
            <span className="text-[10px] font-semibold" style={{ color: 'hsl(160 84% 39%)' }}>Take Profit</span>
          </label>
          {tpEnabled && (
            <div className="flex items-center gap-1">
              <Input type="number" value={tpPips} onChange={e => setTpPips(e.target.value)}
                className="text-xs h-7 bg-background/40 border-border/20" />
              <span className="text-[9px] text-muted-foreground whitespace-nowrap">pips</span>
            </div>
          )}
        </div>
      </div>

      {/* Signal prefill banner */}
      {prefillSide && (
        <div className="rounded-xl p-3 flex items-center gap-3" style={{
          background: prefillSide === 'buy'
            ? 'linear-gradient(135deg, hsl(160 84% 39% / 0.1), hsl(160 84% 39% / 0.03))'
            : 'linear-gradient(135deg, hsl(0 84% 55% / 0.1), hsl(0 84% 55% / 0.03))',
          border: prefillSide === 'buy'
            ? '1px solid hsl(160 84% 39% / 0.3)'
            : '1px solid hsl(0 84% 55% / 0.3)',
        }}>
          <SignalIcon className="w-4 h-4 shrink-0" style={{ color: prefillSide === 'buy' ? 'hsl(160 84% 50%)' : 'hsl(0 84% 60%)' }} />
          <div className="flex-1">
            <p className="text-[10px] font-bold" style={{ color: prefillSide === 'buy' ? 'hsl(160 84% 50%)' : 'hsl(0 84% 60%)' }}>
              Señal pre-cargada · {prefillSide === 'buy' ? 'COMPRA' : 'VENTA'}
            </p>
            <p className="text-[9px] text-muted-foreground">SL y TP configurados desde la señal</p>
          </div>
        </div>
      )}

      {/* Buy / Sell buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={() => { handleOpen('buy'); setPrefillSide(null); }} className="h-14 text-base font-bold rounded-xl text-white"
          style={{
            background: prefillSide === 'buy'
              ? 'linear-gradient(135deg, hsl(160 84% 39%), hsl(160 84% 50%))'
              : 'linear-gradient(135deg, hsl(160 84% 39%), hsl(160 84% 45%))',
            border: '1px solid hsl(160 84% 39% / 0.4)',
            boxShadow: prefillSide === 'buy' ? '0 0 20px hsl(160 84% 39% / 0.3)' : 'none',
          }}>
          <TrendingUp className="mr-2 h-5 w-5" /> COMPRAR
        </Button>
        <Button onClick={() => { handleOpen('sell'); setPrefillSide(null); }} className="h-14 text-base font-bold rounded-xl text-white"
          style={{
            background: prefillSide === 'sell'
              ? 'linear-gradient(135deg, hsl(0 84% 55%), hsl(0 84% 65%))'
              : 'linear-gradient(135deg, hsl(0 84% 55%), hsl(0 84% 60%))',
            border: '1px solid hsl(0 84% 55% / 0.4)',
            boxShadow: prefillSide === 'sell' ? '0 0 20px hsl(0 84% 55% / 0.3)' : 'none',
          }}>
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
