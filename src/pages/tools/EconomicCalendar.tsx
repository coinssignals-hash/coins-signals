import { useState, useMemo } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { SignalStyleCard } from '@/components/ui/signal-style-card';
import { ArrowLeft, CalendarDays, AlertTriangle, TrendingUp, TrendingDown, Minus, Loader2, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface EconomicEvent {
  date: string;
  country: string;
  event: string;
  currency: string;
  previous: number | null;
  estimate: number | null;
  actual: number | null;
  change: number | null;
  impact: string;
  changePercentage: number | null;
}

const IMPACT_CONFIG: Record<string, { color: string; label: string; bg: string }> = {
  High: { color: 'text-red-400', label: 'Alto', bg: 'bg-red-500/15 border-red-500/30' },
  Medium: { color: 'text-amber-400', label: 'Medio', bg: 'bg-amber-500/15 border-amber-500/30' },
  Low: { color: 'text-emerald-400', label: 'Bajo', bg: 'bg-emerald-500/15 border-emerald-500/30' },
};

const DAY_OFFSETS = [
  { label: 'Ayer', offset: -1 },
  { label: 'Hoy', offset: 0 },
  { label: 'Mañana', offset: 1 },
  { label: '+2 días', offset: 2 },
];

export default function EconomicCalendar() {
  const [dayOffset, setDayOffset] = useState(0);
  const [impactFilter, setImpactFilter] = useState<string | null>(null);

  const targetDate = useMemo(() => {
    const d = new Date();
    return dayOffset >= 0 ? addDays(d, dayOffset) : subDays(d, Math.abs(dayOffset));
  }, [dayOffset]);

  const dateStr = format(targetDate, 'yyyy-MM-dd');

  const { data: events = [], isLoading, refetch } = useQuery<EconomicEvent[]>({
    queryKey: ['economic-calendar', dateStr],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('fmp-data', {
        body: { action: 'economic-calendar', from: dateStr, to: dateStr },
      });
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const filtered = useMemo(() => {
    let list = events;
    if (impactFilter) list = list.filter(e => e.impact === impactFilter);
    return list.sort((a, b) => a.date.localeCompare(b.date));
  }, [events, impactFilter]);

  return (
    <PageShell>
      <div className="px-4 py-4 pb-24 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to="/tools" className="w-9 h-9 rounded-lg bg-card/80 border border-border/50 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-blue-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Calendario Económico</h1>
            <p className="text-xs text-muted-foreground">{format(targetDate, "EEEE, d 'de' MMMM", { locale: es })}</p>
          </div>
          <button onClick={() => refetch()} className="w-8 h-8 rounded-lg bg-card/80 border border-border/50 flex items-center justify-center">
            <RefreshCw className={cn("w-3.5 h-3.5 text-muted-foreground", isLoading && "animate-spin")} />
          </button>
        </div>

        {/* Day tabs */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {DAY_OFFSETS.map(d => (
            <button
              key={d.offset}
              onClick={() => setDayOffset(d.offset)}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border",
                dayOffset === d.offset
                  ? "bg-primary/15 border-primary/40 text-foreground"
                  : "bg-card/60 border-border/50 text-muted-foreground hover:bg-secondary/50"
              )}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Impact filter */}
        <div className="flex gap-1.5">
          <button
            onClick={() => setImpactFilter(null)}
            className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all",
              !impactFilter ? "bg-primary/15 border-primary/40 text-foreground" : "bg-card/60 border-border/50 text-muted-foreground"
            )}
          >
            Todos ({events.length})
          </button>
          {Object.entries(IMPACT_CONFIG).map(([key, conf]) => {
            const count = events.filter(e => e.impact === key).length;
            return (
              <button
                key={key}
                onClick={() => setImpactFilter(impactFilter === key ? null : key)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all",
                  impactFilter === key ? conf.bg : "bg-card/60 border-border/50 text-muted-foreground"
                )}
              >
                {conf.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Events list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <CalendarDays className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No hay eventos para esta fecha</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((event, i) => {
              const impact = IMPACT_CONFIG[event.impact] || IMPACT_CONFIG.Low;
              const time = event.date?.includes('T')
                ? format(new Date(event.date), 'HH:mm')
                : '--:--';
              const deviation = event.actual !== null && event.estimate !== null
                ? event.actual - event.estimate
                : null;

              return (
                <SignalStyleCard key={`${event.event}-${i}`} className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="text-center shrink-0 w-12">
                      <span className="text-xs font-mono font-bold text-foreground">{time}</span>
                      <div className={cn("text-[9px] mt-0.5 px-1.5 py-0.5 rounded-full border font-semibold", impact.bg)}>
                        {impact.label}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-primary/80">{event.currency}</span>
                        <span className="text-[10px] text-muted-foreground/60">·</span>
                        <span className="text-[10px] text-muted-foreground">{event.country}</span>
                      </div>
                      <p className="text-xs font-semibold text-foreground mt-0.5 leading-snug truncate">
                        {event.event}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="text-center">
                          <span className="text-[9px] text-muted-foreground block">Previo</span>
                          <span className="text-[11px] font-mono font-medium text-foreground">
                            {event.previous !== null ? event.previous : '—'}
                          </span>
                        </div>
                        <div className="text-center">
                          <span className="text-[9px] text-muted-foreground block">Estimado</span>
                          <span className="text-[11px] font-mono font-medium text-foreground">
                            {event.estimate !== null ? event.estimate : '—'}
                          </span>
                        </div>
                        <div className="text-center">
                          <span className="text-[9px] text-muted-foreground block">Actual</span>
                          <span className={cn(
                            "text-[11px] font-mono font-bold",
                            event.actual === null ? "text-muted-foreground" :
                            deviation !== null && deviation > 0 ? "text-emerald-400" :
                            deviation !== null && deviation < 0 ? "text-red-400" : "text-foreground"
                          )}>
                            {event.actual !== null ? event.actual : '—'}
                          </span>
                        </div>
                        {deviation !== null && (
                          <div className="flex items-center gap-0.5 ml-auto">
                            {deviation > 0 ? (
                              <TrendingUp className="w-3 h-3 text-emerald-400" />
                            ) : deviation < 0 ? (
                              <TrendingDown className="w-3 h-3 text-red-400" />
                            ) : (
                              <Minus className="w-3 h-3 text-muted-foreground" />
                            )}
                            <span className={cn(
                              "text-[10px] font-mono font-bold",
                              deviation > 0 ? "text-emerald-400" : deviation < 0 ? "text-red-400" : "text-muted-foreground"
                            )}>
                              {deviation > 0 ? '+' : ''}{deviation.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </SignalStyleCard>
              );
            })}
          </div>
        )}

        {/* Warning */}
        {!isLoading && events.length > 0 && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border/30">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Datos proporcionados por Financial Modeling Prep. Los eventos de alto impacto pueden causar 
              volatilidad significativa. Opera con precaución durante estos periodos.
            </p>
          </div>
        )}
      </div>
    </PageShell>
  );
}
