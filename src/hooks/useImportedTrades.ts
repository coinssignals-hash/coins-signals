import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { ParsedTrade } from '@/lib/csv-parsers';
import { toast } from 'sonner';

export interface ImportedTrade {
  id: string;
  user_id: string;
  broker_source: string;
  symbol: string;
  side: string;
  quantity: number;
  entry_price: number;
  exit_price: number | null;
  entry_time: string;
  exit_time: string | null;
  commission: number;
  swap: number;
  profit: number;
  net_profit: number;
  status: string;
  notes: string | null;
  import_batch_id: string | null;
  created_at: string;
}

export interface TradeStats {
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  maxDrawdown: number;
  bestTrade: number;
  worstTrade: number;
  totalNetProfit: number;
  totalCommissions: number;
  totalSwaps: number;
  winners: number;
  losers: number;
  breakeven: number;
}

function calculateStats(trades: ImportedTrade[]): TradeStats {
  const closed = trades.filter(t => t.status === 'closed');
  if (closed.length === 0) {
    return {
      totalTrades: 0, winRate: 0, profitFactor: 0, avgWin: 0, avgLoss: 0,
      maxDrawdown: 0, bestTrade: 0, worstTrade: 0, totalNetProfit: 0,
      totalCommissions: 0, totalSwaps: 0, winners: 0, losers: 0, breakeven: 0,
    };
  }

  const wins = closed.filter(t => t.net_profit > 0);
  const losses = closed.filter(t => t.net_profit < 0);
  const be = closed.filter(t => t.net_profit === 0);

  const totalGross = wins.reduce((s, t) => s + t.net_profit, 0);
  const totalLoss = Math.abs(losses.reduce((s, t) => s + t.net_profit, 0));

  // Max drawdown calculation (equity curve)
  let peak = 0;
  let maxDD = 0;
  let cumulative = 0;
  const sorted = [...closed].sort((a, b) => new Date(a.exit_time || a.entry_time).getTime() - new Date(b.exit_time || b.entry_time).getTime());
  for (const t of sorted) {
    cumulative += t.net_profit;
    if (cumulative > peak) peak = cumulative;
    const dd = peak - cumulative;
    if (dd > maxDD) maxDD = dd;
  }

  return {
    totalTrades: closed.length,
    winRate: (wins.length / closed.length) * 100,
    profitFactor: totalLoss > 0 ? totalGross / totalLoss : totalGross > 0 ? Infinity : 0,
    avgWin: wins.length > 0 ? totalGross / wins.length : 0,
    avgLoss: losses.length > 0 ? totalLoss / losses.length : 0,
    maxDrawdown: maxDD,
    bestTrade: closed.length > 0 ? Math.max(...closed.map(t => t.net_profit)) : 0,
    worstTrade: closed.length > 0 ? Math.min(...closed.map(t => t.net_profit)) : 0,
    totalNetProfit: closed.reduce((s, t) => s + t.net_profit, 0),
    totalCommissions: closed.reduce((s, t) => s + (t.commission || 0), 0),
    totalSwaps: closed.reduce((s, t) => s + (t.swap || 0), 0),
    winners: wins.length,
    losers: losses.length,
    breakeven: be.length,
  };
}

export function useImportedTrades() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<ImportedTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  const fetchTrades = useCallback(async () => {
    if (!user) { setTrades([]); setLoading(false); return; }
    try {
      // Use type assertion since the table was just created and types aren't regenerated yet
      const { data, error } = await supabase
        .from('imported_trades')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_time', { ascending: false });

      if (error) throw error;
      setTrades(data || []);
    } catch (err) {
      console.error('Error fetching imported trades:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchTrades(); }, [fetchTrades]);

  const importTrades = useCallback(async (
    parsedTrades: ParsedTrade[],
    brokerSource: string,
  ): Promise<{ imported: number; duplicates: number; errors: number }> => {
    if (!user) {
      toast.error('Debes iniciar sesión para importar');
      return { imported: 0, duplicates: 0, errors: 0 };
    }

    setImporting(true);
    const batchId = `import_${Date.now()}`;
    let imported = 0;
    let duplicates = 0;
    let errors = 0;

    // Process in chunks of 50
    const chunks = [];
    for (let i = 0; i < parsedTrades.length; i += 50) {
      chunks.push(parsedTrades.slice(i, i + 50));
    }

    for (const chunk of chunks) {
      const rows = chunk.map(t => ({
        user_id: user.id,
        broker_source: brokerSource,
        external_trade_id: t.external_trade_id,
        symbol: t.symbol,
        side: t.side,
        quantity: t.quantity,
        entry_price: t.entry_price,
        exit_price: t.exit_price,
        entry_time: t.entry_time,
        exit_time: t.exit_time,
        commission: t.commission,
        swap: t.swap,
        profit: t.profit,
        status: t.status,
        notes: t.notes || null,
        import_batch_id: batchId,
      }));

      const { data, error } = await supabase
        .from('imported_trades')
        .upsert(rows, { onConflict: 'user_id,broker_source,external_trade_id', ignoreDuplicates: true })
        .select('id');

      if (error) {
        console.error('Import chunk error:', error);
        errors += chunk.length;
      } else {
        imported += (data?.length || 0);
        duplicates += chunk.length - (data?.length || 0);
      }
    }

    await fetchTrades();
    setImporting(false);

    if (imported > 0) toast.success(`${imported} operaciones importadas`);
    if (duplicates > 0) toast.info(`${duplicates} duplicados omitidos`);
    if (errors > 0) toast.error(`${errors} errores`);

    return { imported, duplicates, errors };
  }, [user, fetchTrades]);

  const deleteBatch = useCallback(async (batchId: string) => {
    if (!user) return;
    await (supabase as any)
      .from('imported_trades')
      .delete()
      .eq('user_id', user.id)
      .eq('import_batch_id', batchId);
    await fetchTrades();
    toast.success('Lote eliminado');
  }, [user, fetchTrades]);

  const deleteAllTrades = useCallback(async () => {
    if (!user) return;
    await (supabase as any)
      .from('imported_trades')
      .delete()
      .eq('user_id', user.id);
    setTrades([]);
    toast.success('Todas las operaciones eliminadas');
  }, [user]);

  const stats = useMemo(() => calculateStats(trades), [trades]);

  return {
    trades,
    stats,
    loading,
    importing,
    importTrades,
    deleteBatch,
    deleteAllTrades,
    refetch: fetchTrades,
  };
}
