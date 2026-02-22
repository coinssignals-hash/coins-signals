import { useRef, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Download, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import chartSignal from '@/assets/chart-signal.jpg';

// --- Types ---
export interface SignalChartProps {
  /** Currency pair e.g. "EUR/USD" */
  pair: string;
  support?: number;
  resistance?: number;
  signalId?: string;
  chartImageUrl?: string;
  /** Current live price for the range position indicator */
  currentPrice?: number;
  /** Whether the quote currency is JPY (affects pip multiplier) */
  isJpy?: boolean;
  /** Chart container height – responsive default */
  height?: number | string;
  className?: string;
  /** Hide the support/resistance panel below the chart */
  hideSupportResistance?: boolean;
  /** Entry price – used to derive S/R when not provided */
  entryPrice?: number;
  /** Take profit – used to derive resistance when not provided */
  takeProfit?: number;
  /** Stop loss – used to derive support when not provided */
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
    <div className="relative rounded-lg overflow-hidden" style={{ background: 'hsl(210, 100%, 5%)', border: '1px solid hsla(200, 60%, 35%, 0.3)' }}>
      {/* Zoom controls */}
      <div className="absolute top-2 right-2 z-20 flex gap-1">
        <button className={controlBtn} style={controlStyle} onClick={zoomIn}><ZoomIn className="w-4 h-4" /></button>
        <button className={controlBtn} style={controlStyle} onClick={zoomOut}><ZoomOut className="w-4 h-4" /></button>
        <button className={controlBtn} style={controlStyle} onClick={reset}><RotateCcw className="w-4 h-4" /></button>
        <button className={controlBtn} style={controlStyle} onClick={handleDownloadChart}><Download className="w-4 h-4" /></button>
        <button className={controlBtn} style={controlStyle} onClick={handleShareChart}><Share2 className="w-4 h-4" /></button>
      </div>
      <div
        ref={attachWheel}
        className="cursor-grab active:cursor-grabbing overflow-hidden"
        style={{ height: typeof height === 'number' ? `${height}px` : height, touchAction: 'none' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div ref={imgRef} className="w-full h-full transition-none origin-center" style={{ willChange: 'transform' }}>
          <img src={buildSrc()} alt={`${pair} chart`} className="w-full h-full object-contain" draggable={false} />
        </div>
      </div>
    </div>
  );
}

// --- Support/Resistance Panel ---
function SupportResistancePanel({
  support,
  resistance,
  currentPrice,
  isJpy = false





}: {support: number;resistance: number;currentPrice?: number;isJpy?: boolean;}) {
  const range = resistance - support;
  const pipMultiplier = isJpy ? 100 : 10000;
  const hasLive = currentPrice !== undefined && currentPrice > 0;
  const pricePosition = hasLive ?
  Math.max(0, Math.min(100, (currentPrice - support) / range * 100)) :
  50;
  const positionLabel = pricePosition > 66 ? 'Cerca de Resistencia' : pricePosition < 33 ? 'Cerca de Soporte' : 'En Rango Medio';
  const positionColor = pricePosition > 66 ? 'text-green-400' : pricePosition < 33 ? 'text-red-400' : 'text-yellow-400';

  return (
    <div className="rounded-lg p-3" style={{ background: 'hsl(210, 100%, 5%)', border: '1px solid hsla(200, 60%, 35%, 0.2)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-cyan-200">Soporte y Resistencia</span>
      </div>
      <div className="flex items-center justify-center gap-3 mb-2">
        <div className="flex items-center gap-2 rounded-lg px-4 py-2" style={{ background: 'linear-gradient(90deg, hsla(135,50%,20%,0.3), hsla(0,50%,20%,0.3))', border: '1px solid hsla(200,40%,30%,0.3)' }}>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-gray-500 uppercase">Resistencia</span>
            <span className="text-green-400 font-mono text-sm font-semibold">{resistance.toFixed(isJpy ? 3 : 5)}</span>
          </div>
          <div className="flex flex-col items-center px-3" style={{ borderLeft: '1px solid hsla(200,40%,30%,0.3)', borderRight: '1px solid hsla(200,40%,30%,0.3)' }}>
            <span className="text-[10px] text-gray-500 uppercase">Rango</span>
            <span className="text-yellow-400 font-mono text-sm font-bold">{(range * pipMultiplier).toFixed(1)} pips</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-gray-500 uppercase">Soporte</span>
            <span className="text-red-400 font-mono text-sm font-semibold">{support.toFixed(isJpy ? 3 : 5)}</span>
          </div>
        </div>
      </div>
      {hasLive && (
        <div className="rounded-lg p-3" style={{ background: 'hsla(210,30%,8%,0.5)', border: '1px solid hsla(200,40%,30%,0.2)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-gray-500 uppercase">Posición en Rango</span>
            <span className={cn("text-xs font-medium", positionColor)}>{positionLabel}</span>
          </div>
          <div className="relative h-3 rounded-full overflow-hidden" style={{ background: 'linear-gradient(90deg, hsla(0,50%,20%,0.5), hsla(45,50%,20%,0.5), hsla(135,50%,20%,0.5))' }}>
            <div className="absolute inset-0 flex">
              <div className="w-1/3" style={{ borderRight: '1px solid hsla(200,30%,30%,0.5)' }}></div>
              <div className="w-1/3" style={{ borderRight: '1px solid hsla(200,30%,30%,0.5)' }}></div>
              <div className="w-1/3"></div>
            </div>
            <div className="absolute top-0 bottom-0 w-1 bg-white shadow-lg transition-all duration-300" style={{ left: `calc(${pricePosition}% - 2px)`, boxShadow: '0 0 8px rgba(255,255,255,0.5)' }}>
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full" style={{ border: '2px solid hsl(210,100%,50%)' }}></div>
            </div>
          </div>
          <div className="flex justify-between mt-1 text-[9px] text-gray-500">
            <span>Soporte (0%)</span>
            <span className={cn("font-mono font-bold", positionColor)}>{pricePosition.toFixed(1)}%</span>
            <span>Resistencia (100%)</span>
          </div>
        </div>
      )}
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
  currentPrice,
  isJpy = false,
  height = 200,
  className,
  hideSupportResistance = false,
  entryPrice,
  takeProfit,
  stopLoss
}: SignalChartProps) {
  // Auto-derive support/resistance from TP/SL when not provided
  const support = supportProp ?? (stopLoss !== undefined && entryPrice !== undefined ?
  Math.min(stopLoss, entryPrice) :
  undefined);
  const resistance = resistanceProp ?? (takeProfit !== undefined && entryPrice !== undefined ?
  Math.max(takeProfit, entryPrice) :
  undefined);

  const showSR = !hideSupportResistance && support !== undefined && resistance !== undefined;

  return (
    <div className={cn('space-y-3', className)}>
      <ZoomableChartInner
        pair={pair}
        support={support}
        resistance={resistance}
        signalId={signalId}
        chartImageUrl={chartImageUrl}
        height={height} />

      {showSR &&
      <SupportResistancePanel
        support={support!}
        resistance={resistance!}
        currentPrice={currentPrice}
        isJpy={isJpy} />

      }
    </div>);

}