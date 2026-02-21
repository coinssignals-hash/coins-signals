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
      <div className="p-3 rounded-lg bg-card border border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <DirectionIcon dir={data.overall.trend} />
            <span className="text-sm font-medium text-foreground capitalize">
              {data.overall.trend === 'bullish' ? 'Tendencia Alcista' :
               data.overall.trend === 'bearish' ? 'Tendencia Bajista' : 'Tendencia Neutral'}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            Volatilidad: {data.overall.volatility.toFixed(1)}%
          </span>
        </div>
        {/* Aggregate timeline mini chart */}
        <div className="h-24 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.timeline} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id="impactGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(v: number) => [`${v > 0 ? '+' : ''}${v.toFixed(2)}%`, 'Impacto']}
              />
              <Area type="monotone" dataKey="impact" stroke="hsl(var(--primary))" fill="url(#impactGrad)" strokeWidth={1.5} />
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
              className="rounded-lg bg-card border border-border overflow-hidden transition-all"
            >
              {/* Header row */}
              <button
                onClick={() => setExpanded(isExpanded ? null : curr.currency)}
                className="w-full flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors"
              >
                <span className="text-lg">{info?.flag || '🌐'}</span>
                <span className="font-mono font-semibold text-sm text-foreground">{curr.currency}</span>
                <DirectionIcon dir={curr.direction} />
                <span className={cn(
                  'ml-auto text-xs font-mono font-medium',
                  curr.avgImpact > 0 ? 'text-green-400' : curr.avgImpact < 0 ? 'text-red-400' : 'text-muted-foreground'
                )}>
                  {curr.avgImpact > 0 ? '+' : ''}{curr.avgImpact.toFixed(2)}% avg
                </span>
                <div className="flex gap-1 text-[10px] text-muted-foreground">
                  <span className="text-green-400">↑{curr.maxImpact.toFixed(1)}</span>
                  <span className="text-red-400">↓{curr.minImpact.toFixed(1)}</span>
                </div>
              </button>

              {/* Expandable chart */}
              {isExpanded && (
                <div className="px-3 pb-3">
                  <div className="h-36 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={curr.points} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                          axisLine={false}
                          tickLine={false}
                          interval="preserveStartEnd"
                        />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                          labelStyle={{ color: 'hsl(var(--foreground))' }}
                          formatter={(v: number, name: string) => {
                            if (name === 'impact') return [`${v > 0 ? '+' : ''}${v.toFixed(2)}%`, 'Impacto'];
                            if (name === 'volume') return [`${v}`, 'Volumen'];
                            return [v, name];
                          }}
                        />
                        <Bar dataKey="impact" radius={[3, 3, 0, 0]}>
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
                  <div className="flex gap-0.5 mt-2">
                    {curr.points.map((pt, i) => (
                      <div
                        key={i}
                        className="flex-1 h-1 rounded-full"
                        style={{
                          backgroundColor: `hsl(var(--primary) / ${(pt.confidence * 0.8 + 0.2).toFixed(2)})`,
                        }}
                        title={`${pt.label}: ${Math.round(pt.confidence * 100)}% confianza`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 text-right">Barra de confianza</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
