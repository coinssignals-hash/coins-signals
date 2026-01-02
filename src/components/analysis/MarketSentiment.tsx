import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { Loader2 } from 'lucide-react';
import { useMarketSentiment } from '@/hooks/useAnalysisData';
import { useAIAnalysis } from '@/hooks/useAIAnalysis';
import { AnalysisError } from './AnalysisError';
import { AIRegenerateButton } from './AIRegenerateButton';
import { AIRefreshOverlay } from './AIRefreshOverlay';

interface MarketSentimentProps {
  symbol: string;
  highPrice: number;
  lowPrice: number;
  dailyChange: number;
  pipsChange: number;
}

export function MarketSentiment({
  symbol,
  highPrice,
  lowPrice,
  dailyChange,
  pipsChange,
}: MarketSentimentProps) {
  const { data: sentimentData, isLoading, error } = useMarketSentiment(symbol);
  const { generateAnalysis, isLoading: isAILoading } = useAIAnalysis();
  const [aiSentiment, setAISentiment] = useState<Record<string, unknown> | null>(null);

  const handleRegenerateWithAI = async () => {
    const result = await generateAnalysis('sentiment', symbol, {
      currentPrice: (highPrice + lowPrice) / 2,
      previousClose: (highPrice + lowPrice) / 2 - (dailyChange / 100),
      high: highPrice,
      low: lowPrice
    });
    if (result?.analysis) {
      setAISentiment(result.analysis);
    }
  };

  // Use AI data if available, otherwise use API data
  const displayData = aiSentiment || sentimentData;

  const chartData = [
    { name: 'Alcista', value: aiSentiment 
      ? Math.round(((Number(aiSentiment.score) || 0) + 1) / 2 * 100) 
      : (sentimentData?.bullishPercent || 0) as number, color: '#22c55e' },
    { name: 'Neutro', value: aiSentiment 
      ? Math.round((1 - Math.abs(Number(aiSentiment.score) || 0)) * 50) 
      : (sentimentData?.neutralPercent || 0) as number, color: '#eab308' },
    { name: 'Bajista', value: aiSentiment 
      ? Math.round((1 - (Number(aiSentiment.score) || 0)) / 2 * 100) 
      : (sentimentData?.bearishPercent || 0) as number, color: '#ef4444' },
  ];

  if (isLoading) {
    return (
      <div className="bg-[#0a1a0a] border border-green-900/50 rounded-lg p-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-green-400 animate-spin" />
          <span className="ml-2 text-gray-400">Cargando sentimiento...</span>
        </div>
      </div>
    );
  }

  if (error && !aiSentiment) {
    return (
      <AnalysisError 
        title="Sentimiento del Mercado"
        error={error as Error}
        compact
      />
    );
  }

  return (
    <AIRefreshOverlay isRefreshing={isAILoading}>
      <div className="bg-[#0a1a0a] border border-green-900/50 rounded-lg p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-lg">Sentimiento del Mercado</h3>
          <AIRegenerateButton 
            onClick={handleRegenerateWithAI} 
            isLoading={isAILoading}
          />
        </div>

        {aiSentiment && (
          <div className="mb-3 text-xs text-purple-400 flex items-center gap-1">
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            Análisis generado con IA
          </div>
        )}

        {/* Overall Sentiment Badge - Prominent */}
        {sentimentData && (
          <div className="flex justify-center mb-4">
            <div className={`px-6 py-2 rounded-full text-lg font-bold flex items-center gap-2 ${
              sentimentData.overall === 'bullish' ? 'bg-green-900/40 text-green-400 border border-green-500/30' :
              sentimentData.overall === 'bearish' ? 'bg-red-900/40 text-red-400 border border-red-500/30' :
              'bg-yellow-900/40 text-yellow-400 border border-yellow-500/30'
            }`}>
              <span className={`w-3 h-3 rounded-full ${
                sentimentData.overall === 'bullish' ? 'bg-green-400' :
                sentimentData.overall === 'bearish' ? 'bg-red-400' : 'bg-yellow-400'
              }`} />
              {sentimentData.overall === 'bullish' ? 'Alcista' :
               sentimentData.overall === 'bearish' ? 'Bajista' : 'Neutral'}
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Sentiment Chart */}
          <div className="lg:col-span-1">
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="horizontal">
                  <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis hide domain={[0, 100]} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-around mt-2">
              {chartData.map((item) => (
                <div key={item.name} className="text-center">
                  <div className="text-[10px] text-gray-500">{item.name}</div>
                  <div className="text-sm font-bold" style={{ color: item.color }}>{item.value}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Price Stats - 2x2 Grid */}
          <div className="lg:col-span-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-900/10 border border-green-900/30 rounded-lg p-3 text-center">
                <span className="text-gray-400 text-xs block">Máximo</span>
                <div className="text-green-400 text-xl font-bold font-mono">{highPrice.toFixed(4)}</div>
              </div>
              <div className="bg-red-900/10 border border-red-900/30 rounded-lg p-3 text-center">
                <span className="text-gray-400 text-xs block">Mínimo</span>
                <div className="text-red-400 text-xl font-bold font-mono">{lowPrice.toFixed(4)}</div>
              </div>
              <div className="bg-gray-900/30 border border-gray-700/30 rounded-lg p-3 text-center">
                <span className="text-gray-400 text-xs block">Cambio</span>
                <div className={`text-lg font-bold ${dailyChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {dailyChange >= 0 ? '+' : ''}{dailyChange.toFixed(2)}%
                </div>
              </div>
              <div className="bg-gray-900/30 border border-gray-700/30 rounded-lg p-3 text-center">
                <span className="text-gray-400 text-xs block">Pips</span>
                <div className={`text-lg font-bold ${pipsChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {pipsChange >= 0 ? '+' : ''}{(pipsChange * 10000).toFixed(0)}
                </div>
              </div>
            </div>
          </div>

          {/* Indicators */}
          <div className="lg:col-span-1">
            {sentimentData?.indicators && sentimentData.indicators.length > 0 && (
              <div className="h-full flex flex-col">
                <p className="text-xs text-gray-400 mb-2">Indicadores Técnicos:</p>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  {sentimentData.indicators.slice(0, 4).map((indicator, i) => (
                    <div 
                      key={i}
                      className={`rounded-lg p-2 text-center ${
                        indicator.signal === 'buy' ? 'bg-green-900/20 border border-green-900/40' :
                        indicator.signal === 'sell' ? 'bg-red-900/20 border border-red-900/40' :
                        'bg-yellow-900/20 border border-yellow-900/40'
                      }`}
                    >
                      <div className="text-[10px] text-gray-400">{indicator.name}</div>
                      <div className={`text-xs font-semibold ${
                        indicator.signal === 'buy' ? 'text-green-400' :
                        indicator.signal === 'sell' ? 'text-red-400' : 'text-yellow-400'
                      }`}>
                        {indicator.signal === 'buy' ? 'Compra' : indicator.signal === 'sell' ? 'Venta' : 'Neutro'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AIRefreshOverlay>
  );
}
