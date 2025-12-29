import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Line, ComposedChart } from 'recharts';

interface DailyActivityData {
  day: string;
  pips: number;
}

interface SessionData {
  name: string;
  percentage: number;
  pips: number;
  isPositive: boolean;
}

interface DailyActivityChartProps {
  data: DailyActivityData[];
  sessions: SessionData[];
  market: string;
}

export function DailyActivityChart({ data, sessions, market }: DailyActivityChartProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-4">
      <div className="flex items-start justify-between gap-4">
        {/* Chart */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-foreground">Dia Mas Movido en {market}</h3>
            <span className="text-xl font-bold text-green-500 opacity-20">{market.toUpperCase()}</span>
          </div>
          
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={1}/>
                    <stop offset="50%" stopColor="#eab308" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#f97316" stopOpacity={1}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="day" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <Bar dataKey="pips" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="url(#barGradient)" />
                  ))}
                </Bar>
                <Line 
                  type="monotone" 
                  dataKey="pips" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Session Stats */}
        <div className="w-32 space-y-3">
          <h4 className="text-xs text-muted-foreground mb-2">Sesion Mas Movida</h4>
          {sessions.map((session) => (
            <div key={session.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className={session.isPositive ? 'text-green-500' : 'text-red-500'}>
                  {session.name}
                </span>
                <span className={session.isPositive ? 'text-green-500' : 'text-red-500'}>
                  {session.isPositive ? '+' : ''}{session.percentage}%
                </span>
              </div>
              <div className="relative">
                <div className={`text-xs font-bold px-2 py-0.5 rounded ${
                  session.isPositive ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                }`}>
                  {session.isPositive ? '+' : ''}{session.pips} Pips
                </div>
                <div 
                  className={`h-1 rounded mt-1 ${session.isPositive ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(Math.abs(session.pips) / 2, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
