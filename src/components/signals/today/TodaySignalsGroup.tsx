import { TrendingUp } from 'lucide-react';
import { SignalCardV2 } from '@/components/signals/SignalCardV2';
import { StaggerList } from '@/components/layout/StaggerList';
import type { TradingSignal } from '@/hooks/useSignals';

interface TodaySignalsGroupProps {
  signals: TradingSignal[];
}

export function TodaySignalsGroup({ signals }: TodaySignalsGroupProps) {
  if (signals.length === 0) {
    return (
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-3 py-2.5 sticky top-[108px] z-10 backdrop-blur-md rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-blue-500/20 text-blue-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <span className="text-sm font-semibold text-blue-300">Hoy</span>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
            0 señales
          </span>
        </div>
        <p className="text-slate-500 text-center py-6 text-sm">No hay señales para hoy</p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 px-3 py-2.5 sticky top-[108px] z-10 backdrop-blur-md rounded-lg bg-blue-500/10 border border-blue-500/20">
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-blue-500/20 text-blue-400">
          <TrendingUp className="w-4 h-4" />
        </div>
        <span className="text-sm font-semibold text-blue-300">Hoy</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
            {signals.length} {signals.length === 1 ? 'señal' : 'señales'}
          </span>
        </div>
      </div>
      <StaggerList>
        {signals.map((signal) => (
          <SignalCardV2 key={signal.id} signal={signal} />
        ))}
      </StaggerList>
    </section>
  );
}
