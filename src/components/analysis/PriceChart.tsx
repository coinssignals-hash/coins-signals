import { useMemo, useRef, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
type ChartPeriod = '5m' | '15m' | '30m' | '1h' | '4h' | '1w';
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
} // 1 week = 7 * 24 * 60
];

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
  showVolume = true
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

  // Get time range for selected period
  const getTimeRange = useMemo(() => {
    const now = new Date();
    const periodConfig = periodButtons.find(p => p.value === selectedPeriod);
    const minutes = periodConfig?.minutes || 240;
    const startTime = new Date(now.getTime() - minutes * 60 * 1000);
    return {
      startTime,
      endTime: now
    };
  }, [selectedPeriod]);

  // Calculate chart data with UTC hours for sessions, filtered by period
  const chartData = useMemo(() => {
    if (!priceData || priceData.length === 0) return [];
    const {
      startTime,
      endTime
    } = getTimeRange;
    return priceData.map((price, index) => {
      // Extract time from ISO string or other formats
      let timeLabel = '';
      let utcHour = 0;
      let timestamp: Date | null = null;
      try {
        const date = new Date(price.time);
        if (!isNaN(date.getTime())) {
          timestamp = date;
          // Format based on period - show date for longer periods
          if (selectedPeriod === '1w') {
            timeLabel = date.toLocaleDateString('es-ES', {
              weekday: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            });
          } else {
            timeLabel = date.toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            });
          }
          utcHour = date.getUTCHours();
        } else {
          // Fallback: try to extract time from string
          timeLabel = price.time.split(' ')[1] || price.time.split('T')[1]?.substring(0, 5) || price.time;
          // Try to parse hour from timeLabel
          const hourMatch = timeLabel.match(/^(\d{1,2}):/);
          if (hourMatch) utcHour = parseInt(hourMatch[1]);
        }
      } catch {
        timeLabel = price.time.split(' ')[1] || price.time.split('T')[1]?.substring(0, 5) || price.time;
      }

      // Generate synthetic volume if not provided (based on price movement)
      const syntheticVolume = price.volume || Math.abs(price.high - price.low) * 1000000 * (0.5 + Math.random());
      return {
        time: timeLabel,
        timestamp,
        utcHour,
        price: price.price,
        open: price.open,
        high: price.high,
        low: price.low,
        volume: syntheticVolume
      };
    }).filter(item => {
      // Filter by time range if timestamp is available
      if (item.timestamp) {
        return item.timestamp >= startTime && item.timestamp <= endTime;
      }
      return true; // Keep items without valid timestamp
    });
  }, [priceData, getTimeRange, selectedPeriod]);

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

  // Format time range description
  const timeRangeDescription = useMemo(() => {
    const {
      startTime,
      endTime
    } = getTimeRange;
    const formatDate = (date: Date) => date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${formatDate(startTime)} → ${formatDate(endTime)}`;
  }, [getTimeRange]);

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
  }, [finalData, dimensions, realtimePrice, isRealtimeConnected, previousClose, hoveredData, enabledSessions, showSessions, chartType]);

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
    </div>
    </TooltipProvider>;
}