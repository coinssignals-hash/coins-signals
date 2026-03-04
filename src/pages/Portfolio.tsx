import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, RefreshCw, TrendingUp, TrendingDown, Wallet,
  Clock, AlertCircle, Plus, Radio, ArrowUpRight, ArrowDownRight,
  BarChart3
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { PageTransition } from '@/components/layout/PageTransition';
import { SignalStyleCard } from '@/components/ui/signal-style-card';
import { usePortfolio, Position } from '@/hooks/usePortfolio';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';
import { PortfolioHistoryChart } from '@/components/portfolio/PortfolioHistoryChart';

function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency,
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function Portfolio() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { accounts, summary, loading, error, lastRefresh, isLive, isDemo, refetch, getAllPositions } = usePortfolio();

  const allPositions = getAllPositions();

  const positionStats = useMemo(() => {
    const total = allPositions.length;
    const buys = allPositions.filter(p => p.side === 'long').length;
    const sells = allPositions.filter(p => p.side === 'short').length;
    return { total, buys, sells };
  }, [allPositions]);

  const totalInPositions = useMemo(() =>
    allPositions.reduce((sum, p) => sum + Math.abs(p.market_value), 0),
  [allPositions]);

  const showAuthBanner = !user;

  return (
    <PageTransition>
      <div className="min-h-screen bg-[hsl(225,45%,3%)] flex justify-center">
        <div className="relative w-full max-w-2xl min-h-screen bg-gradient-to-b from-[hsl(222,45%,7%)] via-[hsl(218,52%,8%)] to-[hsl(222,45%,7%)] pb-20 shadow-2xl">
          <Header />

          <main className="px-3 sm:px-4 py-4 space-y-4">
            {/* Auth Banner */}
            {showAuthBanner && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <p className="text-amber-200 text-xs">{t('portfolio_login_banner')}</p>
                </div>
                <button
                  onClick={() => navigate('/auth')}
                  className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded-full text-xs font-medium transition-colors whitespace-nowrap"
                >
                  {t('portfolio_login')}
                </button>
              </div>
            )}

            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-white text-lg font-bold">{t('portfolio_title')}</h1>
                  <p className="text-slate-400 text-xs">{t('portfolio_subtitle')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isDemo && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 rounded-full border border-amber-500/30">
                    <span className="text-amber-400 text-[10px] font-medium">DEMO</span>
                  </div>
                )}
                {isLive && !isDemo && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 rounded-full border border-emerald-500/30">
                    <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                    <span className="text-emerald-400 text-[10px] font-medium">LIVE</span>
                  </div>
                )}
                {lastRefresh && (
                  <span className="text-slate-500 text-[10px] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(lastRefresh)}
                  </span>
                )}
                <button onClick={refetch} disabled={loading} className="p-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50">
                  <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> {error}
                </p>
              </div>
            )}

            {/* Summary Cards Row */}
            <div className="grid grid-cols-5 gap-3">
              {/* Equity Card - 3 cols */}
              <SignalStyleCard className="col-span-3">
                <div className="p-4 space-y-2">
                  {loading ? (
                    <>
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-7 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5">
                        <Wallet className="w-4 h-4 text-cyan-400" />
                        <span className="text-[10px] uppercase tracking-wider text-cyan-300/70 font-medium">Equity Total</span>
                      </div>
                      <p className="text-2xl font-bold text-white tabular-nums">{formatCurrency(summary.total_equity)}</p>
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1 text-slate-400">
                          <BarChart3 className="w-3 h-3" />
                          <span>En posiciones:</span>
                          <span className="text-white font-medium">{formatCurrency(totalInPositions)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        {summary.total_unrealized_pnl >= 0 ? (
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                        )}
                        <span className={cn(
                          "text-sm font-semibold tabular-nums",
                          summary.total_unrealized_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                        )}>
                          {summary.total_unrealized_pnl >= 0 ? '+' : ''}{formatCurrency(summary.total_unrealized_pnl)}
                        </span>
                        <span className={cn(
                          "text-[10px] tabular-nums",
                          summary.total_unrealized_pnl >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'
                        )}>
                          {formatPercent(summary.total_equity > 0 ? (summary.total_unrealized_pnl / summary.total_equity) * 100 : 0)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </SignalStyleCard>

              {/* Positions Summary Card - 2 cols */}
              <SignalStyleCard className="col-span-2">
                <div className="p-4 space-y-3">
                  {loading ? (
                    <>
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-7 w-12" />
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] uppercase tracking-wider text-cyan-300/70 font-medium">Posiciones</span>
                      <p className="text-2xl font-bold text-white">{positionStats.total}</p>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                            <span className="text-[10px] text-emerald-400">Compra</span>
                          </div>
                          <span className="text-xs font-semibold text-emerald-400">{positionStats.buys}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <ArrowDownRight className="w-3 h-3 text-red-400" />
                            <span className="text-[10px] text-red-400">Venta</span>
                          </div>
                          <span className="text-xs font-semibold text-red-400">{positionStats.sells}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </SignalStyleCard>
            </div>

            {/* History Chart */}
            {!loading && accounts.length > 0 && (
              <SignalStyleCard>
                <div className="p-3">
                  <PortfolioHistoryChart />
                </div>
              </SignalStyleCard>
            )}

            {/* No Accounts */}
            {!loading && accounts.length === 0 && (
              <SignalStyleCard>
                <div className="text-center py-10 px-4">
                  <Wallet className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-white font-medium mb-1 text-sm">No hay brokers conectados</h3>
                  <p className="text-slate-400 text-xs mb-4">Conecta tu primer broker para ver tu portfolio</p>
                  <button
                    onClick={() => navigate('/link-broker')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full text-xs font-medium transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Vincular Broker
                  </button>
                </div>
              </SignalStyleCard>
            )}

            {/* Open Positions List */}
            {!loading && allPositions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-white text-sm font-semibold">Posiciones Abiertas</h2>
                  <span className="text-slate-500 text-[10px]">{allPositions.length} activas</span>
                </div>

                <div className="space-y-2">
                  {allPositions.map((pos, i) => (
                    <PositionCard key={`${pos.broker}-${pos.symbol}-${i}`} position={pos} />
                  ))}
                </div>
              </div>
            )}

            {/* Loading skeletons */}
            {loading && (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-cyan-800/20 p-3" style={{ background: 'hsl(205,100%,7%)' }}>
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-9 h-9 rounded-lg" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-20" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-5 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>

          <BottomNav />
        </div>
      </div>
    </PageTransition>
  );
}

/* ── Position Card ─────────────────────────────────── */
function PositionCard({ position }: { position: Position & { broker: string } }) {
  const isPnlPositive = position.unrealized_pnl >= 0;
  const isBuy = position.side === 'long';

  return (
    <SignalStyleCard>
      <div className="p-3">
        {/* Row 1: Symbol + Side + PnL */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded font-bold uppercase",
              isBuy ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
            )}>
              {isBuy ? 'BUY' : 'SELL'}
            </span>
            <span className="text-white font-bold text-sm">{position.symbol}</span>
          </div>
          <div className="text-right">
            <span className={cn(
              "text-sm font-bold tabular-nums",
              isPnlPositive ? 'text-emerald-400' : 'text-red-400'
            )}>
              {isPnlPositive ? '+' : ''}{formatCurrency(position.unrealized_pnl)}
            </span>
          </div>
        </div>

        {/* Row 2: Details grid */}
        <div className="grid grid-cols-5 gap-2">
          <DetailItem label="Valor" value={formatCurrency(position.market_value)} />
          <DetailItem label="Lote" value={position.quantity.toString()} />
          <DetailItem
            label="PnL %"
            value={formatPercent(position.unrealized_pnl_percent)}
            valueColor={isPnlPositive ? 'text-emerald-400' : 'text-red-400'}
          />
          <DetailItem label="Entrada" value={`$${position.average_entry_price.toFixed(position.average_entry_price < 10 ? 4 : 2)}`} />
          <DetailItem
            label={position.commission != null ? 'Comisión' : 'Spread'}
            value={position.commission != null
              ? `$${position.commission.toFixed(2)}`
              : position.spread != null
                ? `${position.spread} pips`
                : '—'
            }
            valueColor="text-amber-400"
          />
        </div>

        {/* Row 3: Broker + Current Price */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-cyan-800/20">
          <span className="text-[10px] text-slate-500">{position.broker}</span>
          <span className="text-[10px] text-slate-400 tabular-nums">
            Actual: <span className="text-white font-medium">${position.current_price.toFixed(position.current_price < 10 ? 4 : 2)}</span>
          </span>
        </div>
      </div>
    </SignalStyleCard>
  );
}

function DetailItem({ label, value, valueColor = 'text-white' }: { label: string; value: string; valueColor?: string }) {
  return (
    <div>
      <p className="text-[9px] text-slate-500 uppercase tracking-wider">{label}</p>
      <p className={cn("text-[11px] font-medium tabular-nums truncate", valueColor)}>{value}</p>
    </div>
  );
}
