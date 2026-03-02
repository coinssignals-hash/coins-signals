import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    sma20: Array<{ datetime: string; sma: number }>;
    sma50: Array<{ datetime: string; sma: number }>;
  };
  loading?: boolean;
  error?: string | null;
  realtimePrice?: number | null;
  isRealtimeConnected?: boolean;
  previousClose?: number;
  onPeriodChange?: (period: string) => void;
  showVolume?: boolean;
  patternAlertConfig?: any;
}

type ChartPeriod = '5m' | '15m' | '30m' | '1h' | '4h' | '1w';

const CHART_DAYS = 7;
const CHART_MINUTES = CHART_DAYS * 24 * 60;

const periodButtons: { value: ChartPeriod; label: string; minutes: number }[] = [
  { value: '5m', label: '5m', minutes: 5 },
  { value: '15m', label: '15m', minutes: 15 },
  { value: '30m', label: '30m', minutes: 30 },
  { value: '1h', label: '1h', minutes: 60 },
  { value: '4h', label: '4h', minutes: 240 },
  { value: '1w', label: '1S', minutes: 10080 },
];

export function PriceChart({
  pair,
  timeframe,
  priceData,
  loading,
  error,
  realtimePrice,
  isRealtimeConnected = false,
  previousClose,
  onPeriodChange,
}: PriceChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [selectedPeriod, setSelectedPeriod] = useState<ChartPeriod>('4h');
  const [hoveredData, setHoveredData] = useState<{
    x: number;
    y: number;
    price: number;
    open: number;
    high: number;
    low: number;
    time: string;
    volume?: number;
  } | null>(null);

  const handlePeriodClick = (period: ChartPeriod) => {
    setSelectedPeriod(period);
    onPeriodChange?.(period);
  };

  const getTimeRange = useMemo(() => {
    const now = new Date();
    const startTime = new Date(now.getTime() - CHART_MINUTES * 60 * 1000);
    return { startTime, endTime: now };
  }, []);

  const chartData = useMemo(() => {
    if (!priceData || priceData.length === 0) return [];
    const { startTime, endTime } = getTimeRange;
    const periodConfig = periodButtons.find((p) => p.value === selectedPeriod);
    const periodMinutes = periodConfig?.minutes || 240;

    const filtered = priceData.filter((item) => {
      const date = new Date(item.time);
      if (isNaN(date.getTime())) return false;
      return date >= startTime && date <= endTime;
    });

    const groups = new Map<number, typeof priceData>();
    const periodMs = periodMinutes * 60 * 1000;

    filtered.forEach((item) => {
      const date = new Date(item.time);
      if (isNaN(date.getTime())) return;
      const bucket = Math.floor(date.getTime() / periodMs) * periodMs;
      if (!groups.has(bucket)) groups.set(bucket, []);
      groups.get(bucket)!.push(item);
    });

    return Array.from(groups.keys())
      .sort((a, b) => a - b)
      .map((bucket) => {
        const items = groups.get(bucket)!;
        const bucketDate = new Date(bucket);
        let timeLabel = '';
        if (periodMinutes >= 1440) {
          timeLabel = bucketDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
        } else if (periodMinutes >= 60) {
          timeLabel = bucketDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
        } else {
          timeLabel = bucketDate.toLocaleTimeString('es-ES', { day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
        }
        return {
          time: timeLabel,
          price: items[items.length - 1].price,
          open: items[0].open,
          high: Math.max(...items.map((i) => i.high)),
          low: Math.min(...items.map((i) => i.low)),
          volume: items.reduce((s, i) => s + (i.volume || 0), 0),
        };
      });
  }, [priceData, getTimeRange, selectedPeriod]);

  const finalData = useMemo(() => {
    if (!realtimePrice || chartData.length === 0) return chartData;
    const now = new Date();
    return [...chartData, {
      time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
      price: realtimePrice,
      open: realtimePrice,
      high: realtimePrice,
      low: realtimePrice,
      volume: 0,
    }];
  }, [chartData, realtimePrice]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
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

    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    const minPrice = Math.min(...finalData.map((d) => d.low));
    const maxPrice = Math.max(...finalData.map((d) => d.high));
    const priceRange = maxPrice - minPrice || 1;
    const paddedMin = minPrice - priceRange * 0.05;
    const paddedMax = maxPrice + priceRange * 0.05;
    const paddedRange = paddedMax - paddedMin;

    // Previous close line
    const closePrice = previousClose || finalData[0]?.open;
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
    }

    // Y-axis labels
    ctx.fillStyle = 'rgba(156, 163, 175, 0.8)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const price = paddedMin + paddedRange / 5 * i;
      const y = padding.top + chartHeight - i / 5 * chartHeight;
      ctx.fillText(price.toFixed(4), dimensions.width - 5, y + 3);
    }

    // X-axis labels
    ctx.textAlign = 'center';
    const xStep = Math.max(1, Math.floor(finalData.length / 8));
    for (let i = 0; i < finalData.length; i += xStep) {
      const x = padding.left + i / (finalData.length - 1) * chartWidth;
      ctx.fillText(finalData[i].time, x, dimensions.height - 5);
    }

    // Candlesticks
    const candleWidth = Math.max(3, chartWidth / finalData.length * 0.7);

    finalData.forEach((point, i) => {
      const x = padding.left + i / (finalData.length - 1) * chartWidth;
      const openY = padding.top + chartHeight - (point.open - paddedMin) / paddedRange * chartHeight;
      const closeY = padding.top + chartHeight - (point.price - paddedMin) / paddedRange * chartHeight;
      const highY = padding.top + chartHeight - (point.high - paddedMin) / paddedRange * chartHeight;
      const lowY = padding.top + chartHeight - (point.low - paddedMin) / paddedRange * chartHeight;

      const isBullish = point.price >= point.open;
      const color = isBullish ? '#22c55e' : '#ef4444';

      // Wick
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Body
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.abs(closeY - openY) || 1;
      ctx.fillStyle = color;
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
    });

    // Current price label
    const currentPrice = realtimePrice || finalData[finalData.length - 1]?.price;
    if (currentPrice) {
      const currentY = padding.top + chartHeight - (currentPrice - paddedMin) / paddedRange * chartHeight;
      ctx.fillStyle = isRealtimeConnected ? '#ef4444' : '#3b82f6';
      ctx.fillRect(dimensions.width - padding.right + 5, currentY - 10, 60, 20);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(currentPrice.toFixed(5), dimensions.width - padding.right + 35, currentY + 4);
    }

    // Hover crosshair
    if (hoveredData) {
      ctx.beginPath();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = 'rgba(156, 163, 175, 0.5)';
      ctx.lineWidth = 1;
      ctx.moveTo(hoveredData.x, padding.top);
      ctx.lineTo(hoveredData.x, dimensions.height - padding.bottom);
      ctx.moveTo(padding.left, hoveredData.y);
      ctx.lineTo(dimensions.width - padding.right, hoveredData.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Tooltip
      const tooltipWidth = 130;
      const tooltipHeight = 85;
      let tooltipX = hoveredData.x + 10;
      let tooltipY = hoveredData.y - 20;
      if (tooltipX + tooltipWidth > dimensions.width - 20) tooltipX = hoveredData.x - tooltipWidth - 10;
      if (tooltipY < 10) tooltipY = 10;
      if (tooltipY + tooltipHeight > dimensions.height - 10) tooltipY = dimensions.height - tooltipHeight - 10;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);

      const isBullish = hoveredData.price >= hoveredData.open;
      ctx.strokeStyle = isBullish ? '#22c55e' : '#ef4444';
      ctx.lineWidth = 1;
      ctx.strokeRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);

      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(hoveredData.time, tooltipX + 8, tooltipY + 14);

      ctx.font = '9px sans-serif';
      ctx.fillStyle = '#9ca3af';
      ctx.fillText('O:', tooltipX + 8, tooltipY + 30);
      ctx.fillText('H:', tooltipX + 8, tooltipY + 44);
      ctx.fillText('L:', tooltipX + 8, tooltipY + 58);
      ctx.fillText('C:', tooltipX + 8, tooltipY + 72);

      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = '#fff';
      ctx.fillText(hoveredData.open.toFixed(5), tooltipX + 22, tooltipY + 30);
      ctx.fillStyle = '#22c55e';
      ctx.fillText(hoveredData.high.toFixed(5), tooltipX + 22, tooltipY + 44);
      ctx.fillStyle = '#ef4444';
      ctx.fillText(hoveredData.low.toFixed(5), tooltipX + 22, tooltipY + 58);
      ctx.fillStyle = isBullish ? '#22c55e' : '#ef4444';
      ctx.fillText(hoveredData.price.toFixed(5), tooltipX + 22, tooltipY + 72);
    }
  }, [finalData, dimensions, realtimePrice, isRealtimeConnected, previousClose, hoveredData]);

  // Mouse handlers
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (finalData.length === 0 || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padding = { left: 10, right: 70 };
    const chartWidth = dimensions.width - padding.left - padding.right;
    const dataIndex = Math.round((x - padding.left) / chartWidth * (finalData.length - 1));
    const clampedIndex = Math.max(0, Math.min(dataIndex, finalData.length - 1));
    const point = finalData[clampedIndex];
    if (point) {
      const allHighs = finalData.map((d) => d.high);
      const allLows = finalData.map((d) => d.low);
      const minPrice = Math.min(...allLows);
      const maxPrice = Math.max(...allHighs);
      const priceRange = maxPrice - minPrice || 1;
      const paddedMin = minPrice - priceRange * 0.05;
      const paddedMax = maxPrice + priceRange * 0.05;
      const paddedRange = paddedMax - paddedMin;
      const chartHeight = dimensions.height - 50;
      const pointX = padding.left + clampedIndex / (finalData.length - 1) * chartWidth;
      const pointY = 20 + chartHeight - (point.price - paddedMin) / paddedRange * chartHeight;
      setHoveredData({
        x: pointX, y: pointY,
        price: point.price, open: point.open,
        high: point.high, low: point.low,
        time: point.time, volume: point.volume,
      });
    }
  }, [finalData, dimensions]);

  const handleMouseLeave = () => setHoveredData(null);

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
      {/* Period selector + realtime indicator */}
      <div className="flex items-center justify-between px-2 py-2 border-b border-border/30">
        <div className="flex items-center gap-1">
          {periodButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => handlePeriodClick(btn.value)}
              className={cn(
                "px-2 py-1 text-xs font-medium rounded transition-all",
                selectedPeriod === btn.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {btn.label}
            </button>
          ))}
          <span className="hidden md:inline text-[10px] text-muted-foreground/70 bg-muted/30 px-2 py-1 rounded ml-2">
            7 días • velas de {periodButtons.find((p) => p.value === selectedPeriod)?.label}
          </span>
        </div>
        {isRealtimeConnected && realtimePrice && (
          <div className="flex items-center gap-2 bg-destructive/20 px-2 py-1 rounded-full">
            <span className="w-2 h-2 bg-destructive rounded-full animate-pulse"></span>
            <span className="text-xs text-destructive font-medium">LIVE</span>
          </div>
        )}
      </div>

      {/* Price chart */}
      <div ref={containerRef} className="h-[280px] w-full relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          style={{ width: dimensions.width, height: dimensions.height }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
      </div>
    </div>
  );
}
