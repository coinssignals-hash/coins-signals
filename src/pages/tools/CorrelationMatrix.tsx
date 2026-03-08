import { useState, useMemo } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ArrowLeft, Layers, RefreshCw, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/LanguageContext';

const PAIRS = ['EUR/USD','GBP/USD','USD/JPY','USD/CHF','AUD/USD','NZD/USD','USD/CAD','EUR/GBP','EUR/JPY','GBP/JPY','XAU/USD'];

function generateCorrelation(): number {
  return Math.round((Math.random() * 2 - 1) * 100) / 100;
}

function generateMatrix(pairs: string[]): number[][] {
  const n = pairs.length;
  const m: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    m[i][i] = 1;
    for (let j = i + 1; j < n; j++) {
      const val = generateCorrelation();
      m[i][j] = val;
      m[j][i] = val;
    }
  }
  return m;
}

function corrColor(val: number): string {
  if (val >= 0.7) return 'bg-emerald-500/70 text-white';
  if (val >= 0.3) return 'bg-emerald-500/30 text-emerald-300';
  if (val > -0.3) return 'bg-muted/40 text-muted-foreground';
  if (val > -0.7) return 'bg-rose-500/30 text-rose-300';
  return 'bg-rose-500/70 text-white';
}

export default function CorrelationMatrix() {
  const { t } = useTranslation();
  const [matrix, setMatrix] = useState(() => generateMatrix(PAIRS));
  const [loading, setLoading] = useState(false);

  function refresh() {
    setLoading(true);
    setTimeout(() => {
      setMatrix(generateMatrix(PAIRS));
      setLoading(false);
    }, 600);
  }

  // Find strongest correlations
  const highlights = useMemo(() => {
    const pairs: { a: string; b: string; val: number }[] = [];
    for (let i = 0; i < PAIRS.length; i++) {
      for (let j = i + 1; j < PAIRS.length; j++) {
        pairs.push({ a: PAIRS[i], b: PAIRS[j], val: matrix[i][j] });
      }
    }
    pairs.sort((a, b) => Math.abs(b.val) - Math.abs(a.val));
    return pairs.slice(0, 5);
  }, [matrix]);

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
              <Layers className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-bold text-foreground">{t('tools_corr_matrix_title')}</h1>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={refresh} disabled={loading} className="text-muted-foreground">
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </Button>
        </div>

        {/* Matrix Grid */}
        <Card className="bg-card border-border">
          <CardContent className="p-2 overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr>
                  <th className="w-16" />
                  {PAIRS.map(p => (
                    <th key={p} className="text-[8px] text-muted-foreground font-medium py-1 px-0.5 text-center" style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)', height: 60 }}>
                      {p}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PAIRS.map((rowPair, i) => (
                  <tr key={rowPair}>
                    <td className="text-[9px] text-muted-foreground font-medium pr-1 whitespace-nowrap">{rowPair}</td>
                    {PAIRS.map((_, j) => {
                      const val = matrix[i][j];
                      const isDiag = i === j;
                      return (
                        <td key={j} className="p-0.5">
                          <div className={cn(
                            'w-full aspect-square rounded-sm flex items-center justify-center text-[8px] font-bold tabular-nums',
                            isDiag ? 'bg-primary/20 text-primary' : corrColor(val)
                          )}>
                            {isDiag ? '1.0' : val.toFixed(1)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Legend */}
        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground mb-2 font-medium">{t('tp_correlation_scale')}</p>
            <div className="flex gap-1 items-center">
              {[
                { label: '-1.0', cls: 'bg-rose-500/70' },
                { label: '-0.5', cls: 'bg-rose-500/30' },
                { label: '0', cls: 'bg-muted/40' },
                { label: '+0.5', cls: 'bg-emerald-500/30' },
                { label: '+1.0', cls: 'bg-emerald-500/70' },
              ].map(s => (
                <div key={s.label} className="flex-1 text-center">
                  <div className={cn('h-3 rounded-sm', s.cls)} />
                  <span className="text-[8px] text-muted-foreground">{s.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Correlations */}
        <Card className="bg-card border-border">
          <CardContent className="p-4 space-y-2">
            <h3 className="text-sm font-semibold text-foreground">{t('tp_strongest_correlations')}</h3>
            {highlights.map((h, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                <span className="text-xs text-foreground">{h.a} ↔ {h.b}</span>
                <span className={cn(
                  'text-xs font-bold tabular-nums',
                  h.val > 0 ? 'text-emerald-400' : 'text-rose-400'
                )}>
                  {h.val > 0 ? '+' : ''}{h.val.toFixed(2)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Correlación +1 = se mueven juntos, -1 = se mueven opuestos, 0 = sin relación. Evita abrir posiciones en pares altamente correlacionados para diversificar riesgo.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </PageShell>
  );
}
