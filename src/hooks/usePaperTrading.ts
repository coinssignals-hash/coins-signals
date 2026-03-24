import { useState, useEffect, useCallback, useRef } from 'react';

export interface PaperPosition {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  entryPrice: number;
  quantity: number;
  openedAt: string;
}

export interface PaperTrade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  closedAt: string;
}

const PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'EUR/GBP', 'NZD/USD', 'USD/CHF'] as const;

const BASE_PRICES: Record<string, number> = {
  'EUR/USD': 1.0842, 'GBP/USD': 1.2715, 'USD/JPY': 149.85,
  'AUD/USD': 0.6534, 'USD/CAD': 1.3612, 'EUR/GBP': 0.8527,
  'NZD/USD': 0.6102, 'USD/CHF': 0.8845,
};

const INITIAL_BALANCE = 10000;
const STORAGE_KEY = 'paper-trading-state';

interface PersistedState {
  balance: number;
  positions: PaperPosition[];
  history: PaperTrade[];
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { balance: INITIAL_BALANCE, positions: [], history: [] };
}

function saveState(state: PersistedState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

export function usePaperTrading() {
  const saved = useRef(loadState());
  const [balance, setBalance] = useState(saved.current.balance);
  const [positions, setPositions] = useState<PaperPosition[]>(saved.current.positions);
  const [history, setHistory] = useState<PaperTrade[]>(saved.current.history);
  const [prices, setPrices] = useState<Record<string, number>>(() => ({ ...BASE_PRICES }));

  // Simulate price ticks every 2s
  useEffect(() => {
    const iv = setInterval(() => {
      setPrices(prev => {
        const next = { ...prev };
        for (const pair of PAIRS) {
          const base = prev[pair];
          const volatility = pair.includes('JPY') ? 0.05 : 0.0003;
          next[pair] = +(base + (Math.random() - 0.5) * volatility).toFixed(pair.includes('JPY') ? 3 : 5);
        }
        return next;
      });
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  // Persist on change
  useEffect(() => {
    saveState({ balance, positions, history });
  }, [balance, positions, history]);

  const openPosition = useCallback((symbol: string, side: 'buy' | 'sell', qty: number) => {
    const cost = qty * 0.01;
    if (cost > balance) return false;
    const pos: PaperPosition = {
      id: crypto.randomUUID(),
      symbol,
      side,
      entryPrice: prices[symbol],
      quantity: qty,
      openedAt: new Date().toLocaleTimeString(),
    };
    setPositions(prev => [...prev, pos]);
    setBalance(prev => prev - cost);
    return pos;
  }, [balance, prices]);

  const closePosition = useCallback((posId: string) => {
    setPositions(prev => {
      const pos = prev.find(p => p.id === posId);
      if (!pos) return prev;
      const exitPrice = prices[pos.symbol];
      const pipDiff = pos.side === 'buy' ? exitPrice - pos.entryPrice : pos.entryPrice - exitPrice;
      const pnl = pipDiff * pos.quantity;
      setBalance(b => b + (pos.quantity * 0.01) + pnl);
      setHistory(h => [{
        id: pos.id, symbol: pos.symbol, side: pos.side,
        entryPrice: pos.entryPrice, exitPrice, quantity: pos.quantity,
        pnl, closedAt: new Date().toLocaleTimeString(),
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
    pairs: PAIRS as unknown as string[],
    openPosition, closePosition, resetAccount, getPositionPnl,
  };
}
