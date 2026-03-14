import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from '@/i18n/LanguageContext';
import { getSymbolVisual } from '@/components/analysis/symbolVisuals';

interface CurrencyPairCardProps {
  pair: string;
  currentPrice: number;
  change: number;
  highPrice: number;
  lowPrice: number;
  totalSignals?: number;
}

const generateChartData = (basePrice: number, isUp: boolean) => {
  const data = [];
  for (let i = 0; i < 12; i++) {
    const trend = isUp ? i * 0.001 : -i * 0.001;
    const variation = (Math.random() - 0.5) * 0.01;
    data.push({ time: i, price: basePrice + trend + variation });
  }
  return data;
};

export function CurrencyPairCard({ pair, currentPrice, change, highPrice, lowPrice, totalSignals = 0 }: CurrencyPairCardProps) {
  const { t } = useTranslation();
  const currencies = pair.split(' ');
  const flag1 = getSymbolVisual(currencies[0]).flag || '🏳️';
  const flag2 = getSymbolVisual(currencies[1]).flag || '🏳️';
  const isUp = change >= 0;
  const chartData = generateChartData(currentPrice, isUp);

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1">
              <span className="text-lg">{flag1}</span>
              <span className="text-lg">{flag2}</span>
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">{pair}</div>
              <div className="text-xs text-muted-foreground tabular-nums">{currentPrice.toFixed(4)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
              isUp ? 'bg-emerald-400/10 text-emerald-400' : 'bg-rose-400/10 text-rose-400'
            }`}>
              {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span className="tabular-nums">{isUp ? '+' : ''}{change}p</span>
            </div>
            {totalSignals > 0 && (
              <span className="text-[10px] text-muted-foreground">{totalSignals} {t('perf_signals_label')}</span>
            )}
          </div>
        </div>

        {/* Chart */}
        <div className="h-20 rounded-lg overflow-hidden bg-secondary/30">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`perf-gradient-${pair}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isUp ? 'hsl(150, 60%, 50%)' : 'hsl(0, 60%, 50%)'} stopOpacity={0.25}/>
                  <stop offset="95%" stopColor={isUp ? 'hsl(150, 60%, 50%)' : 'hsl(0, 60%, 50%)'} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis hide />
              <YAxis hide domain={['dataMin', 'dataMax']} />
              <ReferenceLine y={highPrice} stroke="hsl(150, 60%, 50%)" strokeDasharray="2 2" strokeOpacity={0.4} />
              <ReferenceLine y={lowPrice} stroke="hsl(0, 60%, 50%)" strokeDasharray="2 2" strokeOpacity={0.4} />
              <Area 
                type="monotone" dataKey="price" 
                stroke={isUp ? 'hsl(150, 60%, 50%)' : 'hsl(0, 60%, 50%)'}
                strokeWidth={1.5}
                fillOpacity={1} fill={`url(#perf-gradient-${pair})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Footer */}
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>R: <span className="text-emerald-400 tabular-nums">{highPrice.toFixed(4)}</span></span>
            <span>S: <span className="text-rose-400 tabular-nums">{lowPrice.toFixed(4)}</span></span>
          </div>
          <span className="text-muted-foreground/60">{t('perf_week')}</span>
        </div>
      </CardContent>
    </Card>
  );
}
