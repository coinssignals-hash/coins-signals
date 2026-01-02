import { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RefreshCw, Bell, Clock, Zap, Activity, TrendingUp, BarChart2, Waves, Percent, WifiOff } from 'lucide-react';
import { DayTabs } from '@/components/analysis/DayTabs';
import { CurrencyHeader } from '@/components/analysis/CurrencyHeader';
import { MarketSentiment } from '@/components/analysis/MarketSentiment';
import { PricePrediction } from '@/components/analysis/PricePrediction';
import { TechnicalLevels } from '@/components/analysis/TechnicalLevels';
import { CandlestickChart } from '@/components/analysis/CandlestickChart';
import { StrategicRecommendations } from '@/components/analysis/StrategicRecommendations';
import { MarketConclusions } from '@/components/analysis/MarketConclusions';
import { MonetaryPolicies } from '@/components/analysis/MonetaryPolicies';
import { MajorNews } from '@/components/analysis/MajorNews';
import { EconomicEvents } from '@/components/analysis/EconomicEvents';
import { RelevantNews } from '@/components/analysis/RelevantNews';

import { PriceChart } from '@/components/analysis/PriceChart';
import { RSIChart } from '@/components/analysis/RSIChart';
import { MACDChart } from '@/components/analysis/MACDChart';
import { BollingerChart } from '@/components/analysis/BollingerChart';
import { StochasticChart } from '@/components/analysis/StochasticChart';
import { IndicatorsSummaryChart } from '@/components/analysis/IndicatorsSummaryChart';
import { AlertsPanel } from '@/components/analysis/AlertsPanel';
import { SymbolSearch } from '@/components/analysis/SymbolSearch';
import { AIFullRegenerateButton } from '@/components/analysis/AIFullRegenerateButton';
import { useMarketData } from '@/hooks/useMarketData';
import { usePreviousDayCandles } from '@/hooks/usePreviousDayCandles';
import { useIndicatorAlerts } from '@/hooks/useIndicatorAlerts';
import { useSupportResistanceAlerts } from '@/hooks/useSupportResistanceAlerts';
import { useRealtimeMarket } from '@/hooks/useRealtimeMarket';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const timeframes = [
  { value: '5min', label: '5 Min' },
  { value: '15min', label: '15 Min' },
  { value: '30min', label: '30 Min' },
  { value: '1h', label: '1 Hora' },
  { value: '4h', label: '4 Horas' },
  { value: '1day', label: '1 Día' },
  { value: '1week', label: '1 Semana' },
];

interface AlertConfig {
  rsiOverbought: number;
  rsiOversold: number;
  enableRSI: boolean;
  enableMACD: boolean;
  enableSMACross: boolean;
  enableSupportResistance: boolean;
  srProximityPercent: number;
  srEnableSound: boolean;
  enablePatternAlerts: boolean;
  patternAlertTypes: {
    bullish: boolean;
    bearish: boolean;
    neutral: boolean;
  };
  patternEnableSound: boolean;
}

// Convert symbol format for Polygon.io API
function formatSymbolForPolygon(symbol: string): string {
  // EUR/USD -> C:EURUSD (Forex)
  // BTC/USD -> X:BTCUSD (Crypto)
  const [base, quote] = symbol.split('/');
  
  const cryptos = ['BTC', 'ETH', 'XRP', 'SOL', 'BNB', 'ADA', 'DOGE', 'DOT', 'AVAX', 'MATIC', 'LINK', 'UNI', 'ATOM', 'LTC', 'XLM', 'SHIB', 'PEPE'];
  
  if (cryptos.includes(base)) {
    return `X:${base}${quote || 'USD'}`;
  }
  
  // Default to Forex
  return `C:${base}${quote || 'USD'}`;
}

