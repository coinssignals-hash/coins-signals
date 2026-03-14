import { useState, useEffect, useMemo, useRef } from 'react';
import { TradingSignal } from '@/hooks/useSignals';
import { Copy, TrendingUp, TrendingDown, Heart, ChevronDown, ChevronUp, Loader2, Sparkles, X, Wifi, WifiOff, Activity, History, Clock, Trash2, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/i18n/LanguageContext';
import { useDateLocale } from '@/hooks/useDateLocale';
import signalCardBg from '@/assets/signal-card-bg.png';
import { useRealtimeMarket } from '@/hooks/useRealtimeMarket';
import { PriceSparkline } from './PriceSparkline';
import { SaveSignalToJournal } from './SaveSignalToJournal';

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

interface AIAnalysisHistoryItem {
  id: string;
  analysis_text: string;
  confidence_level: number | null;
  recommendation: string | null;
  risk_level: string | null;
  created_at: string;
}

export function SignalCard({ signal, isFavorite = false, onToggleFavorite }: SignalCardProps) {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const [expanded, setExpanded] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState<AIAnalysisHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [priceHistory, setPriceHistory] = useState<number[]>([]);
  const maxHistoryLength = 60; // Keep last 60 price points

  // Convert currency pair to Polygon format (e.g., "EUR/USD" -> "C:EURUSD")
  const polygonSymbol = useMemo(() => {
    const pair = signal.currencyPair.replace('/', '');
    // Check if it's a crypto pair
    if (['BTC', 'ETH', 'XRP', 'LTC', 'ADA'].some(c => pair.includes(c))) {
      return `X:${pair}`;
    }
    // Check if it's a commodity
    if (pair.includes('XAU') || pair.includes('XAG')) {
      return `C:${pair}`;
    }
    // Default to forex
    return `C:${pair}`;
  }, [signal.currencyPair]);

  const { getQuote, isConnected, subscribe, unsubscribe } = useRealtimeMarket([]);

  // Subscribe to this signal's symbol when expanded
  useEffect(() => {
    if (expanded) {
      subscribe([polygonSymbol]);
      // Reset price history when expanding
      setPriceHistory([signal.entryPrice]);
    }
    return () => {
      if (expanded) {
        unsubscribe([polygonSymbol]);
      }
    };
  }, [expanded, polygonSymbol, subscribe, unsubscribe, signal.entryPrice]);

  const realtimeQuote = getQuote(polygonSymbol);
  const livePrice = realtimeQuote?.price;

  // Accumulate price history
  useEffect(() => {
    if (livePrice !== undefined && expanded) {
      setPriceHistory(prev => {
        const newHistory = [...prev, livePrice];
        // Keep only the last N prices
        if (newHistory.length > maxHistoryLength) {
          return newHistory.slice(-maxHistoryLength);
        }
        return newHistory;
      });
    }
  }, [livePrice, expanded]);
  
  const copyToClipboard = (value: number) => {
    navigator.clipboard.writeText(value.toString());
    toast.success(t('sig_price_copied'));
  };

  // Fetch analysis history
  const fetchAnalysisHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('signal_ai_analysis_history')
        .select('*')
        .eq('signal_id', signal.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setAnalysisHistory(data || []);
    } catch (error) {
      console.error('Error fetching analysis history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Save analysis to history
  const saveAnalysisToHistory = async (analysisText: string) => {
    try {
      // Extract confidence level from text (simple regex)
      const confidenceMatch = analysisText.match(/confianza[:\s]*(\d+)/i);
      const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : null;
      
      // Extract recommendation
      let recommendation = 'HOLD';
      if (analysisText.toLowerCase().includes('recomendación: comprar') || analysisText.toLowerCase().includes('buy')) {
        recommendation = 'BUY';
      } else if (analysisText.toLowerCase().includes('recomendación: vender') || analysisText.toLowerCase().includes('sell')) {
        recommendation = 'SELL';
      }

      // Extract risk level
      let riskLevel = 'MEDIUM';
      if (analysisText.toLowerCase().includes('riesgo alto') || analysisText.toLowerCase().includes('high risk')) {
        riskLevel = 'HIGH';
      } else if (analysisText.toLowerCase().includes('riesgo bajo') || analysisText.toLowerCase().includes('low risk')) {
        riskLevel = 'LOW';
      }

      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('signal_ai_analysis_history')
        .insert({
          signal_id: signal.id,
          user_id: user?.id || null,
          analysis_text: analysisText,
          confidence_level: confidence,
          recommendation: recommendation,
          risk_level: riskLevel
        });

      if (error) throw error;
      
      // Refresh history
      fetchAnalysisHistory();
    } catch (error) {
      console.error('Error saving analysis:', error);
    }
  };

  // Delete analysis from history
  const deleteAnalysis = async (analysisId: string) => {
    try {
      const { error } = await supabase
        .from('signal_ai_analysis_history')
        .delete()
        .eq('id', analysisId);

      if (error) throw error;
      setAnalysisHistory(prev => prev.filter(a => a.id !== analysisId));
      toast.success(t('sig_analysis_deleted'));
    } catch (error) {
      console.error('Error deleting analysis:', error);
      toast.error(t('sig_analysis_delete_error'));
    }
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
      
      // Save to history
      await saveAnalysisToHistory(data.analysis);
      
      toast.success(t('sig_analysis_complete'));
    } catch (error) {
      console.error('Error analyzing signal:', error);
      toast.error(t('sig_analysis_error'));
      setShowAnalysis(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Load history when showing history panel
  useEffect(() => {
    if (showHistory && analysisHistory.length === 0) {
      fetchAnalysisHistory();
    }
  }, [showHistory]);

  const isBuy = signal.action === 'BUY';
  const formattedDate = format(new Date(signal.datetime), "EEEE dd MMMM yyyy HH:mm", { locale: dateLocale });
  const formattedDateShort = format(new Date(signal.datetime), "EEE dd MMM yyyy HH:mm", { locale: dateLocale });
  
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
        {/* Overlay gradient - darker */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-900/85 to-slate-950/95" />
        
        {/* Subtle glow effects */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
        
        {/* Content */}
        <div className="relative z-10">
          {/* Date and Favorite */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-slate-400 font-medium">
                {formattedDateShort}
              </span>
              <span className="text-[10px] text-slate-500 px-1.5 py-0.5 rounded bg-slate-800/50">
                UTC+01:00
              </span>
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
                    isFavorite ? "fill-rose-500 text-rose-500" : "text-slate-500 hover:text-rose-400"
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
                <FlagIcon currency={quote} className="absolute -bottom-1 -right-3 w-8 h-8 border-2 border-slate-900" />
              </div>
              <div className="ml-2">
                <span className="text-2xl font-bold text-white tracking-tight">{base}-{quote}</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={cn(
                    "text-[10px] font-semibold px-1.5 py-0.5 rounded",
                    isBuy ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                  )}>
                    {signal.trend.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Badge & Probability Circle */}
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 font-semibold text-[11px] uppercase tracking-wide">
                  Activa
                </span>
              </div>
              <div className="relative w-14 h-14">
                <svg className="w-14 h-14 -rotate-90">
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    stroke="rgba(100, 116, 139, 0.2)"
                    strokeWidth="4"
                    fill="none"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    stroke={isBuy ? "#10b981" : "#f43f5e"}
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${(signal.probability / 100) * 150.8} 150.8`}
                    strokeLinecap="round"
                    className={isBuy ? "drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]"}
                  />
                </svg>
                <span className={cn(
                  "absolute inset-0 flex items-center justify-center text-sm font-bold",
                  isBuy ? "text-emerald-400" : "text-rose-400"
                )}>
                  {signal.probability}%
                </span>
              </div>
            </div>
          </div>

          {/* Trend/Action/Session Row */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="bg-slate-800/60 rounded-xl p-2.5 text-center border border-slate-700/50">
              <div className="text-[10px] text-slate-500 uppercase font-medium tracking-wider mb-1">Tendencia</div>
              <div className={cn(
                "flex items-center justify-center gap-1 font-bold text-lg",
                isBuy ? "text-emerald-400" : "text-rose-400"
              )}>
                {isBuy ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                {signal.probability}%
              </div>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-2.5 text-center border border-slate-700/50">
              <div className="text-[10px] text-slate-500 uppercase font-medium tracking-wider mb-1">Acción</div>
              <div className={cn(
                "font-bold text-lg",
                isBuy ? "text-emerald-400" : "text-rose-400"
              )}>
                {signal.action === 'BUY' ? t('sc_buy') : t('sc_sell')}
              </div>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-2.5 text-center border border-slate-700/50">
              <div className="text-[10px] text-slate-500 uppercase font-medium tracking-wider mb-1">{t('sc_session')}</div>
              <div className="text-slate-300 text-xs font-medium leading-tight">
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
        <span className="text-blue-100 font-medium">{t('sc_entry_price')}</span>
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
        <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 pb-4 space-y-3 animate-in slide-in-from-top-2 duration-300">
          {/* Take Profit 1 */}
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50 mt-3 hover:border-emerald-500/30 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-slate-200 font-semibold">Takeprofit 1</span>
              <div className="flex items-center gap-2 flex-1 mx-4">
                <ProbabilityBar probability={87} type="profit" />
                <div className="text-right min-w-[60px]">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Probabilidad</div>
                  <div className="text-xs text-emerald-400 font-medium">87%</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-emerald-400 text-xs font-medium">+{tp1Diff.toFixed(3)}</span>
                <span className="text-white font-bold text-lg tabular-nums">{takeProfit1}</span>
                <button onClick={() => copyToClipboard(takeProfit1)} className="text-slate-500 hover:text-emerald-400 p-1 transition-colors">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Take Profit 2 */}
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50 hover:border-emerald-500/30 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-slate-200 font-semibold">Takeprofit 2</span>
              <div className="flex items-center gap-2 flex-1 mx-4">
                <ProbabilityBar probability={68} type="profit" />
                <div className="text-right min-w-[60px]">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Probabilidad</div>
                  <div className="text-xs text-emerald-400 font-medium">68%</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-emerald-400 text-xs font-medium">+{tp2Diff.toFixed(3)}</span>
                <span className="text-white font-bold text-lg tabular-nums">{takeProfit2}</span>
                <button onClick={() => copyToClipboard(takeProfit2)} className="text-slate-500 hover:text-emerald-400 p-1 transition-colors">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Stop Loss */}
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50 hover:border-rose-500/30 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-slate-200 font-semibold">Stop Loss</span>
              <div className="flex items-center gap-2 flex-1 mx-4">
                <ProbabilityBar probability={25} type="loss" />
                <div className="text-right min-w-[60px]">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Probabilidad</div>
                  <div className="text-xs text-rose-400 font-medium">25%</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-rose-400 text-xs font-medium">-{slDiff.toFixed(3)}</span>
                <span className="text-white font-bold text-lg tabular-nums">{signal.stopLoss}</span>
                <button onClick={() => copyToClipboard(signal.stopLoss)} className="text-slate-500 hover:text-rose-400 p-1 transition-colors">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Price Position Bar */}
          {(() => {
            const support = signal.support || signal.stopLoss;
            const resistance = signal.resistance || signal.takeProfit;
            const currentPrice = livePrice ?? signal.entryPrice;
            const hasLivePrice = livePrice !== undefined;
            const range = resistance - support;
            const position = range > 0 ? ((currentPrice - support) / range) * 100 : 50;
            const clampedPosition = Math.max(0, Math.min(100, position));
            const isNearSupport = clampedPosition < 30;
            const isNearResistance = clampedPosition > 70;
            const priceChange = hasLivePrice ? currentPrice - signal.entryPrice : 0;
            const priceChangePercent = hasLivePrice ? ((currentPrice - signal.entryPrice) / signal.entryPrice) * 100 : 0;
            
            return (
              <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">{t('sc_price_position')}</span>
                    {/* Live indicator */}
                    {hasLivePrice && isConnected ? (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30">
                        <Wifi className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] text-emerald-400 font-medium animate-pulse">LIVE</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-700/50 border border-slate-600/50">
                        <WifiOff className="w-3 h-3 text-slate-500" />
                        <span className="text-[10px] text-slate-500 font-medium">ENTRY</span>
                      </div>
                    )}
                  </div>
                  <span className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    isNearSupport && "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
                    isNearResistance && "bg-rose-500/20 text-rose-400 border border-rose-500/30",
                    !isNearSupport && !isNearResistance && "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  )}>
                    {isNearSupport ? "Cerca de Soporte" : isNearResistance ? "Cerca de Resistencia" : "Zona Neutral"}
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="relative h-8 rounded-lg overflow-hidden bg-gradient-to-r from-emerald-950/60 via-slate-800 to-rose-950/60 border border-slate-700/30">
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-rose-500/10" />
                  
                  {/* Zone markers */}
                  <div className="absolute inset-y-0 left-0 w-[30%] border-r border-dashed border-emerald-500/20" />
                  <div className="absolute inset-y-0 right-0 w-[30%] border-l border-dashed border-rose-500/20" />
                  
                  {/* Entry price marker (static reference) */}
                  {hasLivePrice && (
                    <div 
                      className="absolute top-0 bottom-0 w-px bg-blue-400/40"
                      style={{ 
                        left: `${Math.max(0, Math.min(100, ((signal.entryPrice - support) / range) * 100))}%` 
                      }}
                    />
                  )}
                  
                  {/* Current price indicator */}
                  <div 
                    className="absolute top-0 bottom-0 w-1 transition-all duration-300"
                    style={{ left: `${clampedPosition}%`, transform: 'translateX(-50%)' }}
                  >
                    <div className={cn(
                      "absolute inset-0 w-1 rounded-full",
                      isNearSupport && "bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.8)]",
                      isNearResistance && "bg-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.8)]",
                      !isNearSupport && !isNearResistance && "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]"
                    )} />
                    <div className={cn(
                      "absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full",
                      hasLivePrice && "animate-pulse",
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
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Soporte</div>
                  </div>
                  <div className="text-center">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "font-bold tabular-nums transition-colors duration-300",
                        isNearSupport && "text-emerald-300",
                        isNearResistance && "text-rose-300",
                        !isNearSupport && !isNearResistance && "text-amber-300"
                      )}>
                        {currentPrice.toFixed(currentPrice < 10 ? 4 : 1)}
                      </div>
                      {hasLivePrice && (
                        <div className={cn(
                          "text-[10px] font-medium tabular-nums",
                          priceChange >= 0 ? "text-emerald-400" : "text-rose-400"
                        )}>
                          {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(currentPrice < 10 ? 4 : 1)} ({priceChangePercent >= 0 ? "+" : ""}{priceChangePercent.toFixed(1)}%)
                        </div>
                      )}
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                        {hasLivePrice ? "Precio en Vivo" : "Precio Entrada"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-rose-400 font-bold tabular-nums">{resistance}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Resistencia</div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Live Price Sparkline */}
          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">{t('sc_realtime_movement')}</span>
              </div>
              <span className="text-[10px] text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded">{priceHistory.length} {t('sc_points')}</span>
            </div>
            <PriceSparkline 
              prices={priceHistory} 
              entryPrice={signal.entryPrice}
              className="h-16"
            />
          </div>

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
            <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50 flex items-center justify-center">
              <div className="relative w-full max-w-[140px] h-20">
                <svg viewBox="0 0 140 70" className="w-full h-full">
                  <defs>
                    <linearGradient id={`gaugeGrad-${signal.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f43f5e" />
                      <stop offset="25%" stopColor="#f97316" />
                      <stop offset="50%" stopColor="#eab308" />
                      <stop offset="75%" stopColor="#84cc16" />
                      <stop offset="100%" stopColor="#10b981" />
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
                    <div className="text-slate-500">Muy Alta</div>
                    <div className="text-rose-400 font-medium">Vender</div>
                  </div>
                  <div className="text-center">
                    <div className="text-slate-500">Muy Alta</div>
                    <div className="text-emerald-400 font-medium">Comprar</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Session Price Info */}
            <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
              <div className="text-[10px] text-slate-400 mb-2 font-medium uppercase tracking-wider">
                Precio Apertura y Cierre
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-rose-400 italic">Cierre</span>
                  <span className="text-rose-400 font-bold tabular-nums">{(signal.entryPrice + 0.005).toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-400 italic">Apertura</span>
                  <span className="text-emerald-400 font-bold tabular-nums">{signal.entryPrice.toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 italic">Diferencia Pips</span>
                  <span className={cn(
                    "font-bold tabular-nums",
                    isBuy ? "text-emerald-400" : "text-rose-400"
                  )}>
                    {isBuy ? '+' : '-'} {Math.abs(Math.round((signal.takeProfit - signal.stopLoss) * 10000))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Market Sentiment Radar Chart */}
          <div className="grid grid-cols-2 gap-3">
            {(() => {
              // Use real analysis data from signal or generate from probability/trend
              const defaultLabels = ['IA', 'Mercado', 'Traders', 'Técnico'];
              const analysisValues = signal.analysisData?.length === 4 
                ? signal.analysisData.map(d => d.value)
                : [
                    // Generate values based on signal characteristics
                    Math.min(100, Math.max(20, signal.probability + (Math.random() * 10 - 5))),
                    Math.min(100, Math.max(20, signal.probability + (signal.trend === 'bullish' ? 10 : -5))),
                    Math.min(100, Math.max(20, signal.probability - 5 + (Math.random() * 15))),
                    Math.min(100, Math.max(20, signal.probability + (Math.random() * 8 - 4)))
                  ];
              const labels = signal.analysisData?.length === 4 
                ? signal.analysisData.map(d => d.label)
                : defaultLabels;
              const average = Math.round(analysisValues.reduce((a, b) => a + b, 0) / analysisValues.length);
              const isBullish = average >= 50;
              
              return (
                <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">{t('sc_sentiment_analysis')}</span>
                    <span className={cn(
                      "text-[10px] font-medium px-2 py-0.5 rounded-full border",
                      isBullish ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                    )}>
                      {isBullish ? t('sc_bullish') : t('sc_bearish')}
                    </span>
                  </div>
                  
                  {/* Radar-style chart */}
                  <div className="relative w-full aspect-square max-w-[160px] mx-auto">
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                      {/* Background circles */}
                      {[20, 40, 60, 80, 100].map((r, i) => (
                        <circle
                          key={i}
                          cx="100"
                          cy="100"
                          r={r * 0.8}
                          fill="none"
                          stroke={i === 2 ? "rgba(59, 130, 246, 0.3)" : "rgba(59, 130, 246, 0.12)"}
                          strokeWidth={i === 2 ? "1.5" : "1"}
                          strokeDasharray={i === 2 ? "4 2" : "none"}
                        />
                      ))}
                      
                      {/* Axis lines */}
                      {[0, 1, 2, 3].map((i) => {
                        const angle = (i * 90 - 90) * (Math.PI / 180);
                        const x2 = 100 + Math.cos(angle) * 80;
                        const y2 = 100 + Math.sin(angle) * 80;
                        return (
                          <line
                            key={i}
                            x1="100"
                            y1="100"
                            x2={x2}
                            y2={y2}
                            stroke="rgba(59, 130, 246, 0.2)"
                            strokeWidth="1"
                          />
                        );
                      })}
                      
                      {/* Data polygon */}
                      {(() => {
                        const points = analysisValues.map((v, i) => {
                          const angle = (i * 90 - 90) * (Math.PI / 180);
                          const r = (v / 100) * 80;
                          return `${100 + Math.cos(angle) * r},${100 + Math.sin(angle) * r}`;
                        }).join(' ');
                        
                        const gradientId = `radarGradient-${signal.id}`;
                        const color = isBullish ? { main: '16, 185, 129', hex: '#10b981' } : { main: '244, 63, 94', hex: '#f43f5e' };
                        
                        return (
                          <>
                            <defs>
                              <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor={`rgba(${color.main}, 0.5)`} />
                                <stop offset="100%" stopColor={`rgba(${color.main}, 0.1)`} />
                              </radialGradient>
                            </defs>
                            <polygon
                              points={points}
                              fill={`url(#${gradientId})`}
                              stroke={`rgba(${color.main}, 0.9)`}
                              strokeWidth="2"
                              className="radar-polygon"
                            />
                            {/* Data points with staggered animation */}
                            {analysisValues.map((v, i) => {
                              const angle = (i * 90 - 90) * (Math.PI / 180);
                              const r = (v / 100) * 80;
                              const x = 100 + Math.cos(angle) * r;
                              const y = 100 + Math.sin(angle) * r;
                              return (
                                <g key={i} className={`radar-point radar-point-${i}`}>
                                  <circle
                                    cx={x}
                                    cy={y}
                                    r="6"
                                    fill={`rgba(${color.main}, 0.3)`}
                                  />
                                  <circle
                                    cx={x}
                                    cy={y}
                                    r="4"
                                    fill={color.hex}
                                    stroke="#0d1a2d"
                                    strokeWidth="2"
                                  />
                                </g>
                              );
                            })}
                          </>
                        );
                      })()}
                    </svg>
                    
                    {/* Labels with staggered animation */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 text-center radar-label radar-label-0">
                      <span className={cn("text-[10px] font-bold", isBullish ? "text-emerald-400" : "text-rose-400")}>
                        {Math.round(analysisValues[0])}%
                      </span>
                      <span className="block text-[8px] text-slate-400">{labels[0]}</span>
                    </div>
                    <div className="absolute top-1/2 right-0 translate-x-1 -translate-y-1/2 text-center radar-label radar-label-1">
                      <span className={cn("text-[10px] font-bold", isBullish ? "text-emerald-400" : "text-rose-400")}>
                        {Math.round(analysisValues[1])}%
                      </span>
                      <span className="block text-[8px] text-slate-400">{labels[1]}</span>
                    </div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 text-center radar-label radar-label-2">
                      <span className={cn("text-[10px] font-bold", isBullish ? "text-emerald-400" : "text-rose-400")}>
                        {Math.round(analysisValues[2])}%
                      </span>
                      <span className="block text-[8px] text-slate-400">{labels[2]}</span>
                    </div>
                    <div className="absolute top-1/2 left-0 -translate-x-1 -translate-y-1/2 text-center radar-label radar-label-3">
                      <span className={cn("text-[10px] font-bold", isBullish ? "text-emerald-400" : "text-rose-400")}>
                        {Math.round(analysisValues[3])}%
                      </span>
                      <span className="block text-[8px] text-slate-400">{labels[3]}</span>
                    </div>
                    
                    {/* Center score with animation */}
                    <div className="absolute inset-0 flex items-center justify-center radar-center">
                      <div className="text-center">
                        <span className={cn("text-2xl font-bold", isBullish ? "text-emerald-400" : "text-rose-400")}>
                          {average}
                        </span>
                        <span className="block text-[8px] text-slate-400 uppercase">Promedio</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <button className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3 px-4 rounded-xl border border-emerald-400/30 shadow-lg shadow-emerald-500/20 transition-all text-sm">
                Ejecutar Orden
              </button>
              <button 
                onClick={analyzeWithAI}
                disabled={isAnalyzing}
                className="flex-1 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 disabled:from-slate-700 disabled:to-slate-600 text-white font-bold py-3 px-4 rounded-xl border border-violet-400/30 shadow-lg shadow-violet-500/20 transition-all text-sm leading-tight flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analizando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analizar Señal<br />Con AI
                  </>
                )}
              </button>
              {/* History Button */}
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className={cn(
                  "flex items-center justify-center gap-2 py-2 px-3 rounded-xl border transition-all text-xs font-medium",
                  showHistory 
                    ? "bg-slate-700/80 border-slate-600/50 text-slate-300" 
                    : "bg-slate-800/60 border-slate-700/50 text-slate-400 hover:bg-slate-700/60 hover:text-slate-300"
                )}
              >
                <History className="w-3.5 h-3.5" />
                Historial ({analysisHistory.length})
              </button>
            </div>
          </div>

          {/* AI Analysis History Panel */}
          {showHistory && (
            <div className="mt-4 bg-slate-800/60 rounded-xl border border-slate-700/50 p-4 animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-slate-400" />
                  <h3 className="font-semibold text-slate-200">{t('sc_ai_history')}</h3>
                </div>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              {loadingHistory ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : analysisHistory.length === 0 ? (
                <div className="text-center py-6">
                  <History className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">{t('sig_no_history')}</p>
                  <p className="text-xs text-slate-600 mt-1">{t('sig_no_history_hint')}</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {analysisHistory.map((item) => (
                    <div 
                      key={item.id}
                      className="bg-slate-900/60 rounded-xl p-3 border border-slate-700/40 group hover:border-slate-600/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1 text-[10px] text-slate-500">
                            <Clock className="w-3 h-3" />
                            {format(new Date(item.created_at), "dd MMM yyyy HH:mm", { locale: dateLocale })}
                          </div>
                          {item.recommendation && (
                            <span className={cn(
                              "text-[10px] font-medium px-1.5 py-0.5 rounded border",
                              item.recommendation === 'BUY' && "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
                              item.recommendation === 'SELL' && "bg-rose-500/15 text-rose-400 border-rose-500/30",
                              item.recommendation === 'HOLD' && "bg-amber-500/15 text-amber-400 border-amber-500/30"
                            )}>
                              {item.recommendation}
                            </span>
                          )}
                          {item.risk_level && (
                            <span className={cn(
                              "text-[10px] font-medium px-1.5 py-0.5 rounded border",
                              item.risk_level === 'LOW' && "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
                              item.risk_level === 'MEDIUM' && "bg-amber-500/15 text-amber-400 border-amber-500/30",
                              item.risk_level === 'HIGH' && "bg-rose-500/15 text-rose-400 border-rose-500/30"
                            )}>
                              {t('sc_risk')}: {item.risk_level === 'LOW' ? t('sc_risk_low') : item.risk_level === 'MEDIUM' ? t('sc_risk_medium') : t('sc_risk_high')}
                            </span>
                          )}
                          {item.confidence_level && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400 border border-violet-500/30">
                              {item.confidence_level}% {t('sc_confidence')}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => deleteAnalysis(item.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-600 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                          title="Eliminar análisis"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-3 whitespace-pre-wrap leading-relaxed">
                        {item.analysis_text}
                      </p>
                      <button
                        onClick={() => {
                          setAiAnalysis(item.analysis_text);
                          setShowAnalysis(true);
                          setShowHistory(false);
                        }}
                        className="mt-2 text-[10px] text-violet-400 hover:text-violet-300 transition-colors font-medium"
                      >
                        Ver análisis completo →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AI Analysis Modal */}
          {showAnalysis && (
            <div className="mt-4 bg-gradient-to-br from-violet-950/40 to-slate-900/60 rounded-xl border border-violet-500/30 p-4 animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-violet-400" />
                  <h3 className="font-semibold text-violet-300">Análisis IA</h3>
                </div>
                <button 
                  onClick={() => setShowAnalysis(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
              
              {isAnalyzing ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
                    <p className="text-sm text-slate-400">Analizando señal con IA...</p>
                  </div>
                </div>
              ) : aiAnalysis ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
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
