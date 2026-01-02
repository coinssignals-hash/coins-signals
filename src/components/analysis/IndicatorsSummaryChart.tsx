import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Gauge, Target } from 'lucide-react';

interface IndicatorResult {
  name: string;
  signal: 'buy' | 'sell' | 'neutral';
  value: number; // -100 to 100 scale
  weight: number;
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
      
      results.push({ name: 'RSI', signal: rsiSignal, value: rsiValue, weight: 1 });
    } else {
      results.push({ name: 'RSI', signal: 'neutral', value: 0, weight: 1 });
    }
    
    // MACD Analysis
    if (macdData && macdData.length > 1) {
      const latest = macdData[macdData.length - 1];
      const prev = macdData[macdData.length - 2];
      let macdSignal: 'buy' | 'sell' | 'neutral' = 'neutral';
      let macdValue = 0;
      
      // Crossover detection
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
      
      results.push({ name: 'MACD', signal: macdSignal, value: macdValue, weight: 1.2 });
    } else {
      results.push({ name: 'MACD', signal: 'neutral', value: 0, weight: 1.2 });
    }
    
    // Bollinger Bands Analysis (calculated from price data)
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
      
      results.push({ name: 'Bollinger', signal: bbSignal, value: bbValue, weight: 0.8 });
    } else {
      results.push({ name: 'Bollinger', signal: 'neutral', value: 0, weight: 0.8 });
    }
    
    // Stochastic Analysis (calculated from price data)
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
      
      results.push({ name: 'Estocástico', signal: stochSignal, value: stochValue, weight: 0.9 });
    } else {
      results.push({ name: 'Estocástico', signal: 'neutral', value: 0, weight: 0.9 });
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
      
      results.push({ name: 'SMA', signal: smaSignal, value: smaValue, weight: 0.7 });
    } else {
      results.push({ name: 'SMA', signal: 'neutral', value: 0, weight: 0.7 });
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

  const pieData = [
    { name: 'Compra', value: summary.buyCount, color: '#22c55e' },
    { name: 'Venta', value: summary.sellCount, color: '#ef4444' },
    { name: 'Neutral', value: summary.neutralCount, color: '#6b7280' },
  ].filter(d => d.value > 0);

  const barData = indicatorResults.map(ind => ({
    name: ind.name,
    value: ind.value,
    fill: ind.signal === 'buy' ? '#22c55e' : ind.signal === 'sell' ? '#ef4444' : '#6b7280',
  }));

  if (loading) {
    return (
      <Card className="bg-[#0a1a0a] border-green-900/50">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-700 rounded w-1/3"></div>
            <div className="h-[200px] bg-gray-800 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#0a1a0a] border-green-900/50">
      <CardContent className="p-4 space-y-4">
        {/* Header with overall result */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-green-400" />
            <span className="text-sm font-medium text-white">Resumen de Indicadores</span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
            summary.overallSignal === 'buy' 
              ? 'bg-green-500/20 border border-green-500/50' 
              : summary.overallSignal === 'sell'
              ? 'bg-red-500/20 border border-red-500/50'
              : 'bg-gray-500/20 border border-gray-500/50'
          }`}>
            {summary.overallSignal === 'buy' && <TrendingUp className="w-4 h-4 text-green-400" />}
            {summary.overallSignal === 'sell' && <TrendingDown className="w-4 h-4 text-red-400" />}
            {summary.overallSignal === 'neutral' && <Minus className="w-4 h-4 text-gray-400" />}
            <span className={`text-sm font-bold ${
              summary.overallSignal === 'buy' ? 'text-green-400' : 
              summary.overallSignal === 'sell' ? 'text-red-400' : 'text-gray-400'
            }`}>
              {summary.overallSignal === 'buy' ? 'COMPRA' : 
               summary.overallSignal === 'sell' ? 'VENTA' : 'NEUTRAL'}
            </span>
          </div>
        </div>

        {/* Score gauge */}
        <div className="flex items-center justify-center py-2">
          <div className="relative w-32 h-16 overflow-hidden">
            {/* Gauge background */}
            <div className="absolute inset-0 rounded-t-full bg-gradient-to-r from-red-500 via-gray-500 to-green-500 opacity-30" />
            {/* Gauge needle */}
            <div 
              className="absolute bottom-0 left-1/2 w-1 h-12 bg-white origin-bottom transition-transform duration-500"
              style={{ 
                transform: `translateX(-50%) rotate(${(overallScore / 100) * 90}deg)`,
              }}
            />
            {/* Center circle */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white shadow-lg" />
          </div>
        </div>

        {/* Score value */}
        <div className="text-center">
          <span className={`text-3xl font-bold ${
            overallScore > 25 ? 'text-green-400' : 
            overallScore < -25 ? 'text-red-400' : 'text-gray-400'
          }`}>
            {overallScore > 0 ? '+' : ''}{overallScore.toFixed(0)}
          </span>
          <span className="text-sm text-gray-500 ml-1">/ 100</span>
        </div>

        {/* Signal counts */}
        <div className="flex justify-center gap-6 py-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-gray-400">Compra: {summary.buyCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500" />
            <span className="text-xs text-gray-400">Neutral: {summary.neutralCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs text-gray-400">Venta: {summary.sellCount}</span>
          </div>
        </div>

        {/* Indicator bars */}
        <div className="space-y-2">
          {indicatorResults.map((ind) => (
            <div key={ind.name} className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-20 shrink-0">{ind.name}</span>
              <div className="flex-1 h-4 bg-gray-800 rounded-full overflow-hidden relative">
                {/* Center line */}
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gray-600" />
                {/* Value bar */}
                <div 
                  className={`absolute top-0.5 bottom-0.5 rounded-full transition-all duration-500 ${
                    ind.value > 0 ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{
                    left: ind.value > 0 ? '50%' : `${50 + ind.value / 2}%`,
                    width: `${Math.abs(ind.value) / 2}%`,
                  }}
                />
              </div>
              <span className={`text-xs font-medium w-10 text-right ${
                ind.signal === 'buy' ? 'text-green-400' : 
                ind.signal === 'sell' ? 'text-red-400' : 'text-gray-400'
              }`}>
                {ind.signal === 'buy' ? 'Compra' : ind.signal === 'sell' ? 'Venta' : 'Neutral'}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
