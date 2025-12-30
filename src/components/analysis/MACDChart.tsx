import { useMemo } from 'react';
import { Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, ReferenceLine, Cell } from 'recharts';
import { Loader2 } from 'lucide-react';

interface MACDChartProps {
  pair: string;
  timeframe: string;
  macdData?: Array<{ time: string; macd: number; signal: number; histogram: number }>;
  loading?: boolean;
  error?: string | null;
}

export function MACDChart({ pair, timeframe, macdData, loading, error }: MACDChartProps) {
  const chartData = useMemo(() => {
    if (!macdData || macdData.length === 0) return [];
    
    return macdData.map((item) => {
      const timeLabel = item.time.split(' ')[1] || item.time.split('T')[0];
      return {
        time: timeLabel,
        macd: item.macd,
        signal: item.signal,
        histogram: item.histogram,
      };
    });
  }, [macdData]);

  const currentMACD = chartData[chartData.length - 1];
  const trend = currentMACD?.macd > currentMACD?.signal ? 'bullish' : 'bearish';
  
  const crossover = chartData.length > 1 && 
    ((chartData[chartData.length - 2].macd < chartData[chartData.length - 2].signal && currentMACD.macd > currentMACD.signal) ||
     (chartData[chartData.length - 2].macd > chartData[chartData.length - 2].signal && currentMACD.macd < currentMACD.signal));

  if (loading) {
    return (
      <div className="h-[250px] w-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[250px] w-full flex items-center justify-center text-destructive">
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="h-[250px] w-full flex items-center justify-center text-muted-foreground">
        <p className="text-sm">No hay datos disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <span className="text-xs text-muted-foreground">MACD: </span>
            <span className="text-sm font-semibold text-blue-400">{currentMACD?.macd?.toFixed(5)}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Signal: </span>
            <span className="text-sm font-semibold text-orange-400">{currentMACD?.signal?.toFixed(5)}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Hist: </span>
            <span className={`text-sm font-semibold ${currentMACD?.histogram >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {currentMACD?.histogram?.toFixed(5)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {crossover && (
            <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
              ¡Cruce!
            </span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded ${
            trend === 'bullish' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {trend === 'bullish' ? 'Alcista' : 'Bajista'}
          </span>
        </div>
      </div>
      
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="time" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
              width={55}
              tickFormatter={(value) => value.toFixed(4)}
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
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
            <Bar dataKey="histogram" name="Histograma">
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.histogram >= 0 ? '#22c55e' : '#ef4444'} 
                  fillOpacity={0.6}
                />
              ))}
            </Bar>
            <Line
              type="monotone"
              dataKey="macd"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              name="MACD"
            />
            <Line
              type="monotone"
              dataKey="signal"
              stroke="#f97316"
              strokeWidth={2}
              dot={false}
              name="Signal"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}