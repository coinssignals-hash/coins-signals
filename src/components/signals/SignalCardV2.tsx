import { useState, useMemo, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import {
  TrendingUp,
  ShieldCheck,
  Flame,
  Copy,
  TrendingDown,
  Minus,
  ChevronDown,
  Info,
  Activity } from
"lucide-react";
import { useRestPrice } from "@/hooks/useRestPrice";
import { useSignalStrategy } from "@/hooks/useSignalStrategy";
import { useSignalRisk } from "@/hooks/useSignalRisk";
import { useSignalMarketSentiment } from "@/hooks/useSignalMarketSentiment";
import { MarketSentimentDashboard } from "@/components/signals/MarketSentimentDashboard";
import { useTranslation } from "@/i18n/LanguageContext";
import { useCurrencyImpactAI } from "@/hooks/useCurrencyImpactAI";
import { useSignalAutoClose } from "@/hooks/useSignalAutoClose";
import type { CurrencyImpactAI } from "@/hooks/useCurrencyImpactAI";
import { ConfluenceScore } from "@/components/signals/ConfluenceScore";
import { TargetProgressBar } from "@/components/signals/TargetProgressBar";
import { SignalChart } from "@/components/signals/SignalChart";
import type { TradingSignal } from "@/hooks/useSignals";
import bullBg from "@/assets/bull-card-bg.svg";
import chartSignal from "@/assets/chart-signal.jpg";
import brandLogo from "@/assets/g174.svg";

import pinbarPattern from "@/assets/pinbar-pattern.png";
import { format } from "date-fns";
import { es, enUS, ptBR, fr } from "date-fns/locale";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger } from
"@/components/ui/tooltip";

interface SignalCardV2Props {
  signal?: TradingSignal;
  className?: string;
}

// CurrencyImpact type now comes from useCurrencyImpactAI



// --- Impact Bar ---
function ImpactBar({ label, value, color }: {label: string;value: number;color: string;}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] w-16 text-right" style={{ color }}>
        {label}
      </span>
      <div className="flex-1 h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, background: color }} />

      </div>
      <span className="text-[11px] font-semibold w-9 text-right" style={{ color }}>
        {value}%
      </span>
    </div>);

}

function CurrencyImpactPanel({ data }: {data: CurrencyImpactAI;}) {
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
        border: "1px solid hsla(200, 60%, 35%, 0.3)"
      }}>

      <div
        className="absolute top-0 left-[15%] right-[15%] h-[1px]"
        style={{ background: "radial-gradient(ellipse at center, hsl(195, 100%, 54%) 0%, transparent 70%)" }} />

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
      {data.reason &&
      <p className="text-[9px] text-cyan-300/60 mt-2 leading-tight line-clamp-2 italic">
          {data.reason}
        </p>
      }
    </div>);

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
  const isTP = label.startsWith('TakeProfit');
  const isSL = label.startsWith('Stop');
  // TP siempre verde, SL siempre rojo
  const accentColor = isTP ? "hsl(135, 70%, 50%)" : "hsl(0, 70%, 55%)";
  const icon = isTP ? '🎯' : isSL ? '🛑' : '';
  return (
    <div
      className="relative rounded-lg overflow-hidden active:scale-[0.98] transition-transform"
      style={{
        background: 'radial-gradient(ellipse at center 40%, hsl(200, 100%, 15%) 0%, hsl(205, 100%, 7%) 70%, hsl(210, 100%, 5%) 100%)',
        border: `1px solid ${isTP ? 'hsla(135, 60%, 40%, 0.25)' : 'hsla(0, 60%, 40%, 0.25)'}`
      }}>

      <div
        className="absolute top-0 left-[10%] right-[10%] h-[1px]"
        style={{ background: `radial-gradient(ellipse at center, ${isTP ? 'hsl(135, 80%, 45%)' : 'hsl(0, 80%, 50%)'} 0%, transparent 70%)` }} />

      <div className="flex items-center justify-between px-2 py-0.5 min-h-[28px]">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-sm">{icon}</span>
          <span className="font-semibold text-white text-sm sm:text-base">{label}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-center">
          <span className="text-xs sm:text-sm font-bold text-center tabular-nums" style={{ color: accentColor }}>
            {pips} pips
          </span>
          <span className="text-xs sm:text-sm font-bold text-center tabular-nums hidden sm:inline" style={{ color: accentColor }}>
            {percent}%
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-white text-sm sm:text-base font-mono tabular-nums">{price}</span>
          <button
            className="text-cyan-400/60 hover:text-cyan-300 transition-colors p-1 -mr-1 min-w-[32px] min-h-[32px] flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(price);
            }}
            title="Copiar precio">
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>);

}

