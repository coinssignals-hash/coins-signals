import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Wallet, ArrowRight, Activity, AlertCircle, ChevronDown } from 'lucide-react';
import { usePortfolio } from '@/hooks/usePortfolio';
import { usePortfolioHistory } from '@/hooks/usePortfolioHistory';
import { useAuth } from '@/hooks/useAuth';
import { EquitySparkline } from './EquitySparkline';

export function PortfolioWidget() {
  const { session } = useAuth();
  const { summary, loading, error, isLive, accounts, getAllPositions } = usePortfolio();
  const { stats: historyStats, snapshots } = usePortfolioHistory('1W');
  const [isExpanded, setIsExpanded] = useState(false);

  // Get top 3 positions by absolute PnL
  const topPositions = useMemo(() => {
    const positions = getAllPositions();
    return positions
      .sort((a, b) => Math.abs(b.unrealized_pnl) - Math.abs(a.unrealized_pnl))
      .slice(0, 3);
  }, [getAllPositions]);

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  // Si no hay sesión, mostrar invitación a conectar
  if (!session) {
    return (
      <Link to="/link-broker">
        <Card className="bg-gradient-to-br from-[#0a1a0a] to-[#0d1f0d] border-green-900/50 hover:border-green-500/50 transition-all duration-300 cursor-pointer group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Conecta tu Broker</p>
                  <p className="text-xs text-gray-400">Sincroniza tu portfolio</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-green-500 group-hover:translate-x-1 transition-transform" />
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  // Loading state
  if (loading && accounts.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-[#0a1a0a] to-[#0d1f0d] border-green-900/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Si hay error o no hay cuentas conectadas
  if (error || accounts.length === 0) {
    return (
      <Link to="/link-broker">
        <Card className="bg-gradient-to-br from-[#0a1a0a] to-[#0d1f0d] border-green-900/50 hover:border-green-500/50 transition-all duration-300 cursor-pointer group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Sin brokers conectados</p>
                  <p className="text-xs text-gray-400">Toca para vincular</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-green-500 group-hover:translate-x-1 transition-transform" />
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  const isPnlPositive = summary.total_unrealized_pnl >= 0;
  const pnlColor = isPnlPositive ? 'text-green-400' : 'text-red-400';
  const PnlIcon = isPnlPositive ? TrendingUp : TrendingDown;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatCompact = (value: number) => {
    const abs = Math.abs(value);
    if (abs >= 1000) {
      return `${value >= 0 ? '+' : '-'}$${(abs / 1000).toFixed(1)}k`;
    }
    return `${value >= 0 ? '+' : '-'}$${abs.toFixed(0)}`;
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const pnlPercent = summary.total_equity > 0 
    ? (summary.total_unrealized_pnl / summary.total_equity) * 100 
    : 0;

  const hasHistoryData = snapshots.length >= 2;
  const weeklyChangePositive = historyStats.equityChange >= 0;
  const hasPositions = topPositions.length > 0;

  return (
    <Card className="bg-gradient-to-br from-[#0a1a0a] to-[#0d1f0d] border-green-900/50 hover:border-green-500/50 transition-all duration-300 overflow-hidden">
      <CardContent className="p-4">
        <Link to="/portfolio" className="block group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-green-500" />
                </div>
                {isLive && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white">Portfolio</p>
                  {isLive && (
                    <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                      <Activity className="w-2.5 h-2.5" />
                      LIVE
                    </span>
                  )}
                </div>
                <p className="text-lg font-bold text-white">
                  {formatCurrency(summary.total_equity)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Sparkline - desktop only */}
              {hasHistoryData && (
                <div className="hidden sm:block">
                  <EquitySparkline width={80} height={32} />
                </div>
              )}
              
              <div className="text-right">
                <div className={`flex items-center gap-1 ${pnlColor}`}>
                  <PnlIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {formatCurrency(Math.abs(summary.total_unrealized_pnl))}
                  </span>
                </div>
                <p className={`text-xs ${pnlColor}`}>
                  {formatPercent(pnlPercent)}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </Link>

        {/* Sparkline - mobile only */}
        {hasHistoryData && (
          <div className="mt-3 sm:hidden">
            <EquitySparkline width={280} height={28} className="w-full" />
          </div>
        )}

        {/* Top 3 Positions - Desktop: always visible, Mobile: collapsible */}
        {hasPositions && (
          <>
            {/* Desktop - always visible */}
            <div className="hidden sm:block mt-3 pt-3 border-t border-green-900/30 space-y-1.5">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Top Posiciones</p>
              <div className="grid grid-cols-3 gap-2">
                {topPositions.map((pos, idx) => {
                  const isPositive = pos.unrealized_pnl >= 0;
                  return (
                    <div 
                      key={`${pos.symbol}-${idx}`}
                      className={`px-2 py-1.5 rounded-md ${
                        isPositive ? 'bg-green-500/10' : 'bg-red-500/10'
                      }`}
                    >
                      <p className="text-[11px] font-medium text-white truncate">{pos.symbol}</p>
                      <p className={`text-[10px] font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCompact(pos.unrealized_pnl)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile - collapsible */}
            <div className="sm:hidden mt-3 pt-3 border-t border-green-900/30">
              <button
                onClick={handleToggleExpand}
                className="w-full flex items-center justify-between text-[10px] text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors"
              >
                <span>Top Posiciones ({topPositions.length})</span>
                <ChevronDown 
                  className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                />
              </button>
              
              <div 
                className={`grid grid-cols-3 gap-2 overflow-hidden transition-all duration-200 ${
                  isExpanded ? 'mt-2 max-h-40 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                {topPositions.map((pos, idx) => {
                  const isPositive = pos.unrealized_pnl >= 0;
                  return (
                    <div 
                      key={`mobile-${pos.symbol}-${idx}`}
                      className={`px-2 py-1.5 rounded-md ${
                        isPositive ? 'bg-green-500/10' : 'bg-red-500/10'
                      }`}
                    >
                      <p className="text-[11px] font-medium text-white truncate">{pos.symbol}</p>
                      <p className={`text-[10px] font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCompact(pos.unrealized_pnl)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        <div className="mt-3 pt-3 border-t border-green-900/30 flex items-center justify-between text-xs text-gray-400">
          <span>
            {summary.total_positions > 0 
              ? `${summary.total_positions} posición${summary.total_positions !== 1 ? 'es' : ''}`
              : 'Sin posiciones'}
          </span>
          
          {hasHistoryData && (
            <span className={weeklyChangePositive ? 'text-green-400' : 'text-red-400'}>
              7d: {formatPercent(historyStats.equityChangePercent)}
            </span>
          )}
          
          <span>{accounts.length} broker{accounts.length !== 1 ? 's' : ''}</span>
        </div>
      </CardContent>
    </Card>
  );
}
