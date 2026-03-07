import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';
import { SignalStyleCard } from '@/components/ui/signal-style-card';
import { type SignalData } from './SignalsList';
import { formatPrice } from '@/lib/utils';
import { Clock, DollarSign } from 'lucide-react';

interface SignalDetailViewProps {
  signal: SignalData;
}

const generateChartData = (entryPrice: number, takeProfit: number, stopLoss: number) => {
  const data = [];
  const range = takeProfit - stopLoss;
  for (let i = 0; i < 24; i++) {
    const variation = (Math.random() - 0.5) * range * 0.3;
    const trend = i < 12 ? (i / 12) * (takeProfit - entryPrice) : (takeProfit - entryPrice);
    data.push({
      time: `${(i + 1).toString().padStart(2, '0')}:00`,
      price: entryPrice + trend + variation,
    });
  }
  return data;
};

export function SignalDetailView({ signal }: SignalDetailViewProps) {
  const chartData = generateChartData(signal.entryPrice, signal.takeProfit, signal.stopLoss);

  return (
    <div className="mt-1">
      <SignalStyleCard className="p-3">
        {/* Chart */}
        <div className="h-40 rounded-lg overflow-hidden mb-3" style={{ background: 'hsla(var(--muted)/0.15)' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="detailColorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(150, 60%, 50%)" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="hsl(150, 60%, 50%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="time" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                axisLine={false} tickLine={false}
                interval={5}
              />
              <YAxis 
                domain={[signal.stopLoss * 0.999, signal.takeProfit * 1.001]}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                axisLine={false} tickLine={false}
                orientation="right"
                tickFormatter={(v) => formatPrice(v, signal.currencyPair)}
              />
              <ReferenceLine y={signal.takeProfit} stroke="hsl(150, 60%, 50%)" strokeDasharray="3 3" strokeOpacity={0.6} />
              <ReferenceLine y={signal.entryPrice} stroke="hsl(210, 80%, 60%)" strokeDasharray="3 3" strokeOpacity={0.6} />
              <ReferenceLine y={signal.stopLoss} stroke="hsl(0, 60%, 50%)" strokeDasharray="3 3" strokeOpacity={0.6} />
              <Area type="monotone" dataKey="price" stroke="hsl(150, 60%, 50%)" strokeWidth={1.5} fillOpacity={1} fill="url(#detailColorPrice)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg p-2.5" style={{ background: 'hsla(var(--muted)/0.15)' }}>
            <div className="flex items-center gap-1 mb-1.5">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Tiempo</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              <div>
                <span className="text-muted-foreground">Señal</span>
                <p className="text-blue-400 font-bold tabular-nums">{signal.signalTime}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Final</span>
                <p className="text-amber-400 font-bold tabular-nums">{signal.endTime}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Ejecución</span>
                <p className="text-blue-400 font-bold tabular-nums">{signal.executionTime}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Duración</span>
                <p className="text-amber-400 font-bold tabular-nums">{signal.totalOperationTime}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg p-2.5" style={{ background: 'hsla(var(--muted)/0.15)' }}>
            <div className="flex items-center gap-1 mb-1.5">
              <DollarSign className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Precios</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              <div>
                <span className="text-muted-foreground">Entrada</span>
                <p className="text-blue-400 font-bold tabular-nums">{formatPrice(signal.entryPrice, signal.currencyPair)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">TP</span>
                <p className="text-emerald-400 font-bold tabular-nums">{formatPrice(signal.takeProfit, signal.currencyPair)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">SL</span>
                <p className="text-rose-400 font-bold tabular-nums">{formatPrice(signal.stopLoss, signal.currencyPair)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Pips</span>
                <p className={`font-bold tabular-nums ${signal.pips >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {signal.pips >= 0 ? '+' : ''}{Math.abs(signal.pips)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </SignalStyleCard>
    </div>
  );
}
