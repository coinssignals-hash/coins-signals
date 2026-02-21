import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { cn } from '@/lib/utils';

interface PageShellProps {
  children: ReactNode;
  /** Show the bottom nav bar (default: true) */
  showBottomNav?: boolean;
  /** Max width class for the content container (default: max-w-[390px] on mobile, wider on desktop) */
  maxWidth?: string;
  /** Additional class names for the inner container */
  className?: string;
  /** Whether to add bottom padding for the bottom nav (default: true) */
  bottomPadding?: boolean;
}

export function PageShell({ 
  children, 
  showBottomNav = true, 
  maxWidth = 'max-w-2xl',
  className,
  bottomPadding = true,
}: PageShellProps) {
  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className={cn(
        'relative w-full min-h-screen shadow-2xl',
        'bg-[image:var(--gradient-page)]',
        maxWidth,
        bottomPadding && 'pb-20',
        className,
      )}>
        {children}
      </div>
      {showBottomNav && <BottomNav />}
    </div>
  );
}
