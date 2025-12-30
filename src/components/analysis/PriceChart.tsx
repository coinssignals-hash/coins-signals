import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts';

interface PriceChartProps {
  pair: string;
  timeframe: string;
}

// Generate mock price data with moving averages
const generatePriceData = (pair: string, timeframe: string) => {
  const basePrice = pair === 'EUR/USD' ? 1.0850 : 
                    pair === 'GBP/USD' ? 1.2650 :
                    pair === 'USD/JPY' ? 149.50 :
                    pair === 'USD/CHF' ? 0.8820 :
                    pair === 'AUD/USD' ? 0.6550 :
                    pair === 'USD/CAD' ? 1.3650 :
                    pair === 'NZD/USD' ? 0.6120 : 0.8580;
  
  const volatility = basePrice * 0.002;
  const points = 50;
  const data = [];
  
  let price = basePrice;
  const prices: number[] = [];
  
  for (let i = 0; i < points; i++) {
    const change = (Math.random() - 0.48) * volatility;
    price = price + change;
    prices.push(price);
    
    // Calculate moving averages
    const sma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / Math.min(prices.length, 20);
    const sma50 = prices.slice(-50).reduce((a, b) => a + b, 0) / Math.min(prices.length, 50);
    
    // EMA 200 approximation
    const ema200 = basePrice + (price - basePrice) * 0.3;
    
    data.push({
      time: `${i}:00`,
      price: parseFloat(price.toFixed(5)),
      sma20: parseFloat(sma20.toFixed(5)),
      sma50: parseFloat(sma50.toFixed(5)),
      ema200: parseFloat(ema200.toFixed(5)),
    });
  }
  
  return data;
};

export function PriceChart({ pair, timeframe }: PriceChartProps) {
  const data = useMemo(() => generatePriceData(pair, timeframe), [pair, timeframe]);
  
  const minPrice = Math.min(...data.map(d => Math.min(d.price, d.sma20, d.sma50, d.ema200)));
  const maxPrice = Math.max(...data.map(d => Math.max(d.price, d.sma20, d.sma50, d.ema200)));
  const padding = (maxPrice - minPrice) * 0.1;

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
          />
          <Line
            type="monotone"
            dataKey="sma50"
            stroke="#eab308"
            strokeWidth={1.5}
            dot={false}
            name="SMA 50"
          />
          <Line
            type="monotone"
            dataKey="ema200"
            stroke="#a855f7"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="5 5"
            name="EMA 200"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}