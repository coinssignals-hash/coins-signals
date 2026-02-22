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
  height = 200,
}: {
  pair: string;
  support?: number;
  resistance?: number;
  signalId?: string;
  chartImageUrl?: string;
  height?: number | string;
}) {
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
    [applyTransform, clampPosition],
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
    [handleWheel],
  );

  const zoomIn = () => { scale.current = Math.min(5, scale.current * 1.3); clampPosition(); applyTransform(); };
  const zoomOut = () => { scale.current = Math.max(1, scale.current * 0.77); clampPosition(); applyTransform(); };
  const reset = () => { scale.current = 1; posX.current = 0; posY.current = 0; applyTransform(); };

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
      try { await navigator.share({ title: `${pair} Chart`, url: shareUrl }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(shareUrl);
    }
  };

  const controlBtn = "w-7 h-7 sm:w-6 sm:h-6 rounded flex items-center justify-center text-cyan-400/80 hover:text-cyan-300 transition-colors";
  const controlStyle: React.CSSProperties = { background: 'hsla(210, 100%, 8%, 0.8)', border: '1px solid hsla(200, 60%, 35%, 0.4)' };

  return (
    <div
      ref={attachWheel}
      className="relative rounded-lg overflow-hidden cursor-grab active:cursor-grabbing select-none"
      style={{ background: 'hsl(215, 100%, 4%)', border: '1px solid hsla(200, 60%, 35%, 0.3)', height }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="absolute top-0 left-[10%] right-[10%] h-[1px]" style={{ background: 'radial-gradient(ellipse at center, hsl(195, 100%, 54%) 0%, transparent 70%)' }} />

      <div ref={imgRef} className="w-full h-full origin-center transition-none" style={{ willChange: 'transform' }}>
        <img
          src={buildSrc()}
          alt={`${pair} Candlestick Chart`}
          className="w-full h-full object-contain"
          draggable={false}
          onError={(e) => { (e.target as HTMLImageElement).src = chartSignal; }}
        />
      </div>

      {/* Controls */}
      <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
        <button onClick={zoomIn} className={controlBtn} style={controlStyle}><ZoomIn className="w-3.5 h-3.5 sm:w-3 sm:h-3" /></button>
        <button onClick={zoomOut} className={controlBtn} style={controlStyle}><ZoomOut className="w-3.5 h-3.5 sm:w-3 sm:h-3" /></button>
        <button onClick={reset} className={controlBtn} style={controlStyle}><RotateCcw className="w-3.5 h-3.5 sm:w-3 sm:h-3" /></button>
        <div className="w-4 border-t border-cyan-700/30 mx-auto" />
        <button onClick={handleDownloadChart} className={controlBtn} style={controlStyle} title="Descargar"><Download className="w-3.5 h-3.5 sm:w-3 sm:h-3" /></button>
        <button onClick={handleShareChart} className={controlBtn} style={controlStyle} title="Compartir"><Share2 className="w-3.5 h-3.5 sm:w-3 sm:h-3" /></button>
      </div>
    </div>
  );
}

