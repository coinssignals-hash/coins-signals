import { useState } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, ShieldCheck, Flame, Copy, TrendingDown, Minus, ChevronDown } from 'lucide-react';
import bullBg from '@/assets/bull-card-bg.svg';
import currencyIcon from '@/assets/jpy-usd-icon.svg';

interface SignalCardV2Props {
  className?: string;
}

interface CurrencyImpact {
  currency: string;
  positive: number;
  negative: number;
  neutral: number;
}

function ImpactBar({ label, value, color }: {label: string;value: number;color: string;}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] w-16 text-right" style={{ color }}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, background: color }} />

      </div>
      <span className="text-[11px] font-semibold w-9 text-right" style={{ color }}>{value}%</span>
    </div>);

}

function CurrencyImpactPanel({ data }: {data: CurrencyImpact;}) {
  const overall = data.positive > data.negative ? 'Positive' : data.negative > data.positive ? 'Negative' : 'Neutral';
  const overallColor = overall === 'Positive' ? 'hsl(135, 70%, 50%)' : overall === 'Negative' ? 'hsl(0, 70%, 55%)' : 'hsl(45, 80%, 55%)';
  const OverallIcon = overall === 'Positive' ? TrendingUp : overall === 'Negative' ? TrendingDown : Minus;

  return (
    <div
      className="flex-1 rounded-lg p-2.5 relative overflow-hidden"
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
    </div>);

}

// Individual price row bar matching the reference design
function PriceRow({ label, value }: {label: string;value: string;}) {
  return (
    <div
      className="relative rounded-md overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, hsl(0, 0%, 0%) 0%, hsl(205, 80%, 8%) 100%)',
        border: '1px solid hsla(210, 100%, 50%, 0.15)'
      }}>

      {/* Top cyan glow line */}
      <div className="absolute top-0 left-[10%] right-[10%] h-[1px]"
      style={{ background: 'radial-gradient(ellipse at center, hsl(200, 100%, 50%) 0%, transparent 70%)' }} />

      {/* Blue side glow */}
      <div className="absolute inset-0 pointer-events-none"
      style={{ background: 'linear-gradient(90deg, hsla(215, 100%, 50%, 0.15) 0%, transparent 80%)' }} />

      <div className="flex items-center justify-between px-4 py-2.5">
        <span className="font-semibold text-white text-2xl">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-bold text-white text-2xl">{value}</span>
          <button className="text-cyan-400/60 hover:text-cyan-300 transition-colors">
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>);

}

// Take Profit / Stop Loss section with 3 bars
function TakeProfitStopLossSection() {
  return (
    <div className="space-y-2">
      <PriceRow label="Take Profit 1" value="158.450" />
      <PriceRow label="Take Profit 2" value="159.100" />
      <PriceRow label="Stop Loss" value="156.320" />
    </div>);

}

// Placeholder section for the expanded card
function ExpandedSection({ label }: {label: string;}) {
  return (
    <div
      className="rounded-lg overflow-hidden relative"
      style={{
        background: 'linear-gradient(180deg, hsl(210, 100%, 8%) 0%, hsl(200, 80%, 12%) 100%)',
        border: '1px solid hsla(200, 60%, 35%, 0.25)'
      }}>

      <div className="absolute top-0 left-[10%] right-[10%] h-[1px]"
      style={{ background: 'radial-gradient(ellipse at center, hsl(195, 100%, 54%) 0%, transparent 70%)' }} />

      <div className="px-4 py-3">
        <span className="text-[10px] text-cyan-300/50 uppercase tracking-widest">{label}</span>
      </div>
      <div className="h-20" />
    </div>);

}

export function SignalCardV2({ className }: SignalCardV2Props) {
  const [expanded, setExpanded] = useState(false);

  const impactData: CurrencyImpact[] = [
  { currency: 'USD', positive: 62, negative: 23, neutral: 15 },
  { currency: 'JPY', positive: 28, negative: 51, neutral: 21 }];


  const expandedSections = [
  'Indicadores Técnicos',
  'Análisis de Tendencia',
  'Niveles Clave',
  'Sesión de Mercado',
  'Noticias Relacionadas'];


  return (
    <div className={cn("relative w-full rounded-xl overflow-hidden", className)}>
      <div className="relative rounded-xl border border-cyan-800/30 overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at center 40%, hsl(200, 100%, 15%) 0%, hsl(205, 100%, 7%) 70%, hsl(210, 100%, 5%) 100%)'
      }}>

        {/* Bull background overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
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
            {/* Overlapping circular flags like reference */}
            <div className="relative w-20 h-16 flex-shrink-0">
              {/* USD flag - left/back */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full overflow-hidden border-2 border-white/20 shadow-lg z-10">
                <img src="https://flagcdn.com/w160/us.png" alt="USD" className="w-full h-full object-cover" />
              </div>
              {/* JPY flag - right/front */}
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
            { label: 'Riesgo', icon: <Flame className="w-5 h-5 text-orange-400" />, value: '35%', valueClass: 'text-cyan-200' }].
            map((badge) =>
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
            {impactData.map((d) =>
            <CurrencyImpactPanel key={d.currency} data={d} />
            )}
          </div>
        </div>

        {/* Bottom bar - entry price */}
        <div className="relative mx-3 mb-3 rounded-lg overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, hsl(210, 50%, 10%) 0%, hsl(200, 60%, 14%) 100%)',
          border: '1px solid hsla(200, 60%, 35%, 0.25)'
        }}>

          <div className="absolute top-0 left-[10%] right-[10%] h-[1px]"
          style={{ background: 'radial-gradient(ellipse at center, hsl(195, 100%, 54%) 0%, transparent 70%)' }} />

          <div className="flex items-center justify-between px-4 py-2.5">
            <span className="font-semibold text-white text-2xl">Precio de Entrada</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-2xl">157.210</span>
              <button className="text-cyan-400/60 hover:text-cyan-300 transition-colors">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

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
            {/* Separator */}
            <div className="h-[1px] mb-3 opacity-30"
          style={{ background: 'linear-gradient(90deg, transparent 0%, hsl(200, 80%, 55%) 50%, transparent 100%)' }} />

            <TakeProfitStopLossSection />
            {expandedSections.map((section) =>
          <ExpandedSection key={section} label={section} />
          )}
          </div>
        }

        {/* Bottom glow */}
        <div className="absolute bottom-0 left-[10%] right-[10%] h-[1px]"
        style={{ background: 'radial-gradient(ellipse at center, hsl(200, 80%, 40%) 0%, transparent 70%)' }} />

      </div>
    </div>);

}