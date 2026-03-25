import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { GlowSection } from '@/components/ui/glow-section';
import { LeaderboardTrader } from '@/hooks/useLeaderboard';
import { TIER_COLORS, getFlag, getInitials } from './leaderboard-utils';
import { TrendingUp, TrendingDown, Target, Flame, BarChart3, Activity, Clock, Layers, Eye, EyeOff, Copy, Zap, UserPlus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Props {
  trader: LeaderboardTrader | null;
  open: boolean;
  onClose: () => void;
}

function generateDemoTrades(trader: LeaderboardTrader) {
  const symbols = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'EUR/GBP', 'USD/CAD', 'NZD/USD', 'GBP/JPY'];
  const trades = [];
  const now = Date.now();

  for (let i = 0; i < Math.min(trader.trades, 15); i++) {
    const isWin = i < Math.round(15 * (trader.winRate / 100));
    const symbol = symbols[i % symbols.length];
    const side = Math.random() > 0.5 ? 'BUY' : 'SELL';
    const pnl = isWin
      ? +(Math.random() * 300 + 50).toFixed(2)
      : -(Math.random() * 200 + 30).toFixed(2);
    const daysAgo = Math.floor(Math.random() * 30) + 1;

    trades.push({
      id: `trade-${i}`,
      symbol,
      side,
      pnl,
      date: new Date(now - daysAgo * 86400000).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
      lots: +(Math.random() * 2 + 0.1).toFixed(2),
      duration: `${Math.floor(Math.random() * 8) + 1}h ${Math.floor(Math.random() * 59)}m`,
    });
  }

  return trades.sort((a, b) => (a.pnl > b.pnl ? -1 : 1));
}

const COPY_ACCENT = '190 90% 50%';

