import { Loader2 } from 'lucide-react';
import { useTechnicalLevels } from '@/hooks/useAnalysisData';
import { AnalysisError } from './AnalysisError';
import { useTranslation } from '@/i18n/LanguageContext';
import { formatPrice } from '@/lib/utils';
import { useMemo } from 'react';

interface TechnicalLevelsProps {
  symbol: string;
  currentPrice: number;
  realtimePrice?: number;
  isRealtimeConnected?: boolean;
}

// Map of Spanish backend descriptions to i18n keys
const DESCRIPTION_MAP: Record<string, string> = {
  'resistencia inmediata': 'analysis_tl_immediate_resistance',
  'soporte inmediato': 'analysis_tl_immediate_support',
  'máximo semanal': 'analysis_tl_weekly_high',
  'mínimo semanal': 'analysis_tl_weekly_low',
  'máximo diario': 'analysis_tl_daily_high',
  'mínimo diario': 'analysis_tl_daily_low',
  'máximo mensual': 'analysis_tl_monthly_high',
  'mínimo mensual': 'analysis_tl_monthly_low',
  'resistencia fuerte': 'analysis_tl_strong_resistance',
  'soporte fuerte': 'analysis_tl_strong_support',
  'resistencia clave': 'analysis_tl_key_resistance',
  'soporte clave': 'analysis_tl_key_support',
  'nivel psicológico': 'analysis_tl_psychological_level',
  'cierre anterior': 'analysis_tl_previous_close',
  'zona clave': 'analysis_tl_key_zone',
};

function translateDescription(desc: string | undefined, t: (key: string) => string): string | undefined {
  if (!desc) return undefined;
  const key = DESCRIPTION_MAP[desc.toLowerCase()];
  return key ? t(key) : desc;
}

export function TechnicalLevels({ symbol, currentPrice, realtimePrice }: TechnicalLevelsProps) {
  const { t } = useTranslation();
  const effectivePrice = realtimePrice || currentPrice;
  const { data, isLoading, error } = useTechnicalLevels(symbol, effectivePrice);

  const translatedData = useMemo(() => {
    if (!data) return null;
    return {
      ...data,
      resistances: data.resistances.map(r => ({
        ...r,
        description: translateDescription(r.description, t),
      })),
      supports: data.supports.map(s => ({
        ...s,
        description: translateDescription(s.description, t),
      })),
    };
  }, [data, t]);

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

  if (error || !translatedData) {
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
          <span className="text-white font-mono font-bold">{formatPrice(translatedData.pivot, symbol)}</span>
        </div>

        <div>
          <h4 className="text-gray-400 mb-2">{t('analysis_key_resistances')}:</h4>
          <div className="space-y-2">
            {translatedData.resistances.map((level, index) => (
              <div key={index} className="flex items-start gap-2 p-2 bg-slate-800/60 rounded">
                <span className="text-red-400 font-mono font-bold shrink-0">{formatPrice(level.level, symbol)}</span>
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
            {translatedData.supports.map((level, index) => (
              <div key={index} className="flex items-start gap-2 p-2 bg-slate-800/60 rounded">
                <span className="text-green-400 font-mono font-bold shrink-0">{formatPrice(level.level, symbol)}</span>
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

        {translatedData.fibonacci && translatedData.fibonacci.length > 0 && (
          <div>
            <h4 className="text-gray-400 mb-2">{t('analysis_fibonacci_levels')}:</h4>
            <div className="grid grid-cols-3 gap-2">
              {translatedData.fibonacci.map((fib, index) => (
                <div key={index} className="text-center p-2 bg-slate-800/60 rounded">
                  <p className="text-blue-400 text-xs">{fib.level}</p>
                  <p className="text-white font-mono text-xs">{formatPrice(fib.price, symbol)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
