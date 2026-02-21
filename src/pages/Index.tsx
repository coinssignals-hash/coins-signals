import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { BottomNav } from '@/components/layout/BottomNav';
import { MainDrawer } from '@/components/layout/MainDrawer';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RefreshCw, Bell, Clock, Zap, Activity, TrendingUp, BarChart2, Waves, Percent, WifiOff, Menu, Brain } from 'lucide-react';
import { useTranslation } from '@/i18n/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
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
import { PortfolioWidget } from '@/components/portfolio/PortfolioWidget';
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

const TIMEFRAME_KEYS: Record<string, string> = {
  '5min': 'index_timeframe_5min',
  '15min': 'index_timeframe_15min',
  '30min': 'index_timeframe_30min',
  '1h': 'index_timeframe_1h',
  '4h': 'index_timeframe_4h',
  '1day': 'index_timeframe_1day',
  '1week': 'index_timeframe_1week',
};
const TIMEFRAME_VALUES = ['5min', '15min', '30min', '1h', '4h', '1day', '1week'];

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
  const [base, quote] = symbol.split('/');
  
  const cryptos = ['BTC', 'ETH', 'XRP', 'SOL', 'BNB', 'ADA', 'DOGE', 'DOT', 'AVAX', 'MATIC', 'LINK', 'UNI', 'ATOM', 'LTC', 'XLM', 'SHIB', 'PEPE'];
  
  if (cryptos.includes(base)) {
    return `X:${base}${quote || 'USD'}`;
  }
  
  return `C:${base}${quote || 'USD'}`;
}

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
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
  
  const { data: previousDayData, loading: previousDayLoading } = usePreviousDayCandles(selectedPair);
  
  const polygonSymbol = formatSymbolForPolygon(selectedPair);
  const { quotes, isConnected, isReconnecting, reconnectAttempt, error: wsError, subscribe, unsubscribe, getQuote } = useRealtimeMarket([polygonSymbol]);
  
  const realtimeQuote = getQuote(polygonSymbol);
  
  useEffect(() => {
    const newSymbol = formatSymbolForPolygon(selectedPair);
    subscribe([newSymbol]);
    
    return () => {
      unsubscribe([newSymbol]);
    };
  }, [selectedPair, subscribe, unsubscribe]);
  
  useIndicatorAlerts(data, selectedPair, alertConfig);

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

  const candleData = useMemo(() => {
    if (!data?.priceData || data.priceData.length === 0) {
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

  const getInitials = () => {
    if (profile?.first_name) {
      return `${profile.first_name.charAt(0)}${profile.last_name?.charAt(0) || ''}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="min-h-screen bg-[#06080f] flex justify-center">
      <div className="relative w-full max-w-[390px] min-h-screen bg-gradient-to-b from-[#0a0f1a] via-[#0d1829] to-[#0a0f1a] pb-20 shadow-2xl">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#0a0f1a]/95 backdrop-blur-sm border-b border-blue-500/20">
          <div className="flex items-center justify-between px-4 py-3">
            <button 
              onClick={() => setDrawerOpen(true)}
              className="p-2 text-blue-300 hover:text-blue-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <h1 className="text-2xl font-bold text-white tracking-wide">
              Coins <span className="text-yellow-400">$</span>ignals
            </h1>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigate(user ? '/settings' : '/auth')}
                className="p-2 text-blue-300 hover:text-blue-100"
              >
                {user ? (
                  <Avatar className="w-8 h-8 border-2 border-blue-500/50">
                    <AvatarImage src={profile?.avatar_url || ''} alt="Avatar" />
                    <AvatarFallback className="bg-blue-600 text-white text-xs">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                )}
              </button>
            </div>
          </div>
        </header>

        <DayTabs selectedDay={selectedDay} onSelectDay={setSelectedDay} />
        
      <main className="p-4 space-y-4">
        <PortfolioWidget />
        <div className="flex items-center gap-2 flex-wrap">
          <SymbolSearch 
            value={selectedPair} 
            onChange={setSelectedPair}
            className="flex-1 min-w-[180px]"
          />
          
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-[100px] bg-slate-800/60 border-slate-700/50 text-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              {TIMEFRAME_VALUES.map(tf => (
                <SelectItem key={tf} value={tf}>{t(TIMEFRAME_KEYS[tf])}</SelectItem>
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
              <Button variant="outline" size="icon" className="shrink-0 border-slate-700/50 bg-slate-800/60 text-blue-400 hover:bg-slate-700/60">
                <Bell className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[320px] sm:w-[380px] bg-slate-900 border-slate-700">
              <SheetHeader>
                <SheetTitle className="text-white">{t('index_indicator_alerts')}</SheetTitle>
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
            className="shrink-0 border-slate-700/50 bg-slate-800/60 text-blue-400 hover:bg-slate-700/60"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {isRateLimited && (
          <Card className="border-yellow-500/50 bg-yellow-500/10">
            <CardContent className="p-3 flex items-center gap-3">
              <Clock className="h-5 w-5 text-yellow-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-yellow-400 font-medium">{t('index_api_limit')}</p>
                <p className="text-xs text-gray-400">{t('index_api_limit_desc')}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {error && !isRateLimited && (
          <Card className="border-red-500/50 bg-red-500/10">
            <CardContent className="p-3">
              <p className="text-sm text-red-400">{error}</p>
            </CardContent>
          </Card>
        )}

        {isReconnecting && (
          <Card className="border-orange-500/50 bg-orange-500/10 animate-pulse">
            <CardContent className="p-3 flex items-center gap-3">
              <WifiOff className="h-5 w-5 text-orange-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-orange-400 font-medium">{t('index_reconnecting')}</p>
                <p className="text-xs text-gray-400">{t('index_reconnecting_desc')}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {wsError && !isReconnecting && (
          <Card className="border-red-500/50 bg-red-500/10">
            <CardContent className="p-3 flex items-center gap-3">
              <WifiOff className="h-5 w-5 text-red-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-400 font-medium">{t('index_realtime_lost')}</p>
                <p className="text-xs text-gray-400">{wsError}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {data?.cached && !loading && !error && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Zap className="h-3 w-3 text-green-500" />
            <span>{t('index_cached_data')}</span>
          </div>
        )}

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

        <Tabs defaultValue="price" className="space-y-3">
          <TabsList className="bg-slate-800/60 border border-slate-700/50 w-full justify-start overflow-x-auto flex-nowrap">
            <TabsTrigger value="price" className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400">
              <Activity className="w-3 h-3 mr-1" />
              {t('index_tab_price')}
            </TabsTrigger>
            <TabsTrigger value="rsi" className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400">
              <TrendingUp className="w-3 h-3 mr-1" />
              {t('index_tab_rsi')}
            </TabsTrigger>
            <TabsTrigger value="macd" className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400">
              <BarChart2 className="w-3 h-3 mr-1" />
              {t('index_tab_macd')}
            </TabsTrigger>
            <TabsTrigger value="bollinger" className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400">
              <Waves className="w-3 h-3 mr-1" />
              {t('index_tab_bollinger')}
            </TabsTrigger>
            <TabsTrigger value="stochastic" className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400">
              <Percent className="w-3 h-3 mr-1" />
              {t('index_tab_stochastic')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="price">
            <div className="rounded-lg p-3" style={{ background: 'hsl(215, 100%, 4%)', border: '1px solid hsla(200, 60%, 35%, 0.3)' }}>
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
            <div className="rounded-lg p-3" style={{ background: 'hsl(215, 100%, 4%)', border: '1px solid hsla(200, 60%, 35%, 0.3)' }}>
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
            <div className="rounded-lg p-3" style={{ background: 'hsl(215, 100%, 4%)', border: '1px solid hsla(200, 60%, 35%, 0.3)' }}>
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
            <div className="rounded-lg p-3" style={{ background: 'hsl(215, 100%, 4%)', border: '1px solid hsla(200, 60%, 35%, 0.3)' }}>
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
            <div className="rounded-lg p-3" style={{ background: 'hsl(215, 100%, 4%)', border: '1px solid hsla(200, 60%, 35%, 0.3)' }}>
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

        <IndicatorsSummaryChart 
          priceData={data?.priceData}
          rsiData={data?.rsiData}
          macdData={data?.macdData}
          smaData={data?.smaData}
          loading={loading}
        />

        <MarketSentiment
          symbol={selectedPair}
          highPrice={marketStats.high}
          lowPrice={marketStats.low}
          dailyChange={marketStats.changePercent}
          pipsChange={marketStats.change}
          realtimePrice={realtimeQuote?.price}
          isRealtimeConnected={isConnected}
        />

        <PricePrediction
          symbol={selectedPair}
          currentPrice={marketStats.currentPrice}
          realtimePrice={realtimeQuote?.price}
          isRealtimeConnected={isConnected}
        />

        <TechnicalLevels
          symbol={selectedPair}
          currentPrice={marketStats.currentPrice}
          realtimePrice={realtimeQuote?.price}
          isRealtimeConnected={isConnected}
        />

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

          <RelevantNews symbol={selectedPair} />

          <MajorNews symbol={selectedPair} />

          <EconomicEvents symbol={selectedPair} date={selectedDay} />
        </div>
      </main>

        {/* Drawer */}
        <MainDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />

        {/* Bottom Navigation */}
        <BottomNav />
      </div>
    </div>
  );
};

export default Index;
