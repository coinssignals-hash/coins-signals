import { useState, useMemo } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';

import { ToolCard, ToolPageHeader } from '@/components/tools/ToolCard';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ArrowLeft, CandlestickChart, RefreshCw, TrendingUp, TrendingDown, Info, Clock, Zap, Eye } from 'lucide-react';
import { useTranslation } from '@/i18n/LanguageContext';

interface PatternResult {
  pair: string;
  pattern: string;
  type: 'bullish' | 'bearish' | 'neutral';
  reliability: number; // 1-5
  timeframe: string;
  detected: string; // time ago
}

const PATTERN_KEYS_BULLISH = ['pat_hammer', 'pat_morning_star', 'pat_bullish_engulfing', 'pat_triple_bottom', 'pat_bullish_harami', 'pat_piercing_line'];
const PATTERN_KEYS_BEARISH = ['pat_shooting_star', 'pat_evening_star', 'pat_bearish_engulfing', 'pat_double_top', 'pat_bearish_harami', 'pat_dark_cloud'];
const PATTERN_KEYS_NEUTRAL = ['pat_doji', 'pat_spinning_top', 'pat_symmetrical_triangle', 'pat_rectangle'];
const PAIRS = ['EUR/USD','GBP/USD','USD/JPY','USD/CHF','AUD/USD','NZD/USD','USD/CAD','EUR/GBP','EUR/JPY','GBP/JPY','XAU/USD'];
const TIMEFRAMES = ['M15', 'H1', 'H4', 'D1'];
const TIMES_AGO = ['2m', '5m', '12m', '23m', '45m', '1h', '2h', '3h'];

function generatePatterns(): PatternResult[] {
  const results: PatternResult[] = [];
  const count = 8 + Math.floor(Math.random() * 6);
  for (let i = 0; i < count; i++) {
    const typeRoll = Math.random();
    let type: PatternResult['type'], pattern: string;
    if (typeRoll < 0.4) { type = 'bullish'; pattern = PATTERN_KEYS_BULLISH[Math.floor(Math.random() * PATTERN_KEYS_BULLISH.length)]; }
    else if (typeRoll < 0.8) { type = 'bearish'; pattern = PATTERN_KEYS_BEARISH[Math.floor(Math.random() * PATTERN_KEYS_BEARISH.length)]; }
    else { type = 'neutral'; pattern = PATTERN_KEYS_NEUTRAL[Math.floor(Math.random() * PATTERN_KEYS_NEUTRAL.length)]; }

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

const ACCENT = '0 70% 55%';

export default function PatternScreener() {
  const { t } = useTranslation();
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
      <main className="container py-3 max-w-lg mx-auto px-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/tools" className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 backdrop-blur-sm" style={{ background: "hsl(var(--card) / 0.85)", border: "1px solid hsl(var(--border) / 0.6)", boxShadow: "0 2px 8px hsl(0 0% 0% / 0.3)" }}>
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </Link>
            <div className="flex items-center gap-2">
              <CandlestickChart className="w-5 h-5 " style={{ color: `hsl(${ACCENT})` }} />
              <h1 className="text-lg font-bold text-foreground">{t('tools_pattern_screener_title')}</h1>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={refresh} disabled={loading} className="text-muted-foreground">
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: t('tp_pattern_total'), value: summary.total, icon: Eye, color: 'text-primary' },
            { label: t('tp_pattern_bullish'), value: summary.bullish, icon: TrendingUp, color: 'text-emerald-400' },
            { label: t('tp_pattern_bearish'), value: summary.bearish, icon: TrendingDown, color: 'text-rose-400' },
            { label: t('tp_pattern_neutral'), value: summary.neutral, icon: CandlestickChart, color: 'text-muted-foreground' },
          ].map(s => (
            <div key={s.label} className="rounded-xl overflow-hidden" style={{ background: "hsl(var(--card) / 0.6)", border: "1px solid hsl(var(--border) / 0.5)" }}>
              <div className="p-3 text-center">
                <s.icon className={cn('w-4 h-4 mx-auto mb-1', s.color)} />
                <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-1 p-1 rounded-lg bg-muted/50">
          {([
            { id: 'all' as FilterType, label: t('tp_all') },
            { id: 'bullish' as FilterType, label: `🟢 ${t('tp_trend_bullish')}` },
            { id: 'bearish' as FilterType, label: `🔴 ${t('tp_trend_bearish')}` },
            { id: 'neutral' as FilterType, label: `⚪ ${t('tp_trend_neutral')}` },
          ]).map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={cn(
              'flex-1 py-2 rounded-md text-xs font-medium transition-all',
              filter === f.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}>{f.label}</button>
          ))}
        </div>

        {/* Patterns List */}
        <ToolCard accent={ACCENT}>
          <div className="p-0">
            {filtered.length === 0 ? (
              <div className="p-8 text-center">
                <CandlestickChart className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-40" />
                <p className="text-sm text-muted-foreground">{t('tp_no_patterns')}</p>
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
                      {t(item.pattern)}
                    </p>
                    <p className="text-[10px] text-amber-400 mt-0.5 tracking-wider">{reliabilityStars(item.reliability)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ToolCard>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
          <Clock className="w-3 h-3" />
          {t('tp_updated')}: {lastUpdate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
        </div>

        <ToolCard accent={ACCENT}>
          <div className="p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {t('tp_pattern_info')}
              </p>
            </div>
          </div>
        </ToolCard>
      </main>
    </PageShell>
  );
}
