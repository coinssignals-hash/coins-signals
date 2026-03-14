import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { getSymbolVisual } from './symbolVisuals';

interface CurrencyIconProps {
  code: string;
  isAnimating: boolean;
  delay?: number;
  position: 'base' | 'quote';
}

export const CurrencyIcon = ({ code, isAnimating, delay = 0, position }: CurrencyIconProps) => {
  const visual = getSymbolVisual(code);
  const [show, setShow] = useState(!isAnimating);

  useEffect(() => {
    if (isAnimating) {
      setShow(false);
      const timer = setTimeout(() => setShow(true), delay);
      return () => clearTimeout(timer);
    } else {
      setShow(true);
    }
  }, [isAnimating, delay]);

  return (
    <div
      className={cn(
        "absolute w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all",
        visual.bgColor,
        position === 'base' ? "bottom-0 left-0 z-10" : "top-0 right-0",
        show ? "opacity-100" : "opacity-0",
        isAnimating && show && position === 'base' && "animate-scale-bounce",
        isAnimating && show && position === 'quote' && "animate-flip-in"
      )}
      style={{
        borderWidth: '3px',
        borderColor: 'hsl(var(--background))',
        animationDelay: `${delay}ms`,
        perspective: '1000px'
      }}>
      <span className={cn(
        "text-2xl transition-all duration-300",
        visual.textColor || "text-white",
        isAnimating && show && "animate-pop-in"
      )} style={{ animationDelay: `${delay + 100}ms` }}>
        {visual.flag || visual.symbol}
      </span>
    </div>
  );
};
