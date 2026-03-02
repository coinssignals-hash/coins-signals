import { Card } from '@/components/ui/card';
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
  COMPRAR: { color: 'text-[hsl(142,70%,45%)]', icon: TrendingUp, bg: 'bg-[hsl(142,70%,45%)]/10' },
  VENDER: { color: 'text-destructive', icon: TrendingDown, bg: 'bg-destructive/10' },
  MANTENER: { color: 'text-[hsl(45,90%,55%)]', icon: Minus, bg: 'bg-[hsl(45,90%,55%)]/10' },
};

const signalColor = (signal: string) => {
  const s = signal?.toUpperCase();
  if (['ALCISTA', 'POSITIVO'].includes(s)) return 'text-[hsl(142,70%,45%)]';
  if (['BAJISTA', 'NEGATIVO'].includes(s)) return 'text-destructive';
  return 'text-muted-foreground';
};

const riskConfig: Record<string, { color: string; icon: typeof ShieldAlert }> = {
  BAJO: { color: 'text-[hsl(142,70%,45%)]', icon: CheckCircle2 },
  MEDIO: { color: 'text-[hsl(45,90%,55%)]', icon: AlertTriangle },
  ALTO: { color: 'text-destructive', icon: ShieldAlert },
};

export function StockAISummaryCard({ data, loading, currentPrice }: StockAISummaryCardProps) {
  if (loading) {
    return (
      <Card className="p-4 bg-card border-border space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-sm font-medium text-muted-foreground">Generando análisis IA...</span>
        </div>
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" />
        </div>
      </Card>
    );
  }

  if (!data || data.error) {
    return (
      <Card className="p-4 bg-card border-border">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm">Análisis IA no disponible</span>
        </div>
      </Card>
    );
  }

  const rec = recConfig[data.recommendation] || recConfig.MANTENER;
  const RecIcon = rec.icon;
  const risk = riskConfig[data.riskLevel] || riskConfig.MEDIO;
  const RiskIcon = risk.icon;

  return (
    <Card className="p-4 bg-card border-border space-y-3 overflow-hidden relative">
      {/* Subtle glow */}
      <div className={cn("absolute inset-0 opacity-5 pointer-events-none", rec.bg)} />

      {/* Header */}
      <div className="flex items-center justify-between relative">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Análisis IA Unificado</span>
        </div>
        <Badge variant="outline" className={cn("text-[10px] gap-1", risk.color)}>
          <RiskIcon className="w-3 h-3" />
          Riesgo {data.riskLevel}
        </Badge>
      </div>

      {/* Recommendation pill */}
      <div className="flex items-center gap-3 relative">
        <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg", rec.bg)}>
          <RecIcon className={cn("w-5 h-5", rec.color)} />
          <span className={cn("text-lg font-bold", rec.color)}>{data.recommendation}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground">Confianza</span>
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", rec.bg.replace('/10', ''))}
                style={{ width: `${data.confidence}%`, backgroundColor: data.confidence > 70 ? 'hsl(142,70%,45%)' : data.confidence > 40 ? 'hsl(45,90%,55%)' : 'hsl(0,70%,50%)' }}
              />
            </div>
            <span className="text-xs font-mono font-semibold text-foreground">{data.confidence}%</span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <p className="text-xs text-muted-foreground leading-relaxed relative">{data.summary}</p>

      {/* Signal grid */}
      <div className="grid grid-cols-3 gap-2 relative">
        <div className="bg-secondary/30 rounded-lg p-2 text-center">
          <span className="text-[10px] text-muted-foreground block">Técnico</span>
          <span className={cn("text-xs font-bold", signalColor(data.technicalSignal))}>{data.technicalSignal}</span>
        </div>
        <div className="bg-secondary/30 rounded-lg p-2 text-center">
          <span className="text-[10px] text-muted-foreground block">Sentimiento</span>
          <span className={cn("text-xs font-bold", signalColor(data.sentimentSignal))}>{data.sentimentSignal}</span>
        </div>
        <div className="bg-secondary/30 rounded-lg p-2 text-center">
          <span className="text-[10px] text-muted-foreground block">Noticias</span>
          <span className={cn("text-xs font-bold", signalColor(data.newsSignal))}>{data.newsSignal}</span>
        </div>
      </div>

      {/* Price target */}
      {data.priceTarget && currentPrice && (
        <div className="bg-secondary/20 rounded-lg p-3 relative">
          <div className="flex items-center gap-1.5 mb-2">
            <Target className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Precio Objetivo</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="text-center">
              <span className="text-muted-foreground block text-[10px]">Bajo</span>
              <span className="font-mono font-semibold text-destructive">${data.priceTarget.low?.toFixed(2)}</span>
            </div>
            <div className="text-center">
              <span className="text-muted-foreground block text-[10px]">Medio</span>
              <span className="font-mono font-bold text-foreground">${data.priceTarget.mid?.toFixed(2)}</span>
            </div>
            <div className="text-center">
              <span className="text-muted-foreground block text-[10px]">Alto</span>
              <span className="font-mono font-semibold text-[hsl(142,70%,45%)]">${data.priceTarget.high?.toFixed(2)}</span>
            </div>
          </div>
          {/* Price position bar */}
          <div className="mt-2 relative h-1.5 bg-secondary rounded-full">
            {(() => {
              const range = data.priceTarget!.high - data.priceTarget!.low;
              const pos = range > 0 ? Math.max(0, Math.min(100, ((currentPrice - data.priceTarget!.low) / range) * 100)) : 50;
              return <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background shadow-md" style={{ left: `${pos}%` }} />;
            })()}
          </div>
        </div>
      )}

      {/* Key factors */}
      {data.keyFactors && data.keyFactors.length > 0 && (
        <div className="flex flex-wrap gap-1.5 relative">
          {data.keyFactors.map((f, i) => (
            <Badge key={i} variant="secondary" className="text-[10px] font-normal">
              {f}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
}
