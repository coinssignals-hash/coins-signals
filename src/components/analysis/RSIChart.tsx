import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts';
import { Loader2 } from 'lucide-react';

interface RSIChartProps {
  pair: string;
  timeframe: string;
  rsiData?: Array<{ time: string; rsi: number }>;
  loading?: boolean;
  error?: string | null;
}

export function RSIChart({ pair, timeframe, rsiData, loading, error }: RSIChartProps) {
  const chartData = useMemo(() => {
    if (!rsiData || rsiData.length === 0) return [];
    
    return rsiData.map((item) => {
      const timeLabel = item.time.split(' ')[1] || item.time.split('T')[0];
      return {
        time: timeLabel,
        rsi: item.rsi,
      };
    });
  }, [rsiData]);

  const currentRSI = chartData[chartData.length - 1]?.rsi || 50;
  const rsiStatus = currentRSI >= 70 ? 'overbought' : currentRSI <= 30 ? 'oversold' : 'neutral';

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
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-foreground">{currentRSI.toFixed(1)}</span>
          <span className={`text-sm font-medium px-2 py-0.5 rounded ${
            rsiStatus === 'overbought' ? 'bg-red-500/20 text-red-400' :
            rsiStatus === 'oversold' ? 'bg-green-500/20 text-green-400' :
            'bg-muted text-muted-foreground'
          }`}>
            {rsiStatus === 'overbought' ? 'Sobrecompra' :
             rsiStatus === 'oversold' ? 'Sobreventa' : 'Neutral'}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">Período 14 • Datos en tiempo real</span>
      </div>
      
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="rsiGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
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
              domain={[0, 100]}
              ticks={[0, 30, 50, 70, 100]}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
              width={35}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: number) => [value?.toFixed(2), 'RSI']}
            />
            <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" />
            <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="3 3" />
            <ReferenceLine y={50} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" opacity={0.5} />
            <Area
              type="monotone"
              dataKey="rsi"
              stroke="transparent"
              fill="url(#rsiGradient)"
            />
            <Line
              type="monotone"
              dataKey="rsi"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
              name="RSI"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}