import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Activity, Gauge } from 'lucide-react';

interface IndicatorsSummaryProps {
  pair: string;
  timeframe: string;
}

// Generate mock indicator values
const generateIndicators = (pair: string, timeframe: string) => {
  const rsi = 30 + Math.random() * 40;
  const macdTrend = Math.random() > 0.5 ? 'bullish' : 'bearish';
  const maTrend = Math.random() > 0.5 ? 'above' : 'below';
  
  return {
    rsi: parseFloat(rsi.toFixed(1)),
    rsiStatus: rsi >= 70 ? 'overbought' : rsi <= 30 ? 'oversold' : 'neutral',
    macdTrend,
    maTrend,
    overallSignal: (macdTrend === 'bullish' && maTrend === 'above') ? 'buy' :
                   (macdTrend === 'bearish' && maTrend === 'below') ? 'sell' : 'neutral',
    strength: Math.floor(Math.random() * 40) + 60,
  };
};

export function IndicatorsSummary({ pair, timeframe }: IndicatorsSummaryProps) {
  const indicators = useMemo(() => generateIndicators(pair, timeframe), [pair, timeframe]);

  const cards = [
    {
      title: 'RSI (14)',
      value: indicators.rsi.toString(),
      status: indicators.rsiStatus === 'overbought' ? 'Sobrecompra' :
              indicators.rsiStatus === 'oversold' ? 'Sobreventa' : 'Neutral',
      statusColor: indicators.rsiStatus === 'overbought' ? 'text-red-400' :
                   indicators.rsiStatus === 'oversold' ? 'text-green-400' : 'text-muted-foreground',
      icon: Gauge,
      iconColor: indicators.rsiStatus === 'overbought' ? 'text-red-400' :
                 indicators.rsiStatus === 'oversold' ? 'text-green-400' : 'text-primary',
    },
    {
      title: 'MACD',
      value: indicators.macdTrend === 'bullish' ? 'Alcista' : 'Bajista',
      status: 'Tendencia',
      statusColor: indicators.macdTrend === 'bullish' ? 'text-green-400' : 'text-red-400',
      icon: indicators.macdTrend === 'bullish' ? TrendingUp : TrendingDown,
      iconColor: indicators.macdTrend === 'bullish' ? 'text-green-400' : 'text-red-400',
    },
    {
      title: 'Medias Móviles',
      value: indicators.maTrend === 'above' ? 'Por encima' : 'Por debajo',
      status: 'Precio vs MA50',
      statusColor: indicators.maTrend === 'above' ? 'text-green-400' : 'text-red-400',
      icon: Activity,
      iconColor: indicators.maTrend === 'above' ? 'text-green-400' : 'text-red-400',
    },
    {
      title: 'Señal General',
      value: indicators.overallSignal === 'buy' ? 'COMPRAR' :
             indicators.overallSignal === 'sell' ? 'VENDER' : 'NEUTRAL',
      status: `Fuerza: ${indicators.strength}%`,
      statusColor: indicators.overallSignal === 'buy' ? 'text-green-400' :
                   indicators.overallSignal === 'sell' ? 'text-red-400' : 'text-yellow-400',
      icon: indicators.overallSignal === 'buy' ? TrendingUp :
            indicators.overallSignal === 'sell' ? TrendingDown : Activity,
      iconColor: indicators.overallSignal === 'buy' ? 'text-green-400' :
                 indicators.overallSignal === 'sell' ? 'text-red-400' : 'text-yellow-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="bg-card/50 border-border/50">
            <CardContent className="p-3">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs text-muted-foreground">{card.title}</span>
                <Icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
              <div className={`text-lg font-bold ${card.statusColor}`}>
                {card.value}
              </div>
              <div className="text-xs text-muted-foreground">
                {card.status}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}