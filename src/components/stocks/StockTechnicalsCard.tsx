import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  data: any;
  loading: boolean;
  currentPrice?: number;
}

function IndicatorGauge({ label, value, min, max, zones }: {
  label: string; value: number; min: number; max: number;
  zones: { from: number; to: number; color: string; label: string }[];
}) {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const activeZone = zones.find(z => value >= z.from && value <= z.to);

  return (
    <div className="bg-secondary/50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{label}</span>
        <span className="text-sm font-mono font-bold text-foreground">{value.toFixed(1)}</span>
      </div>
      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
        {zones.map((z, i) => (
          <div
            key={i}
            className="absolute top-0 h-full opacity-30"
            style={{
              left: `${((z.from - min) / (max - min)) * 100}%`,
              width: `${((z.to - z.from) / (max - min)) * 100}%`,
              backgroundColor: z.color,
            }}
          />
        ))}
        <div
          className="absolute top-0 h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: activeZone?.color || 'hsl(200, 80%, 50%)' }}
        />
      </div>
      {activeZone && (
        <p className="text-[10px] font-medium mt-1" style={{ color: activeZone.color }}>
          {activeZone.label}
        </p>
      )}
    </div>
  );
}

function MiniChart({ data, dataKey, color, label }: { data: any[]; dataKey: string; color: string; label: string }) {
  if (!data?.length) return null;
  const chartData = [...data].reverse().slice(-20);

  return (
    <div className="bg-secondary/50 rounded-lg p-3">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2">{label}</p>
      <ResponsiveContainer width="100%" height={60}>
        <LineChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs font-mono font-semibold text-foreground mt-1">
        {parseFloat(chartData[chartData.length - 1]?.[dataKey] || '0').toFixed(2)}
      </p>
    </div>
  );
}

function SignalSummary({ rsiValue, sma20, sma50, price }: { rsiValue: number; sma20: number; sma50: number; price: number }) {
  const signals: { label: string; signal: 'buy' | 'sell' | 'neutral'; reason: string }[] = [];

  // RSI
  if (rsiValue < 30) signals.push({ label: 'RSI', signal: 'buy', reason: 'Sobreventa' });
  else if (rsiValue > 70) signals.push({ label: 'RSI', signal: 'sell', reason: 'Sobrecompra' });
  else signals.push({ label: 'RSI', signal: 'neutral', reason: 'Neutral' });

  // SMA crossover
  if (sma20 && sma50) {
    if (sma20 > sma50) signals.push({ label: 'SMA Cross', signal: 'buy', reason: 'SMA20 > SMA50' });
    else signals.push({ label: 'SMA Cross', signal: 'sell', reason: 'SMA20 < SMA50' });
  }

  // Price vs SMA
  if (price && sma20) {
    if (price > sma20) signals.push({ label: 'Precio/SMA20', signal: 'buy', reason: 'Sobre SMA20' });
    else signals.push({ label: 'Precio/SMA20', signal: 'sell', reason: 'Bajo SMA20' });
  }

  const buyCount = signals.filter(s => s.signal === 'buy').length;
  const sellCount = signals.filter(s => s.signal === 'sell').length;

  return (
    <div className="bg-secondary/30 rounded-lg p-3 border border-border/50">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2">Resumen de Señales</p>
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center gap-1 text-[hsl(142,70%,45%)]">
          <TrendingUp className="w-3.5 h-3.5" />
          <span className="text-xs font-bold">{buyCount} Compra</span>
        </div>
        <div className="flex items-center gap-1 text-[hsl(0,70%,50%)]">
          <TrendingDown className="w-3.5 h-3.5" />
          <span className="text-xs font-bold">{sellCount} Venta</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Minus className="w-3.5 h-3.5" />
          <span className="text-xs font-bold">{signals.length - buyCount - sellCount} Neutral</span>
        </div>
      </div>
      <div className="space-y-1">
        {signals.map(s => (
          <div key={s.label} className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">{s.label}</span>
            <span className={cn("text-[10px] font-semibold",
              s.signal === 'buy' ? 'text-[hsl(142,70%,45%)]' : s.signal === 'sell' ? 'text-[hsl(0,70%,50%)]' : 'text-muted-foreground'
            )}>{s.reason}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StockTechnicalsCard({ data, loading, currentPrice }: Props) {
  if (loading) {
    return (
      <Card className="p-4 bg-card border-border space-y-3">
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="p-4 bg-card border-border">
        <p className="text-sm text-muted-foreground text-center py-4">Indicadores técnicos no disponibles</p>
      </Card>
    );
  }

  const latestRSI = parseFloat(data.rsi?.[0]?.RSI || '50');
  const latestSMA20 = parseFloat(data.sma20?.[0]?.SMA || '0');
  const latestSMA50 = parseFloat(data.sma50?.[0]?.SMA || '0');

  const rsiZones = [
    { from: 0, to: 30, color: 'hsl(142, 70%, 45%)', label: 'Sobreventa (Compra)' },
    { from: 30, to: 70, color: 'hsl(45, 80%, 50%)', label: 'Neutral' },
    { from: 70, to: 100, color: 'hsl(0, 70%, 50%)', label: 'Sobrecompra (Venta)' },
  ];

  return (
    <Card className="p-4 bg-card border-border space-y-3">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
        <Activity className="w-4 h-4 text-primary" />
        Indicadores Técnicos
      </h3>

      <IndicatorGauge label="RSI (14)" value={latestRSI} min={0} max={100} zones={rsiZones} />

      <div className="grid grid-cols-2 gap-2">
        <MiniChart data={data.rsi} dataKey="RSI" color="hsl(280, 70%, 60%)" label="RSI (14)" />
        <MiniChart data={data.sma20} dataKey="SMA" color="hsl(200, 80%, 50%)" label="SMA (20)" />
        <MiniChart data={data.sma50} dataKey="SMA" color="hsl(35, 80%, 55%)" label="SMA (50)" />
        <MiniChart data={data.ema12} dataKey="EMA" color="hsl(160, 70%, 50%)" label="EMA (12)" />
      </div>

      {/* MACD */}
      {data.macd?.length > 0 && (
        <div className="bg-secondary/50 rounded-lg p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2">MACD</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <p className="text-[9px] text-muted-foreground">MACD</p>
              <p className="text-xs font-mono font-semibold text-foreground">{parseFloat(data.macd[0]?.MACD || '0').toFixed(3)}</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] text-muted-foreground">Signal</p>
              <p className="text-xs font-mono font-semibold text-foreground">{parseFloat(data.macd[0]?.MACD_Signal || '0').toFixed(3)}</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] text-muted-foreground">Histograma</p>
              <p className={cn("text-xs font-mono font-semibold",
                parseFloat(data.macd[0]?.MACD_Hist || '0') >= 0 ? 'text-[hsl(142,70%,45%)]' : 'text-[hsl(0,70%,50%)]'
              )}>{parseFloat(data.macd[0]?.MACD_Hist || '0').toFixed(3)}</p>
            </div>
          </div>
        </div>
      )}

      <SignalSummary rsiValue={latestRSI} sma20={latestSMA20} sma50={latestSMA50} price={currentPrice || 0} />
    </Card>
  );
}
