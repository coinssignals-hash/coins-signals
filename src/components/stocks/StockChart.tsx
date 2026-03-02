import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { HistoricalPrice } from '@/hooks/useStockData';
import { cn } from '@/lib/utils';

const PERIODS = [
  { value: '1w', label: '1S' },
  { value: '1m', label: '1M' },
  { value: '3m', label: '3M' },
  { value: '1y', label: '1A' },
  { value: '5y', label: '5A' },
] as const;

interface StockChartProps {
  data: HistoricalPrice[];
  loading: boolean;
  symbol: string;
  period: string;
  onPeriodChange: (period: string) => void;
}

export function StockChart({ data, loading, symbol, period, onPeriodChange }: StockChartProps) {
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

  const chartData = data.map(d => ({
    date: d.date,
    price: d.close,
    volume: d.volume,
  }));

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

      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground font-mono">
          {data[0]?.date} → {data[data.length - 1]?.date}
        </span>
        <span className={cn("text-xs font-semibold", isPositive ? "text-[hsl(142,70%,45%)]" : "text-destructive")}>
          {isPositive ? '+' : ''}{((data[data.length - 1].close - data[0].close) / data[0].close * 100).toFixed(2)}%
        </span>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
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
              fontSize: '12px',
            }}
            labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Precio']}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={lineColor}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
