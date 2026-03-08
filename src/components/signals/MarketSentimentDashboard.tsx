import { useMemo } from "react";
import { Loader2, TrendingUp, TrendingDown, Minus, AlertTriangle, BarChart3, Newspaper, Activity, Globe, Users, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MarketSentimentData } from "@/hooks/useSignalMarketSentiment";
import { useTranslation } from "@/i18n/LanguageContext";

interface Props {
  data: MarketSentimentData | null;
  loading: boolean;
}

function ScoreGauge({ score, size = 80 }: {score: number;size?: number;}) {
  const normalized = (score + 100) / 2;
  const clampedPercent = Math.max(0, Math.min(100, normalized));
  const isPositive = score > 0;
  const isNeutral = Math.abs(score) <= 10;

  const color = isNeutral ?
  "hsl(45, 80%, 55%)" :
  isPositive ?
  `hsl(${135 - Math.min(score, 100) * 0.35}, 70%, 50%)` :
  `hsl(${Math.max(0, 30 + score * 0.3)}, 70%, 55%)`;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
        <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(225, 20%, 12%)" strokeWidth="2.5" />
        <circle
          cx="18" cy="18" r="15" fill="none"
          stroke={color}
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeDasharray={`${clampedPercent * 0.942} ${100 * 0.942}`}
          style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
        <circle cx="18" cy="18" r="12" fill="hsl(225, 25%, 8%)" fillOpacity="0.9" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-base font-extrabold" style={{ color, textShadow: `0 0 6px ${color}40` }}>
          {score > 0 ? "+" : ""}{score}
        </span>
      </div>
    </div>);
}

function SourceBar({
  icon,
  label,
  score,
  detail
}: {icon: React.ReactNode;label: string;score: number;detail: string;}) {
  const normalized = (score + 100) / 2;
  const isPositive = score > 0;
  const color = isPositive ? "hsl(135, 70%, 50%)" : score < -10 ? "hsl(0, 70%, 55%)" : "hsl(45, 80%, 55%)";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-semibold text-cyan-200">{label}</span>
        </div>
        <span className="text-sm font-bold" style={{ color }}>
          {score > 0 ? "+" : ""}{score}
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-800/80 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.max(2, normalized)}%`, background: color }} />
      </div>
      <p className="text-[11px] text-cyan-300/50 leading-relaxed line-clamp-3">{detail}</p>
    </div>);
}

function FlowComparison({ retail, institutional, detail }: {retail: number;institutional: number;detail: string;}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
      <Users className="w-4 h-4 text-purple-400" />
        <span className="text-xs font-semibold text-cyan-200">{t('signal_sentiment_capital_flow')}</span>
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
             <span className="text-[11px] text-cyan-300/60">{t('signal_sentiment_retail')}</span>
            <span className="text-xs font-bold text-orange-400">{retail}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-800/80 overflow-hidden">
            <div className="h-full rounded-full bg-orange-400 transition-all duration-700" style={{ width: `${retail}%` }} />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
             <span className="text-[11px] text-cyan-300/60">{t('signal_sentiment_institutional')}</span>
            <span className="text-xs font-bold text-blue-400">{institutional}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-800/80 overflow-hidden">
            <div className="h-full rounded-full bg-blue-400 transition-all duration-700" style={{ width: `${institutional}%` }} />
          </div>
        </div>
      </div>
      <p className="text-[11px] text-cyan-300/50 leading-relaxed line-clamp-3">{detail}</p>
    </div>);
}

function TechnicalIndicators({ indicators }: {indicators: {rsi: number;macdSignal: string;trendStrength: string;smaAlignment: string;};}) {
  const rsiColor = indicators.rsi > 70 ? "hsl(0, 70%, 55%)" : indicators.rsi < 30 ? "hsl(135, 70%, 50%)" : "hsl(45, 80%, 55%)";
  const macdColor = indicators.macdSignal === "bullish" ? "hsl(135, 70%, 50%)" : indicators.macdSignal === "bearish" ? "hsl(0, 70%, 55%)" : "hsl(45, 80%, 55%)";

  return (
    <div className="grid grid-cols-4 gap-2 mt-2">
      {[
      { label: "RSI", value: indicators.rsi.toString(), color: rsiColor },
      { label: "MACD", value: indicators.macdSignal === "bullish" ? "↑" : indicators.macdSignal === "bearish" ? "↓" : "→", color: macdColor },
      { label: "Fuerza", value: indicators.trendStrength === "strong" ? "Alta" : indicators.trendStrength === "moderate" ? "Media" : "Baja", color: indicators.trendStrength === "strong" ? "hsl(135, 70%, 50%)" : "hsl(45, 80%, 55%)" },
      { label: "SMA", value: indicators.smaAlignment === "bullish" ? "↑" : indicators.smaAlignment === "bearish" ? "↓" : "↔", color: indicators.smaAlignment === "bullish" ? "hsl(135, 70%, 50%)" : indicators.smaAlignment === "bearish" ? "hsl(0, 70%, 55%)" : "hsl(45, 80%, 55%)" }].
      map((ind) =>
      <div
        key={ind.label}
        className="text-center rounded-md py-1.5"
        style={{ background: "hsla(210, 80%, 12%, 0.6)", border: "1px solid hsla(200, 60%, 35%, 0.15)" }}>
          <span className="text-[10px] text-cyan-300/50 block">{ind.label}</span>
          <span className="text-sm font-bold" style={{ color: ind.color }}>{ind.value}</span>
        </div>
      )}
    </div>);
}

export function MarketSentimentDashboard({ data, loading }: Props) {
  const { t } = useTranslation();

  if (loading && !data) {
    return (
      <div
        className="mx-3 mb-3 rounded-lg p-6 flex flex-col items-center justify-center gap-2"
        style={{
          background: "linear-gradient(180deg, hsl(210, 100%, 6%) 0%, hsl(205, 80%, 10%) 100%)",
          border: "1px solid hsla(200, 60%, 35%, 0.3)"
        }}>
        <Loader2 className="w-7 h-7 text-cyan-400 animate-spin" />
        <span className="text-xs text-cyan-300/60 uppercase tracking-wider">Analizando sentimiento del mercado...</span>
      </div>);
  }

  if (!data) return null;

  const OverallIcon = data.overallScore > 10 ? TrendingUp : data.overallScore < -10 ? TrendingDown : Minus;
  const overallColor = data.overallScore > 10 ?
  "hsl(135, 70%, 50%)" :
  data.overallScore < -10 ?
  "hsl(0, 70%, 55%)" :
  "hsl(45, 80%, 55%)";

  const riskColors: Record<string, string> = {
    bajo: "hsl(135, 70%, 50%)",
    moderado: "hsl(45, 80%, 55%)",
    alto: "hsl(25, 80%, 55%)",
    extremo: "hsl(0, 70%, 55%)"
  };

  return;

















































































































































}