import { useState, useMemo } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ArrowLeft, CalendarDays, RefreshCw, TrendingUp, TrendingDown, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

interface InstitutionalEvent {
  id: string;
  time: string;
  currency: string;
  event: string;
  impact: 'high' | 'medium';
  consensus: number | null;
  previous: number;
  actual: number | null;
  deviation: number | null;
  historicalReactions: { date: string; deviation: number; pipsMove: number }[];
  avgReaction: number;
  surpriseDirection: 'above' | 'below' | 'inline' | null;
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD'];

function generateEvents(): InstitutionalEvent[] {
  const events = [
    { currency: 'USD', event: 'Non-Farm Payrolls', consensus: 185, previous: 175, impact: 'high' as const },
    { currency: 'USD', event: 'CPI (YoY)', consensus: 3.1, previous: 3.2, impact: 'high' as const },
    { currency: 'USD', event: 'Fed Interest Rate Decision', consensus: 5.25, previous: 5.25, impact: 'high' as const },
    { currency: 'EUR', event: 'ECB Rate Decision', consensus: 4.0, previous: 4.25, impact: 'high' as const },
    { currency: 'EUR', event: 'GDP (QoQ)', consensus: 0.3, previous: 0.1, impact: 'medium' as const },
    { currency: 'GBP', event: 'BoE Rate Decision', consensus: 5.0, previous: 5.25, impact: 'high' as const },
    { currency: 'GBP', event: 'CPI (YoY)', consensus: 4.0, previous: 4.2, impact: 'high' as const },
    { currency: 'JPY', event: 'BoJ Rate Decision', consensus: -0.1, previous: -0.1, impact: 'high' as const },
    { currency: 'AUD', event: 'RBA Rate Decision', consensus: 4.35, previous: 4.35, impact: 'high' as const },
    { currency: 'CAD', event: 'Employment Change', consensus: 25.0, previous: 18.5, impact: 'medium' as const },
  ];

  return events.map((e, i) => {
    const hasActual = Math.random() > 0.4;
    const actual = hasActual ? +(e.consensus! + (Math.random() - 0.5) * e.consensus! * 0.1).toFixed(2) : null;
    const deviation = actual && e.consensus ? +((actual - e.consensus) / Math.abs(e.consensus) * 100).toFixed(1) : null;

    const historicalReactions = Array.from({ length: 6 }, (_, j) => ({
      date: `${2024 - Math.floor(j / 12)}-${String(((i + j * 3) % 12) + 1).padStart(2, '0')}`,
      deviation: +(Math.random() * 10 - 5).toFixed(1),
      pipsMove: Math.floor(Math.random() * 80 - 20),
    }));

    return {
      id: `evt-${i}`,
      time: `${8 + Math.floor(i * 1.5)}:${Math.random() > 0.5 ? '30' : '00'}`,
      currency: e.currency,
      event: e.event,
      impact: e.impact,
      consensus: e.consensus,
      previous: e.previous,
      actual,
      deviation,
      historicalReactions,
      avgReaction: Math.round(historicalReactions.reduce((s, r) => s + Math.abs(r.pipsMove), 0) / historicalReactions.length),
      surpriseDirection: actual === null ? null : deviation! > 2 ? 'above' : deviation! < -2 ? 'below' : 'inline',
    };
  });
}

export default function InstitutionalCalendar() {
  const [events, setEvents] = useState(() => generateEvents());
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterCurrency, setFilterCurrency] = useState<string>('all');

  const refresh = () => {
    setLoading(true);
    setTimeout(() => { setEvents(generateEvents()); setLoading(false); }, 600);
  };

  const filtered = filterCurrency === 'all' ? events : events.filter(e => e.currency === filterCurrency);

