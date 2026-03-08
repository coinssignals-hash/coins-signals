import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Loader2, Users, TrendingUp, Newspaper, BookOpen, Wallet, FileText, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Stats {
  totalUsers: number;
  totalSignals: number;
  activeSignals: number;
  totalJournalEntries: number;
  totalFavorites: number;
  totalDocuments: number;
  totalConnections: number;
  signalsByAction: { name: string; value: number }[];
  usersByCountry: { name: string; value: number }[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--chart-2))', 'hsl(var(--chart-4))', 'hsl(var(--destructive))'];

export function AdminAnalyticsTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [usersRes, signalsRes, journalRes, favsRes, docsRes, connsRes] = await Promise.all([
        supabase.from('profiles').select('id, country', { count: 'exact' }),
        supabase.from('trading_signals').select('id, status, action', { count: 'exact' }),
        supabase.from('trading_journal').select('id', { count: 'exact' }),
        supabase.from('favorite_signals').select('id', { count: 'exact' }),
        supabase.from('user_documents').select('id', { count: 'exact' }),
        supabase.from('user_broker_connections').select('id', { count: 'exact' }),
      ]);

      const signals = signalsRes.data || [];
      const buyCount = signals.filter(s => s.action === 'BUY').length;
      const sellCount = signals.filter(s => s.action === 'SELL').length;

      const countryCounts: Record<string, number> = {};
      (usersRes.data || []).forEach(u => {
        const c = u.country || 'Desconocido';
        countryCounts[c] = (countryCounts[c] || 0) + 1;
      });

      setStats({
        totalUsers: usersRes.count || 0,
        totalSignals: signalsRes.count || 0,
        activeSignals: signals.filter(s => s.status === 'active' || s.status === 'pending').length,
        totalJournalEntries: journalRes.count || 0,
        totalFavorites: favsRes.count || 0,
        totalDocuments: docsRes.count || 0,
        totalConnections: connsRes.count || 0,
        signalsByAction: [
          { name: 'BUY', value: buyCount },
          { name: 'SELL', value: sellCount },
        ],
        usersByCountry: Object.entries(countryCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, value]) => ({ name, value })),
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!stats) return null;

  const metricCards = [
    { icon: Users, label: 'Usuarios', value: stats.totalUsers, color: 'text-primary' },
    { icon: TrendingUp, label: 'Señales', value: stats.totalSignals, color: 'text-chart-2' },
    { icon: Activity, label: 'Activas', value: stats.activeSignals, color: 'text-chart-4' },
    { icon: BookOpen, label: 'Journal', value: stats.totalJournalEntries, color: 'text-accent' },
    { icon: Wallet, label: 'Conexiones', value: stats.totalConnections, color: 'text-chart-3' },
    { icon: FileText, label: 'Documentos', value: stats.totalDocuments, color: 'text-destructive' },
  ];

  return (
    <div className="space-y-4">
      {/* Metric Cards */}
      <div className="grid grid-cols-3 gap-3">
        {metricCards.map(m => (
          <Card key={m.label} className="p-3 bg-card border-border text-center">
            <m.icon className={`h-5 w-5 mx-auto mb-1 ${m.color}`} />
            <p className="text-lg font-bold text-foreground">{m.value}</p>
            <p className="text-[10px] text-muted-foreground">{m.label}</p>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <Card className="p-4 bg-card border-border">
        <h3 className="text-sm font-semibold text-foreground mb-3">Señales por Acción</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={stats.signalsByAction}>
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--foreground))' }} />
            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-4 bg-card border-border">
        <h3 className="text-sm font-semibold text-foreground mb-3">Top 5 Países</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={stats.usersByCountry} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" label={({ name, value }) => `${name} (${value})`} labelLine={false}>
              {stats.usersByCountry.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--foreground))' }} />
          </PieChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
