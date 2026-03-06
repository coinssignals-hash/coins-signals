import { useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ZoomableChartProps {
  children: React.ReactNode;
  className?: string;
}

const MIN_SCALE = 1;
const MAX_SCALE = 5;

export function ZoomableChart({ children, className }: ZoomableChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const isPinching = useRef(false);
  const lastPinchDist = useRef<number | null>(null);
  const lastTouchCenter = useRef<{ x: number; y: number } | null>(null);
  const panStart = useRef({ x: 0, y: 0 });
  const translateStart = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const translateRef = useRef({ x: 0, y: 0 });

  // Keep refs in sync
  useEffect(() => { scaleRef.current = scale; }, [scale]);
  useEffect(() => { translateRef.current = translate; }, [translate]);

  const clampTranslate = useCallback((tx: number, ty: number, s: number) => {
    if (s <= 1) return { x: 0, y: 0 };
    const container = containerRef.current;
    if (!container) return { x: tx, y: ty };
    const rect = container.getBoundingClientRect();
    const maxX = (rect.width * (s - 1)) / 2;
    const maxY = (rect.height * (s - 1)) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, tx)),
      y: Math.max(-maxY, Math.min(maxY, ty)),
    };
  }, []);

  // Desktop wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.3 : 0.3;
    setScale(prev => {
      const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev + delta));
      if (next <= 1) setTranslate({ x: 0, y: 0 });
      return next;
    });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Touch handling - separate pinch (2 fingers = zoom only) from pan (1 finger when zoomed)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Start pinch - just record distance, NO movement
      isPinching.current = true;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist.current = Math.hypot(dx, dy);
      lastTouchCenter.current = null; // don't track center to avoid movement
    } else if (e.touches.length === 1 && scaleRef.current > 1) {
      // Start pan (only when zoomed)
      panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      translateStart.current = { ...translateRef.current };
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch zoom - scale only, no panning
      e.preventDefault();
      isPinching.current = true;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (lastPinchDist.current !== null) {
        const delta = (dist - lastPinchDist.current) * 0.01;
        setScale(prev => {
          const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev + delta));
          if (next <= 1) setTranslate({ x: 0, y: 0 });
          return next;
        });
      }
      lastPinchDist.current = dist;
    } else if (e.touches.length === 1 && !isPinching.current && scaleRef.current > 1) {
      // Single finger pan when zoomed
      e.preventDefault();
      const dx = e.touches[0].clientX - panStart.current.x;
      const dy = e.touches[0].clientY - panStart.current.y;
      setTranslate(clampTranslate(
        translateStart.current.x + dx,
        translateStart.current.y + dy,
        scaleRef.current
      ));
    }
  }, [clampTranslate]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      lastPinchDist.current = null;
      lastTouchCenter.current = null;
      // Small delay to prevent pan starting right after pinch ends
      setTimeout(() => { isPinching.current = false; }, 100);
    }
    // If one finger remains after pinch, reset pan start
    if (e.touches.length === 1 && scaleRef.current > 1) {
      panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      translateStart.current = { ...translateRef.current };
    }
  }, []);

  // Double tap to reset
  const lastTap = useRef(0);
  const handleDoubleTap = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const now = Date.now();
    if (now - lastTap.current < 300) {
      setScale(1);
      setTranslate({ x: 0, y: 0 });
    }
    lastTap.current = now;
  }, []);

  const isZoomed = scale > 1;

  return (
    <div className={cn('relative w-full', className)}>
      {/* Zoom indicator */}
      {isZoomed && (
        <div className="absolute bottom-3 left-3 z-20 px-2 py-1 rounded-md bg-slate-900/80 backdrop-blur-sm text-[10px] font-mono text-cyan-300">
          {Math.round(scale * 100)}%
        </div>
      )}

      {/* Zoomable area */}
      <div
        ref={containerRef}
        className={cn('w-full overflow-hidden', isZoomed ? 'cursor-grab' : '')}
        onTouchStart={(e) => { handleTouchStart(e); handleDoubleTap(e); }}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: isZoomed ? 'none' : 'pan-y' }}
      >
        <div
          className="w-full"
          style={{
            transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`,
            transformOrigin: 'center center',
            transition: isPinching.current ? 'none' : 'transform 0.1s ease-out',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
