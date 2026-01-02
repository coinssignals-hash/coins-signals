import { ComposedChart, Bar, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface CandlestickChartProps {
  data: CandleData[];
  resistance: number;
  support: number;
  loading?: boolean;
  realtimePrice?: number | null;
  isRealtimeConnected?: boolean;
}

// Custom label for realtime price
const RealtimePriceLabel = ({ viewBox, value, isConnected }: { viewBox: any; value: number; isConnected: boolean }) => {
  const { y } = viewBox;
  return (
    <g>
      <rect
        x={-75}
        y={y - 10}
        width={70}
        height={20}
        rx={4}
        fill={isConnected ? "#22c55e" : "#3b82f6"}
        className={isConnected ? "animate-pulse" : ""}
      />
      <text
        x={-40}
        y={y + 4}
        fill="white"
        textAnchor="middle"
        fontSize={10}
        fontWeight="bold"
      >
        {isConnected ? "🔴 " : ""}{value?.toFixed(4)}
      </text>
    </g>
  );
};

export function CandlestickChart({ 
  data, 
  resistance, 
  support, 
  loading,
  realtimePrice,
  isRealtimeConnected = false
}: CandlestickChartProps) {
  if (loading) {
    return (
      <div className="bg-[#0a1a0a] border border-green-900/50 rounded-lg p-4 animate-pulse">
        <div className="h-64 bg-green-900/20 rounded"></div>
      </div>
    );
  }

  // Transform data for candlestick-like visualization
  const chartData = data.map((candle) => {
    const isUp = candle.close >= candle.open;
    return {
      ...candle,
      displayTime: candle.time.split(' ')[1]?.substring(0, 5) || candle.time.substring(11, 16),
      body: Math.abs(candle.close - candle.open),
      bodyBase: Math.min(candle.open, candle.close),
      wickHigh: candle.high,
      wickLow: candle.low,
      fill: isUp ? '#22c55e' : '#ef4444',
      isUp,
    };
  });

  const allPrices = data.flatMap(d => [d.high, d.low]);
  if (realtimePrice) allPrices.push(realtimePrice);
  const minPrice = Math.min(...allPrices, support) - 0.001;
  const maxPrice = Math.max(...allPrices, resistance) + 0.001;

  return (
    <div className="bg-[#0a1a0a] border border-green-900/50 rounded-lg p-4 relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Resistencia y Soporte día Anterior</h3>
        
        {/* Realtime indicator */}
        {isRealtimeConnected && realtimePrice && (
          <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-xs text-green-400 font-medium">LIVE: {realtimePrice.toFixed(5)}</span>
          </div>
        )}
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 60, left: 10, bottom: 0 }}>
            <XAxis 
              dataKey="displayTime" 
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              axisLine={{ stroke: '#374151' }}
              tickLine={false}
            />
            <YAxis 
              domain={[minPrice, maxPrice]}
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              axisLine={{ stroke: '#374151' }}
              tickLine={false}
              tickFormatter={(value) => value.toFixed(3)}
              orientation="left"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a2e',
                border: '1px solid #22c55e',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#9ca3af' }}
              formatter={(value: number) => [value.toFixed(5), '']}
            />
            
            {/* Realtime price line - pulsating */}
            {realtimePrice && (
              <ReferenceLine 
                y={realtimePrice} 
                stroke={isRealtimeConnected ? "#22c55e" : "#3b82f6"}
                strokeWidth={2}
                strokeDasharray={isRealtimeConnected ? "0" : "5 5"}
                label={{ 
                  value: `${isRealtimeConnected ? '● LIVE ' : ''}${realtimePrice.toFixed(4)}`, 
                  position: 'right',
                  fill: isRealtimeConnected ? '#22c55e' : '#3b82f6',
                  fontSize: 10,
                  fontWeight: 'bold'
                }}
              />
            )}
            
            {/* Resistance line */}
            <ReferenceLine 
              y={resistance} 
              stroke="#ef4444" 
              strokeDasharray="5 5"
              label={{ 
                value: `Resistencia`, 
                position: 'right',
                fill: '#ef4444',
                fontSize: 10
              }}
            />
            
            {/* Support line */}
            <ReferenceLine 
              y={support} 
              stroke="#22c55e" 
              strokeDasharray="5 5"
              label={{ 
                value: `Soporte`, 
                position: 'right',
                fill: '#22c55e',
                fontSize: 10
              }}
            />

            {/* Candlestick bodies */}
            <Bar
              dataKey="body"
              stackId="candle"
              fill="#22c55e"
              barSize={8}
            />
            
            {/* Price line */}
            <Line
              type="monotone"
              dataKey="close"
              stroke="#3b82f6"
              strokeWidth={1}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex justify-between mt-2 text-xs flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-red-500"></div>
            <span className="text-red-400">Resistencia {resistance.toFixed(4)}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-green-500"></div>
            <span className="text-green-400">Soporte {support.toFixed(4)}</span>
          </div>
        </div>
        {realtimePrice && (
          <div className="flex items-center gap-1">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isRealtimeConnected ? "bg-green-500 animate-pulse" : "bg-blue-500"
            )}></div>
            <span className={isRealtimeConnected ? "text-green-400" : "text-blue-400"}>
              Precio Actual {realtimePrice.toFixed(4)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
