import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/layout/BottomNav';
import { MainDrawer } from '@/components/layout/MainDrawer';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Menu, Brain, Activity, BarChart3, Clock, Wifi, WifiOff, TrendingUp, TrendingDown, Minus, Loader2, Wallet, Newspaper } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrencyStrength, CurrencyStrengthData, CorrelationEntry } from '@/hooks/useCurrencyStrength';
import { useRealtimeMarket } from '@/hooks/useRealtimeMarket';
// Removed PriceSparkline import - using inline mini chart
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

// ─── Real-time Strength Meter ─────────────────────────────────
function StrengthMeter({ currencies, isConnected }: { currencies: CurrencyStrengthData[]; isConnected: boolean }) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'hsl(215, 100%, 4%)', border: '1px solid hsla(200, 60%, 35%, 0.3)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Fuerza Relativa</h3>
        </div>
        <span className={cn('flex items-center gap-1 text-[10px]', isConnected ? 'text-green-400' : 'text-red-400')}>
          {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {isConnected ? 'Live' : 'Offline'}
        </span>
      </div>

      <div className="space-y-4">
        {currencies.map((c) => {
          const isPositive = c.strength >= 0;
          const absStrength = Math.min(100, Math.abs(c.strength));
          return (
            <div key={c.currency} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{c.flag}</span>
                  <span className="text-sm font-bold text-slate-200 font-mono">{c.currency}</span>
                  <span className="text-[10px] text-slate-500">{c.name}</span>
                </div>
                <span className={cn('text-sm font-bold font-mono', isPositive ? 'text-green-400' : 'text-red-400')}>
                  {isPositive ? '+' : ''}{c.strength.toFixed(1)}
                </span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden relative">
                <div className="absolute inset-y-0 left-1/2 w-px bg-slate-600" />
                <div
                  className={cn('absolute inset-y-0 rounded-full transition-all duration-700', isPositive ? 'bg-green-500' : 'bg-red-500')}
                  style={{
                    left: isPositive ? '50%' : `${50 - absStrength / 2}%`,
                    width: `${absStrength / 2}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Live Sparklines Panel ────────────────────────────────────
function LiveSparklines() {
  const pairs = ['EUR/USD', 'GBP/USD', 'EUR/GBP'];
  const symbols = pairs.map(p => `C:${p.replace('/', '')}`);
  const { getQuote, isConnected } = useRealtimeMarket(symbols);

  return (
    <div className="rounded-xl p-4" style={{ background: 'hsl(215, 100%, 4%)', border: '1px solid hsla(200, 60%, 35%, 0.3)' }}>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-blue-400" />
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Precios en Vivo</h3>
      </div>
      <div className="space-y-3">
        {pairs.map((pair) => {
          const symbol = `C:${pair.replace('/', '')}`;
          const quote = getQuote(symbol);
          return (
            <div key={pair} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
              <span className="text-sm font-bold text-slate-200 font-mono w-20">{pair}</span>
              <div className="flex-1 h-8 flex items-center justify-center">
                {quote ? (
                  <div className="w-full h-full bg-slate-700/20 rounded flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-600">Sin datos</span>
                )}
              </div>
              <span className={cn('text-sm font-mono font-bold', quote ? 'text-slate-100' : 'text-slate-500')}>
                {quote ? quote.price.toFixed(pair.includes('JPY') ? 3 : 5) : '—'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Signal Impact (Real-time) ────────────────────────────────
function SignalImpact() {
  const { data: signals, isLoading } = useQuery({
    queryKey: ['currency-impact-signals', 'EUR', 'USD', 'GBP'],
    queryFn: async () => {
      const currencies = ['EUR', 'USD', 'GBP'];
      const possiblePairs: string[] = [];
      for (let i = 0; i < currencies.length; i++) {
        for (let j = 0; j < currencies.length; j++) {
          if (i === j) continue;
          possiblePairs.push(`${currencies[i]}/${currencies[j]}`);
          possiblePairs.push(`${currencies[i]}${currencies[j]}`);
        }
      }
      const { data, error } = await supabase
        .from('trading_signals')
        .select('id, currency_pair, entry_price, action, trend, probability, take_profit, stop_loss')
        .in('currency_pair', possiblePairs)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const polygonSymbols = useMemo(
    () => (signals || []).map(s => `C:${s.currency_pair.replace(/[^A-Z]/g, '')}`),
    [signals]
  );
  const { getQuote, isConnected } = useRealtimeMarket(polygonSymbols.length > 0 ? polygonSymbols : []);

  if (isLoading) {
    return (
      <div className="rounded-xl p-6 flex items-center justify-center" style={{ background: 'hsl(215, 100%, 4%)', border: '1px solid hsla(200, 60%, 35%, 0.3)' }}>
        <span className="text-sm text-slate-400 animate-pulse">Cargando señales...</span>
      </div>
    );
  }

  if (!signals || signals.length === 0) {
    return (
      <div className="rounded-xl p-6 text-center" style={{ background: 'hsl(215, 100%, 4%)', border: '1px solid hsla(200, 60%, 35%, 0.3)' }}>
        <span className="text-sm text-slate-500">No hay señales activas para EUR/USD/GBP</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-4" style={{ background: 'hsl(215, 100%, 4%)', border: '1px solid hsla(200, 60%, 35%, 0.3)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Señales Activas</h3>
        </div>
        {isConnected && (
          <span className="flex items-center gap-1 text-[10px] text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Live
          </span>
        )}
      </div>
      <div className="space-y-2">
        {signals.map((signal) => {
          const sym = `C:${signal.currency_pair.replace(/[^A-Z]/g, '')}`;
          const quote = getQuote(sym);
          const entry = Number(signal.entry_price);
          const diff = quote ? ((quote.price - entry) / entry) * 100 : null;
          const isJPY = signal.currency_pair.includes('JPY');
          const pips = quote ? (quote.price - entry) * (isJPY ? 100 : 10000) : null;

          return (
            <div key={signal.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-200">{signal.currency_pair}</span>
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium',
                    signal.action === 'BUY' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400')}>
                    {signal.action}
                  </span>
                  <span className="text-[10px] text-slate-500">{signal.probability}%</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                  <span>Entrada: {entry.toFixed(isJPY ? 3 : 5)}</span>
                  {quote && <span className="text-slate-300">Actual: {quote.price.toFixed(isJPY ? 3 : 5)}</span>}
                </div>
              </div>
              <div className="text-right">
                {diff !== null ? (
                  <>
                    <span className={cn('text-sm font-bold font-mono', diff >= 0 ? 'text-green-400' : 'text-red-400')}>
                      {diff >= 0 ? '+' : ''}{diff.toFixed(3)}%
                    </span>
                    <span className={cn('block text-[10px] font-mono', diff >= 0 ? 'text-green-400/70' : 'text-red-400/70')}>
                      {pips !== null ? `${pips >= 0 ? '+' : ''}${pips.toFixed(1)} pips` : ''}
                    </span>
                  </>
                ) : (
                  <Minus className="w-4 h-4 text-slate-600" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Correlation Heatmap ──────────────────────────────────────
function CorrelationHeatmap({ correlations }: { correlations: CorrelationEntry[] }) {
  const currencies = ['EUR/USD', 'GBP/USD', 'EUR/GBP'];
  
  const getCorrelation = (p1: string, p2: string) => {
    if (p1 === p2) return 1;
    const entry = correlations.find(c => 
      (c.pair1 === p1 && c.pair2 === p2) || (c.pair1 === p2 && c.pair2 === p1)
    );
    return entry?.correlation ?? 0;
  };

  const getColor = (val: number) => {
    if (val > 0.7) return 'bg-green-500/40 text-green-300';
    if (val > 0.3) return 'bg-green-500/20 text-green-400';
    if (val > -0.3) return 'bg-slate-700/40 text-slate-300';
    if (val > -0.7) return 'bg-red-500/20 text-red-400';
    return 'bg-red-500/40 text-red-300';
  };

  return (
    <div className="rounded-xl p-4" style={{ background: 'hsl(215, 100%, 4%)', border: '1px solid hsla(200, 60%, 35%, 0.3)' }}>
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-blue-400" />
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Correlación</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-center">
          <thead>
            <tr>
              <th className="p-2 text-[10px] text-slate-500" />
              {currencies.map(c => (
                <th key={c} className="p-2 text-[10px] font-mono text-slate-400">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currencies.map(row => (
              <tr key={row}>
                <td className="p-2 text-[10px] font-mono text-slate-400 text-right">{row}</td>
                {currencies.map(col => {
                  const val = getCorrelation(row, col);
                  return (
                    <td key={col} className="p-1.5">
                      <div className={cn('rounded-lg py-2 px-1 text-xs font-mono font-bold', getColor(val))}>
                        {val === 1 ? '1.00' : val.toFixed(2)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-center gap-3 mt-3">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500/40" />
          <span className="text-[9px] text-slate-500">Negativa</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-slate-700/40" />
          <span className="text-[9px] text-slate-500">Neutral</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500/40" />
          <span className="text-[9px] text-slate-500">Positiva</span>
        </div>
      </div>
    </div>
  );
}

// ─── Weekly Performance Table (Historical) ────────────────────
function WeeklyPerformanceTable() {
  // Mock data representing weekly performance
  const weeks = useMemo(() => {
    const data = [];
    const now = new Date();
    for (let w = 0; w < 8; w++) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - w * 7);
      const label = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
      data.push({
        week: `Sem ${label}`,
        EUR: (Math.random() - 0.5) * 3,
        USD: (Math.random() - 0.5) * 2.5,
        GBP: (Math.random() - 0.5) * 2.8,
      });
    }
    return data.reverse();
  }, []);

  return (
    <div className="rounded-xl p-4" style={{ background: 'hsl(215, 100%, 4%)', border: '1px solid hsla(200, 60%, 35%, 0.3)' }}>
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-blue-400" />
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Rendimiento Semanal</h3>
      </div>
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="text-left p-2 text-[10px] text-slate-500 font-medium">Semana</th>
              <th className="text-center p-2 text-[10px] text-slate-500 font-medium">🇪🇺 EUR</th>
              <th className="text-center p-2 text-[10px] text-slate-500 font-medium">🇺🇸 USD</th>
              <th className="text-center p-2 text-[10px] text-slate-500 font-medium">🇬🇧 GBP</th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((w, i) => (
              <tr key={i} className="border-b border-slate-800/30">
                <td className="p-2 text-[11px] text-slate-400 font-mono">{w.week}</td>
                {(['EUR', 'USD', 'GBP'] as const).map(c => {
                  const val = w[c];
                  return (
                    <td key={c} className="p-2 text-center">
                      <span className={cn('text-[11px] font-mono font-bold', val >= 0 ? 'text-green-400' : 'text-red-400')}>
                        {val >= 0 ? '+' : ''}{val.toFixed(2)}%
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
const CurrencyImpact = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { currencies, correlations, isConnected } = useCurrencyStrength();

  const getInitials = () => {
    if (profile?.first_name) return `${profile.first_name.charAt(0)}${profile.last_name?.charAt(0) || ''}`.toUpperCase();
    if (user?.email) return user.email.substring(0, 2).toUpperCase();
    return 'U';
  };

  return (
    <div className="min-h-screen bg-[#06080f] flex justify-center">
      <div className="relative w-full max-w-2xl min-h-screen bg-gradient-to-b from-[#0a0f1a] via-[#0d1829] to-[#0a0f1a] pb-20 shadow-2xl">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#0a0f1a]/95 backdrop-blur-sm border-b border-blue-500/20">
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={() => setDrawerOpen(true)} className="p-2 text-blue-300 hover:text-blue-100">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-1">
              <h1 className="text-lg font-bold text-white tracking-wide">
                Impacto <span className="text-yellow-400">$</span> Divisas
              </h1>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => navigate('/portfolio')} className="p-2 text-blue-300 hover:text-blue-100" title="Portafolio">
                <Wallet className="w-5 h-5" />
              </button>
              <button onClick={() => navigate('/signals')} className="p-2 text-blue-300 hover:text-blue-100" title="Señales">
                <TrendingUp className="w-5 h-5" />
              </button>
              <button onClick={() => navigate('/news')} className="p-2 text-blue-300 hover:text-blue-100" title="Noticias">
                <Newspaper className="w-5 h-5" />
              </button>
              <button onClick={() => navigate(user ? '/settings' : '/auth')} className="p-2 text-blue-300 hover:text-blue-100">
                {user ? (
                  <Avatar className="w-8 h-8 border-2 border-blue-500/50">
                    <AvatarImage src={profile?.avatar_url || ''} alt="Avatar" />
                    <AvatarFallback className="bg-blue-600 text-white text-xs">{getInitials()}</AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                )}
              </button>
            </div>
          </div>
        </header>

        <main className="p-4 space-y-4">
          {/* Currency badges */}
          <div className="flex items-center gap-2 justify-center">
            {['🇪🇺 EUR', '🇺🇸 USD', '🇬🇧 GBP'].map(label => (
              <span key={label} className="px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-300 font-mono">
                {label}
              </span>
            ))}
          </div>

          <Tabs defaultValue="realtime" className="space-y-3">
            <TabsList className="bg-slate-800/60 border border-slate-700/50 w-full">
              <TabsTrigger value="realtime" className="flex-1 text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400">
                <Activity className="w-3 h-3 mr-1" /> Tiempo Real
              </TabsTrigger>
              <TabsTrigger value="historical" className="flex-1 text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400">
                <Clock className="w-3 h-3 mr-1" /> Histórico
              </TabsTrigger>
            </TabsList>

            <TabsContent value="realtime" className="space-y-4">
              <StrengthMeter currencies={currencies} isConnected={isConnected} />
              <LiveSparklines />
              <SignalImpact />
              <CorrelationHeatmap correlations={correlations} />
            </TabsContent>

            <TabsContent value="historical" className="space-y-4">
              <WeeklyPerformanceTable />
              <CorrelationHeatmap correlations={correlations} />
            </TabsContent>
          </Tabs>
        </main>

        <MainDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
        <BottomNav />
      </div>
    </div>
  );
};

export default CurrencyImpact;
