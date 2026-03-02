import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DollarSign, TrendingUp, Wallet, ArrowDownUp } from 'lucide-react';

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

function IncomeChart({ data }: { data: any[] }) {
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
          <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 9, fill: 'hsl(215, 20%, 55%)' }} tickLine={false} axisLine={false} tickFormatter={(v) => formatBigNumber(v)} />
          <Tooltip
            contentStyle={{ backgroundColor: 'hsl(222, 45%, 7%)', border: '1px solid hsl(220, 30%, 15%)', borderRadius: '8px', fontSize: '11px' }}
            formatter={(v: number, name: string) => [formatBigNumber(v), name === 'revenue' ? 'Ingresos' : name === 'netIncome' ? 'Beneficio Neto' : 'Beneficio Bruto']}
          />
          <Bar dataKey="revenue" fill="hsl(200, 80%, 50%)" radius={[3, 3, 0, 0]} />
          <Bar dataKey="netIncome" radius={[3, 3, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.netIncome >= 0 ? 'hsl(142, 70%, 45%)' : 'hsl(0, 70%, 50%)'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Key metrics from latest */}
      {data[0] && (
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Ingresos', value: formatBigNumber(data[0].revenue), icon: DollarSign },
            { label: 'Beneficio Neto', value: formatBigNumber(data[0].netIncome), icon: TrendingUp },
            { label: 'Margen Bruto', value: data[0].revenue ? `${((data[0].grossProfit / data[0].revenue) * 100).toFixed(1)}%` : 'N/A', icon: Wallet },
            { label: 'Margen Neto', value: data[0].revenue ? `${((data[0].netIncome / data[0].revenue) * 100).toFixed(1)}%` : 'N/A', icon: ArrowDownUp },
          ].map(m => (
            <div key={m.label} className="bg-secondary/50 rounded-lg p-2 flex items-center gap-2">
              <m.icon className="w-3.5 h-3.5 text-primary shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
                <p className="text-xs font-mono font-semibold text-foreground">{m.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BalanceChart({ data }: { data: any[] }) {
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
          <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 9, fill: 'hsl(215, 20%, 55%)' }} tickLine={false} axisLine={false} tickFormatter={(v) => formatBigNumber(v)} />
          <Tooltip
            contentStyle={{ backgroundColor: 'hsl(222, 45%, 7%)', border: '1px solid hsl(220, 30%, 15%)', borderRadius: '8px', fontSize: '11px' }}
            formatter={(v: number, name: string) => [formatBigNumber(v), name === 'totalAssets' ? 'Activos' : name === 'totalDebt' ? 'Deuda' : 'Patrimonio']}
          />
          <Bar dataKey="totalAssets" fill="hsl(200, 80%, 50%)" radius={[3, 3, 0, 0]} />
          <Bar dataKey="totalDebt" fill="hsl(0, 60%, 55%)" radius={[3, 3, 0, 0]} />
          <Bar dataKey="totalEquity" fill="hsl(142, 60%, 45%)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      
      {data[0] && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Activos', value: formatBigNumber(data[0].totalAssets), color: 'text-blue-400' },
            { label: 'Deuda', value: formatBigNumber(data[0].totalDebt), color: 'text-red-400' },
            { label: 'Patrimonio', value: formatBigNumber(data[0].totalStockholdersEquity), color: 'text-green-400' },
          ].map(m => (
            <div key={m.label} className="bg-secondary/50 rounded-lg p-2 text-center">
              <p className="text-[10px] text-muted-foreground">{m.label}</p>
              <p className={`text-xs font-mono font-semibold ${m.color}`}>{m.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CashFlowChart({ data }: { data: any[] }) {
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
          <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 9, fill: 'hsl(215, 20%, 55%)' }} tickLine={false} axisLine={false} tickFormatter={(v) => formatBigNumber(v)} />
          <Tooltip
            contentStyle={{ backgroundColor: 'hsl(222, 45%, 7%)', border: '1px solid hsl(220, 30%, 15%)', borderRadius: '8px', fontSize: '11px' }}
            formatter={(v: number, name: string) => {
              const labels: Record<string, string> = { operating: 'Operativo', investing: 'Inversión', financing: 'Financiamiento', freeCashFlow: 'Flujo Libre' };
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
            { label: 'Flujo Operativo', value: formatBigNumber(data[0].operatingCashFlow) },
            { label: 'Flujo Libre', value: formatBigNumber(data[0].freeCashFlow) },
          ].map(m => (
            <div key={m.label} className="bg-secondary/50 rounded-lg p-2 text-center">
              <p className="text-[10px] text-muted-foreground">{m.label}</p>
              <p className="text-xs font-mono font-semibold text-foreground">{m.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function StockFinancialsCard({ data, loading }: Props) {
  if (loading) {
    return (
      <Card className="p-4 bg-card border-border space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-48 w-full" />
      </Card>
    );
  }

  if (!data || (!data.income?.length && !data.balance?.length && !data.cashFlow?.length)) {
    return (
      <Card className="p-4 bg-card border-border">
        <p className="text-sm text-muted-foreground text-center py-4">Estados financieros no disponibles</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-card border-border">
      <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-primary" />
        Estados Financieros
      </h3>
      <Tabs defaultValue="income" className="w-full">
        <TabsList className="w-full bg-secondary/50">
          <TabsTrigger value="income" className="flex-1 text-xs">Ingresos</TabsTrigger>
          <TabsTrigger value="balance" className="flex-1 text-xs">Balance</TabsTrigger>
          <TabsTrigger value="cashflow" className="flex-1 text-xs">Flujo</TabsTrigger>
        </TabsList>
        <TabsContent value="income" className="mt-3">
          {data.income?.length > 0 ? <IncomeChart data={data.income} /> : <p className="text-xs text-muted-foreground text-center py-4">Sin datos</p>}
        </TabsContent>
        <TabsContent value="balance" className="mt-3">
          {data.balance?.length > 0 ? <BalanceChart data={data.balance} /> : <p className="text-xs text-muted-foreground text-center py-4">Sin datos</p>}
        </TabsContent>
        <TabsContent value="cashflow" className="mt-3">
          {data.cashFlow?.length > 0 ? <CashFlowChart data={data.cashFlow} /> : <p className="text-xs text-muted-foreground text-center py-4">Sin datos</p>}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
