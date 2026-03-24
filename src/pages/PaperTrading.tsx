import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { useTranslation } from '@/i18n/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, TrendingDown, RotateCcw, Wallet, BarChart3, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Position {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  entryPrice: number;
  quantity: number;
  openedAt: string;
  currentPrice: number;
}

interface TradeHistory {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  closedAt: string;
}

const PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'EUR/GBP', 'NZD/USD', 'USD/CHF'];

const MOCK_PRICES: Record<string, number> = {
  'EUR/USD': 1.0842, 'GBP/USD': 1.2715, 'USD/JPY': 149.85,
  'AUD/USD': 0.6534, 'USD/CAD': 1.3612, 'EUR/GBP': 0.8527,
  'NZD/USD': 0.6102, 'USD/CHF': 0.8845,
};

const INITIAL_BALANCE = 10000;

export default function PaperTrading() {
  const { t } = useTranslation();
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [positions, setPositions] = useState<Position[]>([]);
  const [history, setHistory] = useState<TradeHistory[]>([]);
  const [selectedPair, setSelectedPair] = useState('EUR/USD');
  const [quantity, setQuantity] = useState('1000');
  const [tab, setTab] = useState<'trade' | 'positions' | 'history'>('trade');

  const currentPrice = MOCK_PRICES[selectedPair] + (Math.random() - 0.5) * 0.002;

  const openPosition = useCallback((side: 'buy' | 'sell') => {
    const qty = parseInt(quantity) || 1000;
    const cost = qty * 0.01;
    if (cost > balance) {
      toast({ title: 'Saldo insuficiente', variant: 'destructive' });
      return;
    }
    const pos: Position = {
      id: crypto.randomUUID(),
      symbol: selectedPair,
      side,
      entryPrice: currentPrice,
      quantity: qty,
      openedAt: new Date().toLocaleTimeString(),
      currentPrice,
    };
    setPositions(prev => [...prev, pos]);
    setBalance(prev => prev - cost);
    toast({ title: `${side === 'buy' ? '🟢 Compra' : '🔴 Venta'} abierta`, description: `${selectedPair} x${qty} @ ${currentPrice.toFixed(5)}` });
  }, [selectedPair, quantity, currentPrice, balance]);

  const closePosition = useCallback((pos: Position) => {
    const exit = MOCK_PRICES[pos.symbol] + (Math.random() - 0.5) * 0.003;
    const pipDiff = pos.side === 'buy' ? exit - pos.entryPrice : pos.entryPrice - exit;
    const pnl = pipDiff * pos.quantity;
    setPositions(prev => prev.filter(p => p.id !== pos.id));
    setBalance(prev => prev + (pos.quantity * 0.01) + pnl);
    setHistory(prev => [{ id: pos.id, symbol: pos.symbol, side: pos.side, entryPrice: pos.entryPrice, exitPrice: exit, quantity: pos.quantity, pnl, closedAt: new Date().toLocaleTimeString() }, ...prev]);
    toast({ title: pnl >= 0 ? '✅ Trade ganador' : '❌ Trade perdedor', description: `P&L: $${pnl.toFixed(2)}` });
  }, []);

  const resetAccount = () => {
    setBalance(INITIAL_BALANCE);
    setPositions([]);
    setHistory([]);
    toast({ title: 'Cuenta reseteada', description: 'Balance restaurado a $10,000' });
  };

  const totalPnl = history.reduce((sum, t) => sum + t.pnl, 0);
  const winRate = history.length > 0 ? (history.filter(t => t.pnl > 0).length / history.length * 100) : 0;

  return (
    <PageShell>
      <div className="space-y-4 pb-24 px-4 pt-4">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate('/tools')} className="text-muted-foreground"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-lg font-bold text-foreground">{t('paper_trading_title') || 'Paper Trading'}</h1>
        </div>
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="p-3 bg-card border-border text-center">
            <Wallet className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-[10px] text-muted-foreground">Balance</p>
            <p className="text-sm font-bold text-foreground">${balance.toFixed(2)}</p>
          </Card>
          <Card className="p-3 bg-card border-border text-center">
            <BarChart3 className="h-4 w-4 mx-auto mb-1 text-accent" />
            <p className="text-[10px] text-muted-foreground">P&L Total</p>
            <p className={`text-sm font-bold ${totalPnl >= 0 ? 'text-[hsl(var(--bullish))]' : 'text-[hsl(var(--bearish))]'}`}>${totalPnl.toFixed(2)}</p>
          </Card>
          <Card className="p-3 bg-card border-border text-center">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-[hsl(var(--bullish))]" />
            <p className="text-[10px] text-muted-foreground">Win Rate</p>
            <p className="text-sm font-bold text-foreground">{winRate.toFixed(0)}%</p>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-secondary/50 rounded-lg p-1">
          {(['trade', 'positions', 'history'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
              {t === 'trade' ? 'Operar' : t === 'positions' ? `Posiciones (${positions.length})` : `Historial (${history.length})`}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'trade' && (
            <motion.div key="trade" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Pair Selection */}
              <div className="flex flex-wrap gap-2">
                {PAIRS.map(p => (
                  <button key={p} onClick={() => setSelectedPair(p)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${selectedPair === p ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}>
                    {p}
                  </button>
                ))}
              </div>

              {/* Price Display */}
              <Card className="p-4 bg-card border-border text-center">
                <p className="text-xs text-muted-foreground mb-1">{selectedPair}</p>
                <p className="text-3xl font-mono font-bold text-foreground">{currentPrice.toFixed(5)}</p>
                <p className="text-xs text-muted-foreground mt-1">Precio simulado</p>
              </Card>

              {/* Quantity */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Unidades:</span>
                <Input type="number" value={quantity} onChange={e => setQuantity(e.target.value)}
                  className="text-sm bg-input border-border" />
              </div>

              {/* Buy/Sell Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={() => openPosition('buy')} className="h-14 text-base font-bold bg-[hsl(var(--bullish))] hover:bg-[hsl(var(--bullish))]/90 text-white">
                  <TrendingUp className="mr-2 h-5 w-5" /> COMPRAR
                </Button>
                <Button onClick={() => openPosition('sell')} className="h-14 text-base font-bold bg-[hsl(var(--bearish))] hover:bg-[hsl(var(--bearish))]/90 text-white">
                  <TrendingDown className="mr-2 h-5 w-5" /> VENDER
                </Button>
              </div>

              <Button variant="outline" onClick={resetAccount} className="w-full border-border text-muted-foreground">
                <RotateCcw className="mr-2 h-4 w-4" /> Resetear Cuenta
              </Button>
            </motion.div>
          )}

          {tab === 'positions' && (
            <motion.div key="positions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
              {positions.length === 0 ? (
                <Card className="p-8 bg-card border-border text-center">
                  <p className="text-muted-foreground text-sm">No tienes posiciones abiertas</p>
                </Card>
              ) : positions.map(pos => {
                const exit = MOCK_PRICES[pos.symbol] + (Math.random() - 0.5) * 0.001;
                const pnl = (pos.side === 'buy' ? exit - pos.entryPrice : pos.entryPrice - exit) * pos.quantity;
                return (
                  <Card key={pos.id} className="p-3 bg-card border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={pos.side === 'buy' ? 'default' : 'destructive'} className="text-[10px]">
                          {pos.side === 'buy' ? 'LONG' : 'SHORT'}
                        </Badge>
                        <span className="text-sm font-bold text-foreground">{pos.symbol}</span>
                      </div>
                      <span className={`text-xs font-mono ${pnl >= 0 ? 'text-[hsl(var(--bullish))]' : 'text-[hsl(var(--bearish))]'}`}>
                        {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">Entrada: {pos.entryPrice.toFixed(5)} · x{pos.quantity}</span>
                      <Button size="sm" variant="outline" onClick={() => closePosition(pos)} className="h-7 text-[10px] border-border">
                        Cerrar
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </motion.div>
          )}

          {tab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
              {history.length === 0 ? (
                <Card className="p-8 bg-card border-border text-center">
                  <p className="text-muted-foreground text-sm">Aún no has cerrado operaciones</p>
                </Card>
              ) : history.map(trade => (
                <Card key={trade.id} className="p-3 bg-card border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={trade.side === 'buy' ? 'default' : 'destructive'} className="text-[10px]">
                        {trade.side === 'buy' ? 'LONG' : 'SHORT'}
                      </Badge>
                      <span className="text-sm font-medium text-foreground">{trade.symbol}</span>
                    </div>
                    <span className={`text-sm font-bold font-mono ${trade.pnl >= 0 ? 'text-[hsl(var(--bullish))]' : 'text-[hsl(var(--bearish))]'}`}>
                      {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground">{trade.entryPrice.toFixed(5)} → {trade.exitPrice.toFixed(5)}</span>
                    <span className="text-[10px] text-muted-foreground">{trade.closedAt}</span>
                  </div>
                </Card>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageShell>
  );
}
