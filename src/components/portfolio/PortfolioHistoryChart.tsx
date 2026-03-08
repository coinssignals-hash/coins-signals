import { useState } from 'react';
import {
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine,
  ComposedChart,
  Bar
} from 'recharts';
import { TrendingUp, TrendingDown, Activity, Calendar, RefreshCw } from 'lucide-react';
import { usePortfolioHistory, TimeRange, AggregatedSnapshot } from '@/hooks/usePortfolioHistory';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/i18n/LanguageContext';

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: '1D', label: '1D' },
  { value: '1W', label: '1S' },
  { value: '1M', label: '1M' },
  { value: '3M', label: '3M' },
  { value: 'ALL', label: 'Todo' },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    dataKey: string;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
      <p className="text-slate-400 text-xs mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: entry.color }} 
          />
          <span className="text-slate-300 text-sm">
            {entry.name}: 
          </span>
          <span className={cn(
            "font-medium text-sm",
            entry.dataKey.includes('pnl') 
              ? entry.value >= 0 ? 'text-emerald-400' : 'text-red-400'
              : 'text-white'
          )}>
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export function PortfolioHistoryChart() {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState<TimeRange>('1W');
  const [chartType, setChartType] = useState<'equity' | 'pnl' | 'combined'>('equity');
  const { snapshots, stats, loading, error, refetch } = usePortfolioHistory(timeRange);

  const isPositiveChange = stats.equityChange >= 0;

  if (loading) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-4 border border-red-500/30">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (snapshots.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 text-center">
        <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <h3 className="text-white font-medium mb-1">{t('ph_no_history')}</h3>
        <p className="text-slate-400 text-sm">
          {t('ph_no_history_desc')}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              {t('ph_evolution')}
            </h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-slate-400 text-sm">
                {formatCurrency(stats.endEquity)}
              </span>
              <span className={cn(
                "text-sm font-medium flex items-center gap-1",
                isPositiveChange ? 'text-emerald-400' : 'text-red-400'
              )}>
                {isPositiveChange ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {formatCurrency(stats.equityChange)} ({formatPercent(stats.equityChangePercent)})
              </span>
            </div>
          </div>
          <button
            onClick={refetch}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Time Range */}
          <div className="flex items-center gap-1 bg-slate-900/60 rounded-lg p-1">
            {TIME_RANGES.map(range => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  timeRange === range.value
                    ? "bg-cyan-600 text-white"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {range.label}
              </button>
            ))}
          </div>

          {/* Chart Type */}
          <div className="flex items-center gap-1 bg-slate-900/60 rounded-lg p-1">
            <button
              onClick={() => setChartType('equity')}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                chartType === 'equity'
                  ? "bg-cyan-600 text-white"
                  : "text-slate-400 hover:text-white"
              )}
            >
              Equity
            </button>
            <button
              onClick={() => setChartType('pnl')}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                chartType === 'pnl'
                  ? "bg-cyan-600 text-white"
                  : "text-slate-400 hover:text-white"
              )}
            >
              PnL
            </button>
            <button
              onClick={() => setChartType('combined')}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                chartType === 'combined'
                  ? "bg-cyan-600 text-white"
                  : "text-slate-400 hover:text-white"
              )}
            >
              Combinado
            </button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-4">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'equity' ? (
              <AreaChart data={snapshots}>
                <defs>
                  <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="total_equity"
                  name="Equity"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fill="url(#equityGradient)"
                />
              </AreaChart>
            ) : chartType === 'pnl' ? (
              <ComposedChart data={snapshots}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />
                <Bar
                  dataKey="total_unrealized_pnl"
                  name="PnL No Realizado"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
              </ComposedChart>
            ) : (
              <ComposedChart data={snapshots}>
                <defs>
                  <linearGradient id="equityGradient2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis 
                  yAxisId="left"
                  stroke="#64748b" 
                  fontSize={10}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="#64748b" 
                  fontSize={10}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="total_equity"
                  name="Equity"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fill="url(#equityGradient2)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="total_unrealized_pnl"
                  name="PnL"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats Footer */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBox 
            label={t('ph_initial_equity')} 
            value={formatCurrency(stats.startEquity)} 
          />
          <StatBox 
            label={t('ph_current_equity')} 
            value={formatCurrency(stats.endEquity)} 
          />
          <StatBox 
            label="Máximo" 
            value={formatCurrency(stats.maxEquity)} 
            valueColor="text-emerald-400"
          />
          <StatBox 
            label="PnL Promedio" 
            value={formatCurrency(stats.avgPnl)} 
            valueColor={stats.avgPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}
          />
        </div>
      </div>
    </div>
  );
}

function StatBox({ 
  label, 
  value, 
  valueColor = 'text-white' 
}: { 
  label: string; 
  value: string; 
  valueColor?: string;
}) {
  return (
    <div className="bg-slate-900/50 rounded-lg p-3 text-center">
      <div className="text-slate-500 text-xs mb-1">{label}</div>
      <div className={cn("text-sm font-medium", valueColor)}>{value}</div>
    </div>
  );
}

export function PortfolioMiniChart({ data }: { data: AggregatedSnapshot[] }) {
  if (data.length < 2) return null;

  const change = data[data.length - 1].total_equity - data[0].total_equity;
  const isPositive = change >= 0;

  return (
    <div className="h-12 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="total_equity"
            stroke={isPositive ? '#10b981' : '#ef4444'}
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
