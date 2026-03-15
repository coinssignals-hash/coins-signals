import { useState, useMemo } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ArrowLeft, Zap, RefreshCw, Info, ChevronDown, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from '@/i18n/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';

interface OrderLevel {
  price: number;
  bidVolume: number;
  askVolume: number;
  delta: number;
}

interface InstitutionalData {
  pair: string;
  longPercent: number;
  shortPercent: number;
  netPosition: 'long' | 'short';
  change: number;
  levels: OrderLevel[];
}

const ALL_PAIRS_DATA: Record<string, { key: string; pairs: string[] }> = {
  'Majors': { key: 'of_cat_majors', pairs: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD'] },
  'Crosses': { key: 'of_cat_crosses', pairs: ['EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'EUR/AUD', 'EUR/CAD', 'EUR/CHF', 'GBP/AUD', 'GBP/CAD', 'AUD/JPY', 'CAD/JPY', 'NZD/JPY', 'AUD/NZD', 'AUD/CAD'] },
  'Exóticos': { key: 'of_cat_exotics', pairs: ['USD/MXN', 'USD/TRY', 'USD/ZAR', 'USD/SGD', 'USD/HKD', 'USD/NOK', 'USD/SEK', 'USD/DKK', 'EUR/NOK', 'EUR/SEK', 'EUR/TRY', 'EUR/PLN', 'EUR/HUF', 'EUR/CZK'] },
  'Commodities': { key: 'of_cat_commodities', pairs: ['XAU/USD', 'XAG/USD'] },
  'Crypto': { key: 'of_cat_crypto', pairs: ['BTC/USD', 'ETH/USD', 'SOL/USD', 'XRP/USD', 'BNB/USD', 'ADA/USD', 'DOGE/USD', 'DOT/USD', 'AVAX/USD', 'LINK/USD'] },
};

const VISIBLE_PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD', 'AUD/USD'];

const BASE_PRICES: Record<string, number> = {
  'EUR/USD': 1.085, 'GBP/USD': 1.265, 'USD/JPY': 149.5, 'USD/CHF': 0.882, 'AUD/USD': 0.665,
  'USD/CAD': 1.365, 'NZD/USD': 0.612, 'EUR/GBP': 0.858, 'EUR/JPY': 162.2, 'GBP/JPY': 189.1,
  'EUR/AUD': 1.632, 'EUR/CAD': 1.481, 'EUR/CHF': 0.957, 'GBP/AUD': 1.902, 'GBP/CAD': 1.726,
  'AUD/JPY': 99.4, 'CAD/JPY': 109.5, 'NZD/JPY': 91.5, 'AUD/NZD': 1.087, 'AUD/CAD': 0.908,
  'USD/MXN': 17.15, 'USD/TRY': 32.5, 'USD/ZAR': 18.6, 'USD/SGD': 1.345, 'USD/HKD': 7.82,
  'USD/NOK': 10.85, 'USD/SEK': 10.52, 'USD/DKK': 6.88, 'EUR/NOK': 11.77, 'EUR/SEK': 11.42,
  'EUR/TRY': 35.3, 'EUR/PLN': 4.32, 'EUR/HUF': 392.5, 'EUR/CZK': 25.2,
  'XAU/USD': 2340, 'XAG/USD': 29.5,
  'BTC/USD': 67500, 'ETH/USD': 3450, 'SOL/USD': 148, 'XRP/USD': 0.52, 'BNB/USD': 580,
  'ADA/USD': 0.45, 'DOGE/USD': 0.155, 'DOT/USD': 7.2, 'AVAX/USD': 35.5, 'LINK/USD': 14.8,
};

function generateOrderBook(basePrice: number, pair: string): OrderLevel[] {
  const levels: OrderLevel[] = [];
  const isJpy = pair.includes('JPY') || pair.includes('HUF');
  const isCrypto = ['BTC', 'ETH', 'SOL', 'BNB', 'AVAX', 'LINK', 'DOT'].some(c => pair.includes(c));
  const isExotic = basePrice > 5 && !isCrypto;
  const decimals = isJpy ? 3 : isCrypto ? 2 : isExotic ? 4 : 5;
  const step = isJpy ? 0.05 : isCrypto ? basePrice * 0.001 : isExotic ? 0.005 : 0.0005;

  for (let i = -10; i <= 10; i++) {
    const price = +(basePrice + i * step).toFixed(decimals);
    const bidVol = Math.floor(Math.random() * 500 + 50);
    const askVol = Math.floor(Math.random() * 500 + 50);
    levels.push({ price, bidVolume: bidVol, askVolume: askVol, delta: bidVol - askVol });
  }
  return levels;
}

function generateDataForPair(pair: string): InstitutionalData {
  const longPct = Math.floor(Math.random() * 40 + 30);
  return {
    pair,
    longPercent: longPct,
    shortPercent: 100 - longPct,
    netPosition: longPct > 50 ? 'long' : 'short',
    change: +(Math.random() * 10 - 5).toFixed(1),
    levels: generateOrderBook(BASE_PRICES[pair] || 1, pair),
  };
}

const ALL_PAIR_LIST = Object.values(ALL_PAIRS_DATA).flatMap(g => g.pairs);

function generateAllData(): InstitutionalData[] {
  return ALL_PAIR_LIST.map(generateDataForPair);
}

export default function OrderFlowAnalysis() {
  const { t } = useTranslation();
  const [data, setData] = useState(() => generateAllData());
  const [loading, setLoading] = useState(false);
  const [selectedPair, setSelectedPair] = useState('EUR/USD');
  const [pairSearch, setPairSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const refresh = () => {
    setLoading(true);
    setTimeout(() => { setData(generateAllData()); setLoading(false); }, 600);
  };

  const selected = data.find(d => d.pair === selectedPair)!;

  const volumeChartData = useMemo(() =>
    selected.levels.map(l => ({
      price: l.price,
      bid: l.bidVolume,
      ask: -l.askVolume,
      delta: l.delta,
    }))
  , [selected]);

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
              <Zap className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-bold text-foreground">{t('tp_order_flow')}</h1>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={refresh} disabled={loading}>
            <RefreshCw className={cn('w-4 h-4 text-muted-foreground', loading && 'animate-spin')} />
          </Button>
        </div>

        {/* Pair Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          {VISIBLE_PAIRS.map(p => (
            <button
              key={p}
              onClick={() => setSelectedPair(p)}
              className={cn(
                'px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all border',
                selectedPair === p
                  ? 'bg-primary/15 border-primary text-primary shadow-sm shadow-primary/10'
                  : 'bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
              )}
            >
              {p}
            </button>
          ))}
          
          <DropdownMenu open={dropdownOpen} onOpenChange={(open) => { setDropdownOpen(open); if (!open) setPairSearch(''); }}>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all border flex items-center gap-1',
                  !VISIBLE_PAIRS.includes(selectedPair)
                    ? 'bg-primary/15 border-primary text-primary shadow-sm shadow-primary/10'
                    : 'bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                )}
              >
                {!VISIBLE_PAIRS.includes(selectedPair) ? selectedPair : t('of_more')}
                <ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="p-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder={t('of_search_pair')}
                    value={pairSearch}
                    onChange={(e) => setPairSearch(e.target.value)}
                    className="h-8 pl-7 text-xs"
                    autoFocus
                  />
                </div>
              </div>
              <ScrollArea className="h-64">
                {Object.entries(ALL_PAIRS).map(([group, pairs]) => {
                  const filtered = pairs.filter(p => 
                    p.toLowerCase().includes(pairSearch.toLowerCase())
                  );
                  if (filtered.length === 0) return null;
                  return (
                    <div key={group}>
                      <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {group}
                      </DropdownMenuLabel>
                      {filtered.map(p => (
                        <DropdownMenuItem
                          key={p}
                          onClick={() => { setSelectedPair(p); setDropdownOpen(false); setPairSearch(''); }}
                          className={cn(
                            'text-xs cursor-pointer',
                            selectedPair === p && 'bg-primary/10 text-primary font-semibold'
                          )}
                        >
                          {p}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                    </div>
                  );
                })}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Institutional Positioning */}
        <Card className="bg-card border-border">
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">{t('tp_institutional_positioning')}</h3>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-emerald-500/30 rounded-l-lg h-8 flex items-center justify-end pr-2" style={{ width: `${selected.longPercent}%` }}>
                <span className="text-xs font-bold text-emerald-400">{selected.longPercent}% Long</span>
              </div>
              <div className="flex-1 bg-rose-500/30 rounded-r-lg h-8 flex items-center pl-2" style={{ width: `${selected.shortPercent}%` }}>
                <span className="text-xs font-bold text-rose-400">{selected.shortPercent}% Short</span>
              </div>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-muted-foreground">
                {t('tp_net_bias')}: <span className={cn('font-bold', selected.netPosition === 'long' ? 'text-emerald-400' : 'text-rose-400')}>
                  {selected.netPosition === 'long' ? t('tp_bullish_label') : t('tp_bearish_label')}
                </span>
              </span>
              <span className={cn('font-bold tabular-nums', selected.change > 0 ? 'text-emerald-400' : 'text-rose-400')}>
                {selected.change > 0 ? '+' : ''}{selected.change}% {t('tp_change_label')}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Volume Profile */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">{t('tp_volume_profile')}</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeChartData} layout="vertical" barGap={0}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis dataKey="price" type="category" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} width={60} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
                  <Bar dataKey="bid" fill="hsl(142 71% 45% / 0.6)" name="Bid" />
                  <Bar dataKey="ask" fill="hsl(0 84% 60% / 0.6)" name="Ask" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Delta Table */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">{t('tp_delta_by_level')}</h3>
            <div className="space-y-0.5 max-h-60 overflow-y-auto">
              {selected.levels.map((l, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded text-xs">
                  <span className="text-muted-foreground tabular-nums w-20">{l.price}</span>
                  <div className="flex-1 mx-3">
                    <div className="relative h-3 bg-muted/30 rounded overflow-hidden">
                      {l.delta > 0 ? (
                        <div className="absolute left-1/2 h-full bg-emerald-500/50 rounded" style={{ width: `${Math.min(Math.abs(l.delta) / 5, 50)}%` }} />
                      ) : (
                        <div className="absolute right-1/2 h-full bg-rose-500/50 rounded" style={{ width: `${Math.min(Math.abs(l.delta) / 5, 50)}%` }} />
                      )}
                    </div>
                  </div>
                  <span className={cn('font-bold tabular-nums w-12 text-right', l.delta > 0 ? 'text-emerald-400' : 'text-rose-400')}>
                    {l.delta > 0 ? '+' : ''}{l.delta}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* All Pairs Summary */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">{t('tp_multi_pair_summary')}</h3>
            {data.slice(0, 10).map(d => (
              <div key={d.pair} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                <span className="text-xs font-medium text-foreground">{d.pair}</span>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-muted/30 rounded-full overflow-hidden flex">
                    <div className="bg-emerald-500/60 h-full" style={{ width: `${d.longPercent}%` }} />
                    <div className="bg-rose-500/60 h-full" style={{ width: `${d.shortPercent}%` }} />
                  </div>
                  <span className={cn('text-[10px] font-bold w-8 text-right', d.netPosition === 'long' ? 'text-emerald-400' : 'text-rose-400')}>
                    {d.longPercent}%
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {t('tp_order_flow_info')}
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </PageShell>
  );
}
