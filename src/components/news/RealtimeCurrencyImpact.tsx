import { useState, useEffect, useMemo } from 'react';
import { useRealtimeMarket } from '@/hooks/useRealtimeMarket';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity, TrendingUp, TrendingDown, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Currency } from '@/types/news';

interface Props {
  currencies: Currency[];
}

interface PricePoint {
  time: string;
  price: number;
}

const PAIR_CONFIG: Record<string, { symbol: string; label: string; baseFlag: string; quoteFlag: string }> = {
  'EUR/USD': { symbol: 'C:EURUSD', label: 'EUR/USD', baseFlag: '🇪🇺', quoteFlag: '🇺🇸' },
  'GBP/USD': { symbol: 'C:GBPUSD', label: 'GBP/USD', baseFlag: '🇬🇧', quoteFlag: '🇺🇸' },
  'EUR/GBP': { symbol: 'C:EURGBP', label: 'EUR/GBP', baseFlag: '🇪🇺', quoteFlag: '🇬🇧' },
};

export function RealtimeCurrencyImpact({ currencies }: Props) {
  const relevantPairs = useMemo(() => {
    const pairs: string[] = [];
    const has = (c: string) => currencies.includes(c as Currency);
    if (has('EUR') && has('USD')) pairs.push('EUR/USD');
    if (has('GBP') && has('USD')) pairs.push('GBP/USD');
    if (has('EUR') && has('GBP')) pairs.push('EUR/GBP');
    if (pairs.length === 0) {
      if (has('EUR')) pairs.push('EUR/USD');
      else if (has('GBP')) pairs.push('GBP/USD');
      else if (has('USD')) pairs.push('EUR/USD');
    }
    return pairs;
  }, [currencies]);

  const symbols = useMemo(() => relevantPairs.map(p => PAIR_CONFIG[p]?.symbol).filter(Boolean), [relevantPairs]);
  const { getQuote, isConnected } = useRealtimeMarket(symbols);

  const [history, setHistory] = useState<Record<string, PricePoint[]>>({});

  useEffect(() => {
    const interval = setInterval(() => {
      setHistory(prev => {
        const next = { ...prev };
        relevantPairs.forEach(pair => {
          const cfg = PAIR_CONFIG[pair];
          if (!cfg) return;
          const q = getQuote(cfg.symbol);
          if (!q) return;
          const points = [...(prev[pair] || [])];
          const now = new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          points.push({ time: now, price: q.price });
          if (points.length > 30) points.shift();
          next[pair] = points;
        });
        return next;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [relevantPairs, getQuote]);

  if (relevantPairs.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Impacto en Tiempo Real
          </h2>
        </div>
        <div className={cn(
          'flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full',
          isConnected ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
        )}>
          {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {isConnected ? 'LIVE' : 'OFF'}
        </div>
      </div>

      <div className="space-y-2.5">
        {relevantPairs.map(pair => {
          const cfg = PAIR_CONFIG[pair];
          if (!cfg) return null;
          const quote = getQuote(cfg.symbol);
          const points = history[pair] || [];
          const change = quote?.changePercent ?? 0;
          const isUp = change >= 0;

          return (
            <div
              key={pair}
              className="rounded-xl bg-card/80 border border-border/50 p-3.5 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex -space-x-1.5">
                    <span className="text-lg">{cfg.baseFlag}</span>
                    <span className="text-lg">{cfg.quoteFlag}</span>
                  </div>
                  <span className="font-mono font-bold text-sm text-foreground">{cfg.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {quote ? (
                    <>
                      <span className="font-mono text-sm font-bold text-foreground">
                        {quote.price.toFixed(5)}
                      </span>
                      <span className={cn(
                        'flex items-center gap-0.5 text-xs font-mono font-semibold px-1.5 py-0.5 rounded',
                        isUp ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'
                      )}>
                        {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {isUp ? '+' : ''}{change.toFixed(2)}%
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">Conectando...</span>
                  )}
                </div>
              </div>

              {points.length > 2 && (
                <div className="h-16 w-full -mx-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={points} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                      <defs>
                        <linearGradient id={`grad-${pair}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={isUp ? 'hsl(142, 70%, 45%)' : 'hsl(0, 70%, 50%)'} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={isUp ? 'hsl(142, 70%, 45%)' : 'hsl(0, 70%, 50%)'} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '11px',
                          padding: '4px 8px',
                        }}
                        labelStyle={{ display: 'none' }}
                        formatter={(v: number) => [v.toFixed(5), 'Precio']}
                      />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke={isUp ? 'hsl(142, 70%, 45%)' : 'hsl(0, 70%, 50%)'}
                        fill={`url(#grad-${pair})`}
                        strokeWidth={1.5}
                        dot={false}
                        activeDot={{ r: 3, strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
