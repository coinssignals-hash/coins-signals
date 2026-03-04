import { useRef, useState, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface LazySectionProps {
  children: ReactNode;
  /** Placeholder height while not yet visible */
  minHeight?: string;
  /** IntersectionObserver rootMargin — load before entering viewport */
  rootMargin?: string;
  /** CSS class for the wrapper */
  className?: string;
  /** Show a skeleton placeholder while loading */
  fallback?: ReactNode;
}

/**
 * Delays rendering of children until the section enters (or is near) the viewport.
 * Uses IntersectionObserver for zero-cost idle sections.
 */
export function LazySection({
  children,
  minHeight = '120px',
  rootMargin = '200px 0px',
  className,
  fallback,
}: LazySectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} className={cn(className)} style={!visible ? { minHeight } : undefined}>
      {visible ? children : (fallback ?? null)}
    </div>
  );
}
