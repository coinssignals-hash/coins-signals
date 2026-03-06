import { Clock } from 'lucide-react';
import { SignalCardV2 } from '@/components/signals/SignalCardV2';
import { StaggerList } from '@/components/layout/StaggerList';
import { TodayActivesBadge } from '@/components/signals/today/TodaySignalsGroup';
import type { TradingSignal } from '@/hooks/useSignals';

interface TomorrowSignalsGroupProps {
  signals: TradingSignal[];
}

export function TomorrowSignalsGroup({ signals }: TomorrowSignalsGroupProps) {
  const activeCount = signals.filter(s => s.status === 'active' || s.status === 'pending').length;

  if (signals.length === 0) {
    return (
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-amber-500/20 text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-sm font-semibold text-amber-300">Mañana</span>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
            0 señales
          </span>
        </div>
        <p className="text-slate-500 text-center py-6 text-sm">Aún no hay señales para mañana</p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-amber-500/20 text-amber-400">
          <Clock className="w-4 h-4" />
        </div>
        <span className="text-sm font-semibold text-amber-300">Mañana</span>
        <div className="ml-auto flex items-center gap-2">
          <TodayActivesBadge count={activeCount} />
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
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
