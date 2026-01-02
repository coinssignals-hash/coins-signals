import { useMemo, useRef, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ChartPeriod = '1D' | '1W' | '1M' | '1Y';

interface PriceChartProps {
  pair: string;
  timeframe: string;
  priceData?: Array<{ time: string; price: number; open: number; high: number; low: number; volume?: number }>;
  smaData?: {
    sma20: Array<{ datetime: string; sma: number }>;
    sma50: Array<{ datetime: string; sma: number }>;
  };
  loading?: boolean;
  error?: string | null;
  realtimePrice?: number | null;
  isRealtimeConnected?: boolean;
  previousClose?: number;
  onPeriodChange?: (period: ChartPeriod) => void;
  showVolume?: boolean;
}

// Market session times in UTC
const MARKET_SESSIONS = [
  { id: 'asia', name: 'Asia', start: 0, end: 9, color: 'rgba(251, 191, 36, 0.12)', borderColor: 'rgba(251, 191, 36, 0.6)', bgColor: 'bg-amber-500/20', textColor: 'text-amber-400', emoji: '🌏' },
  { id: 'london', name: 'Londres', start: 8, end: 17, color: 'rgba(59, 130, 246, 0.12)', borderColor: 'rgba(59, 130, 246, 0.6)', bgColor: 'bg-blue-500/20', textColor: 'text-blue-400', emoji: '🇬🇧' },
  { id: 'ny', name: 'Nueva York', start: 13, end: 22, color: 'rgba(34, 197, 94, 0.12)', borderColor: 'rgba(34, 197, 94, 0.6)', bgColor: 'bg-green-500/20', textColor: 'text-green-400', emoji: '🇺🇸' },
];

type SessionFilter = 'all' | 'asia' | 'london' | 'ny';

const periodButtons: { value: ChartPeriod; label: string }[] = [
  { value: '1D', label: '1D' },
  { value: '1W', label: '1W' },
  { value: '1M', label: '1M' },
  { value: '1Y', label: '1Y' },
];

// Get session for a given UTC hour, optionally filtered
function getSessionsForHour(utcHour: number, filter: SessionFilter = 'all') {
  return MARKET_SESSIONS.filter(session => {
    // Apply filter
    if (filter !== 'all' && session.id !== filter) return false;
    
    if (session.start < session.end) {
      return utcHour >= session.start && utcHour < session.end;
    }
    // Handle sessions that cross midnight
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
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [volumeDimensions, setVolumeDimensions] = useState({ width: 0, height: 0 });
  const [hoveredData, setHoveredData] = useState<{ x: number; y: number; price: number; time: string; volume?: number; index: number; sessions?: typeof MARKET_SESSIONS } | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<ChartPeriod>('1D');
  const [selectedSession, setSelectedSession] = useState<SessionFilter>('all');

  const handlePeriodClick = (period: ChartPeriod) => {
    setSelectedPeriod(period);
    onPeriodChange?.(period);
  };

  const handleSessionClick = (session: SessionFilter) => {
    setSelectedSession(session);
  };

  // Calculate chart data with UTC hours for sessions
  const chartData = useMemo(() => {
    if (!priceData || priceData.length === 0) return [];
    
    return priceData.map((price, index) => {
      // Extract time from ISO string or other formats
      let timeLabel = '';
      let utcHour = 0;
      try {
        const date = new Date(price.time);
        if (!isNaN(date.getTime())) {
          // Format as HH:MM in local timezone
          timeLabel = date.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          });
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
        utcHour,
        price: price.price,
        open: price.open,
        high: price.high,
        low: price.low,
        volume: syntheticVolume,
      };
    });
  }, [priceData]);

  // Add realtime price
  const finalData = useMemo(() => {
    if (!realtimePrice || chartData.length === 0) return chartData;
    const now = new Date();
    return [
      ...chartData,
      {
        time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
        utcHour: now.getUTCHours(),
        price: realtimePrice,
        open: realtimePrice,
        high: realtimePrice,
        low: realtimePrice,
        volume: chartData[chartData.length - 1]?.volume || 0,
      }
    ];
  }, [chartData, realtimePrice]);

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

    const padding = { top: 20, right: 70, bottom: 30, left: 10 };
    const chartWidth = dimensions.width - padding.left - padding.right;
    const chartHeight = dimensions.height - padding.top - padding.bottom;

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Calculate price range
    const prices = finalData.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;
    const paddedMin = minPrice - priceRange * 0.05;
    const paddedMax = maxPrice + priceRange * 0.05;
    const paddedRange = paddedMax - paddedMin;

    // Draw session backgrounds
    let prevSession: string | null = null;
    finalData.forEach((point, i) => {
      const sessions = getSessionsForHour(point.utcHour, selectedSession);
      const x = padding.left + (i / (finalData.length - 1)) * chartWidth;
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

    // Calculate close price for comparison
    const closePrice = previousClose || finalData[0]?.open || finalData[0]?.price;

    // Draw previous close line (dashed red)
    if (closePrice) {
      const closeY = padding.top + chartHeight - ((closePrice - paddedMin) / paddedRange) * chartHeight;
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
      const price = paddedMin + (paddedRange / ySteps) * i;
      const y = padding.top + chartHeight - (i / ySteps) * chartHeight;
      ctx.fillText(price.toFixed(4), dimensions.width - 5, y + 3);
    }

    // Draw X-axis labels
    ctx.textAlign = 'center';
    const xLabelCount = Math.min(8, finalData.length);
    const xStep = Math.floor(finalData.length / xLabelCount);
    for (let i = 0; i < finalData.length; i += xStep) {
      const x = padding.left + (i / (finalData.length - 1)) * chartWidth;
      ctx.fillText(finalData[i].time, x, dimensions.height - 5);
    }

    // Draw price line - TradingView style (red/pink line)
    ctx.beginPath();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    finalData.forEach((point, i) => {
      const x = padding.left + (i / (finalData.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((point.price - paddedMin) / paddedRange) * chartHeight;
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
      const x = padding.left + (i / (finalData.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((point.price - paddedMin) / paddedRange) * chartHeight;
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

    // Draw current price label (right side)
    const currentPrice = realtimePrice || finalData[finalData.length - 1]?.price;
    if (currentPrice) {
      const currentY = padding.top + chartHeight - ((currentPrice - paddedMin) / paddedRange) * chartHeight;
      
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

      // Price tooltip
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(hoveredData.x + 10, hoveredData.y - 20, 80, 35);
      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(hoveredData.time, hoveredData.x + 15, hoveredData.y - 5);
      ctx.font = 'bold 11px monospace';
      ctx.fillText(hoveredData.price.toFixed(5), hoveredData.x + 15, hoveredData.y + 10);
    }

  }, [finalData, dimensions, realtimePrice, isRealtimeConnected, previousClose, hoveredData, selectedSession]);

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

    const padding = { top: 5, right: 70, bottom: 5, left: 10 };
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
      const x = padding.left + (i / (finalData.length - 1)) * chartWidth - barWidth / 2;
      const barHeight = ((point.volume || 0) / maxVolume) * chartHeight;
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
    const padding = { left: 10, right: 70 };
    const chartWidth = dimensions.width - padding.left - padding.right;
    
    const dataIndex = Math.round(((x - padding.left) / chartWidth) * (finalData.length - 1));
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
      const pointX = padding.left + (clampedIndex / (finalData.length - 1)) * chartWidth;
      const pointY = 20 + chartHeight - ((point.price - paddedMin) / paddedRange) * chartHeight;
      
      // Get sessions for this point (always get all for hover display)
      const sessions = getSessionsForHour(point.utcHour, 'all');
      
      setHoveredData({ x: pointX, y: pointY, price: point.price, time: point.time, volume: point.volume, index: clampedIndex, sessions });
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
    return (
      <div className="h-[300px] w-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center text-destructive">
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
        <p className="text-sm">No hay datos disponibles</p>
      </div>
    );
  }

  return (
    <div className="w-full relative bg-background">
      {/* TradingView-style period and session selector */}
      <div className="flex items-center justify-between px-2 py-2 border-b border-border/30 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          {/* Period buttons */}
          <div className="flex items-center gap-1">
            {periodButtons.map((btn) => (
              <button
                key={btn.value}
                onClick={() => handlePeriodClick(btn.value)}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded transition-all",
                  selectedPeriod === btn.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {btn.label}
              </button>
            ))}
          </div>
          
          {/* Session filter buttons */}
          <div className="flex items-center gap-1 border-l border-border/30 pl-3">
            <button
              onClick={() => handleSessionClick('all')}
              className={cn(
                "px-2 py-1 text-xs font-medium rounded transition-all",
                selectedSession === 'all'
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              Todas
            </button>
            {MARKET_SESSIONS.map((session) => (
              <button
                key={session.id}
                onClick={() => handleSessionClick(session.id as SessionFilter)}
                className={cn(
                  "px-2 py-1 text-xs font-medium rounded transition-all flex items-center gap-1",
                  selectedSession === session.id
                    ? `${session.bgColor} ${session.textColor}`
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <span>{session.emoji}</span>
                <span className="hidden sm:inline">{session.name}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Session and volume indicators when hovering */}
        <div className="flex items-center gap-3">
          {hoveredData?.sessions && hoveredData.sessions.length > 0 && (
            <div className="flex items-center gap-1">
              {hoveredData.sessions.map(session => (
                <span 
                  key={session.name}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: session.color, color: session.borderColor, border: `1px solid ${session.borderColor}` }}
                >
                  {session.emoji} {session.name}
                </span>
              ))}
            </div>
          )}
          
          {hoveredData?.volume && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Vol:</span>
              <span className="font-mono font-medium text-foreground">{formatVolume(hoveredData.volume)}</span>
            </div>
          )}
        </div>
        
        {/* Realtime indicator */}
        {isRealtimeConnected && realtimePrice && (
          <div className="flex items-center gap-2 bg-red-500/20 px-2 py-1 rounded-full">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            <span className="text-xs text-red-400 font-medium">LIVE</span>
          </div>
        )}
      </div>
      
      {/* Price chart */}
      <div ref={containerRef} className="h-[220px] w-full relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          style={{ width: dimensions.width, height: dimensions.height }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
      </div>
      
      {/* Volume chart */}
      {showVolume && (
        <div ref={volumeContainerRef} className="h-[60px] w-full relative border-t border-border/20">
          <div className="absolute top-1 left-2 text-[10px] text-muted-foreground z-10">Vol</div>
          <canvas
            ref={volumeCanvasRef}
            className="w-full h-full cursor-crosshair"
            style={{ width: volumeDimensions.width, height: volumeDimensions.height }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          />
        </div>
      )}
    </div>
  );
}