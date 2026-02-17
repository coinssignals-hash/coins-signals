import { cn } from '@/lib/utils';
import { TrendingUp, ShieldCheck, Flame, Copy } from 'lucide-react';
import bullBg from '@/assets/bull-card-bg.svg';
import currencyIcon from '@/assets/jpy-usd-icon.svg';

interface SignalCardV2Props {
  className?: string;
}

export function SignalCardV2({ className }: SignalCardV2Props) {
  return (
    <div className={cn("relative w-full rounded-xl overflow-hidden", className)}>
      <div className="relative rounded-xl border border-cyan-800/30 overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse at center 40%, hsl(200, 100%, 15%) 0%, hsl(205, 100%, 7%) 70%, hsl(210, 100%, 5%) 100%)',
        }}
      >
        {/* Bull background overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${bullBg})`,
            backgroundSize: '55%',
            backgroundPosition: '65% center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.3,
            mixBlendMode: 'screen',
          }}
        />

        {/* Top glow line */}
        <div className="absolute top-0 left-[15%] right-[15%] h-[1px]"
          style={{
            background: 'radial-gradient(ellipse at center, hsl(200, 80%, 55%) 0%, transparent 70%)',
          }}
        />

        {/* Date header */}
        <div className="relative text-center pt-3 pb-1">
          <span className="text-[11px] text-cyan-300/70 tracking-wide">
            Jueves 08 Octubre 2025 12:48:35
          </span>
        </div>

        {/* Upper section - currency pair */}
        <div className="relative px-4 pt-1 pb-3 flex items-center justify-between">
          {/* Left: currency icon + pair name */}
          <div className="flex items-center gap-3">
            <img
              src={currencyIcon}
              alt="USD-JPY"
              className="w-14 h-14 object-contain drop-shadow-lg"
            />
            <span className="text-3xl font-extrabold text-white tracking-wide">
              USD-JPY
            </span>
          </div>

          {/* Right: probability ring + status */}
          <div className="flex flex-col items-center gap-1">
            {/* Circular probability gauge */}
            <div className="relative w-16 h-16">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(200, 60%, 15%)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="14" fill="none"
                  stroke="url(#probGradient)" strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${85 * 0.88} ${100 * 0.88}`}
                />
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

            {/* Diferencia Precio label */}
            <div className="text-center">
              <p className="text-[8px] text-cyan-300/50 leading-tight">Diferencia Precio</p>
              <p className="text-[8px] text-cyan-300/50 leading-tight">Entrada</p>
            </div>

            {/* Active status */}
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_6px_hsl(135,80%,50%)]" />
              <span className="text-sm font-bold text-cyan-300 italic">Active</span>
            </div>
          </div>
        </div>

        {/* Accent line */}
        <div className="mx-4 h-[2px] opacity-40 mb-3"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, hsl(210, 100%, 55%) 30%, hsl(200, 100%, 55%) 70%, transparent 100%)',
          }}
        />

        {/* Middle section - 3 badges */}
        <div className="relative px-3 pb-3">
          <div className="flex gap-2">
            {/* Tendencia */}
            <div
              className="flex-1 relative rounded-lg overflow-hidden flex flex-col items-center justify-center py-2.5 gap-0.5"
              style={{
                background: 'linear-gradient(180deg, hsl(210, 100%, 8%) 0%, hsl(200, 80%, 12%) 100%)',
                border: '1px solid hsla(200, 60%, 35%, 0.3)',
              }}
            >
              <div className="absolute top-0 left-[15%] right-[15%] h-[1px]"
                style={{
                  background: 'radial-gradient(ellipse at center, hsl(195, 100%, 54%) 0%, transparent 70%)',
                }}
              />
              <span className="text-[9px] text-cyan-300/60 uppercase tracking-wider">Tendencia</span>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-lg font-bold text-cyan-200">78%</span>
              </div>
            </div>

            {/* Decisión */}
            <div
              className="flex-1 relative rounded-lg overflow-hidden flex flex-col items-center justify-center py-2.5 gap-0.5"
              style={{
                background: 'linear-gradient(180deg, hsl(210, 100%, 8%) 0%, hsl(200, 80%, 12%) 100%)',
                border: '1px solid hsla(200, 60%, 35%, 0.3)',
              }}
            >
              <div className="absolute top-0 left-[15%] right-[15%] h-[1px]"
                style={{
                  background: 'radial-gradient(ellipse at center, hsl(195, 100%, 54%) 0%, transparent 70%)',
                }}
              />
              <span className="text-[9px] text-cyan-300/60 uppercase tracking-wider">Decisión</span>
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <span className="text-lg font-bold text-green-400">Compra</span>
              </div>
            </div>

            {/* Riesgo */}
            <div
              className="flex-1 relative rounded-lg overflow-hidden flex flex-col items-center justify-center py-2.5 gap-0.5"
              style={{
                background: 'linear-gradient(180deg, hsl(210, 100%, 8%) 0%, hsl(200, 80%, 12%) 100%)',
                border: '1px solid hsla(200, 60%, 35%, 0.3)',
              }}
            >
              <div className="absolute top-0 left-[15%] right-[15%] h-[1px]"
                style={{
                  background: 'radial-gradient(ellipse at center, hsl(195, 100%, 54%) 0%, transparent 70%)',
                }}
              />
              <span className="text-[9px] text-cyan-300/60 uppercase tracking-wider">Riesgo</span>
              <div className="flex items-center gap-1">
                <Flame className="w-5 h-5 text-orange-400" />
                <span className="text-lg font-bold text-cyan-200">35%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar - entry price */}
        <div className="relative mx-3 mb-3 rounded-lg overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, hsl(210, 50%, 10%) 0%, hsl(200, 60%, 14%) 100%)',
            border: '1px solid hsla(200, 60%, 35%, 0.25)',
          }}
        >
          <div className="absolute top-0 left-[10%] right-[10%] h-[1px]"
            style={{
              background: 'radial-gradient(ellipse at center, hsl(195, 100%, 54%) 0%, transparent 70%)',
            }}
          />
          <div className="flex items-center justify-between px-4 py-2.5">
            <span className="text-sm font-semibold text-white">Precio de Entrada</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white">157.210</span>
              <button className="text-cyan-400/60 hover:text-cyan-300 transition-colors">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom green BUY accent line */}
        <div className="mx-3 mb-3 h-[3px] rounded-full"
          style={{
            background: 'linear-gradient(90deg, hsl(135, 80%, 45%) 0%, hsl(135, 60%, 30%) 30%, hsl(135, 80%, 50%) 60%, hsl(135, 90%, 55%) 100%)',
          }}
        />

        {/* Bottom glow */}
        <div className="absolute bottom-0 left-[10%] right-[10%] h-[1px]"
          style={{
            background: 'radial-gradient(ellipse at center, hsl(200, 80%, 40%) 0%, transparent 70%)',
          }}
        />
      </div>
    </div>
  );
}
