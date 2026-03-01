import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { PageTransition } from './PageTransition';
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
    <PageTransition>
    <div className="min-h-screen bg-[hsl(225,45%,3%)] flex justify-center">
      <div className={cn(
        'relative w-full min-h-screen shadow-2xl',
        'bg-gradient-to-b from-[hsl(222,45%,7%)] via-[hsl(218,52%,8%)] to-[hsl(222,45%,7%)]',
        'relative w-full min-h-screen shadow-2xl',
        'bg-gradient-to-b from-[hsl(222,45%,7%)] via-[hsl(218,52%,8%)] to-[hsl(222,45%,7%)]',
        maxWidth,
        bottomPadding && 'pb-20',
        className,
      )}>
        {children}
      </div>
      {showBottomNav && <BottomNav />}
    </div>
    </PageTransition>
  );
}
