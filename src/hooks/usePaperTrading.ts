import { useState, useEffect, useCallback, useRef } from 'react';

export interface PaperPosition {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  entryPrice: number;
  quantity: number;
  lotSize: number;
  leverage: number;
  stopLoss: number | null;
  takeProfit: number | null;
  orderType: 'market' | 'limit';
  openedAt: string; // ISO string
}

export interface PaperTrade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  lotSize: number;
  leverage: number;
  pnl: number;
  openedAt: string; // ISO string - when the position was opened
  closedAt: string; // ISO string - when the position was closed
  closeReason: 'manual' | 'sl' | 'tp';
}

export type InstrumentCategory = 'forex' | 'crypto' | 'stocks' | 'indices' | 'commodities';

export interface Instrument {
  symbol: string;
  name: string;
  category: InstrumentCategory;
  basePrice: number;
  decimals: number;
  pipSize: number;
}

export const INSTRUMENTS: Instrument[] = [
  // Forex
  { symbol: 'EUR/USD', name: 'Euro / Dólar', category: 'forex', basePrice: 1.0842, decimals: 5, pipSize: 0.0001 },
  { symbol: 'GBP/USD', name: 'Libra / Dólar', category: 'forex', basePrice: 1.2715, decimals: 5, pipSize: 0.0001 },
  { symbol: 'USD/JPY', name: 'Dólar / Yen', category: 'forex', basePrice: 149.85, decimals: 3, pipSize: 0.01 },
  { symbol: 'AUD/USD', name: 'Australiano / Dólar', category: 'forex', basePrice: 0.6534, decimals: 5, pipSize: 0.0001 },
  { symbol: 'USD/CAD', name: 'Dólar / Canadiense', category: 'forex', basePrice: 1.3612, decimals: 5, pipSize: 0.0001 },
  { symbol: 'EUR/GBP', name: 'Euro / Libra', category: 'forex', basePrice: 0.8527, decimals: 5, pipSize: 0.0001 },
  { symbol: 'NZD/USD', name: 'Neozelandés / Dólar', category: 'forex', basePrice: 0.6102, decimals: 5, pipSize: 0.0001 },
  { symbol: 'USD/CHF', name: 'Dólar / Franco', category: 'forex', basePrice: 0.8845, decimals: 5, pipSize: 0.0001 },
  { symbol: 'EUR/JPY', name: 'Euro / Yen', category: 'forex', basePrice: 162.45, decimals: 3, pipSize: 0.01 },
  { symbol: 'GBP/JPY', name: 'Libra / Yen', category: 'forex', basePrice: 190.32, decimals: 3, pipSize: 0.01 },
  // Crypto
  { symbol: 'BTC/USD', name: 'Bitcoin', category: 'crypto', basePrice: 67250, decimals: 1, pipSize: 1 },
  { symbol: 'ETH/USD', name: 'Ethereum', category: 'crypto', basePrice: 3520, decimals: 2, pipSize: 0.01 },
  { symbol: 'SOL/USD', name: 'Solana', category: 'crypto', basePrice: 142.5, decimals: 2, pipSize: 0.01 },
  { symbol: 'XRP/USD', name: 'Ripple', category: 'crypto', basePrice: 0.6234, decimals: 4, pipSize: 0.0001 },
  { symbol: 'BNB/USD', name: 'BNB', category: 'crypto', basePrice: 598, decimals: 2, pipSize: 0.01 },
  { symbol: 'ADA/USD', name: 'Cardano', category: 'crypto', basePrice: 0.4523, decimals: 4, pipSize: 0.0001 },
  { symbol: 'DOGE/USD', name: 'Dogecoin', category: 'crypto', basePrice: 0.1245, decimals: 4, pipSize: 0.0001 },
  { symbol: 'AVAX/USD', name: 'Avalanche', category: 'crypto', basePrice: 35.42, decimals: 2, pipSize: 0.01 },
  // Stocks
  { symbol: 'AAPL', name: 'Apple Inc.', category: 'stocks', basePrice: 178.52, decimals: 2, pipSize: 0.01 },
  { symbol: 'MSFT', name: 'Microsoft', category: 'stocks', basePrice: 415.30, decimals: 2, pipSize: 0.01 },
  { symbol: 'GOOGL', name: 'Alphabet', category: 'stocks', basePrice: 155.72, decimals: 2, pipSize: 0.01 },
  { symbol: 'AMZN', name: 'Amazon', category: 'stocks', basePrice: 185.60, decimals: 2, pipSize: 0.01 },
  { symbol: 'TSLA', name: 'Tesla', category: 'stocks', basePrice: 248.42, decimals: 2, pipSize: 0.01 },
  { symbol: 'NVDA', name: 'NVIDIA', category: 'stocks', basePrice: 875.35, decimals: 2, pipSize: 0.01 },
  { symbol: 'META', name: 'Meta Platforms', category: 'stocks', basePrice: 505.75, decimals: 2, pipSize: 0.01 },
  // Indices
  { symbol: 'US500', name: 'S&P 500', category: 'indices', basePrice: 5320.5, decimals: 1, pipSize: 0.1 },
  { symbol: 'US100', name: 'Nasdaq 100', category: 'indices', basePrice: 18650.2, decimals: 1, pipSize: 0.1 },
  { symbol: 'US30', name: 'Dow Jones 30', category: 'indices', basePrice: 39450.8, decimals: 1, pipSize: 0.1 },
  { symbol: 'GER40', name: 'DAX 40', category: 'indices', basePrice: 18350.5, decimals: 1, pipSize: 0.1 },
  { symbol: 'UK100', name: 'FTSE 100', category: 'indices', basePrice: 8275.3, decimals: 1, pipSize: 0.1 },
  // Commodities
  { symbol: 'XAU/USD', name: 'Oro', category: 'commodities', basePrice: 2345.80, decimals: 2, pipSize: 0.01 },
  { symbol: 'XAG/USD', name: 'Plata', category: 'commodities', basePrice: 27.85, decimals: 2, pipSize: 0.01 },
  { symbol: 'WTI', name: 'Petróleo WTI', category: 'commodities', basePrice: 78.42, decimals: 2, pipSize: 0.01 },
  { symbol: 'BRENT', name: 'Petróleo Brent', category: 'commodities', basePrice: 82.15, decimals: 2, pipSize: 0.01 },
  { symbol: 'NATGAS', name: 'Gas Natural', category: 'commodities', basePrice: 2.245, decimals: 3, pipSize: 0.001 },
];

