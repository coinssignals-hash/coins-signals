import { useState, useMemo, useCallback } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, CalendarDays, AlertTriangle, TrendingUp, TrendingDown, Minus,
  Loader2, RefreshCw, Globe, Sparkles, Clock, BarChart3, Zap, ChevronDown, ChevronUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useQuery, useMutation } from '@tanstack/react-query';
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

const IMPACT_CONFIG: Record<string, { color: string; label: string; bg: string; icon: typeof Zap }> = {
  High: { color: 'text-rose-400', label: 'Alto', bg: 'bg-rose-500/15 border-rose-500/30', icon: Zap },
  Medium: { color: 'text-amber-400', label: 'Medio', bg: 'bg-amber-500/15 border-amber-500/30', icon: AlertTriangle },
  Low: { color: 'text-emerald-400', label: 'Bajo', bg: 'bg-emerald-500/15 border-emerald-500/30', icon: Minus },
};

const DAY_OFFSETS = [
  { label: 'Ayer', offset: -1 },
  { label: 'Hoy', offset: 0 },
  { label: 'Mañana', offset: 1 },
  { label: '+2 días', offset: 2 },
];

const COUNTRY_FLAGS: Record<string, string> = {
  US: '🇺🇸', EU: '🇪🇺', GB: '🇬🇧', JP: '🇯🇵', CH: '🇨🇭', AU: '🇦🇺',
  NZ: '🇳🇿', CA: '🇨🇦', CN: '🇨🇳', DE: '🇩🇪', FR: '🇫🇷', IT: '🇮🇹',
};

function getFlag(currency: string): string {
  const map: Record<string, string> = {
    USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵', CHF: '🇨🇭',
    AUD: '🇦🇺', NZD: '🇳🇿', CAD: '🇨🇦', CNY: '🇨🇳',
  };
  return map[currency] || '🌐';
}

