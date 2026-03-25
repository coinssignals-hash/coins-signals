import { useState } from 'react';
import { GlowSection } from '@/components/ui/glow-section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, RotateCcw, Shield, Target, Zap } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { InstrumentSelector } from './InstrumentSelector';
import { INSTRUMENTS, type Instrument } from '@/hooks/usePaperTrading';

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
}

export function PaperTradePanel({ instruments, prices, onOpen, onReset, balance }: Props) {
  const [selectedSymbol, setSelectedSymbol] = useState(instruments[0]?.symbol ?? 'EUR/USD');
  const [lotSize, setLotSize] = useState('0.01');
  const [leverage, setLeverage] = useState(100);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [slEnabled, setSlEnabled] = useState(false);
  const [tpEnabled, setTpEnabled] = useState(false);
  const [slPips, setSlPips] = useState('50');
  const [tpPips, setTpPips] = useState('100');

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
          <div className="flex flex-wrap gap-1">
            {LEVERAGE_OPTIONS.map(lev => (
              <button key={lev} onClick={() => setLeverage(lev)}
                className="px-2 py-1 rounded text-[10px] font-bold transition-all"
                style={leverage === lev ? {
                  background: `hsl(${ACCENT} / 0.2)`,
                  color: `hsl(${ACCENT})`,
                  border: `1px solid hsl(${ACCENT} / 0.4)`,
                } : {
                  background: 'hsl(var(--muted) / 0.3)',
                  color: 'hsl(var(--muted-foreground))',
                  border: '1px solid transparent',
                }}>
                x{lev}
              </button>
            ))}
          </div>
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

      {/* Buy / Sell buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={() => handleOpen('buy')} className="h-14 text-base font-bold rounded-xl text-white"
          style={{ background: 'linear-gradient(135deg, hsl(160 84% 39%), hsl(160 84% 45%))', border: '1px solid hsl(160 84% 39% / 0.4)' }}>
          <TrendingUp className="mr-2 h-5 w-5" /> COMPRAR
        </Button>
        <Button onClick={() => handleOpen('sell')} className="h-14 text-base font-bold rounded-xl text-white"
          style={{ background: 'linear-gradient(135deg, hsl(0 84% 55%), hsl(0 84% 60%))', border: '1px solid hsl(0 84% 55% / 0.4)' }}>
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
