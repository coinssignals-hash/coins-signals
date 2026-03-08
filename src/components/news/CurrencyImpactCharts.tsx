import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ResponsiveContainer, Tooltip, XAxis, YAxis, ComposedChart, Bar, Cell, Line, ReferenceLine } from 'recharts';
import { Loader2, TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/LanguageContext';
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

// Build OHLC-like candles from timeline data
function buildCandles(timeline: ChartResponse['timeline']) {
  return timeline.map((pt, i, arr) => {
    const open = i === 0 ? 0 : arr[i - 1].impact;
    const close = pt.impact;
    const high = Math.max(open, close) + pt.volume * 0.15;
    const low = Math.min(open, close) - pt.volume * 0.1;
    const bullish = close >= open;
    return { ...pt, open, close, high, low, bullish, body: [Math.min(open, close), Math.max(open, close)], wick: [low, high] };
  });
}

// Custom candlestick shape
function CandlestickShape(props: any) {
  const { x, y, width, payload } = props;
  if (!payload) return null;
  const { open, close, high, low, bullish } = payload;
  const yScale = props.yScale || ((v: number) => props.background?.y ?? 0);

  // We need the actual chart coordinate system
  const chartHeight = props.background?.height ?? 128;
  const chartY = props.background?.y ?? 0;
  const domain = props.yDomain || [-3, 3];
  const range = domain[1] - domain[0];

  const toY = (val: number) => chartY + chartHeight - ((val - domain[0]) / range) * chartHeight;

  const bodyTop = toY(Math.max(open, close));
  const bodyBottom = toY(Math.min(open, close));
  const bodyHeight = Math.max(bodyBottom - bodyTop, 1);
  const wickTop = toY(high);
  const wickBottom = toY(low);
  const cx = x + width / 2;

  const fill = bullish ? 'hsl(142, 70%, 45%)' : 'hsl(0, 70%, 50%)';
  const stroke = bullish ? 'hsl(142, 70%, 55%)' : 'hsl(0, 70%, 60%)';

  return (
    <g>
      {/* Wick */}
      <line x1={cx} y1={wickTop} x2={cx} y2={wickBottom} stroke={stroke} strokeWidth={1.5} />
      {/* Body */}
      <rect x={x + width * 0.15} y={bodyTop} width={width * 0.7} height={bodyHeight} fill={fill} rx={1.5} stroke={stroke} strokeWidth={0.5} />
    </g>
  );
}

// Custom candlestick renderer using ComposedChart + custom Bar shape
function CandlestickTimeline({ data }: { data: ChartResponse['timeline'] }) {
  const { t } = useTranslation();
  const candles = buildCandles(data);
  const allValues = candles.flatMap(c => [c.high, c.low]);
  const yMin = Math.min(...allValues) - 0.3;
  const yMax = Math.max(...allValues) + 0.3;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={candles} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
          dy={4}
        />
        <YAxis domain={[yMin, yMax]} hide />
        <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.3} strokeDasharray="3 3" />
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
          formatter={(v: number, name: string) => {
            if (name === 'close' || name === 'impact') return [`${v > 0 ? '+' : ''}${v.toFixed(2)}%`, 'Impacto'];
            if (name === 'high') return [`${v.toFixed(2)}%`, 'Máximo'];
            if (name === 'low') return [`${v.toFixed(2)}%`, 'Mínimo'];
            return [v, name];
          }}
          cursor={{ fill: 'hsl(var(--muted) / 0.15)' }}
        />
        {/* Invisible bar to provide x positioning, then we overlay candles */}
        <Bar dataKey="high" fill="transparent" barSize={20}
          shape={(props: any) => <CandlestickShape {...props} yDomain={[yMin, yMax]} />}
        />
        {/* Overlay a subtle line for the close trend */}
        <Line type="monotone" dataKey="close" stroke="hsl(var(--primary))" strokeWidth={1} strokeOpacity={0.4} dot={false} strokeDasharray="4 3" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// Heatmap grid for per-currency monthly impact
function ImpactHeatmap({ currencies }: { currencies: CurrencyBreakdown[] }) {
  const { t } = useTranslation();
  if (!currencies.length) return null;

  // Use labels from first currency (all share same months)
  const months = currencies[0]?.points.map(p => p.label) || [];

  // Find global max for color normalization
  const allImpacts = currencies.flatMap(c => c.points.map(p => Math.abs(p.impact)));
  const maxAbs = Math.max(...allImpacts, 0.01);

  const getCellColor = (impact: number) => {
    const intensity = Math.min(Math.abs(impact) / maxAbs, 1);
    if (impact > 0) return `hsl(142, 70%, ${65 - intensity * 30}%)`;
    if (impact < 0) return `hsl(0, 70%, ${65 - intensity * 30}%)`;
    return 'hsl(var(--muted))';
  };

  const getCellOpacity = (confidence: number) => 0.4 + confidence * 0.6;

  return (
    <div className="rounded-xl bg-card/80 border border-border/50 p-4 overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t('news_impact_heatmap')}</h3>
      </div>

      <div className="overflow-x-auto -mx-1 pb-1">
        <table className="w-full border-separate" style={{ borderSpacing: '3px' }}>
          <thead>
            <tr>
              <th className="text-[10px] text-muted-foreground font-medium text-left p-1 w-16" />
              {months.map((m, i) => (
                <th key={i} className="text-[8px] text-muted-foreground/70 font-mono p-0.5 text-center whitespace-nowrap">
                  {m.slice(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currencies.map((curr) => {
              const info = CURRENCIES[curr.currency as Currency];
              return (
                <tr key={curr.currency}>
                  <td className="p-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{info?.flag || '🌐'}</span>
                      <span className="text-[10px] font-mono font-bold text-foreground">{curr.currency}</span>
                    </div>
                  </td>
                  {curr.points.map((pt, i) => (
                    <td key={i} className="p-0.5">
                      <div
                        className="w-full aspect-square rounded-md flex items-center justify-center cursor-default transition-transform hover:scale-110"
                        style={{
                          backgroundColor: getCellColor(pt.impact),
                          opacity: getCellOpacity(pt.confidence),
                          minWidth: '20px',
                          minHeight: '20px',
                        }}
                        title={`${curr.currency} ${pt.label}: ${pt.impact > 0 ? '+' : ''}${pt.impact.toFixed(2)}% (${Math.round(pt.confidence * 100)}% conf.)`}
                      >
                        <span className="text-[7px] font-mono font-bold text-white/90 drop-shadow-sm">
                          {Math.abs(pt.impact) >= 0.5 ? `${pt.impact > 0 ? '+' : ''}${pt.impact.toFixed(1)}` : ''}
                        </span>
                      </div>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(0, 70%, 50%)' }} />
          <span className="text-[9px] text-muted-foreground">{t('news_impact_legend_bearish')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-muted" />
          <span className="text-[9px] text-muted-foreground">{t('news_impact_legend_neutral')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(142, 70%, 45%)' }} />
          <span className="text-[9px] text-muted-foreground">{t('news_impact_legend_bullish')}</span>
        </div>
        <div className="flex items-center gap-1 ml-2">
          <div className="flex gap-0.5">
            {[0.3, 0.5, 0.7, 1].map(o => (
              <div key={o} className="w-2 h-2 rounded-sm" style={{ backgroundColor: `hsl(var(--primary) / ${o})` }} />
            ))}
           </div>
          <span className="text-[9px] text-muted-foreground">{t('news_impact_legend_confidence')}</span>
        </div>
      </div>
    </div>
  );
}

export function CurrencyImpactCharts({ newsId, newsTitle, category, currencies }: Props) {
  const { t } = useTranslation();
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

      {/* Candlestick timeline */}
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
        {/* Candlestick chart */}
        <div className="h-36 w-full -mx-1">
          <CandlestickTimeline data={data.timeline} />
        </div>
      </div>

      {/* Heatmap replaces per-currency expandable bars */}
      <ImpactHeatmap currencies={data.currencies} />
    </div>
  );
}
