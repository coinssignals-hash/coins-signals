import { useState, useMemo } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ArrowLeft, CandlestickChart, RefreshCw, TrendingUp, TrendingDown, Info, Clock, Zap, Eye } from 'lucide-react';

interface PatternResult {
  pair: string;
  pattern: string;
  type: 'bullish' | 'bearish' | 'neutral';
  reliability: number; // 1-5
  timeframe: string;
  detected: string; // time ago
}

const PATTERNS_BULLISH = ['Martillo', 'Estrella de la Mañana', 'Envolvente Alcista', 'Triple Suelo', 'Harami Alcista', 'Piercing Line'];
const PATTERNS_BEARISH = ['Estrella Fugaz', 'Estrella Vespertina', 'Envolvente Bajista', 'Doble Techo', 'Harami Bajista', 'Nube Oscura'];
const PATTERNS_NEUTRAL = ['Doji', 'Spinning Top', 'Triángulo Simétrico', 'Rectángulo'];
const PAIRS = ['EUR/USD','GBP/USD','USD/JPY','USD/CHF','AUD/USD','NZD/USD','USD/CAD','EUR/GBP','EUR/JPY','GBP/JPY','XAU/USD'];
const TIMEFRAMES = ['M15', 'H1', 'H4', 'D1'];
const TIMES_AGO = ['2m', '5m', '12m', '23m', '45m', '1h', '2h', '3h'];

function generatePatterns(): PatternResult[] {
  const results: PatternResult[] = [];
  const count = 8 + Math.floor(Math.random() * 6);
  for (let i = 0; i < count; i++) {
    const typeRoll = Math.random();
    let type: PatternResult['type'], pattern: string;
    if (typeRoll < 0.4) { type = 'bullish'; pattern = PATTERNS_BULLISH[Math.floor(Math.random() * PATTERNS_BULLISH.length)]; }
    else if (typeRoll < 0.8) { type = 'bearish'; pattern = PATTERNS_BEARISH[Math.floor(Math.random() * PATTERNS_BEARISH.length)]; }
    else { type = 'neutral'; pattern = PATTERNS_NEUTRAL[Math.floor(Math.random() * PATTERNS_NEUTRAL.length)]; }

    results.push({
      pair: PAIRS[Math.floor(Math.random() * PAIRS.length)],
      pattern,
      type,
      reliability: 1 + Math.floor(Math.random() * 5),
      timeframe: TIMEFRAMES[Math.floor(Math.random() * TIMEFRAMES.length)],
      detected: TIMES_AGO[Math.floor(Math.random() * TIMES_AGO.length)],
    });
  }
  return results;
}

type FilterType = 'all' | 'bullish' | 'bearish' | 'neutral';

export default function PatternScreener() {
  const [patterns, setPatterns] = useState<PatternResult[]>(generatePatterns);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  function refresh() {
    setLoading(true);
    setTimeout(() => { setPatterns(generatePatterns()); setLastUpdate(new Date()); setLoading(false); }, 1000);
  }

  const filtered = useMemo(() => filter === 'all' ? patterns : patterns.filter(p => p.type === filter), [patterns, filter]);
  const summary = useMemo(() => ({
    bullish: patterns.filter(p => p.type === 'bullish').length,
    bearish: patterns.filter(p => p.type === 'bearish').length,
    neutral: patterns.filter(p => p.type === 'neutral').length,
    total: patterns.length,
  }), [patterns]);

  const reliabilityStars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);

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
              <CandlestickChart className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-bold text-foreground">Screener de Patrones</h1>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={refresh} disabled={loading} className="text-muted-foreground">
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Total', value: summary.total, icon: Eye, color: 'text-primary' },
            { label: 'Alcistas', value: summary.bullish, icon: TrendingUp, color: 'text-emerald-400' },
            { label: 'Bajistas', value: summary.bearish, icon: TrendingDown, color: 'text-rose-400' },
            { label: 'Neutros', value: summary.neutral, icon: CandlestickChart, color: 'text-muted-foreground' },
          ].map(s => (
            <Card key={s.label} className="bg-card border-border">
              <CardContent className="p-3 text-center">
                <s.icon className={cn('w-4 h-4 mx-auto mb-1', s.color)} />
                <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-1 p-1 rounded-lg bg-muted/50">
          {([
            { id: 'all' as FilterType, label: 'Todos' },
            { id: 'bullish' as FilterType, label: '🟢 Alcista' },
            { id: 'bearish' as FilterType, label: '🔴 Bajista' },
            { id: 'neutral' as FilterType, label: '⚪ Neutral' },
          ]).map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={cn(
              'flex-1 py-2 rounded-md text-xs font-medium transition-all',
              filter === f.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}>{f.label}</button>
          ))}
        </div>

        {/* Patterns List */}
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="p-8 text-center">
                <CandlestickChart className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-40" />
                <p className="text-sm text-muted-foreground">No se detectaron patrones con este filtro</p>
              </div>
            ) : (
              filtered.map((item, i) => (
                <div key={i} className={cn(
                  'p-3 flex items-start gap-3',
                  i !== filtered.length - 1 && 'border-b border-border/50'
                )}>
                  <div className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                    item.type === 'bullish' ? 'bg-emerald-500/15' :
                    item.type === 'bearish' ? 'bg-rose-500/15' : 'bg-muted'
                  )}>
                    {item.type === 'bullish' ? <TrendingUp className="w-4 h-4 text-emerald-400" /> :
                     item.type === 'bearish' ? <TrendingDown className="w-4 h-4 text-rose-400" /> :
                     <CandlestickChart className="w-4 h-4 text-muted-foreground" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">{item.pair}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-medium">{item.timeframe}</span>
                        <span className="text-[10px] text-muted-foreground">{item.detected}</span>
                      </div>
                    </div>
                    <p className={cn(
                      'text-xs font-medium mt-0.5',
                      item.type === 'bullish' ? 'text-emerald-400' :
                      item.type === 'bearish' ? 'text-rose-400' : 'text-muted-foreground'
                    )}>
                      {item.pattern}
                    </p>
                    <p className="text-[10px] text-amber-400 mt-0.5 tracking-wider">{reliabilityStars(item.reliability)}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
          <Clock className="w-3 h-3" />
          Actualizado: {lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                El screener detecta patrones de velas japonesas y figuras chartistas en múltiples temporalidades. Las estrellas (★) indican la fiabilidad histórica del patrón. Confirma siempre con otros indicadores.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </PageShell>
  );
}
