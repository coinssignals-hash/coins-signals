import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';

interface MarketSentimentProps {
  bullish: number;
  neutral: number;
  bearish: number;
  highPrice: number;
  lowPrice: number;
  dailyChange: number;
  pipsChange: number;
  loading?: boolean;
}

export function MarketSentiment({
  bullish,
  neutral,
  bearish,
  highPrice,
  lowPrice,
  dailyChange,
  pipsChange,
  loading
}: MarketSentimentProps) {
  const data = [
    { name: 'Alcista', value: bullish, color: '#22c55e' },
    { name: 'Neutro', value: neutral, color: '#eab308' },
    { name: 'Bajista', value: bearish, color: '#ef4444' },
  ];

  if (loading) {
    return (
      <div className="bg-[#0a1a0a] border border-green-900/50 rounded-lg p-4 animate-pulse">
        <div className="h-32 bg-green-900/20 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#0a1a0a] border border-green-900/50 rounded-lg p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Sentiment Chart */}
        <div>
          <h3 className="text-center text-white font-semibold mb-2">Sentimiento del Mercado</h3>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="horizontal">
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide domain={[0, 100]} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-around mt-2">
            {data.map((item) => (
              <div key={item.name} className="text-center">
                <div className="text-xs text-gray-400">{item.name}</div>
                <div className="font-bold" style={{ color: item.color }}>{item.value}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Price Stats */}
        <div className="space-y-3">
          <div>
            <span className="text-gray-400 text-sm">Precio Máximo Del Día</span>
            <div className="text-green-400 text-2xl font-bold font-mono">{highPrice.toFixed(4)}</div>
          </div>
          <div>
            <span className="text-gray-400 text-sm">Precio Mínimo Del Día</span>
            <div className="text-red-400 text-2xl font-bold font-mono">{lowPrice.toFixed(4)}</div>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <span className="text-gray-400 text-xs">Valoración Del Día</span>
              <div className={`text-lg font-bold ${dailyChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {dailyChange >= 0 ? '+' : ''}{dailyChange.toFixed(2)}
              </div>
            </div>
            <div>
              <span className="text-gray-400 text-xs">Pips</span>
              <div className={`text-lg font-bold ${pipsChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {pipsChange >= 0 ? '+' : ''}{pipsChange.toFixed(4)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
