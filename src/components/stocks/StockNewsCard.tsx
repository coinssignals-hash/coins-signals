import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Newspaper, ExternalLink, Clock } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useTranslation } from '@/i18n/LanguageContext';
import { useDateLocale } from '@/hooks/useDateLocale';

interface Props {
  data: any;
  loading: boolean;
}

function NewsArticle({ article, dateLocale }: { article: any; dateLocale: Locale }) {
  let timeAgo = '';
  try {
    timeAgo = formatDistanceToNow(parseISO(article.publishedAt), { addSuffix: true, locale: dateLocale });
  } catch { timeAgo = ''; }

  return (
    <a href={article.url} target="_blank" rel="noopener noreferrer"
      className="flex gap-3 bg-[hsl(210,50%,10%)]/60 border border-cyan-800/10 rounded-lg p-3 hover:border-cyan-600/30 transition-colors group">
      {article.image && (
        <img src={article.image} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0 bg-[hsl(210,40%,12%)]"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white/80 line-clamp-2 group-hover:text-cyan-200 transition-colors">{article.title}</p>
        {article.summary && (
          <p className="text-[10px] text-cyan-300/40 line-clamp-2 mt-1">{article.summary}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-cyan-800/30 text-cyan-300/60">{article.provider}</Badge>
          <span className="text-[10px] text-cyan-300/40">{article.source}</span>
          {timeAgo && (
            <span className="text-[10px] text-cyan-300/40 flex items-center gap-0.5 ml-auto">
              <Clock className="w-2.5 h-2.5" />
              {timeAgo}
            </span>
          )}
        </div>
      </div>
      <ExternalLink className="w-3.5 h-3.5 text-cyan-400/40 shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
    </a>
  );
}

export function StockNewsCard({ data, loading }: Props) {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();

  if (loading) {
    return (
      <div className="relative rounded-xl border border-cyan-800/30 overflow-hidden p-4 space-y-3"
        style={{ background: 'radial-gradient(ellipse at center 40%, hsl(200, 100%, 12%) 0%, hsl(205, 100%, 6%) 70%, hsl(210, 100%, 4%) 100%)' }}>
        <Skeleton className="h-5 w-40 bg-slate-800/50" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full bg-slate-800/50" />)}
      </div>
    );
  }

  const articles = data?.articles || [];

  if (articles.length === 0) {
    return (
      <div className="relative rounded-xl border border-cyan-800/30 overflow-hidden p-4"
        style={{ background: 'radial-gradient(ellipse at center 40%, hsl(200, 100%, 12%) 0%, hsl(205, 100%, 6%) 70%, hsl(210, 100%, 4%) 100%)' }}>
        <p className="text-sm text-slate-500 text-center py-4">{t('stock_no_recent_news')}</p>
      </div>
    );
  }

  const providerCounts: Record<string, number> = {};
  articles.forEach((a: any) => { providerCounts[a.provider] = (providerCounts[a.provider] || 0) + 1; });

  return (
    <div className="relative rounded-xl border border-cyan-800/30 overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center 40%, hsl(200, 100%, 12%) 0%, hsl(205, 100%, 6%) 70%, hsl(210, 100%, 4%) 100%)' }}>
      
      <div className="absolute top-0 left-[15%] right-[15%] h-[1px]" style={{ background: 'radial-gradient(ellipse at center, hsl(200, 80%, 55%) 0%, transparent 70%)' }} />
      
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-cyan-200 flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-cyan-400" />
            {t('stock_news_label')} ({articles.length})
          </h3>
          <div className="flex items-center gap-1">
            {Object.entries(providerCounts).map(([provider, count]) => (
              <Badge key={provider} variant="outline" className="text-[9px] px-1.5 py-0 border-cyan-800/30 text-cyan-300/60">
                {provider} ({count})
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {articles.map((article: any, i: number) => (
            <NewsArticle key={i} article={article} dateLocale={dateLocale} />
          ))}
        </div>
      </div>
    </div>
  );
}