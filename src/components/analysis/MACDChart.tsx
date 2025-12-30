import { useMemo } from 'react';
import { BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, ReferenceLine, Cell } from 'recharts';

interface MACDChartProps {
  pair: string;
  timeframe: string;
}

// Generate mock MACD data
const generateMACDData = (pair: string, timeframe: string) => {
  const points = 50;
  const data = [];
  
  let macdLine = (Math.random() - 0.5) * 0.002;
  let signalLine = macdLine * 0.8;
  
  for (let i = 0; i < points; i++) {
    const macdChange = (Math.random() - 0.5) * 0.0004;
    macdLine = macdLine + macdChange;
    
    // Signal line follows MACD with lag
    signalLine = signalLine + (macdLine - signalLine) * 0.2;
    
    const histogram = macdLine - signalLine;
    
    data.push({
      time: `${i}:00`,
      macd: parseFloat((macdLine * 1000).toFixed(3)),
      signal: parseFloat((signalLine * 1000).toFixed(3)),
      histogram: parseFloat((histogram * 1000).toFixed(3)),
    });
  }
  
  return data;
};

export function MACDChart({ pair, timeframe }: MACDChartProps) {
  const data = useMemo(() => generateMACDData(pair, timeframe), [pair, timeframe]);
  
  const currentMACD = data[data.length - 1];
  const trend = currentMACD?.macd > currentMACD?.signal ? 'bullish' : 'bearish';
  const crossover = data.length > 1 && 
    ((data[data.length - 2].macd < data[data.length - 2].signal && currentMACD.macd > currentMACD.signal) ||
     (data[data.length - 2].macd > data[data.length - 2].signal && currentMACD.macd < currentMACD.signal));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <span className="text-xs text-muted-foreground">MACD: </span>
            <span className="text-sm font-semibold text-blue-400">{currentMACD?.macd.toFixed(3)}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Signal: </span>
            <span className="text-sm font-semibold text-orange-400">{currentMACD?.signal.toFixed(3)}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Hist: </span>
            <span className={`text-sm font-semibold ${currentMACD?.histogram >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {currentMACD?.histogram.toFixed(3)}
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
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="time" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
              width={45}
              tickFormatter={(value) => value.toFixed(2)}
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
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
            <Bar dataKey="histogram" name="Histograma">
              {data.map((entry, index) => (
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