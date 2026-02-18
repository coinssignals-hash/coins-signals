import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, ShieldCheck, Flame, Copy, TrendingDown, Minus, ChevronDown, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import bullBg from '@/assets/bull-card-bg.svg';

interface SignalCardV2Props {
  className?: string;
}

interface CurrencyImpact {
  currency: string;
  positive: number;
  negative: number;
  neutral: number;
}

// --- Candlestick Chart with zoom/pan ---
interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

function generateMockCandles(base: number, count: number): Candle[] {
  const candles: Candle[] = [];
  let price = base;
  const now = new Date('2025-10-07T01:00:00');
  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.48) * 0.15;
    const open = price;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * 0.08;
    const low = Math.min(open, close) - Math.random() * 0.08;
    const d = new Date(now.getTime() + i * 60 * 60 * 1000);
    const label = `${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:00`;
    candles.push({ time: label, open, high, low, close, volume: Math.random() * 100 + 20 });
    price = close;
  }
  return candles;
}

function CandlestickChart({ entryPrice, takeProfit, stopLoss }: { entryPrice: number; takeProfit: number; stopLoss: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const candles = useRef(generateMockCandles(152.35, 120));
  const zoom = useRef(3);
  const offsetX = useRef(0);
  const isDragging = useRef(false);
  const lastX = useRef(0);
  const lastPinchDist = useRef<number | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const padL = 4;
    const padR = 52;
    const padT = 10;
    const padB = 28;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;

    // Background
    ctx.fillStyle = 'hsl(215, 100%, 4%)';
    ctx.fillRect(0, 0, W, H);

    const data = candles.current;
    const candleWidth = Math.max(2, (chartW / data.length) * zoom.current);
    const totalWidth = candleWidth * data.length;
    const maxOffset = Math.max(0, totalWidth - chartW);
    offsetX.current = Math.max(-maxOffset, Math.min(0, offsetX.current));

    const startIdx = Math.max(0, Math.floor(-offsetX.current / candleWidth));
    const endIdx = Math.min(data.length - 1, startIdx + Math.ceil(chartW / candleWidth) + 1);
    const visible = data.slice(startIdx, endIdx + 1);

    if (visible.length === 0) return;

    const allPrices = visible.flatMap(c => [c.high, c.low]);
    const minPrice = Math.min(...allPrices, stopLoss * 0.999);
    const maxPrice = Math.max(...allPrices, takeProfit * 1.001);
    const priceRange = maxPrice - minPrice || 0.001;

    const toX = (i: number) => padL + (i - startIdx) * candleWidth + offsetX.current + (startIdx * candleWidth);
    const toY = (p: number) => padT + chartH - ((p - minPrice) / priceRange) * chartH;

    // Grid lines
    const gridCount = 5;
    ctx.setLineDash([2, 4]);
    ctx.strokeStyle = 'hsla(200, 60%, 40%, 0.2)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= gridCount; i++) {
      const y = padT + (i / gridCount) * chartH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(W - padR, y);
      ctx.stroke();
      const price = maxPrice - (i / gridCount) * priceRange;
      ctx.fillStyle = 'hsla(200, 80%, 70%, 0.7)';
      ctx.font = `${8 * dpr / dpr}px monospace`;
      ctx.textAlign = 'left';
      ctx.fillText(price.toFixed(3), W - padR + 3, y + 3);
    }
    ctx.setLineDash([]);

    // Reference lines: TP, Entry, SL
    const refLines = [
      { price: takeProfit, color: 'hsl(135, 80%, 50%)', label: 'Soporte' },
      { price: entryPrice, color: 'hsl(210, 100%, 60%)', label: '' },
      { price: stopLoss, color: 'hsl(0, 80%, 55%)', label: 'Resistencia' },
    ];
    refLines.forEach(({ price, color, label }) => {
      const y = toY(price);
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.moveTo(padL, y);
      ctx.lineTo(W - padR, y);
      ctx.stroke();
      ctx.setLineDash([]);
      if (label) {
        ctx.fillStyle = color;
        ctx.font = `bold 8px sans-serif`;
        ctx.textAlign = 'right';
        ctx.fillText(label, W - padR - 2, y - 2);
      }
    });

    // Candles
    visible.forEach((c, idx) => {
      const realIdx = startIdx + idx;
      const x = padL + realIdx * candleWidth + offsetX.current;
      if (x + candleWidth < padL || x > W - padR) return;

      const isUp = c.close >= c.open;
      const color = isUp ? 'hsl(135, 70%, 45%)' : 'hsl(0, 70%, 50%)';
      const cx = x + candleWidth / 2;
      const bodyTop = toY(Math.max(c.open, c.close));
      const bodyBot = toY(Math.min(c.open, c.close));
      const bodyH = Math.max(1, bodyBot - bodyTop);
      const wickW = Math.max(0.5, candleWidth * 0.08);

      // Wick
      ctx.fillStyle = color;
      ctx.fillRect(cx - wickW / 2, toY(c.high), wickW, toY(c.low) - toY(c.high));
      // Body
      const bodyW = Math.max(1, candleWidth * 0.65);
      ctx.fillStyle = color;
      ctx.fillRect(cx - bodyW / 2, bodyTop, bodyW, bodyH);

      // Volume bar at bottom
      const maxVol = Math.max(...visible.map(v => v.volume));
      const volH = (c.volume / maxVol) * (padB * 0.5);
      ctx.fillStyle = isUp ? 'hsla(135, 70%, 45%, 0.4)' : 'hsla(0, 70%, 50%, 0.4)';
      ctx.fillRect(cx - bodyW / 2, H - padB, bodyW, volH);
    });

    // Time labels
    const labelStep = Math.max(1, Math.floor(12 / zoom.current));
    ctx.fillStyle = 'hsla(200, 60%, 70%, 0.6)';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    visible.forEach((c, idx) => {
      if (idx % labelStep !== 0) return;
      const realIdx = startIdx + idx;
      const x = padL + realIdx * candleWidth + candleWidth / 2 + offsetX.current;
      if (x < padL || x > W - padR) return;
      ctx.fillText(c.time, x, H - padB + 10);
    });

    // Zoom indicator
    ctx.fillStyle = 'hsla(200, 80%, 70%, 0.5)';
    ctx.font = '9px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${zoom.current.toFixed(1)}x`, W - padR - 4, padT + 12);

  }, [entryPrice, takeProfit, stopLoss]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Mouse wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.85 : 1.15;
    zoom.current = Math.max(0.5, Math.min(8, zoom.current * factor));
    draw();
  }, [draw]);

  // Mouse drag
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastX.current = e.clientX;
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    offsetX.current += e.clientX - lastX.current;
    lastX.current = e.clientX;
    draw();
  };
  const handleMouseUp = () => { isDragging.current = false; };

  // Touch pinch/pan
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist.current = Math.sqrt(dx * dx + dy * dy);
    } else if (e.touches.length === 1) {
      isDragging.current = true;
      lastX.current = e.touches[0].clientX;
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 2 && lastPinchDist.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const factor = dist / lastPinchDist.current;
      zoom.current = Math.max(0.5, Math.min(8, zoom.current * factor));
      lastPinchDist.current = dist;
      draw();
    } else if (e.touches.length === 1 && isDragging.current) {
      offsetX.current += e.touches[0].clientX - lastX.current;
      lastX.current = e.touches[0].clientX;
      draw();
    }
  };
  const handleTouchEnd = () => {
    isDragging.current = false;
    lastPinchDist.current = null;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const resetZoom = () => {
    zoom.current = 1;
    offsetX.current = 0;
    draw();
  };

  return (
    <div
      ref={containerRef}
      className="relative rounded-lg overflow-hidden mx-3 mb-3"
      style={{
        background: 'hsl(215, 100%, 4%)',
        border: '1px solid hsla(200, 60%, 35%, 0.3)',
        height: 200,
      }}
    >
      <div className="absolute top-0 left-[10%] right-[10%] h-[1px]"
        style={{ background: 'radial-gradient(ellipse at center, hsl(195, 100%, 54%) 0%, transparent 70%)' }} />

      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair select-none"
        style={{ display: 'block', touchAction: 'none' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* Controls */}
      <div className="absolute top-2 right-2 flex flex-col gap-1">
        <button
          onClick={() => { zoom.current = Math.min(8, zoom.current * 1.3); draw(); }}
          className="w-6 h-6 rounded flex items-center justify-center text-cyan-400/80 hover:text-cyan-300 transition-colors"
          style={{ background: 'hsla(210, 100%, 8%, 0.8)', border: '1px solid hsla(200, 60%, 35%, 0.4)' }}
        >
          <ZoomIn className="w-3 h-3" />
        </button>
        <button
          onClick={() => { zoom.current = Math.max(0.5, zoom.current * 0.77); draw(); }}
          className="w-6 h-6 rounded flex items-center justify-center text-cyan-400/80 hover:text-cyan-300 transition-colors"
          style={{ background: 'hsla(210, 100%, 8%, 0.8)', border: '1px solid hsla(200, 60%, 35%, 0.4)' }}
        >
          <ZoomOut className="w-3 h-3" />
        </button>
        <button
          onClick={resetZoom}
          className="w-6 h-6 rounded flex items-center justify-center text-cyan-400/80 hover:text-cyan-300 transition-colors"
          style={{ background: 'hsla(210, 100%, 8%, 0.8)', border: '1px solid hsla(200, 60%, 35%, 0.4)' }}
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// --- Impact Bar ---
function ImpactBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] w-16 text-right" style={{ color }}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-[11px] font-semibold w-9 text-right" style={{ color }}>{value}%</span>
    </div>
  );
}

