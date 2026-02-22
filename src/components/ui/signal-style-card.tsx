import { cn } from '@/lib/utils';
import * as React from 'react';
import bullBg from '@/assets/bull-card-bg.svg';

interface SignalStyleCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  /** Optional label shown at the top-left of the card */
  label?: string;
}

export function SignalStyleCard({ children, className, label, ...props }: SignalStyleCardProps) {
  return (
    <div className={cn('relative w-full rounded-xl overflow-hidden', className)} {...props}>
      <div
        className="relative rounded-xl border border-cyan-800/30 overflow-hidden"
        style={{
          background:
          'radial-gradient(ellipse at center 40%, hsl(200, 100%, 15%) 0%, hsl(205, 100%, 7%) 70%, hsl(210, 100%, 5%) 100%)'
        }}>

        {/* Bull background overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${bullBg})`,
            backgroundSize: '55%',
            backgroundPosition: '65% center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.3,
            mixBlendMode: 'screen'
          }} />


        {/* Top glow line */}
        <div
          className="absolute top-0 left-[15%] right-[15%] h-[1px]"
          style={{ background: 'radial-gradient(ellipse at center, hsl(200, 80%, 55%) 0%, transparent 70%)' }} />


        {label &&
        <div className="relative px-4 pt-3 pb-1">
            <span className="text-[10px] uppercase tracking-wider text-cyan-300/60 font-medium">{label}</span>
          </div>
        }
        
      </div>
    </div>);

}