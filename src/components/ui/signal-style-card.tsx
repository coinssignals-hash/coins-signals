import { cn } from '@/lib/utils';
import * as React from 'react';

interface SignalStyleCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  /** Optional label shown at the top-left of the card */
  label?: string;
}

export function SignalStyleCard({ children, className, label, ...props }: SignalStyleCardProps) {
  return (
    <div
      className={cn('relative rounded-xl overflow-hidden', className)}
      style={{
        background: 'radial-gradient(ellipse at center 40%, hsl(200, 100%, 15%) 0%, hsl(205, 100%, 7%) 70%, hsl(210, 100%, 5%) 100%)',
        border: '1px solid hsla(200, 60%, 35%, 0.3)',
      }}
      {...props}
    >
      {/* Top glow line */}
      <div
        className="absolute top-0 left-[15%] right-[15%] h-[1px]"
        style={{ background: 'radial-gradient(ellipse at center, hsl(200, 80%, 55%) 0%, transparent 70%)' }}
      />
      {label && (
        <div className="px-4 pt-3 pb-1">
          <span className="text-[10px] uppercase tracking-wider text-cyan-300/60 font-medium">{label}</span>
        </div>
      )}
      <div className="relative">{children}</div>
    </div>
  );
}
