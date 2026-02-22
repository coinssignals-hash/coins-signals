import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { AlertState } from '@/hooks/useSupportResistanceAlerts';

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface CandlestickChartProps {
  data: CandleData[];
  resistance: number;
  support: number;
  loading?: boolean;
  realtimePrice?: number | null;
  isRealtimeConnected?: boolean;
  previousDayDate?: string;
  alertState?: AlertState;
}

interface TooltipData {
  x: number;
  y: number;
  candle: CandleData;
  isUp: boolean;
}

interface CandlePosition {
  x: number;
  width: number;
  candle: CandleData;
  isUp: boolean;
}

interface CrosshairData {
  x: number;
  y: number;
  price: number;
  time: string;
}

interface ChartDimensions {
  width: number;
  height: number;
  chartWidth: number;
  chartHeight: number;
  minPrice: number;
  maxPrice: number;
  priceRange: number;
}

/* ─────── helpers ─────── */

function dayKey(ts: string): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function isJpyPair(s: number, r: number): boolean {
  return s > 10 || r > 10;
}

function fmtPrice(n: number, jpy: boolean): string {
  return jpy ? n.toFixed(3) : n.toFixed(5);
}

/* Volume ratio at the bottom of the chart */
const VOLUME_RATIO = 0.18;
const VOL_GAP = 8;

