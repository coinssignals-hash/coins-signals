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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Sentiment Chart */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-center text-white font-semibold">Sentimiento del Mercado</h3>
            <AIRegenerateButton 
              onClick={handleRegenerateWithAI} 
              isLoading={isAILoading}
            />
          </div>
          {aiSentiment && (
            <div className="mb-2 text-xs text-purple-400 flex items-center gap-1">
              <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
              Análisis generado con IA
            </div>
          )}
          <div className="h-32">
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
                <div className="text-xs text-gray-400">{item.name}</div>
                <div className="font-bold" style={{ color: item.color }}>{item.value}%</div>
              </div>
            ))}
          </div>
          
          {/* Indicators summary */}
          {sentimentData?.indicators && sentimentData.indicators.length > 0 && (
            <div className="mt-3 pt-3 border-t border-green-900/30">
              <p className="text-xs text-gray-400 mb-2">Indicadores:</p>
              <div className="flex flex-wrap gap-2">
                {sentimentData.indicators.slice(0, 4).map((indicator, i) => (
                  <span 
                    key={i}
                    className={`text-xs px-2 py-1 rounded ${
                      indicator.signal === 'buy' ? 'bg-green-900/30 text-green-400' :
                      indicator.signal === 'sell' ? 'bg-red-900/30 text-red-400' :
                      'bg-yellow-900/30 text-yellow-400'
                    }`}
                  >
                    {indicator.name}: {indicator.signal === 'buy' ? 'Compra' : indicator.signal === 'sell' ? 'Venta' : 'Neutro'}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Price Stats */}
        <div className="space-y-3">
          <div>
            <span className="text-gray-400 text-sm">Precio Máximo Del Día</span>
            <div className="text-green-400 text-2xl font-bold font-mono">{highPrice.toFixed(4)}</div>
          </div>
          <div>
            <span className="text-gray-400 text-sm">Precio Mínimo Del Día</span>
            <div className="text-red-400 text-2xl font-bold font-mono">{lowPrice.toFixed(4)}</div>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <span className="text-gray-400 text-xs">Valoración Del Día</span>
              <div className={`text-lg font-bold ${dailyChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {dailyChange >= 0 ? '+' : ''}{dailyChange.toFixed(2)}%
              </div>
            </div>
            <div>
              <span className="text-gray-400 text-xs">Pips</span>
              <div className={`text-lg font-bold ${pipsChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {pipsChange >= 0 ? '+' : ''}{(pipsChange * 10000).toFixed(0)}
              </div>
            </div>
          </div>
          
          {/* Overall sentiment badge */}
          {sentimentData && (
            <div className="pt-2">
              <span className="text-gray-400 text-xs">Sentimiento General:</span>
              <span className={`ml-2 px-3 py-1 rounded-full text-sm font-semibold ${
                sentimentData.overall === 'bullish' ? 'bg-green-900/30 text-green-400' :
                sentimentData.overall === 'bearish' ? 'bg-red-900/30 text-red-400' :
                'bg-yellow-900/30 text-yellow-400'
              }`}>
                {sentimentData.overall === 'bullish' ? 'Alcista' :
                 sentimentData.overall === 'bearish' ? 'Bajista' : 'Neutral'}
              </span>
            </div>
          )}
        </div>
      </div>
      </div>
    </AIRefreshOverlay>
  );
}
