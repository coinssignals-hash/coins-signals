import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Loader2, Users, TrendingUp, Activity, BookOpen, FileText, Wallet, ArrowUp, ArrowDown, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';

interface DashboardStats {
  totalUsers: number;
  totalSignals: number;
  activeSignals: number;
  closedToday: number;
  winRate: number;
  recentActivity: { action: string; resource_type: string; created_at: string; user_id: string | null }[];
  signalsOverTime: { date: string; count: number }[];
}

export function AdminDashboardTab() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    const today = startOfDay(new Date()).toISOString();
    const sevenDaysAgo = subDays(new Date(), 7).toISOString();

    const [usersRes, signalsRes, auditRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact' }),
      supabase.from('trading_signals').select('id, status, closed_result, created_at'),
      supabase.from('audit_logs').select('action, resource_type, created_at, user_id').order('created_at', { ascending: false }).limit(15),
    ]);

    const signals = signalsRes.data || [];
    const active = signals.filter(s => s.status === 'active' || s.status === 'pending').length;
    const closed = signals.filter(s => s.status === 'closed');
    const wins = closed.filter(s => s.closed_result?.toLowerCase() === 'tp').length;
    const winRate = closed.length > 0 ? Math.round((wins / closed.length) * 100) : 0;
    const closedToday = signals.filter(s => s.status === 'closed' && s.created_at >= today).length;

    // Signals over last 7 days
    const signalsByDay: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'dd/MM');
      signalsByDay[d] = 0;
    }
    signals.forEach(s => {
      const d = format(new Date(s.created_at), 'dd/MM');
      if (signalsByDay[d] !== undefined) signalsByDay[d]++;
    });

    setStats({
      totalUsers: usersRes.count || 0,
      totalSignals: signals.length,
      activeSignals: active,
      closedToday,
      winRate,
      recentActivity: (auditRes.data || []) as any[],
      signalsOverTime: Object.entries(signalsByDay).map(([date, count]) => ({ date, count })),
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-amber-400" /></div>;
  if (!stats) return null;

  const cards = [
    { label: 'Usuarios', value: stats.totalUsers, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Señales Totales', value: stats.totalSignals, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Activas', value: stats.activeSignals, icon: Activity, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Win Rate', value: `${stats.winRate}%`, icon: ArrowUp, color: 'text-green-400', bg: 'bg-green-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <Card key={c.label} className="relative overflow-hidden bg-[#0f0f18] border-white/5 p-4">
            <div className={`absolute top-3 right-3 ${c.bg} rounded-lg p-2`}>
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </div>
            <p className="text-xs text-white/40 mb-1">{c.label}</p>
            <p className="text-2xl font-bold text-white tabular-nums">{c.value}</p>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card className="bg-[#0f0f18] border-white/5 p-5">
        <h3 className="text-sm font-semibold text-white/80 mb-4">Señales - Últimos 7 días</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={stats.signalsOverTime}>
            <defs>
              <linearGradient id="signalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 12 }}
            />
            <Area type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} fill="url(#signalGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-[#0f0f18] border-white/5 p-5">
        <h3 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-400" />
          Actividad Reciente
        </h3>
        {stats.recentActivity.length === 0 ? (
          <p className="text-xs text-white/30 text-center py-6">Sin actividad reciente</p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {stats.recentActivity.map((a, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <div className="h-2 w-2 rounded-full bg-amber-400/60 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/70 truncate">
                    <span className="text-amber-400/80 font-medium">{a.action}</span> en <span className="text-white/50">{a.resource_type}</span>
                  </p>
                  <p className="text-[10px] text-white/25">{a.user_id?.slice(0, 8) || 'system'}... · {format(new Date(a.created_at), 'dd/MM HH:mm')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
