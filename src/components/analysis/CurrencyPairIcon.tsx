import { cn } from '@/lib/utils';
import { CurrencyIcon } from './CurrencyIcon';

interface CurrencyPairIconProps {
  base: string;
  quote: string;
  animate?: boolean;
}

export const CurrencyPairIcon = ({ base, quote, animate }: CurrencyPairIconProps) => {
  return (
    <div className={cn(
      "relative w-20 h-20 transition-all duration-500",
      animate && "animate-scale-in"
    )}>
      {animate && (
        <div className="absolute inset-0 rounded-full bg-green-500/20 blur-xl animate-pulse" />
      )}
      <CurrencyIcon code={quote} isAnimating={!!animate} delay={100} position="quote" />
      <CurrencyIcon code={base} isAnimating={!!animate} delay={200} position="base" />
    </div>
  );
};