export default function Analysis() {
  const [selectedPair, setSelectedPair] = useState('EUR/USD');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({
    rsiOverbought: 70,
    rsiOversold: 30,
    enableRSI: true,
    enableMACD: true,
    enableSMACross: true,
    enableSupportResistance: true,
    srProximityPercent: 5,
    srEnableSound: true,
    enablePatternAlerts: true,
    patternAlertTypes: {
      bullish: true,
      bearish: true,
      neutral: false,
    },
    patternEnableSound: true,
  });
  
  const { data, loading, error, refetch, isRateLimited } = useMarketData(selectedPair, selectedTimeframe);
  
  // Previous day candles for resistance/support chart
  const { data: previousDayData, loading: previousDayLoading } = usePreviousDayCandles(selectedPair);
  
  // Realtime market data from Polygon.io
  const polygonSymbol = formatSymbolForPolygon(selectedPair);
  const { quotes, isConnected, isReconnecting, reconnectAttempt, error: wsError, subscribe, unsubscribe, getQuote } = useRealtimeMarket([polygonSymbol]);
  
  // Get realtime quote for current symbol
  const realtimeQuote = getQuote(polygonSymbol);
  
  // Subscribe/unsubscribe when symbol changes
  useEffect(() => {
    const newSymbol = formatSymbolForPolygon(selectedPair);
    subscribe([newSymbol]);
    
    return () => {
      unsubscribe([newSymbol]);
    };
  }, [selectedPair, subscribe, unsubscribe]);
  
  // Initialize indicator alerts hook
  useIndicatorAlerts(data, selectedPair, alertConfig);

  // Calculate derived values from market data
  const marketStats = useMemo(() => {
    if (!data?.priceData || data.priceData.length === 0) {
      return {
        currentPrice: 1.1689,
        change: 0.00467,
        changePercent: 0.40,
        high: 1.1729,
        low: 1.1651,
        resistance: 1.1700,
        support: 1.1650,
        pips: 78,
      };
    }

    const prices = data.priceData;
    const latest = prices[prices.length - 1];
    const first = prices[0];
    const currentPrice = latest?.price || 1.1689;
    const change = currentPrice - (first?.price || currentPrice);
    const changePercent = first?.price ? ((change / first.price) * 100) : 0;
    const high = Math.max(...prices.map(p => p.high));
    const low = Math.min(...prices.map(p => p.low));
    const resistance = high - (high - currentPrice) * 0.3;
    const support = low + (currentPrice - low) * 0.3;
    const pips = Math.abs(change) * 10000;

    return {
      currentPrice,
      change,
      changePercent,
      high,
      low,
      resistance,
      support,
      pips,
    };
  }, [data?.priceData]);

  // Initialize support/resistance alerts (after marketStats is defined)
  const { alertState } = useSupportResistanceAlerts(
    selectedPair,
    realtimeQuote?.price,
    previousDayData?.support || marketStats.support,
    previousDayData?.resistance || marketStats.resistance,
    { 
      enabled: alertConfig.enableSupportResistance, 
      proximityPercent: alertConfig.srProximityPercent, 
      enableSound: alertConfig.srEnableSound 
    }
  );

  // Candlestick data for chart
  const candleData = useMemo(() => {
    if (!data?.priceData || data.priceData.length === 0) {
      // Generate mock data
      const now = new Date();
      return Array.from({ length: 20 }, (_, i) => ({
        time: new Date(now.getTime() - (20 - i) * 3600000).toISOString(),
        open: 1.165 + Math.random() * 0.01,
        high: 1.168 + Math.random() * 0.005,
        low: 1.163 + Math.random() * 0.005,
        close: 1.166 + Math.random() * 0.01,
      }));
    }
    return data.priceData.map(p => ({
      time: p.time,
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.price,
    }));
  }, [data?.priceData]);

  return (
    <div className="min-h-screen bg-black pb-20 md:pb-0">
      <Header />
      
      {/* Day Tabs */}
      <DayTabs selectedDay={selectedDay} onSelectDay={setSelectedDay} />
      
      <main className="container py-4 px-2 sm:px-4 max-w-4xl mx-auto space-y-4">
        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <SymbolSearch 
            value={selectedPair} 
            onChange={setSelectedPair}
            className="flex-1 min-w-[180px]"
          />
          
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-[100px] bg-[#0a1a0a] border-green-900/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0a1a0a] border-green-900/50">
              {timeframes.map(tf => (
                <SelectItem key={tf.value} value={tf.value}>{tf.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <AIFullRegenerateButton
            symbol={selectedPair}
            currentPrice={marketStats.currentPrice}
            high={marketStats.high}
            low={marketStats.low}
          />
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 border-green-900/50 bg-[#0a1a0a]">
                <Bell className="w-4 h-4 text-green-400" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[320px] sm:w-[380px] bg-[#0a1a0a] border-green-900/50">
              <SheetHeader>
                <SheetTitle className="text-white">Alertas de Indicadores</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <AlertsPanel config={alertConfig} onConfigChange={setAlertConfig} />
              </div>
            </SheetContent>
          </Sheet>
          
          <Button
            variant="outline"
            size="icon"
            onClick={refetch}
            disabled={loading}
            className="shrink-0 border-green-900/50 bg-[#0a1a0a]"
          >
            <RefreshCw className={`w-4 h-4 text-green-400 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Rate limit warning */}
        {isRateLimited && (
          <Card className="border-yellow-500/50 bg-yellow-500/10">
            <CardContent className="p-3 flex items-center gap-3">
              <Clock className="h-5 w-5 text-yellow-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-yellow-400 font-medium">Límite de API alcanzado</p>
                <p className="text-xs text-gray-400">Actualizando en 60 segundos...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error message */}
        {error && !isRateLimited && (
          <Card className="border-red-500/50 bg-red-500/10">
            <CardContent className="p-3">
              <p className="text-sm text-red-400">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* WebSocket reconnecting message */}
        {isReconnecting && (
          <Card className="border-orange-500/50 bg-orange-500/10 animate-pulse">
            <CardContent className="p-3 flex items-center gap-3">
              <WifiOff className="h-5 w-5 text-orange-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-orange-400 font-medium">Reconectando datos en tiempo real...</p>
                <p className="text-xs text-gray-400">Intento {reconnectAttempt} de 5 - Reintentando automáticamente</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* WebSocket error message */}
        {wsError && !isReconnecting && (
          <Card className="border-red-500/50 bg-red-500/10">
            <CardContent className="p-3 flex items-center gap-3">
              <WifiOff className="h-5 w-5 text-red-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-400 font-medium">Conexión en tiempo real perdida</p>
                <p className="text-xs text-gray-400">{wsError}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cache indicator */}
        {data?.cached && !loading && !error && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Zap className="h-3 w-3 text-green-500" />
            <span>Datos desde caché</span>
          </div>
        )}

        {/* Currency Header Card with Realtime Price */}
        <CurrencyHeader
          symbol={selectedPair}
          currentPrice={marketStats.currentPrice}
          change={marketStats.change}
          changePercent={marketStats.changePercent}
          high={marketStats.high}
          low={marketStats.low}
          loading={loading}
          realtimePrice={realtimeQuote?.price}
          isRealtimeConnected={isConnected}
        />

        {/* Charts Tabs */}
        <Tabs defaultValue="price" className="space-y-3">
          <TabsList className="bg-[#0a1a0a] border border-green-900/50 w-full justify-start overflow-x-auto flex-nowrap">
            <TabsTrigger value="price" className="text-xs data-[state=active]:bg-green-900/30 data-[state=active]:text-green-400">
              <Activity className="w-3 h-3 mr-1" />
              Precio
            </TabsTrigger>
            <TabsTrigger value="rsi" className="text-xs data-[state=active]:bg-green-900/30 data-[state=active]:text-green-400">
              <TrendingUp className="w-3 h-3 mr-1" />
              RSI
            </TabsTrigger>
            <TabsTrigger value="macd" className="text-xs data-[state=active]:bg-green-900/30 data-[state=active]:text-green-400">
              <BarChart2 className="w-3 h-3 mr-1" />
              MACD
            </TabsTrigger>
            <TabsTrigger value="bollinger" className="text-xs data-[state=active]:bg-green-900/30 data-[state=active]:text-green-400">
              <Waves className="w-3 h-3 mr-1" />
              Bollinger
            </TabsTrigger>
            <TabsTrigger value="stochastic" className="text-xs data-[state=active]:bg-green-900/30 data-[state=active]:text-green-400">
              <Percent className="w-3 h-3 mr-1" />
              Estocástico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="price">
            <div className="bg-[#0a1a0a] border border-green-900/50 rounded-lg p-3">
              <PriceChart 
                pair={selectedPair} 
                timeframe={selectedTimeframe}
                priceData={data?.priceData}
                smaData={data?.smaData}
                loading={loading}
                error={error}
                realtimePrice={realtimeQuote?.price}
                isRealtimeConnected={isConnected}
                patternAlertConfig={{
                  enabled: alertConfig.enablePatternAlerts,
                  types: alertConfig.patternAlertTypes,
                  enableSound: alertConfig.patternEnableSound,
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="rsi">
            <div className="bg-[#0a1a0a] border border-green-900/50 rounded-lg p-3">
              <RSIChart 
                pair={selectedPair} 
                timeframe={selectedTimeframe}
                rsiData={data?.rsiData}
                loading={loading}
                error={error}
              />
            </div>
          </TabsContent>

          <TabsContent value="macd">
            <div className="bg-[#0a1a0a] border border-green-900/50 rounded-lg p-3">
              <MACDChart 
                pair={selectedPair} 
                timeframe={selectedTimeframe}
                macdData={data?.macdData}
                loading={loading}
                error={error}
              />
            </div>
          </TabsContent>

          <TabsContent value="bollinger">
            <div className="bg-[#0a1a0a] border border-green-900/50 rounded-lg p-3">
              <BollingerChart 
                pair={selectedPair} 
                timeframe={selectedTimeframe}
                priceData={data?.priceData}
                loading={loading}
                error={error}
                realtimePrice={realtimeQuote?.price}
                isRealtimeConnected={isConnected}
              />
            </div>
          </TabsContent>

          <TabsContent value="stochastic">
            <div className="bg-[#0a1a0a] border border-green-900/50 rounded-lg p-3">
              <StochasticChart 
                pair={selectedPair} 
                timeframe={selectedTimeframe}
                priceData={data?.priceData}
                loading={loading}
                error={error}
                realtimePrice={realtimeQuote?.price}
                isRealtimeConnected={isConnected}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Indicators Summary Chart */}
        <IndicatorsSummaryChart 
          priceData={data?.priceData}
          rsiData={data?.rsiData}
          macdData={data?.macdData}
          smaData={data?.smaData}
          loading={loading}
        />

        {/* Market Sentiment */}
        <MarketSentiment
          symbol={selectedPair}
          highPrice={marketStats.high}
          lowPrice={marketStats.low}
          dailyChange={marketStats.changePercent}
          pipsChange={marketStats.change}
          realtimePrice={realtimeQuote?.price}
          isRealtimeConnected={isConnected}
        />

        {/* Price Prediction */}
        <PricePrediction
          symbol={selectedPair}
          currentPrice={marketStats.currentPrice}
          realtimePrice={realtimeQuote?.price}
          isRealtimeConnected={isConnected}
        />

        {/* Technical Levels */}
        <TechnicalLevels
          symbol={selectedPair}
          currentPrice={marketStats.currentPrice}
          realtimePrice={realtimeQuote?.price}
          isRealtimeConnected={isConnected}
        />

        {/* Candlestick Chart - Previous Day Only */}
        <CandlestickChart
          data={previousDayData?.candles || []}
          resistance={previousDayData?.resistance || marketStats.resistance}
          support={previousDayData?.support || marketStats.support}
          loading={previousDayLoading}
          realtimePrice={realtimeQuote?.price}
          isRealtimeConnected={isConnected}
          previousDayDate={previousDayData?.date}
          alertState={alertState}
        />

        {/* Collapsible Sections */}
        <div className="space-y-3">
          <StrategicRecommendations
            symbol={selectedPair}
            currentPrice={marketStats.currentPrice}
            realtimePrice={realtimeQuote?.price}
            isRealtimeConnected={isConnected}
          />

          <MarketConclusions
            symbol={selectedPair}
            currentPrice={marketStats.currentPrice}
            realtimePrice={realtimeQuote?.price}
            isRealtimeConnected={isConnected}
          />

          <MonetaryPolicies symbol={selectedPair} />


          {/* Relevant News with Images */}
          <RelevantNews symbol={selectedPair} />

          <MajorNews symbol={selectedPair} />

          <EconomicEvents symbol={selectedPair} date={selectedDay} />
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
}
