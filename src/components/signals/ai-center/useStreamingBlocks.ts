import { useState, useEffect, useRef } from 'react';

/**
 * Progressively reveals blocks with a staggered delay,
 * simulating a streaming/typing effect.
 * Once all blocks for a given result are revealed, it stays complete
 * (no re-animation on re-render).
 */
export function useStreamingBlocks(
  totalBlocks: number,
  resultId: string, // unique key per result to track completion
  intervalMs = 60,
) {
  const [visibleCount, setVisibleCount] = useState(0);
  const completedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // If we already streamed this result, show all instantly
    if (completedRef.current.has(resultId)) {
      setVisibleCount(totalBlocks);
      return;
    }

    setVisibleCount(0);
    if (totalBlocks === 0) return;

    let current = 0;
    const timer = setInterval(() => {
      current++;
      setVisibleCount(current);
      if (current >= totalBlocks) {
        clearInterval(timer);
        completedRef.current.add(resultId);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [resultId, totalBlocks, intervalMs]);

  const isStreaming = visibleCount < totalBlocks;

  return { visibleCount, isStreaming };
}
