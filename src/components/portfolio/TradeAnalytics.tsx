import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Target, BarChart3, Activity,
  Calendar, ArrowUpRight, ArrowDownRight, Filter, Trash2,
  FileSpreadsheet, ChevronDown, Trophy, Skull,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ImportedTrade, TradeStats } from '@/hooks/useImportedTrades';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  trades: ImportedTrade[];
  stats: TradeStats;
  onImportClick: () => void;
  onDeleteAll: () => void;
}

function formatCurrency(v: number) {
  const sign = v >= 0 ? '+' : '';
  return `${sign}$${Math.abs(v).toFixed(2)}`;
}

export function TradeAnalytics({ trades, stats, onImportClick, onDeleteAll }: Props) {
  const [filterBroker, setFilterBroker] = useState<string>('all');
  const [filterResult, setFilterResult] = useState<'all' | 'win' | 'loss'>('all');
  const [filterSymbol, setFilterSymbol] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const brokers = useMemo(() => [...new Set(trades.map(t => t.broker_source))], [trades]);
  const symbols = useMemo(() => [...new Set(trades.map(t => t.symbol))].sort(), [trades]);

  const filtered = useMemo(() => {
    let result = trades;
    if (filterBroker !== 'all') result = result.filter(t => t.broker_source === filterBroker);
    if (filterSymbol !== 'all') result = result.filter(t => t.symbol === filterSymbol);
    if (filterResult === 'win') result = result.filter(t => t.net_profit > 0);
    if (filterResult === 'loss') result = result.filter(t => t.net_profit < 0);
    return result;
  }, [trades, filterBroker, filterResult, filterSymbol]);

  // Equity curve data
  const equityCurve = useMemo(() => {
    const sorted = [...trades]
      .filter(t => t.status === 'closed')
      .sort((a, b) => new Date(a.exit_time || a.entry_time).getTime() - new Date(b.exit_time || b.entry_time).getTime());
    let cumulative = 0;
    return sorted.map(t => {
      cumulative += t.net_profit;
      return {
        date: format(new Date(t.exit_time || t.entry_time), 'dd/MM', { locale: es }),
        equity: +cumulative.toFixed(2),
        profit: t.net_profit,
      };
    });
  }, [trades]);

  if (trades.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="text-center py-10 px-4">
          <FileSpreadsheet className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-foreground font-medium mb-1 text-sm">Sin operaciones importadas</h3>
          <p className="text-muted-foreground text-xs mb-4">Importa tu historial CSV o sincroniza un broker</p>
          <Button onClick={onImportClick} size="sm">
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Importar CSV
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard
          icon={<Target className="w-4 h-4 text-primary" />}
          label="Win Rate"
          value={`${stats.winRate.toFixed(1)}%`}
          sub={`${stats.winners}W / ${stats.losers}L`}
          color="text-primary"
        />
        <StatCard
          icon={<BarChart3 className="w-4 h-4 text-emerald-400" />}
          label="Profit Factor"
          value={stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}
          sub={formatCurrency(stats.totalNetProfit)}
          color={stats.totalNetProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}
        />
        <StatCard
          icon={<Trophy className="w-4 h-4 text-amber-400" />}
          label="Avg Win / Loss"
          value={`$${stats.avgWin.toFixed(2)}`}
          sub={`Pérd: $${stats.avgLoss.toFixed(2)}`}
          color="text-amber-400"
        />
        <StatCard
          icon={<Skull className="w-4 h-4 text-red-400" />}
          label="Max Drawdown"
          value={`$${stats.maxDrawdown.toFixed(2)}`}
          sub={`Mejor: ${formatCurrency(stats.bestTrade)}`}
          color="text-red-400"
        />
      </div>

      {/* Equity Curve */}
      {equityCurve.length > 1 && (
        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Curva de Equity</span>
            <div className="h-40 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equityCurve}>
                  <defs>
                    <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={45} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Area type="monotone" dataKey="equity" stroke="hsl(var(--primary))" fill="url(#equityGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-primary">
          Historial de operaciones
          <span className="text-muted-foreground font-normal ml-2 text-[10px]">{filtered.length} trades</span>
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)} className="text-xs h-7">
            <Filter className="w-3 h-3 mr-1" /> Filtros
          </Button>
          <Button variant="ghost" size="sm" onClick={onImportClick} className="text-xs h-7">
            <FileSpreadsheet className="w-3 h-3 mr-1" /> Importar
          </Button>
        </div>
      </div>

      {showFilters && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="flex flex-wrap gap-1.5">
          {/* Result filter */}
          {(['all', 'win', 'loss'] as const).map(v => (
            <button
              key={v}
              onClick={() => setFilterResult(v)}
              className={cn(
                "text-[10px] px-2.5 py-1 rounded-full border transition-colors",
                filterResult === v ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
              )}
            >
              {v === 'all' ? 'Todos' : v === 'win' ? '✅ Win' : '❌ Loss'}
            </button>
          ))}
          {/* Broker filter */}
          {brokers.length > 1 && brokers.map(b => (
            <button
              key={b}
              onClick={() => setFilterBroker(filterBroker === b ? 'all' : b)}
              className={cn(
                "text-[10px] px-2.5 py-1 rounded-full border transition-colors",
                filterBroker === b ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
              )}
            >
              {b}
            </button>
          ))}
          {/* Symbol filter (show top 6) */}
          {symbols.slice(0, 6).map(s => (
            <button
              key={s}
              onClick={() => setFilterSymbol(filterSymbol === s ? 'all' : s)}
              className={cn(
                "text-[10px] px-2.5 py-1 rounded-full border transition-colors",
                filterSymbol === s ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
              )}
            >
              {s}
            </button>
          ))}
        </motion.div>
      )}

      {/* Trades list */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {filtered.slice(0, 50).map((trade, i) => (
            <TradeRow key={trade.id} trade={trade} isLast={i === Math.min(filtered.length, 50) - 1} />
          ))}
          {filtered.length > 50 && (
            <p className="text-center text-[10px] text-muted-foreground py-3">
              +{filtered.length - 50} operaciones más
            </p>
          )}
        </CardContent>
      </Card>

      {/* Delete all */}
      <Button variant="ghost" onClick={onDeleteAll} className="w-full text-xs text-destructive hover:text-destructive">
        <Trash2 className="w-3 h-3 mr-1" /> Eliminar todas las operaciones
      </Button>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string }) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-3 space-y-1">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
        </div>
        <p className={cn("text-lg font-bold tabular-nums", color)}>{value}</p>
        <p className="text-[10px] text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}

