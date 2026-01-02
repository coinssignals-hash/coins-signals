import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ComposedChart, Line, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface BollingerChartProps {
  pair: string;
  timeframe: string;
  priceData?: Array<{ time: string; price: number; high: number; low: number; open: number }>;
  loading?: boolean;
  error?: string | null;
}

// Calculate Bollinger Bands from price data
const calculateBollingerBands = (prices: number[], period: number = 20, multiplier: number = 2) => {
  if (prices.length < period) return null;
  
  const sma = prices.slice(-period).reduce((a, b) => a + b, 0) / period;
  const squaredDiffs = prices.slice(-period).map(p => Math.pow(p - sma, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
  const stdDev = Math.sqrt(variance);
  
  return {
    upper: sma + (multiplier * stdDev),
    middle: sma,
    lower: sma - (multiplier * stdDev),
  };
};

export function BollingerChart({ pair, timeframe, priceData, loading, error }: BollingerChartProps) {
  const chartData = useMemo(() => {
    if (!priceData || priceData.length === 0) {
      // Generate mock data
      const basePrice = 1.1689;
      return Array.from({ length: 30 }, (_, i) => {
        const variance = Math.sin(i * 0.3) * 0.005;
        const price = basePrice + variance + (Math.random() - 0.5) * 0.002;
        return {
          time: `${i}h`,
          price,
          upper: price + 0.008 + Math.random() * 0.002,
          middle: price + 0.002,
          lower: price - 0.006 - Math.random() * 0.002,
        };
      });
    }

    const prices = priceData.map(p => p.price);
    return priceData.map((p, i) => {
      const pricesUpToNow = prices.slice(0, i + 1);
      const bands = calculateBollingerBands(pricesUpToNow, 20, 2);
      const date = new Date(p.time);
      return {
        time: `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`,
        price: p.price,
        upper: bands?.upper || p.price + 0.005,
        middle: bands?.middle || p.price,
        lower: bands?.lower || p.price - 0.005,
      };
    });
  }, [priceData]);

  // Calculate current position relative to bands
  const currentPosition = useMemo(() => {
    if (chartData.length === 0) return { status: 'neutral', percent: 50 };
    const latest = chartData[chartData.length - 1];
    const range = latest.upper - latest.lower;
    const position = ((latest.price - latest.lower) / range) * 100;
    
    let status: 'overbought' | 'oversold' | 'neutral' = 'neutral';
    if (position > 80) status = 'overbought';
    else if (position < 20) status = 'oversold';
    
    return { status, percent: Math.round(position) };
  }, [chartData]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-center h-[200px]">
          <Loader2 className="h-6 w-6 animate-spin text-green-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[200px] text-red-400">
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Status indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Bollinger Bands</span>
          <span className={`text-xs px-2 py-0.5 rounded ${
            currentPosition.status === 'overbought' 
              ? 'bg-red-500/20 text-red-400' 
              : currentPosition.status === 'oversold'
              ? 'bg-green-500/20 text-green-400'
              : 'bg-gray-500/20 text-gray-400'
          }`}>
            {currentPosition.status === 'overbought' ? 'Sobrecompra' : 
             currentPosition.status === 'oversold' ? 'Sobreventa' : 'Neutral'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {currentPosition.status === 'overbought' && <TrendingDown className="w-4 h-4 text-red-400" />}
          {currentPosition.status === 'oversold' && <TrendingUp className="w-4 h-4 text-green-400" />}
          {currentPosition.status === 'neutral' && <Minus className="w-4 h-4 text-gray-400" />}
          <span className="text-sm font-medium text-white">{currentPosition.percent}%</span>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={chartData}>
          <defs>
            <linearGradient id="bollingerGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="time" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#6b7280' }}
            interval="preserveStartEnd"
          />
          <YAxis 
            domain={['auto', 'auto']} 
            axisLine={false} 
            tickLine={false}
            tick={{ fontSize: 10, fill: '#6b7280' }}
            tickFormatter={(v) => v.toFixed(4)}
            width={55}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a2e',
              border: '1px solid #374151',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value: number, name: string) => [
              value.toFixed(5),
              name === 'price' ? 'Precio' : 
              name === 'upper' ? 'Banda Superior' :
              name === 'lower' ? 'Banda Inferior' : 'SMA'
            ]}
          />
          {/* Bollinger band area */}
          <Area
            type="monotone"
            dataKey="upper"
            stroke="none"
            fill="url(#bollingerGradient)"
            fillOpacity={1}
          />
          <Area
            type="monotone"
            dataKey="lower"
            stroke="none"
            fill="#0a1a0a"
            fillOpacity={1}
          />
          {/* Band lines */}
          <Line type="monotone" dataKey="upper" stroke="#3b82f6" strokeWidth={1} dot={false} strokeDasharray="4 2" />
          <Line type="monotone" dataKey="middle" stroke="#6b7280" strokeWidth={1} dot={false} strokeDasharray="2 2" />
          <Line type="monotone" dataKey="lower" stroke="#3b82f6" strokeWidth={1} dot={false} strokeDasharray="4 2" />
          {/* Price line */}
          <Line type="monotone" dataKey="price" stroke="#22c55e" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