function CurrencyImpactPanel({ data }: { data: CurrencyImpact }) {
  const overall = data.positive > data.negative ? 'Positive' : data.negative > data.positive ? 'Negative' : 'Neutral';
  const overallColor = overall === 'Positive' ? 'hsl(135, 70%, 50%)' : overall === 'Negative' ? 'hsl(0, 70%, 55%)' : 'hsl(45, 80%, 55%)';
  const OverallIcon = overall === 'Positive' ? TrendingUp : overall === 'Negative' ? TrendingDown : Minus;

  return (
    <div className="flex-1 rounded-lg p-2.5 relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, hsl(210, 100%, 8%) 0%, hsl(200, 80%, 12%) 100%)',
        border: '1px solid hsla(200, 60%, 35%, 0.3)'
      }}>
      <div className="absolute top-0 left-[15%] right-[15%] h-[1px]"
        style={{ background: 'radial-gradient(ellipse at center, hsl(195, 100%, 54%) 0%, transparent 70%)' }} />
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-cyan-200">{data.currency}</span>
        <div className="flex items-center gap-1">
          <OverallIcon className="w-3.5 h-3.5" style={{ color: overallColor }} />
          <span className="text-[10px] font-bold" style={{ color: overallColor }}>{overall}</span>
        </div>
      </div>
      <div className="space-y-1.5">
        <ImpactBar label="Positivo" value={data.positive} color="hsl(135, 70%, 50%)" />
        <ImpactBar label="Negativo" value={data.negative} color="hsl(0, 70%, 55%)" />
        <ImpactBar label="Neutral" value={data.neutral} color="hsl(45, 80%, 55%)" />
      </div>
    </div>
  );
}

