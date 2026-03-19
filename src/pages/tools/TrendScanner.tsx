import { useState, useMemo } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { GlowCard } from '@/components/ui/glow-card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, TrendingUp, TrendingDown, Minus, RefreshCw,
  Activity, BarChart3, Clock, Zap
} from 'lucide-react';
import { useTranslation } from '@/i18n/LanguageContext';

interface PairTrend {
  pair: string;
  trend: 'bullish' | 'bearish' | 'neutral';
  strength: number;
  change24h: number;
  volume: 'high' | 'medium' | 'low';
}

const FOREX_PAIRS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD',
  'NZD/USD', 'USD/CAD', 'EUR/GBP', 'EUR/JPY', 'GBP/JPY',
  'AUD/JPY', 'XAU/USD',
];

function generateTrendData(): PairTrend[] {
  return FOREX_PAIRS.map(pair => {
    const change = (Math.random() - 0.48) * 2.5;
    const strength = Math.min(100, Math.max(10, Math.abs(change) * 40 + Math.random() * 30));
    const trend: PairTrend['trend'] =
      change > 0.3 ? 'bullish' : change < -0.3 ? 'bearish' : 'neutral';
    const volumes: PairTrend['volume'][] = ['high', 'medium', 'low'];
    return {
      pair,
      trend,
      strength: Math.round(strength),
      change24h: parseFloat(change.toFixed(3)),
      volume: volumes[Math.floor(Math.random() * 3)],
    };
  });
}

type FilterType = 'all' | 'bullish' | 'bearish' | 'neutral';

export default function TrendScanner() {
  const { t } = useTranslation();
  const [data, setData] = useState<PairTrend[]>(generateTrendData);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  function refresh() {
    setLoading(true);
    setTimeout(() => {
      setData(generateTrendData());
      setLastUpdate(new Date());
      setLoading(false);
    }, 800);
  }

  const filtered = useMemo(() => {
    if (filter === 'all') return data;
    return data.filter(d => d.trend === filter);
  }, [data, filter]);

  const summary = useMemo(() => ({
    bullish: data.filter(d => d.trend === 'bullish').length,
    bearish: data.filter(d => d.trend === 'bearish').length,
    neutral: data.filter(d => d.trend === 'neutral').length,
  }), [data]);

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
            <Activity className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground">{t('tools_trend_scanner_title')}</h1>
          </div>
          <div className="ml-auto">
            <button
              onClick={refresh}
              disabled={loading}
              className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-accent transition-colors"
            >
              <RefreshCw className={cn('w-4 h-4 text-muted-foreground', loading && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* Scan Info */}
        <GlowCard>
          <CardContent className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">{t('tp_pairs_scanned')}</span>
            </div>
            <span className="text-sm font-bold text-primary tabular-nums">{FOREX_PAIRS.length}</span>
          </CardContent>
        </GlowCard>

        {/* Stats Summary — clickable filters */}
        <div className="grid grid-cols-3 gap-2">
          {([
            { key: 'bullish' as FilterType, label: t('tp_trend_bullish'), value: summary.bullish, icon: TrendingUp, color: 'text-emerald-400' },
            { key: 'bearish' as FilterType, label: t('tp_trend_bearish'), value: summary.bearish, icon: TrendingDown, color: 'text-rose-400' },
            { key: 'neutral' as FilterType, label: t('tp_trend_neutral'), value: summary.neutral, icon: Minus, color: 'text-muted-foreground' },
          ]).map(s => (
            <button key={s.key} onClick={() => setFilter(filter === s.key ? 'all' : s.key)}>
              <Card className={cn(
                'border transition-colors',
                filter === s.key ? 'bg-primary/10 border-primary/40' : 'bg-card border-border'
              )}>
                <CardContent className="p-3 text-center">
                  <s.icon className={cn('w-4 h-4 mx-auto mb-1', s.color)} />
                  <p className={cn('text-xl font-bold tabular-nums', s.color)}>{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>

        {/* Pairs List */}
        <GlowCard>
          <CardContent className="p-0">
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-4 py-2.5 border-b border-border">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{t('tp_pair')}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider text-right w-14">24h</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider text-center w-14">{t('tp_strength')}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider text-center w-12">{t('tp_vol')}</span>
            </div>

            {filtered.length === 0 ? (
              <div className="p-8 text-center">
                <Activity className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-sm text-muted-foreground">{t('tp_no_results_filter')}</p>
              </div>
            ) : filtered.map((item, i) => (
              <div
                key={item.pair}
                className={cn(
                  'grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center px-4 py-3',
                  i !== filtered.length - 1 && 'border-b border-border/50'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                    item.trend === 'bullish' ? 'bg-emerald-500/15' :
                    item.trend === 'bearish' ? 'bg-rose-500/15' : 'bg-muted'
                  )}>
                    {item.trend === 'bullish' ? <TrendingUp className="w-4 h-4 text-emerald-400" /> :
                     item.trend === 'bearish' ? <TrendingDown className="w-4 h-4 text-rose-400" /> :
                     <Minus className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-foreground">{item.pair}</span>
                    <span className={cn(
                      'block text-[10px] font-medium capitalize',
                      item.trend === 'bullish' ? 'text-emerald-400' :
                      item.trend === 'bearish' ? 'text-rose-400' : 'text-muted-foreground'
                    )}>
                      {item.trend === 'bullish' ? t('tp_trend_bullish') : item.trend === 'bearish' ? t('tp_trend_bearish') : t('tp_trend_neutral')}
                    </span>
                  </div>
                </div>

                <span className={cn(
                  'text-xs font-bold tabular-nums text-right w-14',
                  item.change24h > 0 ? 'text-emerald-400' :
                  item.change24h < 0 ? 'text-rose-400' : 'text-muted-foreground'
                )}>
                  {item.change24h > 0 ? '+' : ''}{item.change24h}%
                </span>

                <div className="w-14 flex flex-col items-center gap-0.5">
                  <span className="text-[10px] font-bold text-foreground tabular-nums">{item.strength}%</span>
                  <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        item.trend === 'bullish' ? 'bg-emerald-400' :
                        item.trend === 'bearish' ? 'bg-rose-400' : 'bg-muted-foreground'
                      )}
                      style={{ width: `${item.strength}%` }}
                    />
                  </div>
                </div>

                <div className="w-12 flex justify-center">
                  <span className={cn(
                    'text-[9px] px-1.5 py-0.5 rounded font-medium uppercase',
                    item.volume === 'high' ? 'bg-emerald-500/15 text-emerald-400' :
                    item.volume === 'medium' ? 'bg-amber-500/15 text-amber-400' :
                    'bg-muted text-muted-foreground'
                  )}>
                    {item.volume === 'high' ? t('tp_volume_high') : item.volume === 'medium' ? t('tp_volume_medium') : t('tp_volume_low')}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </GlowCard>

        {/* Last update */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
          <Clock className="w-3 h-3" />
          {t('tp_updated')}: {lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
        </div>

        {/* Info */}
        <GlowCard>
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {t('tp_trend_info')}
              </p>
            </div>
          </CardContent>
        </GlowCard>
      </main>
    </PageShell>
  );
}
