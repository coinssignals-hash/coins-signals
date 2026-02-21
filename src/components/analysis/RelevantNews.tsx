import { Loader2, ExternalLink } from 'lucide-react';
import { useRelevantNews } from '@/hooks/useAnalysisData';
import { format } from 'date-fns';
import { es, enUS, ptBR, fr } from 'date-fns/locale';
import { AnalysisError } from './AnalysisError';
import { useTranslation } from '@/i18n/LanguageContext';

interface RelevantNewsProps {
  symbol: string;
}

export function RelevantNews({ symbol }: RelevantNewsProps) {
  const { t, language } = useTranslation();
  const DATE_LOCALES: Record<string, typeof es> = { es, en: enUS, pt: ptBR, fr };
  const dateLocale = DATE_LOCALES[language] ?? es;
  const { data: news, isLoading, error } = useRelevantNews(symbol);

  if (isLoading) {
    return (
      <div className="bg-[#0a1a0a] rounded-xl border-2 border-green-500/30 p-4">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 text-green-400 animate-spin" />
          <span className="ml-2 text-gray-400 text-sm">{t('analysis_loading_relevant')}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <AnalysisError 
        title={t('analysis_relevant_news')}
        error={error as Error}
        compact
      />
    );
  }

  if (!news || news.length === 0) {
    return (
      <div className="bg-[#0a1a0a] rounded-xl border-2 border-green-500/30 p-4">
        <p className="text-gray-400 text-sm">{t('analysis_no_relevant_news')}</p>
      </div>
    );
  }

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getImpactLabel = (impact: string) => {
    switch (impact) {
      case 'high': return t('analysis_impact_high');
      case 'medium': return t('analysis_impact_medium');
      case 'low': return t('analysis_impact_low');
      default: return impact;
    }
  };

  return (
    <div className="bg-[#0a1a0a] rounded-xl border-2 border-green-500/30 p-4 space-y-4">
      <h3 className="text-white font-semibold text-sm">{t('analysis_relevant_news')}</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {news.slice(0, 5).map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block bg-[#0d1f0d] rounded-lg overflow-hidden border border-green-900/30 hover:border-green-500/50 transition-colors"
          >
            <div className="aspect-video relative overflow-hidden">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=200&h=120&fit=crop';
                }}
              />
              <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-xs border ${getImpactBadge(item.impact)}`}>
                {getImpactLabel(item.impact)}
              </div>
            </div>
            
            <div className="p-3 space-y-2">
              <h4 className="text-white text-xs font-medium line-clamp-2 group-hover:text-green-400 transition-colors">
                {item.title}
              </h4>
              <p className="text-gray-400 text-xs line-clamp-2">{item.summary}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">{item.source}</span>
                <span className="text-gray-500">
                  {format(new Date(item.publishedAt), 'HH:mm', { locale: dateLocale })}
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
      
      {news.length > 5 && (
        <div className="text-center">
          <button className="text-green-400 text-xs hover:text-green-300 flex items-center gap-1 mx-auto">
            {t('analysis_view_more_news')} <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