// --- TP/SL Price Row with Pips + % ---
interface PriceRowFullProps {
  label: string;
  pips: string;
  percent: string;
  price: string;
  isPositive: boolean;
}

function PriceRowFull({ label, pips, percent, price, isPositive }: PriceRowFullProps) {
  const accentColor = isPositive ? 'hsl(135, 70%, 50%)' : 'hsl(0, 70%, 55%)';
  return (
    <div className="relative rounded-md overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, hsl(0, 0%, 0%) 0%, hsl(205, 80%, 8%) 100%)',
        border: '1px solid hsla(210, 100%, 50%, 0.15)'
      }}>
      <div className="absolute top-0 left-[10%] right-[10%] h-[1px]"
        style={{ background: 'radial-gradient(ellipse at center, hsl(200, 100%, 50%) 0%, transparent 70%)' }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(90deg, hsla(215, 100%, 50%, 0.15) 0%, transparent 80%)' }} />
      <div className="flex items-center justify-between px-4 py-2.5">
        <span className="font-semibold text-white text-sm w-24 flex-shrink-0">{label}</span>
        <div className="flex items-center gap-3 flex-1 justify-center">
          <span className="text-xs font-bold" style={{ color: accentColor }}>{pips} Pips</span>
          <span className="text-xs font-bold" style={{ color: accentColor }}>{percent} %</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-white text-sm">{price}</span>
          <button className="text-cyan-400/60 hover:text-cyan-300 transition-colors">
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function TakeProfitStopLossSection() {
  return (
    <div className="space-y-2 mx-3 mb-3">
      <PriceRowFull label="TakeProfit 1" pips="+ 0.290" percent="+ 0.116" price="156.500" isPositive={true} />
      <PriceRowFull label="TakeProfit 2" pips="+ 0.390" percent="+ 0.216" price="156.400" isPositive={true} />
      <PriceRowFull label="Stop Loss"   pips="- 0.890" percent="- 0.116" price="158.100" isPositive={false} />
    </div>
  );
}

// --- Main Card ---
export function SignalCardV2({ className }: SignalCardV2Props) {
  const [expanded, setExpanded] = useState(false);

  const impactData: CurrencyImpact[] = [
    { currency: 'USD', positive: 62, negative: 23, neutral: 15 },
    { currency: 'JPY', positive: 28, negative: 51, neutral: 21 },
  ];

  return (
    <div className={cn("relative w-full rounded-xl overflow-hidden", className)}>
      <div className="relative rounded-xl border border-cyan-800/30 overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse at center 40%, hsl(200, 100%, 15%) 0%, hsl(205, 100%, 7%) 70%, hsl(210, 100%, 5%) 100%)'
        }}>

        {/* Bull background overlay */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${bullBg})`,
            backgroundSize: '55%',
            backgroundPosition: '65% center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.3,
            mixBlendMode: 'screen'
          }} />

        {/* Top glow line */}
        <div className="absolute top-0 left-[15%] right-[15%] h-[1px]"
          style={{ background: 'radial-gradient(ellipse at center, hsl(200, 80%, 55%) 0%, transparent 70%)' }} />

        {/* Date header */}
        <div className="relative text-center pt-3 pb-1">
          <span className="text-[11px] text-cyan-300/70 tracking-wide">
            Jueves 08 Octubre 2025 12:48:35
          </span>
        </div>

        {/* Upper section - currency pair */}
        <div className="relative px-4 pt-1 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-20 h-16 flex-shrink-0">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full overflow-hidden border-2 border-white/20 shadow-lg z-10">
                <img src="https://flagcdn.com/w160/us.png" alt="USD" className="w-full h-full object-cover" />
              </div>
              <div className="absolute left-7 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full overflow-hidden border-2 border-white/20 shadow-lg z-20">
                <img src="https://flagcdn.com/w160/jp.png" alt="JPY" className="w-full h-full object-cover" />
              </div>
            </div>
            <span className="text-3xl font-extrabold text-white tracking-wide">USD-JPY</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="relative w-16 h-16">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(200, 60%, 15%)" strokeWidth="3" />
                <circle cx="18" cy="18" r="14" fill="none" stroke="url(#probGradient)" strokeWidth="3"
                  strokeLinecap="round" strokeDasharray={`${85 * 0.88} ${100 * 0.88}`} />
                <defs>
                  <linearGradient id="probGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(200, 100%, 55%)" />
                    <stop offset="100%" stopColor="hsl(180, 100%, 50%)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-cyan-300">85%</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-[8px] text-cyan-300/50 leading-tight">Diferencia Precio</p>
              <p className="text-[8px] text-cyan-300/50 leading-tight">Entrada</p>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_6px_hsl(135,80%,50%)]" />
              <span className="text-sm font-bold text-cyan-300 italic">Active</span>
            </div>
          </div>
        </div>

        {/* Accent line */}
        <div className="mx-4 h-[2px] opacity-40 mb-3"
          style={{ background: 'linear-gradient(90deg, transparent 0%, hsl(210, 100%, 55%) 30%, hsl(200, 100%, 55%) 70%, transparent 100%)' }} />

        {/* Middle section - 3 badges */}
        <div className="relative px-3 pb-3">
          <div className="flex gap-2">
            {[
              { label: 'Tendencia', icon: <TrendingUp className="w-5 h-5 text-green-400" />, value: '78%', valueClass: 'text-cyan-200' },
              { label: 'Decisión', icon: <ShieldCheck className="w-5 h-5 text-cyan-400" />, value: 'Compra', valueClass: 'text-green-400' },
              { label: 'Riesgo', icon: <Flame className="w-5 h-5 text-orange-400" />, value: '35%', valueClass: 'text-cyan-200' },
            ].map((badge) =>
              <div key={badge.label}
                className="flex-1 relative rounded-lg overflow-hidden flex flex-col items-center justify-center py-2.5 gap-0.5"
                style={{
                  background: 'linear-gradient(180deg, hsl(210, 100%, 8%) 0%, hsl(200, 80%, 12%) 100%)',
                  border: '1px solid hsla(200, 60%, 35%, 0.3)'
                }}>
                <div className="absolute top-0 left-[15%] right-[15%] h-[1px]"
                  style={{ background: 'radial-gradient(ellipse at center, hsl(195, 100%, 54%) 0%, transparent 70%)' }} />
                <span className="text-[9px] text-cyan-300/60 uppercase tracking-wider">{badge.label}</span>
                <div className="flex items-center gap-1">
                  {badge.icon}
                  <span className={cn("font-bold text-2xl", badge.valueClass)}>{badge.value}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Per-currency impact scoring */}
        <div className="relative px-3 pb-3">
          <p className="text-[10px] text-cyan-300/50 uppercase tracking-widest mb-2 text-center">Impacto por Divisa</p>
          <div className="flex gap-2">
            {impactData.map((d) => <CurrencyImpactPanel key={d.currency} data={d} />)}
          </div>
        </div>

        {/* Entry price bar */}
        <div className="relative mx-3 mb-3 rounded-lg overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, hsl(210, 50%, 10%) 0%, hsl(200, 60%, 14%) 100%)',
            border: '1px solid hsla(200, 60%, 35%, 0.25)'
          }}>
          <div className="absolute top-0 left-[10%] right-[10%] h-[1px]"
            style={{ background: 'radial-gradient(ellipse at center, hsl(195, 100%, 54%) 0%, transparent 70%)' }} />
          <div className="flex items-center justify-between px-4 py-2.5">
            <span className="font-semibold text-white text-sm">Precio de Entrada</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">157.210</span>
              <button className="text-cyan-400/60 hover:text-cyan-300 transition-colors">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* TP / SL bars - always visible */}
        <TakeProfitStopLossSection />

        {/* Candlestick chart with zoom */}
        <CandlestickChart entryPrice={157.210} takeProfit={156.500} stopLoss={158.100} />

        {/* Bottom green BUY accent line */}
        <div className="mx-3 mb-3 h-[3px] rounded-full"
          style={{ background: 'linear-gradient(90deg, hsl(135, 80%, 45%) 0%, hsl(135, 60%, 30%) 30%, hsl(135, 80%, 50%) 60%, hsl(135, 90%, 55%) 100%)' }} />

        {/* Expand toggle button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center py-2 text-cyan-300/60 hover:text-cyan-300 transition-colors">
          <ChevronDown className={cn("w-5 h-5 transition-transform duration-300", expanded && "rotate-180")} />
        </button>

        {/* Expanded content */}
        {expanded &&
          <div className="relative px-3 pb-4 space-y-2 animate-in slide-in-from-top-2 duration-300">
            <div className="h-[1px] mb-3 opacity-30"
              style={{ background: 'linear-gradient(90deg, transparent 0%, hsl(200, 80%, 55%) 50%, transparent 100%)' }} />
          </div>
        }

        {/* Bottom glow */}
        <div className="absolute bottom-0 left-[10%] right-[10%] h-[1px]"
          style={{ background: 'radial-gradient(ellipse at center, hsl(200, 80%, 40%) 0%, transparent 70%)' }} />
      </div>
    </div>
  );
}
