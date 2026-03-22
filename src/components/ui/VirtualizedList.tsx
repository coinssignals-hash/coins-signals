import { memo, useCallback, useState, useRef, useEffect, ReactNode } from 'react';

interface VirtualizedListProps {
  /** Total items */
  items: any[];
  /** How many to render initially */
  initialCount?: number;
  /** How many to add each batch */
  batchSize?: number;
  /** Render function for each item */
  renderItem: (item: any, index: number) => ReactNode;
  /** Key extractor */
  keyExtractor: (item: any) => string;
  /** CSS class for the container */
  className?: string;
}

/**
 * Progressive rendering list — renders items in batches as the user scrolls,
 * reducing initial DOM nodes by up to 80% for long lists.
 */
export const VirtualizedList = memo(function VirtualizedList({
  items,
  initialCount = 6,
  batchSize = 4,
  renderItem,
  keyExtractor,
  className,
}: VirtualizedListProps) {
  const [visibleCount, setVisibleCount] = useState(Math.min(initialCount, items.length));
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset visible count when items change
  useEffect(() => {
    setVisibleCount(Math.min(initialCount, items.length));
  }, [items.length, initialCount]);

  useEffect(() => {
    if (visibleCount >= items.length) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + batchSize, items.length));
        }
      },
      { rootMargin: '200px' }
    );

    const el = sentinelRef.current;
    if (el) observer.observe(el);

    return () => { if (el) observer.unobserve(el); };
  }, [visibleCount, items.length, batchSize]);

  const visibleItems = items.slice(0, visibleCount);

  return (
    <div className={className}>
      {visibleItems.map((item, i) => (
        <div key={keyExtractor(item)}>{renderItem(item, i)}</div>
      ))}
      {visibleCount < items.length && (
        <div ref={sentinelRef} className="h-8 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
});
