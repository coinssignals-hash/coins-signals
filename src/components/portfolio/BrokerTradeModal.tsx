import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useBrokerConnections } from '@/hooks/useBrokerConnections';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/i18n/LanguageContext';
import { toast } from 'sonner';
import { Activity, Copy, ArrowUpRight, ArrowDownRight, AlertCircle, Link2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TradeData {
  symbol: string;
  side: string;
  sl: string;
  tp: string;
  entry: string;
}

export function BrokerTradeModal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { connections, loading } = useBrokerConnections();
  const [tradeData, setTradeData] = useState<TradeData | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const tradeParam = searchParams.get('trade');
    if (tradeParam) {
      const params = new URLSearchParams(tradeParam);
      const symbol = params.get('symbol');
      const side = params.get('side');
      const sl = params.get('sl');
      const tp = params.get('tp');
      const entry = params.get('entry');

      if (symbol && side && sl && tp && entry) {
        setTradeData({ symbol, side, sl, tp, entry });
        setOpen(true);
        setSearchParams({}, { replace: true });
      }
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    setTradeData(null);
  };

  const handleCopyTrade = (connectionName: string) => {
    if (!tradeData) return;
    const text = `${tradeData.side.toUpperCase()} ${tradeData.symbol}\nEntry: ${tradeData.entry}\nSL: ${tradeData.sl}\nTP: ${tradeData.tp}`;
    navigator.clipboard.writeText(text);
    toast.success(t('broker_trade_copied') || `Operación copiada — Ejecútala en ${connectionName}`);
  };

  const activeConnections = connections.filter(c => c.is_connected);
  const isBuy = tradeData?.side === 'buy';

  if (!tradeData) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm mx-auto bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Activity className="w-5 h-5 text-primary" />
            {t('broker_execute_signal') || 'Ejecutar Señal en Broker'}
          </DialogTitle>
        </DialogHeader>

        {/* Signal summary */}
        <div
          className="rounded-xl p-3 space-y-2"
          style={{
            background: isBuy
              ? 'linear-gradient(135deg, hsl(142 70% 45% / 0.1), hsl(142 70% 45% / 0.03))'
              : 'linear-gradient(135deg, hsl(0 70% 55% / 0.1), hsl(0 70% 55% / 0.03))',
            border: isBuy
              ? '1px solid hsl(142 70% 45% / 0.25)'
              : '1px solid hsl(0 70% 55% / 0.25)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">{tradeData.symbol}</span>
            <span
              className={cn(
                'flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full',
                isBuy ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
              )}
            >
              {isBuy ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {tradeData.side.toUpperCase()}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Entry</p>
              <p className="text-xs font-mono font-semibold text-foreground">{tradeData.entry}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">SL</p>
              <p className="text-xs font-mono font-semibold text-red-400">{tradeData.sl}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">TP</p>
              <p className="text-xs font-mono font-semibold text-emerald-400">{tradeData.tp}</p>
            </div>
          </div>
        </div>

        {/* Broker connections */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t('broker_your_connections') || 'Tus Brokers Vinculados'}
          </p>

          {!user && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <p className="text-xs text-amber-300">
                {t('broker_login_required') || 'Inicia sesión para ver tus brokers vinculados'}
              </p>
            </div>
          )}

          {user && loading && (
            <div className="space-y-2">
              {[1, 2].map(i => (
                <div key={i} className="h-14 rounded-lg bg-muted/30 animate-pulse" />
              ))}
            </div>
          )}

          {user && !loading && activeConnections.length === 0 && (
            <div className="text-center py-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                {t('broker_no_connections') || 'No tienes brokers vinculados'}
              </p>
              <button
                onClick={() => {
                  handleClose();
                  navigate('/link-broker');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all"
              >
                <Link2 className="w-3.5 h-3.5" />
                {t('broker_link_now') || 'Vincular Broker'}
              </button>
            </div>
          )}

          {user && !loading && activeConnections.map(conn => (
            <button
              key={conn.id}
              onClick={() => handleCopyTrade(conn.connection_name)}
              className="w-full flex items-center gap-3 p-3 rounded-xl transition-all active:scale-[0.98] hover:bg-muted/30"
              style={{
                background: 'hsl(var(--muted) / 0.15)',
                border: '1px solid hsl(var(--border) / 0.3)',
              }}
            >
              {conn.broker?.logo_url ? (
                <img src={conn.broker.logo_url} alt="" className="w-8 h-8 rounded-lg object-contain bg-white/10 p-1" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ExternalLink className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{conn.connection_name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {conn.broker?.display_name || 'Broker'} · {conn.environment === 'live' ? '🟢 Live' : '🟡 Demo'}
                </p>
              </div>
              <div className="flex items-center gap-1 text-primary">
                <Copy className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase">{t('broker_copy') || 'Copiar'}</span>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
