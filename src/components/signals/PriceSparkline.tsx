import { useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface PriceSparklineProps {
  prices: number[];
  entryPrice: number;
  className?: string;
}

export function PriceSparkline({ prices, entryPrice, className }: PriceSparklineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const { min, max, isUp, change } = useMemo(() => {
    if (prices.length === 0) {
      return { min: entryPrice, max: entryPrice, isUp: true, change: 0 };
    }
    const allPrices = [entryPrice, ...prices];
    const minVal = Math.min(...allPrices);
    const maxVal = Math.max(...allPrices);
    const lastPrice = prices[prices.length - 1];
    return {
      min: minVal,
      max: maxVal,
      isUp: lastPrice >= entryPrice,
      change: ((lastPrice - entryPrice) / entryPrice) * 100
    };
  }, [prices, entryPrice]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || prices.length < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = 2;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate price range with padding
    const range = max - min || 1;
    const paddedMin = min - range * 0.1;
    const paddedMax = max + range * 0.1;
    const paddedRange = paddedMax - paddedMin;

    // Normalize price to y coordinate
    const priceToY = (price: number) => {
      return height - padding - ((price - paddedMin) / paddedRange) * (height - padding * 2);
    };

    // Draw entry price line
    const entryY = priceToY(entryPrice);
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
    ctx.setLineDash([2, 2]);
    ctx.moveTo(0, entryY);
    ctx.lineTo(width, entryY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    if (isUp) {
      gradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
      gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
    } else {
      gradient.addColorStop(0, 'rgba(244, 63, 94, 0.4)');
      gradient.addColorStop(1, 'rgba(244, 63, 94, 0)');
    }

    // Draw area fill
    ctx.beginPath();
    const stepX = (width - padding * 2) / (prices.length - 1);
    
    ctx.moveTo(padding, height);
    prices.forEach((price, i) => {
      const x = padding + i * stepX;
      const y = priceToY(price);
      if (i === 0) {
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.lineTo(width - padding, height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = isUp ? '#10b981' : '#f43f5e';
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    prices.forEach((price, i) => {
      const x = padding + i * stepX;
      const y = priceToY(price);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw last point with glow
    if (prices.length > 0) {
      const lastX = width - padding;
      const lastY = priceToY(prices[prices.length - 1]);
      
      // Glow effect
      ctx.beginPath();
      ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
      ctx.fillStyle = isUp ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)';
      ctx.fill();
      
      // Point
      ctx.beginPath();
      ctx.arc(lastX, lastY, 2, 0, Math.PI * 2);
      ctx.fillStyle = isUp ? '#10b981' : '#f43f5e';
      ctx.fill();
    }
  }, [prices, entryPrice, min, max, isUp]);

  if (prices.length < 2) {
    return (
      <div className={cn("flex items-center justify-center text-slate-500 text-xs", className)}>
        <span className="animate-pulse">Esperando datos...</span>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
        style={{ display: 'block' }}
      />
      {/* Change badge */}
      <div className={cn(
        "absolute top-1 right-1 text-[10px] font-bold px-1.5 py-0.5 rounded",
        isUp ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
      )}>
        {change >= 0 ? "+" : ""}{change.toFixed(3)}%
      </div>
    </div>
  );
}