function TradeRow({ trade, isLast }: { trade: ImportedTrade; isLast: boolean }) {
  const isBuy = trade.side === 'buy';
  const isPnlPositive = trade.net_profit >= 0;

  return (
    <div className={cn("p-3 transition-colors hover:bg-secondary/50", !isLast && "border-b border-border")}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            isBuy ? "bg-emerald-500/15" : "bg-red-500/15"
          )}>
            {isBuy ? <ArrowUpRight className="w-4 h-4 text-emerald-400" /> : <ArrowDownRight className="w-4 h-4 text-red-400" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-foreground font-medium">{trade.symbol}</span>
              <span className={cn(
                "text-[8px] px-1 py-0.5 rounded font-bold uppercase",
                isBuy ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
              )}>
                {trade.side}
              </span>
              {trade.status === 'open' && (
                <span className="text-[8px] px-1 py-0.5 rounded bg-amber-500/15 text-amber-400 font-bold uppercase">
                  OPEN
                </span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {format(new Date(trade.entry_time), "dd MMM yyyy HH:mm", { locale: es })}
              {trade.broker_source !== 'generic' && ` · ${trade.broker_source}`}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className={cn("text-sm font-bold tabular-nums", isPnlPositive ? 'text-emerald-400' : 'text-red-400')}>
            {isPnlPositive ? '+' : ''}${trade.net_profit.toFixed(2)}
          </span>
          <div className="flex items-center gap-2 justify-end">
            <span className="text-[9px] text-muted-foreground tabular-nums">
              {trade.entry_price.toFixed(trade.entry_price < 10 ? 4 : 2)}
              {trade.exit_price ? ` → ${trade.exit_price.toFixed(trade.exit_price < 10 ? 4 : 2)}` : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
