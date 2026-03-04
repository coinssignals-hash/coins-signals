import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Maximize2, X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { OHLCVCandle } from '@/lib/indicators';
import type { DetectedPattern } from '@/lib/candle-patterns';

interface Props {
  candles: OHLCVCandle[];
  patterns?: DetectedPattern[];
  support?: number;
  resistance?: number;
  ema20?: { time: string; value: number }[];
  ema50?: { time: string; value: number }[];
  symbol?: string;
}

/* ─── helpers ─── */
function isJpy(s: number, r: number) { return s > 10 || r > 10; }
function fmt(n: number, jpy: boolean) { return jpy ? n.toFixed(3) : n.toFixed(5); }

const PATTERN_COLORS: Record<string, string> = {
  bullish: '#22c55e',
  bearish: '#ef4444',
  neutral: '#eab308',
};

const RELIABILITY_SIZE: Record<string, number> = {
  high: 10,
  medium: 7,
  low: 5,
};

function buildChartSvg(
  data: OHLCVCandle[],
  support: number | undefined,
  resistance: number | undefined,
  patterns: DetectedPattern[],
  ema20Data: { time: string; value: number }[],
  ema50Data: { time: string; value: number }[],
): string {
  if (data.length === 0) return '';

  const W = 1200, H = 600;
  const PAD = { top: 30, right: 100, bottom: 50, left: 60 };
  const CX1 = PAD.left, CX2 = W - PAD.right, CW = CX2 - CX1;
  const VOL_Y = 480;
  const PH = VOL_Y - PAD.top;
  const VH = H - PAD.bottom - VOL_Y - 8;

  const BG = '#050d1a';
  const GRID = '#1e3a5f';
  const TEXT = '#64748b';
  const UP = '#22c55e';
  const DN = '#ef4444';

  // Last N candles for clarity
  const visibleData = data.slice(-60);
  const n = visibleData.length;
  const allH = visibleData.map(c => c.high);
  const allL = visibleData.map(c => c.low);
  let minP = Math.min(...allL);
  let maxP = Math.max(...allH);
  if (support !== undefined) minP = Math.min(minP, support);
  if (resistance !== undefined) maxP = Math.max(maxP, resistance);
  const pad = (maxP - minP) * 0.05;
  minP -= pad; maxP += pad;
  const maxVol = Math.max(...visibleData.map(c => c.volume || 0), 1);

  const jpy = isJpy(minP, maxP);
  const xOf = (i: number) => CX1 + (i + 0.5) * (CW / n);
  const yOf = (p: number) => PAD.top + PH * (1 - (p - minP) / (maxP - minP));
  const cw = Math.max(2, CW / n * 0.6);

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="font-family:'JetBrains Mono',monospace">`;
  // BG
  svg += `<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${BG}"/><stop offset="100%" stop-color="#0a1628"/></linearGradient></defs>`;
  svg += `<rect width="${W}" height="${H}" fill="url(#bg)" rx="8"/>`;

  // Grid
  const gridLevels = 6;
  for (let i = 0; i <= gridLevels; i++) {
    const y = PAD.top + (PH / gridLevels) * i;
    const price = maxP - (maxP - minP) * (i / gridLevels);
    svg += `<line x1="${CX1}" y1="${y}" x2="${CX2}" y2="${y}" stroke="${GRID}" stroke-width="0.5" stroke-dasharray="3,3" opacity="0.4"/>`;
    svg += `<text x="${CX2 + 8}" y="${y + 4}" fill="${TEXT}" font-size="10">${fmt(price, jpy)}</text>`;
  }

  // Candles
  visibleData.forEach((c, i) => {
    const x = xOf(i);
    const isUp = c.close >= c.open;
    const color = isUp ? UP : DN;
    const bodyTop = yOf(Math.max(c.open, c.close));
    const bodyBot = yOf(Math.min(c.open, c.close));
    const bodyH = Math.max(1, bodyBot - bodyTop);

    // Wick
    svg += `<line x1="${x}" y1="${yOf(c.high)}" x2="${x}" y2="${yOf(c.low)}" stroke="${color}" stroke-width="1"/>`;
    // Body
    svg += `<rect x="${x - cw / 2}" y="${bodyTop}" width="${cw}" height="${bodyH}" fill="${isUp ? color : color}" rx="1" opacity="${isUp ? 0.9 : 1}"/>`;
  });

  // Volume bars
  visibleData.forEach((c, i) => {
    const x = xOf(i);
    const isUp = c.close >= c.open;
    const vh = (c.volume / maxVol) * VH;
    svg += `<rect x="${x - cw / 2}" y="${VOL_Y + 8 + VH - vh}" width="${cw}" height="${vh}" fill="${isUp ? UP : DN}" opacity="0.3" rx="1"/>`;
  });

  // EMA lines
  const drawEma = (emaData: { time: string; value: number }[], color: string) => {
    if (!emaData.length) return;
    const timeMap = new Map(emaData.map(e => [e.time, e.value]));
    const points: string[] = [];
    visibleData.forEach((c, i) => {
      const val = timeMap.get(c.time);
      if (val !== undefined && val !== null) {
        points.push(`${xOf(i)},${yOf(val)}`);
      }
    });
    if (points.length > 1) {
      svg += `<polyline points="${points.join(' ')}" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.7"/>`;
    }
  };
  drawEma(ema20Data, '#3b82f6');
  drawEma(ema50Data, '#f59e0b');

  // Support & Resistance lines
  if (support !== undefined) {
    const sy = yOf(support);
    svg += `<line x1="${CX1}" y1="${sy}" x2="${CX2}" y2="${sy}" stroke="${DN}" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.8"/>`;
    svg += `<rect x="${CX2 + 4}" y="${sy - 10}" width="90" height="20" fill="${DN}" opacity="0.2" rx="4"/>`;
    svg += `<text x="${CX2 + 8}" y="${sy + 4}" fill="${DN}" font-size="10" font-weight="600">S: ${fmt(support, jpy)}</text>`;
  }
  if (resistance !== undefined) {
    const ry = yOf(resistance);
    svg += `<line x1="${CX1}" y1="${ry}" x2="${CX2}" y2="${ry}" stroke="${UP}" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.8"/>`;
    svg += `<rect x="${CX2 + 4}" y="${ry - 10}" width="90" height="20" fill="${UP}" opacity="0.2" rx="4"/>`;
    svg += `<text x="${CX2 + 8}" y="${ry + 4}" fill="${UP}" font-size="10" font-weight="600">R: ${fmt(resistance, jpy)}</text>`;
  }

  // Pattern markers
  const firstTime = visibleData[0]?.time;
  const timeToIdx = new Map(visibleData.map((c, i) => [c.time, i]));

  patterns.forEach(p => {
    const idx = timeToIdx.get(p.time);
    if (idx === undefined) return;
    const candle = visibleData[idx];
    const color = PATTERN_COLORS[p.type] || '#eab308';
    const size = RELIABILITY_SIZE[p.reliability] || 7;
    const markerY = p.type === 'bullish' ? yOf(candle.low) + 14 : yOf(candle.high) - 14;
    const x = xOf(idx);

    // Diamond marker
    svg += `<g>`;
    svg += `<polygon points="${x},${markerY - size} ${x + size},${markerY} ${x},${markerY + size} ${x - size},${markerY}" fill="${color}" opacity="0.85"/>`;
    svg += `<polygon points="${x},${markerY - size} ${x + size},${markerY} ${x},${markerY + size} ${x - size},${markerY}" fill="none" stroke="${color}" stroke-width="1" opacity="0.5"/>`;
    // Label
    const labelY = p.type === 'bullish' ? markerY + size + 12 : markerY - size - 4;
    svg += `<text x="${x}" y="${labelY}" text-anchor="middle" fill="${color}" font-size="8" font-weight="500" opacity="0.9">${p.name.slice(0, 12)}</text>`;
    svg += `</g>`;
  });

  // X-axis time labels
  const step = Math.max(1, Math.floor(n / 12));
  for (let i = 0; i < n; i += step) {
    const c = visibleData[i];
    const d = new Date(c.time);
    const dd = String(d.getDate()).padStart(2, '0');
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const label = `${dd}/${mo} ${hh}:${mm}`;
    svg += `<text x="${xOf(i)}" y="${H - 8}" text-anchor="middle" fill="${TEXT}" font-size="9">${label}</text>`;
  }

  svg += `</svg>`;
  return svg;
}

