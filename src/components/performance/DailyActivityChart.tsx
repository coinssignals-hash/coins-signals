import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Line, ComposedChart } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Activity, Globe } from 'lucide-react';

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
}

export function DailyActivityChart({ data, sessions }: DailyActivityChartProps) {
  const maxPips = Math.max(...data.map(d => d.pips), 1);

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Actividad Diaria</h3>
        </div>
        
        <div className="flex gap-4">
          {/* Chart */}
          <div className="flex-1 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data}>
                <defs>
                  <linearGradient id="perfBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.9}/>
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="day" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Bar dataKey="pips" radius={[4, 4, 0, 0]} maxBarSize={28}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="url(#perfBarGradient)" />
                  ))}
                </Bar>
                <Line 
                  type="monotone" 
                  dataKey="pips" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--chart-2))', r: 3, stroke: 'hsl(var(--background))', strokeWidth: 1 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Session Stats */}
          <div className="w-28 space-y-2">
            <div className="flex items-center gap-1 mb-1">
              <Globe className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Sesiones</span>
            </div>
            {sessions.map((session) => (
              <div key={session.name} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{session.name}</span>
                  <span className={`text-[10px] font-bold tabular-nums ${session.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {session.isPositive ? '+' : ''}{session.pips}p
                  </span>
                </div>
                <div className="h-1 rounded-full bg-secondary/60 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ${session.isPositive ? 'bg-emerald-400/60' : 'bg-rose-400/60'}`}
                    style={{ width: `${Math.min((Math.abs(session.pips) / Math.max(maxPips, 1)) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}