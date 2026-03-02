import { useMemo } from "react";
import { Loader2, TrendingUp, TrendingDown, Minus, AlertTriangle, BarChart3, Newspaper, Activity, Globe, Users, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MarketSentimentData } from "@/hooks/useSignalMarketSentiment";
import { useTranslation } from "@/i18n/LanguageContext";

interface Props {
  data: MarketSentimentData | null;
  loading: boolean;
}

function ScoreGauge({ score, size = 64 }: { score: number; size?: number }) {
  // Map -100..100 to 0..100 for the arc
  const normalized = (score + 100) / 2;
  const clampedPercent = Math.max(0, Math.min(100, normalized));
  const isPositive = score > 0;
  const isNeutral = Math.abs(score) <= 10;

  const color = isNeutral
    ? "hsl(45, 80%, 55%)"
    : isPositive
    ? `hsl(${135 - Math.min(score, 100) * 0.35}, 70%, 50%)`
    : `hsl(${Math.max(0, 30 + score * 0.3)}, 70%, 55%)`;

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
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
        />
        <circle cx="18" cy="18" r="12" fill="hsl(225, 25%, 8%)" fillOpacity="0.9" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-sm font-extrabold" style={{ color, textShadow: `0 0 6px ${color}40` }}>
          {score > 0 ? "+" : ""}{score}
        </span>
      </div>
    </div>
  );
}

