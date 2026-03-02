import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { HistoricalPrice } from '@/hooks/useStockData';

interface StockChartProps {
  data: HistoricalPrice[];
  loading: boolean;
  symbol: string;
}

export function StockChart({ data, loading, symbol }: StockChartProps) {
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

  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Histórico 3 Meses</h3>
        <span className="text-xs text-muted-foreground font-mono">
          {data[0]?.date} → {data[data.length - 1]?.date}
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
            interval="preserveStartEnd"
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
              backgroundColor: 'hsl(222, 45%, 7%)',
              border: '1px solid hsl(220, 30%, 15%)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ color: 'hsl(215, 20%, 55%)' }}
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
