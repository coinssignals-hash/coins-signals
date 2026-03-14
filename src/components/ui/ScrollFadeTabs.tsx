import { useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ScrollFadeTabsProps {
  children: React.ReactNode;
  className?: string;
}

export function ScrollFadeTabs({ children, className }: ScrollFadeTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const updateFades = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 4);
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateFades();
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateFades);
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateFades]);

  return (
    <div className={cn("relative", className)}>
      <div
        className="pointer-events-none absolute left-0 top-0 bottom-0 w-5 z-10 transition-opacity duration-300"
        style={{
          background: 'linear-gradient(to right, hsl(var(--background)), transparent)',
          opacity: showLeft ? 1 : 0,
        }}
      />
      <div
        className="pointer-events-none absolute right-0 top-0 bottom-0 w-5 z-10 transition-opacity duration-300"
        style={{
          background: 'linear-gradient(to left, hsl(var(--background)), transparent)',
          opacity: showRight ? 1 : 0,
        }}
      />
      <div
        ref={scrollRef}
        onScroll={updateFades}
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide px-1"
      >
        {children}
      </div>
    </div>
  );
}
