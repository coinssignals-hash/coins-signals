import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  ShieldCheck,
  Flame,
  Copy,
  TrendingDown,
  Minus,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Info,
} from "lucide-react";
import { useRestPrice } from "@/hooks/useRestPrice";
import { useSignalStrategy } from "@/hooks/useSignalStrategy";
import { useSignalRisk } from "@/hooks/useSignalRisk";
import { useTranslation } from "@/i18n/LanguageContext";
import type { TradingSignal } from "@/hooks/useSignals";
import bullBg from "@/assets/bull-card-bg.svg";
import chartSignal from "@/assets/chart-signal.jpg";
import marketSentimentChart from "@/assets/market-sentiment-chart.jpg";
import pinbarPattern from "@/assets/pinbar-pattern.png";
import { format } from "date-fns";
import { es, enUS, ptBR, fr } from "date-fns/locale";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SignalCardV2Props {
  signal?: TradingSignal;
  className?: string;
}

interface CurrencyImpact {
  currency: string;
  positive: number;
  negative: number;
  neutral: number;
}

// --- Zoomable Image Chart ---
function ZoomableChart({ pair, support, resistance, signalId }: { pair: string; support?: number; resistance?: number; signalId?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scale = useRef(1);
  const posX = useRef(0);
  const posY = useRef(0);
  const isDragging = useRef(false);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const lastPinchDist = useRef<number | null>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  const applyTransform = useCallback(() => {
    if (!imgRef.current) return;
    imgRef.current.style.transform = `translate(${posX.current}px, ${posY.current}px) scale(${scale.current})`;
  }, []);

  const clampPosition = useCallback(() => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img) return;
    const cW = container.clientWidth;
    const cH = container.clientHeight;
    const maxX = Math.max(0, (cW * scale.current - cW) / 2);
    const maxY = Math.max(0, (cH * scale.current - cH) / 2);
    posX.current = Math.max(-maxX, Math.min(maxX, posX.current));
    posY.current = Math.max(-maxY, Math.min(maxY, posY.current));
  }, []);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.85 : 1.15;
      scale.current = Math.max(1, Math.min(5, scale.current * factor));
      clampPosition();
      applyTransform();
    },
    [applyTransform, clampPosition],
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastX.current = e.clientX;
    lastY.current = e.clientY;
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    posX.current += e.clientX - lastX.current;
    posY.current += e.clientY - lastY.current;
    lastX.current = e.clientX;
    lastY.current = e.clientY;
    clampPosition();
    applyTransform();
  };
  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist.current = Math.sqrt(dx * dx + dy * dy);
    } else {
      isDragging.current = true;
      lastX.current = e.touches[0].clientX;
      lastY.current = e.touches[0].clientY;
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 2 && lastPinchDist.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      scale.current = Math.max(1, Math.min(5, scale.current * (dist / lastPinchDist.current)));
      lastPinchDist.current = dist;
      clampPosition();
      applyTransform();
    } else if (e.touches.length === 1 && isDragging.current) {
      posX.current += e.touches[0].clientX - lastX.current;
      posY.current += e.touches[0].clientY - lastY.current;
      lastX.current = e.touches[0].clientX;
      lastY.current = e.touches[0].clientY;
      clampPosition();
      applyTransform();
    }
  };
  const handleTouchEnd = () => {
    isDragging.current = false;
    lastPinchDist.current = null;
  };

  const attachWheel = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;
      (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      node.addEventListener("wheel", handleWheel, { passive: false });
    },
    [handleWheel],
  );

  const zoomIn = () => {
    scale.current = Math.min(5, scale.current * 1.3);
    clampPosition();
    applyTransform();
  };
  const zoomOut = () => {
    scale.current = Math.max(1, scale.current * 0.77);
    clampPosition();
    applyTransform();
  };
  const reset = () => {
    scale.current = 1;
    posX.current = 0;
    posY.current = 0;
    applyTransform();
  };

  return (
    <div
      ref={attachWheel}
      className="relative rounded-lg overflow-hidden mx-3 mb-3 cursor-grab active:cursor-grabbing select-none"
      style={{
        background: "hsl(215, 100%, 4%)",
        border: "1px solid hsla(200, 60%, 35%, 0.3)",
        height: 200,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="absolute top-0 left-[10%] right-[10%] h-[1px]"
        style={{ background: "radial-gradient(ellipse at center, hsl(195, 100%, 54%) 0%, transparent 70%)" }}
      />

      <div ref={imgRef} className="w-full h-full origin-center transition-none" style={{ willChange: "transform" }}>
        {(() => {
          const params = new URLSearchParams({ pair });
          if (support !== undefined) params.set('support', String(support));
          if (resistance !== undefined) params.set('resistance', String(resistance));
          if (signalId) params.set('signal_id', signalId);
          const chartUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/candlestick-chart?${params.toString()}`;
          return (
            <img
              src={chartUrl}
              alt={`${pair} Candlestick Chart`}
              className="w-full h-full object-contain"
              draggable={false}
              onError={(e) => {
                (e.target as HTMLImageElement).src = chartSignal;
              }}
            />
          );
        })()}
      </div>

      {/* Controls */}
      <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
        <button
          onClick={zoomIn}
          className="w-6 h-6 rounded flex items-center justify-center text-cyan-400/80 hover:text-cyan-300 transition-colors"
          style={{ background: "hsla(210, 100%, 8%, 0.8)", border: "1px solid hsla(200, 60%, 35%, 0.4)" }}
        >
          <ZoomIn className="w-3 h-3" />
        </button>
        <button
          onClick={zoomOut}
          className="w-6 h-6 rounded flex items-center justify-center text-cyan-400/80 hover:text-cyan-300 transition-colors"
          style={{ background: "hsla(210, 100%, 8%, 0.8)", border: "1px solid hsla(200, 60%, 35%, 0.4)" }}
        >
          <ZoomOut className="w-3 h-3" />
        </button>
        <button
          onClick={reset}
          className="w-6 h-6 rounded flex items-center justify-center text-cyan-400/80 hover:text-cyan-300 transition-colors"
          style={{ background: "hsla(210, 100%, 8%, 0.8)", border: "1px solid hsla(200, 60%, 35%, 0.4)" }}
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// --- Impact Bar ---
function ImpactBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] w-16 text-right" style={{ color }}>
        {label}
      </span>
      <div className="flex-1 h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="text-[11px] font-semibold w-9 text-right" style={{ color }}>
        {value}%
      </span>
    </div>
  );
}

function CurrencyImpactPanel({ data }: { data: CurrencyImpact }) {
  const { t } = useTranslation();
  const overall = data.positive > data.negative ? "Positive" : data.negative > data.positive ? "Negative" : "Neutral";
  const overallColor =
    overall === "Positive" ? "hsl(135, 70%, 50%)" : overall === "Negative" ? "hsl(0, 70%, 55%)" : "hsl(45, 80%, 55%)";
  const OverallIcon = overall === "Positive" ? TrendingUp : overall === "Negative" ? TrendingDown : Minus;
  const overallLabel = overall === "Positive" ? t('signal_positive') : overall === "Negative" ? t('signal_negative') : t('signal_neutral');

  return (
    <div
      className="flex-1 rounded-lg p-2.5 relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, hsl(210, 100%, 8%) 0%, hsl(200, 80%, 12%) 100%)",
        border: "1px solid hsla(200, 60%, 35%, 0.3)",
      }}
    >
      <div
        className="absolute top-0 left-[15%] right-[15%] h-[1px]"
        style={{ background: "radial-gradient(ellipse at center, hsl(195, 100%, 54%) 0%, transparent 70%)" }}
      />
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-cyan-200">{data.currency}</span>
        <div className="flex items-center gap-1">
          <OverallIcon className="w-3.5 h-3.5" style={{ color: overallColor }} />
          <span className="text-[10px] font-bold" style={{ color: overallColor }}>
            {overallLabel}
          </span>
        </div>
      </div>
      <div className="space-y-1.5">
        <ImpactBar label={t('signal_positive')} value={data.positive} color="hsl(135, 70%, 50%)" />
        <ImpactBar label={t('signal_negative')} value={data.negative} color="hsl(0, 70%, 55%)" />
        <ImpactBar label={t('signal_neutral')} value={data.neutral} color="hsl(45, 80%, 55%)" />
      </div>
    </div>
  );
}

// --- TP/SL Price Row with Pips + % ---
interface PriceRowFullProps {
  label: string;
  pips: string;
  percent: string;
  price: string;
  isPositive: boolean;
}

function PriceRowFull({ label, pips, percent, price, isPositive }: PriceRowFullProps) {
  const accentColor = isPositive ? "hsl(135, 70%, 50%)" : "hsl(0, 70%, 55%)";
  return (
    <div
      className="relative rounded-md overflow-hidden"
      style={{
        background: "linear-gradient(180deg, hsl(0, 0%, 0%) 0%, hsl(205, 80%, 8%) 100%)",
        border: "1px solid hsla(210, 100%, 50%, 0.15)",
      }}
    >
      <div
        className="absolute top-0 left-[10%] right-[10%] h-[1px]"
        style={{ background: "radial-gradient(ellipse at center, hsl(200, 100%, 50%) 0%, transparent 70%)" }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(90deg, hsla(215, 100%, 50%, 0.15) 0%, transparent 80%)" }}
      />
      <div className="flex items-center justify-between px-4 py-2.5">
        <span className="font-semibold text-white text-sm w-24 flex-shrink-0">{label}</span>
        <div className="flex items-center gap-3 flex-1 justify-center">
          <span className="text-xs font-bold text-center text-primary" style={{ color: accentColor }}>
            {pips} Pips
          </span>
          <span className="text-xs font-bold text-center text-primary" style={{ color: accentColor }}>
            {percent} %
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-white text-sm">{price}</span>
          <button
            className="text-cyan-400/60 hover:text-cyan-300 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(price);
            }}
            title="Copiar precio"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper: compute pips and percent between two prices
function computePriceMetrics(target: number, entry: number, isJpy: boolean) {
  const pipMultiplier = isJpy ? 100 : 10000;
  const pips = (target - entry) * pipMultiplier;
  const percent = ((target - entry) / entry) * 100;
  const isPositive = pips >= 0;
  const sign = isPositive ? "+ " : "- ";
  return {
    pips: `${sign}${Math.abs(pips).toFixed(1)}`,
    percent: `${sign}${Math.abs(percent).toFixed(3)}`,
    price: target.toFixed(3),
    isPositive,
  };
}

// Currency code to country flag code
const CURRENCY_FLAGS: Record<string, string> = {
  USD: "us", EUR: "eu", GBP: "gb", JPY: "jp", AUD: "au", CAD: "ca",
  CHF: "ch", NZD: "nz", CNY: "cn", SGD: "sg", HKD: "hk", SEK: "se",
  NOK: "no", MXN: "mx", ZAR: "za", BRL: "br", INR: "in", KRW: "kr",
};

function TakeProfitStopLossSection({ entryPrice, takeProfit, stopLoss, isJpy }: {
  entryPrice: number; takeProfit: number; stopLoss: number; isJpy: boolean;
}) {
  const tp1 = computePriceMetrics(takeProfit, entryPrice, isJpy);
  const sl = computePriceMetrics(stopLoss, entryPrice, isJpy);
  return (
    <div className="space-y-2 mx-3 mb-3">
      <PriceRowFull label="TakeProfit 1" {...tp1} />
      <PriceRowFull label="Stop Loss" {...sl} />
    </div>
  );
}

// --- Main Card ---
export function SignalCardV2({ signal, className }: SignalCardV2Props) {
  const [expanded, setExpanded] = useState(false);
  const { t, language } = useTranslation();

  const DATE_LOCALES = { es, en: enUS, pt: ptBR, fr };
  const dateLocale = DATE_LOCALES[language] ?? es;

  // Derive values from signal prop or use defaults
  const entryPrice = signal?.entryPrice ?? 154.950;
  const takeProfit = signal?.takeProfit ?? 155.100;
  const stopLoss = signal?.stopLoss ?? 154.700;
  const currencyPair = signal?.currencyPair ?? "USD/JPY";
  const action = signal?.action ?? "BUY";
  const trend = signal?.trend ?? "bullish";
  const probability = signal?.probability ?? 78;
  const signalDate = signal?.datetime ? new Date(signal.datetime) : new Date();
  const support = signal?.support;
  const resistance = signal?.resistance;
  const status = signal?.status ?? "active";

  // Parse currency codes
  const [baseCurrency, quoteCurrency] = currencyPair.includes("/")
    ? currencyPair.split("/")
    : [currencyPair.slice(0, 3), currencyPair.slice(3, 6)];
  const isJpy = quoteCurrency === "JPY";
  const displayPair = `${baseCurrency}-${quoteCurrency}`;
  const baseFlag = CURRENCY_FLAGS[baseCurrency] ?? "un";
  const quoteFlag = CURRENCY_FLAGS[quoteCurrency] ?? "un";

  // Build polygon symbol for REST price
  const symbol = `${baseCurrency}/${quoteCurrency}`;
  const { quote, loading: priceLoading } = useRestPrice(symbol, 30_000);
  const isConnected = !!quote;

  // AI strategy (fetched in background when card expands)
  const strategyInput = useMemo(() => signal ? {
    currencyPair, action, trend, entryPrice, takeProfit, stopLoss, probability,
    support, resistance,
  } : null, [currencyPair, action, trend, entryPrice, takeProfit, stopLoss, probability, support, resistance, signal]);
  const { strategy: aiStrategy, loading: strategyLoading } = useSignalStrategy(strategyInput, expanded);

  // AI risk assessment (fetched in background immediately)
  const { risk: aiRisk, loading: riskLoading } = useSignalRisk(strategyInput);

  // Log price source for debugging
  useEffect(() => {
    console.log(`[SignalCardV2] ${currencyPair} | entry=${entryPrice} tp=${takeProfit} sl=${stopLoss} status=${status}`);
    if (quote) {
      console.log(`[SignalCardV2] Live price for ${symbol}: ${quote.price} (age: ${Date.now() - quote.timestamp}ms)`);
    }
  }, [quote, currencyPair, entryPrice, takeProfit, stopLoss, status, symbol]);

  const priceDiff = useMemo(() => {
    if (!quote?.price) return { percent: 0, pips: 0, currentPrice: 0, isPositive: true, hasData: false };
    const diff = ((quote.price - entryPrice) / entryPrice) * 100;
    const pipMultiplier = isJpy ? 100 : 10000;
    const pips = (quote.price - entryPrice) * pipMultiplier;
    return { percent: diff, pips, currentPrice: quote.price, isPositive: diff >= 0, hasData: true };
  }, [quote?.price, entryPrice, isJpy]);

  // Clamp circle fill to 0-100 range (map ±1% to full circle)
  const circlePercent = Math.min(100, Math.abs(priceDiff.percent) * 100);

  // Risk percent = SL distance / entry
  const riskPercent = Math.abs(((stopLoss - entryPrice) / entryPrice) * 100).toFixed(0);

  const impactData: CurrencyImpact[] = [
    { currency: baseCurrency, positive: 62, negative: 23, neutral: 15 },
    { currency: quoteCurrency, positive: 28, negative: 51, neutral: 21 },
  ];

  return (
    <div className={cn("relative w-full rounded-xl overflow-hidden", className)}>
      <div
        className="relative rounded-xl border border-cyan-800/30 overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse at center 40%, hsl(200, 100%, 15%) 0%, hsl(205, 100%, 7%) 70%, hsl(210, 100%, 5%) 100%)",
        }}
      >
        {/* Bull background overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${bullBg})`,
            backgroundSize: "55%",
            backgroundPosition: "65% center",
            backgroundRepeat: "no-repeat",
            opacity: 0.3,
            mixBlendMode: "screen",
          }}
        />

        {/* Top glow line */}
        <div
          className="absolute top-0 left-[15%] right-[15%] h-[1px]"
          style={{ background: "radial-gradient(ellipse at center, hsl(200, 80%, 55%) 0%, transparent 70%)" }}
        />

        {/* Date header */}
        <div className="relative text-center pt-3 pb-1">
          <span className="text-[11px] text-cyan-300/70 tracking-wide">
            {format(signalDate, "EEEE dd MMMM yyyy HH:mm:ss", { locale: dateLocale })}
          </span>
        </div>

        {/* Upper section - currency pair */}
        <div className="relative px-4 pt-1 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-20 h-16 flex-shrink-0">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full overflow-hidden border-2 border-white/20 shadow-lg z-10">
                <img src={`https://flagcdn.com/w160/${baseFlag}.png`} alt={baseCurrency} className="w-full h-full object-cover" />
              </div>
              <div className="absolute left-7 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full overflow-hidden border-2 border-white/20 shadow-lg z-20">
                <img src={`https://flagcdn.com/w160/${quoteFlag}.png`} alt={quoteCurrency} className="w-full h-full object-cover" />
              </div>
            </div>
            <span className="text-3xl font-extrabold text-white tracking-wide">{displayPair}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="relative w-[72px] h-[72px]">
              {/* Outer glow ring */}
              <div className={cn(
                "absolute inset-0 rounded-full transition-all duration-700",
                priceDiff.hasData
                  ? priceDiff.isPositive
                    ? "shadow-[0_0_16px_3px_hsl(142,70%,45%/0.25)]"
                    : "shadow-[0_0_16px_3px_hsl(0,70%,50%/0.25)]"
                  : "shadow-[0_0_12px_2px_hsl(200,80%,50%/0.15)]"
              )} />
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90 drop-shadow-sm">
                {/* Background track */}
                <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(225, 20%, 12%)" strokeWidth="2.5" />
                <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(225, 15%, 18%)" strokeWidth="1" strokeDasharray="1.5 2" opacity="0.5" />
                {/* Progress arc */}
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke={`url(#liveGrad-${signal.id})`}
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeDasharray={`${circlePercent * 0.942} ${100 * 0.942}`}
                  className="transition-all duration-700 ease-out"
                  style={{ filter: 'drop-shadow(0 0 3px currentColor)' }}
                />
                {/* Center fill */}
                <circle cx="18" cy="18" r="12" fill="hsl(225, 25%, 8%)" fillOpacity="0.85" />
                <circle cx="18" cy="18" r="12" fill={`url(#centerGrad-${signal.id})`} fillOpacity="0.15" />
                <defs>
                  <linearGradient id={`liveGrad-${signal.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    {priceDiff.hasData && priceDiff.isPositive ? (
                      <>
                        <stop offset="0%" stopColor="hsl(160, 80%, 55%)" />
                        <stop offset="100%" stopColor="hsl(120, 70%, 40%)" />
                      </>
                    ) : priceDiff.hasData ? (
                      <>
                        <stop offset="0%" stopColor="hsl(10, 80%, 60%)" />
                        <stop offset="100%" stopColor="hsl(350, 70%, 45%)" />
                      </>
                    ) : (
                      <>
                        <stop offset="0%" stopColor="hsl(200, 100%, 55%)" />
                        <stop offset="100%" stopColor="hsl(180, 100%, 50%)" />
                      </>
                    )}
                  </linearGradient>
                  <radialGradient id={`centerGrad-${signal.id}`} cx="50%" cy="30%" r="70%">
                    {priceDiff.hasData && priceDiff.isPositive ? (
                      <stop offset="0%" stopColor="hsl(142, 70%, 50%)" />
                    ) : priceDiff.hasData ? (
                      <stop offset="0%" stopColor="hsl(0, 70%, 50%)" />
                    ) : (
                      <stop offset="0%" stopColor="hsl(200, 80%, 50%)" />
                    )}
                    <stop offset="100%" stopColor="transparent" />
                  </radialGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className={cn(
                    "font-mono text-[13px] font-extrabold leading-none tracking-tight transition-colors duration-300",
                    !priceDiff.hasData ? "text-cyan-300" : priceDiff.isPositive ? "text-green-400" : "text-red-400",
                  )}
                  style={{ textShadow: priceDiff.hasData 
                    ? priceDiff.isPositive 
                      ? '0 0 8px hsl(142, 70%, 45%, 0.4)' 
                      : '0 0 8px hsl(0, 70%, 50%, 0.4)' 
                    : 'none' 
                  }}
                >
                  {priceDiff.hasData ? `${priceDiff.isPositive ? "+" : ""}${priceDiff.percent.toFixed(2)}%` : "—"}
                </span>
                {priceDiff.hasData && (
                  <span
                    className={cn(
                      "text-[8px] font-semibold leading-none mt-1 opacity-60",
                      priceDiff.isPositive ? "text-green-300" : "text-red-300",
                    )}
                  >
                    {priceDiff.isPositive ? "+" : ""}{priceDiff.pips.toFixed(1)}p
                  </span>
                )}
              </div>
            </div>
            {/* Current price + status */}
            <div className="text-center">
              {priceDiff.hasData ? (
                <p className={cn(
                  "text-[10px] font-bold",
                  priceDiff.isPositive ? "text-green-400" : "text-red-400",
                )}>
                  {priceDiff.currentPrice.toFixed(3)}
                </p>
              ) : (
                <p className="text-[8px] text-cyan-300/50 leading-tight">{t('signal_entry')}</p>
              )}
              <p className="text-[8px] text-cyan-300/50 leading-tight">vs {t('signal_entry')}</p>
            </div>
            <div className="flex items-center gap-1">
              <div
                className={cn(
                  "w-2.5 h-2.5 rounded-full",
                  isConnected
                    ? "bg-green-400 shadow-[0_0_6px_hsl(135,80%,50%)]"
                    : priceLoading
                      ? "bg-yellow-400 shadow-[0_0_6px_hsl(45,80%,50%)] animate-pulse"
                      : "bg-red-400 shadow-[0_0_6px_hsl(0,80%,50%)]",
                )}
              />
              <span className="text-[10px] font-bold text-cyan-300 italic">
                {isConnected ? "Live" : priceLoading ? t('common_loading') : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Accent line */}
        <div
          className="mx-4 h-[2px] opacity-40 mb-3"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, hsl(210, 100%, 55%) 30%, hsl(200, 100%, 55%) 70%, transparent 100%)",
          }}
        />

        {/* Middle section - 3 badges */}
        <div className="relative px-3 pb-3">
          <div className="flex gap-2">
            {[
              {
                label: trend === "bullish" ? t('signal_bullish') : t('signal_bearish'),
                icon: trend === "bullish"
                  ? <TrendingUp className="w-5 h-5 text-green-400" />
                  : <TrendingDown className="w-5 h-5 text-red-400" />,
                value: `${probability}%`,
                valueClass: "text-cyan-200",
              },
              {
                label: action === "BUY" ? t('signal_buy') : t('signal_sell'),
                icon: <ShieldCheck className="w-5 h-5 text-cyan-400" />,
                value: action === "BUY" ? t('signal_buy') : t('signal_sell'),
                valueClass: action === "BUY" ? "text-green-400" : "text-red-400",
              },
              {
                label: t('signal_risk'),
                icon: riskLoading
                  ? <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
                  : <Flame className="w-5 h-5 text-orange-400" />,
                value: riskLoading ? '...' : aiRisk ? `${aiRisk.score}%` : `${riskPercent}%`,
                valueClass: aiRisk
                  ? aiRisk.level === 'low' ? 'text-green-400'
                    : aiRisk.level === 'medium' ? 'text-yellow-400'
                    : aiRisk.level === 'high' ? 'text-orange-400'
                    : 'text-red-400'
                  : 'text-cyan-200',
              },
            ].map((badge) => (
              <div
                key={badge.label}
                className="flex-1 relative rounded-lg overflow-hidden flex flex-col items-center justify-center py-2.5 gap-0.5"
                style={{
                  background: "linear-gradient(180deg, hsl(210, 100%, 8%) 0%, hsl(200, 80%, 12%) 100%)",
                  border: "1px solid hsla(200, 60%, 35%, 0.3)",
                }}
              >
                <div
                  className="absolute top-0 left-[15%] right-[15%] h-[1px]"
                  style={{ background: "radial-gradient(ellipse at center, hsl(195, 100%, 54%) 0%, transparent 70%)" }}
                />
                <span className="text-[9px] text-cyan-300/60 uppercase tracking-wider">{badge.label}</span>
                <div className="flex items-center gap-1">
                  {badge.icon}
                  <span className={cn("font-bold text-base", badge.valueClass)}>{badge.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Entry price bar */}
        <div
          className="relative mx-3 mb-3 rounded-lg overflow-hidden"
          style={{
            background: "linear-gradient(180deg, hsl(210, 50%, 10%) 0%, hsl(200, 60%, 14%) 100%)",
            border: "1px solid hsla(200, 60%, 35%, 0.25)",
          }}
        >
          <div
            className="absolute top-0 left-[10%] right-[10%] h-[1px]"
            style={{ background: "radial-gradient(ellipse at center, hsl(195, 100%, 54%) 0%, transparent 70%)" }}
          />
          <div className="flex items-center justify-between px-4 py-2.5">
            <span className="font-semibold text-white text-sm">{t('signal_entry')}</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">{entryPrice.toFixed(3)}</span>
              <button
                className="text-cyan-400/60 hover:text-cyan-300 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(entryPrice.toFixed(3));
                }}
                title={t('signal_copy_price')}
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Expand toggle button - justo debajo de Precio de Entrada */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center py-2 text-cyan-300/60 hover:text-cyan-300 transition-colors"
        >
          <ChevronDown className={cn("w-5 h-5 transition-transform duration-300", expanded && "rotate-180")} />
        </button>

        {/* Expanded content */}
        {expanded && (
          <div className="animate-in slide-in-from-top-2 duration-300">
            {/* TP / SL bars */}
            <TakeProfitStopLossSection entryPrice={entryPrice} takeProfit={takeProfit} stopLoss={stopLoss} isJpy={isJpy} />

            {/* Zoomable chart image */}
            <ZoomableChart pair={currencyPair} support={support} resistance={resistance} signalId={signal?.id} />

            {/* Sentimiento del Mercado + Informacion */}
            <div className="mx-3 mb-3 flex gap-2">
              <div
                className="flex-1 rounded-lg overflow-hidden"
                style={{
                  border: "1px solid hsla(200, 60%, 35%, 0.3)",
                  background: "hsl(215, 100%, 4%)",
                }}
              >
                <img
                  src={marketSentimentChart}
                  alt="Sentimiento del Mercado"
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>

              <div
                className="flex-1 rounded-lg p-2.5 relative overflow-hidden"
                style={{
                  background: "linear-gradient(180deg, hsl(210, 100%, 8%) 0%, hsl(200, 80%, 12%) 100%)",
                  border: "1px solid hsla(200, 60%, 35%, 0.3)",
                }}
              >
                <div
                  className="absolute top-0 left-[15%] right-[15%] h-[1px]"
                  style={{
                    background: "radial-gradient(ellipse at center, hsl(195, 100%, 54%) 0%, transparent 70%)",
                  }}
                />
                <p className="text-[9px] font-bold text-yellow-400 uppercase tracking-wider mb-2">{t('signal_information')}</p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {[
                    { label: t('signal_resistance'), value: resistance?.toFixed(3) ?? "—", color: "hsl(0, 70%, 55%)" },
                    { label: t('signal_support'), value: support?.toFixed(3) ?? "—", color: "hsl(135, 70%, 50%)" },
                    { label: "TP", value: takeProfit.toFixed(3), color: "hsl(135, 70%, 50%)" },
                    { label: "SL", value: stopLoss.toFixed(3), color: "hsl(0, 70%, 55%)" },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between items-center">
                      <span className="text-[9px] text-cyan-300/60">{row.label}</span>
                      <span className="text-[9px] font-bold" style={{ color: row.color }}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                  <div className="col-span-2 mt-1 pt-1.5 border-t border-cyan-500/10 flex justify-between items-center">
                    <span className="text-[9px] text-cyan-300/60">{t('signal_status')}</span>
                    <span className="text-[9px] font-bold" style={{ color: "hsl(45, 80%, 55%)" }}>
                      {status === "active" ? t('signal_status_active') : status === "pending" ? t('signal_status_pending') : t('signal_status_closed')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Strategy Guidance Panel */}
            <div
              className="mx-3 mb-3 rounded-lg relative overflow-hidden"
              style={{
                background: "linear-gradient(180deg, hsl(210, 100%, 6%) 0%, hsl(205, 80%, 10%) 100%)",
                border: "1px solid hsla(200, 60%, 35%, 0.3)",
              }}
            >
              <div
                className="absolute top-0 left-[10%] right-[10%] h-[1px]"
                style={{ background: "radial-gradient(ellipse at center, hsl(195, 100%, 54%) 0%, transparent 70%)" }}
              />
              <div className="p-3">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider text-center">
                    {t('signal_strategy')}
                  </p>
                  {strategyLoading && (
                    <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />
                  )}
                  {aiStrategy && !strategyLoading && (
                    <span className="text-[8px] text-emerald-400/70 uppercase tracking-wider">IA</span>
                  )}
                </div>

                <TooltipProvider delayDuration={100}>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {/* Duración */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="rounded-lg p-2.5 cursor-help relative overflow-hidden group"
                          style={{
                            background: "linear-gradient(135deg, hsla(210, 80%, 12%, 0.8) 0%, hsla(200, 60%, 15%, 0.6) 100%)",
                            border: "1px solid hsla(200, 60%, 35%, 0.2)",
                          }}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[9px] text-cyan-300/60 uppercase tracking-wider">{t('signal_strategy_duration')}</span>
                            <Info className="w-2.5 h-2.5 text-cyan-400/40 group-hover:text-cyan-300 transition-colors" />
                          </div>
                          <span className="text-xs font-bold text-cyan-100">{aiStrategy?.duration.value ?? "Intradía"}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[260px] bg-[hsl(225,25%,10%)] border-cyan-500/20 text-[11px] text-cyan-100 p-3 shadow-xl shadow-black/40">
                        <p className="font-bold text-yellow-400 mb-1.5 text-xs">📊 {aiStrategy?.duration.value ?? "Intradía"}</p>
                        <p className="leading-relaxed">{aiStrategy?.duration.explanation ?? "Operaciones que se abren y cierran dentro del mismo día de trading, reduciendo riesgo de gaps nocturnos."}</p>
                        <div className="mt-2 pt-2 border-t border-cyan-500/10 text-[10px] text-cyan-300/50">
                          Análisis para {currencyPair}
                        </div>
                      </TooltipContent>
                    </Tooltip>

                    {/* Enfoque */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="rounded-lg p-2.5 cursor-help relative overflow-hidden group"
                          style={{
                            background: "linear-gradient(135deg, hsla(210, 80%, 12%, 0.8) 0%, hsla(200, 60%, 15%, 0.6) 100%)",
                            border: "1px solid hsla(200, 60%, 35%, 0.2)",
                          }}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[9px] text-cyan-300/60 uppercase tracking-wider">{t('signal_strategy_approach')}</span>
                            <Info className="w-2.5 h-2.5 text-cyan-400/40 group-hover:text-cyan-300 transition-colors" />
                          </div>
                          <span className="text-xs font-bold text-cyan-100">{aiStrategy?.approach.value ?? "Smart Money"}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[260px] bg-[hsl(225,25%,10%)] border-cyan-500/20 text-[11px] text-cyan-100 p-3 shadow-xl shadow-black/40">
                        <p className="font-bold text-yellow-400 mb-1.5 text-xs">🏦 {aiStrategy?.approach.value ?? "Smart Money"}</p>
                        <p className="leading-relaxed">{aiStrategy?.approach.explanation ?? "Estrategia basada en seguir el flujo de capital institucional, identificando zonas de liquidez y bloques de órdenes."}</p>
                        <div className="mt-2 pt-2 border-t border-cyan-500/10 text-[10px] text-cyan-300/50">
                          Confluencia con estructura de mercado
                        </div>
                      </TooltipContent>
                    </Tooltip>

                    {/* Mejor Sesión */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="rounded-lg p-2.5 cursor-help relative overflow-hidden group"
                          style={{
                            background: "linear-gradient(135deg, hsla(210, 80%, 12%, 0.8) 0%, hsla(200, 60%, 15%, 0.6) 100%)",
                            border: "1px solid hsla(200, 60%, 35%, 0.2)",
                          }}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[9px] text-cyan-300/60 uppercase tracking-wider">{t('signal_strategy_session')}</span>
                            <Info className="w-2.5 h-2.5 text-cyan-400/40 group-hover:text-cyan-300 transition-colors" />
                          </div>
                          <span className="text-xs font-bold text-cyan-100">{aiStrategy?.session.value ?? "New York"}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[260px] bg-[hsl(225,25%,10%)] border-cyan-500/20 text-[11px] text-cyan-100 p-3 shadow-xl shadow-black/40">
                        <p className="font-bold text-yellow-400 mb-1.5 text-xs">🕐 {aiStrategy?.session.value ?? "New York"}</p>
                        <p className="leading-relaxed">{aiStrategy?.session.explanation ?? "Sesión con mayor volumen y liquidez para este par."}</p>
                      </TooltipContent>
                    </Tooltip>

                    {/* Mejor Hora */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="rounded-lg p-2.5 cursor-help relative overflow-hidden group"
                          style={{
                            background: "linear-gradient(135deg, hsla(210, 80%, 12%, 0.8) 0%, hsla(200, 60%, 15%, 0.6) 100%)",
                            border: "1px solid hsla(200, 60%, 35%, 0.2)",
                          }}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[9px] text-cyan-300/60 uppercase tracking-wider">{t('signal_strategy_best_time')}</span>
                            <Info className="w-2.5 h-2.5 text-cyan-400/40 group-hover:text-cyan-300 transition-colors" />
                          </div>
                          <span className="text-xs font-bold text-cyan-100">{aiStrategy?.bestTime.value ?? "10:00 – 14:00"}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[260px] bg-[hsl(225,25%,10%)] border-cyan-500/20 text-[11px] text-cyan-100 p-3 shadow-xl shadow-black/40">
                        <p className="font-bold text-yellow-400 mb-1.5 text-xs">⏰ {aiStrategy?.bestTime.value ?? "10:00 – 14:00"}</p>
                        <p className="leading-relaxed">{aiStrategy?.bestTime.explanation ?? "Rango horario con mayor actividad y mejores oportunidades."}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Velas de Confirmación - full width with diagram */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="rounded-lg p-3 cursor-help relative overflow-hidden group"
                        style={{
                          background: "linear-gradient(135deg, hsla(210, 80%, 10%, 0.9) 0%, hsla(200, 60%, 14%, 0.7) 100%)",
                          border: "1px solid hsla(200, 60%, 35%, 0.25)",
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <span className="text-[9px] text-cyan-300/60 uppercase tracking-wider">{t('signal_strategy_candle')}</span>
                              <Info className="w-2.5 h-2.5 text-cyan-400/40 group-hover:text-cyan-300 transition-colors" />
                            </div>
                            <span className="text-xs font-bold text-cyan-100 block">{aiStrategy?.confirmationCandle.value ?? "Pin Bar"}</span>
                            <span className="text-[9px] text-cyan-300/40 mt-0.5 block">Toca para ver diagrama y explicación</span>
                          </div>
                          <div
                            className="w-14 h-14 rounded-md overflow-hidden flex-shrink-0"
                            style={{ border: "1px solid hsla(200, 60%, 35%, 0.2)" }}
                          >
                            <img src={pinbarPattern} alt={aiStrategy?.confirmationCandle.value ?? "Pin Bar"} className="w-full h-full object-cover" draggable={false} />
                          </div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[280px] bg-[hsl(225,25%,10%)] border-cyan-500/20 text-[11px] text-cyan-100 p-3 shadow-xl shadow-black/40">
                      <p className="font-bold text-yellow-400 mb-1.5 text-xs">🕯️ {aiStrategy?.confirmationCandle.value ?? "Pin Bar"}</p>
                      <p className="leading-relaxed mb-2">{aiStrategy?.confirmationCandle.explanation ?? "Vela con mecha larga y cuerpo pequeño que indica rechazo del precio en una zona clave."}</p>
                      <img src={pinbarPattern} alt="Patrón de velas" className="w-full rounded-md border border-cyan-500/20 mb-1.5" draggable={false} />
                      <div className="text-[10px] text-cyan-300/50 text-center">
                        Buscar confluencia con niveles S/R y volumen
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Per-currency impact scoring */}
            <div className="relative px-3 pb-3">
              <p className="text-[10px] text-cyan-300/50 uppercase tracking-widest mb-2 text-center">
                {t('signal_currency_impact')}
              </p>
              <div className="flex gap-2">
                {impactData.map((d) => (
                  <CurrencyImpactPanel key={d.currency} data={d} />
                ))}
              </div>
            </div>

            {/* Bottom accent line */}
            <div
              className="mx-3 mb-3 h-[3px] rounded-full"
              style={{
                background: action === "BUY"
                  ? "linear-gradient(90deg, hsl(135, 80%, 45%) 0%, hsl(135, 60%, 30%) 30%, hsl(135, 80%, 50%) 60%, hsl(135, 90%, 55%) 100%)"
                  : "linear-gradient(90deg, hsl(0, 80%, 45%) 0%, hsl(0, 60%, 30%) 30%, hsl(0, 80%, 50%) 60%, hsl(0, 90%, 55%) 100%)",
              }}
            />
          </div>
        )}

        {/* Bottom glow */}
        <div
          className="absolute bottom-0 left-[10%] right-[10%] h-[1px]"
          style={{ background: "radial-gradient(ellipse at center, hsl(200, 80%, 40%) 0%, transparent 70%)" }}
        />
      </div>
    </div>
  );
}
