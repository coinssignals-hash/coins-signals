import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Newspaper, ExternalLink, Clock } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  data: any;
  loading: boolean;
}

function NewsArticle({ article }: { article: any }) {
  let timeAgo = '';
  try {
    timeAgo = formatDistanceToNow(parseISO(article.publishedAt), { addSuffix: true, locale: es });
  } catch { timeAgo = ''; }

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 bg-secondary/30 rounded-lg p-3 hover:bg-secondary/50 transition-colors group"
    >
      {article.image && (
        <img
          src={article.image}
          alt=""
          className="w-16 h-16 rounded-lg object-cover shrink-0 bg-muted"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {article.title}
        </p>
        {article.summary && (
          <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1">{article.summary}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <Badge variant="outline" className="text-[9px] px-1.5 py-0">{article.provider}</Badge>
          <span className="text-[10px] text-muted-foreground">{article.source}</span>
          {timeAgo && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 ml-auto">
              <Clock className="w-2.5 h-2.5" />
              {timeAgo}
            </span>
          )}
        </div>
      </div>
      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
    </a>
  );
}

export function StockNewsCard({ data, loading }: Props) {
  if (loading) {
    return (
      <Card className="p-4 bg-card border-border space-y-3">
        <Skeleton className="h-5 w-40" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
      </Card>
    );
  }

  const articles = data?.articles || [];

  if (articles.length === 0) {
    return (
      <Card className="p-4 bg-card border-border">
        <p className="text-sm text-muted-foreground text-center py-4">No hay noticias recientes</p>
      </Card>
    );
  }

  // Count by provider
  const providerCounts: Record<string, number> = {};
  articles.forEach((a: any) => { providerCounts[a.provider] = (providerCounts[a.provider] || 0) + 1; });

  return (
    <Card className="p-4 bg-card border-border space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-primary" />
          Noticias ({articles.length})
        </h3>
        <div className="flex items-center gap-1">
          {Object.entries(providerCounts).map(([provider, count]) => (
            <Badge key={provider} variant="outline" className="text-[9px] px-1.5 py-0">
              {provider} ({count})
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {articles.map((article: any, i: number) => (
          <NewsArticle key={i} article={article} />
        ))}
      </div>
    </Card>
  );
}