// Helper: compute pips and percent between two prices
function computePriceMetrics(target: number, entry: number, isJpy: boolean, symbol?: string) {
  const pipMultiplier = isJpy ? 100 : 10000;
  const pips = (target - entry) * pipMultiplier;
  const percent = (target - entry) / entry * 100;
  const isPositive = pips >= 0;
  const sign = isPositive ? "+ " : "- ";
  return {
    pips: `${sign}${Math.abs(pips).toFixed(1)}`,
    percent: `${sign}${Math.abs(percent).toFixed(3)}`,
    price: formatPrice(target, symbol || (isJpy ? 'JPY' : 'EUR/USD')),
    isPositive
  };
}

// Currency code to country flag code
const CURRENCY_FLAGS: Record<string, string> = {
  USD: "us", EUR: "eu", GBP: "gb", JPY: "jp", AUD: "au", CAD: "ca",
  CHF: "ch", NZD: "nz", CNY: "cn", SGD: "sg", HKD: "hk", SEK: "se",
  NOK: "no", MXN: "mx", ZAR: "za", BRL: "br", INR: "in", KRW: "kr"
};

function TakeProfitStopLossSection({ entryPrice, takeProfit, takeProfit2, takeProfit3, stopLoss, isJpy, currencyPair

}: {entryPrice: number;takeProfit: number;takeProfit2?: number;takeProfit3?: number;stopLoss: number;isJpy: boolean;currencyPair?: string;}) {
  const tp1 = computePriceMetrics(takeProfit, entryPrice, isJpy, currencyPair);
  const tp2 = takeProfit2 ? computePriceMetrics(takeProfit2, entryPrice, isJpy, currencyPair) : null;
  const tp3 = takeProfit3 ? computePriceMetrics(takeProfit3, entryPrice, isJpy, currencyPair) : null;
  const sl = computePriceMetrics(stopLoss, entryPrice, isJpy, currencyPair);
  return (
    <div className="space-y-1.5 mx-1.5 mb-3">
      <PriceRowFull label="TakeProfit 1" {...tp1} />
      {tp2 && <PriceRowFull label="TakeProfit 2" {...tp2} />}
      {tp3 && <PriceRowFull label="TakeProfit 3" {...tp3} />}
      <PriceRowFull label="Stop Loss" {...sl} />
    </div>);

}

// --- Price Age Indicator ---
function PriceAge({ timestamp }: {timestamp: number;}) {
  const [age, setAge] = useState(0);

  useEffect(() => {
    const update = () => setAge(Math.floor((Date.now() - timestamp) / 1000));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [timestamp]);

  const label = age < 60 ? `${age}s` : `${Math.floor(age / 60)}m ${age % 60}s`;
  const color = age < 10 ? 'text-emerald-400/70' : age < 30 ? 'text-cyan-300/50' : age < 60 ? 'text-yellow-400/60' : 'text-red-400/60';

  const exactTime = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const exactDate = new Date(timestamp).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("text-[8px] font-mono tabular-nums cursor-help", color)}>
            ⏱ {label} ago
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-[10px] font-mono">
          <p>{exactDate} — {exactTime}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>);

}

