import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import { useMarketSentiment } from '@/hooks/useAnalysisData';
import { AnalysisError } from './AnalysisError';
import { useTranslation } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';

interface MarketSentimentProps {
  symbol: string;
  highPrice: number;
  lowPrice: number;
  dailyChange: number;
  pipsChange: number;
  realtimePrice?: number;
  isRealtimeConnected?: boolean;
}

export function MarketSentiment({
  symbol,
  highPrice,
  lowPrice,
  dailyChange,
  pipsChange,
}: MarketSentimentProps) {
  const { t } = useTranslation();
  const { data: sentimentData, isLoading, error } = useMarketSentiment(symbol);

  const chartData = [
    { name: t('analysis_bullish'), value: (sentimentData?.bullishPercent || 0) as number, color: '#22c55e' },
    { name: t('analysis_neutral'), value: (sentimentData?.neutralPercent || 0) as number, color: '#eab308' },
    { name: t('analysis_bearish'), value: (sentimentData?.bearishPercent || 0) as number, color: '#ef4444' },
  ];

  const dominantSentiment = chartData.reduce((prev, current) =>
    prev.value > current.value ? prev : current
  );

  const trendInfo = {
    bullish: { icon: TrendingUp, label: t('analysis_bullish'), color: 'text-green-400' },
    bearish: { icon: TrendingDown, label: t('analysis_bearish'), color: 'text-red-400' },
    neutral: { icon: Minus, label: t('analysis_neutral'), color: 'text-yellow-400' },
  };

  const currentTrend = sentimentData?.overall || (
    dominantSentiment.name === t('analysis_bullish') ? 'bullish' :
    dominantSentiment.name === t('analysis_bearish') ? 'bearish' : 'neutral');

  const TrendIcon = trendInfo[currentTrend as keyof typeof trendInfo]?.icon || Minus;

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
          <span className="ml-2 text-gray-400">{t('analysis_loading_sentiment')}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <AnalysisError
        title={t('analysis_market_sentiment')}
        error={error as Error}
        compact
      />
    );
  }

  return (
    <div className="p-4 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-lg">{t('analysis_market_sentiment')}</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 flex gap-3">
          <div className={cn(
            "flex flex-col items-center justify-center px-3 py-2 rounded-xl border transition-all shrink-0",
            currentTrend === 'bullish' ? 'bg-green-900/20 border-green-500/40' :
            currentTrend === 'bearish' ? 'bg-red-900/20 border-red-500/40' :
            'bg-yellow-900/20 border-yellow-500/40'
          )}>
            <TrendIcon className={cn("w-6 h-6", trendInfo[currentTrend as keyof typeof trendInfo]?.color)} />
            <div className={cn("text-sm font-bold mt-1", trendInfo[currentTrend as keyof typeof trendInfo]?.color)}>
              {trendInfo[currentTrend as keyof typeof trendInfo]?.label}
            </div>
            <div className="text-lg font-bold text-white">{dominantSentiment.value}%</div>
          </div>

          <div className="flex-1">
            <div className="flex justify-center gap-4 mt-2">
              {chartData.map((item) => (
                <div key={item.name} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] text-gray-400">{item.name}</span>
                  <span className="text-xs font-bold" style={{ color: item.color }}>{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-slate-800/40 border border-slate-700/30 rounded-lg p-2 text-center">
              <span className="text-gray-400 text-[10px] block">{t('analysis_high')}</span>
              <div className="text-green-400 text-sm font-bold font-mono">{highPrice.toFixed(4)}</div>
            </div>
            <div className="bg-slate-800/40 border border-slate-700/30 rounded-lg p-2 text-center">
              <span className="text-gray-400 text-[10px] block">{t('analysis_low')}</span>
              <div className="text-red-400 text-sm font-bold font-mono">{lowPrice.toFixed(4)}</div>
            </div>
            <div className="bg-slate-800/40 border border-slate-700/30 rounded-lg p-2 text-center">
              <span className="text-gray-400 text-[10px] block">{t('analysis_change')}</span>
              <div className={`text-sm font-bold ${dailyChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {dailyChange >= 0 ? '+' : ''}{dailyChange.toFixed(2)}%
              </div>
            </div>
            <div className="bg-slate-800/40 border border-slate-700/30 rounded-lg p-2 text-center">
              <span className="text-gray-400 text-[10px] block">{t('analysis_pips')}</span>
              <div className={`text-sm font-bold ${pipsChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {pipsChange >= 0 ? '+' : ''}{(pipsChange * 10000).toFixed(0)}
              </div>
            </div>

            {sentimentData?.indicators && sentimentData.indicators.slice(0, 4).map((indicator, i) => (
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
                  {indicator.signal === 'buy' ? t('analysis_buy_signal') : indicator.signal === 'sell' ? t('analysis_sell_signal') : t('analysis_neutral_signal')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
