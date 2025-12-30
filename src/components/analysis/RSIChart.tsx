import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts';

interface RSIChartProps {
  pair: string;
  timeframe: string;
}

// Generate mock RSI data
const generateRSIData = (pair: string, timeframe: string) => {
  const points = 50;
  const data = [];
  
  let rsi = 50 + (Math.random() - 0.5) * 20;
  
  for (let i = 0; i < points; i++) {
    const change = (Math.random() - 0.5) * 8;
    rsi = Math.max(10, Math.min(90, rsi + change));
    
    data.push({
      time: `${i}:00`,
      rsi: parseFloat(rsi.toFixed(2)),
    });
  }
  
  return data;
};

export function RSIChart({ pair, timeframe }: RSIChartProps) {
  const data = useMemo(() => generateRSIData(pair, timeframe), [pair, timeframe]);
  
  const currentRSI = data[data.length - 1]?.rsi || 50;
  const rsiStatus = currentRSI >= 70 ? 'overbought' : currentRSI <= 30 ? 'oversold' : 'neutral';

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
        <span className="text-xs text-muted-foreground">Período 14</span>
      </div>
      
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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