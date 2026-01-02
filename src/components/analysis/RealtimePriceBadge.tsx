import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff, TrendingUp, TrendingDown } from 'lucide-react';

interface RealtimePriceBadgeProps {
  price: number | null;
  previousPrice?: number;
  isConnected: boolean;
  className?: string;
}

export function RealtimePriceBadge({ 
  price, 
  previousPrice, 
  isConnected, 
  className 
}: RealtimePriceBadgeProps) {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const [lastPrice, setLastPrice] = useState<number | null>(null);

  useEffect(() => {
    if (price !== null && lastPrice !== null && price !== lastPrice) {
      const direction = price > lastPrice ? 'up' : 'down';
      setFlash(direction);
      const timer = setTimeout(() => setFlash(null), 500);
      return () => clearTimeout(timer);
    }
    setLastPrice(price);
  }, [price, lastPrice]);

  const change = price && previousPrice ? price - previousPrice : 0;
  const changePercent = price && previousPrice ? ((change / previousPrice) * 100) : 0;
  const isPositive = change >= 0;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Connection status indicator */}
      <div className={cn(
        "flex items-center gap-1 px-2 py-1 rounded-full text-xs",
        isConnected 
          ? "bg-green-500/20 text-green-400" 
          : "bg-red-500/20 text-red-400"
      )}>
        {isConnected ? (
          <>
            <Wifi className="w-3 h-3" />
            <span className="hidden sm:inline">LIVE</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3" />
            <span className="hidden sm:inline">OFFLINE</span>
          </>
        )}
      </div>

      {/* Price with flash animation */}
      {price !== null && (
        <div className={cn(
          "flex items-center gap-2 transition-all duration-300",
          flash === 'up' && "text-green-400 animate-pulse",
          flash === 'down' && "text-red-400 animate-pulse"
        )}>
          <span className={cn(
            "font-mono text-lg font-bold",
            flash === 'up' && "text-green-400",
            flash === 'down' && "text-red-400",
            !flash && "text-white"
          )}>
            {price.toFixed(5)}
          </span>
          
          {change !== 0 && (
            <div className={cn(
              "flex items-center gap-1 text-xs",
              isPositive ? "text-green-400" : "text-red-400"
            )}>
              {isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{isPositive ? '+' : ''}{change.toFixed(5)}</span>
              <span>({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