export function TraderProfileDrawer({ trader, open, onClose }: Props) {
  const navigate = useNavigate();
  const demoTrades = useMemo(() => trader ? generateDemoTrades(trader) : [], [trader]);
  const [isFollowing, setIsFollowing] = useState(false);

  if (!trader) return null;

  const tierColor = TIER_COLORS[trader.tier] || '45 95% 55%';
  const profitFactor = trader.losers > 0 ? +(trader.winners / trader.losers).toFixed(2) : trader.winners;
  const avgWin = trader.winners > 0 ? +(trader.pnl * (trader.winRate / 100) / trader.winners * 2).toFixed(2) : 0;
  const avgLoss = trader.losers > 0 ? +((trader.pnl * ((100 - trader.winRate) / 100)) / trader.losers * -1.5).toFixed(2) : 0;

  const stats = [
    { icon: TrendingUp, label: 'P&L Total', value: `$${trader.pnl.toLocaleString()}`, color: trader.pnl > 0 ? '160 84% 39%' : '0 84% 60%' },
    { icon: Target, label: 'Win Rate', value: `${trader.winRate}%`, color: '210 80% 55%' },
    { icon: Flame, label: 'Racha Actual', value: `${trader.streak}`, color: '25 95% 55%' },
    { icon: BarChart3, label: 'Total Trades', value: `${trader.trades}`, color: '45 95% 55%' },
    { icon: Activity, label: 'Profit Factor', value: `${profitFactor}`, color: '280 70% 55%' },
    { icon: Layers, label: 'Pares', value: `${trader.symbolsTraded}`, color: '190 80% 50%' },
  ];

  const handleFollow = () => {
    setIsFollowing(prev => {
      const next = !prev;
      toast({
        title: next ? '✅ Siguiendo a ' + trader.alias : '❌ Dejaste de seguir a ' + trader.alias,
        description: next ? 'Recibirás notificaciones de sus operaciones' : undefined,
      });
      return next;
    });
  };

  const handleCopyTrading = () => {
    onClose();
    // Navigate to copy trading page — the trader info is encoded for pre-selection
    navigate('/copy-trading', { state: { preselectedTrader: trader.alias } });
    toast({
      title: '🚀 Configurar Copy Trading',
      description: `Configura la copia de ${trader.alias} en Copy Trading`,
    });
  };

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) { onClose(); setIsFollowing(false); } }}>
      <DrawerContent className="max-h-[85vh]">
        <div className="overflow-y-auto pb-8">
          {/* Header */}
          <DrawerHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="relative p-0.5 rounded-full" style={{
                border: `2px solid hsl(${tierColor} / 0.5)`,
                boxShadow: `0 0 16px hsl(${tierColor} / 0.25)`,
              }}>
                <Avatar className="w-14 h-14">
                  {trader.avatar_url && <AvatarImage src={trader.avatar_url} />}
                  <AvatarFallback className="text-sm font-bold" style={{
                    background: `hsl(${tierColor} / 0.15)`,
                  }}>{getInitials(trader.alias)}</AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-1 -right-1 text-base">{getFlag(trader.country)}</span>
              </div>
              <div className="text-left flex-1">
                <div className="flex items-center gap-2">
                  <DrawerTitle className="text-base">{trader.alias}</DrawerTitle>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-bold uppercase" style={{
                    color: `hsl(${tierColor})`, borderColor: `hsl(${tierColor} / 0.4)`,
                    background: `hsl(${tierColor} / 0.1)`,
                  }}>{trader.tier}</Badge>
                </div>
                <DrawerDescription className="text-[11px]">
                  Rank #{trader.rank} · {trader.trades} operaciones · W{trader.winners}/L{trader.losers}
                </DrawerDescription>
              </div>
            </div>
          </DrawerHeader>

          <div className="px-4 space-y-3">
            {/* ── Follow / Copy Buttons ── */}
            <div className="flex gap-2">
              <button
                onClick={handleFollow}
                className="flex-1 flex items-center justify-center gap-1.5 h-10 text-xs font-semibold rounded-xl transition-all active:scale-[0.97]"
                style={isFollowing ? {
                  background: 'hsl(160 84% 39% / 0.12)',
                  border: '1px solid hsl(160 84% 39% / 0.3)',
                  color: 'hsl(160 84% 39%)',
                } : {
                  background: 'hsl(var(--card) / 0.6)',
                  border: '1px solid hsl(var(--border) / 0.2)',
                  backdropFilter: 'blur(8px)',
                  color: 'hsl(var(--foreground) / 0.8)',
                }}
              >
                {isFollowing ? <><EyeOff className="w-3.5 h-3.5" /> Siguiendo</> : <><Eye className="w-3.5 h-3.5" /> Seguir</>}
              </button>
              <button
                onClick={handleCopyTrading}
                className="flex-1 flex items-center justify-center gap-1.5 h-10 text-xs font-bold text-white rounded-xl transition-all active:scale-[0.97]"
                style={{
                  background: `linear-gradient(165deg, hsl(160 84% 39%), hsl(${COPY_ACCENT}))`,
                  border: '1px solid hsl(160 84% 39% / 0.4)',
                  boxShadow: '0 0 12px hsl(160 84% 39% / 0.2)',
                }}
              >
                <Copy className="w-3.5 h-3.5" /> Copiar Trades
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2">
              {stats.map((stat, i) => (
                <GlowSection key={i} color={stat.color} className="!rounded-xl">
                  <div className="p-2.5 text-center">
                    <stat.icon className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: `hsl(${stat.color})` }} />
                    <div className="text-sm font-bold text-foreground">{stat.value}</div>
                    <div className="text-[9px] text-muted-foreground">{stat.label}</div>
                  </div>
                </GlowSection>
              ))}
            </div>

            {/* Win/Loss Bar */}
            <GlowSection color={tierColor} className="!rounded-xl">
              <div className="p-3">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5">
                  <span className="font-semibold" style={{ color: 'hsl(160 84% 39%)' }}>Ganadas: {trader.winners}</span>
                  <span className="font-semibold" style={{ color: 'hsl(0 84% 60%)' }}>Perdidas: {trader.losers}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden flex" style={{ background: 'hsl(var(--muted) / 0.3)' }}>
                  <div className="h-full rounded-l-full" style={{
                    width: `${trader.winRate}%`,
                    background: 'linear-gradient(90deg, hsl(160 84% 39%), hsl(160 84% 45%))',
                  }} />
                  <div className="h-full rounded-r-full" style={{
                    width: `${100 - trader.winRate}%`,
                    background: 'linear-gradient(90deg, hsl(0 84% 55%), hsl(0 84% 60%))',
                  }} />
                </div>
                <div className="flex justify-between mt-1.5 text-[10px]">
                  <span className="text-muted-foreground">Avg Win: <span className="font-mono font-bold" style={{ color: 'hsl(160 84% 39%)' }}>${Math.abs(avgWin)}</span></span>
                  <span className="text-muted-foreground">Avg Loss: <span className="font-mono font-bold" style={{ color: 'hsl(0 84% 60%)' }}>${Math.abs(avgLoss)}</span></span>
                </div>
              </div>
            </GlowSection>

            {/* Recent Trades */}
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-2 px-1">
                <Clock className="w-3 h-3" style={{ color: `hsl(${tierColor})` }} />
                OPERACIONES RECIENTES
              </h4>
              <div className="space-y-1.5">
                {demoTrades.map((trade) => (
                  <div key={trade.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors" style={{
                    background: 'hsl(var(--card) / 0.6)',
                    border: '1px solid hsl(var(--border) / 0.15)',
                  }}>
                    <div className="w-5 h-5 rounded flex items-center justify-center" style={{
                      background: trade.side === 'BUY' ? 'hsl(160 84% 39% / 0.12)' : 'hsl(0 84% 60% / 0.12)',
                    }}>
                      {trade.side === 'BUY'
                        ? <TrendingUp className="w-3 h-3" style={{ color: 'hsl(160 84% 39%)' }} />
                        : <TrendingDown className="w-3 h-3" style={{ color: 'hsl(0 84% 60%)' }} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-foreground">{trade.symbol}</span>
                        <span className="text-[9px] font-medium px-1 rounded" style={{
                          background: trade.side === 'BUY' ? 'hsl(160 84% 39% / 0.1)' : 'hsl(0 84% 60% / 0.1)',
                          color: trade.side === 'BUY' ? 'hsl(160 84% 39%)' : 'hsl(0 84% 60%)',
                        }}>{trade.side}</span>
                      </div>
                      <div className="text-[9px] text-muted-foreground">{trade.lots} lots · {trade.duration} · {trade.date}</div>
                    </div>
                    <div className="text-xs font-bold font-mono" style={{
                      color: trade.pnl > 0 ? 'hsl(160 84% 39%)' : 'hsl(0 84% 60%)',
                    }}>
                      {trade.pnl > 0 ? '+' : ''}{trade.pnl}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