// --- Support/Resistance Panel ---
function SupportResistancePanel({
  support,
  resistance,
  currentPrice,
  isJpy = false,
}: {
  support: number;
  resistance: number;
  currentPrice?: number;
  isJpy?: boolean;
}) {
  const range = resistance - support;
  const pipMultiplier = isJpy ? 100 : 10000;
  const hasLive = currentPrice !== undefined && currentPrice > 0;
  const pricePosition = hasLive
    ? Math.max(0, Math.min(100, ((currentPrice - support) / range) * 100))
    : 50;
  const positionLabel = pricePosition > 66 ? 'Cerca de Resistencia' : pricePosition < 33 ? 'Cerca de Soporte' : 'En Rango Medio';
  const positionColor = pricePosition > 66 ? 'text-green-400' : pricePosition < 33 ? 'text-red-400' : 'text-yellow-400';

  return (
    <div
      className="rounded-lg p-3 relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, hsl(0, 0%, 4%) 0%, hsl(210, 60%, 6%) 100%)',
        border: '1px solid hsla(120, 40%, 25%, 0.5)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold text-sm">Resistencia y Soporte</h3>
        {hasLive && (
          <div className="flex items-center gap-2 bg-blue-500/20 px-2 py-1 rounded-full">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-xs text-blue-400 font-medium">LIVE: {currentPrice.toFixed(5)}</span>
          </div>
        )}
      </div>

      {/* Range indicator – responsive flex wrap */}
      <div className="space-y-2">
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 flex-wrap justify-center bg-gradient-to-r from-green-900/30 to-red-900/30 border border-gray-700 rounded-lg px-3 sm:px-4 py-2">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-gray-500 uppercase">Máximo</span>
              <span className="text-green-400 font-mono text-xs sm:text-sm font-semibold">{resistance.toFixed(4)}</span>
            </div>
            <div className="flex flex-col items-center px-2 sm:px-3 border-x border-gray-700">
              <span className="text-[10px] text-gray-500 uppercase">Rango</span>
              <span className="text-yellow-400 font-mono text-xs sm:text-sm font-bold">
                {(range * pipMultiplier).toFixed(1)} pips
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-gray-500 uppercase">Mínimo</span>
              <span className="text-red-400 font-mono text-xs sm:text-sm font-semibold">{support.toFixed(4)}</span>
            </div>
          </div>
        </div>

        {/* Price position bar */}
        {hasLive && (
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-2.5 sm:p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-gray-500 uppercase">Posición en Rango</span>
              <span className={cn('text-xs font-medium', positionColor)}>{positionLabel}</span>
            </div>
            <div className="relative h-3 bg-gradient-to-r from-red-900/50 via-yellow-900/50 to-green-900/50 rounded-full overflow-hidden">
              <div className="absolute inset-0 flex">
                <div className="w-1/3 border-r border-gray-600" />
                <div className="w-1/3 border-r border-gray-600" />
                <div className="w-1/3" />
              </div>
              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-lg shadow-white/50 transition-all duration-300"
                style={{ left: `calc(${pricePosition}% - 2px)` }}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full border-2 border-blue-500" />
              </div>
            </div>
            <div className="flex justify-between mt-1 text-[9px] text-gray-500">
              <span>Soporte (0%)</span>
              <span className={cn('font-mono font-bold', positionColor)}>{pricePosition.toFixed(1)}%</span>
              <span>Resistencia (100%)</span>
            </div>
          </div>
        )}
      </div>

      {/* Legend – responsive wrap */}
      <div className="flex flex-wrap gap-3 sm:gap-4 mt-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-5 sm:w-6 h-0.5 border-t-2 border-dashed border-green-500" />
          <span className="text-green-400">Resistencia</span>
          <span className="font-mono font-semibold text-green-300 bg-green-500/20 px-1.5 py-0.5 rounded text-[10px] sm:text-xs">
            {resistance.toFixed(5)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 sm:w-6 h-0.5 border-t-2 border-dashed border-red-500" />
          <span className="text-red-400">Soporte</span>
          <span className="font-mono font-semibold text-red-300 bg-red-500/20 px-1.5 py-0.5 rounded text-[10px] sm:text-xs">
            {support.toFixed(5)}
          </span>
        </div>
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
  currentPrice,
  isJpy = false,
  height = 200,
  className,
  hideSupportResistance = false,
  entryPrice,
  takeProfit,
  stopLoss,
}: SignalChartProps) {
  // Auto-derive support/resistance from TP/SL when not provided
  const support = supportProp ?? (stopLoss !== undefined && entryPrice !== undefined
    ? Math.min(stopLoss, entryPrice)
    : undefined);
  const resistance = resistanceProp ?? (takeProfit !== undefined && entryPrice !== undefined
    ? Math.max(takeProfit, entryPrice)
    : undefined);

  const showSR = !hideSupportResistance && support !== undefined && resistance !== undefined;

  return (
    <div className={cn('space-y-3', className)}>
      <ZoomableChartInner
        pair={pair}
        support={support}
        resistance={resistance}
        signalId={signalId}
        chartImageUrl={chartImageUrl}
        height={height}
      />
      {showSR && (
        <SupportResistancePanel
          support={support!}
          resistance={resistance!}
          currentPrice={currentPrice}
          isJpy={isJpy}
        />
      )}
    </div>
  );
}
