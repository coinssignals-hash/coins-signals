import { useState } from 'react';
import { TradingSignal } from '@/hooks/useSignals';
import { Copy, TrendingUp, TrendingDown, Heart, ChevronDown, ChevronUp, Loader2, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import signalCardBg from '@/assets/signal-card-bg.png';

interface SignalCardProps {
  signal: TradingSignal;
  isFavorite?: boolean;
  onToggleFavorite?: (signalId: string) => void;
}

// Currency flag components
const FlagIcon = ({ currency, className }: { currency: string; className?: string }) => {
  const flags: Record<string, { bg: string; content: React.ReactNode }> = {
    'EUR': { bg: 'bg-blue-600', content: <span className="text-yellow-400 font-bold text-xs">€</span> },
    'USD': { bg: 'bg-gradient-to-b from-red-500 via-white to-blue-600', content: null },
    'GBP': { bg: 'bg-blue-700', content: <span className="text-red-500 font-bold text-xs">£</span> },
    'JPY': { bg: 'bg-white', content: <div className="w-3 h-3 bg-red-600 rounded-full" /> },
    'AUD': { bg: 'bg-blue-800', content: <span className="text-white text-[8px]">★</span> },
    'CAD': { bg: 'bg-red-600', content: <span className="text-white text-xs">🍁</span> },
    'CHF': { bg: 'bg-red-600', content: <span className="text-white font-bold text-xs">+</span> },
    'NZD': { bg: 'bg-blue-900', content: <span className="text-white text-[8px]">★★</span> },
    'XAU': { bg: 'bg-gradient-to-br from-yellow-400 to-yellow-600', content: null },
    'BTC': { bg: 'bg-orange-500', content: <span className="text-white font-bold text-xs">₿</span> },
  };

  const flag = flags[currency] || { bg: 'bg-gray-500', content: <span className="text-white text-xs">{currency.charAt(0)}</span> };

  return (
    <div className={cn(
      "w-10 h-10 rounded-full flex items-center justify-center border-2 border-white/30 shadow-lg",
      flag.bg,
      className
    )}>
      {flag.content}
    </div>
  );
};

// Probability bar component
const ProbabilityBar = ({ 
  probability, 
  type 
}: { 
  probability: number; 
  type: 'profit' | 'loss' 
}) => {
  const isProfit = type === 'profit';
  
  return (
    <div className="flex-1 h-3 rounded-full overflow-hidden bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 relative">
      <div 
        className="absolute inset-y-0 right-0 bg-black/60"
        style={{ width: `${100 - probability}%` }}
      />
      <div 
        className={cn(
          "absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white border border-black shadow",
        )}
        style={{ left: `${probability}%`, transform: 'translate(-50%, -50%)' }}
      />
    </div>
  );
};

export function SignalCard({ signal, isFavorite = false, onToggleFavorite }: SignalCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  
  const copyToClipboard = (value: number) => {
    navigator.clipboard.writeText(value.toString());
    toast.success('Precio copiado');
  };

  const analyzeWithAI = async () => {
    if (isAnalyzing) return;
    
    setIsAnalyzing(true);
    setShowAnalysis(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-signal', {
        body: { 
          signal: {
            currencyPair: signal.currencyPair,
            action: signal.action,
            trend: signal.trend,
            entryPrice: signal.entryPrice,
            takeProfit: signal.takeProfit,
            stopLoss: signal.stopLoss,
            probability: signal.probability,
            support: signal.support,
            resistance: signal.resistance,
          }
        }
      });

      if (error) throw error;
      
      if (data.error) {
        toast.error(data.error);
        setShowAnalysis(false);
        return;
      }

      setAiAnalysis(data.analysis);
      toast.success('Análisis completado');
    } catch (error) {
      console.error('Error analyzing signal:', error);
      toast.error('Error al analizar la señal');
      setShowAnalysis(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isBuy = signal.action === 'BUY';
  const formattedDate = format(new Date(signal.datetime), "EEEE dd 'de' MMMM yyyy HH:mm", { locale: es });
  const formattedDateShort = format(new Date(signal.datetime), "EEE dd MMM yyyy HH:mm", { locale: es });
  
  const [base, quote] = signal.currencyPair.split('/');

  // Calculate Take Profit values (if not provided, derive from entry)
  const takeProfit1 = signal.takeProfit;
  const takeProfit2 = isBuy 
    ? +(signal.takeProfit + (signal.takeProfit - signal.entryPrice) * 0.5).toFixed(5)
    : +(signal.takeProfit - (signal.entryPrice - signal.takeProfit) * 0.5).toFixed(5);
  
  const tp1Diff = isBuy 
    ? +((takeProfit1 - signal.entryPrice) * 10000).toFixed(1)
    : +((signal.entryPrice - takeProfit1) * 10000).toFixed(1);
  const tp2Diff = isBuy 
    ? +((takeProfit2 - signal.entryPrice) * 10000).toFixed(1)
    : +((signal.entryPrice - takeProfit2) * 10000).toFixed(1);
  const slDiff = isBuy 
    ? +((signal.entryPrice - signal.stopLoss) * 10000).toFixed(1)
    : +((signal.stopLoss - signal.entryPrice) * 10000).toFixed(1);

  // Session data for display
  const sessions = signal.sessionData?.map(s => s.session).join(' / ') || 'Londres';

  return (
    <div className="rounded-2xl overflow-hidden shadow-xl shadow-blue-900/30 border border-blue-500/40">
      {/* Header Section with background */}
      <div 
        className="relative p-4"
        style={{
          backgroundImage: `url(${signalCardBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/60 via-blue-800/40 to-blue-900/70" />
        
        {/* Content */}
        <div className="relative z-10">
          {/* Date and Favorite */}
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-blue-200/80 capitalize">
              {formattedDateShort} (UTC+01:00)
            </div>
            {onToggleFavorite && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(signal.id);
                }}
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
              >
                <Heart
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isFavorite ? "fill-red-500 text-red-500" : "text-white/60 hover:text-red-400"
                  )}
                />
              </button>
            )}
          </div>

          {/* Main Header Row */}
          <div className="flex items-center justify-between">
            {/* Currency Pair with Flags */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <FlagIcon currency={base} />
                <FlagIcon currency={quote} className="absolute -bottom-1 -right-3 w-8 h-8 border-2" />
              </div>
              <span className="text-2xl font-bold text-white ml-2">{base}-{quote}</span>
            </div>

            {/* Status Badge & Probability Circle */}
            <div className="flex flex-col items-end gap-1">
              <span className="text-green-400 font-semibold text-sm italic drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]">
                Señal Activa
              </span>
              <div className="relative w-14 h-14">
                <svg className="w-14 h-14 -rotate-90">
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    stroke="rgba(59, 130, 246, 0.3)"
                    strokeWidth="4"
                    fill="none"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    stroke="#3b82f6"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${(signal.probability / 100) * 150.8} 150.8`}
                    strokeLinecap="round"
                    className="drop-shadow-[0_0_6px_rgba(59,130,246,0.8)]"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-blue-400">
                  {signal.probability}%
                </span>
              </div>
            </div>
          </div>

          {/* Trend/Action/Session Row */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="bg-blue-900/60 backdrop-blur-sm rounded-lg p-2 text-center border border-blue-500/30">
              <div className="text-[10px] text-blue-300 uppercase font-medium">Tendencia</div>
              <div className={cn(
                "flex items-center justify-center gap-1 font-bold text-lg",
                isBuy ? "text-green-400" : "text-red-400"
              )}>
                {isBuy ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                {signal.probability}%
              </div>
            </div>
            <div className="bg-blue-900/60 backdrop-blur-sm rounded-lg p-2 text-center border border-blue-500/30">
              <div className="text-[10px] text-blue-300 uppercase font-medium">Acción</div>
              <div className={cn(
                "font-bold text-lg",
                isBuy ? "text-green-400" : "text-red-400"
              )}>
                {signal.action === 'BUY' ? 'Comprar' : 'Vender'}
              </div>
            </div>
            <div className="bg-blue-900/60 backdrop-blur-sm rounded-lg p-2 text-center border border-blue-500/30">
              <div className="text-[10px] text-blue-300 uppercase font-medium">Sección</div>
              <div className="text-blue-100 text-xs leading-tight">
                {sessions.split(' / ').map((s, i) => (
                  <div key={i}>{s}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Entry Price Row */}
      <div className="px-4 py-3 bg-gradient-to-r from-blue-900/90 to-blue-800/90 flex items-center justify-between border-y border-blue-500/30">
        <span className="text-blue-100 font-medium">Precio De Entrada.</span>
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-xl">{signal.entryPrice}</span>
          <button 
            onClick={() => copyToClipboard(signal.entryPrice)} 
            className="text-blue-300 hover:text-blue-100 p-1"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Show More Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full py-2.5 bg-gradient-to-r from-blue-900/80 to-blue-800/80 text-sm text-blue-400/80 hover:text-blue-300 transition-colors flex items-center justify-center gap-2 border-b border-blue-500/20"
      >
        <div className="w-10 h-0.5 bg-gradient-to-r from-transparent via-blue-500/60 to-transparent rounded" />
        <span className="flex items-center gap-1">
          {expanded ? 'Mostrar menos' : 'Mostrar mas'}
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
        <div className="w-10 h-0.5 bg-gradient-to-r from-transparent via-blue-500/60 to-transparent rounded" />
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="bg-gradient-to-b from-[#0a1628] to-[#0d1f3c] px-4 pb-4 space-y-3 animate-in slide-in-from-top-2 duration-300">
          {/* Take Profit 1 */}
          <div className="bg-[#0d1a2d] rounded-xl p-3 border border-blue-500/30 mt-3">
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold">Takeprofit 1</span>
              <div className="flex items-center gap-2 flex-1 mx-4">
                <ProbabilityBar probability={87} type="profit" />
                <div className="text-right min-w-[60px]">
                  <div className="text-[10px] text-blue-300">Probabilida</div>
                  <div className="text-xs text-blue-400 font-medium">87%</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-green-400 text-xs">+{tp1Diff.toFixed(3)}</span>
                <span className="text-white font-bold text-lg">{takeProfit1}</span>
                <button onClick={() => copyToClipboard(takeProfit1)} className="text-blue-400 hover:text-blue-300 p-1">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Take Profit 2 */}
          <div className="bg-[#0d1a2d] rounded-xl p-3 border border-blue-500/30">
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold">Takrprofit 2</span>
              <div className="flex items-center gap-2 flex-1 mx-4">
                <ProbabilityBar probability={68} type="profit" />
                <div className="text-right min-w-[60px]">
                  <div className="text-[10px] text-blue-300">Probabilida</div>
                  <div className="text-xs text-blue-400 font-medium">68%</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-green-400 text-xs">+{tp2Diff.toFixed(3)}</span>
                <span className="text-white font-bold text-lg">{takeProfit2}</span>
                <button onClick={() => copyToClipboard(takeProfit2)} className="text-blue-400 hover:text-blue-300 p-1">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Stop Loss */}
          <div className="bg-[#0d1a2d] rounded-xl p-3 border border-blue-500/30">
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold">Stop Loss</span>
              <div className="flex items-center gap-2 flex-1 mx-4">
                <ProbabilityBar probability={25} type="loss" />
                <div className="text-right min-w-[60px]">
                  <div className="text-[10px] text-blue-300">Probabilida</div>
                  <div className="text-xs text-blue-400 font-medium">25%</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-red-400 text-xs">-{slDiff.toFixed(3)}</span>
                <span className="text-white font-bold text-lg">{signal.stopLoss}</span>
                <button onClick={() => copyToClipboard(signal.stopLoss)} className="text-blue-400 hover:text-blue-300 p-1">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Price Position Bar */}
          {(() => {
            const support = signal.support || signal.stopLoss;
            const resistance = signal.resistance || signal.takeProfit;
            const currentPrice = signal.entryPrice;
            const range = resistance - support;
            const position = range > 0 ? ((currentPrice - support) / range) * 100 : 50;
            const clampedPosition = Math.max(0, Math.min(100, position));
            const isNearSupport = clampedPosition < 30;
            const isNearResistance = clampedPosition > 70;
            
            return (
              <div className="bg-[#0a1628] rounded-xl p-4 border border-slate-700/50">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs text-slate-400 uppercase tracking-wider">Posición del Precio</span>
                  <span className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    isNearSupport && "bg-emerald-500/20 text-emerald-400",
                    isNearResistance && "bg-rose-500/20 text-rose-400",
                    !isNearSupport && !isNearResistance && "bg-amber-500/20 text-amber-400"
                  )}>
                    {isNearSupport ? "Cerca de Soporte" : isNearResistance ? "Cerca de Resistencia" : "Zona Neutral"}
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="relative h-8 rounded-lg overflow-hidden bg-gradient-to-r from-emerald-950 via-slate-900 to-rose-950">
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-transparent to-rose-500/20" />
                  
                  {/* Zone markers */}
                  <div className="absolute inset-y-0 left-0 w-[30%] border-r border-dashed border-emerald-500/30" />
                  <div className="absolute inset-y-0 right-0 w-[30%] border-l border-dashed border-rose-500/30" />
                  
                  {/* Current price indicator */}
                  <div 
                    className="absolute top-0 bottom-0 w-1 transition-all duration-500"
                    style={{ left: `${clampedPosition}%`, transform: 'translateX(-50%)' }}
                  >
                    <div className={cn(
                      "absolute inset-0 w-1 rounded-full",
                      isNearSupport && "bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.8)]",
                      isNearResistance && "bg-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.8)]",
                      !isNearSupport && !isNearResistance && "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]"
                    )} />
                    <div className={cn(
                      "absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full animate-pulse",
                      isNearSupport && "bg-emerald-400",
                      isNearResistance && "bg-rose-400",
                      !isNearSupport && !isNearResistance && "bg-amber-400"
                    )} />
                  </div>
                </div>
                
                {/* Labels */}
                <div className="flex justify-between mt-2">
                  <div className="text-left">
                    <div className="text-emerald-400 font-bold tabular-nums">{support}</div>
                    <div className="text-[10px] text-emerald-400/60 uppercase">Soporte</div>
                  </div>
                  <div className="text-center">
                    <div className={cn(
                      "font-bold tabular-nums",
                      isNearSupport && "text-emerald-300",
                      isNearResistance && "text-rose-300",
                      !isNearSupport && !isNearResistance && "text-amber-300"
                    )}>{currentPrice}</div>
                    <div className="text-[10px] text-slate-500 uppercase">Precio Actual</div>
                  </div>
                  <div className="text-right">
                    <div className="text-rose-400 font-bold tabular-nums">{resistance}</div>
                    <div className="text-[10px] text-rose-400/60 uppercase">Resistencia</div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Support & Resistance Cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* Support Card */}
            <div className="relative bg-gradient-to-br from-emerald-950/80 to-emerald-900/40 rounded-xl p-4 border border-emerald-500/40 overflow-hidden group hover:border-emerald-400/60 transition-all duration-300">
              {/* Background glow effect */}
              <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl group-hover:bg-emerald-500/30 transition-all" />
              
              {/* Mini chart with gradient bars */}
              <div className="relative h-14 flex items-end gap-0.5 mb-3">
                {[35, 45, 40, 55, 50, 60, 55, 65, 60, 70, 65, 75, 70, 80].map((h, i) => (
                  <div 
                    key={i} 
                    className="flex-1 rounded-t-sm transition-all duration-300 group-hover:opacity-90" 
                    style={{ 
                      height: `${h}%`,
                      background: `linear-gradient(to top, rgba(16, 185, 129, 0.9), rgba(52, 211, 153, 0.5))`
                    }} 
                  />
                ))}
                {/* Trend line */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
              </div>
              
              {/* Label and Value */}
              <div className="relative flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-500/50" />
                  <span className="text-emerald-300/80 font-medium text-xs uppercase tracking-wider">Soporte</span>
                </div>
                <span className="text-emerald-400 font-bold text-xl tabular-nums drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                  {signal.support || signal.stopLoss}
                </span>
              </div>
            </div>

            {/* Resistance Card */}
            <div className="relative bg-gradient-to-br from-rose-950/80 to-rose-900/40 rounded-xl p-4 border border-rose-500/40 overflow-hidden group hover:border-rose-400/60 transition-all duration-300">
              {/* Background glow effect */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-rose-500/20 rounded-full blur-2xl group-hover:bg-rose-500/30 transition-all" />
              
              {/* Mini chart with gradient bars */}
              <div className="relative h-14 flex items-end gap-0.5 mb-3">
                {[75, 70, 80, 65, 75, 60, 70, 55, 65, 50, 60, 45, 55, 40].map((h, i) => (
                  <div 
                    key={i} 
                    className="flex-1 rounded-t-sm transition-all duration-300 group-hover:opacity-90" 
                    style={{ 
                      height: `${h}%`,
                      background: `linear-gradient(to top, rgba(244, 63, 94, 0.9), rgba(251, 113, 133, 0.5))`
                    }} 
                  />
                ))}
                {/* Trend line */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-400/50 to-transparent" />
              </div>
              
              {/* Label and Value */}
              <div className="relative flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse shadow-lg shadow-rose-500/50" />
                  <span className="text-rose-300/80 font-medium text-xs uppercase tracking-wider">Resistencia</span>
                </div>
                <span className="text-rose-400 font-bold text-xl tabular-nums drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]">
                  {signal.resistance || signal.takeProfit}
                </span>
              </div>
            </div>
          </div>

          {/* Gauge and Session Info */}
          <div className="grid grid-cols-2 gap-3">
            {/* Gauge */}
            <div className="bg-[#0d1a2d] rounded-xl p-3 border border-blue-500/30 flex items-center justify-center">
              <div className="relative w-full max-w-[140px] h-20">
                <svg viewBox="0 0 140 70" className="w-full h-full">
                  <defs>
                    <linearGradient id={`gaugeGrad-${signal.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="25%" stopColor="#f97316" />
                      <stop offset="50%" stopColor="#eab308" />
                      <stop offset="75%" stopColor="#84cc16" />
                      <stop offset="100%" stopColor="#22c55e" />
                    </linearGradient>
                  </defs>
                  {/* Gauge arc */}
                  <path
                    d="M 15 60 A 55 55 0 0 1 125 60"
                    fill="none"
                    stroke={`url(#gaugeGrad-${signal.id})`}
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                  {/* Needle */}
                  <line
                    x1="70"
                    y1="60"
                    x2={70 + 40 * Math.cos(Math.PI * (1 - (isBuy ? 0.75 : 0.25)))}
                    y2={60 - 40 * Math.sin(Math.PI * (1 - (isBuy ? 0.75 : 0.25)))}
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle cx="70" cy="60" r="5" fill="white" />
                </svg>
                <div className="absolute bottom-0 w-full flex justify-between text-[9px] px-2">
                  <div className="text-center">
                    <div className="text-muted-foreground">Muy Alta</div>
                    <div className="text-red-400 font-medium">Vender</div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground">Muy Alta</div>
                    <div className="text-green-400 font-medium">Comprar</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Session Price Info */}
            <div className="bg-[#0d1a2d] rounded-xl p-3 border border-blue-500/30">
              <div className="text-[10px] text-blue-300 mb-2 font-medium">
                Precio Apertura y Cierre De Seccion
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-red-400 italic">Cierre</span>
                  <span className="text-red-400 font-bold">{(signal.entryPrice + 0.005).toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-400 italic">Apertura</span>
                  <span className="text-green-400 font-bold">{signal.entryPrice.toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-300 italic">Diferencia de Pips</span>
                  <span className={cn(
                    "font-bold",
                    isBuy ? "text-green-400" : "text-red-400"
                  )}>
                    {isBuy ? '+' : '-'} {Math.abs(Math.round((signal.takeProfit - signal.stopLoss) * 10000))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Chart */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0d1a2d] rounded-xl p-3 border border-blue-500/30">
              <div className="flex items-end justify-around h-24 mb-2">
                {[
                  { label: 'Inteligencia\nArtificial', value: 55 },
                  { label: 'Sentimiento\ndel Mercado', value: 72 },
                  { label: 'Paginas\nTrader', value: 65 },
                  { label: 'Análisis\nPrefecionales', value: 58 },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 flex-1">
                    <div className="text-[8px] text-blue-300 mb-1">{Math.round(item.value)}%</div>
                    <div 
                      className="w-6 bg-blue-500 rounded-t"
                      style={{ height: `${item.value}%` }}
                    />
                    <span className="text-[7px] text-center text-muted-foreground whitespace-pre-line leading-tight mt-1">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <button className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold py-3 px-4 rounded-xl border-2 border-green-400/50 shadow-lg shadow-green-500/30 transition-all text-sm">
                Ejecutar Orden
              </button>
              <button 
                onClick={analyzeWithAI}
                disabled={isAnalyzing}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 disabled:from-green-800 disabled:to-green-700 text-white font-bold py-3 px-4 rounded-xl border-2 border-green-400/50 shadow-lg shadow-green-500/30 transition-all text-sm leading-tight flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analizando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analisar Señal<br />Con AI
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Analysis Modal */}
          {showAnalysis && (
            <div className="mt-4 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl border border-primary/30 p-4 animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-primary">Análisis IA</h3>
                </div>
                <button 
                  onClick={() => setShowAnalysis(false)}
                  className="p-1 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              
              {isAnalyzing ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Analizando señal con IA...</p>
                  </div>
                </div>
              ) : aiAnalysis ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {aiAnalysis}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
