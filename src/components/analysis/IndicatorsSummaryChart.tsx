import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, Gauge, Activity, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IndicatorResult {
  name: string;
  signal: 'buy' | 'sell' | 'neutral';
  value: number; // -100 to 100 scale
  weight: number;
  icon: React.ReactNode;
}

interface IndicatorsSummaryChartProps {
  priceData?: Array<{ time: string; price: number; high: number; low: number; open: number }>;
  rsiData?: Array<{ time: string; rsi: number }>;
  macdData?: Array<{ time: string; macd: number; signal: number; histogram: number }>;
  smaData?: {
    sma20: Array<{ datetime: string; sma: number }>;
    sma50: Array<{ datetime: string; sma: number }>;
  };
  loading?: boolean;
}

export function IndicatorsSummaryChart({ priceData, rsiData, macdData, smaData, loading }: IndicatorsSummaryChartProps) {
  const indicatorResults = useMemo((): IndicatorResult[] => {
    const results: IndicatorResult[] = [];
    
    // RSI Analysis
    if (rsiData && rsiData.length > 0) {
      const latestRSI = rsiData[rsiData.length - 1].rsi;
      let rsiSignal: 'buy' | 'sell' | 'neutral' = 'neutral';
      let rsiValue = 0;
      
      if (latestRSI < 30) {
        rsiSignal = 'buy';
        rsiValue = 100 - (latestRSI / 30) * 100;
      } else if (latestRSI > 70) {
        rsiSignal = 'sell';
        rsiValue = -((latestRSI - 70) / 30) * 100;
      } else {
        rsiValue = ((latestRSI - 50) / 20) * -30;
      }
      
      results.push({ name: 'RSI', signal: rsiSignal, value: rsiValue, weight: 1, icon: <Activity className="w-3.5 h-3.5" /> });
    } else {
      results.push({ name: 'RSI', signal: 'neutral', value: 0, weight: 1, icon: <Activity className="w-3.5 h-3.5" /> });
    }
    
    // MACD Analysis
    if (macdData && macdData.length > 1) {
      const latest = macdData[macdData.length - 1];
      const prev = macdData[macdData.length - 2];
      let macdSignal: 'buy' | 'sell' | 'neutral' = 'neutral';
      let macdValue = 0;
      
      if (prev.macd < prev.signal && latest.macd > latest.signal) {
        macdSignal = 'buy';
        macdValue = 80;
      } else if (prev.macd > prev.signal && latest.macd < latest.signal) {
        macdSignal = 'sell';
        macdValue = -80;
      } else if (latest.histogram > 0) {
        macdSignal = latest.histogram > prev.histogram ? 'buy' : 'neutral';
        macdValue = Math.min(50, latest.histogram * 1000);
      } else {
        macdSignal = latest.histogram < prev.histogram ? 'sell' : 'neutral';
        macdValue = Math.max(-50, latest.histogram * 1000);
      }
      
      results.push({ name: 'MACD', signal: macdSignal, value: macdValue, weight: 1.2, icon: <BarChart3 className="w-3.5 h-3.5" /> });
    } else {
      results.push({ name: 'MACD', signal: 'neutral', value: 0, weight: 1.2, icon: <BarChart3 className="w-3.5 h-3.5" /> });
    }
    
    // Bollinger Bands Analysis
    if (priceData && priceData.length >= 20) {
      const prices = priceData.slice(-20).map(p => p.price);
      const sma = prices.reduce((a, b) => a + b, 0) / 20;
      const variance = prices.reduce((a, b) => a + Math.pow(b - sma, 2), 0) / 20;
      const stdDev = Math.sqrt(variance);
      const upper = sma + 2 * stdDev;
      const lower = sma - 2 * stdDev;
      const current = priceData[priceData.length - 1].price;
      const position = ((current - lower) / (upper - lower)) * 100;
      
      let bbSignal: 'buy' | 'sell' | 'neutral' = 'neutral';
      let bbValue = 0;
      
      if (position < 20) {
        bbSignal = 'buy';
        bbValue = 80 - position * 4;
      } else if (position > 80) {
        bbSignal = 'sell';
        bbValue = -(position - 80) * 4 - 20;
      } else {
        bbValue = (50 - position) * 0.6;
      }
      
      results.push({ name: 'Bollinger', signal: bbSignal, value: bbValue, weight: 0.8, icon: <Activity className="w-3.5 h-3.5" /> });
    } else {
      results.push({ name: 'Bollinger', signal: 'neutral', value: 0, weight: 0.8, icon: <Activity className="w-3.5 h-3.5" /> });
    }
    
    // Stochastic Analysis
    if (priceData && priceData.length >= 14) {
      const recent = priceData.slice(-14);
      const highestHigh = Math.max(...recent.map(p => p.high));
      const lowestLow = Math.min(...recent.map(p => p.low));
      const current = priceData[priceData.length - 1].price;
      const k = ((current - lowestLow) / (highestHigh - lowestLow)) * 100;
      
      let stochSignal: 'buy' | 'sell' | 'neutral' = 'neutral';
      let stochValue = 0;
      
      if (k < 20) {
        stochSignal = 'buy';
        stochValue = 80 - k * 4;
      } else if (k > 80) {
        stochSignal = 'sell';
        stochValue = -(k - 80) * 4 - 20;
      } else {
        stochValue = (50 - k) * 0.5;
      }
      
      results.push({ name: 'Stoch', signal: stochSignal, value: stochValue, weight: 0.9, icon: <Activity className="w-3.5 h-3.5" /> });
    } else {
      results.push({ name: 'Stoch', signal: 'neutral', value: 0, weight: 0.9, icon: <Activity className="w-3.5 h-3.5" /> });
    }
    
    // SMA Trend Analysis
    if (smaData?.sma20 && smaData.sma20.length > 0 && priceData && priceData.length > 0) {
      const latestPrice = priceData[priceData.length - 1].price;
      const latestSMA = smaData.sma20[smaData.sma20.length - 1].sma;
      const priceDiff = ((latestPrice - latestSMA) / latestSMA) * 100;
      
      let smaSignal: 'buy' | 'sell' | 'neutral' = 'neutral';
      let smaValue = 0;
      
      if (priceDiff > 0.3) {
        smaSignal = 'buy';
        smaValue = Math.min(70, priceDiff * 100);
      } else if (priceDiff < -0.3) {
        smaSignal = 'sell';
        smaValue = Math.max(-70, priceDiff * 100);
      } else {
        smaValue = priceDiff * 50;
      }
      
      results.push({ name: 'SMA', signal: smaSignal, value: smaValue, weight: 0.7, icon: <TrendingUp className="w-3.5 h-3.5" /> });
    } else {
      results.push({ name: 'SMA', signal: 'neutral', value: 0, weight: 0.7, icon: <TrendingUp className="w-3.5 h-3.5" /> });
    }
    
    return results;
  }, [priceData, rsiData, macdData, smaData]);

  // Calculate overall score
  const overallScore = useMemo(() => {
    const totalWeight = indicatorResults.reduce((sum, ind) => sum + ind.weight, 0);
    const weightedSum = indicatorResults.reduce((sum, ind) => sum + ind.value * ind.weight, 0);
    return weightedSum / totalWeight;
  }, [indicatorResults]);

  // Get summary statistics
  const summary = useMemo(() => {
    const buyCount = indicatorResults.filter(r => r.signal === 'buy').length;
    const sellCount = indicatorResults.filter(r => r.signal === 'sell').length;
    const neutralCount = indicatorResults.filter(r => r.signal === 'neutral').length;
    
    let overallSignal: 'buy' | 'sell' | 'neutral' = 'neutral';
    if (overallScore > 25) overallSignal = 'buy';
    else if (overallScore < -25) overallSignal = 'sell';
    
    return { buyCount, sellCount, neutralCount, overallSignal };
  }, [indicatorResults, overallScore]);

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-[#0a1a0a] to-[#0d1f0d] border-green-900/30 overflow-hidden">
        <CardContent className="p-5">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-green-900/20 rounded w-1/3"></div>
            <div className="h-[200px] bg-green-900/10 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate gauge rotation (-90 to 90 degrees)
  const gaugeRotation = (overallScore / 100) * 90;

  return (
    <Card className="bg-gradient-to-br from-[#0a1a0a] to-[#0d1f0d] border-green-900/30 overflow-hidden">
      <CardContent className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Gauge className="w-4 h-4 text-green-400" />
            </div>
            <span className="text-sm font-semibold text-white">Resumen de Indicadores</span>
          </div>
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all",
            summary.overallSignal === 'buy' && "bg-green-500/20 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]",
            summary.overallSignal === 'sell' && "bg-red-500/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]",
            summary.overallSignal === 'neutral' && "bg-gray-500/20 text-gray-400"
          )}>
            {summary.overallSignal === 'buy' && <TrendingUp className="w-3.5 h-3.5" />}
            {summary.overallSignal === 'sell' && <TrendingDown className="w-3.5 h-3.5" />}
            {summary.overallSignal === 'neutral' && <Minus className="w-3.5 h-3.5" />}
            {summary.overallSignal === 'buy' ? 'COMPRA' : summary.overallSignal === 'sell' ? 'VENTA' : 'NEUTRAL'}
          </div>
        </div>

        {/* Speedometer Gauge */}
        <div className="flex flex-col items-center py-3">
          <div className="relative w-40 h-20">
            {/* Background arc */}
            <svg viewBox="0 0 100 50" className="w-full h-full">
              <defs>
                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="35%" stopColor="#f97316" />
                  <stop offset="50%" stopColor="#6b7280" />
                  <stop offset="65%" stopColor="#84cc16" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
              </defs>
              {/* Gauge background arc */}
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="url(#gaugeGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                opacity="0.3"
              />
              {/* Active arc based on score */}
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="url(#gaugeGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="126"
                strokeDashoffset={126 - (126 * ((overallScore + 100) / 200))}
                className="transition-all duration-700 ease-out"
              />
              {/* Tick marks */}
              {[-90, -45, 0, 45, 90].map((angle, i) => (
                <line
                  key={i}
                  x1={50 + 35 * Math.cos((angle - 90) * Math.PI / 180)}
                  y1={50 + 35 * Math.sin((angle - 90) * Math.PI / 180)}
                  x2={50 + 40 * Math.cos((angle - 90) * Math.PI / 180)}
                  y2={50 + 40 * Math.sin((angle - 90) * Math.PI / 180)}
                  stroke="#4b5563"
                  strokeWidth="1"
                />
              ))}
            </svg>
            {/* Needle */}
            <div 
              className="absolute bottom-0 left-1/2 origin-bottom transition-transform duration-700 ease-out"
              style={{ transform: `translateX(-50%) rotate(${gaugeRotation}deg)` }}
            >
              <div className="w-0.5 h-14 bg-gradient-to-t from-white to-white/60 rounded-full shadow-lg" />
            </div>
            {/* Center dot */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-lg border-2 border-gray-800" />
          </div>
          
          {/* Score display */}
          <div className="mt-3 text-center">
            <span className={cn(
              "text-4xl font-bold tabular-nums transition-colors",
              overallScore > 25 && "text-green-400",
              overallScore < -25 && "text-red-400",
              overallScore >= -25 && overallScore <= 25 && "text-gray-400"
            )}>
              {overallScore > 0 ? '+' : ''}{overallScore.toFixed(0)}
            </span>
            <span className="text-sm text-gray-500 ml-1">/ 100</span>
          </div>
        </div>

        {/* Signal counts with animated bars */}
        <div className="flex justify-center gap-4 py-2">
          {[
            { label: 'Compra', count: summary.buyCount, color: 'bg-green-500', textColor: 'text-green-400' },
            { label: 'Neutral', count: summary.neutralCount, color: 'bg-gray-500', textColor: 'text-gray-400' },
            { label: 'Venta', count: summary.sellCount, color: 'bg-red-500', textColor: 'text-red-400' },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white", item.color)}>
                {item.count}
              </div>
              <span className={cn("text-[10px]", item.textColor)}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Indicator cards grid */}
        <div className="grid grid-cols-5 gap-2">
          {indicatorResults.map((ind, index) => (
            <div 
              key={ind.name}
              className={cn(
                "relative p-3 rounded-xl text-center transition-all duration-300 animate-fade-in",
                ind.signal === 'buy' && "bg-green-500/10 border border-green-500/30",
                ind.signal === 'sell' && "bg-red-500/10 border border-red-500/30",
                ind.signal === 'neutral' && "bg-gray-500/10 border border-gray-500/30"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Glow effect */}
              <div className={cn(
                "absolute inset-0 rounded-xl blur-xl opacity-20 -z-10",
                ind.signal === 'buy' && "bg-green-500",
                ind.signal === 'sell' && "bg-red-500"
              )} />
              
              <div className={cn(
                "mx-auto mb-1.5 w-6 h-6 rounded-full flex items-center justify-center",
                ind.signal === 'buy' && "bg-green-500/20 text-green-400",
                ind.signal === 'sell' && "bg-red-500/20 text-red-400",
                ind.signal === 'neutral' && "bg-gray-500/20 text-gray-400"
              )}>
                {ind.signal === 'buy' ? <TrendingUp className="w-3 h-3" /> : 
                 ind.signal === 'sell' ? <TrendingDown className="w-3 h-3" /> : 
                 <Minus className="w-3 h-3" />}
              </div>
              
              <div className="text-[10px] font-medium text-gray-400 mb-0.5">{ind.name}</div>
              <div className={cn(
                "text-[9px] font-bold uppercase",
                ind.signal === 'buy' && "text-green-400",
                ind.signal === 'sell' && "text-red-400",
                ind.signal === 'neutral' && "text-gray-500"
              )}>
                {ind.signal === 'buy' ? 'Compra' : ind.signal === 'sell' ? 'Venta' : 'Neutral'}
              </div>
              
              {/* Mini progress bar */}
              <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    ind.signal === 'buy' && "bg-green-500",
                    ind.signal === 'sell' && "bg-red-500",
                    ind.signal === 'neutral' && "bg-gray-500"
                  )}
                  style={{ width: `${Math.abs(ind.value)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