export const CATEGORY_LABELS: Record<InstrumentCategory, string> = {
  forex: 'Forex',
  crypto: 'Criptomonedas',
  stocks: 'Acciones',
  indices: 'Índices',
  commodities: 'Materias Primas',
};

export const CATEGORY_ICONS: Record<InstrumentCategory, string> = {
  forex: '💱',
  crypto: '₿',
  stocks: '📈',
  indices: '📊',
  commodities: '🛢️',
};

const INITIAL_BALANCE = 10000;
const STORAGE_KEY = 'paper-trading-state-v3';

interface PersistedState {
  balance: number;
  positions: PaperPosition[];
  history: PaperTrade[];
  lastPrices?: Record<string, number>;
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    // Migrate from v2
    const v2 = localStorage.getItem('paper-trading-state-v2');
    if (v2) {
      const parsed = JSON.parse(v2);
      localStorage.removeItem('paper-trading-state-v2');
      return parsed;
    }
  } catch { /* ignore */ }
  return { balance: INITIAL_BALANCE, positions: [], history: [] };
}

function saveState(state: PersistedState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

function getInstrument(symbol: string): Instrument {
  return INSTRUMENTS.find(i => i.symbol === symbol) || INSTRUMENTS[0];
}

export function usePaperTrading() {
  const saved = useRef(loadState());
  const [balance, setBalance] = useState(saved.current.balance);
  const [positions, setPositions] = useState<PaperPosition[]>(saved.current.positions);
  const [history, setHistory] = useState<PaperTrade[]>(saved.current.history);
  const tickCount = useRef(0);
  const [prices, setPrices] = useState<Record<string, number>>(() => {
    // Use last saved prices as starting point to avoid SL/TP triggers on reload
    const p: Record<string, number> = {};
    const savedPrices = saved.current.lastPrices;
    INSTRUMENTS.forEach(i => {
      p[i.symbol] = savedPrices?.[i.symbol] ?? i.basePrice;
    });
    return p;
  });

  // Simulate price ticks every 2s
  useEffect(() => {
    const iv = setInterval(() => {
      setPrices(prev => {
        const next = { ...prev };
        for (const inst of INSTRUMENTS) {
          const base = prev[inst.symbol];
          const volatilityPct = inst.category === 'crypto' ? 0.002
            : inst.category === 'stocks' ? 0.001
            : inst.category === 'indices' ? 0.0005
            : inst.category === 'commodities' ? 0.001
            : inst.symbol.includes('JPY') ? 0.0003 : 0.0002;
          const change = base * volatilityPct * (Math.random() - 0.5);
          next[inst.symbol] = +(base + change).toFixed(inst.decimals);
        }
        return next;
      });
      tickCount.current++;
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  // Auto SL/TP check - skip first 2 ticks after reload to let prices stabilize
  useEffect(() => {
    if (tickCount.current < 2) return;
    setPositions(prev => {
      let changed = false;
      const remaining: PaperPosition[] = [];
      for (const pos of prev) {
        const price = prices[pos.symbol];
        if (!price) { remaining.push(pos); continue; }
        let triggered: 'sl' | 'tp' | null = null;
        if (pos.side === 'buy') {
          if (pos.stopLoss && price <= pos.stopLoss) triggered = 'sl';
          else if (pos.takeProfit && price >= pos.takeProfit) triggered = 'tp';
        } else {
          if (pos.stopLoss && price >= pos.stopLoss) triggered = 'sl';
          else if (pos.takeProfit && price <= pos.takeProfit) triggered = 'tp';
        }
        if (triggered) {
          changed = true;
          const inst = getInstrument(pos.symbol);
          const diff = pos.side === 'buy' ? price - pos.entryPrice : pos.entryPrice - price;
          const pnl = diff * pos.quantity * pos.leverage / inst.pipSize * inst.pipSize;
          const margin = (pos.entryPrice * pos.quantity) / pos.leverage;
          setBalance(b => b + margin + (diff * pos.quantity));
          setHistory(h => [{
            id: pos.id, symbol: pos.symbol, side: pos.side,
            entryPrice: pos.entryPrice, exitPrice: price, quantity: pos.quantity,
            lotSize: pos.lotSize, leverage: pos.leverage,
            pnl: diff * pos.quantity, closedAt: new Date().toLocaleTimeString(),
            closeReason: triggered!,
          }, ...h]);
        } else {
          remaining.push(pos);
        }
      }
      return changed ? remaining : prev;
    });
  }, [prices]);

  // Persist on change (including prices for reload stability)
  useEffect(() => {
    saveState({ balance, positions, history, lastPrices: prices });
  }, [balance, positions, history, prices]);

  const openPosition = useCallback((
    symbol: string, side: 'buy' | 'sell', qty: number,
    opts: { lotSize: number; leverage: number; stopLoss: number | null; takeProfit: number | null; orderType: 'market' | 'limit' }
  ) => {
    const price = prices[symbol];
    const margin = (price * qty) / opts.leverage;
    if (margin > balance) return false;
    const pos: PaperPosition = {
      id: crypto.randomUUID(),
      symbol, side,
      entryPrice: price,
      quantity: qty,
      lotSize: opts.lotSize,
      leverage: opts.leverage,
      stopLoss: opts.stopLoss,
      takeProfit: opts.takeProfit,
      orderType: opts.orderType,
      openedAt: new Date().toLocaleString(),
    };
    setPositions(prev => [...prev, pos]);
    setBalance(prev => prev - margin);
    return pos;
  }, [balance, prices]);

  const closePosition = useCallback((posId: string) => {
    setPositions(prev => {
      const pos = prev.find(p => p.id === posId);
      if (!pos) return prev;
      const exitPrice = prices[pos.symbol];
      const diff = pos.side === 'buy' ? exitPrice - pos.entryPrice : pos.entryPrice - exitPrice;
      const margin = (pos.entryPrice * pos.quantity) / pos.leverage;
      setBalance(b => b + margin + (diff * pos.quantity));
      setHistory(h => [{
        id: pos.id, symbol: pos.symbol, side: pos.side,
        entryPrice: pos.entryPrice, exitPrice, quantity: pos.quantity,
        lotSize: pos.lotSize, leverage: pos.leverage,
        pnl: diff * pos.quantity, closedAt: new Date().toLocaleTimeString(),
        closeReason: 'manual',
      }, ...h]);
      return prev.filter(p => p.id !== posId);
    });
  }, [prices]);

  const resetAccount = useCallback(() => {
    setBalance(INITIAL_BALANCE);
    setPositions([]);
    setHistory([]);
  }, []);

  const getPositionPnl = useCallback((pos: PaperPosition) => {
    const current = prices[pos.symbol] ?? pos.entryPrice;
    const diff = pos.side === 'buy' ? current - pos.entryPrice : pos.entryPrice - current;
    return diff * pos.quantity;
  }, [prices]);

  const totalPnl = history.reduce((s, t) => s + t.pnl, 0);
  const winRate = history.length > 0 ? (history.filter(t => t.pnl > 0).length / history.length * 100) : 0;

  return {
    balance, positions, history, prices, totalPnl, winRate,
    instruments: INSTRUMENTS,
    openPosition, closePosition, resetAccount, getPositionPnl,
  };
}
