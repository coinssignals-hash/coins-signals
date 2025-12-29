import { ResourceUsage } from '@/types/monitoring';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface ResourceChartProps {
  data: ResourceUsage[];
  type: 'cpu' | 'memory' | 'network';
  title: string;
}

export const ResourceChart = ({ data, type, title }: ResourceChartProps) => {
  const chartData = data.map((item) => ({
    time: format(item.timestamp, 'HH:mm'),
    value: type === 'network' ? item.network.in : item[type],
    value2: type === 'network' ? item.network.out : undefined,
  }));
  
  const colors = {
    cpu: { stroke: 'hsl(142, 76%, 36%)', fill: 'hsl(142, 76%, 36%)' },
    memory: { stroke: 'hsl(221, 83%, 53%)', fill: 'hsl(221, 83%, 53%)' },
    network: { stroke: 'hsl(280, 65%, 60%)', fill: 'hsl(280, 65%, 60%)' },
  };
  
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`gradient-${type}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors[type].fill} stopOpacity={0.3} />
                <stop offset="100%" stopColor={colors[type].fill} stopOpacity={0} />
              </linearGradient>
              {type === 'network' && (
                <linearGradient id="gradient-network-out" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0} />
                </linearGradient>
              )}
            </defs>
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}${type === 'network' ? 'KB' : '%'}`}
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
              dataKey="value"
              stroke={colors[type].stroke}
              fill={`url(#gradient-${type})`}
              strokeWidth={2}
              name={type === 'network' ? 'In' : title}
            />
            {type === 'network' && (
              <Area
                type="monotone"
                dataKey="value2"
                stroke="hsl(25, 95%, 53%)"
                fill="url(#gradient-network-out)"
                strokeWidth={2}
                name="Out"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
