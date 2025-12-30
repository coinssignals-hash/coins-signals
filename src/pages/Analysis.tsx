import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Activity, BarChart2, RefreshCw } from 'lucide-react';
import { PriceChart } from '@/components/analysis/PriceChart';
import { RSIChart } from '@/components/analysis/RSIChart';
import { MACDChart } from '@/components/analysis/MACDChart';
import { IndicatorsSummary } from '@/components/analysis/IndicatorsSummary';
import { useMarketData } from '@/hooks/useMarketData';

const currencyPairs = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 
  'AUD/USD', 'USD/CAD', 'NZD/USD', 'EUR/GBP'
];

const timeframes = [
  { value: '1H', label: '1 Hora' },
  { value: '4H', label: '4 Horas' },
  { value: '1D', label: '1 Día' },
  { value: '1W', label: '1 Semana' },
];

export default function Analysis() {
  const [selectedPair, setSelectedPair] = useState('EUR/USD');
  const [selectedTimeframe, setSelectedTimeframe] = useState('4H');
  
  const { data, loading, error, refetch } = useMarketData(selectedPair, selectedTimeframe);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      <main className="container py-4 px-4 max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <BarChart2 className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Análisis Técnico</h1>
              <p className="text-xs text-muted-foreground">Indicadores y gráficos en tiempo real • Twelve Data API</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={selectedPair} onValueChange={setSelectedPair}>
              <SelectTrigger className="w-[130px] bg-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {currencyPairs.map(pair => (
                  <SelectItem key={pair} value={pair}>{pair}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger className="w-[110px] bg-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {timeframes.map(tf => (
                  <SelectItem key={tf.value} value={tf.value}>{tf.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="icon"
              onClick={refetch}
              disabled={loading}
              className="shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={refetch}>
                Reintentar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        <IndicatorsSummary 
          pair={selectedPair} 
          timeframe={selectedTimeframe}
          priceData={data?.priceData}
          smaData={data?.smaData}
          rsiData={data?.rsiData}
          macdData={data?.macdData}
          loading={loading}
        />

        {/* Charts */}
        <Tabs defaultValue="price" className="space-y-4">
          <TabsList className="bg-secondary w-full justify-start overflow-x-auto">
            <TabsTrigger value="price" className="flex items-center gap-1">
              <Activity className="w-4 h-4" />
              Precio + MA
            </TabsTrigger>
            <TabsTrigger value="rsi" className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              RSI
            </TabsTrigger>
            <TabsTrigger value="macd" className="flex items-center gap-1">
              <BarChart2 className="w-4 h-4" />
              MACD
            </TabsTrigger>
          </TabsList>

          <TabsContent value="price" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-base">
                    {selectedPair} - Precio con Medias Móviles
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
                      SMA 20
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                      SMA 50
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <PriceChart 
                  pair={selectedPair} 
                  timeframe={selectedTimeframe}
                  priceData={data?.priceData}
                  smaData={data?.smaData}
                  loading={loading}
                  error={error}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rsi" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    RSI (Índice de Fuerza Relativa) - Período 14
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs bg-red-500/20 text-red-400 border-red-500/30">
                      Sobrecompra 70
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                      Sobreventa 30
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <RSIChart 
                  pair={selectedPair} 
                  timeframe={selectedTimeframe}
                  rsiData={data?.rsiData}
                  loading={loading}
                  error={error}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="macd" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    MACD (12, 26, 9)
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
                      MACD Line
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-orange-500/20 text-orange-400 border-orange-500/30">
                      Signal Line
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <MACDChart 
                  pair={selectedPair} 
                  timeframe={selectedTimeframe}
                  macdData={data?.macdData}
                  loading={loading}
                  error={error}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <BottomNav />
    </div>
  );
}