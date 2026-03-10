import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Activity, Zap, DollarSign, Clock, RefreshCw, TrendingUp, AlertCircle, Bell, BellOff, Settings2, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid } from 'recharts';
import { toast } from '@/hooks/use-toast';

interface UsageLog {
  id: string;
  provider: string;
  function_name: string;
  model: string | null;
  tokens_input: number;
  tokens_output: number;
  tokens_total: number;
  estimated_cost: number;
  response_status: number | null;
  latency_ms: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

const PROVIDER_COLORS: Record<string, string> = {
  lovable_ai: '#f59e0b',
  alpha_vantage: '#3b82f6',
  polygon: '#8b5cf6',
  twelve_data: '#10b981',
  fmp: '#ef4444',
  finnhub: '#06b6d4',
  newsapi: '#f97316',
  marketaux: '#ec4899',
  rapidapi: '#6366f1',
  yahoo_finance: '#14b8a6',
};

const PROVIDER_LABELS: Record<string, string> = {
  lovable_ai: 'Lovable AI (Gemini/GPT)',
  alpha_vantage: 'Alpha Vantage',
  polygon: 'Polygon.io',
  twelve_data: 'Twelve Data',
  fmp: 'FMP (Financial Modeling)',
  finnhub: 'Finnhub',
  newsapi: 'NewsAPI',
  marketaux: 'MarketAux',
  rapidapi: 'RapidAPI',
  yahoo_finance: 'Yahoo Finance',
};

const TIME_RANGES = [
  { value: '1h', label: 'Última hora' },
  { value: '24h', label: 'Últimas 24h' },
  { value: '7d', label: 'Últimos 7 días' },
  { value: '30d', label: 'Últimos 30 días' },
];

interface AlertThresholds {
  enabled: boolean;
  dailyTokensLimit: number;
  dailyCostLimit: number;
  errorRateLimit: number;
  latencyLimit: number;
}

const DEFAULT_THRESHOLDS: AlertThresholds = {
  enabled: true,
  dailyTokensLimit: 500000,
  dailyCostLimit: 5.0,
  errorRateLimit: 10,
  latencyLimit: 5000,
};

const THRESHOLDS_KEY = 'admin_api_usage_alert_thresholds';

function loadThresholds(): AlertThresholds {
  try {
    const stored = localStorage.getItem(THRESHOLDS_KEY);
    if (stored) return { ...DEFAULT_THRESHOLDS, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_THRESHOLDS;
}

function saveThresholds(t: AlertThresholds) {
  localStorage.setItem(THRESHOLDS_KEY, JSON.stringify(t));
}

function getTimeFilter(range: string): string {
  const now = new Date();
  switch (range) {
    case '1h': return new Date(now.getTime() - 3600000).toISOString();
    case '24h': return new Date(now.getTime() - 86400000).toISOString();
    case '7d': return new Date(now.getTime() - 604800000).toISOString();
    case '30d': return new Date(now.getTime() - 2592000000).toISOString();
    default: return new Date(now.getTime() - 86400000).toISOString();
  }
}

export function AdminAPIUsageTab() {
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');

  const [thresholds, setThresholds] = useState<AlertThresholds>(loadThresholds);
  const [showThresholdConfig, setShowThresholdConfig] = useState(false);

  const updateThreshold = useCallback((key: keyof AlertThresholds, value: number | boolean) => {
    setThresholds(prev => {
      const next = { ...prev, [key]: value };
      saveThresholds(next);
      return next;
    });
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const since = getTimeFilter(timeRange);
    let query = supabase
      .from('api_usage_logs')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (selectedProvider !== 'all') {
      query = query.eq('provider', selectedProvider);
    }

    const { data, error } = await query;
    if (!error && data) {
      setLogs(data as unknown as UsageLog[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [timeRange, selectedProvider]);

  const stats = useMemo(() => {
    const totalTokens = logs.reduce((s, l) => s + (l.tokens_total || 0), 0);
    const totalCost = logs.reduce((s, l) => s + Number(l.estimated_cost || 0), 0);
    const totalCalls = logs.length;
    const avgLatency = logs.length > 0
      ? Math.round(logs.reduce((s, l) => s + (l.latency_ms || 0), 0) / logs.length)
      : 0;
    const errorCount = logs.filter(l => l.response_status && l.response_status >= 400).length;
    const errorRate = totalCalls > 0 ? ((errorCount / totalCalls) * 100).toFixed(1) : '0';

    return { totalTokens, totalCost, totalCalls, avgLatency, errorCount, errorRate: parseFloat(errorRate) };
  }, [logs]);

  const formatTokens = (n: number) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
  const formatCost = (n: number) => `$${n.toFixed(4)}`;
  }, [logs]);

  // Alert conditions
  const alerts = useMemo(() => {
    if (!thresholds.enabled) return [];
    const a: { type: 'warning' | 'critical'; message: string; metric: string; value: string; limit: string }[] = [];
    const { totalTokens, totalCost, avgLatency } = stats;
    const errorRate = stats.totalCalls > 0 ? (stats.errorCount / stats.totalCalls) * 100 : 0;

    if (totalTokens >= thresholds.dailyTokensLimit) {
      const isCritical = totalTokens >= thresholds.dailyTokensLimit * 1.5;
      a.push({
        type: isCritical ? 'critical' : 'warning',
        message: isCritical ? 'Consumo de tokens MUY por encima del límite' : 'Límite de tokens diarios alcanzado',
        metric: 'Tokens', value: formatTokens(totalTokens), limit: formatTokens(thresholds.dailyTokensLimit),
      });
    } else if (totalTokens >= thresholds.dailyTokensLimit * 0.8) {
      a.push({ type: 'warning', message: 'Consumo de tokens cerca del límite (80%)', metric: 'Tokens', value: formatTokens(totalTokens), limit: formatTokens(thresholds.dailyTokensLimit) });
    }

    if (totalCost >= thresholds.dailyCostLimit) {
      const isCritical = totalCost >= thresholds.dailyCostLimit * 1.5;
      a.push({
        type: isCritical ? 'critical' : 'warning',
        message: isCritical ? 'Costo MUY por encima del presupuesto' : 'Presupuesto de costo diario alcanzado',
        metric: 'Costo', value: formatCost(totalCost), limit: formatCost(thresholds.dailyCostLimit),
      });
    } else if (totalCost >= thresholds.dailyCostLimit * 0.8) {
      a.push({ type: 'warning', message: 'Costo cerca del presupuesto (80%)', metric: 'Costo', value: formatCost(totalCost), limit: formatCost(thresholds.dailyCostLimit) });
    }

    if (errorRate >= thresholds.errorRateLimit) {
      a.push({ type: 'critical', message: 'Tasa de error por encima del umbral', metric: 'Error Rate', value: `${errorRate.toFixed(1)}%`, limit: `${thresholds.errorRateLimit}%` });
    }

    if (avgLatency >= thresholds.latencyLimit) {
      a.push({ type: 'warning', message: 'Latencia promedio por encima del umbral', metric: 'Latencia', value: `${avgLatency}ms`, limit: `${thresholds.latencyLimit}ms` });
    }

    return a;
  }, [stats, thresholds, formatTokens, formatCost]);

  // Per-provider breakdown
  const providerBreakdown = useMemo(() => {
    const map: Record<string, { calls: number; tokens: number; cost: number; errors: number; avgLatency: number }> = {};
    logs.forEach(l => {
      if (!map[l.provider]) map[l.provider] = { calls: 0, tokens: 0, cost: 0, errors: 0, avgLatency: 0 };
      map[l.provider].calls++;
      map[l.provider].tokens += l.tokens_total || 0;
      map[l.provider].cost += Number(l.estimated_cost || 0);
      if (l.response_status && l.response_status >= 400) map[l.provider].errors++;
      map[l.provider].avgLatency += l.latency_ms || 0;
    });
    return Object.entries(map)
      .map(([provider, d]) => ({
        provider,
        label: PROVIDER_LABELS[provider] || provider,
        color: PROVIDER_COLORS[provider] || '#6b7280',
        ...d,
        avgLatency: d.calls > 0 ? Math.round(d.avgLatency / d.calls) : 0,
      }))
      .sort((a, b) => b.cost - a.cost);
  }, [logs]);

  // Pie chart data for cost distribution
  const costPieData = useMemo(() =>
    providerBreakdown.filter(p => p.cost > 0).map(p => ({
      name: p.label,
      value: Number(p.cost.toFixed(4)),
      fill: p.color,
    })),
  [providerBreakdown]);

  // Timeline chart (hourly/daily aggregation)
  const timelineData = useMemo(() => {
    const bucketMs = timeRange === '1h' ? 300000 : timeRange === '24h' ? 3600000 : 86400000;
    const buckets: Record<string, { time: string; tokens: number; cost: number; calls: number }> = {};
    logs.forEach(l => {
      const t = new Date(l.created_at);
      const bucketTime = new Date(Math.floor(t.getTime() / bucketMs) * bucketMs);
      const key = bucketTime.toISOString();
      if (!buckets[key]) {
        buckets[key] = {
          time: timeRange === '1h' || timeRange === '24h'
            ? bucketTime.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
            : bucketTime.toLocaleDateString('es', { day: '2-digit', month: 'short' }),
          tokens: 0, cost: 0, calls: 0,
        };
      }
      buckets[key].tokens += l.tokens_total || 0;
      buckets[key].cost += Number(l.estimated_cost || 0);
      buckets[key].calls++;
    });
    return Object.values(buckets).reverse();
  }, [logs, timeRange]);

  // Model breakdown for AI providers
  const modelBreakdown = useMemo(() => {
    const map: Record<string, { calls: number; tokens: number; cost: number }> = {};
    logs.filter(l => l.model).forEach(l => {
      const m = l.model!;
      if (!map[m]) map[m] = { calls: 0, tokens: 0, cost: 0 };
      map[m].calls++;
      map[m].tokens += l.tokens_total || 0;
      map[m].cost += Number(l.estimated_cost || 0);
    });
    return Object.entries(map).map(([model, d]) => ({ model, ...d })).sort((a, b) => b.tokens - a.tokens);
  }, [logs]);

  const providers = useMemo(() => {
    const set = new Set(logs.map(l => l.provider));
    return Array.from(set).sort();
  }, [logs]);


  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[160px] bg-white/5 border-white/10 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIME_RANGES.map(r => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedProvider} onValueChange={setSelectedProvider}>
          <SelectTrigger className="w-[200px] bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Todos los proveedores" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los proveedores</SelectItem>
            {providers.map(p => (
              <SelectItem key={p} value={p}>{PROVIDER_LABELS[p] || p}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="ghost" size="sm" onClick={fetchLogs} className="text-white/40 hover:text-white">
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Actualizar
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="bg-white/[0.03] border-white/5 p-4">
          <div className="flex items-center gap-2 text-white/40 text-xs mb-1">
            <Activity className="h-3.5 w-3.5" /> Llamadas API
          </div>
          <div className="text-2xl font-bold text-white">{stats.totalCalls.toLocaleString()}</div>
        </Card>
        <Card className="bg-white/[0.03] border-white/5 p-4">
          <div className="flex items-center gap-2 text-white/40 text-xs mb-1">
            <Zap className="h-3.5 w-3.5" /> Tokens Totales
          </div>
          <div className="text-2xl font-bold text-amber-400">{formatTokens(stats.totalTokens)}</div>
        </Card>
        <Card className="bg-white/[0.03] border-white/5 p-4">
          <div className="flex items-center gap-2 text-white/40 text-xs mb-1">
            <DollarSign className="h-3.5 w-3.5" /> Costo Estimado
          </div>
          <div className="text-2xl font-bold text-emerald-400">{formatCost(stats.totalCost)}</div>
        </Card>
        <Card className="bg-white/[0.03] border-white/5 p-4">
          <div className="flex items-center gap-2 text-white/40 text-xs mb-1">
            <Clock className="h-3.5 w-3.5" /> Latencia Prom.
          </div>
          <div className="text-2xl font-bold text-white">{stats.avgLatency}ms</div>
        </Card>
        <Card className="bg-white/[0.03] border-white/5 p-4">
          <div className="flex items-center gap-2 text-white/40 text-xs mb-1">
            <AlertCircle className="h-3.5 w-3.5" /> Tasa de Error
          </div>
          <div className="text-2xl font-bold text-red-400">{stats.errorRate}%</div>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
        </div>
      ) : logs.length === 0 ? (
        <Card className="bg-white/[0.03] border-white/5 p-8 text-center">
          <Activity className="h-10 w-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm">No hay registros de uso en este período.</p>
          <p className="text-white/20 text-xs mt-1">Los logs se registran automáticamente cuando las funciones hacen llamadas a APIs externas.</p>
        </Card>
      ) : (
        <>
          {/* Timeline Chart */}
          {timelineData.length > 1 && (
            <Card className="bg-white/[0.03] border-white/5 p-4">
              <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">Uso en el Tiempo</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} />
                  <Tooltip
                    contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11, color: '#fff' }}
                    formatter={(value: number, name: string) => [name === 'tokens' ? formatTokens(value) : name === 'cost' ? formatCost(value) : value, name === 'tokens' ? 'Tokens' : name === 'cost' ? 'Costo' : 'Llamadas']}
                  />
                  <Area type="monotone" dataKey="calls" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {/* Provider Breakdown Table */}
            <Card className="bg-white/[0.03] border-white/5 p-4">
              <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">Consumo por Proveedor</h3>
              <div className="space-y-2">
                {providerBreakdown.map(p => (
                  <div key={p.provider} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-white/80 truncate">{p.label}</div>
                      <div className="flex gap-3 text-[10px] text-white/30 mt-0.5">
                        <span>{p.calls} calls</span>
                        <span>{formatTokens(p.tokens)} tokens</span>
                        <span>{p.avgLatency}ms avg</span>
                        {p.errors > 0 && <span className="text-red-400">{p.errors} errors</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-semibold text-emerald-400">{formatCost(p.cost)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Cost Distribution Pie */}
            {costPieData.length > 0 && (
              <Card className="bg-white/[0.03] border-white/5 p-4">
                <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">Distribución de Costos</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={costPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={40}
                      paddingAngle={2}
                    >
                      {costPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11, color: '#fff' }}
                      formatter={(value: number) => [formatCost(value), 'Costo']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-2">
                  {costPieData.map(d => (
                    <div key={d.name} className="flex items-center gap-1.5 text-[10px] text-white/40">
                      <div className="w-2 h-2 rounded-full" style={{ background: d.fill }} />
                      {d.name}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* AI Models Breakdown */}
          {modelBreakdown.length > 0 && (
            <Card className="bg-white/[0.03] border-white/5 p-4">
              <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">Consumo por Modelo IA</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-white/30 border-b border-white/5">
                      <th className="text-left py-2 px-2 font-medium">Modelo</th>
                      <th className="text-right py-2 px-2 font-medium">Llamadas</th>
                      <th className="text-right py-2 px-2 font-medium">Tokens</th>
                      <th className="text-right py-2 px-2 font-medium">Costo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modelBreakdown.map(m => (
                      <tr key={m.model} className="border-b border-white/5 last:border-0">
                        <td className="py-2 px-2 text-white/70 font-mono text-[11px]">{m.model}</td>
                        <td className="py-2 px-2 text-right text-white/50">{m.calls}</td>
                        <td className="py-2 px-2 text-right text-amber-400">{formatTokens(m.tokens)}</td>
                        <td className="py-2 px-2 text-right text-emerald-400">{formatCost(m.cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Recent Logs */}
          <Card className="bg-white/[0.03] border-white/5 p-4">
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">Últimos Registros</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-white/30 border-b border-white/5">
                    <th className="text-left py-2 px-2 font-medium">Hora</th>
                    <th className="text-left py-2 px-2 font-medium">Proveedor</th>
                    <th className="text-left py-2 px-2 font-medium">Función</th>
                    <th className="text-left py-2 px-2 font-medium">Modelo</th>
                    <th className="text-right py-2 px-2 font-medium">Tokens</th>
                    <th className="text-right py-2 px-2 font-medium">Costo</th>
                    <th className="text-right py-2 px-2 font-medium">Latencia</th>
                    <th className="text-center py-2 px-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.slice(0, 50).map(l => (
                    <tr key={l.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                      <td className="py-1.5 px-2 text-white/40 font-mono whitespace-nowrap">
                        {new Date(l.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-1.5 px-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: PROVIDER_COLORS[l.provider] || '#6b7280' }} />
                          <span className="text-white/60">{PROVIDER_LABELS[l.provider] || l.provider}</span>
                        </div>
                      </td>
                      <td className="py-1.5 px-2 text-white/40 font-mono">{l.function_name}</td>
                      <td className="py-1.5 px-2 text-white/30 font-mono text-[10px]">{l.model || '—'}</td>
                      <td className="py-1.5 px-2 text-right text-amber-400/70">{l.tokens_total > 0 ? formatTokens(l.tokens_total) : '—'}</td>
                      <td className="py-1.5 px-2 text-right text-emerald-400/70">{Number(l.estimated_cost) > 0 ? formatCost(Number(l.estimated_cost)) : '—'}</td>
                      <td className="py-1.5 px-2 text-right text-white/40">{l.latency_ms ? `${l.latency_ms}ms` : '—'}</td>
                      <td className="py-1.5 px-2 text-center">
                        {l.response_status ? (
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${l.response_status < 400 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                            {l.response_status}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
