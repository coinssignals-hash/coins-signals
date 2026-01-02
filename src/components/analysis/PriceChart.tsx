import { useMemo, useRef, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PriceChartProps {
  pair: string;
  timeframe: string;
  priceData?: Array<{ time: string; price: number; open: number; high: number; low: number }>;
  smaData?: {
    sma20: Array<{ datetime: string; sma: number }>;
    sma50: Array<{ datetime: string; sma: number }>;
  };
  loading?: boolean;
  error?: string | null;
  realtimePrice?: number | null;
  isRealtimeConnected?: boolean;
  previousClose?: number;
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
  previousClose
}: PriceChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoveredData, setHoveredData] = useState<{ x: number; y: number; price: number; time: string } | null>(null);

  // Calculate chart data
  const chartData = useMemo(() => {
    if (!priceData || priceData.length === 0) return [];
    
    return priceData.map((price) => {
      const timeLabel = price.time.split(' ')[1] || price.time.split('T')[1]?.substring(0, 5) || price.time;
      return {
        time: timeLabel,
        price: price.price,
        open: price.open,
        high: price.high,
        low: price.low,
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
        price: realtimePrice,
        open: realtimePrice,
        high: realtimePrice,
        low: realtimePrice,
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

  }, [finalData, dimensions, realtimePrice, isRealtimeConnected, previousClose, hoveredData]);

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
      
      setHoveredData({ x: pointX, y: pointY, price: point.price, time: point.time });
    }
  };

  const handleMouseLeave = () => {
    setHoveredData(null);
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
    <div ref={containerRef} className="h-[300px] w-full relative bg-background">
      {/* Realtime indicator */}
      {isRealtimeConnected && realtimePrice && (
        <div className="absolute top-2 right-20 z-10 flex items-center gap-2 bg-red-500/20 px-2 py-1 rounded-full">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          <span className="text-xs text-red-400 font-medium">LIVE</span>
        </div>
      )}
      
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        style={{ width: dimensions.width, height: dimensions.height }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}