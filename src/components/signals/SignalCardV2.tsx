import { cn } from '@/lib/utils';
import { TrendingUp, ShieldCheck, AlertTriangle } from 'lucide-react';
import bullBg from '@/assets/bull-card-bg.svg';

interface SignalCardV2Props {
  className?: string;
}

export function SignalCardV2({ className }: SignalCardV2Props) {
  return (
    <div className={cn("relative w-full rounded-xl overflow-hidden", className)}>
      {/* Main card container */}
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
            backgroundSize: '65%',
            backgroundPosition: 'right center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.3,
            mixBlendMode: 'screen',
            filter: 'hue-rotate(80deg) saturate(1.5)',
          }}
        />

        {/* Top glow line */}
        <div className="absolute top-0 left-[15%] right-[15%] h-[1px]"
          style={{
            background: 'radial-gradient(ellipse at center, hsl(200, 80%, 55%) 0%, transparent 70%)',
          }}
        />

        {/* Upper section - header area */}
        <div className="relative px-4 pt-6 pb-4">
          {/* Subtle blue horizontal accent line */}
          <div className="absolute top-[38%] left-[20%] right-[5%] h-[2px] opacity-40"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, hsl(210, 100%, 55%) 30%, hsl(200, 100%, 55%) 70%, transparent 100%)',
            }}
          />

          {/* Placeholder area for currency pair info */}
          <div className="h-24" />
        </div>

        {/* Middle section - badges area with icons */}
        <div className="relative px-3 pb-3">
          <div className="flex gap-2">
            {/* Tendencia panel */}
            <div
              className="flex-1 relative rounded-lg overflow-hidden flex flex-col items-center justify-center py-2.5"
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
              <TrendingUp className="w-4 h-4 text-cyan-400 mb-0.5" />
              <span className="text-[9px] text-cyan-300/60 uppercase tracking-wider">Tendencia</span>
            </div>

            {/* Decisión panel */}
            <div
              className="flex-1 relative rounded-lg overflow-hidden flex flex-col items-center justify-center py-2.5"
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
              <ShieldCheck className="w-4 h-4 text-cyan-400 mb-0.5" />
              <span className="text-[9px] text-cyan-300/60 uppercase tracking-wider">Decisión</span>
            </div>

            {/* Riesgo panel */}
            <div
              className="flex-1 relative rounded-lg overflow-hidden flex flex-col items-center justify-center py-2.5"
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
              <AlertTriangle className="w-4 h-4 text-cyan-400 mb-0.5" />
              <span className="text-[9px] text-cyan-300/60 uppercase tracking-wider">Riesgo</span>
            </div>
          </div>
        </div>

        {/* Bottom bar - entry price area */}
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
          <div className="h-11" />
        </div>

        {/* Bottom accent line with green BUY gradient */}
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