export function CandlestickChart({
  data,
  resistance,
  support,
  loading,
  realtimePrice,
  isRealtimeConnected = false,
  previousDayDate,
  alertState,
}: CandlestickChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const crosshairCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [crosshair, setCrosshair] = useState<CrosshairData | null>(null);
  const candlePositionsRef = useRef<CandlePosition[]>([]);
  const chartDimensionsRef = useRef<ChartDimensions | null>(null);
  const paddingRef = useRef({ top: 30, right: 20, bottom: 40, left: 60 });
  const animationFrameRef = useRef<number | null>(null);
  const pulsePhaseRef = useRef(0);

  // ── proximity info (for alert glow) ──
  const getProximityInfo = useCallback(() => {
    if (!realtimePrice || support <= 0 || resistance <= 0) {
      return { nearSupport: false, nearResistance: false, supportDistance: 0, resistanceDistance: 0 };
    }
    const range = resistance - support;
    if (range <= 0) return { nearSupport: false, nearResistance: false, supportDistance: 0, resistanceDistance: 0 };
    const threshold = range * 0.10;
    const dR = resistance - realtimePrice;
    const dS = realtimePrice - support;
    return {
      nearSupport: dS <= threshold && dS >= 0,
      nearResistance: dR <= threshold && dR >= 0,
      supportDistance: Math.max(0, 1 - dS / threshold),
      resistanceDistance: Math.max(0, 1 - dR / threshold),
      breakoutSupport: realtimePrice < support,
      breakoutResistance: realtimePrice > resistance,
    };
  }, [realtimePrice, support, resistance]);

  /* ═══════════════════════════════════════════════════════
   *  MAIN DRAW
   * ═══════════════════════════════════════════════════════ */
  const drawChart = useCallback(
    (pulsePhase: number = 0) => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container || !data.length) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const proximity = getProximityInfo();
      const jpy = isJpyPair(support, resistance);

      // Canvas sizing
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);

      const W = rect.width;
      const H = rect.height;
      const pad = paddingRef.current;
      const CHART_W = W - pad.left - pad.right;
      const TOTAL_H = H - pad.top - pad.bottom;
      const VOLUME_H = TOTAL_H * VOLUME_RATIO;
      const CANDLE_H = TOTAL_H - VOLUME_H - VOL_GAP;

      // ── Background gradient ──
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, '#050d1a');
      bgGrad.addColorStop(1, '#0a1628');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Rounded border
      ctx.strokeStyle = '#1e3a5f';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(0.5, 0.5, W - 1, H - 1, 8);
      ctx.stroke();

      // ── Price range ──
      let minP = Infinity, maxP = -Infinity;
      for (const c of data) { if (c.low < minP) minP = c.low; if (c.high > maxP) maxP = c.high; }
      if (realtimePrice) { minP = Math.min(minP, realtimePrice); maxP = Math.max(maxP, realtimePrice); }
      // Include S/R
      minP = Math.min(minP, support);
      maxP = Math.max(maxP, resistance);
      const priceRange = maxP - minP || 0.0001;
      const pricePad = priceRange * 0.05;
      minP -= pricePad;
      maxP += pricePad;
      const totalRange = maxP - minP;

      // ── Mock volume (sine-ish pattern per candle) ──
      const volumes = data.map((_, i) => 50 + Math.abs(Math.sin(i * 0.3)) * 100 + Math.random() * 30);
      let maxVol = 0;
      for (const v of volumes) if (v > maxVol) maxVol = v;
      if (maxVol === 0) maxVol = 1;

      // Store dimensions
      chartDimensionsRef.current = { width: W, height: H, chartWidth: CHART_W, chartHeight: CANDLE_H, minPrice: minP, maxPrice: maxP, priceRange: totalRange };

      // ── Helper fns ──
      const yOf = (price: number) => pad.top + CANDLE_H * (1 - (price - minP) / totalRange);
      const xOf = (i: number) => pad.left + (i + 0.5) * (CHART_W / data.length);
      const volY = (vol: number) => {
        const volTop = pad.top + CANDLE_H + VOL_GAP;
        const h = (vol / maxVol) * VOLUME_H;
        return { y: volTop + VOLUME_H - h, h };
      };

      const candleWidth = CHART_W / data.length;
      const bodyW = Math.max(1, Math.min(8, candleWidth * 0.65));

      // ── Identify last day ──
      const lastDayStr = dayKey(data[data.length - 1].time);

      // ── Grid lines (6 levels in candle area) ──
      ctx.textAlign = 'end';
      ctx.textBaseline = 'middle';
      for (let i = 0; i <= 6; i++) {
        const price = minP + (totalRange * i) / 6;
        const y = yOf(price);
        ctx.strokeStyle = '#1e3a5f';
        ctx.lineWidth = 0.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(W - pad.right, y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#64748b';
        ctx.font = '9px monospace';
        ctx.fillText(fmtPrice(price, jpy), pad.left - 5, y);
      }

      // ── Volume separator ──
      const volSepY = pad.top + CANDLE_H + VOL_GAP / 2;
      ctx.strokeStyle = '#1e3a5f';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(pad.left, volSepY);
      ctx.lineTo(W - pad.right, volSepY);
      ctx.stroke();

      // VOL label
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'start';
      ctx.fillText('VOL', pad.left + 4, pad.top + CANDLE_H + VOL_GAP + 11);

      // ── Day separators + day labels ──
      let prevDay = '';
      ctx.textAlign = 'start';
      for (let i = 0; i < data.length; i++) {
        const dk = dayKey(data[i].time);
        if (dk !== prevDay) {
          const x = pad.left + i * candleWidth;
          ctx.strokeStyle = '#1e3a5f';
          ctx.lineWidth = 0.5;
          ctx.setLineDash([2, 6]);
          ctx.beginPath();
          ctx.moveTo(x, pad.top);
          ctx.lineTo(x, H - pad.bottom);
          ctx.stroke();
          ctx.setLineDash([]);

          const d = new Date(data[i].time);
          const label = `${DAY_NAMES[d.getDay()]} ${d.getDate()}`;
          ctx.fillStyle = '#64748b';
          ctx.font = '9px sans-serif';
          ctx.fillText(label, x + 4, H - pad.bottom + 14);
          prevDay = dk;
        }
      }

      // ── Last day highlight background ──
      const firstLastDayIdx = data.findIndex(c => dayKey(c.time) === lastDayStr);
      if (firstLastDayIdx >= 0) {
        const x1 = pad.left + firstLastDayIdx * candleWidth;
        const x2 = W - pad.right;
        ctx.fillStyle = 'rgba(34,197,94,0.03)';
        ctx.fillRect(x1, pad.top, x2 - x1, CANDLE_H);
      }

      // ── Candles + Volume bars ──
      const positions: CandlePosition[] = [];

      for (let i = 0; i < data.length; i++) {
        const c = data[i];
        const x = xOf(i);
        const isLastDay = dayKey(c.time) === lastDayStr;
        const isUp = c.close >= c.open;

        const bodyTop = yOf(Math.max(c.open, c.close));
        const bodyBot = yOf(Math.min(c.open, c.close));
        const bH = Math.max(1, bodyBot - bodyTop);
        const wickTop = yOf(c.high);
        const wickBot = yOf(c.low);

        // Colors: last day vivid, older dimmed
        let upCol: string, dnCol: string, wickCol: string;
        if (isLastDay) {
          upCol = '#22c55e';
          dnCol = '#ef4444';
          wickCol = isUp ? '#22c55e' : '#ef4444';
        } else {
          upCol = 'rgba(34,197,94,0.35)';
          dnCol = 'rgba(239,68,68,0.35)';
          wickCol = 'rgba(148,163,184,0.3)';
        }

        const fillCol = isUp ? upCol : dnCol;

        // Wick
        ctx.strokeStyle = wickCol;
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(x, wickTop);
        ctx.lineTo(x, wickBot);
        ctx.stroke();

        // Body
        ctx.fillStyle = fillCol;
        ctx.fillRect(x - bodyW / 2, bodyTop, bodyW, bH);

        positions.push({ x: x - bodyW / 2, width: bodyW, candle: c, isUp });

        // Volume bar
        const vol = volumes[i];
        const { y: vy, h: vh } = volY(vol);
        const volColor = isLastDay
          ? (isUp ? 'rgba(34,197,94,0.6)' : 'rgba(239,68,68,0.6)')
          : (isUp ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)');
        ctx.fillStyle = volColor;
        ctx.fillRect(x - bodyW / 2, vy, bodyW, Math.max(1, vh));
      }

      candlePositionsRef.current = positions;

      // ── S/R lines — only span the last day ──
      const srX1 = firstLastDayIdx >= 0 ? pad.left + firstLastDayIdx * candleWidth : pad.left;
      const srX2 = W - pad.right;
      const labelW = 80;
      const labelH = 18;
      const srFontSize = 10;
      const srLineW = 1.5;

      const pulseValue = (Math.sin(pulsePhase) + 1) / 2;
      const isNearRes = proximity.nearResistance || proximity.breakoutResistance;
      const isNearSup = proximity.nearSupport || proximity.breakoutSupport;

      // Resistance
      const rY = yOf(resistance);
      if (isNearRes) {
        const glowI = proximity.breakoutResistance ? 1 : proximity.resistanceDistance;
        ctx.save();
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = (8 + pulseValue * 6) * glowI;
        ctx.strokeStyle = `rgba(34,197,94,${0.3 + pulseValue * 0.4 * glowI})`;
        ctx.lineWidth = 4 + pulseValue * 2;
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(srX1, rY); ctx.lineTo(srX2, rY); ctx.stroke();
        ctx.restore();
      }
      ctx.strokeStyle = isNearRes ? '#4ade80' : '#22c55e';
      ctx.lineWidth = srLineW;
      ctx.setLineDash([8, 4]);
      ctx.beginPath(); ctx.moveTo(srX1, rY); ctx.lineTo(srX2, rY); ctx.stroke();
      ctx.setLineDash([]);
      // Resistance label pill
      const rLabelX = srX2 - labelW - 4;
      ctx.fillStyle = 'rgba(34,197,94,0.15)';
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.roundRect(rLabelX, rY - labelH / 2, labelW, labelH, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#22c55e';
      ctx.font = `bold ${srFontSize}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(fmtPrice(resistance, jpy), rLabelX + labelW / 2, rY + srFontSize / 3);

      // Support
      const sY = yOf(support);
      if (isNearSup) {
        const glowI = proximity.breakoutSupport ? 1 : proximity.supportDistance;
        ctx.save();
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = (8 + pulseValue * 6) * glowI;
        ctx.strokeStyle = `rgba(239,68,68,${0.3 + pulseValue * 0.4 * glowI})`;
        ctx.lineWidth = 4 + pulseValue * 2;
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(srX1, sY); ctx.lineTo(srX2, sY); ctx.stroke();
        ctx.restore();
      }
      ctx.strokeStyle = isNearSup ? '#f87171' : '#ef4444';
      ctx.lineWidth = srLineW;
      ctx.setLineDash([8, 4]);
      ctx.beginPath(); ctx.moveTo(srX1, sY); ctx.lineTo(srX2, sY); ctx.stroke();
      ctx.setLineDash([]);
      // Support label pill
      const sLabelX = srX2 - labelW - 4;
      ctx.fillStyle = 'rgba(239,68,68,0.15)';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.roundRect(sLabelX, sY - labelH / 2, labelW, labelH, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.font = `bold ${srFontSize}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(fmtPrice(support, jpy), sLabelX + labelW / 2, sY + srFontSize / 3);

      // ── Realtime price line ──
      if (realtimePrice) {
        const rtY = yOf(realtimePrice);
        ctx.strokeStyle = isRealtimeConnected ? '#3b82f6' : '#6366f1';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 2]);
        ctx.beginPath(); ctx.moveTo(pad.left, rtY); ctx.lineTo(W - pad.right, rtY); ctx.stroke();
        ctx.setLineDash([]);

        // badge
        const bw = 70, bh = 18;
        ctx.fillStyle = isRealtimeConnected ? '#3b82f6' : '#6366f1';
        ctx.beginPath(); ctx.roundRect(W - pad.right - bw - 4, rtY - bh / 2, bw, bh, 4); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText((isRealtimeConnected ? '● ' : '') + fmtPrice(realtimePrice, jpy), W - pad.right - bw / 2 - 4, rtY + 3);
      }
    },
    [data, resistance, support, realtimePrice, isRealtimeConnected, getProximityInfo],
  );

  // Animation loop
  useEffect(() => {
    const prox = getProximityInfo();
    const needsAnim = prox.nearSupport || prox.nearResistance || prox.breakoutSupport || prox.breakoutResistance;
    if (needsAnim) {
      const animate = () => {
        pulsePhaseRef.current += 0.1;
        drawChart(pulsePhaseRef.current);
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animationFrameRef.current = requestAnimationFrame(animate);
      return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
    } else {
      drawChart(0);
    }
  }, [drawChart, getProximityInfo]);

  // ── Crosshair on separate canvas ──
  const drawCrosshair = useCallback((mouseX: number, mouseY: number) => {
    const canvas = crosshairCanvasRef.current;
    const container = containerRef.current;
    const dims = chartDimensionsRef.current;
    if (!canvas || !container || !dims || !data.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const r = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = r.width * dpr;
    canvas.height = r.height * dpr;
    canvas.style.width = `${r.width}px`;
    canvas.style.height = `${r.height}px`;
    ctx.scale(dpr, dpr);

    const pad = paddingRef.current;
    if (mouseX < pad.left || mouseX > dims.width - pad.right || mouseY < pad.top || mouseY > dims.height - pad.bottom) return;

    const priceAtCursor = dims.maxPrice - ((mouseY - pad.top) / dims.chartHeight) * dims.priceRange;
    const cw = dims.chartWidth / data.length;
    const idx = Math.max(0, Math.min(data.length - 1, Math.floor((mouseX - pad.left) / cw)));
    const candle = data[idx];
    const timeStr = candle?.time.split(' ')[1]?.substring(0, 5) || candle?.time.substring(11, 16) || '';

    // Vertical line
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(mouseX, pad.top); ctx.lineTo(mouseX, dims.height - pad.bottom); ctx.stroke();
    // Horizontal line
    ctx.beginPath(); ctx.moveTo(pad.left, mouseY); ctx.lineTo(dims.width - pad.right, mouseY); ctx.stroke();
    ctx.setLineDash([]);

    // Price label
    const jpy = isJpyPair(support, resistance);
    ctx.fillStyle = '#3b82f6';
    const plW = 55, plH = 18;
    ctx.fillRect(0, mouseY - plH / 2, plW, plH);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(fmtPrice(priceAtCursor, jpy), plW / 2, mouseY + 3);

    // Time label
    ctx.fillStyle = '#3b82f6';
    const tlW = 45, tlH = 16;
    ctx.fillRect(mouseX - tlW / 2, dims.height - pad.bottom + 2, tlW, tlH);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(timeStr, mouseX, dims.height - pad.bottom + 13);

    return { price: priceAtCursor, time: timeStr };
  }, [data, support, resistance]);

  const clearCrosshair = useCallback(() => {
    const c = crosshairCanvasRef.current;
    if (c) { const ctx = c.getContext('2d'); if (ctx) ctx.clearRect(0, 0, c.width, c.height); }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container || !candlePositionsRef.current.length) return;
    const r = container.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;

    const info = drawCrosshair(x, y);
    if (info) setCrosshair({ x, y, price: info.price, time: info.time });
    else { setCrosshair(null); clearCrosshair(); }

    const hovered = candlePositionsRef.current.find(p => x >= p.x && x <= p.x + p.width);
    setTooltip(hovered ? { x, y, candle: hovered.candle, isUp: hovered.isUp } : null);
  }, [drawCrosshair, clearCrosshair]);

  const handleMouseLeave = useCallback(() => {
    setTooltip(null); setCrosshair(null); clearCrosshair();
  }, [clearCrosshair]);

  /* ─── Loading ─── */
  if (loading) {
    return (
      <div className="bg-[#050d1a] border border-slate-700/50 rounded-lg p-4 animate-pulse">
        <div className="h-80 bg-cyan-900/10 rounded" />
      </div>
    );
  }

  /* ─── Alert styles ─── */
  const getAlertStyles = () => {
    if (!alertState?.isActive) return null;
    const isRes = alertState.type === 'resistance' || alertState.type === 'breakout-resistance';
    const isCrit = alertState.level === 'critical';
    return {
      borderColor: isRes ? 'border-green-500' : 'border-red-500',
      glowColor: isRes
        ? (isCrit ? 'shadow-[0_0_30px_rgba(34,197,94,0.6)]' : 'shadow-[0_0_20px_rgba(34,197,94,0.4)]')
        : (isCrit ? 'shadow-[0_0_30px_rgba(239,68,68,0.6)]' : 'shadow-[0_0_20px_rgba(239,68,68,0.4)]'),
      bgPulse: isRes ? 'bg-green-500/10' : 'bg-red-500/10',
      label: alertState.type?.startsWith('breakout-')
        ? (isRes ? '🚀 RUPTURA RESISTENCIA' : '📉 RUPTURA SOPORTE')
        : (isRes ? '⚠️ CERCA DE RESISTENCIA' : '⚠️ CERCA DE SOPORTE'),
      labelBg: isRes ? 'bg-green-500' : 'bg-red-500',
    };
  };

  const alertStyles = getAlertStyles();

  return (
    <div
      className={cn(
        'rounded-lg p-3 transition-all duration-300 relative overflow-hidden',
        alertStyles
          ? `${alertStyles.borderColor} ${alertStyles.glowColor} border-2`
          : 'border border-slate-700/50',
      )}
      style={{ background: 'linear-gradient(180deg, #050d1a 0%, #0a1628 100%)' }}
    >
      {/* Alert overlay */}
      {alertStyles && (
        <>
          <div className={cn('absolute inset-0 animate-pulse pointer-events-none', alertStyles.bgPulse)} />
          <div className={cn('absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-xs font-bold text-white animate-bounce z-20', alertStyles.labelBg)}>
            {alertStyles.label}
          </div>
        </>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-2 relative z-10">
        <div className="flex items-center gap-2">
          <h3 className="text-white font-semibold text-sm">Velas Japonesas — Última Semana</h3>
          {previousDayDate && (
            <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded">{previousDayDate}</span>
          )}
        </div>
        {isRealtimeConnected && realtimePrice && (
          <div className="flex items-center gap-2 bg-blue-500/20 px-2 py-1 rounded-full">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-xs text-blue-400 font-medium">LIVE: {realtimePrice.toFixed(5)}</span>
          </div>
        )}
      </div>

      {/* Canvas area */}
      <div ref={containerRef} className="h-80 relative z-10" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
        <canvas ref={canvasRef} className="w-full h-full absolute inset-0" />
        <canvas ref={crosshairCanvasRef} className="w-full h-full absolute inset-0 pointer-events-none cursor-crosshair" />

        {/* OHLC Tooltip */}
        {tooltip && (
          <div
            className="absolute z-50 pointer-events-none"
            style={{
              left: Math.min(tooltip.x + 10, (containerRef.current?.clientWidth || 300) - 160),
              top: Math.max(tooltip.y - 100, 10),
            }}
          >
            <div className="bg-[#0f172a] border border-slate-600 rounded-lg p-3 shadow-xl min-w-[140px]">
              <div className="text-xs text-slate-400 mb-2 font-medium">
                {tooltip.candle.time.split(' ')[1]?.substring(0, 5) || tooltip.candle.time.substring(11, 16)}
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-slate-400">Open:</span><span className="text-white font-mono">{tooltip.candle.open.toFixed(5)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">High:</span><span className="text-green-400 font-mono">{tooltip.candle.high.toFixed(5)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Low:</span><span className="text-red-400 font-mono">{tooltip.candle.low.toFixed(5)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Close:</span><span className={cn('font-mono font-semibold', tooltip.isUp ? 'text-green-400' : 'text-red-400')}>{tooltip.candle.close.toFixed(5)}</span></div>
              </div>
              <div className={cn('mt-2 pt-2 border-t border-slate-700 text-xs font-medium text-center', tooltip.isUp ? 'text-green-400' : 'text-red-400')}>
                {tooltip.isUp ? '▲ Alcista' : '▼ Bajista'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex justify-between text-xs flex-wrap gap-2 mt-2 relative z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 border-t-2 border-dashed border-green-500" />
            <span className="text-green-400">Resistencia 24h</span>
            <span className="font-mono font-semibold text-green-300 bg-green-500/20 px-1.5 py-0.5 rounded">{resistance.toFixed(5)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 border-t-2 border-dashed border-red-500" />
            <span className="text-red-400">Soporte 24h</span>
            <span className="font-mono font-semibold text-red-300 bg-red-500/20 px-1.5 py-0.5 rounded">{support.toFixed(5)}</span>
          </div>
        </div>
        {realtimePrice && (
          <div className="flex items-center gap-1">
            <div className={cn('w-2 h-2 rounded-full', isRealtimeConnected ? 'bg-blue-500 animate-pulse' : 'bg-indigo-500')} />
            <span className={isRealtimeConnected ? 'text-blue-400' : 'text-indigo-400'}>Actual {realtimePrice.toFixed(5)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
