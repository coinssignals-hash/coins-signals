import { Loader2 } from 'lucide-react';
import { useTechnicalLevels } from '@/hooks/useAnalysisData';
import { AnalysisError } from './AnalysisError';
import { useTranslation } from '@/i18n/LanguageContext';

interface TechnicalLevelsProps {
  symbol: string;
  currentPrice: number;
  realtimePrice?: number;
  isRealtimeConnected?: boolean;
}

export function TechnicalLevels({ symbol, currentPrice, realtimePrice }: TechnicalLevelsProps) {
  const { t } = useTranslation();
  const effectivePrice = realtimePrice || currentPrice;
  const { data, isLoading, error } = useTechnicalLevels(symbol, effectivePrice);

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
          <span className="ml-2 text-gray-400">{t('analysis_loading_levels')}</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <AnalysisError 
        title={t('analysis_technical_levels')}
        error={error as Error}
        compact
      />
    );
  }

  const getStrengthBadge = (strength: 'strong' | 'moderate' | 'weak') => {
    switch (strength) {
      case 'strong': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'moderate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'weak': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStrengthLabel = (strength: 'strong' | 'moderate' | 'weak') => {
    switch (strength) {
      case 'strong': return t('analysis_strong');
      case 'moderate': return t('analysis_moderate');
      case 'weak': return t('analysis_weak');
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">{t('analysis_technical_levels')}</h3>
      </div>
      
      <div className="space-y-4 text-sm">
        <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-lg">
          <span className="text-gray-400">{t('analysis_pivot_point')}</span>
          <span className="text-white font-mono font-bold">{data.pivot.toFixed(4)}</span>
        </div>

        <div>
          <h4 className="text-gray-400 mb-2">{t('analysis_key_resistances')}:</h4>
          <div className="space-y-2">
            {data.resistances.map((level, index) => (
              <div key={index} className="flex items-start gap-2 p-2 bg-slate-800/60 rounded">
                <span className="text-red-400 font-mono font-bold shrink-0">{level.level.toFixed(4)}</span>
                <span className={`px-2 py-0.5 text-xs rounded border ${getStrengthBadge(level.strength)}`}>
                  {getStrengthLabel(level.strength)}
                </span>
                {level.description && (
                  <span className="text-gray-400 text-xs">{level.description}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-gray-400 mb-2">{t('analysis_key_supports')}:</h4>
          <div className="space-y-2">
            {data.supports.map((level, index) => (
              <div key={index} className="flex items-start gap-2 p-2 bg-slate-800/60 rounded">
                <span className="text-green-400 font-mono font-bold shrink-0">{level.level.toFixed(4)}</span>
                <span className={`px-2 py-0.5 text-xs rounded border ${getStrengthBadge(level.strength)}`}>
                  {getStrengthLabel(level.strength)}
                </span>
                {level.description && (
                  <span className="text-gray-400 text-xs">{level.description}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {data.fibonacci && data.fibonacci.length > 0 && (
          <div>
            <h4 className="text-gray-400 mb-2">{t('analysis_fibonacci_levels')}:</h4>
            <div className="grid grid-cols-3 gap-2">
              {data.fibonacci.map((fib, index) => (
                <div key={index} className="text-center p-2 bg-slate-800/60 rounded">
                  <p className="text-blue-400 text-xs">{fib.level}</p>
                  <p className="text-white font-mono text-xs">{fib.price.toFixed(4)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
