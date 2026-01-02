import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { playNotificationSound } from '@/utils/notificationSound';
import { toast } from 'sonner';

type ChartPeriod = '5m' | '15m' | '30m' | '1h' | '4h' | '1w';

interface PatternAlertConfig {
  enabled: boolean;
  types: {
    bullish: boolean;
    bearish: boolean;
    neutral: boolean;
  };
  enableSound: boolean;
}

interface PriceChartProps {
  pair: string;
  timeframe: string;
  priceData?: Array<{
    time: string;
    price: number;
    open: number;
    high: number;
    low: number;
    volume?: number;
  }>;
  smaData?: {
    sma20: Array<{
      datetime: string;
      sma: number;
    }>;
    sma50: Array<{
      datetime: string;
      sma: number;
    }>;
  };
  loading?: boolean;
  error?: string | null;
  realtimePrice?: number | null;
  isRealtimeConnected?: boolean;
  previousClose?: number;
  onPeriodChange?: (period: ChartPeriod) => void;
  showVolume?: boolean;
  patternAlertConfig?: PatternAlertConfig;
}

// Market session times in UTC with detailed info
const MARKET_SESSIONS = [{
  id: 'sydney',
  name: 'Sídney',
  start: 21,
  end: 6,
  color: 'rgba(168, 85, 247, 0.12)',
  borderColor: 'rgba(168, 85, 247, 0.6)',
  bgColor: 'bg-purple-500/20',
  textColor: 'text-purple-400',
  emoji: '🇦🇺',
  markets: 'Sídney, Wellington',
  volatility: 'Baja',
  pairs: 'AUD, NZD',
  description: 'Primera sesión del día. Baja liquidez pero buenos movimientos en AUD/NZD.'
}, {
  id: 'asia',
  name: 'Asia',
  start: 0,
  end: 9,
  color: 'rgba(251, 191, 36, 0.12)',
  borderColor: 'rgba(251, 191, 36, 0.6)',
  bgColor: 'bg-amber-500/20',
  textColor: 'text-amber-400',
  emoji: '🌏',
  markets: 'Tokio, Singapur, Hong Kong',
  volatility: 'Media-Baja',
  pairs: 'JPY, SGD, HKD',
  description: 'Sesión más tranquila. Ideal para pares asiáticos y commodities.'
}, {
  id: 'london',
  name: 'Londres',
  start: 8,
  end: 17,
  color: 'rgba(59, 130, 246, 0.12)',
  borderColor: 'rgba(59, 130, 246, 0.6)',
  bgColor: 'bg-blue-500/20',
  textColor: 'text-blue-400',
  emoji: '🇬🇧',
  markets: 'Londres, Frankfurt, Zúrich, París',
  volatility: 'Alta',
  pairs: 'EUR, GBP, CHF',
  description: 'Mayor liquidez del día. Movimientos significativos en EUR y GBP.'
}, {
  id: 'ny',
  name: 'Nueva York',
  start: 13,
  end: 22,
  color: 'rgba(34, 197, 94, 0.12)',
  borderColor: 'rgba(34, 197, 94, 0.6)',
  bgColor: 'bg-green-500/20',
  textColor: 'text-green-400',
  emoji: '🇺🇸',
  markets: 'Nueva York, Chicago, Toronto',
  volatility: 'Alta',
  pairs: 'USD, CAD',
  description: 'Solapamiento con Londres genera máxima volatilidad. Noticias económicas clave.'
}];
type SessionId = 'sydney' | 'asia' | 'london' | 'ny';
const periodButtons: {
  value: ChartPeriod;
  label: string;
  minutes: number;
}[] = [{
  value: '5m',
  label: '5m',
  minutes: 5
}, {
  value: '15m',
  label: '15m',
  minutes: 15
}, {
  value: '30m',
  label: '30m',
  minutes: 30
}, {
  value: '1h',
  label: '1h',
  minutes: 60
}, {
  value: '4h',
  label: '4h',
  minutes: 240
}, {
  value: '1w',
  label: '1S',
  minutes: 10080
}];

// Always show 5 days of data
const CHART_DAYS = 5;
const CHART_MINUTES = CHART_DAYS * 24 * 60; // 5 days in minutes

// Get session for a given UTC hour, filtered by enabled sessions
function getSessionsForHour(utcHour: number, enabledSessions: Set<SessionId>) {
  return MARKET_SESSIONS.filter(session => {
    // Check if session is enabled
    if (!enabledSessions.has(session.id as SessionId)) return false;
    if (session.start < session.end) {
      return utcHour >= session.start && utcHour < session.end;
    }
    // Handle sessions that cross midnight (like Sydney 21:00-06:00)
    return utcHour >= session.start || utcHour < session.end;
  });
}

// Candlestick pattern detection
interface CandlePattern {
  index: number;
  type: 'doji' | 'hammer' | 'inverted_hammer' | 'bullish_engulfing' | 'bearish_engulfing' | 'morning_star' | 'evening_star';
  label: string;
  emoji: string;
  color: string;
  signal: 'bullish' | 'bearish' | 'neutral';
}

interface CandleData {
  open: number;
  high: number;
  low: number;
  price: number; // close
}

