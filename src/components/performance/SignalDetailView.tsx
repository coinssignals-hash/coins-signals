import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';
import { type SignalData } from './SignalsList';
import { formatPrice } from '@/lib/utils';

interface SignalDetailViewProps {
  signal: SignalData;
}

// Mock chart data for candlestick visualization
const generateChartData = (entryPrice: number, takeProfit: number, stopLoss: number) => {
  const data = [];
  const range = takeProfit - stopLoss;
  const mid = (takeProfit + stopLoss) / 2;
  
  for (let i = 0; i < 24; i++) {
    const variation = (Math.random() - 0.5) * range * 0.3;
    const trend = i < 12 ? (i / 12) * (takeProfit - entryPrice) : (takeProfit - entryPrice);
    data.push({
      time: `${(i + 1).toString().padStart(2, '0')}:00`,
      price: entryPrice + trend + variation,
      high: entryPrice + trend + Math.abs(variation) + range * 0.05,
      low: entryPrice + trend - Math.abs(variation) - range * 0.05,
    });
  }
  return data;
};

export function SignalDetailView({ signal }: SignalDetailViewProps) {
  const chartData = generateChartData(signal.entryPrice, signal.takeProfit, signal.stopLoss);

  return (
    <div className="mt-2 bg-card border border-border rounded-lg p-4 animate-fade-in">
      {/* Chart */}
      <div className="bg-background rounded-lg p-2 mb-4 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="time" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              domain={[signal.stopLoss * 0.999, signal.takeProfit * 1.001]}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              orientation="right"
              tickFormatter={(value) => formatPrice(value, signal.currencyPair)}
            />
            <ReferenceLine 
              y={signal.takeProfit} 
              stroke="#22c55e" 
              strokeDasharray="3 3"
              label={{ value: formatPrice(signal.takeProfit, signal.currencyPair), position: 'right', fill: '#22c55e', fontSize: 10 }}
            />
            <ReferenceLine 
              y={signal.entryPrice} 
              stroke="#3b82f6" 
              strokeDasharray="3 3"
              label={{ value: formatPrice(signal.entryPrice, signal.currencyPair), position: 'right', fill: '#3b82f6', fontSize: 10 }}
            />
            <ReferenceLine 
              y={signal.stopLoss} 
              stroke="#ef4444" 
              strokeDasharray="3 3"
              label={{ value: formatPrice(signal.stopLoss, signal.currencyPair), position: 'right', fill: '#ef4444', fontSize: 10 }}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke="#22c55e" 
              fillOpacity={1}
              fill="url(#colorPrice)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Signal Details */}
      <div className="grid grid-cols-2 gap-4">
        {/* Time Info */}
        <div className="bg-secondary/30 rounded-lg p-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Hora De la Señal</span>
              <p className="text-blue-400 font-bold">{signal.signalTime}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Hora De Finalización</span>
              <p className="text-amber-400 font-bold">{signal.endTime}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Hora De Ejecución</span>
              <p className="text-blue-400 font-bold">{signal.executionTime}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Hora Total de Operación</span>
              <p className="text-amber-400 font-bold">{signal.totalOperationTime}</p>
            </div>
          </div>
        </div>

        {/* Price Info */}
        <div className="bg-secondary/30 rounded-lg p-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Entrada Sugerida</span>
              <p className="text-blue-400 font-bold font-mono-numbers">{formatPrice(signal.entryPrice, signal.pair)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Take Profit</span>
              <p className="text-green-500 font-bold font-mono-numbers">{formatPrice(signal.takeProfit, signal.pair)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Pips Promedios</span>
              <p className="text-blue-400 font-bold font-mono-numbers">+{Math.abs(signal.pips)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Take Profit</span>
              <p className="text-green-500 font-bold font-mono-numbers">{formatPrice(signal.takeProfit - 0.4, signal.pair)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
