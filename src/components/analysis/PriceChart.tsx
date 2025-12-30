import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import { Loader2 } from 'lucide-react';

interface PriceChartProps {
  pair: string;
  timeframe: string;
  priceData?: Array<{ time: string; price: number; open: number; high: number; low: number }>;
  smaData?: {
    sma20: Array<{ datetime: string; sma: number }>;
    sma50: Array<{ datetime: string; sma: number }>;
  };
  loading?: boolean;
  error?: string | null;
}

export function PriceChart({ pair, timeframe, priceData, smaData, loading, error }: PriceChartProps) {
  const chartData = useMemo(() => {
    if (!priceData || priceData.length === 0) return [];
    
    return priceData.map((price, index) => {
      const sma20Value = smaData?.sma20?.[index]?.sma;
      const sma50Value = smaData?.sma50?.[index]?.sma;
      
      const timeLabel = price.time.split(' ')[1] || price.time.split('T')[0];
      
      return {
        time: timeLabel,
        price: price.price,
        sma20: sma20Value || null,
        sma50: sma50Value || null,
      };
    });
  }, [priceData, smaData]);

  if (loading) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center text-destructive">
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
        <p className="text-sm">No hay datos disponibles</p>
      </div>
    );
  }

  const prices = chartData.map(d => d.price).filter(Boolean);
  const allValues = [
    ...prices,
    ...chartData.map(d => d.sma20).filter(Boolean) as number[],
    ...chartData.map(d => d.sma50).filter(Boolean) as number[],
  ];
  
  const minPrice = Math.min(...allValues);
  const maxPrice = Math.max(...allValues);
  const padding = (maxPrice - minPrice) * 0.1;

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis 
            dataKey="time" 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis 
            domain={[minPrice - padding, maxPrice + padding]}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={false}
            tickFormatter={(value) => value.toFixed(4)}
            width={70}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
            formatter={(value: number) => [value?.toFixed(5), '']}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#priceGradient)"
            name="Precio"
          />
          <Line
            type="monotone"
            dataKey="sma20"
            stroke="#3b82f6"
            strokeWidth={1.5}
            dot={false}
            name="SMA 20"
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="sma50"
            stroke="#eab308"
            strokeWidth={1.5}
            dot={false}
            name="SMA 50"
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}