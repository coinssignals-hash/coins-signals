import { format } from 'date-fns';
import { es, enUS, ptBR, fr } from 'date-fns/locale';
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { usePricePrediction } from '@/hooks/useAnalysisData';
import { AnalysisError } from './AnalysisError';
import { useTranslation } from '@/i18n/LanguageContext';
import { formatPrice } from '@/lib/utils';

interface PricePredictionProps {
  symbol: string;
  currentPrice: number;
  realtimePrice?: number;
  isRealtimeConnected?: boolean;
}

export function PricePrediction({ symbol, currentPrice, realtimePrice }: PricePredictionProps) {
  const { t, language } = useTranslation();
  const DATE_LOCALES: Record<string, typeof es> = { es, en: enUS, pt: ptBR, fr };
  const dateLocale = DATE_LOCALES[language] ?? es;

  const { data, isLoading, error } = usePricePrediction(symbol, currentPrice);

  const today = new Date();
  const dateStr = format(today, "PPP", { locale: dateLocale });

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
          <span className="ml-2 text-gray-400">{t('analysis_loading_prediction')}</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <AnalysisError 
        title={t('analysis_price_prediction')}
        error={error as Error}
        compact
      />
    );
  }

  const trendIcon = data.direction === 'up' ? <TrendingUp className="w-5 h-5" /> :
                    data.direction === 'down' ? <TrendingDown className="w-5 h-5" /> :
                    <Minus className="w-5 h-5" />;
  
  const trendColor = data.direction === 'up' ? 'text-green-400' : 
                     data.direction === 'down' ? 'text-red-400' : 'text-yellow-400';
  
  const trendText = data.direction === 'up' ? t('analysis_trend_bullish') : 
                    data.direction === 'down' ? t('analysis_trend_bearish') : t('analysis_trend_sideways');

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="text-white font-semibold">{t('analysis_price_prediction')}</h3>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 ${trendColor}`}>
            {trendIcon}
          </span>
          <span className="text-cyan-400 text-2xl font-bold font-mono">{data.currentPrice.toFixed(4)}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-slate-800/60 rounded-lg">
        <div className="text-center">
          <p className="text-gray-400 text-xs mb-1">{t('analysis_expected_low')}</p>
          <p className="text-red-400 font-mono font-semibold">{data.predictedLow.toFixed(4)}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-400 text-xs mb-1">{t('analysis_expected_close')}</p>
          <p className="text-white font-mono font-semibold">{data.predictedClose.toFixed(4)}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-400 text-xs mb-1">{t('analysis_expected_high')}</p>
          <p className="text-green-400 font-mono font-semibold">{data.predictedHigh.toFixed(4)}</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-400">{t('analysis_prediction_confidence')}</span>
          <span className={`font-semibold ${
            data.confidence >= 70 ? 'text-green-400' : 
            data.confidence >= 50 ? 'text-yellow-400' : 'text-red-400'
          }`}>{data.confidence}%</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              data.confidence >= 70 ? 'bg-green-500' : 
              data.confidence >= 50 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${data.confidence}%` }}
          />
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <h4 className="text-white font-semibold mb-1">{t('analysis_day_synthesis')}</h4>
          <p className="text-gray-300 leading-relaxed">
            {data.symbol}{' '}
            <span className={trendColor}>{trendText}</span> — {dateStr}. {data.summary}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>Timeframe: {data.timeframe}</span>
          <span>•</span>
          <span>{t('analysis_last_update')}: {format(new Date(), 'HH:mm')}</span>
        </div>
      </div>
    </div>
  );
}
