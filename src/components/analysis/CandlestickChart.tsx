import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface CandlestickChartProps {
  data: CandleData[];
  resistance: number;
  support: number;
  loading?: boolean;
  realtimePrice?: number | null;
  isRealtimeConnected?: boolean;
}

interface TooltipData {
  x: number;
  y: number;
  candle: CandleData;
  isUp: boolean;
}

interface CandlePosition {
  x: number;
  width: number;
  candle: CandleData;
  isUp: boolean;
}

export function CandlestickChart({ 
  data, 
  resistance, 
  support, 
  loading,
  realtimePrice,
  isRealtimeConnected = false
}: CandlestickChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const candlePositionsRef = useRef<CandlePosition[]>([]);
  const paddingRef = useRef({ top: 20, right: 80, bottom: 30, left: 50 });

  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !data.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = paddingRef.current;
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Calculate price range
    const allPrices = data.flatMap(d => [d.high, d.low]);
    if (realtimePrice) allPrices.push(realtimePrice);
    allPrices.push(resistance, support);
    const minPrice = Math.min(...allPrices) * 0.9995;
    const maxPrice = Math.max(...allPrices) * 1.0005;
    const priceRange = maxPrice - minPrice;

    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Helper functions
    const priceToY = (price: number) => {
      return padding.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
    };

    const candleWidth = chartWidth / data.length;
    const indexToX = (index: number) => {
      return padding.left + index * candleWidth + candleWidth / 2;
    };

    // Store candle positions for tooltip detection
    const positions: CandlePosition[] = [];

    // Draw grid lines
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartHeight / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Price labels
      const price = maxPrice - (priceRange / gridLines) * i;
      ctx.fillStyle = '#6b7280';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(price.toFixed(4), 5, y + 3);
    }

    // Draw resistance line (GREEN dotted at top)
    const resistanceY = priceToY(resistance);
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(padding.left, resistanceY);
    ctx.lineTo(width - padding.right, resistanceY);
    ctx.stroke();
    
    // Resistance label
    ctx.setLineDash([]);
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Resistencia', width - padding.right + 5, resistanceY + 4);

    // Draw support line (RED dotted at bottom)
    const supportY = priceToY(support);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(padding.left, supportY);
    ctx.lineTo(width - padding.right, supportY);
    ctx.stroke();
    
    // Support label
    ctx.setLineDash([]);
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('Soporte', width - padding.right + 5, supportY + 4);

    // Draw candlesticks
    const bodyWidth = Math.max(4, candleWidth * 0.6);
    const wickWidth = 1;

    data.forEach((candle, index) => {
      const x = indexToX(index);
      const isUp = candle.close >= candle.open;
      const color = isUp ? '#22c55e' : '#ef4444';
      
      const openY = priceToY(candle.open);
      const closeY = priceToY(candle.close);
      const highY = priceToY(candle.high);
      const lowY = priceToY(candle.low);

      // Store position for tooltip
      positions.push({
        x: x - bodyWidth / 2,
        width: bodyWidth,
        candle,
        isUp
      });

      // Draw wick (thin line from high to low)
      ctx.strokeStyle = color;
      ctx.lineWidth = wickWidth;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Draw body (rectangle from open to close)
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(1, Math.abs(closeY - openY));
      
      ctx.fillStyle = color;
      ctx.fillRect(x - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight);
    });

    candlePositionsRef.current = positions;

    // Draw time labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    const labelInterval = Math.max(1, Math.floor(data.length / 8));
    data.forEach((candle, index) => {
      if (index % labelInterval === 0) {
        const x = indexToX(index);
        const time = candle.time.split(' ')[1]?.substring(0, 5) || candle.time.substring(11, 16);
        ctx.fillText(time, x, height - 8);
      }
    });

    // Draw realtime price line if available
    if (realtimePrice) {
      const realtimeY = priceToY(realtimePrice);
      
      ctx.strokeStyle = isRealtimeConnected ? '#3b82f6' : '#6366f1';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      ctx.moveTo(padding.left, realtimeY);
      ctx.lineTo(width - padding.right, realtimeY);
      ctx.stroke();

      // Price badge
      ctx.setLineDash([]);
      ctx.fillStyle = isRealtimeConnected ? '#3b82f6' : '#6366f1';
      const badgeWidth = 65;
      const badgeHeight = 18;
      ctx.fillRect(width - padding.right + 2, realtimeY - badgeHeight / 2, badgeWidth, badgeHeight);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'left';
      const priceText = realtimePrice.toFixed(4);
      ctx.fillText(isRealtimeConnected ? `● ${priceText}` : priceText, width - padding.right + 6, realtimeY + 3);
    }
  }, [data, resistance, support, realtimePrice, isRealtimeConnected]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !candlePositionsRef.current.length) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find if mouse is over any candle
    const hoveredCandle = candlePositionsRef.current.find(pos => 
      x >= pos.x && x <= pos.x + pos.width
    );

    if (hoveredCandle) {
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        candle: hoveredCandle.candle,
        isUp: hoveredCandle.isUp
      });
    } else {
      setTooltip(null);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  if (loading) {
    return (
      <div className="bg-[#0a0a0a] border border-green-900/50 rounded-lg p-4 animate-pulse">
        <div className="h-72 bg-green-900/20 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0a] border border-green-900/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold text-sm">Resistencia y Soporte día Anterior</h3>
        
        {isRealtimeConnected && realtimePrice && (
          <div className="flex items-center gap-2 bg-blue-500/20 px-2 py-1 rounded-full">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            <span className="text-xs text-blue-400 font-medium">LIVE: {realtimePrice.toFixed(5)}</span>
          </div>
        )}
      </div>
      
      <div ref={containerRef} className="h-72 relative">
        <canvas 
          ref={canvasRef} 
          className="w-full h-full cursor-crosshair" 
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
        
        {/* OHLC Tooltip */}
        {tooltip && (
          <div 
            className="absolute z-50 pointer-events-none"
            style={{
              left: Math.min(tooltip.x + 10, (containerRef.current?.clientWidth || 300) - 160),
              top: Math.max(tooltip.y - 100, 10)
            }}
          >
            <div className="bg-[#1a1a2e] border border-gray-700 rounded-lg p-3 shadow-xl min-w-[140px]">
              <div className="text-xs text-gray-400 mb-2 font-medium">
                {tooltip.candle.time.split(' ')[1]?.substring(0, 5) || tooltip.candle.time.substring(11, 16)}
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Open:</span>
                  <span className="text-white font-mono">{tooltip.candle.open.toFixed(5)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">High:</span>
                  <span className="text-green-400 font-mono">{tooltip.candle.high.toFixed(5)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Low:</span>
                  <span className="text-red-400 font-mono">{tooltip.candle.low.toFixed(5)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Close:</span>
                  <span className={cn("font-mono font-semibold", tooltip.isUp ? "text-green-400" : "text-red-400")}>
                    {tooltip.candle.close.toFixed(5)}
                  </span>
                </div>
              </div>
              <div className={cn(
                "mt-2 pt-2 border-t border-gray-700 text-xs font-medium text-center",
                tooltip.isUp ? "text-green-400" : "text-red-400"
              )}>
                {tooltip.isUp ? "▲ Alcista" : "▼ Bajista"}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-3 text-xs flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-8 h-0.5 border-t-2 border-dashed border-green-500"></div>
            <span className="text-green-400">Resistencia {resistance.toFixed(4)}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-8 h-0.5 border-t-2 border-dashed border-red-500"></div>
            <span className="text-red-400">Soporte {support.toFixed(4)}</span>
          </div>
        </div>
        {realtimePrice && (
          <div className="flex items-center gap-1">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isRealtimeConnected ? "bg-blue-500 animate-pulse" : "bg-indigo-500"
            )}></div>
            <span className={isRealtimeConnected ? "text-blue-400" : "text-indigo-400"}>
              Precio Actual {realtimePrice.toFixed(5)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
