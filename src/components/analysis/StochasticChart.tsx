import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ComposedChart, Line, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StochasticChartProps {
  pair: string;
  timeframe: string;
  priceData?: Array<{ time: string; price: number; high: number; low: number; open: number }>;
  loading?: boolean;
  error?: string | null;
}

// Calculate Stochastic Oscillator
const calculateStochastic = (
  prices: Array<{ high: number; low: number; close: number }>,
  kPeriod: number = 14,
  dPeriod: number = 3
) => {
  if (prices.length < kPeriod) return null;

  const recentPrices = prices.slice(-kPeriod);
  const highestHigh = Math.max(...recentPrices.map(p => p.high));
  const lowestLow = Math.min(...recentPrices.map(p => p.low));
  const currentClose = prices[prices.length - 1].close;

  const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
  
  return { k: isNaN(k) ? 50 : k };
};

export function StochasticChart({ pair, timeframe, priceData, loading, error }: StochasticChartProps) {
  const chartData = useMemo(() => {
    if (!priceData || priceData.length === 0) {
      // Generate mock data
      return Array.from({ length: 30 }, (_, i) => {
        const k = 30 + Math.sin(i * 0.4) * 35 + Math.random() * 10;
        const d = 30 + Math.sin((i - 3) * 0.4) * 35 + Math.random() * 5;
        return {
          time: `${i}h`,
          k: Math.max(0, Math.min(100, k)),
          d: Math.max(0, Math.min(100, d)),
        };
      });
    }

    // Calculate stochastic for each point
    const kValues: number[] = [];
    return priceData.map((p, i) => {
      const dataUpToNow = priceData.slice(0, i + 1).map(d => ({
        high: d.high,
        low: d.low,
        close: d.price,
      }));
      const stoch = calculateStochastic(dataUpToNow, 14, 3);
      const k = stoch?.k || 50;
      kValues.push(k);
      
      // Calculate %D as 3-period SMA of %K
      const dPeriod = Math.min(3, kValues.length);
      const d = kValues.slice(-dPeriod).reduce((a, b) => a + b, 0) / dPeriod;

      const date = new Date(p.time);
      return {
        time: `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`,
        k: Math.round(k * 10) / 10,
        d: Math.round(d * 10) / 10,
      };
    });
  }, [priceData]);

  // Determine current stochastic status
  const currentStatus = useMemo(() => {
    if (chartData.length === 0) return { status: 'neutral', k: 50, d: 50, signal: 'hold' };
    
    const latest = chartData[chartData.length - 1];
    const prev = chartData[chartData.length - 2] || latest;
    
    let status: 'overbought' | 'oversold' | 'neutral' = 'neutral';
    let signal: 'buy' | 'sell' | 'hold' = 'hold';
    
    if (latest.k > 80) status = 'overbought';
    else if (latest.k < 20) status = 'oversold';
    
    // Crossover signals
    if (prev.k < prev.d && latest.k > latest.d && latest.k < 30) signal = 'buy';
    else if (prev.k > prev.d && latest.k < latest.d && latest.k > 70) signal = 'sell';
    
    return { status, k: latest.k, d: latest.d, signal };
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
          <span className="text-sm text-gray-400">Estocástico (14,3,3)</span>
          <span className={`text-xs px-2 py-0.5 rounded ${
            currentStatus.status === 'overbought' 
              ? 'bg-red-500/20 text-red-400' 
              : currentStatus.status === 'oversold'
              ? 'bg-green-500/20 text-green-400'
              : 'bg-gray-500/20 text-gray-400'
          }`}>
            {currentStatus.status === 'overbought' ? 'Sobrecompra' : 
             currentStatus.status === 'oversold' ? 'Sobreventa' : 'Neutral'}
          </span>
          {currentStatus.signal !== 'hold' && (
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${
              currentStatus.signal === 'buy' 
                ? 'bg-green-500/30 text-green-300' 
                : 'bg-red-500/30 text-red-300'
            }`}>
              {currentStatus.signal === 'buy' ? '↑ Compra' : '↓ Venta'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-purple-400">%K: {currentStatus.k.toFixed(1)}</span>
          <span className="text-orange-400">%D: {currentStatus.d.toFixed(1)}</span>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={chartData}>
          <defs>
            <linearGradient id="stochOverbought" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="stochOversold" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
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
            domain={[0, 100]} 
            axisLine={false} 
            tickLine={false}
            tick={{ fontSize: 10, fill: '#6b7280' }}
            ticks={[0, 20, 50, 80, 100]}
            width={30}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a2e',
              border: '1px solid #374151',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value: number, name: string) => [
              value.toFixed(1),
              name === 'k' ? '%K' : '%D'
            ]}
          />
          {/* Overbought/Oversold zones */}
          <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.5} />
          <ReferenceLine y={20} stroke="#22c55e" strokeDasharray="3 3" strokeOpacity={0.5} />
          <ReferenceLine y={50} stroke="#6b7280" strokeDasharray="2 2" strokeOpacity={0.3} />
          {/* Stochastic lines */}
          <Line type="monotone" dataKey="k" stroke="#a855f7" strokeWidth={2} dot={false} name="k" />
          <Line type="monotone" dataKey="d" stroke="#f97316" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="d" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
