import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DollarSign, TrendingUp, Wallet, ArrowDownUp } from 'lucide-react';
import { useTranslation } from '@/i18n/LanguageContext';

interface FinancialsData {
  income: any[];
  balance: any[];
  cashFlow: any[];
}

interface Props {
  data: FinancialsData | undefined;
  loading: boolean;
}

function formatBigNumber(n: number): string {
  if (!n) return '$0';
  const abs = Math.abs(n);
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

const tooltipStyle = {
  backgroundColor: 'hsl(220, 40%, 8%)',
  border: '1px solid hsl(200, 60%, 25%)',
  borderRadius: '8px',
  fontSize: '11px',
  color: 'white',
};

function IncomeChart({ data, t }: { data: any[]; t: (k: any) => string }) {
  const chartData = [...data].reverse().map(d => ({
    year: d.calendarYear || d.date?.slice(0, 4),
    revenue: d.revenue,
    netIncome: d.netIncome,
    grossProfit: d.grossProfit,
  }));

  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
          <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'hsl(210, 30%, 40%)' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 9, fill: 'hsl(210, 30%, 40%)' }} tickLine={false} axisLine={false} tickFormatter={(v) => formatBigNumber(v)} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: 'hsl(200, 40%, 60%)' }}
            formatter={(v: number, name: string) => [formatBigNumber(v), name === 'revenue' ? t('stock_revenue') : name === 'netIncome' ? t('stock_net_income') : t('stock_gross_profit')]}
          />
          <Bar dataKey="revenue" fill="hsl(200, 80%, 50%)" radius={[3, 3, 0, 0]} />
          <Bar dataKey="netIncome" radius={[3, 3, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.netIncome >= 0 ? 'hsl(142, 70%, 45%)' : 'hsl(0, 70%, 50%)'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {data[0] && (
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: t('stock_revenue'), value: formatBigNumber(data[0].revenue), icon: DollarSign },
            { label: t('stock_net_income'), value: formatBigNumber(data[0].netIncome), icon: TrendingUp },
            { label: t('stock_gross_margin'), value: data[0].revenue ? `${((data[0].grossProfit / data[0].revenue) * 100).toFixed(1)}%` : 'N/A', icon: Wallet },
            { label: t('stock_net_margin'), value: data[0].revenue ? `${((data[0].netIncome / data[0].revenue) * 100).toFixed(1)}%` : 'N/A', icon: ArrowDownUp },
          ].map(m => (
            <div key={m.label} className="bg-[hsl(210,50%,10%)]/80 border border-cyan-800/15 rounded-lg p-2 flex items-center gap-2">
              <m.icon className="w-3.5 h-3.5 text-cyan-400/60 shrink-0" />
              <div>
                <p className="text-[10px] text-cyan-300/40">{m.label}</p>
                <p className="text-xs font-mono font-semibold text-white">{m.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BalanceChart({ data, t }: { data: any[]; t: (k: any) => string }) {
  const chartData = [...data].reverse().map(d => ({
    year: d.calendarYear || d.date?.slice(0, 4),
    totalAssets: d.totalAssets,
    totalDebt: d.totalDebt,
    totalEquity: d.totalStockholdersEquity,
  }));

  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
          <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'hsl(210, 30%, 40%)' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 9, fill: 'hsl(210, 30%, 40%)' }} tickLine={false} axisLine={false} tickFormatter={(v) => formatBigNumber(v)} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: 'hsl(200, 40%, 60%)' }}
            formatter={(v: number, name: string) => [formatBigNumber(v), name === 'totalAssets' ? t('stock_assets') : name === 'totalDebt' ? t('stock_debt') : t('stock_equity')]}
          />
          <Bar dataKey="totalAssets" fill="hsl(200, 80%, 50%)" radius={[3, 3, 0, 0]} />
          <Bar dataKey="totalDebt" fill="hsl(0, 60%, 55%)" radius={[3, 3, 0, 0]} />
          <Bar dataKey="totalEquity" fill="hsl(142, 60%, 45%)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      
      {data[0] && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: t('stock_assets'), value: formatBigNumber(data[0].totalAssets), color: 'text-[hsl(200,80%,50%)]' },
            { label: t('stock_debt'), value: formatBigNumber(data[0].totalDebt), color: 'text-[hsl(0,60%,55%)]' },
            { label: t('stock_equity'), value: formatBigNumber(data[0].totalStockholdersEquity), color: 'text-[hsl(142,60%,45%)]' },
          ].map(m => (
            <div key={m.label} className="bg-[hsl(210,50%,10%)]/80 border border-cyan-800/15 rounded-lg p-2 text-center">
              <p className="text-[10px] text-cyan-300/40">{m.label}</p>
              <p className={`text-xs font-mono font-semibold ${m.color}`}>{m.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CashFlowChart({ data, t }: { data: any[]; t: (k: any) => string }) {
  const chartData = [...data].reverse().map(d => ({
    year: d.calendarYear || d.date?.slice(0, 4),
    operating: d.operatingCashFlow,
    investing: d.netCashUsedForInvestingActivites,
    financing: d.netCashUsedProvidedByFinancingActivities,
    freeCashFlow: d.freeCashFlow,
  }));

  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
          <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'hsl(210, 30%, 40%)' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 9, fill: 'hsl(210, 30%, 40%)' }} tickLine={false} axisLine={false} tickFormatter={(v) => formatBigNumber(v)} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: 'hsl(200, 40%, 60%)' }}
            formatter={(v: number, name: string) => {
              const labels: Record<string, string> = { operating: t('stock_operating_cf'), investing: t('stock_investing'), financing: t('stock_financing'), freeCashFlow: t('stock_free_cf') };
              return [formatBigNumber(v), labels[name] || name];
            }}
          />
          <Bar dataKey="operating" fill="hsl(200, 80%, 50%)" radius={[3, 3, 0, 0]} />
          <Bar dataKey="freeCashFlow" radius={[3, 3, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.freeCashFlow >= 0 ? 'hsl(142, 70%, 45%)' : 'hsl(0, 70%, 50%)'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {data[0] && (
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: t('stock_operating_cf'), value: formatBigNumber(data[0].operatingCashFlow) },
            { label: t('stock_free_cf'), value: formatBigNumber(data[0].freeCashFlow) },
          ].map(m => (
            <div key={m.label} className="bg-[hsl(210,50%,10%)]/80 border border-cyan-800/15 rounded-lg p-2 text-center">
              <p className="text-[10px] text-cyan-300/40">{m.label}</p>
              <p className="text-xs font-mono font-semibold text-white">{m.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function StockFinancialsCard({ data, loading }: Props) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="relative rounded-xl border border-cyan-800/30 overflow-hidden p-4 space-y-3"
        style={{ background: 'radial-gradient(ellipse at center 40%, hsl(200, 100%, 12%) 0%, hsl(205, 100%, 6%) 70%, hsl(210, 100%, 4%) 100%)' }}>
        <Skeleton className="h-5 w-40 bg-slate-800/50" />
        <Skeleton className="h-48 w-full bg-slate-800/50" />
      </div>
    );
  }

  if (!data || (!data.income?.length && !data.balance?.length && !data.cashFlow?.length)) {
    return (
      <div className="relative rounded-xl border border-cyan-800/30 overflow-hidden p-4"
        style={{ background: 'radial-gradient(ellipse at center 40%, hsl(200, 100%, 12%) 0%, hsl(205, 100%, 6%) 70%, hsl(210, 100%, 4%) 100%)' }}>
        <p className="text-sm text-slate-500 text-center py-4">{t('stock_financials_unavailable')}</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl border border-cyan-800/30 overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center 40%, hsl(200, 100%, 12%) 0%, hsl(205, 100%, 6%) 70%, hsl(210, 100%, 4%) 100%)' }}>
      
      <div className="absolute top-0 left-[15%] right-[15%] h-[1px]" style={{ background: 'radial-gradient(ellipse at center, hsl(200, 80%, 55%) 0%, transparent 70%)' }} />
      
      <div className="p-4">
        <h3 className="text-sm font-bold text-cyan-200 mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-cyan-400" />
          {t('stock_financial_statements')}
        </h3>
        <Tabs defaultValue="income" className="w-full">
          <TabsList className="w-full bg-[hsl(210,40%,10%)] border border-cyan-800/20 rounded-lg">
            <TabsTrigger value="income" className="flex-1 text-xs data-[state=active]:bg-cyan-500/15 data-[state=active]:text-cyan-300 text-slate-500 rounded-md">{t('stock_income')}</TabsTrigger>
            <TabsTrigger value="balance" className="flex-1 text-xs data-[state=active]:bg-cyan-500/15 data-[state=active]:text-cyan-300 text-slate-500 rounded-md">{t('stock_balance')}</TabsTrigger>
            <TabsTrigger value="cashflow" className="flex-1 text-xs data-[state=active]:bg-cyan-500/15 data-[state=active]:text-cyan-300 text-slate-500 rounded-md">{t('stock_cash_flow')}</TabsTrigger>
          </TabsList>
          <TabsContent value="income" className="mt-3">
            {data.income?.length > 0 ? <IncomeChart data={data.income} t={t} /> : <p className="text-xs text-slate-500 text-center py-4">{t('stock_no_data')}</p>}
          </TabsContent>
          <TabsContent value="balance" className="mt-3">
            {data.balance?.length > 0 ? <BalanceChart data={data.balance} t={t} /> : <p className="text-xs text-slate-500 text-center py-4">{t('stock_no_data')}</p>}
          </TabsContent>
          <TabsContent value="cashflow" className="mt-3">
            {data.cashFlow?.length > 0 ? <CashFlowChart data={data.cashFlow} t={t} /> : <p className="text-xs text-slate-500 text-center py-4">{t('stock_no_data')}</p>}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}