  return (
    <PageShell>
      <Header />
      <main className="container py-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/tools" className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </Link>
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-bold text-foreground">Calendario Institucional</h1>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={refresh} disabled={loading}>
            <RefreshCw className={cn('w-4 h-4 text-muted-foreground', loading && 'animate-spin')} />
          </Button>
        </div>

        {/* Currency Filter */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setFilterCurrency('all')}
            className={cn(
              'px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all border',
              filterCurrency === 'all'
                ? 'bg-primary/15 border-primary text-primary shadow-sm shadow-primary/10'
                : 'bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
            )}
          >
            Todos
          </button>
          {CURRENCIES.map(c => (
            <button
              key={c}
              onClick={() => setFilterCurrency(c)}
              className={cn(
                'px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all border',
                filterCurrency === c
                  ? 'bg-primary/15 border-primary text-primary shadow-sm shadow-primary/10'
                  : 'bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
              )}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Events */}
        <div className="space-y-2">
          {filtered.map(evt => {
            const isExpanded = expandedId === evt.id;
            return (
              <Card key={evt.id} className="bg-card border-border">
                <CardContent className="p-0">
                  <button className="w-full flex items-center justify-between p-4" onClick={() => setExpandedId(isExpanded ? null : evt.id)}>
                    <div className="flex items-center gap-3">
                      <div className="text-center w-12">
                        <p className="text-xs font-bold text-foreground">{evt.time}</p>
                        <span className={cn(
                          'text-[8px] px-1.5 py-0.5 rounded-full font-bold',
                          evt.impact === 'high' ? 'bg-destructive/20 text-destructive' : 'bg-amber-500/20 text-amber-400'
                        )}>
                          {evt.impact === 'high' ? 'ALTO' : 'MEDIO'}
                        </span>
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-bold">{evt.currency}</span>
                          <p className="text-xs font-medium text-foreground">{evt.event}</p>
                        </div>
                        <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                          <span>Prev: {evt.previous}</span>
                          <span>Cons: {evt.consensus}</span>
                          {evt.actual !== null && (
                            <span className={cn('font-bold', evt.surpriseDirection === 'above' ? 'text-emerald-400' : evt.surpriseDirection === 'below' ? 'text-rose-400' : 'text-foreground')}>
                              Act: {evt.actual}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {evt.deviation !== null && (
                        <span className={cn('text-xs font-bold tabular-nums', Math.abs(evt.deviation) > 2 ? (evt.deviation > 0 ? 'text-emerald-400' : 'text-rose-400') : 'text-muted-foreground')}>
                          {evt.deviation > 0 ? '+' : ''}{evt.deviation}%
                        </span>
                      )}
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border p-4 space-y-4">
                      {/* Historical Reactions Chart */}
                      <div>
                        <p className="text-[10px] text-muted-foreground font-medium mb-2">Reacciones Históricas (pips)</p>
                        <div className="h-36">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={evt.historicalReactions}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis dataKey="date" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} />
                              <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
                              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
                              <Bar dataKey="pipsMove" name="Pips">
                                {evt.historicalReactions.map((entry, i) => (
                                  <Cell key={i} fill={entry.pipsMove >= 0 ? 'hsl(142 71% 45% / 0.6)' : 'hsl(0 84% 60% / 0.6)'} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center p-2 rounded-lg bg-secondary/50">
                          <p className="text-[9px] text-muted-foreground">Reacción Promedio</p>
                          <p className="text-sm font-bold text-foreground tabular-nums">{evt.avgReaction} pips</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-secondary/50">
                          <p className="text-[9px] text-muted-foreground">Desviación</p>
                          <p className={cn('text-sm font-bold tabular-nums', evt.deviation && Math.abs(evt.deviation) > 2 ? 'text-amber-400' : 'text-foreground')}>
                            {evt.deviation !== null ? `${evt.deviation}%` : '—'}
                          </p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-secondary/50">
                          <p className="text-[9px] text-muted-foreground">Sorpresa</p>
                          <div className="flex items-center justify-center gap-1 mt-0.5">
                            {evt.surpriseDirection === 'above' && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
                            {evt.surpriseDirection === 'below' && <TrendingDown className="w-3.5 h-3.5 text-rose-400" />}
                            <span className="text-xs font-bold text-foreground">
                              {evt.surpriseDirection === 'above' ? 'Superior' : evt.surpriseDirection === 'below' ? 'Inferior' : evt.surpriseDirection === 'inline' ? 'En línea' : '—'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Historical table */}
                      <div>
                        <p className="text-[10px] text-muted-foreground font-medium mb-1">Historial de Desviaciones</p>
                        {evt.historicalReactions.map((r, i) => (
                          <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0 text-xs">
                            <span className="text-muted-foreground">{r.date}</span>
                            <span className={cn('tabular-nums', r.deviation > 0 ? 'text-emerald-400' : 'text-rose-400')}>
                              {r.deviation > 0 ? '+' : ''}{r.deviation}%
                            </span>
                            <span className={cn('font-bold tabular-nums', r.pipsMove >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                              {r.pipsMove >= 0 ? '+' : ''}{r.pipsMove} pips
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                El calendario institucional incluye datos de consenso del mercado, historial de desviaciones y reacciones de precio post-publicación. Ideal para anticipar la volatilidad basándose en precedentes.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </PageShell>
  );
}
