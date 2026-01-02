import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart, ReferenceLine } from 'recharts';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  realtimePrice?: number | null;
  isRealtimeConnected?: boolean;
}

// Custom label for realtime price line
const RealtimePriceLabel = ({ viewBox, value, isConnected }: { viewBox: any; value: number; isConnected: boolean }) => {
  const { x, y, width } = viewBox;
  return (
    <g>
      <rect
        x={width + 5}
        y={y - 10}
        width={70}
        height={20}
        rx={4}
        fill={isConnected ? "#22c55e" : "#3b82f6"}
        className={isConnected ? "animate-pulse" : ""}
      />
      <text
        x={width + 40}
        y={y + 4}
        fill="white"
        textAnchor="middle"
        fontSize={11}
        fontWeight="bold"
      >
        {value?.toFixed(5)}
      </text>
    </g>
  );
};

export function PriceChart({ 
  pair, 
  timeframe, 
  priceData, 
  smaData, 
  loading, 
  error,
  realtimePrice,
  isRealtimeConnected = false
}: PriceChartProps) {
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

  // Add realtime price as last data point if connected
  const chartDataWithRealtime = useMemo(() => {
    if (!realtimePrice || chartData.length === 0) return chartData;
    
    const lastDataPoint = chartData[chartData.length - 1];
    return [
      ...chartData.slice(0, -1),
      {
        ...lastDataPoint,
        price: realtimePrice,
        realtime: realtimePrice,
      }
    ];
  }, [chartData, realtimePrice]);

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

  if (chartDataWithRealtime.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
        <p className="text-sm">No hay datos disponibles</p>
      </div>
    );
  }

  const prices = chartDataWithRealtime.map(d => d.price).filter(Boolean);
  const allValues = [
    ...prices,
    ...chartDataWithRealtime.map(d => d.sma20).filter(Boolean) as number[],
    ...chartDataWithRealtime.map(d => d.sma50).filter(Boolean) as number[],
    realtimePrice || 0,
  ].filter(v => v > 0);
  
  const minPrice = Math.min(...allValues);
  const maxPrice = Math.max(...allValues);
  const padding = (maxPrice - minPrice) * 0.1;

  return (
    <div className="h-[300px] w-full relative">
      {/* Realtime indicator */}
      {isRealtimeConnected && realtimePrice && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-2 bg-green-500/20 px-2 py-1 rounded-full">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-xs text-green-400 font-medium">LIVE</span>
        </div>
      )}
      
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartDataWithRealtime} margin={{ top: 10, right: 80, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="realtimeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
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
            formatter={(value: number, name: string) => {
              const labels: Record<string, string> = {
                price: 'Precio',
                sma20: 'SMA 20',
                sma50: 'SMA 50',
                realtime: '🔴 LIVE',
              };
              return [value?.toFixed(5), labels[name] || name];
            }}
          />
          
          {/* Realtime price horizontal line */}
          {realtimePrice && (
            <ReferenceLine 
              y={realtimePrice} 
              stroke={isRealtimeConnected ? "#22c55e" : "#3b82f6"}
              strokeWidth={2}
              strokeDasharray={isRealtimeConnected ? "0" : "5 5"}
              className={isRealtimeConnected ? "animate-pulse" : ""}
              label={<RealtimePriceLabel viewBox={{}} value={realtimePrice} isConnected={isRealtimeConnected} />}
            />
          )}
          
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