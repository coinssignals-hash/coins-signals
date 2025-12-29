import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';

interface CurrencyPairCardProps {
  pair: string;
  currentPrice: number;
  change: number;
  highPrice: number;
  lowPrice: number;
}

const flagMap: Record<string, string> = {
  'EUR': '🇪🇺',
  'USD': '🇺🇸',
  'GBP': '🇬🇧',
  'JPY': '🇯🇵',
  'AUD': '🇦🇺',
  'CAD': '🇨🇦',
  'CHF': '🇨🇭',
  'NZD': '🇳🇿',
};

// Generate mock chart data
const generateChartData = (basePrice: number, isUp: boolean) => {
  const data = [];
  for (let i = 0; i < 12; i++) {
    const trend = isUp ? i * 0.001 : -i * 0.001;
    const variation = (Math.random() - 0.5) * 0.01;
    data.push({
      time: i,
      price: basePrice + trend + variation,
    });
  }
  return data;
};

export function CurrencyPairCard({ pair, currentPrice, change, highPrice, lowPrice }: CurrencyPairCardProps) {
  const currencies = pair.split(' ');
  const flag1 = flagMap[currencies[0]] || '🏳️';
  const flag2 = flagMap[currencies[1]] || '🏳️';
  const isUp = change >= 0;
  const chartData = generateChartData(currentPrice, isUp);

  return (
    <div className="bg-card border border-border rounded-lg p-3 flex-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="flex">
            <span className="text-xl">{flag1}</span>
            <span className="text-xl -ml-1">{flag2}</span>
          </div>
          <div>
            <div className="text-sm font-bold text-foreground">{pair}</div>
            <div className="text-xs text-muted-foreground font-mono-numbers">{currentPrice.toFixed(4)}</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className={`text-lg ${isUp ? 'text-green-500' : 'text-red-500'}`}>
            {isUp ? '📈' : '📉'}
          </div>
          <span className={`text-sm font-bold font-mono-numbers ${isUp ? 'text-green-500' : 'text-red-500'}`}>
            {isUp ? '+' : ''}{change}
          </span>
        </div>
        <div className="text-right text-xs">
          <div className="text-muted-foreground">Alto Alcanzado</div>
          <div className="text-green-500 font-bold font-mono-numbers">{highPrice.toFixed(4)}</div>
          <div className="text-muted-foreground mt-1">Bajo Alcanzado</div>
          <div className="text-red-500 font-bold font-mono-numbers">{lowPrice.toFixed(4)}</div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-24 bg-background rounded">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`gradient-${pair}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isUp ? '#22c55e' : '#ef4444'} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={isUp ? '#22c55e' : '#ef4444'} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis hide />
            <YAxis hide domain={['dataMin', 'dataMax']} />
            <ReferenceLine 
              y={highPrice} 
              stroke="#22c55e" 
              strokeDasharray="2 2"
              label={{ value: 'Resistencia', position: 'left', fill: '#22c55e', fontSize: 8 }}
            />
            <ReferenceLine 
              y={lowPrice} 
              stroke="#ef4444" 
              strokeDasharray="2 2"
              label={{ value: 'Soporte', position: 'left', fill: '#ef4444', fontSize: 8 }}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke={isUp ? '#22c55e' : '#ef4444'}
              fillOpacity={1}
              fill={`url(#gradient-${pair})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Labels */}
      <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
        <span>Resistencia y Soporte de la Semana</span>
        <span className="font-mono-numbers">{lowPrice.toFixed(4)}</span>
      </div>
    </div>
  );
}
