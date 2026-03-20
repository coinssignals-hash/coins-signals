import { cn } from '@/lib/utils';
import { forwardRef, ReactNode } from 'react';

interface GlowCardProps {
  children: ReactNode;
  /** HSL color values without hsl() wrapper, e.g. "210 70% 55%" */
  color?: string;
  className?: string;
}

export const GlowCard = forwardRef<HTMLDivElement, GlowCardProps>(
  ({ children, color = '210 70% 55%', className }, ref) => {
    return (
      <div ref={ref} className={cn("relative rounded-2xl overflow-hidden", className)} style={{
        background: `linear-gradient(165deg, hsl(${color} / 0.08) 0%, hsl(var(--card)) 40%, hsl(var(--background)) 100%)`,
        border: `1px solid hsl(${color} / 0.2)`,
      }}>
        {/* Top glow line */}
        <div className="absolute top-0 inset-x-0 h-[2px]" style={{
          background: `linear-gradient(90deg, transparent, hsl(${color} / 0.7), transparent)`,
        }} />
        {/* Subtle radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-32 rounded-full opacity-20 pointer-events-none" style={{
          background: `radial-gradient(circle, hsl(${color} / 0.4), transparent 70%)`,
        }} />
        <div className="relative">
          {children}
        </div>
      </div>
    );
  }
);

GlowCard.displayName = 'GlowCard';
