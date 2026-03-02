import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AreaChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ComposedChart, Bar, Cell, BarChart } from 'recharts';
import type { HistoricalPrice } from '@/hooks/useStockData';
import { cn } from '@/lib/utils';

const PERIODS = [
  { value: '1w', label: '1S' },
  { value: '1m', label: '1M' },
  { value: '3m', label: '3M' },
  { value: '1y', label: '1A' },
  { value: '5y', label: '5A' },
] as const;

const OVERLAYS = [
  { key: 'sma20', label: 'SMA 20', color: 'hsl(210, 80%, 60%)', period: 20 },
  { key: 'sma50', label: 'SMA 50', color: 'hsl(280, 70%, 60%)', period: 50 },
  { key: 'ema12', label: 'EMA 12', color: 'hsl(35, 90%, 55%)', period: 12 },
  { key: 'ema26', label: 'EMA 26', color: 'hsl(340, 70%, 55%)', period: 26 },
] as const;

function calcSMA(prices: number[], period: number): (number | null)[] {
  return prices.map((_, i) => {
    if (i < period - 1) return null;
    const slice = prices.slice(i - period + 1, i + 1);
    return slice.reduce((a, b) => a + b, 0) / period;
  });
}

function calcEMA(prices: number[], period: number): (number | null)[] {
  const k = 2 / (period + 1);
  const result: (number | null)[] = [];
  let ema: number | null = null;
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (ema === null) {
      ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
      result.push(ema);
    } else {
      ema = prices[i] * k + ema * (1 - k);
      result.push(ema);
    }
  }
  return result;
}

interface StockChartProps {
  data: HistoricalPrice[];
  loading: boolean;
  symbol: string;
  period: string;
  onPeriodChange: (period: string) => void;
}

export function StockChart({ data, loading, symbol, period, onPeriodChange }: StockChartProps) {
  const [activeOverlays, setActiveOverlays] = useState<Set<string>>(new Set());

  const toggleOverlay = (key: string) => {
    setActiveOverlays(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const closes = data.map(d => d.close);
    const sma20 = calcSMA(closes, 20);
    const sma50 = calcSMA(closes, 50);
    const ema12 = calcEMA(closes, 12);
    const ema26 = calcEMA(closes, 26);
    return data.map((d, i) => ({
      date: d.date,
      price: d.close,
      volume: d.volume,
      volColor: d.close >= d.open ? 'hsl(142, 70%, 45%)' : 'hsl(0, 70%, 50%)',
      sma20: sma20[i],
      sma50: sma50[i],
      ema12: ema12[i],
      ema26: ema26[i],
    }));
  }, [data]);

  if (loading) {
    return (
      <Card className="p-4 bg-card border-border">
        <Skeleton className="h-4 w-40 mb-3" />
        <Skeleton className="h-48 w-full" />
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-4 bg-card border-border">
        <p className="text-sm text-muted-foreground text-center py-8">Sin datos históricos disponibles</p>
      </Card>
    );
  }

  const isPositive = data.length >= 2 && data[data.length - 1].close >= data[0].close;
  const lineColor = isPositive ? 'hsl(142, 70%, 45%)' : 'hsl(0, 70%, 50%)';
  const gradientId = `stockGradient-${symbol}`;
  const tickInterval = period === '1w' ? 0 : period === '1m' ? 4 : period === '1y' ? 30 : period === '5y' ? 120 : 'preserveStartEnd';

  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Histórico</h3>
        <div className="flex items-center gap-1">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => onPeriodChange(p.value)}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded transition-all",
                period === p.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overlay toggles */}
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        {OVERLAYS.map(o => (
          <button
            key={o.key}
            onClick={() => toggleOverlay(o.key)}
            className={cn(
              "px-2 py-0.5 text-[10px] font-medium rounded-full border transition-all",
              activeOverlays.has(o.key)
                ? "border-transparent text-white"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
            style={activeOverlays.has(o.key) ? { backgroundColor: o.color } : undefined}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground font-mono">
          {data[0]?.date} → {data[data.length - 1]?.date}
        </span>
        <span className={cn("text-xs font-semibold", isPositive ? "text-[hsl(142,70%,45%)]" : "text-destructive")}>
          {isPositive ? '+' : ''}{((data[data.length - 1].close - data[0].close) / data[0].close * 100).toFixed(2)}%
        </span>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={lineColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => v?.slice(5)}
            interval={tickInterval as any}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }}
            tickLine={false}
            axisLine={false}
            domain={['auto', 'auto']}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '11px',
            }}
            labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
            formatter={(value: number | null, name: string) => {
              if (value == null) return ['-', name];
              const labels: Record<string, string> = { price: 'Precio', sma20: 'SMA 20', sma50: 'SMA 50', ema12: 'EMA 12', ema26: 'EMA 26' };
              return [`$${value.toFixed(2)}`, labels[name] || name];
            }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={lineColor}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
          />
          {OVERLAYS.map(o => activeOverlays.has(o.key) && (
            <Line
              key={o.key}
              type="monotone"
              dataKey={o.key}
              stroke={o.color}
              strokeWidth={1.5}
              dot={false}
              connectNulls={false}
              strokeDasharray={o.key.startsWith('ema') ? '4 2' : undefined}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Volume chart */}
      <div className="mt-1 border-t border-border/20 pt-1">
        <div className="text-[10px] text-muted-foreground mb-0.5 pl-1">Vol</div>
        <ResponsiveContainer width="100%" height={50}>
          <BarChart data={chartData} margin={{ top: 0, right: 5, left: -20, bottom: 0 }}>
            <XAxis dataKey="date" hide />
            <YAxis hide domain={[0, 'auto']} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '11px',
              }}
              labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
              formatter={(value: number) => {
                if (value >= 1e6) return [`${(value / 1e6).toFixed(1)}M`, 'Volumen'];
                if (value >= 1e3) return [`${(value / 1e3).toFixed(1)}K`, 'Volumen'];
                return [value.toFixed(0), 'Volumen'];
              }}
            />
            <Bar dataKey="volume" radius={[1, 1, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.volColor} fillOpacity={0.6} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
