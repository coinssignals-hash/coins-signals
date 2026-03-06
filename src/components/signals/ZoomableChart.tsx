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
  const panStart = useRef({ x: 0, y: 0 });
  const translateStart = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const translateRef = useRef({ x: 0, y: 0 });
  const lastTap = useRef(0);

  useEffect(() => { scaleRef.current = scale; }, [scale]);
  useEffect(() => { translateRef.current = translate; }, [translate]);

  const clamp = useCallback((tx: number, ty: number, s: number) => {
    if (s <= 1) return { x: 0, y: 0 };
    const el = containerRef.current;
    if (!el) return { x: tx, y: ty };
    const r = el.getBoundingClientRect();
    // Content scaled dimensions vs container
    const overflowX = (r.width * s - r.width) / 2;
    const overflowY = (r.height * s - r.height) / 2;
    // Clamp so scaled content never leaves the container edges
    return {
      x: Math.max(-overflowX, Math.min(overflowX, tx)),
      y: Math.max(-overflowY, Math.min(overflowY, ty)),
    };
  }, []);

  // Pinch center relative to container center
  const getPinchCenter = (t1: React.Touch, t2: React.Touch) => {
    const el = containerRef.current;
    if (!el) return { cx: 0, cy: 0 };
    const rect = el.getBoundingClientRect();
    const cx = (t1.clientX + t2.clientX) / 2 - rect.left - rect.width / 2;
    const cy = (t1.clientY + t2.clientY) / 2 - rect.top - rect.height / 2;
    return { cx, cy };
  };

  // Desktop wheel zoom towards cursor
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left - rect.width / 2;
      const cy = e.clientY - rect.top - rect.height / 2;
      const delta = e.deltaY > 0 ? -0.3 : 0.3;
      const prev = scaleRef.current;
      const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev + delta));
      if (next <= 1) {
        setScale(1);
        setTranslate({ x: 0, y: 0 });
      } else {
        const ratio = next / prev;
        const newTx = translateRef.current.x * ratio + cx * (1 - ratio);
        const newTy = translateRef.current.y * ratio + cy * (1 - ratio);
        setScale(next);
        setTranslate(clamp(newTx, newTy, next));
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [clamp]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      isPinching.current = true;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist.current = Math.hypot(dx, dy);
    } else if (e.touches.length === 1 && scaleRef.current > 1 && !isPinching.current) {
      panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      translateStart.current = { ...translateRef.current };
    }

    // Double tap detection
    if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTap.current < 300) {
        // Reset zoom
        setScale(1);
        setTranslate({ x: 0, y: 0 });
        lastTap.current = 0;
      } else {
        lastTap.current = now;
      }
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      isPinching.current = true;

      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);

      if (lastPinchDist.current !== null) {
        const prev = scaleRef.current;
        const delta = (dist - lastPinchDist.current) * 0.012;
        const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev + delta));

        // Zoom towards pinch center
        const { cx, cy } = getPinchCenter(e.touches[0], e.touches[1]);
        const ratio = next / prev;
        const newTx = translateRef.current.x * ratio + cx * (1 - ratio);
        const newTy = translateRef.current.y * ratio + cy * (1 - ratio);

        if (next <= 1) {
          setScale(1);
          setTranslate({ x: 0, y: 0 });
        } else {
          setScale(next);
          setTranslate(clamp(newTx, newTy, next));
        }
      }
      lastPinchDist.current = dist;
    } else if (e.touches.length === 1 && !isPinching.current && scaleRef.current > 1) {
      e.preventDefault();
      const dx = e.touches[0].clientX - panStart.current.x;
      const dy = e.touches[0].clientY - panStart.current.y;
      setTranslate(clamp(
        translateStart.current.x + dx,
        translateStart.current.y + dy,
        scaleRef.current
      ));
    }
  }, [clamp]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      lastPinchDist.current = null;
      setTimeout(() => { isPinching.current = false; }, 120);
    }
    if (e.touches.length === 1 && scaleRef.current > 1) {
      panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      translateStart.current = { ...translateRef.current };
    }
  }, []);

  const isZoomed = scale > 1;

  return (
    <div className={cn('relative w-full', className)}>
      {isZoomed && (
        <div className="absolute bottom-3 left-3 z-20 px-2 py-1 rounded-md bg-slate-900/80 backdrop-blur-sm text-[10px] font-mono text-cyan-300 pointer-events-none">
          {Math.round(scale * 100)}% · doble-tap para resetear
        </div>
      )}

      <div
        ref={containerRef}
        className={cn('w-full overflow-hidden', isZoomed && 'cursor-grab')}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: isZoomed ? 'none' : 'pan-y', clipPath: 'inset(0)' }}
      >
        <div
          className="w-full will-change-transform"
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transformOrigin: 'center center',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
