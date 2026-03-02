import { useRef, useState, useCallback, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ZoomableChartProps {
  children: React.ReactNode;
  className?: string;
}

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const ZOOM_STEP = 0.3;

export function ZoomableChart({ children, className }: ZoomableChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const translateStart = useRef({ x: 0, y: 0 });

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

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
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

  // Pointer pan
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (scale <= 1) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY };
    translateStart.current = { ...translate };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [scale, translate]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setTranslate(clampTranslate(translateStart.current.x + dx, translateStart.current.y + dy, scale));
  }, [isPanning, scale, clampTranslate]);

  const onPointerUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Touch pinch
  const lastPinchDist = useRef<number | null>(null);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
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
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    lastPinchDist.current = null;
  }, []);

  const zoomIn = () => setScale(prev => Math.min(MAX_SCALE, prev + ZOOM_STEP));
  const zoomOut = () => {
    setScale(prev => {
      const next = Math.max(MIN_SCALE, prev - ZOOM_STEP);
      if (next <= 1) setTranslate({ x: 0, y: 0 });
      return next;
    });
  };
  const resetZoom = () => { setScale(1); setTranslate({ x: 0, y: 0 }); };

  const isZoomed = scale > 1;

  return (
    <div className={cn('relative w-full', className)}>
      {/* Zoom controls */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1">
        <button onClick={zoomIn} className="p-1.5 rounded-md bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors backdrop-blur-sm" title="Zoom in">
          <ZoomIn className="w-4 h-4" />
        </button>
        <button onClick={zoomOut} className="p-1.5 rounded-md bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors backdrop-blur-sm" title="Zoom out">
          <ZoomOut className="w-4 h-4" />
        </button>
        {isZoomed && (
          <button onClick={resetZoom} className="p-1.5 rounded-md bg-slate-900/80 text-cyan-300 hover:text-white hover:bg-slate-800 transition-colors backdrop-blur-sm" title="Resetear zoom">
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Zoom indicator */}
      {isZoomed && (
        <div className="absolute bottom-3 left-3 z-20 px-2 py-1 rounded-md bg-slate-900/80 backdrop-blur-sm text-[10px] font-mono text-cyan-300">
          {Math.round(scale * 100)}%
        </div>
      )}

      {/* Zoomable area */}
      <div
        ref={containerRef}
        className={cn('w-full overflow-hidden', isZoomed ? 'cursor-grab' : '', isPanning && 'cursor-grabbing')}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ touchAction: 'none' }}
      >
        <div
          className="w-full transition-transform duration-100 ease-out"
          style={{
            transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`,
            transformOrigin: 'center center',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
