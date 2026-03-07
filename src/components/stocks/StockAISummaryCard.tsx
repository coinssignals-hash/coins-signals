import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, TrendingUp, TrendingDown, Minus, ShieldAlert, Target, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AISummary {
  recommendation: string;
  confidence: number;
  summary: string;
  technicalSignal: string;
  sentimentSignal: string;
  newsSignal: string;
  keyFactors: string[];
  riskLevel: string;
  priceTarget?: { low: number; mid: number; high: number } | null;
  error?: string;
}

interface StockAISummaryCardProps {
  data: AISummary | undefined;
  loading: boolean;
  currentPrice?: number;
}

const recConfig: Record<string, { color: string; icon: typeof TrendingUp; bg: string }> = {
  COMPRAR: { color: 'text-[hsl(142,70%,45%)]', icon: TrendingUp, bg: 'bg-[hsl(142,70%,45%)]' },
  VENDER: { color: 'text-[hsl(0,70%,55%)]', icon: TrendingDown, bg: 'bg-[hsl(0,70%,55%)]' },
  MANTENER: { color: 'text-[hsl(45,90%,55%)]', icon: Minus, bg: 'bg-[hsl(45,90%,55%)]' },
};

const signalColor = (signal: string) => {
  const s = signal?.toUpperCase();
  if (['ALCISTA', 'POSITIVO'].includes(s)) return 'text-[hsl(142,70%,45%)]';
  if (['BAJISTA', 'NEGATIVO'].includes(s)) return 'text-[hsl(0,70%,55%)]';
  return 'text-slate-400';
};

const riskConfig: Record<string, { color: string; icon: typeof ShieldAlert }> = {
  BAJO: { color: 'text-[hsl(142,70%,45%)]', icon: CheckCircle2 },
  MEDIO: { color: 'text-[hsl(45,90%,55%)]', icon: AlertTriangle },
  ALTO: { color: 'text-[hsl(0,70%,55%)]', icon: ShieldAlert },
};

export function StockAISummaryCard({ data, loading, currentPrice }: StockAISummaryCardProps) {
  if (loading) {
    return (
      <div className="relative rounded-xl border border-cyan-800/30 overflow-hidden p-4 space-y-3"
        style={{ background: 'radial-gradient(ellipse at center 40%, hsl(200, 100%, 15%) 0%, hsl(205, 100%, 7%) 70%, hsl(210, 100%, 5%) 100%)' }}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-sm font-medium text-cyan-300/60">Generando análisis IA...</span>
        </div>
        <Skeleton className="h-16 w-full bg-slate-800/50" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-12 bg-slate-800/50" /><Skeleton className="h-12 bg-slate-800/50" /><Skeleton className="h-12 bg-slate-800/50" />
        </div>
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="relative rounded-xl border border-cyan-800/30 overflow-hidden p-4"
        style={{ background: 'radial-gradient(ellipse at center 40%, hsl(200, 100%, 12%) 0%, hsl(205, 100%, 6%) 70%, hsl(210, 100%, 4%) 100%)' }}>
        <div className="flex items-center gap-2 text-slate-500">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm">Análisis IA no disponible</span>
        </div>
      </div>
    );
  }

  const rec = recConfig[data.recommendation] || recConfig.MANTENER;
  const RecIcon = rec.icon;
  const risk = riskConfig[data.riskLevel] || riskConfig.MEDIO;
  const RiskIcon = risk.icon;

  return (
    <div className="relative rounded-xl border border-cyan-800/30 overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center 40%, hsl(200, 100%, 15%) 0%, hsl(205, 100%, 7%) 70%, hsl(210, 100%, 5%) 100%)' }}>
      
      <div className="absolute top-0 left-[15%] right-[15%] h-[1px]" style={{ background: 'radial-gradient(ellipse at center, hsl(200, 80%, 55%) 0%, transparent 70%)' }} />

      <div className="relative p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-semibold text-cyan-300/60 uppercase tracking-wider">Análisis IA Unificado</span>
          </div>
          <Badge variant="outline" className={cn("text-[10px] gap-1 border-cyan-800/30", risk.color)}>
            <RiskIcon className="w-3 h-3" />
            Riesgo {data.riskLevel}
          </Badge>
        </div>

        {/* Recommendation pill */}
        <div className="flex items-center gap-3">
          <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg", rec.bg + '/15')}>
            <RecIcon className={cn("w-5 h-5", rec.color)} />
            <span className={cn("text-lg font-bold", rec.color)}>{data.recommendation}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-cyan-300/40">Confianza</span>
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 bg-[hsl(210,40%,12%)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${data.confidence}%`, backgroundColor: data.confidence > 70 ? 'hsl(142,70%,45%)' : data.confidence > 40 ? 'hsl(45,90%,55%)' : 'hsl(0,70%,50%)' }}
                />
              </div>
              <span className="text-xs font-mono font-semibold text-white">{data.confidence}%</span>
            </div>
          </div>
        </div>

        {/* Summary */}
        <p className="text-xs text-cyan-200/60 leading-relaxed">{data.summary}</p>

        {/* Signal grid */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Técnico', value: data.technicalSignal },
            { label: 'Sentimiento', value: data.sentimentSignal },
            { label: 'Noticias', value: data.newsSignal },
          ].map(s => (
            <div key={s.label} className="bg-[hsl(210,50%,10%)]/80 border border-cyan-800/15 rounded-lg p-2 text-center">
              <span className="text-[10px] text-cyan-300/40 block">{s.label}</span>
              <span className={cn("text-xs font-bold", signalColor(s.value))}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Price target */}
        {data.priceTarget && currentPrice && (
          <div className="bg-[hsl(210,50%,10%)]/60 border border-cyan-800/15 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Target className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-semibold text-cyan-300/60 uppercase">Precio Objetivo</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="text-center">
                <span className="text-cyan-300/40 block text-[10px]">Bajo</span>
                <span className="font-mono font-semibold text-[hsl(0,70%,55%)]">${data.priceTarget.low?.toFixed(2)}</span>
              </div>
              <div className="text-center">
                <span className="text-cyan-300/40 block text-[10px]">Medio</span>
                <span className="font-mono font-bold text-white">${data.priceTarget.mid?.toFixed(2)}</span>
              </div>
              <div className="text-center">
                <span className="text-cyan-300/40 block text-[10px]">Alto</span>
                <span className="font-mono font-semibold text-[hsl(142,70%,45%)]">${data.priceTarget.high?.toFixed(2)}</span>
              </div>
            </div>
            <div className="mt-2 relative h-1.5 bg-[hsl(210,40%,12%)] rounded-full">
              {(() => {
                const range = data.priceTarget!.high - data.priceTarget!.low;
                const pos = range > 0 ? Math.max(0, Math.min(100, ((currentPrice - data.priceTarget!.low) / range) * 100)) : 50;
                return <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-cyan-400 rounded-full border-2 border-[hsl(210,100%,5%)] shadow-md shadow-cyan-400/30" style={{ left: `${pos}%` }} />;
              })()}
            </div>
          </div>
        )}

        {/* Key factors */}
        {data.keyFactors && data.keyFactors.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {data.keyFactors.map((f, i) => (
              <Badge key={i} variant="outline" className="text-[10px] font-normal border-cyan-800/30 text-cyan-300/60">
                {f}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