function SourceBar({
  icon,
  label,
  score,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  score: number;
  detail: string;
}) {
  const normalized = (score + 100) / 2;
  const isPositive = score > 0;
  const color = isPositive ? "hsl(135, 70%, 50%)" : score < -10 ? "hsl(0, 70%, 55%)" : "hsl(45, 80%, 55%)";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-[10px] font-semibold text-cyan-200">{label}</span>
        </div>
        <span className="text-[11px] font-bold" style={{ color }}>
          {score > 0 ? "+" : ""}{score}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.max(2, normalized)}%`, background: color }}
        />
      </div>
      <p className="text-[9px] text-cyan-300/50 leading-tight line-clamp-2">{detail}</p>
    </div>
  );
}

function FlowComparison({ retail, institutional, detail }: { retail: number; institutional: number; detail: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Users className="w-3 h-3 text-purple-400" />
        <span className="text-[10px] font-semibold text-cyan-200">Flujo de Capital</span>
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[9px] text-cyan-300/60">Retail</span>
            <span className="text-[10px] font-bold text-orange-400">{retail}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
            <div className="h-full rounded-full bg-orange-400 transition-all duration-700" style={{ width: `${retail}%` }} />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[9px] text-cyan-300/60">Institucional</span>
            <span className="text-[10px] font-bold text-blue-400">{institutional}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
            <div className="h-full rounded-full bg-blue-400 transition-all duration-700" style={{ width: `${institutional}%` }} />
          </div>
        </div>
      </div>
      <p className="text-[9px] text-cyan-300/50 leading-tight line-clamp-2">{detail}</p>
    </div>
  );
}

function TechnicalIndicators({ indicators }: { indicators: { rsi: number; macdSignal: string; trendStrength: string; smaAlignment: string } }) {
  const rsiColor = indicators.rsi > 70 ? "hsl(0, 70%, 55%)" : indicators.rsi < 30 ? "hsl(135, 70%, 50%)" : "hsl(45, 80%, 55%)";
  const macdColor = indicators.macdSignal === "bullish" ? "hsl(135, 70%, 50%)" : indicators.macdSignal === "bearish" ? "hsl(0, 70%, 55%)" : "hsl(45, 80%, 55%)";

  return (
    <div className="grid grid-cols-4 gap-1.5 mt-1.5">
      {[
        { label: "RSI", value: indicators.rsi.toString(), color: rsiColor },
        { label: "MACD", value: indicators.macdSignal === "bullish" ? "↑" : indicators.macdSignal === "bearish" ? "↓" : "→", color: macdColor },
        { label: "Fuerza", value: indicators.trendStrength === "strong" ? "Alta" : indicators.trendStrength === "moderate" ? "Media" : "Baja", color: indicators.trendStrength === "strong" ? "hsl(135, 70%, 50%)" : "hsl(45, 80%, 55%)" },
        { label: "SMA", value: indicators.smaAlignment === "bullish" ? "↑" : indicators.smaAlignment === "bearish" ? "↓" : "↔", color: indicators.smaAlignment === "bullish" ? "hsl(135, 70%, 50%)" : indicators.smaAlignment === "bearish" ? "hsl(0, 70%, 55%)" : "hsl(45, 80%, 55%)" },
      ].map((ind) => (
        <div
          key={ind.label}
          className="text-center rounded-md py-1"
          style={{ background: "hsla(210, 80%, 12%, 0.6)", border: "1px solid hsla(200, 60%, 35%, 0.15)" }}
        >
          <span className="text-[8px] text-cyan-300/50 block">{ind.label}</span>
          <span className="text-[11px] font-bold" style={{ color: ind.color }}>{ind.value}</span>
        </div>
      ))}
    </div>
  );
}

export function MarketSentimentDashboard({ data, loading }: Props) {
  const { t } = useTranslation();

  if (loading && !data) {
    return (
      <div
        className="mx-3 mb-3 rounded-lg p-6 flex flex-col items-center justify-center gap-2"
        style={{
          background: "linear-gradient(180deg, hsl(210, 100%, 6%) 0%, hsl(205, 80%, 10%) 100%)",
          border: "1px solid hsla(200, 60%, 35%, 0.3)",
        }}
      >
        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
        <span className="text-[10px] text-cyan-300/60 uppercase tracking-wider">Analizando sentimiento del mercado...</span>
      </div>
    );
  }

  if (!data) return null;

  const OverallIcon = data.overallScore > 10 ? TrendingUp : data.overallScore < -10 ? TrendingDown : Minus;
  const overallColor = data.overallScore > 10
    ? "hsl(135, 70%, 50%)"
    : data.overallScore < -10
    ? "hsl(0, 70%, 55%)"
    : "hsl(45, 80%, 55%)";

  const riskColors: Record<string, string> = {
    bajo: "hsl(135, 70%, 50%)",
    moderado: "hsl(45, 80%, 55%)",
    alto: "hsl(25, 80%, 55%)",
    extremo: "hsl(0, 70%, 55%)",
  };

  return (
    <div
      className="mx-3 mb-3 rounded-lg relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, hsl(210, 100%, 6%) 0%, hsl(205, 80%, 10%) 100%)",
        border: "1px solid hsla(200, 60%, 35%, 0.3)",
      }}
    >
      {/* Top glow */}
      <div
        className="absolute top-0 left-[10%] right-[10%] h-[1px]"
        style={{ background: "radial-gradient(ellipse at center, hsl(195, 100%, 54%) 0%, transparent 70%)" }}
      />

      <div className="p-3">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
            Sentimiento del Mercado
          </span>
          {loading && <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />}
          {data.cached && <span className="text-[7px] text-cyan-400/40 uppercase">cache</span>}
          {(data as any).realData && (
            <div className="flex gap-0.5 ml-1">
              {(data as any).realData.alphaVantage && <span className="text-[6px] px-1 py-px rounded bg-green-500/10 text-green-400/70">AV</span>}
              {(data as any).realData.finnhub && <span className="text-[6px] px-1 py-px rounded bg-blue-500/10 text-blue-400/70">FH</span>}
              {(data as any).realData.fmp && <span className="text-[6px] px-1 py-px rounded bg-purple-500/10 text-purple-400/70">FMP</span>}
              {(data as any).realData.marketaux && <span className="text-[6px] px-1 py-px rounded bg-orange-500/10 text-orange-400/70">MX</span>}
            </div>
          )}
        </div>

        {/* Overall Score + Label + Risk */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <ScoreGauge score={data.overallScore} size={56} />
            <div>
              <div className="flex items-center gap-1.5">
                <OverallIcon className="w-4 h-4" style={{ color: overallColor }} />
                <span className="text-sm font-bold" style={{ color: overallColor }}>
                  {data.overallLabel}
                </span>
              </div>
              <span className="text-[10px] text-cyan-300/50">
                Confianza: {data.confidence}%
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" style={{ color: riskColors[data.riskLevel] }} />
              <span className="text-[10px] font-bold uppercase" style={{ color: riskColors[data.riskLevel] }}>
                {data.riskLevel}
              </span>
            </div>
            <span className="text-[8px] text-cyan-300/40">Riesgo</span>
          </div>
        </div>

        {/* Real Headlines */}
        {(data as any).headlines?.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Newspaper className="w-3 h-3 text-blue-400" />
              <span className="text-[9px] text-cyan-300/50 uppercase tracking-wider">Titulares en Tiempo Real</span>
            </div>
            <div className="space-y-1">
              {(data as any).headlines.slice(0, 5).map((h: any, i: number) => {
                const sentColor = h.sentiment != null
                  ? h.sentiment > 0.1 ? "hsl(135, 70%, 50%)" : h.sentiment < -0.1 ? "hsl(0, 70%, 55%)" : "hsl(45, 80%, 55%)"
                  : undefined;
                const Wrapper = h.url ? "a" : "div";
                const linkProps = h.url ? { href: h.url, target: "_blank", rel: "noopener noreferrer" } : {};
                return (
                  <Wrapper
                    key={i}
                    {...linkProps}
                    className={`flex items-start gap-1.5 rounded-md px-2 py-1 transition-colors ${h.url ? "cursor-pointer hover:bg-cyan-500/5" : ""}`}
                    style={{ background: "hsla(210, 60%, 10%, 0.6)", border: "1px solid hsla(200, 60%, 35%, 0.1)" }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-[9px] leading-tight line-clamp-2 ${h.url ? "text-cyan-200 hover:text-cyan-100" : "text-cyan-100"}`}>{h.title}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 mt-0.5">
                      {sentColor && (
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: sentColor }} />
                      )}
                      <span className="text-[7px] text-cyan-400/40 uppercase">{h.source}</span>
                      {h.url && <ExternalLink className="w-2.5 h-2.5 text-cyan-400/30" />}
                    </div>
                  </Wrapper>
                );
              })}
            </div>
          </div>
        )}

        {/* Source bars */}
        <div className="space-y-2.5 mb-3">
          <SourceBar
            icon={<Newspaper className="w-3 h-3 text-blue-400" />}
            label="Noticias"
            score={data.sources.news.score}
            detail={data.sources.news.detail}
          />
          <SourceBar
            icon={<Activity className="w-3 h-3 text-green-400" />}
            label="Técnico"
            score={data.sources.technical.score}
            detail={data.sources.technical.detail}
          />
          {data.sources.technical.indicators && (
            <TechnicalIndicators indicators={data.sources.technical.indicators} />
          )}
          <SourceBar
            icon={<TrendingUp className="w-3 h-3 text-yellow-400" />}
            label="Calidad Señal"
            score={data.sources.signalQuality.score}
            detail={data.sources.signalQuality.detail}
          />
          <SourceBar
            icon={<Globe className="w-3 h-3 text-purple-400" />}
            label="Macro"
            score={data.sources.macro.score}
            detail={data.sources.macro.detail}
          />
          <FlowComparison
            retail={data.sources.flow.retailPercent ?? 50}
            institutional={data.sources.flow.institutionalPercent ?? 50}
            detail={data.sources.flow.detail ?? ""}
          />
        </div>

        {/* Key Drivers */}
        {data.keyDrivers?.length > 0 && (
          <div className="mb-3">
            <span className="text-[9px] text-cyan-300/50 uppercase tracking-wider block mb-1.5">
              Factores Clave
            </span>
            <div className="flex flex-wrap gap-1">
              {data.keyDrivers.map((driver, i) => (
                <span
                  key={i}
                  className="text-[9px] px-2 py-0.5 rounded-full"
                  style={{
                    background: "hsla(200, 60%, 20%, 0.5)",
                    border: "1px solid hsla(200, 60%, 35%, 0.25)",
                    color: "hsl(195, 80%, 70%)",
                  }}
                >
                  {driver}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recommendation */}
        <div
          className="rounded-md p-2.5"
          style={{
            background: "hsla(210, 60%, 10%, 0.8)",
            border: "1px solid hsla(200, 60%, 35%, 0.2)",
          }}
        >
          <span className="text-[9px] text-yellow-400/80 uppercase tracking-wider block mb-1">
            💡 Recomendación
          </span>
          <p className="text-[10px] text-cyan-100 leading-relaxed">
            {data.recommendation}
          </p>
        </div>
      </div>
    </div>
  );
}
