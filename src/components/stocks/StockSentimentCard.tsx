import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Brain, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  data: any;
  loading: boolean;
}

function SentimentGauge({ score, label }: { score: number; label: string }) {
  const pct = ((score + 1) / 2) * 100;
  const color = score > 0.15 ? 'hsl(142, 70%, 45%)' : score < -0.15 ? 'hsl(0, 70%, 50%)' : 'hsl(45, 80%, 50%)';
  const sentimentLabel = score > 0.15 ? 'Alcista' : score < -0.15 ? 'Bajista' : 'Neutral';

  return (
    <div className="bg-[hsl(210,50%,10%)]/80 border border-cyan-800/15 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-cyan-300/40 uppercase tracking-wider">{label}</span>
        <span className="text-xs font-bold" style={{ color }}>{sentimentLabel}</span>
      </div>
      <div className="relative h-3 rounded-full bg-gradient-to-r from-[hsl(0,70%,50%)] via-[hsl(45,80%,50%)] to-[hsl(142,70%,45%)] overflow-hidden">
        <div
          className="absolute top-0 w-1 h-full bg-white rounded-full shadow-lg transition-all duration-500"
          style={{ left: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-cyan-300/40">Bajista</span>
        <span className="text-[9px] text-cyan-300/50 font-mono">{(score * 100).toFixed(0)}%</span>
        <span className="text-[9px] text-cyan-300/40">Alcista</span>
      </div>
    </div>
  );
}

function SentimentArticle({ article }: { article: any }) {
  const scoreColor = article.tickerScore > 0.15 ? 'text-[hsl(142,70%,45%)]' :
    article.tickerScore < -0.15 ? 'text-[hsl(0,70%,55%)]' : 'text-[hsl(45,80%,50%)]';

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-[hsl(210,50%,10%)]/60 border border-cyan-800/10 rounded-lg p-2.5 hover:border-cyan-600/30 transition-colors group"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-white/80 line-clamp-2 flex-1 group-hover:text-cyan-200 transition-colors">
          {article.title}
        </p>
        <ExternalLink className="w-3 h-3 text-cyan-400/40 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="flex items-center gap-2 mt-1.5">
        <span className="text-[10px] text-cyan-300/40">{article.source}</span>
        <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 border-cyan-800/30", scoreColor)}>
          {article.tickerSentiment}
        </Badge>
        {article.relevance > 0 && (
          <span className="text-[9px] text-cyan-300/40 ml-auto">
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
      <div className="relative rounded-xl border border-cyan-800/30 overflow-hidden p-4 space-y-3"
        style={{ background: 'radial-gradient(ellipse at center 40%, hsl(200, 100%, 12%) 0%, hsl(205, 100%, 6%) 70%, hsl(210, 100%, 4%) 100%)' }}>
        <Skeleton className="h-5 w-40 bg-slate-800/50" />
        <Skeleton className="h-16 w-full bg-slate-800/50" />
        <Skeleton className="h-32 w-full bg-slate-800/50" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="relative rounded-xl border border-cyan-800/30 overflow-hidden p-4"
        style={{ background: 'radial-gradient(ellipse at center 40%, hsl(200, 100%, 12%) 0%, hsl(205, 100%, 6%) 70%, hsl(210, 100%, 4%) 100%)' }}>
        <p className="text-sm text-slate-500 text-center py-4">Análisis de sentimiento no disponible</p>
      </div>
    );
  }

  const avData = data.alphaVantage;
  const fhData = data.finnhub;

  return (
    <div className="relative rounded-xl border border-cyan-800/30 overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center 40%, hsl(200, 100%, 12%) 0%, hsl(205, 100%, 6%) 70%, hsl(210, 100%, 4%) 100%)' }}>
      
      <div className="absolute top-0 left-[15%] right-[15%] h-[1px]" style={{ background: 'radial-gradient(ellipse at center, hsl(200, 80%, 55%) 0%, transparent 70%)' }} />
      
      <div className="p-4 space-y-3">
        <h3 className="text-sm font-bold text-cyan-200 flex items-center gap-2">
          <Brain className="w-4 h-4 text-cyan-400" />
          Análisis de Sentimiento
        </h3>

        {avData && (
          <SentimentGauge score={avData.avgScore} label={`Sentimiento General (${avData.count} artículos)`} />
        )}

        {fhData?.sentiment && (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[hsl(210,50%,10%)]/80 border border-cyan-800/15 rounded-lg p-2 text-center">
              <p className="text-[9px] text-cyan-300/40">Alcista</p>
              <p className="text-sm font-mono font-bold text-[hsl(142,70%,45%)]">
                {((fhData.sentiment.bullishPercent || 0) * 100).toFixed(0)}%
              </p>
            </div>
            <div className="bg-[hsl(210,50%,10%)]/80 border border-cyan-800/15 rounded-lg p-2 text-center">
              <p className="text-[9px] text-cyan-300/40">Bajista</p>
              <p className="text-sm font-mono font-bold text-[hsl(0,70%,55%)]">
                {((fhData.sentiment.bearishPercent || 0) * 100).toFixed(0)}%
              </p>
            </div>
            <div className="bg-[hsl(210,50%,10%)]/80 border border-cyan-800/15 rounded-lg p-2 text-center">
              <p className="text-[9px] text-cyan-300/40">News Score</p>
              <p className="text-sm font-mono font-bold text-white">
                {(fhData.companyNewsScore || 0).toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {fhData?.buzz && (
          <div className="bg-[hsl(210,50%,10%)]/60 border border-cyan-800/20 rounded-lg p-2.5">
            <p className="text-[10px] text-cyan-300/40 uppercase tracking-wider mb-1.5">Buzz (menciones)</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <p className="text-[9px] text-cyan-300/40">Total</p>
                <p className="text-xs font-mono font-semibold text-white">{fhData.buzz.articlesInLastWeek || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] text-cyan-300/40">Buzz</p>
                <p className="text-xs font-mono font-semibold text-white">{(fhData.buzz.buzz || 0).toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] text-cyan-300/40">Promedio Semanal</p>
                <p className="text-xs font-mono font-semibold text-white">{(fhData.buzz.weeklyAverage || 0).toFixed(0)}</p>
              </div>
            </div>
          </div>
        )}

        {avData?.articles?.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] text-cyan-300/40 uppercase tracking-wider">Artículos analizados</p>
            {avData.articles.slice(0, 5).map((article: any, i: number) => (
              <SentimentArticle key={i} article={article} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
