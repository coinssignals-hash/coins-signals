import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Activity, Gauge, Loader2 } from 'lucide-react';

interface IndicatorsSummaryProps {
  pair: string;
  timeframe: string;
  priceData?: Array<{ price: number }>;
  smaData?: {
    sma20: Array<{ sma: number }>;
    sma50: Array<{ sma: number }>;
  };
  rsiData?: Array<{ rsi: number }>;
  macdData?: Array<{ macd: number; signal: number }>;
  loading?: boolean;
}

export function IndicatorsSummary({ 
  pair, 
  timeframe, 
  priceData, 
  smaData, 
  rsiData, 
  macdData,
  loading 
}: IndicatorsSummaryProps) {
  const indicators = useMemo(() => {
    if (!priceData || priceData.length === 0) {
      return {
        rsi: 50,
        rsiStatus: 'neutral' as const,
        macdTrend: 'neutral' as const,
        maTrend: 'neutral' as const,
        overallSignal: 'neutral' as const,
        strength: 50,
        currentPrice: 0,
      };
    }

    const currentPrice = priceData[priceData.length - 1]?.price || 0;
    const currentSMA50 = smaData?.sma50?.[smaData.sma50.length - 1]?.sma || currentPrice;
    const currentRSI = rsiData?.[rsiData.length - 1]?.rsi || 50;
    const currentMACD = macdData?.[macdData.length - 1];

    const rsiStatus = currentRSI >= 70 ? 'overbought' : currentRSI <= 30 ? 'oversold' : 'neutral';
    const macdTrend = currentMACD ? (currentMACD.macd > currentMACD.signal ? 'bullish' : 'bearish') : 'neutral';
    const maTrend = currentPrice > currentSMA50 ? 'above' : 'below';

    // Calculate overall signal
    let bullishPoints = 0;
    let bearishPoints = 0;

    if (macdTrend === 'bullish') bullishPoints += 2;
    else if (macdTrend === 'bearish') bearishPoints += 2;

    if (maTrend === 'above') bullishPoints += 2;
    else bearishPoints += 2;

    if (rsiStatus === 'oversold') bullishPoints += 1;
    else if (rsiStatus === 'overbought') bearishPoints += 1;

    const overallSignal = bullishPoints > bearishPoints + 1 ? 'buy' :
                          bearishPoints > bullishPoints + 1 ? 'sell' : 'neutral';
    
    const totalPoints = bullishPoints + bearishPoints;
    const strength = totalPoints > 0 ? Math.round((Math.max(bullishPoints, bearishPoints) / totalPoints) * 100) : 50;

    return {
      rsi: currentRSI,
      rsiStatus,
      macdTrend,
      maTrend,
      overallSignal,
      strength,
      currentPrice,
    };
  }, [priceData, smaData, rsiData, macdData]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-card/50 border-border/50">
            <CardContent className="p-3 flex items-center justify-center h-24">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'RSI (14)',
      value: indicators.rsi.toFixed(1),
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
      value: indicators.macdTrend === 'bullish' ? 'Alcista' : indicators.macdTrend === 'bearish' ? 'Bajista' : 'Neutral',
      status: 'Tendencia',
      statusColor: indicators.macdTrend === 'bullish' ? 'text-green-400' : 
                   indicators.macdTrend === 'bearish' ? 'text-red-400' : 'text-muted-foreground',
      icon: indicators.macdTrend === 'bullish' ? TrendingUp : 
            indicators.macdTrend === 'bearish' ? TrendingDown : Activity,
      iconColor: indicators.macdTrend === 'bullish' ? 'text-green-400' : 
                 indicators.macdTrend === 'bearish' ? 'text-red-400' : 'text-muted-foreground',
    },
    {
      title: 'Medias Móviles',
      value: indicators.maTrend === 'above' ? 'Por encima' : 'Por debajo',
      status: 'Precio vs SMA50',
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