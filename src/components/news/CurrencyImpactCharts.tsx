import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip, AreaChart, Area } from 'recharts';
import { Loader2, TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CURRENCIES, Currency, EconomicCategory } from '@/types/news';

interface CurrencyBreakdown {
  currency: string;
  avgImpact: number;
  maxImpact: number;
  minImpact: number;
  direction: 'bullish' | 'bearish' | 'neutral';
  points: { date: string; label: string; impact: number; volume: number; confidence: number }[];
}

interface ChartResponse {
  newsTitle: string;
  category: string;
  period: { from: string; to: string };
  overall: { trend: string; avgImpact: number; volatility: number; totalPoints: number };
  timeline: { date: string; label: string; impact: number; volume: number; confidence: number }[];
  currencies: CurrencyBreakdown[];
  cached: boolean;
}

interface Props {
  newsId: string;
  newsTitle: string;
  category: EconomicCategory;
  currencies: Currency[];
}

export function CurrencyImpactCharts({ newsId, newsTitle, category, currencies }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery<ChartResponse>({
    queryKey: ['news-impact-charts', newsId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('news-impact-charts', {
        body: { newsTitle, newsId, category, affectedCurrencies: currencies, months: 12 },
      });
      if (error) throw error;
      return data;
    },
    enabled: currencies.length > 0,
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="p-6 rounded-lg bg-card border border-border flex items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Generando gráficos de impacto...</span>
      </div>
    );
  }

  if (error || !data) return null;

  const DirectionIcon = ({ dir }: { dir: string }) =>
    dir === 'bullish' ? <TrendingUp className="w-4 h-4 text-green-400" /> :
    dir === 'bearish' ? <TrendingDown className="w-4 h-4 text-red-400" /> :
    <Minus className="w-4 h-4 text-muted-foreground" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Impacto Histórico por Divisa
        </h2>
      </div>

      {/* Overall summary */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-card to-card/80 border border-border/60 shadow-lg shadow-primary/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center',
              data.overall.trend === 'bullish' ? 'bg-green-500/15' :
              data.overall.trend === 'bearish' ? 'bg-red-500/15' : 'bg-muted/30'
            )}>
              <DirectionIcon dir={data.overall.trend} />
            </div>
            <div>
              <span className="text-sm font-semibold text-foreground block leading-tight">
                {data.overall.trend === 'bullish' ? 'Tendencia Alcista' :
                 data.overall.trend === 'bearish' ? 'Tendencia Bajista' : 'Tendencia Neutral'}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {data.overall.totalPoints} puntos de datos
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className={cn(
              'text-lg font-bold font-mono block leading-tight',
              data.overall.avgImpact > 0 ? 'text-green-400' :
              data.overall.avgImpact < 0 ? 'text-red-400' : 'text-muted-foreground'
            )}>
              {data.overall.avgImpact > 0 ? '+' : ''}{data.overall.avgImpact.toFixed(2)}%
            </span>
            <span className="text-[10px] text-muted-foreground">
              Vol: {data.overall.volatility.toFixed(1)}%
            </span>
          </div>
        </div>
        {/* Aggregate timeline chart */}
        <div className="h-32 w-full -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.timeline} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
              <defs>
                <linearGradient id="impactGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                dy={4}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '10px',
                  fontSize: '12px',
                  boxShadow: '0 8px 24px hsl(var(--primary) / 0.15)',
                  padding: '8px 12px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600, marginBottom: 2 }}
                formatter={(v: number) => [`${v > 0 ? '+' : ''}${v.toFixed(2)}%`, 'Impacto']}
                cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area
                type="monotone"
                dataKey="impact"
                stroke="hsl(var(--primary))"
                fill="url(#impactGrad)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per-currency cards */}
      <div className="space-y-3">
        {data.currencies.map((curr) => {
          const info = CURRENCIES[curr.currency as Currency];
          const isExpanded = expanded === curr.currency;

          return (
            <div
              key={curr.currency}
              className="rounded-xl bg-card/80 border border-border/50 overflow-hidden transition-all hover:border-border"
            >
              {/* Header row */}
              <button
                onClick={() => setExpanded(isExpanded ? null : curr.currency)}
                className="w-full flex items-center gap-3 p-3.5 hover:bg-muted/20 transition-colors"
              >
                <span className="text-xl">{info?.flag || '🌐'}</span>
                <div className="flex flex-col items-start">
                  <span className="font-mono font-bold text-sm text-foreground">{curr.currency}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">{info?.name || ''}</span>
                </div>
                <div className="ml-1">
                  <DirectionIcon dir={curr.direction} />
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <span className={cn(
                    'text-sm font-mono font-bold',
                    curr.avgImpact > 0 ? 'text-green-400' : curr.avgImpact < 0 ? 'text-red-400' : 'text-muted-foreground'
                  )}>
                    {curr.avgImpact > 0 ? '+' : ''}{curr.avgImpact.toFixed(2)}%
                  </span>
                  <div className="flex flex-col gap-0.5 text-[10px] font-mono">
                    <span className="text-green-400/80">↑ {curr.maxImpact.toFixed(1)}%</span>
                    <span className="text-red-400/80">↓ {curr.minImpact.toFixed(1)}%</span>
                  </div>
                  <svg className={cn('w-4 h-4 text-muted-foreground transition-transform', isExpanded && 'rotate-180')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                </div>
              </button>

              {/* Expandable chart */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-border/30">
                  <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={curr.points} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                          axisLine={false}
                          tickLine={false}
                          interval="preserveStartEnd"
                          dy={4}
                        />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '10px',
                            fontSize: '12px',
                            boxShadow: '0 8px 24px hsl(var(--primary) / 0.15)',
                            padding: '8px 12px',
                          }}
                          labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                          formatter={(v: number, name: string) => {
                            if (name === 'impact') return [`${v > 0 ? '+' : ''}${v.toFixed(2)}%`, 'Impacto'];
                            if (name === 'volume') return [`${v}`, 'Volumen'];
                            return [v, name];
                          }}
                          cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                        />
                        <Bar dataKey="impact" radius={[4, 4, 0, 0]} maxBarSize={28}>
                          {curr.points.map((pt, i) => (
                            <Cell
                              key={i}
                              fill={pt.impact >= 0 ? 'hsl(142 70% 45%)' : 'hsl(0 70% 50%)'}
                              opacity={0.5 + pt.confidence * 0.5}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Confidence strip */}
                  <div className="flex gap-0.5 mt-3">
                    {curr.points.map((pt, i) => (
                      <div
                        key={i}
                        className="flex-1 h-1.5 rounded-full transition-all"
                        style={{
                          backgroundColor: `hsl(var(--primary) / ${(pt.confidence * 0.8 + 0.2).toFixed(2)})`,
                        }}
                        title={`${pt.label}: ${Math.round(pt.confidence * 100)}% confianza`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground/70 mt-1.5 text-right tracking-wide">
                    Barra de confianza del dato
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
