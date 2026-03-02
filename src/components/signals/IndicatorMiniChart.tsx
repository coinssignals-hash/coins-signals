import { useMemo } from 'react';
import type { TimeValue, MACDData } from '@/lib/indicators';

interface RSIPanelProps {
  type: 'rsi';
  data: TimeValue[];
}

interface MACDPanelProps {
  type: 'macd';
  data: MACDData[];
}

type Props = (RSIPanelProps | MACDPanelProps) & { height?: number };

const BG = '#050d1a';
const GRID = '#1e3a5f';
const TEXT = '#64748b';

function buildRSISvg(data: TimeValue[], W: number, H: number): string {
  if (!data.length) return '';
  const PAD = { top: 20, right: 50, bottom: 20, left: 45 };
  const cw = W - PAD.left - PAD.right;
  const ch = H - PAD.top - PAD.bottom;

  const xOf = (i: number) => PAD.left + (i / (data.length - 1)) * cw;
  const yOf = (v: number) => PAD.top + ch * (1 - v / 100);

  const parts: string[] = [];
  parts.push(`<rect width="${W}" height="${H}" fill="${BG}" rx="6"/>`);

  // Label
  parts.push(`<text x="${PAD.left}" y="14" fill="#3b82f6" font-size="10" font-family="monospace" font-weight="bold">RSI (14)</text>`);
  // last value
  const last = data[data.length - 1].value;
  const lastColor = last > 70 ? '#ef4444' : last < 30 ? '#22c55e' : '#3b82f6';
  parts.push(`<text x="${W - PAD.right + 5}" y="14" fill="${lastColor}" font-size="10" font-family="monospace" font-weight="bold">${last.toFixed(1)}</text>`);

  // Zones
  parts.push(`<rect x="${PAD.left}" y="${yOf(70)}" width="${cw}" height="${yOf(30) - yOf(70)}" fill="rgba(59,130,246,0.05)"/>`);

  // Grid lines at 30, 50, 70
  for (const lv of [30, 50, 70]) {
    const y = yOf(lv);
    const col = lv === 50 ? TEXT : (lv === 70 ? '#ef4444' : '#22c55e');
    parts.push(`<line x1="${PAD.left}" y1="${y}" x2="${PAD.left + cw}" y2="${y}" stroke="${col}" stroke-width="0.5" stroke-dasharray="3,3" opacity="0.5"/>`);
    parts.push(`<text x="${PAD.left - 5}" y="${y + 3}" fill="${TEXT}" text-anchor="end" font-size="8" font-family="monospace">${lv}</text>`);
  }

  // RSI line
  const points = data.map((d, i) => `${xOf(i)},${yOf(d.value)}`).join(' ');
  parts.push(`<polyline points="${points}" fill="none" stroke="#3b82f6" stroke-width="1.5"/>`);

  // Border
  parts.push(`<rect width="${W}" height="${H}" fill="none" stroke="${GRID}" stroke-width="0.5" rx="6"/>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">${parts.join('')}</svg>`;
}

function buildMACDSvg(data: MACDData[], W: number, H: number): string {
  if (!data.length) return '';
  const PAD = { top: 20, right: 50, bottom: 20, left: 45 };
  const cw = W - PAD.left - PAD.right;
  const ch = H - PAD.top - PAD.bottom;

  let minV = Infinity, maxV = -Infinity;
  for (const d of data) {
    const vals = [d.macd, d.signal, d.histogram];
    for (const v of vals) { if (v < minV) minV = v; if (v > maxV) maxV = v; }
  }
  const pad = (maxV - minV) * 0.1 || 0.0001;
  minV -= pad; maxV += pad;
  const range = maxV - minV;

  const xOf = (i: number) => PAD.left + (i / (data.length - 1)) * cw;
  const yOf = (v: number) => PAD.top + ch * (1 - (v - minV) / range);

  const parts: string[] = [];
  parts.push(`<rect width="${W}" height="${H}" fill="${BG}" rx="6"/>`);

  // Label
  parts.push(`<text x="${PAD.left}" y="14" fill="#a855f7" font-size="10" font-family="monospace" font-weight="bold">MACD (12,26,9)</text>`);

  // Zero line
  const zeroY = yOf(0);
  parts.push(`<line x1="${PAD.left}" y1="${zeroY}" x2="${PAD.left + cw}" y2="${zeroY}" stroke="${TEXT}" stroke-width="0.5" stroke-dasharray="3,3" opacity="0.5"/>`);
  parts.push(`<text x="${PAD.left - 5}" y="${zeroY + 3}" fill="${TEXT}" text-anchor="end" font-size="8" font-family="monospace">0</text>`);

  // Histogram bars
  const barW = Math.max(1, cw / data.length * 0.6);
  for (let i = 0; i < data.length; i++) {
    const h = data[i].histogram;
    const x = xOf(i);
    const color = h >= 0 ? 'rgba(34,197,94,0.6)' : 'rgba(239,68,68,0.6)';
    const y1 = yOf(h);
    const y2 = zeroY;
    const top = Math.min(y1, y2);
    const height = Math.max(1, Math.abs(y1 - y2));
    parts.push(`<rect x="${x - barW / 2}" y="${top}" width="${barW}" height="${height}" fill="${color}" rx="0.5"/>`);
  }

  // MACD line
  const macdPts = data.map((d, i) => `${xOf(i)},${yOf(d.macd)}`).join(' ');
  parts.push(`<polyline points="${macdPts}" fill="none" stroke="#3b82f6" stroke-width="1.2"/>`);

  // Signal line
  const sigPts = data.map((d, i) => `${xOf(i)},${yOf(d.signal)}`).join(' ');
  parts.push(`<polyline points="${sigPts}" fill="none" stroke="#f59e0b" stroke-width="1.2"/>`);

  // Border
  parts.push(`<rect width="${W}" height="${H}" fill="none" stroke="${GRID}" stroke-width="0.5" rx="6"/>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">${parts.join('')}</svg>`;
}

export function IndicatorMiniChart(props: Props) {
  const { height = 120 } = props;
  const W = 1200;

  const svgStr = useMemo(() => {
    if (props.type === 'rsi') return buildRSISvg(props.data, W, height);
    return buildMACDSvg(props.data, W, height);
  }, [props.type, props.type === 'rsi' ? props.data : (props as MACDPanelProps).data, height]);

  if (!svgStr) return null;

  const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgStr)}`;

  return (
    <img
      src={dataUri}
      alt={props.type === 'rsi' ? 'RSI Indicator' : 'MACD Indicator'}
      className="w-full h-auto block"
      draggable={false}
    />
  );
}