export default function EconomicCalendar() {
  const [dayOffset, setDayOffset] = useState(0);
  const [impactFilter, setImpactFilter] = useState<string | null>(null);
  const [currencyFilter, setCurrencyFilter] = useState<string | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null);
  const [aiInsights, setAiInsights] = useState<Record<number, string>>({});

  const targetDate = useMemo(() => {
    const d = new Date();
    return dayOffset >= 0 ? addDays(d, dayOffset) : subDays(d, Math.abs(dayOffset));
  }, [dayOffset]);

  const dateStr = format(targetDate, 'yyyy-MM-dd');

  const { data: events = [], isLoading, refetch, isFetching } = useQuery<EconomicEvent[]>({
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

  // Currency breakdown
  const currencies = useMemo(() => {
    const map: Record<string, number> = {};
    events.forEach(e => { map[e.currency] = (map[e.currency] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [events]);

  const filtered = useMemo(() => {
    let list = events;
    if (impactFilter) list = list.filter(e => e.impact === impactFilter);
    if (currencyFilter) list = list.filter(e => e.currency === currencyFilter);
    return list.sort((a, b) => a.date.localeCompare(b.date));
  }, [events, impactFilter, currencyFilter]);

  // Stats
  const stats = useMemo(() => ({
    total: events.length,
    high: events.filter(e => e.impact === 'High').length,
    medium: events.filter(e => e.impact === 'Medium').length,
    low: events.filter(e => e.impact === 'Low').length,
    withActual: events.filter(e => e.actual !== null).length,
  }), [events]);

  // AI Analysis mutation
  const aiMutation = useMutation({
    mutationFn: async (eventIdx: number) => {
      const event = filtered[eventIdx];
      const prompt = `Eres un analista macroeconómico experto en forex. Analiza este evento económico de forma breve (máximo 3 oraciones cortas):

Evento: ${event.event}
País: ${event.country} (${event.currency})
Impacto: ${event.impact}
Previo: ${event.previous ?? 'N/A'}
Estimado: ${event.estimate ?? 'N/A'}
Actual: ${event.actual ?? 'Pendiente'}

Responde SOLO con: 1) Qué significa para ${event.currency}, 2) Pares afectados, 3) Sesgo direccional probable. Sé conciso y directo.`;

      const { data, error } = await supabase.functions.invoke('ai-analysis', {
        body: { prompt, model: 'gemini-2.5-flash' },
      });
      if (error) throw error;
      return { idx: eventIdx, text: data?.analysis || data?.text || 'Sin análisis disponible' };
    },
    onSuccess: (result) => {
      setAiInsights(prev => ({ ...prev, [result.idx]: result.text }));
    },
  });

  const handleAiAnalysis = useCallback((idx: number) => {
    if (aiInsights[idx]) return; // Already cached
    aiMutation.mutate(idx);
  }, [aiInsights, aiMutation]);

  return (
    <PageShell>
      <Header />
      <main className="container py-6 space-y-5">
        {/* Navigation */}
        <div className="flex items-center gap-3">
          <Link to="/tools" className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </Link>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            <div>
              <h1 className="text-lg font-bold text-foreground">Calendario con Impacto IA</h1>
              <p className="text-[10px] text-muted-foreground">{format(targetDate, "EEEE, d 'de' MMMM yyyy", { locale: es })}</p>
            </div>
          </div>
          <div className="ml-auto">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-accent transition-colors"
            >
              <RefreshCw className={cn("w-4 h-4 text-muted-foreground", isFetching && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Day Tabs */}
        <Card className="bg-card border-border">
          <CardContent className="p-1.5">
            <div className="flex gap-1">
              {DAY_OFFSETS.map(d => (
                <button
                  key={d.offset}
                  onClick={() => setDayOffset(d.offset)}
                  className={cn(
                    "flex-1 px-2 py-2 rounded-md text-xs font-semibold transition-colors",
                    dayOffset === d.offset
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        {!isLoading && events.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Total', value: stats.total, icon: CalendarDays, color: 'text-primary' },
              { label: 'Alto', value: stats.high, icon: Zap, color: 'text-rose-400' },
              { label: 'Medio', value: stats.medium, icon: AlertTriangle, color: 'text-amber-400' },
              { label: 'Publicados', value: stats.withActual, icon: BarChart3, color: 'text-emerald-400' },
            ].map(s => (
              <Card key={s.label} className="bg-card border-border">
                <CardContent className="p-3 text-center">
                  <s.icon className={cn('w-4 h-4 mx-auto mb-1', s.color)} />
                  <p className={cn('text-lg font-bold tabular-nums', s.color)}>{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Currency Breakdown */}
        {!isLoading && currencies.length > 0 && (
          <Card className="bg-card border-border">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2.5">
                <Globe className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Por Divisa</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setCurrencyFilter(null)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors border",
                    !currencyFilter ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-border"
                  )}
                >
                  Todas
                </button>
                {currencies.map(([cur, count]) => (
                  <button
                    key={cur}
                    onClick={() => setCurrencyFilter(currencyFilter === cur ? null : cur)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors border flex items-center gap-1",
                      currencyFilter === cur
                        ? "bg-primary/15 text-foreground border-primary/40"
                        : "bg-secondary text-muted-foreground border-border"
                    )}
                  >
                    <span>{getFlag(cur)}</span>
                    {cur}
                    <span className="text-[9px] opacity-60">({count})</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Impact Filter */}
        <Card className="bg-card border-border">
          <CardContent className="p-3 flex items-center gap-2 flex-wrap">
            <Zap className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs font-medium text-muted-foreground shrink-0">Impacto:</span>
            <button
              onClick={() => setImpactFilter(null)}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors",
                !impactFilter ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              )}
            >
              Todos
            </button>
            {Object.entries(IMPACT_CONFIG).map(([key, conf]) => {
              const count = events.filter(e => e.impact === key).length;
              return (
                <button
                  key={key}
                  onClick={() => setImpactFilter(impactFilter === key ? null : key)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors border",
                    impactFilter === key
                      ? cn(conf.bg, conf.color)
                      : "bg-secondary text-muted-foreground border-border"
                  )}
                >
                  {conf.label} ({count})
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Events List */}
        {isLoading ? (
          <Card className="bg-card border-border">
            <CardContent className="p-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Cargando eventos económicos...</p>
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <CalendarDays className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-sm text-muted-foreground">No hay eventos para esta fecha</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Prueba seleccionando otro día o quitando filtros</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              {filtered.map((event, i) => {
                const impact = IMPACT_CONFIG[event.impact] || IMPACT_CONFIG.Low;
                const time = event.date?.includes('T')
                  ? format(new Date(event.date), 'HH:mm')
                  : '--:--';
                const deviation = event.actual !== null && event.estimate !== null
                  ? event.actual - event.estimate
                  : null;
                const isExpanded = expandedEvent === i;
                const ImpactIcon = impact.icon;

                return (
                  <div
                    key={`${event.event}-${i}`}
                    className={cn(
                      "transition-colors",
                      i !== filtered.length - 1 && "border-b border-border"
                    )}
                  >
                    <button
                      onClick={() => setExpandedEvent(isExpanded ? null : i)}
                      className="w-full p-3 text-left"
                    >
                      <div className="flex items-center gap-3">
                        {/* Icon */}
                        <div className={cn(
                          'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                          event.impact === 'High' ? 'bg-rose-500/15' :
                          event.impact === 'Medium' ? 'bg-amber-500/15' : 'bg-muted'
                        )}>
                          <ImpactIcon className={cn('w-4 h-4', impact.color)} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-semibold text-foreground truncate">{event.event}</span>
                            </div>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground">{getFlag(event.currency)} {event.currency}</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" /> {time}
                            </span>
                            <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full border font-semibold", impact.bg, impact.color)}>
                              {impact.label}
                            </span>
                            {event.actual !== null && deviation !== null && (
                              <span className={cn(
                                "text-[10px] font-bold tabular-nums ml-auto",
                                deviation > 0 ? "text-emerald-400" : deviation < 0 ? "text-rose-400" : "text-muted-foreground"
                              )}>
                                {deviation > 0 ? '+' : ''}{deviation.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-3 pb-3 space-y-3">
                        {/* Data Grid */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-secondary rounded-lg p-2.5 text-center">
                            <span className="text-[9px] text-muted-foreground block">Previo</span>
                            <span className="text-sm font-mono font-bold text-foreground">
                              {event.previous !== null ? event.previous : '—'}
                            </span>
                          </div>
                          <div className="bg-secondary rounded-lg p-2.5 text-center">
                            <span className="text-[9px] text-muted-foreground block">Estimado</span>
                            <span className="text-sm font-mono font-bold text-foreground">
                              {event.estimate !== null ? event.estimate : '—'}
                            </span>
                          </div>
                          <div className={cn(
                            "rounded-lg p-2.5 text-center",
                            event.actual !== null
                              ? deviation !== null && deviation > 0 ? "bg-emerald-500/10" : deviation !== null && deviation < 0 ? "bg-rose-500/10" : "bg-secondary"
                              : "bg-secondary"
                          )}>
                            <span className="text-[9px] text-muted-foreground block">Actual</span>
                            <span className={cn(
                              "text-sm font-mono font-bold",
                              event.actual === null ? "text-muted-foreground" :
                              deviation !== null && deviation > 0 ? "text-emerald-400" :
                              deviation !== null && deviation < 0 ? "text-rose-400" : "text-foreground"
                            )}>
                              {event.actual !== null ? event.actual : 'Pendiente'}
                            </span>
                          </div>
                        </div>

                        {/* Deviation Bar */}
                        {deviation !== null && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-muted-foreground">Desviación vs Estimado</span>
                              <div className="flex items-center gap-1">
                                {deviation > 0 ? <TrendingUp className="w-3 h-3 text-emerald-400" /> :
                                 deviation < 0 ? <TrendingDown className="w-3 h-3 text-rose-400" /> :
                                 <Minus className="w-3 h-3 text-muted-foreground" />}
                                <span className={cn(
                                  "text-xs font-mono font-bold",
                                  deviation > 0 ? "text-emerald-400" : deviation < 0 ? "text-rose-400" : "text-muted-foreground"
                                )}>
                                  {deviation > 0 ? '+' : ''}{deviation.toFixed(3)}
                                </span>
                              </div>
                            </div>
                            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  deviation > 0 ? "bg-emerald-400" : "bg-rose-400"
                                )}
                                style={{ width: `${Math.min(Math.abs(deviation) * 10, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* AI Analysis Button */}
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full text-xs gap-2"
                          onClick={() => handleAiAnalysis(i)}
                          disabled={aiMutation.isPending && aiMutation.variables === i}
                        >
                          {aiMutation.isPending && aiMutation.variables === i ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5 text-primary" />
                          )}
                          {aiInsights[i] ? 'Análisis IA Generado' : 'Analizar con IA'}
                        </Button>

                        {/* AI Insight */}
                        {aiInsights[i] && (
                          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-primary" />
                              <span className="text-[10px] font-semibold text-primary">Análisis IA</span>
                            </div>
                            <p className="text-[11px] text-foreground leading-relaxed whitespace-pre-line">
                              {aiInsights[i]}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Warning */}
        {!isLoading && events.length > 0 && (
          <Card className="bg-card border-border">
            <CardContent className="p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Los eventos de alto impacto pueden causar volatilidad significativa. Opera con precaución durante estos periodos.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </PageShell>
  );
}
