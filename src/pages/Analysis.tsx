import { useState, useMemo, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { PageTransition } from '@/components/layout/PageTransition';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  RefreshCw, Bell, Clock, Zap, WifiOff,
  LineChart, Landmark, Brain, Target } from
'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DayTabs } from '@/components/analysis/DayTabs';
import { CurrencyHeader } from '@/components/analysis/CurrencyHeader';
import { TerminalStatusBar } from '@/components/analysis/TerminalStatusBar';
import { QuickStatsGrid } from '@/components/analysis/QuickStatsGrid';
import { MarketSentiment } from '@/components/analysis/MarketSentiment';
import { PricePrediction } from '@/components/analysis/PricePrediction';
import { TechnicalLevels } from '@/components/analysis/TechnicalLevels';
import { CandlestickChart } from '@/components/analysis/CandlestickChart';
import { StrategicRecommendations } from '@/components/analysis/StrategicRecommendations';
import { IndicatorsSummary } from '@/components/analysis/IndicatorsSummary';
import { calcRSI, calcMACD, calcSMA, calcEMA } from '@/lib/indicators';
import { MarketConclusions } from '@/components/analysis/MarketConclusions';
import { MonetaryPolicies } from '@/components/analysis/MonetaryPolicies';
import { MajorNews } from '@/components/analysis/MajorNews';
import { EconomicEvents } from '@/components/analysis/EconomicEvents';
import { RelevantNews } from '@/components/analysis/RelevantNews';
import { AlertsPanel } from '@/components/analysis/AlertsPanel';
import { useAlertConfig } from '@/hooks/useAlertConfig';
import { SymbolSearch } from '@/components/analysis/SymbolSearch';

import { RiskRewardCalculator } from '@/components/analysis/RiskRewardCalculator';
import { HeroDashboard } from '@/components/analysis/HeroDashboard';
import { useMarketData } from '@/hooks/useMarketData';
import { usePreviousDayCandles } from '@/hooks/usePreviousDayCandles';
import { useIndicatorAlerts } from '@/hooks/useIndicatorAlerts';
import { useSupportResistanceAlerts } from '@/hooks/useSupportResistanceAlerts';
import { useRealtimeMarket } from '@/hooks/useRealtimeMarket';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from
'@/components/ui/sheet';

const timeframes = [
{ value: '5min', label: '5M' },
{ value: '15min', label: '15M' },
{ value: '30min', label: '30M' },
{ value: '1h', label: '1H' },
{ value: '4h', label: '4H' },
{ value: '1day', label: '1D' },
{ value: '1week', label: '1W' }];


function formatSymbolForPolygon(symbol: string): string {
  const [base, quote] = symbol.split('/');
  const cryptos = ['BTC', 'ETH', 'XRP', 'SOL', 'BNB', 'ADA', 'DOGE', 'DOT', 'AVAX', 'MATIC', 'LINK', 'UNI', 'ATOM', 'LTC', 'XLM', 'SHIB', 'PEPE'];
  if (cryptos.includes(base)) return `X:${base}${quote || 'USD'}`;
  return `C:${base}${quote || 'USD'}`;
}