export function AIChartPanel({ candles, patterns = [], support, resistance, ema20, ema50, symbol }: Props) {
  const [fullscreen, setFullscreen] = useState(false);
  const [showPatterns, setShowPatterns] = useState(true);

  const filteredPatterns = showPatterns ? patterns : [];

  const svgStr = useMemo(() => {
    return buildChartSvg(candles, support, resistance, filteredPatterns, ema20 || [], ema50 || []);
  }, [candles, support, resistance, filteredPatterns, ema20, ema50]);

  const svgDataUri = svgStr ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgStr)}` : null;

  const jpy = (support && support > 10) || (resistance && resistance > 10);

  const bullishPatterns = patterns.filter(p => p.type === 'bullish');
  const bearishPatterns = patterns.filter(p => p.type === 'bearish');
  const neutralPatterns = patterns.filter(p => p.type === 'neutral');

  const chartContent = (
    <div className="space-y-2">
      {svgDataUri ? (
        <img src={svgDataUri} alt={`Gráfico ${symbol}`} className="w-full h-auto block rounded-lg" draggable={false} />
      ) : (
        <div className="h-52 rounded-lg bg-card flex items-center justify-center">
          <span className="text-sm text-muted-foreground">Sin datos</span>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-[10px] px-1">
        {support !== undefined && (
          <div className="flex items-center gap-1">
            <div className="w-4 h-0.5 border-t-2 border-dashed border-destructive" />
            <span className="text-destructive">Soporte {fmt(support, !!jpy)}</span>
          </div>
        )}
        {resistance !== undefined && (
          <div className="flex items-center gap-1">
            <div className="w-4 h-0.5 border-t-2 border-dashed" style={{ borderColor: '#22c55e' }} />
            <span style={{ color: '#22c55e' }}>Resistencia {fmt(resistance, !!jpy)}</span>
          </div>
        )}
        {ema20 && ema20.length > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-4 h-0.5 bg-primary" />
            <span className="text-primary">EMA 20</span>
          </div>
        )}
        {ema50 && ema50.length > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-4 h-0.5 bg-accent" />
            <span className="text-accent">EMA 50</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Chart Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Gráfico de Velas {symbol && `— ${symbol}`}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowPatterns(!showPatterns)}
            className={cn(
              "px-2 py-1 rounded text-[10px] font-medium transition-colors",
              showPatterns ? "bg-primary/10 text-primary" : "bg-secondary/50 text-muted-foreground"
            )}
          >
            Patrones {patterns.length > 0 && `(${patterns.length})`}
          </button>
          <button
            onClick={() => setFullscreen(true)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-xl overflow-hidden border border-border">
        {chartContent}
      </div>

      {/* Detected Patterns Summary */}
      {patterns.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Patrones Detectados ({patterns.length})
          </h4>
          <div className="grid gap-1.5">
            {/* Bullish */}
            {bullishPatterns.map((p, i) => (
              <div key={`b-${i}`} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border">
                <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#22c55e' }} />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-foreground">{p.name}</span>
                  {p.japaneseName && <span className="text-[10px] text-muted-foreground ml-1">({p.japaneseName})</span>}
                </div>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                  p.reliability === 'high' ? 'bg-bullish/10 text-bullish' :
                  p.reliability === 'medium' ? 'bg-accent/10 text-accent' :
                  'bg-secondary text-muted-foreground'
                )}>
                  {p.reliability}
                </span>
              </div>
            ))}
            {/* Bearish */}
            {bearishPatterns.map((p, i) => (
              <div key={`r-${i}`} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border">
                <TrendingDown className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-foreground">{p.name}</span>
                  {p.japaneseName && <span className="text-[10px] text-muted-foreground ml-1">({p.japaneseName})</span>}
                </div>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                  p.reliability === 'high' ? 'bg-destructive/10 text-destructive' :
                  p.reliability === 'medium' ? 'bg-accent/10 text-accent' :
                  'bg-secondary text-muted-foreground'
                )}>
                  {p.reliability}
                </span>
              </div>
            ))}
            {/* Neutral */}
            {neutralPatterns.map((p, i) => (
              <div key={`n-${i}`} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border">
                <Minus className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-foreground">{p.name}</span>
                  {p.japaneseName && <span className="text-[10px] text-muted-foreground ml-1">({p.japaneseName})</span>}
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-secondary text-muted-foreground">
                  {p.reliability}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fullscreen Dialog */}
      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="max-w-[95vw] w-full h-[90vh] p-4 bg-background border-border">
          <DialogTitle className="text-foreground text-sm flex items-center justify-between">
            <span>Gráfico {symbol}</span>
            <button onClick={() => setFullscreen(false)} className="p-1 rounded hover:bg-secondary">
              <X className="w-5 h-5" />
            </button>
          </DialogTitle>
          <div className="flex-1 overflow-auto">
            {chartContent}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
