import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, RefreshCw, TrendingUp, TrendingDown, Wallet,
  Clock, AlertCircle, Plus, Radio, ArrowUpRight, ArrowDownRight,
  BarChart3
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { Card, CardContent } from '@/components/ui/card';
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
    <PageShell>
      <Header />

      <main className="container py-6 space-y-5">
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
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{t('portfolio_trading')}</span>
              </div>
              <h1 className="text-xl font-bold text-foreground">{t('portfolio_title')}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isDemo && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-semibold uppercase tracking-wider">
                DEMO
              </span>
            )}
            {isLive && !isDemo && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-semibold uppercase tracking-wider flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse" />
                LIVE
              </span>
            )}
            {lastRefresh && (
              <span className="text-muted-foreground text-[10px] flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(lastRefresh)}
              </span>
            )}
            <button onClick={refetch} disabled={loading} className="p-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl">
            <p className="text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </p>
          </div>
        )}

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-5 gap-3"
        >
          {/* Equity Card - 3 cols */}
          <Card className="col-span-3 bg-card border-border">
            <CardContent className="p-4 space-y-2">
              {loading ? (
                <>
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-7 w-28" />
                  <Skeleton className="h-3 w-20" />
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{t('portfolio_equity')}</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground tabular-nums">{formatCurrency(summary.total_equity)}</p>
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <BarChart3 className="w-3 h-3" />
                      <span>{t('portfolio_in_positions')}</span>
                      <span className="text-foreground font-medium">{formatCurrency(totalInPositions)}</span>
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
            </CardContent>
          </Card>

          {/* Positions Summary Card - 2 cols */}
          <Card className="col-span-2 bg-card border-border">
            <CardContent className="p-4 space-y-3">
              {loading ? (
                <>
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-7 w-12" />
                </>
              ) : (
                <>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{t('portfolio_positions')}</span>
                  <p className="text-2xl font-bold text-foreground">{positionStats.total}</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] text-emerald-400">{t('portfolio_buy')}</span>
                      </div>
                      <span className="text-xs font-semibold text-emerald-400">{positionStats.buys}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <ArrowDownRight className="w-3 h-3 text-red-400" />
                        <span className="text-[10px] text-red-400">{t('portfolio_sell')}</span>
                      </div>
                      <span className="text-xs font-semibold text-red-400">{positionStats.sells}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* History Chart */}
        {!loading && accounts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.08 }}
          >
            <h2 className="text-sm font-semibold text-primary mb-3">{t('portfolio_history')}</h2>
            <Card className="bg-card border-border">
              <CardContent className="p-3">
                <PortfolioHistoryChart />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Distribution Charts */}
        {!loading && accounts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.16 }}
            className="grid grid-cols-2 gap-3"
          >
             <DistributionCard
               title={t('portfolio_by_broker')}
               items={accounts.filter(a => !a.error && a.equity > 0).map(a => ({
                 label: a.broker_name.replace(/\s*\(Demo\)\s*/i, ''),
                 value: a.equity,
               }))}
             />
             <DistributionCard
               title={t('portfolio_by_asset')}
               items={allPositions.filter(p => p.market_value > 0).map(p => ({
                 label: p.symbol,
                 value: Math.abs(p.market_value),
               }))}
             />
          </motion.div>
        )}

        {/* No Accounts */}
        {!loading && accounts.length === 0 && (
          <Card className="bg-card border-border">
            <CardContent className="text-center py-10 px-4">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mx-auto mb-3">
                <Wallet className="w-6 h-6 text-muted-foreground" />
              </div>
               <h3 className="text-foreground font-medium mb-1 text-sm">{t('portfolio_no_brokers')}</h3>
               <p className="text-muted-foreground text-xs mb-4">{t('portfolio_no_brokers_desc')}</p>
               <button
                 onClick={() => navigate('/link-broker')}
                 className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full text-xs font-medium transition-colors"
               >
                 <Plus className="w-3.5 h-3.5" />
                 {t('portfolio_link_broker')}
               </button>
            </CardContent>
          </Card>
        )}

        {/* Open Positions List */}
        {!loading && allPositions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.24 }}
          >
            <h2 className="text-sm font-semibold text-primary mb-3">
              Posiciones Abiertas
              <span className="text-muted-foreground font-normal ml-2 text-[10px]">{allPositions.length} activas</span>
            </h2>
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                {allPositions.map((pos, i) => (
                  <PositionRow
                    key={`${pos.broker}-${pos.symbol}-${i}`}
                    position={pos}
                    isLast={i === allPositions.length - 1}
                  />
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="bg-card border-border">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-9 h-9 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-20" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </PageShell>
  );
}

/* ── Position Row (Tools-style list item) ─────────────────────────────────── */
function PositionRow({ position, isLast }: { position: Position & { broker: string }; isLast: boolean }) {
  const isPnlPositive = position.unrealized_pnl >= 0;
  const isBuy = position.side === 'long';

  return (
    <div className={cn(
      "p-4 transition-colors hover:bg-secondary/50",
      !isLast && "border-b border-border"
    )}>
      {/* Row 1: Symbol + Side + PnL */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            isBuy ? "bg-emerald-500/15" : "bg-red-500/15"
          )}>
            {isBuy ? (
              <ArrowUpRight className="w-5 h-5 text-emerald-400" />
            ) : (
              <ArrowDownRight className="w-5 h-5 text-red-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-foreground font-medium">{position.symbol}</span>
              <span className={cn(
                "text-[9px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider",
                isBuy
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-red-500/15 text-red-400'
              )}>
                {isBuy ? 'BUY' : 'SELL'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{position.broker}</p>
          </div>
        </div>
        <div className="text-right">
          <span className={cn(
            "text-sm font-bold tabular-nums",
            isPnlPositive ? 'text-emerald-400' : 'text-red-400'
          )}>
            {isPnlPositive ? '+' : ''}{formatCurrency(position.unrealized_pnl)}
          </span>
          <p className={cn(
            "text-[10px] tabular-nums",
            isPnlPositive ? 'text-emerald-400/70' : 'text-red-400/70'
          )}>
            {formatPercent(position.unrealized_pnl_percent)}
          </p>
        </div>
      </div>

      {/* Row 2: Details grid */}
      <div className={cn("grid gap-2 mt-2", position.swap != null ? "grid-cols-3" : "grid-cols-5")}>
        <DetailItem label="Valor" value={formatCurrency(position.market_value)} />
        <DetailItem label="Lote" value={position.quantity.toString()} />
        <DetailItem label="Entrada" value={`$${position.average_entry_price.toFixed(position.average_entry_price < 10 ? 4 : 2)}`} />
        <DetailItem
          label="Actual"
          value={`$${position.current_price.toFixed(position.current_price < 10 ? 4 : 2)}`}
          valueColor="text-foreground"
        />
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
        {position.swap != null && (
          <DetailItem
            label="Swap"
            value={`${position.swap >= 0 ? '+' : ''}$${position.swap.toFixed(2)}`}
            valueColor={position.swap >= 0 ? 'text-primary' : 'text-amber-400'}
          />
        )}
      </div>
    </div>
  );
}

function DetailItem({ label, value, valueColor = 'text-foreground' }: { label: string; value: string; valueColor?: string }) {
  return (
    <div>
      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={cn("text-[11px] font-medium tabular-nums truncate", valueColor)}>{value}</p>
    </div>
  );
}

const DIST_COLORS = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444'];

function DistributionCard({ title, items }: { title: string; items: { label: string; value: number }[] }) {
  const total = items.reduce((s, i) => s + i.value, 0);
  if (total === 0) return null;

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-3 space-y-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{title}</span>
        <div className="space-y-2">
          {items.slice(0, 6).map((item, idx) => {
            const pct = (item.value / total) * 100;
            const color = DIST_COLORS[idx % DIST_COLORS.length];
            return (
              <div key={`${item.label}-${idx}`} className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-foreground truncate max-w-[70%]">{item.label}</span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">{pct.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
