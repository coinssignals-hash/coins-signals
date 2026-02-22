import { useRef, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Download, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Types ---
export interface SignalChartProps {
  pair: string;
  support?: number;
  resistance?: number;
  signalId?: string;
  chartImageUrl?: string;
  currentPrice?: number;
  isJpy?: boolean;
  height?: number | string;
  className?: string;
  hideSupportResistance?: boolean;
  entryPrice?: number;
  takeProfit?: number;
  stopLoss?: number;
}

// --- Zoomable Chart (internal) ---
function ZoomableChartInner({
  pair,
  support,
  resistance,
  signalId,
  chartImageUrl,
  height = 200
}: {pair: string;support?: number;resistance?: number;signalId?: string;chartImageUrl?: string;height?: number | string;}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scale = useRef(1);
  const posX = useRef(0);
  const posY = useRef(0);
  const isDragging = useRef(false);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const lastPinchDist = useRef<number | null>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  const applyTransform = useCallback(() => {
    if (!imgRef.current) return;
    imgRef.current.style.transform = `translate(${posX.current}px, ${posY.current}px) scale(${scale.current})`;
  }, []);

  const clampPosition = useCallback(() => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img) return;
    const cW = container.clientWidth;
    const cH = container.clientHeight;
    const maxX = Math.max(0, (cW * scale.current - cW) / 2);
    const maxY = Math.max(0, (cH * scale.current - cH) / 2);
    posX.current = Math.max(-maxX, Math.min(maxX, posX.current));
    posY.current = Math.max(-maxY, Math.min(maxY, posY.current));
  }, []);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.85 : 1.15;
      scale.current = Math.max(1, Math.min(5, scale.current * factor));
      clampPosition();
      applyTransform();
    },
    [applyTransform, clampPosition]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastX.current = e.clientX;
    lastY.current = e.clientY;
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    posX.current += e.clientX - lastX.current;
    posY.current += e.clientY - lastY.current;
    lastX.current = e.clientX;
    lastY.current = e.clientY;
    clampPosition();
    applyTransform();
  };
  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist.current = Math.sqrt(dx * dx + dy * dy);
    } else {
      isDragging.current = true;
      lastX.current = e.touches[0].clientX;
      lastY.current = e.touches[0].clientY;
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 2 && lastPinchDist.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      scale.current = Math.max(1, Math.min(5, scale.current * (dist / lastPinchDist.current)));
      lastPinchDist.current = dist;
      clampPosition();
      applyTransform();
    } else if (e.touches.length === 1 && isDragging.current) {
      posX.current += e.touches[0].clientX - lastX.current;
      posY.current += e.touches[0].clientY - lastY.current;
      lastX.current = e.touches[0].clientX;
      lastY.current = e.touches[0].clientY;
      clampPosition();
      applyTransform();
    }
  };
  const handleTouchEnd = () => {
    isDragging.current = false;
    lastPinchDist.current = null;
  };

  const attachWheel = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;
      (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      node.addEventListener('wheel', handleWheel, { passive: false });
    },
    [handleWheel]
  );

  const zoomIn = () => {scale.current = Math.min(5, scale.current * 1.3);clampPosition();applyTransform();};
  const zoomOut = () => {scale.current = Math.max(1, scale.current * 0.77);clampPosition();applyTransform();};
  const reset = () => {scale.current = 1;posX.current = 0;posY.current = 0;applyTransform();};

  const buildSrc = () => {
    if (chartImageUrl) return chartImageUrl;
    const params = new URLSearchParams({ pair, hd: '1' });
    if (support !== undefined) params.set('support', String(support));
    if (resistance !== undefined) params.set('resistance', String(resistance));
    if (signalId) params.set('signal_id', signalId);
    return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/candlestick-chart?${params.toString()}`;
  };

  const handleDownloadChart = async () => {
    try {
      const res = await fetch(buildSrc());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${pair.replace('/', '-')}-chart.svg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download failed:', e);
    }
  };

  const handleShareChart = async () => {
    const shareUrl = buildSrc();
    if (navigator.share) {
      try {await navigator.share({ title: `${pair} Chart`, url: shareUrl });} catch {/* cancelled */}
    } else {
      await navigator.clipboard.writeText(shareUrl);
    }
  };

  const controlBtn = "w-7 h-7 sm:w-6 sm:h-6 rounded flex items-center justify-center text-cyan-400/80 hover:text-cyan-300 transition-colors";
  const controlStyle: React.CSSProperties = { background: 'hsla(210, 100%, 8%, 0.8)', border: '1px solid hsla(200, 60%, 35%, 0.4)' };

  return (
    <div
      ref={attachWheel}
      className="relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
      style={{ height: typeof height === 'number' ? `${height}px` : height, background: '#050d1a', borderRadius: 8 }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div ref={imgRef} className="w-full h-full origin-center transition-none">
        <img src={buildSrc()} alt={`${pair} chart`} className="w-full h-full object-contain" draggable={false} />
      </div>
      <div className="absolute top-2 right-2 flex gap-1 z-10">
        <button className={controlBtn} style={controlStyle} onClick={zoomIn}><ZoomIn size={14} /></button>
        <button className={controlBtn} style={controlStyle} onClick={zoomOut}><ZoomOut size={14} /></button>
        <button className={controlBtn} style={controlStyle} onClick={reset}><RotateCcw size={14} /></button>
        <button className={controlBtn} style={controlStyle} onClick={handleDownloadChart}><Download size={14} /></button>
        <button className={controlBtn} style={controlStyle} onClick={handleShareChart}><Share2 size={14} /></button>
      </div>
    </div>
  );
}

// --- Main exported component ---
export function SignalChart({
  pair,
  support: supportProp,
  resistance: resistanceProp,
  signalId,
  chartImageUrl,
  height = 200,
  className,
  entryPrice,
  takeProfit,
  stopLoss
}: SignalChartProps) {
  const support = supportProp ?? (stopLoss !== undefined && entryPrice !== undefined ?
  Math.min(stopLoss, entryPrice) : undefined);
  const resistance = resistanceProp ?? (takeProfit !== undefined && entryPrice !== undefined ?
  Math.max(takeProfit, entryPrice) : undefined);

  return (
    <div className={cn('space-y-3', className)}>
      <ZoomableChartInner
        pair={pair}
        support={support}
        resistance={resistance}
        signalId={signalId}
        chartImageUrl={chartImageUrl}
        height={height} />

    </div>);

}