// --- Main Card ---
export function SignalCardV2({ signal, className }: SignalCardV2Props) {
  const [expanded, setExpanded] = useState(false);
  // S/R toggle now managed internally by CandlestickChart
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
  const [baseCurrency, quoteCurrency] = currencyPair.includes("/") ?
  currencyPair.split("/") :
  [currencyPair.slice(0, 3), currencyPair.slice(3, 6)];
  const isJpy = quoteCurrency === "JPY";
  const displayPair = `${baseCurrency}-${quoteCurrency}`;
  const baseFlag = CURRENCY_FLAGS[baseCurrency] ?? "un";
  const quoteFlag = CURRENCY_FLAGS[quoteCurrency] ?? "un";

  // Build polygon symbol for REST price
  const symbol = `${baseCurrency}/${quoteCurrency}`;
  const isCompleted = status === 'completed' || status === 'cancelled';
  const closedFallback = isCompleted ? (signal?.closedPrice ?? entryPrice) : entryPrice;
  const { quote, loading: priceLoading } = useRestPrice(symbol, isCompleted ? 0 : 30_000, closedFallback);
  const isConnected = !!quote;
  const isLivePrice = quote?.isLive !== false;

  // AI strategy (fetched in background when card expands)
  const strategyInput = useMemo(() => signal ? {
    currencyPair, action, trend, entryPrice, takeProfit, stopLoss, probability,
    support, resistance
  } : null, [currencyPair, action, trend, entryPrice, takeProfit, stopLoss, probability, support, resistance, signal]);
  const { strategy: aiStrategy, loading: strategyLoading } = useSignalStrategy(strategyInput, true);

  // AI risk assessment (fetched in background immediately)
  const { risk: aiRisk, loading: riskLoading } = useSignalRisk(strategyInput);

  // AI currency impact analysis
  const { data: aiImpactData, loading: impactLoading } = useCurrencyImpactAI(strategyInput);
  const impactData: CurrencyImpactAI[] = aiImpactData || [
  { currency: baseCurrency, positive: 50, negative: 30, neutral: 20, reason: "" },
  { currency: quoteCurrency, positive: 30, negative: 50, neutral: 20, reason: "" }];



  // Log price source for debugging
  useEffect(() => {
    console.log(`[SignalCardV2] ${currencyPair} | entry=${entryPrice} tp=${takeProfit} sl=${stopLoss} status=${status}`);
    if (quote) {
      console.log(`[SignalCardV2] Live price for ${symbol}: ${quote.price} (age: ${Date.now() - quote.timestamp}ms)`);
    }
  }, [quote, currencyPair, entryPrice, takeProfit, stopLoss, status, symbol]);

  // Zone-change pulse animation
  const prevZoneRef = useRef<'neutral' | 'positive' | 'negative'>('neutral');
  const [zonePulse, setZonePulse] = useState(false);


  // Score from -100 (SL hit) to +100 (TP hit), 0 = at entry
  const priceDiff = useMemo(() => {
    if (!quote?.price) return { percent: 0, score: 0, pips: 0, currentPrice: 0, isPositive: true, isNeutral: false, hasData: false };
    const price = quote.price;
    const pipMultiplier = isJpy ? 100 : 10000;
    const pips = (price - entryPrice) * pipMultiplier;
    const isBuy = action === 'BUY';

    let score = 0;
    if (isBuy) {
      if (price >= entryPrice) {
        // Moving towards TP: 0 to +100
        const tpDistance = takeProfit - entryPrice;
        score = tpDistance > 0 ? Math.min(100, (price - entryPrice) / tpDistance * 100) : 0;
      } else {
        // Moving towards SL: 0 to -100
        const slDistance = entryPrice - stopLoss;
        score = slDistance > 0 ? Math.max(-100, -((entryPrice - price) / slDistance) * 100) : 0;
      }
    } else {
      // SELL: price going down is good
      if (price <= entryPrice) {
        const tpDistance = entryPrice - takeProfit;
        score = tpDistance > 0 ? Math.min(100, (entryPrice - price) / tpDistance * 100) : 0;
      } else {
        const slDistance = stopLoss - entryPrice;
        score = slDistance > 0 ? Math.max(-100, -((price - entryPrice) / slDistance) * 100) : 0;
      }
    }

    const percent = (price - entryPrice) / entryPrice * 100;
    return { percent, score, pips, currentPrice: price, isPositive: score >= 0, isNeutral: Math.abs(score) <= 10, hasData: true };
  }, [quote?.price, entryPrice, isJpy, action, takeProfit, stopLoss]);

  // Detect zone transitions and trigger pulse
  useEffect(() => {
    if (!priceDiff.hasData) return;
    const zone: 'neutral' | 'positive' | 'negative' = priceDiff.isNeutral ? 'neutral' : priceDiff.isPositive ? 'positive' : 'negative';
    if (prevZoneRef.current !== zone) {
      prevZoneRef.current = zone;
      setZonePulse(true);
      const timer = setTimeout(() => setZonePulse(false), 800);
      return () => clearTimeout(timer);
    }
  }, [priceDiff.hasData, priceDiff.isNeutral, priceDiff.isPositive]);

  const { data: sentimentData, loading: sentimentLoading } = useSignalMarketSentiment(
    strategyInput,
    priceDiff.hasData ? priceDiff.currentPrice : undefined,
    expanded
  );

  // Auto-close signal when price hits TP or SL
  useSignalAutoClose({
    signalId: signal?.id ?? '',
    currencyPair,
    action,
    entryPrice,
    takeProfit,
    stopLoss,
    status,
    currentPrice: priceDiff.hasData ? priceDiff.currentPrice : null
  });



  // Circle fill uses absolute percent distance (capped at 100 for arc)
  const circlePercent = useMemo(() => {
    if (!priceDiff.hasData) return 0;
    return Math.min(100, Math.abs(priceDiff.percent) * 20); // scale: 5% distance = full arc
  }, [priceDiff.hasData, priceDiff.percent]);

  // Risk percent = SL distance / entry
  const riskPercent = Math.abs((stopLoss - entryPrice) / entryPrice * 100).toFixed(0);
  return (
    <div className={cn("relative w-full rounded-xl overflow-hidden", className)}>
      {/* Completed overlay */}
      {status === 'completed' &&
      <div className="absolute inset-0 z-40 pointer-events-none rounded-xl" style={{ background: 'hsla(0, 0%, 0%, 0.35)' }} />
      }
      <div
        className="relative rounded-xl border border-cyan-800/30 overflow-hidden"
        style={{
          background:
          "radial-gradient(ellipse at center 40%, hsl(200, 100%, 15%) 0%, hsl(205, 100%, 7%) 70%, hsl(210, 100%, 5%) 100%)"
        }}>

        {/* Brand logo watermark — pinned to top of card so it's always visible */}
        <div
          className="absolute top-4 left-0 right-0 z-[5] pointer-events-none flex items-center justify-center">
          
          <img
            src={brandLogo}
            alt=""
            aria-hidden="true"
            className="w-52 h-52 opacity-[0.07] select-none" />
          
        </div>


        {/* Top glow line */}
        <div
          className="absolute top-0 left-[15%] right-[15%] h-[1px]"
          style={{ background: "radial-gradient(ellipse at center, hsl(200, 80%, 55%) 0%, transparent 70%)" }} />


        {/* Date header */}
        <div className="relative text-center pt-3 pb-1">
          <span className="text-[11px] text-cyan-300/70 tracking-wide">
            {format(signalDate, "EEEE dd MMMM yyyy HH:mm:ss", { locale: dateLocale })}
          </span>
        </div>

        {/* Completed result banner */}
        {status === 'completed' && signal?.closedResult &&
        <div className={cn(
          "relative z-50 mx-4 mb-2 px-3 py-2 rounded-lg text-center text-xs font-bold uppercase tracking-wider border",
          signal.closedResult === 'tp_hit' ?
          "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
          "bg-rose-500/20 text-rose-400 border-rose-500/30"
        )}>
            {signal.closedResult === 'tp_hit' ?
          `✅ Take Profit ${t('signal_reached')} — ${(signal.closedPrice ?? 0).toFixed(3)}` :
          `❌ Stop Loss ${t('signal_reached')} — ${(signal.closedPrice ?? 0).toFixed(3)}`
          }
          </div>
        }

        {/* Auto-expired banner (completed without TP/SL hit) */}
        {status === 'completed' && !signal?.closedResult &&
        <div className="relative z-50 mx-4 mb-2 px-3 py-2 rounded-lg text-center text-xs font-bold uppercase tracking-wider border bg-slate-500/20 text-slate-400 border-slate-500/30">
            ⏱️ {t('signal_expired')}
          </div>
        }

        <div className="relative px-3 pt-0 pb-2 flex items-center justify-between -mt-3">
          <div className="flex items-center gap-2.5 relative z-10">
            <div className="relative w-20 h-14 flex-shrink-0">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-white/20 shadow-lg z-20">
                <img src={`https://flagcdn.com/w160/${baseFlag}.png`} alt={baseCurrency} className="w-full h-full object-cover" />
              </div>
              <div className="absolute left-6 sm:left-7 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-white/20 shadow-lg z-10">
                <img src={`https://flagcdn.com/w160/${quoteFlag}.png`} alt={quoteCurrency} className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-lg sm:text-xl font-bold text-white tracking-wide">{displayPair}</span>
              {/* Long/Short position badge */}
              <div
                className={cn(
                  "inline-flex items-center gap-0.5 px-1 py-px rounded text-[8px] font-bold uppercase tracking-wider w-fit",
                  action === "BUY" ?
                  "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" :
                  "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                )}>
                
                {action === "BUY" ?
                <TrendingUp className="w-2.5 h-2.5" /> :

                <TrendingDown className="w-2.5 h-2.5" />
                }
                {action === "BUY" ? t('signal_long') : t('signal_short')}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 relative z-10">
            {/* Live status to the left of circle */}
            <div className="flex flex-col gap-0.5 items-end text-right">
              <div className="flex items-center gap-1">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    isConnected && isLivePrice ?
                    "bg-green-400 shadow-[0_0_6px_hsl(135,80%,50%)]" :
                    isConnected && !isLivePrice ?
                    "bg-amber-400 shadow-[0_0_6px_hsl(45,80%,50%)]" :
                    priceLoading ?
                    "bg-yellow-400 shadow-[0_0_6px_hsl(45,80%,50%)] animate-pulse" :
                    "bg-red-400 shadow-[0_0_6px_hsl(0,80%,50%)]"
                  )} />
                <span className="text-[9px] font-bold text-cyan-300 italic">
                  {isConnected && isLivePrice ? "Live" : isConnected ? "Offline" : priceLoading ? t('common_loading') : "N/A"}
                </span>
              </div>
              {priceDiff.hasData && quote?.timestamp &&
              <PriceAge timestamp={quote.timestamp} />
              }
            </div>
            {/* Circle with price below */}
            <div className="flex flex-col items-center gap-0.5">
              <div className={cn(
                "relative w-[60px] h-[60px] sm:w-[72px] sm:h-[72px] transition-transform flex-shrink-0",
                zonePulse && "animate-[zone-pulse_0.8s_ease-out]"
              )}>
                <div className={cn(
                  "absolute -inset-1 rounded-full opacity-30 blur-md transition-all duration-700",
                  priceDiff.hasData ?
                  priceDiff.percent >= 0 ? "bg-green-500" : "bg-red-500" :
                  "bg-cyan-500"
                )} />
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90 drop-shadow-sm rounded-full overflow-hidden">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(225, 20%, 12%)" strokeWidth="2.5" />
                  <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(225, 15%, 18%)" strokeWidth="1" strokeDasharray="1.5 2" opacity="0.5" />
                  <circle cx="18" cy="18" r="15" fill="none"
                  stroke={`url(#liveGrad-${signal.id})`} strokeWidth="2.8" strokeLinecap="round"
                  strokeDasharray={`${circlePercent * 0.942} ${100 * 0.942}`}
                  className="transition-all duration-700 ease-out"
                  style={{ filter: 'drop-shadow(0 0 3px currentColor)' }} />
                  <circle cx="18" cy="18" r="12" fill="hsl(225, 25%, 8%)" fillOpacity="0.85" />
                  <circle cx="18" cy="18" r="12" fill={`url(#centerGrad-${signal.id})`} fillOpacity="0.15" />
                  <defs>
                    <linearGradient id={`liveGrad-${signal.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      {priceDiff.hasData && priceDiff.percent >= 0 ?
                      <><stop offset="0%" stopColor="hsl(160, 80%, 55%)" /><stop offset="100%" stopColor="hsl(120, 70%, 40%)" /></> :
                      priceDiff.hasData ?
                      <><stop offset="0%" stopColor="hsl(10, 80%, 60%)" /><stop offset="100%" stopColor="hsl(350, 70%, 45%)" /></> :
                      <><stop offset="0%" stopColor="hsl(200, 100%, 55%)" /><stop offset="100%" stopColor="hsl(180, 100%, 50%)" /></>
                      }
                    </linearGradient>
                    <radialGradient id={`centerGrad-${signal.id}`} cx="50%" cy="30%" r="70%">
                      {priceDiff.hasData && priceDiff.percent >= 0 ?
                      <stop offset="0%" stopColor="hsl(142, 70%, 50%)" /> :
                      priceDiff.hasData ?
                      <stop offset="0%" stopColor="hsl(0, 70%, 50%)" /> :
                      <stop offset="0%" stopColor="hsl(200, 80%, 50%)" />
                      }
                      <stop offset="100%" stopColor="transparent" />
                    </radialGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={cn(
                    "font-mono font-extrabold leading-none tracking-tight transition-colors duration-300",
                    !priceDiff.hasData ? "text-cyan-300" : priceDiff.percent >= 0 ? "text-green-400" : "text-red-400",
                    priceDiff.hasData && Math.abs(priceDiff.percent) >= 10 ? "text-[10px]" : "text-[12px]"
                  )}
                  style={{ textShadow: priceDiff.hasData ?
                    priceDiff.percent >= 0 ? '0 0 8px hsl(142, 70%, 45%, 0.4)' :
                    '0 0 8px hsl(0, 70%, 50%, 0.4)' : 'none'
                  }}>
                    {priceDiff.hasData ? `${priceDiff.percent >= 0 ? "+" : ""}${priceDiff.percent.toFixed(2)}%` : "—"}
                  </span>
                  {priceDiff.hasData &&
                  <span className={cn(
                    "text-[7px] font-bold leading-none mt-0.5 uppercase tracking-widest",
                    priceDiff.percent >= 0 ? "text-green-400/70" : "text-red-400/70"
                  )}>
                      vs Entry
                    </span>
                  }
                </div>
              </div>
              {/* Price value below the circle */}
              {priceDiff.hasData ?
              <p className={cn("text-[11px] text-center font-extrabold",
              priceDiff.percent >= 0 ? "text-green-400" : "text-red-400"
              )}>
                {priceDiff.currentPrice.toFixed(3)}
              </p> :
              <p className="text-[8px] text-cyan-300/50 text-center">{t('signal_entry')}</p>
              }
            </div>
          </div>
        </div>

        {/* Accent line */}
        <div
          className="mx-3 h-[2px] opacity-40 mb-2"
          style={{
            background:
            "linear-gradient(90deg, transparent 0%, hsl(210, 100%, 55%) 30%, hsl(200, 100%, 55%) 70%, transparent 100%)"
          }} />


        {/* Middle section - 3 badges */}
        <div className="relative px-3 pb-2">
          <div className="flex gap-1.5">
            {[
            {
              label: trend === "bullish" ? t('signal_bullish') : t('signal_bearish'),
              icon: trend === "bullish" ?
              <TrendingUp className="w-4 h-4 text-green-400" /> :
              <TrendingDown className="w-4 h-4 text-red-400" />,
              value: `${probability}%`,
              valueClass: "text-cyan-200"
            },
            {
              label: action === "BUY" ? t('signal_buy') : t('signal_sell'),
              icon: <ShieldCheck className="w-4 h-4 text-cyan-400" />,
              value: action === "BUY" ? t('signal_buy') : t('signal_sell'),
              valueClass: action === "BUY" ? "text-green-400" : "text-red-400"
            },
            {
              label: t('signal_risk'),
              icon: riskLoading ?
              <Loader2 className="w-4 h-4 text-orange-400 animate-spin" /> :
              <Flame className="w-4 h-4 text-orange-400" />,
              value: riskLoading ? '...' : aiRisk ? `${aiRisk.score}%` : `${riskPercent}%`,
              valueClass: aiRisk ?
              aiRisk.level === 'low' ? 'text-green-400' :
              aiRisk.level === 'medium' ? 'text-yellow-400' :
              aiRisk.level === 'high' ? 'text-orange-400' :
              'text-red-400' :
              'text-cyan-200'
            }].
            map((badge) =>
            <div
              key={badge.label}
              className="flex-1 relative rounded-lg overflow-hidden flex flex-col items-center justify-center py-1.5 gap-0 min-h-[44px]"
              style={{
                background: "linear-gradient(180deg, hsl(210, 100%, 8%) 0%, hsl(200, 80%, 12%) 100%)",
                border: "1px solid hsla(200, 60%, 35%, 0.3)"
              }}>

                <div
                className="absolute top-0 left-[15%] right-[15%] h-[1px]"
                style={{ background: "radial-gradient(ellipse at center, hsl(195, 100%, 54%) 0%, transparent 70%)" }} />

                <span className="text-[8px] sm:text-[9px] text-cyan-300/60 uppercase tracking-wider">{badge.label}</span>
                <div className="flex items-center gap-1">
                  {badge.icon}
                  <span className={cn("font-bold text-xs sm:text-sm", badge.valueClass)}>{badge.value}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Entry price bar */}
        <div
          className="relative mx-3 mb-2 rounded-lg overflow-hidden"
          style={{
            background: "linear-gradient(180deg, hsl(210, 50%, 10%) 0%, hsl(200, 60%, 14%) 100%)",
            border: "1px solid hsla(200, 60%, 35%, 0.25)"
          }}>

          <div
            className="absolute top-0 left-[10%] right-[10%] h-[1px]"
            style={{ background: "radial-gradient(ellipse at center, hsl(195, 100%, 54%) 0%, transparent 70%)" }} />

          <div className="flex items-center justify-between px-3 py-1.5 min-h-[40px]">
            <span className="font-semibold text-white text-xs sm:text-sm">{t('signal_entry')}</span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-xs sm:text-sm font-mono tabular-nums">{entryPrice.toFixed(3)}</span>
              <button
                className="text-cyan-400/60 hover:text-cyan-300 transition-colors p-1 min-w-[32px] min-h-[32px] flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(entryPrice.toFixed(3));
                }}
                title={t('signal_copy_price')}>

                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Target Progress Bar - SL/Entry/TP meter */}
        <TargetProgressBar
          entryPrice={entryPrice}
          takeProfit={takeProfit}
          takeProfit2={signal?.takeProfit2}
          takeProfit3={signal?.takeProfit3}
          stopLoss={stopLoss}
          currentPrice={priceDiff.hasData ? priceDiff.currentPrice : null}
          action={action as 'BUY' | 'SELL'}
          isCompleted={isCompleted}
          closedResult={signal?.closedResult ?? undefined}
          closedPrice={signal?.closedPrice ?? undefined} />
        

        {/* Expand toggle button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center py-2.5 text-cyan-300/60 hover:text-cyan-300 transition-colors active:scale-95 min-h-[44px]">

          <ChevronDown className={cn("w-5 h-5 transition-transform duration-300", expanded && "rotate-180")} />
        </button>

        {/* Expanded content */}
        {expanded &&
        <div className="animate-in slide-in-from-top-2 duration-300">
            {/* TP / SL bars */}
            <TakeProfitStopLossSection entryPrice={entryPrice} takeProfit={takeProfit} takeProfit2={signal?.takeProfit2} takeProfit3={signal?.takeProfit3} stopLoss={stopLoss} isJpy={isJpy} />

            {/* Candlestick Chart 15min - 7 days */}
            <SignalChart
              currencyPair={currencyPair}
              support={support}
              resistance={resistance}
              signalLevels={{
                entryPrice,
                takeProfit,
                takeProfit2: signal?.takeProfit2 ?? undefined,
                stopLoss,
                signalDatetime: signal?.datetime ?? new Date().toISOString(),
              }}
            />

            {/* AI Analysis Notes */}
            {signal?.notes &&
          <div className="mx-3 mb-3 rounded-lg p-3 relative overflow-hidden"
          style={{
            background: "linear-gradient(180deg, hsl(210, 100%, 8%) 0%, hsl(200, 80%, 12%) 100%)",
            border: "1px solid hsla(200, 60%, 35%, 0.3)"
          }}>
                <div className="absolute top-0 left-[15%] right-[15%] h-[1px]"
            style={{ background: "radial-gradient(ellipse at center, hsl(200, 80%, 55%) 0%, transparent 70%)" }} />
                <div className="flex items-center gap-1.5 mb-2">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[10px] uppercase tracking-wider text-cyan-300/70 font-bold">Análisis AI</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{signal.notes}</p>
              </div>
          }



            <MarketSentimentDashboard data={sentimentData} loading={sentimentLoading} />


            {/* Strategy Guidance Panel */}
            <div
            className="mx-2 sm:mx-3 mb-3 rounded-lg relative overflow-hidden"
            style={{
              background: "linear-gradient(180deg, hsl(210, 100%, 6%) 0%, hsl(205, 80%, 10%) 100%)",
              border: "1px solid hsla(200, 60%, 35%, 0.3)"
            }}>

              <div
              className="absolute top-0 left-[10%] right-[10%] h-[1px]"
              style={{ background: "radial-gradient(ellipse at center, hsl(195, 100%, 54%) 0%, transparent 70%)" }} />

              <div className="p-3">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider text-center">
                    {t('signal_strategy')}
                  </p>
                  {strategyLoading &&
                <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />
                }
                  {aiStrategy && !strategyLoading &&
                <span className="text-[8px] text-emerald-400/70 uppercase tracking-wider">IA</span>
                }
                </div>

                <TooltipProvider delayDuration={100}>
                  <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                    {/* Duración */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                        className="rounded-lg p-2.5 cursor-help relative overflow-hidden group"
                        style={{
                          background: "linear-gradient(135deg, hsla(210, 80%, 12%, 0.8) 0%, hsla(200, 60%, 15%, 0.6) 100%)",
                          border: "1px solid hsla(200, 60%, 35%, 0.2)"
                        }}>

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
                          border: "1px solid hsla(200, 60%, 35%, 0.2)"
                        }}>

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
                          border: "1px solid hsla(200, 60%, 35%, 0.2)"
                        }}>

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
                          border: "1px solid hsla(200, 60%, 35%, 0.2)"
                        }}>

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
                        border: "1px solid hsla(200, 60%, 35%, 0.25)"
                      }}>

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
                          style={{ border: "1px solid hsla(200, 60%, 35%, 0.2)" }}>

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

            {/* Per-currency AI impact scoring */}
            <div className="relative px-2 sm:px-3 pb-3">
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <p className="text-[9px] sm:text-[10px] text-cyan-300/50 uppercase tracking-widest text-center">
                  {t('signal_currency_impact')}
                </p>
                {impactLoading &&
              <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />
              }
              </div>
              <div className="flex gap-1.5">
                {impactData.map((d) =>
              <CurrencyImpactPanel key={d.currency} data={d} />
              )}
              </div>
            </div>

            {/* Bottom accent line */}
            <div
            className="mx-3 mb-3 h-[3px] rounded-full"
            style={{
              background: action === "BUY" ?
              "linear-gradient(90deg, hsl(135, 80%, 45%) 0%, hsl(135, 60%, 30%) 30%, hsl(135, 80%, 50%) 60%, hsl(135, 90%, 55%) 100%)" :
              "linear-gradient(90deg, hsl(0, 80%, 45%) 0%, hsl(0, 60%, 30%) 30%, hsl(0, 80%, 50%) 60%, hsl(0, 90%, 55%) 100%)"
            }} />

          </div>
        }

        {/* Bottom glow */}
        <div
          className="absolute bottom-0 left-[10%] right-[10%] h-[1px]"
          style={{ background: "radial-gradient(ellipse at center, hsl(200, 80%, 40%) 0%, transparent 70%)" }} />

      </div>
    </div>);

}