export default function Analysis() {
  const navigate = useNavigate();
  const [selectedPair, setSelectedPair] = useState('EUR/USD');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [activePanel, setActivePanel] = useState('tecnico');
  const { config: alertConfig, updateConfig: setAlertConfig } = useAlertConfig();

  const { data, loading, error, refetch, isRateLimited } = useMarketData(selectedPair, selectedTimeframe);
  const { data: previousDayData, loading: previousDayLoading } = usePreviousDayCandles(selectedPair);
  const polygonSymbol = formatSymbolForPolygon(selectedPair);
  const { isConnected, isReconnecting, reconnectAttempt, error: wsError, subscribe, unsubscribe, getQuote } = useRealtimeMarket([polygonSymbol]);
  const realtimeQuote = getQuote(polygonSymbol);

  useEffect(() => {
    const newSymbol = formatSymbolForPolygon(selectedPair);
    subscribe([newSymbol]);
    return () => {unsubscribe([newSymbol]);};
  }, [selectedPair, subscribe, unsubscribe]);

  useIndicatorAlerts(data, selectedPair, alertConfig);

  const marketStats = useMemo(() => {
    if (!data?.priceData || data.priceData.length === 0) {
      return { currentPrice: 1.1689, change: 0.00467, changePercent: 0.40, high: 1.1729, low: 1.1651, resistance: 1.1700, support: 1.1650, pips: 78 };
    }
    const prices = data.priceData;
    const latest = prices[prices.length - 1];
    const first = prices[0];
    const currentPrice = latest?.price || 1.1689;
    const change = currentPrice - (first?.price || currentPrice);
    const changePercent = first?.price ? change / first.price * 100 : 0;
    const high = Math.max(...prices.map((p) => p.high));
    const low = Math.min(...prices.map((p) => p.low));
    const resistance = high - (high - currentPrice) * 0.3;
    const support = low + (currentPrice - low) * 0.3;
    const pips = Math.abs(change) * 10000;
    return { currentPrice, change, changePercent, high, low, resistance, support, pips };
  }, [data?.priceData]);

  const { alertState } = useSupportResistanceAlerts(
    selectedPair, realtimeQuote?.price,
    previousDayData?.support || marketStats.support,
    previousDayData?.resistance || marketStats.resistance,
    { enabled: alertConfig.enableSupportResistance, proximityPercent: alertConfig.srProximityPercent, enableSound: alertConfig.srEnableSound }
  );

  // Compute technical indicators from candle data
  const indicatorData = useMemo(() => {
    const candles = previousDayData?.candles;
    if (!candles || candles.length === 0) return null;
    const ohlcv = candles.map(c => ({ ...c, volume: 0 }));
    const rsi = calcRSI(ohlcv);
    const macd = calcMACD(ohlcv);
    const sma20 = calcSMA(ohlcv, 20);
    const sma50 = calcSMA(ohlcv, 50);
    return {
      priceData: candles.map(c => ({ price: c.close, high: c.high, low: c.low })),
      rsiData: rsi.map(r => ({ rsi: r.value })),
      macdData: macd.map(m => ({ macd: m.macd, signal: m.signal, histogram: m.histogram })),
      smaData: {
        sma20: sma20.map(s => ({ sma: s.value })),
        sma50: sma50.map(s => ({ sma: s.value })),
      },
    };
  }, [previousDayData?.candles]);

  return (
    <PageTransition>
    <div className="min-h-screen bg-[hsl(225,45%,3%)] flex justify-center">
      <div className="relative w-full max-w-2xl min-h-screen bg-gradient-to-b from-[hsl(222,45%,7%)] via-[hsl(218,52%,8%)] to-[hsl(222,45%,7%)] pb-20 shadow-2xl">
      <Header />
      <DayTabs selectedDay={selectedDay} onSelectDay={setSelectedDay} />

      <main className="py-2 px-1 sm:px-4 space-y-1.5 sm:space-y-3">
        {/* Terminal Header Bar */}
        <div className="relative z-20 flex items-center gap-1 sm:gap-2 bg-[#0d1829]/80 backdrop-blur-sm border border-cyan-900/30 rounded-lg sm:rounded-xl p-1.5 sm:p-2">
          <SymbolSearch value={selectedPair} onChange={setSelectedPair} className="flex-1 min-w-[120px]" />
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-[68px] sm:w-[80px] bg-[#0a1628] border-cyan-900/40 text-xs h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0a1628] border-cyan-900/40">
              {timeframes.map((tf) =>
              <SelectItem key={tf.value} value={tf.value} className="text-xs">{tf.label}</SelectItem>
              )}
            </SelectContent>
          </Select>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 border-cyan-900/40 bg-[#0a1628] h-10 w-10 sm:h-9 sm:w-9 active:scale-95 transition-transform">
                <Bell className="w-4 h-4 text-cyan-400" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[85vw] max-w-[380px] bg-[#0a1628] border-cyan-900/40">
              <SheetHeader><SheetTitle className="text-white">Alertas</SheetTitle></SheetHeader>
              <div className="mt-4"><AlertsPanel config={alertConfig} onConfigChange={setAlertConfig} /></div>
            </SheetContent>
          </Sheet>
          <Button variant="outline" size="icon" onClick={() => navigate('/ai-center')} className="shrink-0 border-cyan-900/40 bg-[#0a1628] h-10 w-10 sm:h-9 sm:w-9 active:scale-95 transition-transform" title="Centro de Análisis IA">
            <Brain className="w-4 h-4 text-purple-400" />
          </Button>
          <Button variant="outline" size="icon" onClick={refetch} disabled={loading} className="shrink-0 border-cyan-900/40 bg-[#0a1628] h-10 w-10 sm:h-9 sm:w-9 active:scale-95 transition-transform">
            <RefreshCw className={`w-4 h-4 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Hero Dashboard Summary */}
        <HeroDashboard
          currentPrice={marketStats.currentPrice}
          change={marketStats.change}
          changePercent={marketStats.changePercent}
          high={marketStats.high}
          low={marketStats.low}
          symbol={selectedPair}
          loading={loading}
          isRealtimeConnected={isConnected}
          onSelectPair={setSelectedPair}
        />

        {/* Terminal Status Bar - NEW */}
        <TerminalStatusBar
          symbol={selectedPair}
          currentPrice={realtimeQuote?.price || marketStats.currentPrice}
          high={marketStats.high}
          low={marketStats.low}
          isRealtimeConnected={isConnected} />


        {/* Status Alerts */}
        {isRateLimited &&
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-xs">
            <Clock className="h-4 w-4 text-yellow-500 shrink-0" />
            <span className="text-yellow-400">Límite de API — reintentando en 60s</span>
          </div>
        }
        {error && !isRateLimited

        }
        {isReconnecting &&
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/30 text-xs animate-pulse">
            <WifiOff className="h-4 w-4 text-orange-500 shrink-0" />
            <span className="text-orange-400">Reconectando... intento {reconnectAttempt}/5</span>
          </div>
        }
        {data?.cached && !loading && !error &&
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <Zap className="h-3 w-3 text-cyan-500" /><span>Caché</span>
          </div>
        }

        {/* Currency Header */}
        <CurrencyHeader
          symbol={selectedPair} currentPrice={marketStats.currentPrice}
          change={marketStats.change} changePercent={marketStats.changePercent}
          high={marketStats.high} low={marketStats.low} loading={loading}
          realtimePrice={realtimeQuote?.price} isRealtimeConnected={isConnected} />


        {/* Quick Stats Grid - NEW */}
        <QuickStatsGrid
          currentPrice={marketStats.currentPrice}
          change={marketStats.change}
          changePercent={marketStats.changePercent}
          high={marketStats.high}
          low={marketStats.low}
          resistance={previousDayData?.resistance || marketStats.resistance}
          support={previousDayData?.support || marketStats.support}
          pips={marketStats.pips}
          realtimePrice={realtimeQuote?.price} />


        {/* Terminal Panel Tabs */}
        <Tabs value={activePanel} onValueChange={setActivePanel} className="space-y-2 sm:space-y-3">
          <TabsList className="bg-[#0a1628]/90 border border-cyan-900/30 w-full h-12 sm:h-11 p-1 gap-0.5 sm:gap-1">
            <TabsTrigger value="tecnico" className="flex-1 text-[11px] sm:text-xs gap-1 sm:gap-1.5 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 data-[state=active]:shadow-[0_0_12px_rgba(6,182,212,0.2)] rounded-lg transition-all active:scale-95 py-2.5 sm:py-2">
              <LineChart className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> <span className="hidden xs:inline">Técnico</span><span className="xs:hidden">Téc.</span>
            </TabsTrigger>
            <TabsTrigger value="fundamental" className="flex-1 text-[11px] sm:text-xs gap-1 sm:gap-1.5 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 data-[state=active]:shadow-[0_0_12px_rgba(16,185,129,0.2)] rounded-lg transition-all active:scale-95 py-2.5 sm:py-2">
              <Landmark className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> <span className="hidden xs:inline">Fundamental</span><span className="xs:hidden">Fund.</span>
            </TabsTrigger>
            <TabsTrigger value="sentimiento" className="flex-1 text-[11px] sm:text-xs gap-1 sm:gap-1.5 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 data-[state=active]:shadow-[0_0_12px_rgba(168,85,247,0.2)] rounded-lg transition-all active:scale-95 py-2.5 sm:py-2">
              <Brain className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> <span className="hidden xs:inline">Sentimiento</span><span className="xs:hidden">Sent.</span>
            </TabsTrigger>
            <TabsTrigger value="estrategia" className="flex-1 text-[11px] sm:text-xs gap-1 sm:gap-1.5 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 data-[state=active]:shadow-[0_0_12px_rgba(245,158,11,0.2)] rounded-lg transition-all active:scale-95 py-2.5 sm:py-2">
              <Target className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> <span className="hidden xs:inline">Estrategia</span><span className="xs:hidden">Estr.</span>
            </TabsTrigger>
          </TabsList>

          {/* ═══════════════════ TÉCNICO ═══════════════════ */}
          <TabsContent value="tecnico" className="space-y-3 mt-0">
            {/* Candlestick Chart */}
            <CandlestickChart
              data={previousDayData?.candles || []} resistance={previousDayData?.resistance || marketStats.resistance}
              support={previousDayData?.support || marketStats.support} loading={previousDayLoading}
              realtimePrice={realtimeQuote?.price} isRealtimeConnected={isConnected}
              previousDayDate={previousDayData?.date} alertState={alertState} />

            {/* Technical Levels */}
            <div className="bg-[#0a1628] border border-cyan-900/30 rounded-xl overflow-hidden">
              <TechnicalLevels symbol={selectedPair} currentPrice={marketStats.currentPrice}
              realtimePrice={realtimeQuote?.price} isRealtimeConnected={isConnected} />
            </div>

            {/* Indicators Summary */}
            <IndicatorsSummary
              pair={selectedPair}
              timeframe={selectedTimeframe}
              priceData={indicatorData?.priceData}
              smaData={indicatorData?.smaData}
              rsiData={indicatorData?.rsiData}
              macdData={indicatorData?.macdData}
              loading={previousDayLoading}
            />
          </TabsContent>

          {/* ═══════════════════ FUNDAMENTAL ═══════════════════ */}
          <TabsContent value="fundamental" className="space-y-3 mt-0">
            <div className="bg-[#0a1628] border border-emerald-900/30 rounded-xl overflow-hidden">
              <MonetaryPolicies symbol={selectedPair} />
            </div>
            <div className="bg-[#0a1628] border border-emerald-900/30 rounded-xl overflow-hidden">
              <EconomicEvents symbol={selectedPair} date={selectedDay} />
            </div>
            <div className="bg-[#0a1628] border border-emerald-900/30 rounded-xl overflow-hidden">
              <MajorNews symbol={selectedPair} />
            </div>
            <div className="bg-[#0a1628] border border-emerald-900/30 rounded-xl overflow-hidden">
              <RelevantNews symbol={selectedPair} />
            </div>
          </TabsContent>

          {/* ═══════════════════ SENTIMIENTO ═══════════════════ */}
          <TabsContent value="sentimiento" className="space-y-3 mt-0">
            <div className="bg-[#0a1628] border border-purple-900/30 rounded-xl overflow-hidden">
              <MarketSentiment
                symbol={selectedPair} highPrice={marketStats.high} lowPrice={marketStats.low}
                dailyChange={marketStats.changePercent} pipsChange={marketStats.change}
                realtimePrice={realtimeQuote?.price} isRealtimeConnected={isConnected} />
            </div>
          </TabsContent>

          {/* ═══════════════════ ESTRATEGIA ═══════════════════ */}
          <TabsContent value="estrategia" className="space-y-3 mt-0">
            {/* Risk/Reward Calculator - NEW */}
            <RiskRewardCalculator
              currentPrice={realtimeQuote?.price || marketStats.currentPrice}
              symbol={selectedPair}
              resistance={previousDayData?.resistance || marketStats.resistance}
              support={previousDayData?.support || marketStats.support} />


            <div className="bg-[#0a1628] border border-amber-900/30 rounded-xl overflow-hidden">
              <PricePrediction symbol={selectedPair} currentPrice={marketStats.currentPrice}
              realtimePrice={realtimeQuote?.price} isRealtimeConnected={isConnected} />

            </div>
            <div className="bg-[#0a1628] border border-amber-900/30 rounded-xl overflow-hidden">
              <StrategicRecommendations symbol={selectedPair} currentPrice={marketStats.currentPrice}
              realtimePrice={realtimeQuote?.price} isRealtimeConnected={isConnected} />

            </div>
            <div className="bg-[#0a1628] border border-amber-900/30 rounded-xl overflow-hidden">
              <MarketConclusions symbol={selectedPair} currentPrice={marketStats.currentPrice}
              realtimePrice={realtimeQuote?.price} isRealtimeConnected={isConnected} />

            </div>
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
      </div>
    </div>
    </PageTransition>);
}