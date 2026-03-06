import { SignalCardV2 } from '@/components/signals/SignalCardV2';
import { StaggerList } from '@/components/layout/StaggerList';
import type { TradingSignal } from '@/hooks/useSignals';

interface TodaySignalsGroupProps {
  signals: TradingSignal[];
}

export function TodaySignalsGroup({ signals }: TodaySignalsGroupProps) {
  const activeCount = signals.filter(s => s.status === 'active' || s.status === 'pending').length;

  if (signals.length === 0) {
    return (
      <section>
        <p className="text-muted-foreground text-center py-6 text-sm">No hay señales para hoy</p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <StaggerList>
        {signals.map((signal) => (
          <SignalCardV2 key={signal.id} signal={signal} />
        ))}
      </StaggerList>
    </section>
  );
}

/** Compact badge to embed inside the performance stats header */
export function TodayActivesBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
      </span>
      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">
        {count} activa{count !== 1 ? 's' : ''}
      </span>
    </div>
  );
}
