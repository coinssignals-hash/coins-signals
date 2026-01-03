import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PieChart as PieChartIcon,
  BarChart3,
  Clock,
  AlertCircle,
  Plus,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { usePortfolio, AccountData, Position } from '@/hooks/usePortfolio';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PortfolioHistoryChart } from '@/components/portfolio/PortfolioHistoryChart';

const COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

export default function Portfolio() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { accounts, summary, loading, error, lastRefresh, refetch, getAllPositions } = usePortfolio();
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());

  const toggleAccount = (connectionId: string) => {
    setExpandedAccounts(prev => {
      const next = new Set(prev);
      if (next.has(connectionId)) {
        next.delete(connectionId);
      } else {
        next.add(connectionId);
      }
      return next;
    });
  };

  const allPositions = getAllPositions();

  // Prepare chart data
  const accountsChartData = accounts
    .filter(a => !a.error && a.equity > 0)
    .map(a => ({
      name: a.broker_name,
      value: a.equity,
    }));

  const positionsChartData = allPositions
    .filter(p => p.market_value > 0)
    .slice(0, 6)
    .map(p => ({
      name: p.symbol,
      value: Math.abs(p.market_value),
    }));

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pb-20">
        <Header />
        <main className="container max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-white text-xl font-semibold mb-2">Inicia sesión para ver tu portfolio</h2>
            <p className="text-slate-400 mb-6">Conecta tus brokers y visualiza tu portfolio unificado</p>
            <button
              onClick={() => navigate('/auth')}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full font-semibold transition-colors"
            >
              Iniciar Sesión
            </button>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pb-20">
      <Header />
      
      <main className="container max-w-4xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-white text-xl font-bold">Portfolio</h1>
              <p className="text-slate-400 text-sm">Vista unificada de todos tus brokers</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {lastRefresh && (
              <span className="text-slate-500 text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(lastRefresh)}
              </span>
            )}
            <button
              onClick={refetch}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <SummaryCard
            title="Equity Total"
            value={formatCurrency(summary.total_equity)}
            icon={<Wallet className="w-5 h-5" />}
            loading={loading}
          />
          <SummaryCard
            title="Cash Disponible"
            value={formatCurrency(summary.total_cash)}
            icon={<BarChart3 className="w-5 h-5" />}
            loading={loading}
          />
          <SummaryCard
            title="PnL No Realizado"
            value={formatCurrency(summary.total_unrealized_pnl)}
            icon={summary.total_unrealized_pnl >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            valueColor={summary.total_unrealized_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}
            loading={loading}
          />
          <SummaryCard
            title="Posiciones"
            value={summary.total_positions.toString()}
            icon={<PieChartIcon className="w-5 h-5" />}
            loading={loading}
          />
        </div>

        {/* History Chart */}
        {!loading && accounts.length > 0 && (
          <div className="mb-6">
            <PortfolioHistoryChart />
          </div>
        )}

        {/* Charts Row */}
        {!loading && (accountsChartData.length > 0 || positionsChartData.length > 0) && (
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {accountsChartData.length > 0 && (
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <h3 className="text-white font-medium mb-3">Distribución por Broker</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={accountsChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                      >
                        {accountsChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: '1px solid #334155',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {accountsChartData.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <div 
                        className="w-2.5 h-2.5 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                      />
                      <span className="text-slate-400 text-xs">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {positionsChartData.length > 0 && (
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <h3 className="text-white font-medium mb-3">Distribución por Activo</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={positionsChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                      >
                        {positionsChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: '1px solid #334155',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {positionsChartData.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <div 
                        className="w-2.5 h-2.5 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                      />
                      <span className="text-slate-400 text-xs">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* No Accounts */}
        {!loading && accounts.length === 0 && (
          <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
            <Wallet className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-white font-medium mb-2">No hay brokers conectados</h3>
            <p className="text-slate-400 text-sm mb-4">Conecta tu primer broker para ver tu portfolio</p>
            <button
              onClick={() => navigate('/link-broker')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Vincular Broker
            </button>
          </div>
        )}

        {/* Account Cards */}
        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <Skeleton className="h-6 w-32 mb-3" />
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))
          ) : (
            accounts.map(account => (
              <AccountCard 
                key={account.connection_id}
                account={account}
                isExpanded={expandedAccounts.has(account.connection_id)}
                onToggle={() => toggleAccount(account.connection_id)}
              />
            ))
          )}
        </div>

        {/* All Positions Section */}
        {!loading && allPositions.length > 0 && (
          <section className="mt-8">
            <h2 className="text-white text-lg font-semibold mb-4">Todas las Posiciones</h2>
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">Símbolo</th>
                      <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">Broker</th>
                      <th className="text-right text-slate-400 text-xs font-medium px-4 py-3">Cantidad</th>
                      <th className="text-right text-slate-400 text-xs font-medium px-4 py-3">Entrada</th>
                      <th className="text-right text-slate-400 text-xs font-medium px-4 py-3">Valor</th>
                      <th className="text-right text-slate-400 text-xs font-medium px-4 py-3">PnL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allPositions.map((pos, i) => (
                      <tr key={`${pos.broker}-${pos.symbol}-${i}`} className="border-b border-slate-700/30 last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-xs px-1.5 py-0.5 rounded",
                              pos.side === 'long' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                            )}>
                              {pos.side === 'long' ? 'L' : 'S'}
                            </span>
                            <span className="text-white font-medium">{pos.symbol}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-sm">{pos.broker}</td>
                        <td className="px-4 py-3 text-white text-sm text-right">{pos.quantity}</td>
                        <td className="px-4 py-3 text-slate-300 text-sm text-right">
                          {formatCurrency(pos.average_entry_price)}
                        </td>
                        <td className="px-4 py-3 text-white text-sm text-right">
                          {formatCurrency(pos.market_value)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className={cn(
                            "text-sm font-medium",
                            pos.unrealized_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                          )}>
                            {formatCurrency(pos.unrealized_pnl)}
                          </div>
                          <div className={cn(
                            "text-xs",
                            pos.unrealized_pnl_percent >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'
                          )}>
                            {formatPercent(pos.unrealized_pnl_percent)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  valueColor = 'text-white',
  loading,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  valueColor?: string;
  loading?: boolean;
}) {
  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
      <div className="flex items-center gap-2 text-slate-400 mb-2">
        {icon}
        <span className="text-xs">{title}</span>
      </div>
      {loading ? (
        <Skeleton className="h-7 w-24" />
      ) : (
        <div className={cn("text-lg font-bold", valueColor)}>{value}</div>
      )}
    </div>
  );
}

function AccountCard({
  account,
  isExpanded,
  onToggle,
}: {
  account: AccountData;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const hasError = !!account.error;

  return (
    <div className={cn(
      "bg-slate-800/50 rounded-xl border transition-colors",
      hasError ? "border-red-500/30" : "border-slate-700/50"
    )}>
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center text-lg",
            hasError 
              ? "bg-red-500/20 border border-red-500/30" 
              : "bg-gradient-to-br from-cyan-500/30 to-emerald-500/30 border border-cyan-500/30"
          )}>
            {hasError ? '⚠️' : '🏦'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">{account.broker_name}</span>
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded",
                account.environment === 'live' 
                  ? "bg-amber-500/20 text-amber-400" 
                  : "bg-slate-600/50 text-slate-400"
              )}>
                {account.environment}
              </span>
            </div>
            {hasError ? (
              <span className="text-red-400 text-sm">{account.error}</span>
            ) : (
              <span className="text-slate-400 text-sm">
                {formatCurrency(account.equity, account.currency)} • {account.positions.length} posiciones
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!hasError && (
            <div className="text-right">
              <div className={cn(
                "font-medium",
                account.unrealized_pnl >= 0 ? "text-emerald-400" : "text-red-400"
              )}>
                {account.unrealized_pnl >= 0 ? '+' : ''}{formatCurrency(account.unrealized_pnl)}
              </div>
              <div className="text-slate-500 text-xs">PnL no realizado</div>
            </div>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {isExpanded && !hasError && (
        <div className="px-4 pb-4 space-y-4">
          {/* Account Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatItem label="Cash" value={formatCurrency(account.cash_balance, account.currency)} />
            <StatItem label="Buying Power" value={formatCurrency(account.buying_power, account.currency)} />
            <StatItem label="Margen Usado" value={formatCurrency(account.margin_used, account.currency)} />
            <StatItem 
              label="PnL Hoy" 
              value={formatCurrency(account.realized_pnl_today, account.currency)}
              valueColor={account.realized_pnl_today >= 0 ? 'text-emerald-400' : 'text-red-400'}
            />
          </div>

          {/* Positions */}
          {account.positions.length > 0 && (
            <div>
              <h4 className="text-slate-400 text-xs font-medium mb-2">Posiciones</h4>
              <div className="space-y-2">
                {account.positions.map((pos, i) => (
                  <PositionRow key={`${pos.symbol}-${i}`} position={pos} currency={account.currency} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatItem({ 
  label, 
  value, 
  valueColor = 'text-white' 
}: { 
  label: string; 
  value: string; 
  valueColor?: string;
}) {
  return (
    <div className="bg-slate-900/50 rounded-lg p-3">
      <div className="text-slate-500 text-xs mb-1">{label}</div>
      <div className={cn("text-sm font-medium", valueColor)}>{value}</div>
    </div>
  );
}

function PositionRow({ position, currency }: { position: Position; currency: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
      <div className="flex items-center gap-2">
        <span className={cn(
          "text-xs px-1.5 py-0.5 rounded font-medium",
          position.side === 'long' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
        )}>
          {position.side === 'long' ? 'LONG' : 'SHORT'}
        </span>
        <span className="text-white font-medium">{position.symbol}</span>
        <span className="text-slate-500 text-sm">× {position.quantity}</span>
      </div>
      <div className="text-right">
        <div className={cn(
          "text-sm font-medium",
          position.unrealized_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'
        )}>
          {formatCurrency(position.unrealized_pnl, currency)}
        </div>
        <div className={cn(
          "text-xs",
          position.unrealized_pnl_percent >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'
        )}>
          {formatPercent(position.unrealized_pnl_percent)}
        </div>
      </div>
    </div>
  );
}