function detectCandlePatterns(data: CandleData[]): CandlePattern[] {
  const patterns: CandlePattern[] = [];
  if (data.length < 2) return patterns;

  for (let i = 0; i < data.length; i++) {
    const candle = data[i];
    const body = Math.abs(candle.price - candle.open);
    const range = candle.high - candle.low;
    const upperWick = candle.high - Math.max(candle.open, candle.price);
    const lowerWick = Math.min(candle.open, candle.price) - candle.low;
    const isBullish = candle.price > candle.open;

    // Doji: very small body relative to range
    if (range > 0 && body / range < 0.1) {
      patterns.push({
        index: i,
        type: 'doji',
        label: 'Doji',
        emoji: '⚖️',
        color: '#fbbf24',
        signal: 'neutral'
      });
      continue;
    }

    // Hammer: small body at top, long lower wick (bullish reversal)
    if (range > 0 && lowerWick > body * 2 && upperWick < body * 0.5 && body / range < 0.4) {
      patterns.push({
        index: i,
        type: 'hammer',
        label: 'Hammer',
        emoji: '🔨',
        color: '#22c55e',
        signal: 'bullish'
      });
      continue;
    }

    // Inverted Hammer: small body at bottom, long upper wick (bullish reversal)
    if (range > 0 && upperWick > body * 2 && lowerWick < body * 0.5 && body / range < 0.4) {
      patterns.push({
        index: i,
        type: 'inverted_hammer',
        label: 'Inv Hammer',
        emoji: '⬆️',
        color: '#22c55e',
        signal: 'bullish'
      });
      continue;
    }

    // Engulfing patterns: need previous candle
    if (i > 0) {
      const prev = data[i - 1];
      const prevBody = Math.abs(prev.price - prev.open);
      const prevIsBullish = prev.price > prev.open;

      // Bullish Engulfing: bearish candle followed by larger bullish candle that engulfs it
      if (!prevIsBullish && isBullish && 
          candle.open < prev.price && candle.price > prev.open && 
          body > prevBody * 1.2) {
        patterns.push({
          index: i,
          type: 'bullish_engulfing',
          label: 'Bull Engulf',
          emoji: '🟢',
          color: '#22c55e',
          signal: 'bullish'
        });
        continue;
      }

      // Bearish Engulfing: bullish candle followed by larger bearish candle that engulfs it
      if (prevIsBullish && !isBullish && 
          candle.open > prev.price && candle.price < prev.open && 
          body > prevBody * 1.2) {
        patterns.push({
          index: i,
          type: 'bearish_engulfing',
          label: 'Bear Engulf',
          emoji: '🔴',
          color: '#ef4444',
          signal: 'bearish'
        });
        continue;
      }
    }
  }

  return patterns;
}
export function PriceChart({
  pair,
  timeframe,
  priceData,
  smaData,
  loading,
  error,
  realtimePrice,
  isRealtimeConnected = false,
  previousClose,
  onPeriodChange,
  showVolume = true,
  patternAlertConfig
}: PriceChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const volumeCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const volumeContainerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0
  });
  const [volumeDimensions, setVolumeDimensions] = useState({
    width: 0,
    height: 0
  });
  const [hoveredData, setHoveredData] = useState<{
    x: number;
    y: number;
    price: number;
    open: number;
    high: number;
    low: number;
    time: string;
    volume?: number;
    index: number;
    sessions?: typeof MARKET_SESSIONS;
  } | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<ChartPeriod>('4h');
  const [enabledSessions, setEnabledSessions] = useState<Set<SessionId>>(new Set(['sydney', 'asia', 'london', 'ny']));
  const [showSessions, setShowSessions] = useState(true);
  const [showVolumeChart, setShowVolumeChart] = useState(showVolume);
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle');
  const [showPatterns, setShowPatterns] = useState(true);
  const [patternFilter, setPatternFilter] = useState<'all' | 'bullish' | 'bearish' | 'neutral'>('all');
  
  const handlePeriodClick = (period: ChartPeriod) => {
    setSelectedPeriod(period);
    onPeriodChange?.(period);
  };
  const toggleSession = (sessionId: SessionId) => {
    setEnabledSessions(prev => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
  };

  // Get time range - always 5 days
  const getTimeRange = useMemo(() => {
    const now = new Date();
    const startTime = new Date(now.getTime() - CHART_MINUTES * 60 * 1000);
    return {
      startTime,
      endTime: now
    };
  }, []);

  // Aggregate data into candles based on selected period
  const aggregateCandles = useCallback((data: typeof priceData, periodMinutes: number) => {
    if (!data || data.length === 0) return [];
    
    const aggregated: Array<{
      time: string;
      timestamp: Date;
      utcHour: number;
      price: number;
      open: number;
      high: number;
      low: number;
      volume: number;
    }> = [];

    // Group data by period
    const groups = new Map<number, typeof data>();
    
    data.forEach(item => {
      const date = new Date(item.time);
      if (isNaN(date.getTime())) return;
      
      // Calculate period bucket (floor to period interval)
      const periodMs = periodMinutes * 60 * 1000;
      const bucket = Math.floor(date.getTime() / periodMs) * periodMs;
      
      if (!groups.has(bucket)) {
        groups.set(bucket, []);
      }
      groups.get(bucket)!.push(item);
    });

    // Convert groups to aggregated candles
    const sortedBuckets = Array.from(groups.keys()).sort((a, b) => a - b);
    
    sortedBuckets.forEach(bucket => {
      const items = groups.get(bucket)!;
      if (items.length === 0) return;
      
      const bucketDate = new Date(bucket);
      const open = items[0].open;
      const close = items[items.length - 1].price;
      const high = Math.max(...items.map(i => i.high));
      const low = Math.min(...items.map(i => i.low));
      const volume = items.reduce((sum, i) => sum + (i.volume || 0), 0);
      
      // Format time label based on period
      let timeLabel = '';
      if (periodMinutes >= 1440) { // 1 day or more
        timeLabel = bucketDate.toLocaleDateString('es-ES', {
          weekday: 'short',
          day: 'numeric',
          month: 'short'
        });
      } else if (periodMinutes >= 60) { // 1 hour or more
        timeLabel = bucketDate.toLocaleDateString('es-ES', {
          weekday: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      } else {
        timeLabel = bucketDate.toLocaleTimeString('es-ES', {
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      }
      
      aggregated.push({
        time: timeLabel,
        timestamp: bucketDate,
        utcHour: bucketDate.getUTCHours(),
        price: close,
        open,
        high,
        low,
        volume: volume || Math.abs(high - low) * 1000000 * (0.5 + Math.random())
      });
    });

    return aggregated;
  }, []);

  // Calculate chart data with UTC hours for sessions, filtered to 5 days and aggregated by period
  const chartData = useMemo(() => {
    if (!priceData || priceData.length === 0) return [];
    
    const { startTime, endTime } = getTimeRange;
    const periodConfig = periodButtons.find(p => p.value === selectedPeriod);
    const periodMinutes = periodConfig?.minutes || 60;
    
    // Filter data to 5 days range first
    const filteredData = priceData.filter(item => {
      const date = new Date(item.time);
      if (isNaN(date.getTime())) return false;
      return date >= startTime && date <= endTime;
    });
    
    // Aggregate into candles based on selected period
    return aggregateCandles(filteredData, periodMinutes);
  }, [priceData, getTimeRange, selectedPeriod, aggregateCandles]);

  // Add realtime price
  const finalData = useMemo(() => {
    if (!realtimePrice || chartData.length === 0) return chartData;
    const now = new Date();
    return [...chartData, {
      time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
      timestamp: now,
      utcHour: now.getUTCHours(),
      price: realtimePrice,
      open: realtimePrice,
      high: realtimePrice,
      low: realtimePrice,
      volume: chartData[chartData.length - 1]?.volume || 0
    }];
  }, [chartData, realtimePrice]);

  // Detect candlestick patterns
  const detectedPatterns = useMemo(() => {
    if (!showPatterns || chartType !== 'candle' || finalData.length < 2) return [];
    return detectCandlePatterns(finalData.map(d => ({
      open: d.open,
      high: d.high,
      low: d.low,
      price: d.price
    })));
  }, [finalData, showPatterns, chartType]);

  // Track previously detected patterns to only alert on new ones
  const prevPatternsRef = useRef<string[]>([]);

  // Pattern alert notification effect
  useEffect(() => {
    if (!patternAlertConfig?.enabled || detectedPatterns.length === 0) return;

    // Create unique identifiers for current patterns
    const currentPatternIds = detectedPatterns.map(p => `${p.type}-${p.index}`);
    
    // Find new patterns that weren't in the previous detection
    const newPatterns = detectedPatterns.filter((p, i) => 
      !prevPatternsRef.current.includes(currentPatternIds[i])
    );

    // Alert for each new pattern
    newPatterns.forEach(pattern => {
      const shouldAlert = 
        (pattern.signal === 'bullish' && patternAlertConfig.types.bullish) ||
        (pattern.signal === 'bearish' && patternAlertConfig.types.bearish) ||
        (pattern.signal === 'neutral' && patternAlertConfig.types.neutral);

      if (shouldAlert) {
        // Play sound if enabled
        if (patternAlertConfig.enableSound) {
          playNotificationSound(`pattern_${pattern.signal}`);
        }

        // Show toast notification
        const point = finalData[pattern.index];
        const timeStr = point?.time || '';
        
        toast(pattern.label, {
          description: `${pattern.signal === 'bullish' ? '↑ Señal Alcista' : pattern.signal === 'bearish' ? '↓ Señal Bajista' : '→ Indecisión'} detectada en ${pair} @ ${timeStr}`,
          icon: pattern.emoji,
          duration: 5000,
          className: pattern.signal === 'bullish' 
            ? 'border-green-500/50 bg-green-500/10' 
            : pattern.signal === 'bearish' 
              ? 'border-red-500/50 bg-red-500/10' 
              : 'border-amber-500/50 bg-amber-500/10',
        });
      }
    });

    // Update the ref with current pattern ids
    prevPatternsRef.current = currentPatternIds;
  }, [detectedPatterns, patternAlertConfig, pair, finalData]);

  // Format time range description - always shows 5 days with selected candle interval
  const timeRangeDescription = useMemo(() => {
    const { startTime, endTime } = getTimeRange;
    const periodConfig = periodButtons.find(p => p.value === selectedPeriod);
    const formatDate = (date: Date) => date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
    return `${formatDate(startTime)} → ${formatDate(endTime)} (velas de ${periodConfig?.label || '1h'})`;
  }, [getTimeRange, selectedPeriod]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
      if (volumeContainerRef.current) {
        setVolumeDimensions({
          width: volumeContainerRef.current.clientWidth,
          height: volumeContainerRef.current.clientHeight
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Draw chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || finalData.length === 0 || dimensions.width === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);
    const padding = {
      top: 20,
      right: 70,
      bottom: 30,
      left: 10
    };
    const chartWidth = dimensions.width - padding.left - padding.right;
    const chartHeight = dimensions.height - padding.top - padding.bottom;

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Calculate price range using OHLC for candlestick accuracy
    const allHighs = finalData.map(d => d.high);
    const allLows = finalData.map(d => d.low);
    const minPrice = Math.min(...allLows);
    const maxPrice = Math.max(...allHighs);
    const priceRange = maxPrice - minPrice || 1;
    const paddedMin = minPrice - priceRange * 0.05;
    const paddedMax = maxPrice + priceRange * 0.05;
    const paddedRange = paddedMax - paddedMin;

    // Draw session backgrounds (only if sessions are enabled)
    if (showSessions) {
      let prevSession: string | null = null;
      finalData.forEach((point, i) => {
        const sessions = getSessionsForHour(point.utcHour, enabledSessions);
        const x = padding.left + i / (finalData.length - 1) * chartWidth;
        const barWidth = chartWidth / (finalData.length - 1);

        // Draw session background bands
        sessions.forEach(session => {
          ctx.fillStyle = session.color;
          ctx.fillRect(x - barWidth / 2, padding.top, barWidth + 1, chartHeight);
        });

        // Draw session start marker
        const currentSessionName = sessions.map(s => s.name).join(',');
        if (currentSessionName !== prevSession && sessions.length > 0 && i > 0) {
          const mainSession = sessions[0];
          ctx.beginPath();
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = mainSession.borderColor;
          ctx.lineWidth = 1.5;
          ctx.moveTo(x, padding.top);
          ctx.lineTo(x, padding.top + chartHeight);
          ctx.stroke();
          ctx.setLineDash([]);

          // Session label at top
          ctx.fillStyle = mainSession.borderColor;
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`${mainSession.emoji} ${mainSession.name}`, x + 4, padding.top + 14);
        }
        prevSession = currentSessionName;
      });
    }

    // Calculate close price for comparison
    const closePrice = previousClose || finalData[0]?.open || finalData[0]?.price;

    // Draw previous close line (dashed red)
    if (closePrice) {
      const closeY = padding.top + chartHeight - (closePrice - paddedMin) / paddedRange * chartHeight;
      ctx.beginPath();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
      ctx.lineWidth = 1;
      ctx.moveTo(padding.left, closeY);
      ctx.lineTo(dimensions.width - padding.right, closeY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Previous close label
      ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.fillRect(dimensions.width - padding.right + 5, closeY - 10, 60, 20);
      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Cierre ant.', dimensions.width - padding.right + 35, closeY - 2);
      ctx.fillText(closePrice.toFixed(4), dimensions.width - padding.right + 35, closeY + 8);
    }

    // Draw Y-axis labels
    ctx.fillStyle = 'rgba(156, 163, 175, 0.8)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const price = paddedMin + paddedRange / ySteps * i;
      const y = padding.top + chartHeight - i / ySteps * chartHeight;
      ctx.fillText(price.toFixed(4), dimensions.width - 5, y + 3);
    }

    // Draw X-axis labels
    ctx.textAlign = 'center';
    const xLabelCount = Math.min(8, finalData.length);
    const xStep = Math.floor(finalData.length / xLabelCount);
    for (let i = 0; i < finalData.length; i += xStep) {
      const x = padding.left + i / (finalData.length - 1) * chartWidth;
      ctx.fillText(finalData[i].time, x, dimensions.height - 5);
    }

    // Draw chart based on type
    if (chartType === 'candle') {
      // Draw Japanese Candlesticks
      const candleWidth = Math.max(3, (chartWidth / finalData.length) * 0.7);
      const wickWidth = 1;
      
      finalData.forEach((point, i) => {
        const x = padding.left + i / (finalData.length - 1) * chartWidth;
        
        // Calculate Y positions for OHLC
        const openY = padding.top + chartHeight - (point.open - paddedMin) / paddedRange * chartHeight;
        const closeY = padding.top + chartHeight - (point.price - paddedMin) / paddedRange * chartHeight;
        const highY = padding.top + chartHeight - (point.high - paddedMin) / paddedRange * chartHeight;
        const lowY = padding.top + chartHeight - (point.low - paddedMin) / paddedRange * chartHeight;
        
        // Determine if bullish (green) or bearish (red)
        const isBullish = point.price >= point.open;
        const candleColor = isBullish ? '#22c55e' : '#ef4444';
        const wickColor = isBullish ? '#22c55e' : '#ef4444';
        
        // Draw wick (high-low line)
        ctx.beginPath();
        ctx.strokeStyle = wickColor;
        ctx.lineWidth = wickWidth;
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.stroke();
        
        // Draw candle body
        const bodyTop = Math.min(openY, closeY);
        const bodyHeight = Math.abs(closeY - openY) || 1;
        
        ctx.fillStyle = candleColor;
        ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
        
        // Draw candle border for better visibility
        ctx.strokeStyle = candleColor;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
      });
      
      // Draw pattern labels on candlesticks
      if (showPatterns && detectedPatterns.length > 0) {
        detectedPatterns.forEach(pattern => {
          const point = finalData[pattern.index];
          if (!point) return;
          
          const x = padding.left + pattern.index / (finalData.length - 1) * chartWidth;
          const highY = padding.top + chartHeight - (point.high - paddedMin) / paddedRange * chartHeight;
          const lowY = padding.top + chartHeight - (point.low - paddedMin) / paddedRange * chartHeight;
          
          // Position label above or below candle based on signal
          const labelY = pattern.signal === 'bullish' ? lowY + 18 : highY - 8;
          
          // Draw emoji marker
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(pattern.emoji, x, labelY);
          
          // Draw connecting line
          ctx.beginPath();
          ctx.strokeStyle = pattern.color;
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);
          if (pattern.signal === 'bullish') {
            ctx.moveTo(x, lowY + 2);
            ctx.lineTo(x, labelY - 10);
          } else {
            ctx.moveTo(x, highY - 2);
            ctx.lineTo(x, labelY + 4);
          }
          ctx.stroke();
          ctx.setLineDash([]);
        });
      }
    } else {
      // Draw price line - TradingView style (red/pink line)
      ctx.beginPath();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      finalData.forEach((point, i) => {
        const x = padding.left + i / (finalData.length - 1) * chartWidth;
        const y = padding.top + chartHeight - (point.price - paddedMin) / paddedRange * chartHeight;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // Draw area fill under line with gradient
      const gradient = ctx.createLinearGradient(0, padding.top, 0, dimensions.height - padding.bottom);
      gradient.addColorStop(0, 'rgba(239, 68, 68, 0.15)');
      gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.beginPath();
      finalData.forEach((point, i) => {
        const x = padding.left + i / (finalData.length - 1) * chartWidth;
        const y = padding.top + chartHeight - (point.price - paddedMin) / paddedRange * chartHeight;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.lineTo(padding.left + chartWidth, dimensions.height - padding.bottom);
      ctx.lineTo(padding.left, dimensions.height - padding.bottom);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Draw current price label (right side)
    const currentPrice = realtimePrice || finalData[finalData.length - 1]?.price;
    if (currentPrice) {
      const currentY = padding.top + chartHeight - (currentPrice - paddedMin) / paddedRange * chartHeight;

      // Current price box
      ctx.fillStyle = isRealtimeConnected ? '#ef4444' : '#3b82f6';
      ctx.fillRect(dimensions.width - padding.right + 5, currentY - 10, 60, 20);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(currentPrice.toFixed(5), dimensions.width - padding.right + 35, currentY + 4);
    }

    // Draw hover crosshair
    if (hoveredData) {
      ctx.beginPath();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = 'rgba(156, 163, 175, 0.5)';
      ctx.lineWidth = 1;

      // Vertical line
      ctx.moveTo(hoveredData.x, padding.top);
      ctx.lineTo(hoveredData.x, dimensions.height - padding.bottom);

      // Horizontal line
      ctx.moveTo(padding.left, hoveredData.y);
      ctx.lineTo(dimensions.width - padding.right, hoveredData.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // OHLC tooltip for candlesticks
      const tooltipWidth = chartType === 'candle' ? 130 : 80;
      const tooltipHeight = chartType === 'candle' ? 85 : 35;
      
      // Adjust tooltip position to stay within canvas
      let tooltipX = hoveredData.x + 10;
      let tooltipY = hoveredData.y - 20;
      
      if (tooltipX + tooltipWidth > dimensions.width - 20) {
        tooltipX = hoveredData.x - tooltipWidth - 10;
      }
      if (tooltipY < 10) {
        tooltipY = 10;
      }
      if (tooltipY + tooltipHeight > dimensions.height - 10) {
        tooltipY = dimensions.height - tooltipHeight - 10;
      }
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
      
      // Border based on candle color
      const isBullish = hoveredData.price >= hoveredData.open;
      ctx.strokeStyle = isBullish ? '#22c55e' : '#ef4444';
      ctx.lineWidth = 1;
      ctx.strokeRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
      
      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(hoveredData.time, tooltipX + 8, tooltipY + 14);
      
      if (chartType === 'candle') {
        // OHLC labels
        ctx.font = '9px sans-serif';
        ctx.fillStyle = '#9ca3af';
        ctx.fillText('O:', tooltipX + 8, tooltipY + 30);
        ctx.fillText('H:', tooltipX + 8, tooltipY + 44);
        ctx.fillText('L:', tooltipX + 8, tooltipY + 58);
        ctx.fillText('C:', tooltipX + 8, tooltipY + 72);
        
        // OHLC values
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = '#fff';
        ctx.fillText(hoveredData.open.toFixed(5), tooltipX + 22, tooltipY + 30);
        ctx.fillStyle = '#22c55e';
        ctx.fillText(hoveredData.high.toFixed(5), tooltipX + 22, tooltipY + 44);
        ctx.fillStyle = '#ef4444';
        ctx.fillText(hoveredData.low.toFixed(5), tooltipX + 22, tooltipY + 58);
        ctx.fillStyle = isBullish ? '#22c55e' : '#ef4444';
        ctx.fillText(hoveredData.price.toFixed(5), tooltipX + 22, tooltipY + 72);
      } else {
        ctx.font = 'bold 11px monospace';
        ctx.fillText(hoveredData.price.toFixed(5), tooltipX + 8, tooltipY + 28);
      }
    }
  }, [finalData, dimensions, realtimePrice, isRealtimeConnected, previousClose, hoveredData, enabledSessions, showSessions, chartType, showPatterns, detectedPatterns]);

  // Draw volume chart
  useEffect(() => {
    if (!showVolume) return;
    const canvas = volumeCanvasRef.current;
    if (!canvas || finalData.length === 0 || volumeDimensions.width === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = volumeDimensions.width * dpr;
    canvas.height = volumeDimensions.height * dpr;
    ctx.scale(dpr, dpr);
    const padding = {
      top: 5,
      right: 70,
      bottom: 5,
      left: 10
    };
    const chartWidth = volumeDimensions.width - padding.left - padding.right;
    const chartHeight = volumeDimensions.height - padding.top - padding.bottom;

    // Clear canvas
    ctx.clearRect(0, 0, volumeDimensions.width, volumeDimensions.height);

    // Calculate volume range
    const volumes = finalData.map(d => d.volume || 0);
    const maxVolume = Math.max(...volumes) || 1;

    // Draw volume bars
    const barWidth = Math.max(1, chartWidth / finalData.length - 1);
    finalData.forEach((point, i) => {
      const x = padding.left + i / (finalData.length - 1) * chartWidth - barWidth / 2;
      const barHeight = (point.volume || 0) / maxVolume * chartHeight;
      const y = padding.top + chartHeight - barHeight;

      // Color based on price change
      const prevPrice = i > 0 ? finalData[i - 1].price : point.open;
      const isUp = point.price >= prevPrice;
      ctx.fillStyle = isUp ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)';
      ctx.fillRect(x, y, barWidth, barHeight);

      // Highlight hovered bar
      if (hoveredData && hoveredData.index === i) {
        ctx.fillStyle = isUp ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)';
        ctx.fillRect(x, y, barWidth, barHeight);
      }
    });

    // Draw crosshair if hovering
    if (hoveredData) {
      ctx.beginPath();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = 'rgba(156, 163, 175, 0.5)';
      ctx.lineWidth = 1;
      ctx.moveTo(hoveredData.x, padding.top);
      ctx.lineTo(hoveredData.x, volumeDimensions.height - padding.bottom);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [finalData, volumeDimensions, showVolume, hoveredData]);

  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (finalData.length === 0 || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padding = {
      left: 10,
      right: 70
    };
    const chartWidth = dimensions.width - padding.left - padding.right;
    const dataIndex = Math.round((x - padding.left) / chartWidth * (finalData.length - 1));
    const clampedIndex = Math.max(0, Math.min(dataIndex, finalData.length - 1));
    const point = finalData[clampedIndex];
    if (point) {
      const prices = finalData.map(d => d.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const priceRange = maxPrice - minPrice || 1;
      const paddedMin = minPrice - priceRange * 0.05;
      const paddedMax = maxPrice + priceRange * 0.05;
      const paddedRange = paddedMax - paddedMin;
      const chartHeight = dimensions.height - 50;
      const pointX = padding.left + clampedIndex / (finalData.length - 1) * chartWidth;
      const pointY = 20 + chartHeight - (point.price - paddedMin) / paddedRange * chartHeight;

      // Get all sessions for this point for hover display
      const allSessionIds = new Set<SessionId>(['sydney', 'asia', 'london', 'ny']);
      const sessions = getSessionsForHour(point.utcHour, allSessionIds);
      setHoveredData({
        x: pointX,
        y: pointY,
        price: point.price,
        open: point.open,
        high: point.high,
        low: point.low,
        time: point.time,
        volume: point.volume,
        index: clampedIndex,
        sessions
      });
    }
  };
  const handleMouseLeave = () => {
    setHoveredData(null);
  };

  // Format volume for display
  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}K`;
    return vol.toFixed(0);
  };
  if (loading) {
    return <div className="h-[300px] w-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>;
  }
  if (error) {
    return <div className="h-[300px] w-full flex items-center justify-center text-destructive">
        <p className="text-sm">{error}</p>
      </div>;
  }
  if (chartData.length === 0) {
    return <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
        <p className="text-sm">No hay datos disponibles</p>
      </div>;
  }
  return <TooltipProvider>
    <div className="w-full relative bg-background">
      {/* TradingView-style period and session selector */}
      <div className="flex items-center justify-between px-2 py-2 border-b border-border/30 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          {/* Period buttons */}
          <div className="flex items-center gap-1">
            {periodButtons.map(btn => <Tooltip key={btn.value}>
                <TooltipTrigger asChild>
                  <button onClick={() => handlePeriodClick(btn.value)} className={cn("px-2 py-1 text-xs font-medium rounded transition-all", selectedPeriod === btn.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
                    {btn.label}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Últimos {btn.value === '1w' ? '7 días' : btn.label}
                </TooltipContent>
              </Tooltip>)}
          </div>
          
          {/* Time range indicator */}
          <div className="hidden md:flex items-center text-[10px] text-muted-foreground/70 bg-muted/30 px-2 py-1 rounded">
            {timeRangeDescription}
          </div>
          
          {/* Session toggle and filter buttons */}
          <div className="flex flex-col gap-1 border-l border-border/30 pl-3">
            <div className="flex items-center gap-1">
              {/* Toggle sessions visibility */}
              
              
              {/* Chart type toggle */}
              <div className="flex items-center border border-border/50 rounded overflow-hidden">
                <button 
                  onClick={() => setChartType('candle')} 
                  className={cn(
                    "px-2 py-1 text-[10px] font-medium transition-all",
                    chartType === 'candle' 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted/30 text-muted-foreground hover:bg-muted"
                  )}
                >
                  🕯️ Velas
                </button>
                <button 
                  onClick={() => setChartType('line')} 
                  className={cn(
                    "px-2 py-1 text-[10px] font-medium transition-all",
                    chartType === 'line' 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted/30 text-muted-foreground hover:bg-muted"
                  )}
                >
                  📈 Línea
                </button>
              </div>
              
              {/* Toggle volume visibility */}
              <button onClick={() => setShowVolumeChart(!showVolumeChart)} className={cn("px-2 py-1 text-[10px] font-medium rounded transition-all", showVolumeChart ? "bg-muted text-foreground" : "bg-muted/30 text-muted-foreground line-through")}>
                Vol
              </button>
              
              {/* Toggle patterns visibility - only show when candle chart */}
              {chartType === 'candle' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      onClick={() => setShowPatterns(!showPatterns)} 
                      className={cn(
                        "px-2 py-1 text-[10px] font-medium rounded transition-all flex items-center gap-1",
                        showPatterns 
                          ? "bg-amber-500/20 text-amber-400" 
                          : "bg-muted/30 text-muted-foreground line-through"
                      )}
                    >
                      🕯️ Patrones
                      {showPatterns && detectedPatterns.length > 0 && (
                        <span className="bg-amber-500 text-black text-[9px] px-1 rounded-full font-bold">
                          {detectedPatterns.length}
                        </span>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs max-w-[200px]">
                    <p className="font-medium mb-1">Patrones detectados:</p>
                    <ul className="text-[10px] space-y-0.5">
                      <li>🔨 Hammer - Reversión alcista</li>
                      <li>⚖️ Doji - Indecisión</li>
                      <li>🟢 Bull Engulfing - Alcista fuerte</li>
                      <li>🔴 Bear Engulfing - Bajista fuerte</li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
              )}
              
              {/* Divider */}
              <div className="w-px h-4 bg-border/30 mx-1" />
              
              {/* Session buttons */}
              {showSessions && MARKET_SESSIONS.map(session => <Tooltip key={session.id}>
                  <TooltipTrigger asChild>
                    <button onClick={() => toggleSession(session.id as SessionId)} className={cn("px-2 py-1 text-xs font-medium rounded transition-all flex items-center gap-1", enabledSessions.has(session.id as SessionId) ? `${session.bgColor} ${session.textColor}` : "text-muted-foreground/40 hover:text-muted-foreground bg-muted/20 line-through")}>
                      <span>{session.emoji}</span>
                      <span className="hidden sm:inline">{session.name}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[280px] p-3" style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.95)',
                  borderColor: session.borderColor
                }}>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{session.emoji}</span>
                        <span className="font-semibold" style={{
                        color: session.borderColor
                      }}>{session.name}</span>
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {String(session.start).padStart(2, '0')}:00-{String(session.end).padStart(2, '0')}:00 UTC
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{session.description}</p>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-muted-foreground">Mercados: </span>
                          <span className="text-foreground">{session.markets}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Volatilidad: </span>
                          <span className="font-medium" style={{
                          color: session.volatility === 'Alta' ? '#ef4444' : session.volatility === 'Baja' ? '#22c55e' : '#fbbf24'
                        }}>
                            {session.volatility}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Pares clave: </span>
                          <span className="text-foreground">{session.pairs}</span>
                        </div>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>)}
            </div>
            {/* UTC time reference - only show if sessions enabled */}
            {showSessions && <div className="flex items-center gap-2 text-[10px] text-muted-foreground/70 flex-wrap">
                {MARKET_SESSIONS.filter(s => enabledSessions.has(s.id as SessionId)).map(session => <span key={session.id} className="flex items-center gap-1">
                    <span style={{
                  color: session.borderColor
                }}>{session.emoji}</span>
                    <span>{String(session.start).padStart(2, '0')}:00-{String(session.end).padStart(2, '0')}:00 UTC</span>
                  </span>)}
              </div>}
          </div>
        </div>
        
        {/* Session and volume indicators when hovering */}
        <div className="flex items-center gap-3">
          {hoveredData?.sessions && hoveredData.sessions.length > 0 && <div className="flex items-center gap-1">
              {hoveredData.sessions.map(session => <span key={session.name} className="text-xs px-2 py-0.5 rounded-full" style={{
              backgroundColor: session.color,
              color: session.borderColor,
              border: `1px solid ${session.borderColor}`
            }}>
                  {session.emoji} {session.name}
                </span>)}
            </div>}
          
          {hoveredData?.volume && <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Vol:</span>
              <span className="font-mono font-medium text-foreground">{formatVolume(hoveredData.volume)}</span>
            </div>}
        </div>
        
        {/* Realtime indicator */}
        {isRealtimeConnected && realtimePrice && <div className="flex items-center gap-2 bg-red-500/20 px-2 py-1 rounded-full">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            <span className="text-xs text-red-400 font-medium">LIVE</span>
          </div>}
      </div>
      
      {/* Price chart */}
      <div ref={containerRef} className="h-[220px] w-full relative">
        <canvas ref={canvasRef} className="w-full h-full cursor-crosshair" style={{
          width: dimensions.width,
          height: dimensions.height
        }} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} />
      </div>
      
      {/* Volume chart */}
      {showVolumeChart && <div ref={volumeContainerRef} className="h-[60px] w-full relative border-t border-border/20">
          <div className="absolute top-1 left-2 text-[10px] text-muted-foreground z-10">Vol</div>
          <canvas ref={volumeCanvasRef} className="w-full h-full cursor-crosshair" style={{
          width: volumeDimensions.width,
          height: volumeDimensions.height
        }} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} />
        </div>}
      
      {/* Patterns Legend - Expandable */}
      {chartType === 'candle' && showPatterns && detectedPatterns.length > 0 && (
        <div className="border-t border-border/30 bg-muted/10">
          <details className="group">
            <summary className="px-3 py-2 cursor-pointer flex items-center justify-between hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-foreground">🕯️ Patrones Detectados</span>
                <span className="bg-amber-500/20 text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {detectedPatterns.length}
                </span>
              </div>
              <svg 
                className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-180" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-3 pb-3 space-y-2 animate-fade-in">
              {/* Filter buttons */}
              <div className="flex items-center gap-1 pb-2 border-b border-border/20">
                <span className="text-[10px] text-muted-foreground mr-2">Filtrar:</span>
                <button
                  onClick={() => setPatternFilter('all')}
                  className={cn(
                    "px-2 py-0.5 text-[10px] font-medium rounded transition-all",
                    patternFilter === 'all'
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  Todos ({detectedPatterns.length})
                </button>
                <button
                  onClick={() => setPatternFilter('bullish')}
                  className={cn(
                    "px-2 py-0.5 text-[10px] font-medium rounded transition-all flex items-center gap-1",
                    patternFilter === 'bullish'
                      ? "bg-green-500/20 text-green-400"
                      : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  ↑ Alcistas ({detectedPatterns.filter(p => p.signal === 'bullish').length})
                </button>
                <button
                  onClick={() => setPatternFilter('bearish')}
                  className={cn(
                    "px-2 py-0.5 text-[10px] font-medium rounded transition-all flex items-center gap-1",
                    patternFilter === 'bearish'
                      ? "bg-red-500/20 text-red-400"
                      : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  ↓ Bajistas ({detectedPatterns.filter(p => p.signal === 'bearish').length})
                </button>
                <button
                  onClick={() => setPatternFilter('neutral')}
                  className={cn(
                    "px-2 py-0.5 text-[10px] font-medium rounded transition-all flex items-center gap-1",
                    patternFilter === 'neutral'
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  → Neutrales ({detectedPatterns.filter(p => p.signal === 'neutral').length})
                </button>
              </div>
              
              {/* Filtered patterns */}
              {detectedPatterns
                .filter(p => patternFilter === 'all' || p.signal === patternFilter)
                .map((pattern, idx) => {
                const point = finalData[pattern.index];
                const patternDescriptions: Record<string, { title: string; desc: string; action: string }> = {
                  doji: {
                    title: 'Doji - Indecisión',
                    desc: 'El precio de apertura y cierre son prácticamente iguales, indicando indecisión en el mercado.',
                    action: 'Esperar confirmación de la próxima vela antes de actuar.'
                  },
                  hammer: {
                    title: 'Hammer - Reversión Alcista',
                    desc: 'Cuerpo pequeño en la parte superior con mecha inferior larga. Señal de posible reversión alcista.',
                    action: 'Considerar posición larga si aparece después de tendencia bajista.'
                  },
                  inverted_hammer: {
                    title: 'Martillo Invertido - Potencial Alcista',
                    desc: 'Cuerpo pequeño en la parte inferior con mecha superior larga. Posible cambio de tendencia.',
                    action: 'Buscar confirmación alcista en la siguiente vela.'
                  },
                  bullish_engulfing: {
                    title: 'Envolvente Alcista - Señal Fuerte',
                    desc: 'Una vela verde grande envuelve completamente la vela roja anterior. Fuerte señal de compra.',
                    action: 'Considerar entrada en largo con stop bajo el mínimo del patrón.'
                  },
                  bearish_engulfing: {
                    title: 'Envolvente Bajista - Señal Fuerte',
                    desc: 'Una vela roja grande envuelve completamente la vela verde anterior. Fuerte señal de venta.',
                    action: 'Considerar entrada en corto con stop sobre el máximo del patrón.'
                  },
                  morning_star: {
                    title: 'Estrella de la Mañana - Reversión Alcista',
                    desc: 'Patrón de tres velas que indica fin de tendencia bajista.',
                    action: 'Señal de compra con confirmación.'
                  },
                  evening_star: {
                    title: 'Estrella de la Tarde - Reversión Bajista',
                    desc: 'Patrón de tres velas que indica fin de tendencia alcista.',
                    action: 'Señal de venta con confirmación.'
                  }
                };
                
                const info = patternDescriptions[pattern.type] || { 
                  title: pattern.label, 
                  desc: 'Patrón de vela detectado.',
                  action: 'Analizar contexto del mercado.'
                };
                
                return (
                  <div 
                    key={`${pattern.type}-${idx}`}
                    className="flex items-start gap-3 p-2 rounded-lg bg-background/50 border border-border/30"
                  >
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0"
                      style={{ backgroundColor: `${pattern.color}20` }}
                    >
                      {pattern.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-foreground">{info.title}</span>
                        <span 
                          className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                          style={{ 
                            backgroundColor: `${pattern.color}20`,
                            color: pattern.color 
                          }}
                        >
                          {pattern.signal === 'bullish' ? '↑ ALCISTA' : pattern.signal === 'bearish' ? '↓ BAJISTA' : '→ NEUTRAL'}
                        </span>
                        {point && (
                          <span className="text-[10px] text-muted-foreground">
                            @ {point.time}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                        {info.desc}
                      </p>
                      <p className="text-[10px] mt-1 font-medium" style={{ color: pattern.color }}>
                        💡 {info.action}
                      </p>
                      {point && (
                        <div className="flex items-center gap-3 mt-1.5 text-[9px] text-muted-foreground">
                          <span>O: <span className="text-foreground font-mono">{point.open.toFixed(5)}</span></span>
                          <span>H: <span className="text-green-400 font-mono">{point.high.toFixed(5)}</span></span>
                          <span>L: <span className="text-red-400 font-mono">{point.low.toFixed(5)}</span></span>
                          <span>C: <span className="text-foreground font-mono">{point.price.toFixed(5)}</span></span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {/* Empty state when filter has no results */}
              {detectedPatterns.filter(p => patternFilter === 'all' || p.signal === patternFilter).length === 0 && (
                <div className="text-center py-4 text-muted-foreground text-xs">
                  No hay patrones {patternFilter === 'bullish' ? 'alcistas' : patternFilter === 'bearish' ? 'bajistas' : 'neutrales'} detectados
                </div>
              )}
            </div>
          </details>
        </div>
      )}
    </div>
    </TooltipProvider>;
}