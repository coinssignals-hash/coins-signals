import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface AnimatedPriceProps {
  value: number;
  decimals?: number;
  isAnimating: boolean;
  flash: 'up' | 'down' | null;
}

export const AnimatedPrice = ({ value, decimals = 5, isAnimating, flash }: AnimatedPriceProps) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isRolling, setIsRolling] = useState(false);

  useEffect(() => {
    if (isAnimating) {
      setIsRolling(true);
      const timer = setTimeout(() => {
        setDisplayValue(value);
        setIsRolling(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setDisplayValue(value);
    }
  }, [value, isAnimating]);

  const priceString = displayValue.toFixed(decimals);

  return (
    <span className={cn(
      "text-2xl sm:text-3xl font-bold tabular-nums transition-colors duration-300 inline-flex overflow-hidden",
      flash === 'up' && "text-green-400",
      flash === 'down' && "text-red-400",
      !flash && "text-foreground"
    )}>
      {priceString.split('').map((char, i) => (
        <span
          key={`${i}-${char}`}
          className={cn(
            "inline-block transition-transform",
            isRolling && "animate-number-roll"
          )}
          style={{ animationDelay: `${i * 20}ms` }}>
          {char}
        </span>
      ))}
    </span>
  );
};
