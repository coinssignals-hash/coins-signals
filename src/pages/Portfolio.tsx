import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GlowCard } from '@/components/ui/glow-card';
import {
  ArrowLeft, RefreshCw, TrendingUp, TrendingDown, Wallet,
  Clock, AlertCircle, Plus, Radio, ArrowUpRight, ArrowDownRight,
  BarChart3, FileSpreadsheet
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { usePortfolio, Position } from '@/hooks/usePortfolio';
import { useImportedTrades } from '@/hooks/useImportedTrades';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';
import { PortfolioHistoryChart } from '@/components/portfolio/PortfolioHistoryChart';
import { TradeAnalytics } from '@/components/portfolio/TradeAnalytics';
import { TradeImportModal } from '@/components/portfolio/TradeImportModal';

/* ─── Theme color for Portfolio (green accent in HSL) ─── */
const ACCENT = '142 70% 45%';

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
  const importedTradesHook = useImportedTrades();
  const [showImportModal, setShowImportModal] = useState(false);

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

      <main className="container py-3 max-w-lg mx-auto px-3 space-y-4">
        {/* Auth Banner */}
        {showAuthBanner && (
          <div className="p-3 rounded-xl flex items-center justify-between gap-3" style={{
            background: 'hsl(45 80% 55% / 0.08)',
            border: '1px solid hsl(45 80% 55% / 0.25)',
          }}>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(45 80% 55%)' }} />
              <p className="text-xs" style={{ color: 'hsl(45 80% 70%)' }}>{t('portfolio_login_banner')}</p>
            </div>
            <button
              onClick={() => navigate('/auth')}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap"
              style={{
                background: 'hsl(45 80% 55% / 0.15)',
                color: 'hsl(45 80% 70%)',
              }}
            >
              {t('portfolio_login')}
            </button>
          </div>
        )}

        {/* Premium Hero Header */}
        <div className="relative overflow-hidden rounded-2xl" style={{
          background: `linear-gradient(165deg, hsl(${ACCENT} / 0.15) 0%, hsl(var(--card)) 50%, hsl(var(--background)) 100%)`,
          border: `1px solid hsl(${ACCENT} / 0.2)`,
        }}>
          <div className="absolute top-0 inset-x-0 h-[2px]" style={{
            background: `linear-gradient(90deg, transparent, hsl(${ACCENT} / 0.7), transparent)`,
          }} />
          <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.07]" style={{
            background: `radial-gradient(circle, hsl(${ACCENT}), transparent 70%)`,
          }} />
          <div className="relative flex items-center gap-3 px-3 py-3">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 backdrop-blur-sm"
              style={{
                background: 'hsl(var(--card) / 0.85)',
                border: '1px solid hsl(var(--border) / 0.6)',
                boxShadow: '0 2px 8px hsl(0 0% 0% / 0.3)',
              }}
            >
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{
              background: `linear-gradient(135deg, hsl(${ACCENT} / 0.2), hsl(${ACCENT} / 0.08))`,
              border: `1px solid hsl(${ACCENT} / 0.3)`,
              boxShadow: `0 0 12px hsl(${ACCENT} / 0.15)`,
            }}>
              <Wallet className="w-5 h-5" style={{ color: `hsl(${ACCENT})` }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t('portfolio_trading')}</p>
              <h1 className="text-base font-bold text-foreground truncate">{t('portfolio_title')}</h1>
            </div>
            <div className="flex items-center gap-1.5">
              {isDemo && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider" style={{
                  background: 'hsl(45 80% 55% / 0.15)',
                  color: 'hsl(45 80% 55%)',
                }}>
                  DEMO
                </span>
              )}
              {isLive && !isDemo && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1" style={{
                  background: `hsl(${ACCENT} / 0.15)`,
                  color: `hsl(${ACCENT})`,
                }}>
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
              <button
                onClick={refetch}
                disabled={loading}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 backdrop-blur-sm disabled:opacity-50"
                style={{
                  background: 'hsl(var(--card) / 0.85)',
                  border: '1px solid hsl(var(--border) / 0.6)',
                  boxShadow: '0 2px 8px hsl(0 0% 0% / 0.3)',
                }}
              >
                <RefreshCw className={cn("w-4 h-4 text-muted-foreground", loading && "animate-spin")} />
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-xl" style={{
            background: 'hsl(0 70% 50% / 0.08)',
            border: '1px solid hsl(0 70% 50% / 0.25)',
          }}>
            <p className="text-xs flex items-center gap-2" style={{ color: 'hsl(0 70% 55%)' }}>
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
          <GlowCard className="col-span-3" color={ACCENT}>
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
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{
                      background: `linear-gradient(135deg, hsl(${ACCENT} / 0.2), hsl(${ACCENT} / 0.08))`,
                      border: `1px solid hsl(${ACCENT} / 0.25)`,
                    }}>
                      <Wallet className="w-4 h-4" style={{ color: `hsl(${ACCENT})` }} />
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
                      <TrendingUp className="w-3.5 h-3.5" style={{ color: 'hsl(142 60% 55%)' }} />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5" style={{ color: 'hsl(0 70% 55%)' }} />
                    )}
                    <span className={cn(
                      "text-sm font-semibold tabular-nums",
                    )} style={{
                      color: summary.total_unrealized_pnl >= 0 ? 'hsl(142 60% 55%)' : 'hsl(0 70% 55%)',
                    }}>
                      {summary.total_unrealized_pnl >= 0 ? '+' : ''}{formatCurrency(summary.total_unrealized_pnl)}
                    </span>
                    <span className="text-[10px] tabular-nums" style={{
                      color: summary.total_unrealized_pnl >= 0 ? 'hsl(142 60% 55% / 0.7)' : 'hsl(0 70% 55% / 0.7)',
                    }}>
                      {formatPercent(summary.total_equity > 0 ? (summary.total_unrealized_pnl / summary.total_equity) * 100 : 0)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </GlowCard>

          {/* Positions Summary Card - 2 cols */}
          <GlowCard className="col-span-2" color="210 70% 55%">
            <div className="p-4 space-y-3">
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
                        <ArrowUpRight className="w-3 h-3" style={{ color: 'hsl(142 60% 55%)' }} />
                        <span className="text-[10px]" style={{ color: 'hsl(142 60% 55%)' }}>{t('portfolio_buy')}</span>
                      </div>
                      <span className="text-xs font-semibold" style={{ color: 'hsl(142 60% 55%)' }}>{positionStats.buys}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <ArrowDownRight className="w-3 h-3" style={{ color: 'hsl(0 70% 55%)' }} />
                        <span className="text-[10px]" style={{ color: 'hsl(0 70% 55%)' }}>{t('portfolio_sell')}</span>
                      </div>
                      <span className="text-xs font-semibold" style={{ color: 'hsl(0 70% 55%)' }}>{positionStats.sells}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </GlowCard>
        </motion.div>

        {/* History Chart */}
        {!loading && accounts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.08 }}
          >
            <SectionTitle icon={<BarChart3 className="w-3.5 h-3.5" style={{ color: `hsl(${ACCENT})` }} />} label={t('portfolio_history')} />
            <GlowCard color={ACCENT}>
              <div className="p-3">
                <PortfolioHistoryChart />
              </div>
            </GlowCard>
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
               color="270 60% 55%"
               items={accounts.filter(a => !a.error && a.equity > 0).map(a => ({
                 label: a.broker_name.replace(/\s*\(Demo\)\s*/i, ''),
                 value: a.equity,
               }))}
             />
             <DistributionCard
               title={t('portfolio_by_asset')}
               color="200 70% 55%"
               items={allPositions.filter(p => p.market_value > 0).map(p => ({
                 label: p.symbol,
                 value: Math.abs(p.market_value),
               }))}
             />
          </motion.div>
        )}

        {/* No Accounts */}
        {!loading && accounts.length === 0 && (
          <GlowCard color={ACCENT}>
            <div className="text-center py-10 px-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{
                background: `linear-gradient(135deg, hsl(${ACCENT} / 0.2), hsl(${ACCENT} / 0.08))`,
                border: `1px solid hsl(${ACCENT} / 0.25)`,
              }}>
                <Wallet className="w-6 h-6 text-muted-foreground" />
              </div>
               <h3 className="text-foreground font-medium mb-1 text-sm">{t('portfolio_no_brokers')}</h3>
               <p className="text-muted-foreground text-xs mb-4">{t('portfolio_no_brokers_desc')}</p>
               <button
                 onClick={() => navigate('/link-broker')}
                 className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all active:scale-95"
                 style={{
                   background: `linear-gradient(135deg, hsl(${ACCENT}), hsl(${ACCENT} / 0.8))`,
                   color: 'white',
                   boxShadow: `0 4px 12px hsl(${ACCENT} / 0.3)`,
                 }}
               >
                 <Plus className="w-3.5 h-3.5" />
                 {t('portfolio_link_broker')}
               </button>
            </div>
          </GlowCard>
        )}

        {/* Connected Accounts */}
        {!loading && accounts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.2 }}
          >
            <SectionTitle
              icon={<Wallet className="w-3.5 h-3.5" style={{ color: 'hsl(200 70% 55%)' }} />}
              label={t('portfolio_accounts') || 'Cuentas'}
              badge={`${accounts.length}`}
            />
            <div className="space-y-2">
              {accounts.map((acc) => (
                <GlowCard key={acc.connection_id} color={acc.error ? '0 70% 50%' : '200 70% 55%'}>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
                          background: acc.error
                            ? 'linear-gradient(135deg, hsl(0 70% 50% / 0.2), hsl(0 70% 50% / 0.08))'
                            : 'linear-gradient(135deg, hsl(200 70% 55% / 0.2), hsl(200 70% 55% / 0.08))',
                          border: `1px solid ${acc.error ? 'hsl(0 70% 50% / 0.25)' : 'hsl(200 70% 55% / 0.25)'}`,
                        }}>
                          <Wallet className="w-4 h-4" style={{ color: acc.error ? 'hsl(0 70% 55%)' : 'hsl(200 70% 55%)' }} />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-foreground">{acc.broker_name}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider" style={{
                              background: acc.environment === 'live' ? 'hsl(142 60% 55% / 0.12)' : 'hsl(45 80% 55% / 0.12)',
                              color: acc.environment === 'live' ? 'hsl(142 60% 55%)' : 'hsl(45 80% 55%)',
                            }}>
                              {acc.environment === 'live' ? 'REAL' : 'DEMO'}
                            </span>
                            {acc.error && (
                              <span className="text-[9px] text-red-400">{acc.error}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {!acc.error && (
                        <div className="text-right">
                          <p className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(acc.equity, acc.currency)}</p>
                          <p className="text-[10px] text-muted-foreground">{acc.currency}</p>
                        </div>
                      )}
                    </div>
                    {!acc.error && (
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        <DetailItem label="Balance" value={formatCurrency(acc.cash_balance, acc.currency)} />
                        <DetailItem label="Margen" value={formatCurrency(acc.margin_used, acc.currency)} />
                        <DetailItem label="Libre" value={formatCurrency(acc.margin_available, acc.currency)} />
                        <DetailItem
                          label="P&L Hoy"
                          value={`${acc.realized_pnl_today >= 0 ? '+' : ''}${formatCurrency(acc.realized_pnl_today, acc.currency)}`}
                          valueColor={acc.realized_pnl_today >= 0 ? 'text-primary' : 'text-destructive'}
                        />
                      </div>
                    )}
                  </div>
                </GlowCard>
              ))}
            </div>
          </motion.div>
        )}

        {/* Open Positions List */}
        {!loading && allPositions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.28 }}
          >
             <SectionTitle
               icon={<TrendingUp className="w-3.5 h-3.5" style={{ color: `hsl(${ACCENT})` }} />}
               label={t('portfolio_open_positions')}
               badge={`${allPositions.length} ${t('portfolio_active')}`}
             />
            <GlowCard color={ACCENT}>
              <div>
                {allPositions.map((pos, i) => (
                  <PositionRow
                    key={`${pos.broker}-${pos.symbol}-${i}`}
                    position={pos}
                    isLast={i === allPositions.length - 1}
                  />
                ))}
              </div>
            </GlowCard>
          </motion.div>
        )}

        {/* Imported Trades Analytics */}
        {!loading && user && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.32 }}
          >
            <SectionTitle
              icon={<FileSpreadsheet className="w-3.5 h-3.5" style={{ color: 'hsl(45 80% 55%)' }} />}
              label="Operaciones Importadas"
            />
            <TradeAnalytics
              trades={importedTradesHook.trades}
              stats={importedTradesHook.stats}
              onImportClick={() => setShowImportModal(true)}
              onDeleteAll={importedTradesHook.deleteAllTrades}
            />
          </motion.div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <GlowCard key={i} color={ACCENT}>
                <div className="p-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-9 h-9 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-20" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
              </GlowCard>
            ))}
          </div>
        )}

        {/* Import Modal */}
        <TradeImportModal open={showImportModal} onOpenChange={setShowImportModal} />
      </main>
    </PageShell>
  );
}

