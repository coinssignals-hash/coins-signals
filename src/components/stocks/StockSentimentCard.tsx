import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  data: any;
  loading: boolean;
}

function SentimentGauge({ score, label }: { score: number; label: string }) {
  // score from -1 to 1
  const pct = ((score + 1) / 2) * 100;
  const color = score > 0.15 ? 'hsl(142, 70%, 45%)' : score < -0.15 ? 'hsl(0, 70%, 50%)' : 'hsl(45, 80%, 50%)';
  const sentimentLabel = score > 0.15 ? 'Alcista' : score < -0.15 ? 'Bajista' : 'Neutral';

  return (
    <div className="bg-secondary/50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
        <span className="text-xs font-bold" style={{ color }}>{sentimentLabel}</span>
      </div>

      {/* Gauge bar */}
      <div className="relative h-3 rounded-full bg-gradient-to-r from-[hsl(0,70%,50%)] via-[hsl(45,80%,50%)] to-[hsl(142,70%,45%)] overflow-hidden">
        <div
          className="absolute top-0 w-1 h-full bg-foreground rounded-full shadow-lg transition-all duration-500"
          style={{ left: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-muted-foreground">Bajista</span>
        <span className="text-[9px] text-muted-foreground font-mono">{(score * 100).toFixed(0)}%</span>
        <span className="text-[9px] text-muted-foreground">Alcista</span>
      </div>
    </div>
  );
}

function SentimentArticle({ article }: { article: any }) {
  const scoreColor = article.tickerScore > 0.15 ? 'text-[hsl(142,70%,45%)]' :
    article.tickerScore < -0.15 ? 'text-[hsl(0,70%,50%)]' : 'text-yellow-400';

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-secondary/30 rounded-lg p-2.5 hover:bg-secondary/50 transition-colors group"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-foreground line-clamp-2 flex-1 group-hover:text-primary transition-colors">
          {article.title}
        </p>
        <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="flex items-center gap-2 mt-1.5">
        <span className="text-[10px] text-muted-foreground">{article.source}</span>
        <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0", scoreColor)}>
          {article.tickerSentiment}
        </Badge>
        {article.relevance > 0 && (
          <span className="text-[9px] text-muted-foreground ml-auto">
            Relevancia: {(article.relevance * 100).toFixed(0)}%
          </span>
        )}
      </div>
    </a>
  );
}

export function StockSentimentCard({ data, loading }: Props) {
  if (loading) {
    return (
      <Card className="p-4 bg-card border-border space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-32 w-full" />
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="p-4 bg-card border-border">
        <p className="text-sm text-muted-foreground text-center py-4">Análisis de sentimiento no disponible</p>
      </Card>
    );
  }

  const avData = data.alphaVantage;
  const fhData = data.finnhub;

  return (
    <Card className="p-4 bg-card border-border space-y-3">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
        <Brain className="w-4 h-4 text-primary" />
        Análisis de Sentimiento
      </h3>

      {/* Alpha Vantage overall sentiment */}
      {avData && (
        <SentimentGauge score={avData.avgScore} label={`Sentimiento General (${avData.count} artículos)`} />
      )}

      {/* Finnhub sentiment metrics */}
      {fhData?.sentiment && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-secondary/50 rounded-lg p-2 text-center">
            <p className="text-[9px] text-muted-foreground">Alcista</p>
            <p className="text-sm font-mono font-bold text-[hsl(142,70%,45%)]">
              {((fhData.sentiment.bullishPercent || 0) * 100).toFixed(0)}%
            </p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-2 text-center">
            <p className="text-[9px] text-muted-foreground">Bajista</p>
            <p className="text-sm font-mono font-bold text-[hsl(0,70%,50%)]">
              {((fhData.sentiment.bearishPercent || 0) * 100).toFixed(0)}%
            </p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-2 text-center">
            <p className="text-[9px] text-muted-foreground">News Score</p>
            <p className="text-sm font-mono font-bold text-foreground">
              {(fhData.companyNewsScore || 0).toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Finnhub buzz */}
      {fhData?.buzz && (
        <div className="bg-secondary/30 rounded-lg p-2.5 border border-border/50">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Buzz (menciones)</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <p className="text-[9px] text-muted-foreground">Total</p>
              <p className="text-xs font-mono font-semibold text-foreground">{fhData.buzz.articlesInLastWeek || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] text-muted-foreground">Buzz</p>
              <p className="text-xs font-mono font-semibold text-foreground">{(fhData.buzz.buzz || 0).toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] text-muted-foreground">Promedio Semanal</p>
              <p className="text-xs font-mono font-semibold text-foreground">{(fhData.buzz.weeklyAverage || 0).toFixed(0)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Sentiment articles */}
      {avData?.articles?.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Artículos analizados</p>
          {avData.articles.slice(0, 5).map((article: any, i: number) => (
            <SentimentArticle key={i} article={article} />
          ))}
        </div>
      )}
    </Card>
  );
}