/* GlowCard is now imported from @/components/ui/glow-card */

/* ── Section Title ─────────────────────────────────── */
function SectionTitle({ icon, label, badge }: { icon: React.ReactNode; label: string; badge?: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      {icon}
      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      {badge && (
        <span className="text-[10px] text-muted-foreground font-normal ml-1">{badge}</span>
      )}
    </div>
  );
}

/* ── Position Row ─────────────────────────────────── */
function PositionRow({ position, isLast }: { position: Position & { broker: string }; isLast: boolean }) {
  const { t } = useTranslation();
  const isPnlPositive = position.unrealized_pnl >= 0;
  const isBuy = position.side === 'long';

  return (
    <div className={cn(
      "p-4 transition-colors hover:bg-muted/10",
      !isLast && "border-b"
    )} style={{ borderColor: 'hsl(var(--border) / 0.15)' }}>
      {/* Row 1: Symbol + Side + PnL */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
            background: isBuy
              ? 'linear-gradient(135deg, hsl(142 60% 55% / 0.2), hsl(142 60% 55% / 0.08))'
              : 'linear-gradient(135deg, hsl(0 70% 55% / 0.2), hsl(0 70% 55% / 0.08))',
            border: `1px solid ${isBuy ? 'hsl(142 60% 55% / 0.25)' : 'hsl(0 70% 55% / 0.25)'}`,
          }}>
            {isBuy ? (
              <ArrowUpRight className="w-5 h-5" style={{ color: 'hsl(142 60% 55%)' }} />
            ) : (
              <ArrowDownRight className="w-5 h-5" style={{ color: 'hsl(0 70% 55%)' }} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-foreground font-medium">{position.symbol}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider" style={{
                background: isBuy ? 'hsl(142 60% 55% / 0.12)' : 'hsl(0 70% 55% / 0.12)',
                color: isBuy ? 'hsl(142 60% 55%)' : 'hsl(0 70% 55%)',
                border: `1px solid ${isBuy ? 'hsl(142 60% 55% / 0.25)' : 'hsl(0 70% 55% / 0.25)'}`,
              }}>
                {isBuy ? 'BUY' : 'SELL'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{position.broker}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-sm font-bold tabular-nums" style={{
            color: isPnlPositive ? 'hsl(142 60% 55%)' : 'hsl(0 70% 55%)',
          }}>
            {isPnlPositive ? '+' : ''}{formatCurrency(position.unrealized_pnl)}
          </span>
          <p className="text-[10px] tabular-nums" style={{
            color: isPnlPositive ? 'hsl(142 60% 55% / 0.7)' : 'hsl(0 70% 55% / 0.7)',
          }}>
            {formatPercent(position.unrealized_pnl_percent)}
          </p>
        </div>
      </div>

      {/* Row 2: Details grid */}
      <div className={cn("grid gap-2 mt-2", position.swap != null ? "grid-cols-3" : "grid-cols-5")}>
        <DetailItem label={t('portfolio_value')} value={formatCurrency(position.market_value)} />
        <DetailItem label={t('portfolio_lot')} value={position.quantity.toString()} />
        <DetailItem label={t('portfolio_entry')} value={`$${position.average_entry_price.toFixed(position.average_entry_price < 10 ? 4 : 2)}`} />
        <DetailItem
          label={t('portfolio_current')}
          value={`$${position.current_price.toFixed(position.current_price < 10 ? 4 : 2)}`}
          valueColor="text-foreground"
        />
        <DetailItem
          label={position.commission != null ? t('portfolio_commission') : t('portfolio_spread')}
          value={position.commission != null
            ? `$${position.commission.toFixed(2)}`
            : position.spread != null
              ? `${position.spread} ${t('portfolio_pips')}`
              : '—'
          }
          valueColor="text-amber-400"
        />
        {position.swap != null && (
          <DetailItem
            label={t('portfolio_swap')}
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

const DIST_COLORS_HSL = ['142 70% 45%', '200 70% 55%', '45 80% 55%', '270 60% 55%', '330 70% 55%', '0 70% 55%'];

function DistributionCard({ title, items, color }: { title: string; items: { label: string; value: number }[]; color: string }) {
  const total = items.reduce((s, i) => s + i.value, 0);
  if (total === 0) return null;

  return (
    <GlowCard color={color}>
      <div className="p-3 space-y-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{title}</span>
        <div className="space-y-2">
          {items.slice(0, 6).map((item, idx) => {
            const pct = (item.value / total) * 100;
            const barColor = DIST_COLORS_HSL[idx % DIST_COLORS_HSL.length];
            return (
              <div key={`${item.label}-${idx}`} className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-foreground truncate max-w-[70%]">{item.label}</span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">{pct.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted) / 0.15)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, delay: idx * 0.08 }}
                    style={{ background: `linear-gradient(90deg, hsl(${barColor} / 0.5), hsl(${barColor}))` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </GlowCard>
  );
}
