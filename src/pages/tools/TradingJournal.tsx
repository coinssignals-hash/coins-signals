import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAchievements, ACHIEVEMENTS } from '@/hooks/useAchievements';
import { PageShell } from '@/components/layout/PageShell';
import { JournalCoach } from '@/components/journal/JournalCoach';
import { PsychologyTracker, loadPsychEntries, type PsychEntry } from '@/components/journal/PsychologyTracker';
import { Header } from '@/components/layout/Header';
import { ToolCard } from '@/components/tools/ToolCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, BookOpen, Plus, Trash2, TrendingUp, TrendingDown,
  Calendar, DollarSign, Target, ShieldAlert, FileText, BarChart3,
  Loader2, LogIn, Pencil, Clock, Play, CheckCircle2, XCircle, ChevronDown,
  ChevronLeft, ChevronRight, Trophy, Brain, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSymbolVisual } from '@/components/analysis/symbolVisuals';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, subWeeks, addWeeks, subMonths, addMonths, isWithinInterval } from 'date-fns';
import { useDateLocale } from '@/hooks/useDateLocale';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, ReferenceLine } from 'recharts';
import { formatPrice } from '@/lib/utils';
import { useTranslation } from '@/i18n/LanguageContext';

/* ─── Blue accent color ─── */
const ACCENT = '210 70% 55%';
const ACCENT_GREEN = '142 60% 55%';
const ACCENT_ROSE = '0 70% 55%';
const ACCENT_AMBER = '45 80% 55%';

interface TradeEntry {
  id: string;
  date: string;
  pair: string;
  action: 'BUY' | 'SELL';
  entryPrice: string;
  exitPrice: string;
  lotSize: string;
  stopLoss: string;
  takeProfit: string;
  result: 'win' | 'loss' | 'breakeven';
  pips: string;
  notes: string;
  signalArrivedAt: string | null;
  executedAt: string | null;
  completedAt: string | null;
}

const PAIRS = [
  'EUR/USD','GBP/USD','USD/JPY','USD/CHF','AUD/USD','NZD/USD',
  'USD/CAD','EUR/GBP','EUR/JPY','GBP/JPY','XAU/USD',
];

export default function TradingJournal() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const { checkAndUnlockAchievements, unlockedCodes, getProgress: achievementGetProgress } = useAchievements();
  const [entries, setEntries] = useState<TradeEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [filterPair, setFilterPair] = useState<string>('all');
  const [filterResult, setFilterResult] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'week' | 'month'>('all');
  const [periodAnchor, setPeriodAnchor] = useState<Date>(new Date());

  const periodRange = useMemo(() => {
    if (filterPeriod === 'week') {
      return { start: startOfWeek(periodAnchor, { weekStartsOn: 1 }), end: endOfWeek(periodAnchor, { weekStartsOn: 1 }) };
    }
    if (filterPeriod === 'month') {
      return { start: startOfMonth(periodAnchor), end: endOfMonth(periodAnchor) };
    }
    return null;
  }, [filterPeriod, periodAnchor]);

  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      if (filterPair !== 'all' && e.pair !== filterPair) return false;
      if (filterResult !== 'all' && e.result !== filterResult) return false;
      if (periodRange) {
        const d = parseISO(e.date);
        if (!isWithinInterval(d, { start: periodRange.start, end: periodRange.end })) return false;
      }
      return true;
    });
  }, [entries, filterPair, filterResult, periodRange]);

  // Form state
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [pair, setPair] = useState('EUR/USD');
  const [action, setAction] = useState<'BUY' | 'SELL'>('BUY');
  const [entryPrice, setEntryPrice] = useState('');
  const [exitPrice, setExitPrice] = useState('');
  const [lotSize, setLotSize] = useState('0.1');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [result, setResult] = useState<'win' | 'loss' | 'breakeven'>('win');
  const [pips, setPips] = useState('');
  const [notes, setNotes] = useState('');

  // Check auth & load entries
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id ?? null);
      if (session?.user?.id) {
        await fetchEntries(session.user.id);
      }
      setLoading(false);
    };
    
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      if (session?.user?.id) {
        fetchEntries(session.user.id);
      } else {
        setEntries([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchEntries = async (uid: string) => {
    const { data, error } = await supabase
      .from('trading_journal')
      .select('*')
      .eq('user_id', uid)
      .order('trade_date', { ascending: false });

    if (error) {
      console.error('Error fetching journal:', error);
      return;
    }

    const mapped: TradeEntry[] = (data || []).map((row: any) => ({
      id: row.id,
      date: row.trade_date,
      pair: row.pair,
      action: row.action as 'BUY' | 'SELL',
      entryPrice: String(row.entry_price),
      exitPrice: String(row.exit_price),
      lotSize: String(row.lot_size),
      stopLoss: row.stop_loss ? String(row.stop_loss) : '',
      takeProfit: row.take_profit ? String(row.take_profit) : '',
      result: row.result as TradeEntry['result'],
      pips: String(row.pips),
      notes: row.notes || '',
      signalArrivedAt: row.signal_arrived_at || null,
      executedAt: row.executed_at || null,
      completedAt: row.completed_at || null,
    }));
    setEntries(mapped);
  };

  const stats = useMemo(() => {
    const total = entries.length;
    const wins = entries.filter(e => e.result === 'win').length;
    const losses = entries.filter(e => e.result === 'loss').length;
    const totalPips = entries.reduce((sum, e) => {
      const p = parseFloat(e.pips) || 0;
      return sum + (e.result === 'loss' ? -Math.abs(p) : p);
    }, 0);
    const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : '0';
    return { total, wins, losses, totalPips: totalPips.toFixed(1), winRate };
  }, [entries]);

  async function handleSave() {
    if (!userId) return;
    setSaving(true);

    const payload = {
      user_id: userId,
      trade_date: date,
      pair,
      action,
      entry_price: parseFloat(entryPrice),
      exit_price: parseFloat(exitPrice),
      lot_size: parseFloat(lotSize),
      stop_loss: stopLoss ? parseFloat(stopLoss) : null,
      take_profit: takeProfit ? parseFloat(takeProfit) : null,
      result,
      pips: parseFloat(pips) || 0,
      notes: notes || null,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from('trading_journal').update(payload).eq('id', editingId).eq('user_id', userId));
    } else {
      ({ error } = await supabase.from('trading_journal').insert(payload));
    }

    setSaving(false);

    if (error) {
      toast({ title: 'Error', description: editingId ? t('journal_update_error') : t('journal_save_error'), variant: 'destructive' });
      console.error(error);
      return;
    }

    toast({ title: editingId ? t('journal_updated') : t('journal_saved') });
    resetForm();
    setShowForm(false);
    setEditingId(null);
    await fetchEntries(userId);
    setTimeout(() => checkAndUnlockAchievements(), 1000);
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('trading_journal').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: t('journal_delete_error'), variant: 'destructive' });
      return;
    }
    setEntries(prev => prev.filter(e => e.id !== id));
  }

  function resetForm() {
    setEntryPrice(''); setExitPrice(''); setStopLoss('');
    setTakeProfit(''); setPips(''); setNotes('');
    setResult('win'); setLotSize('0.1');
    setEditingId(null);
  }

  function startEdit(entry: TradeEntry) {
    setDate(entry.date);
    setPair(entry.pair);
    setAction(entry.action);
    setEntryPrice(entry.entryPrice);
    setExitPrice(entry.exitPrice);
    setLotSize(entry.lotSize);
    setStopLoss(entry.stopLoss);
    setTakeProfit(entry.takeProfit);
    setResult(entry.result);
    setPips(entry.pips);
    setNotes(entry.notes);
    setEditingId(entry.id);
    setShowForm(true);
  }

  if (loading) {
    return (
      <PageShell>
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </PageShell>
    );
  }

  if (!userId) {
    return (
      <PageShell>
        <Header />
        <main className="container py-3 max-w-lg mx-auto px-3 space-y-4">
          <div className="flex items-center gap-3">
            <Link to="/tools" className="w-8 h-8 rounded-xl flex items-center justify-center" style={{
              background: `linear-gradient(135deg, hsl(${ACCENT} / 0.2), hsl(${ACCENT} / 0.08))`,
              border: `1px solid hsl(${ACCENT} / 0.25)`,
            }}>
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </Link>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" style={{ color: `hsl(${ACCENT})` }} />
              <h1 className="text-lg font-bold text-foreground">{t('journal_title')}</h1>
            </div>
          </div>
          <ToolCard color={ACCENT}>
            <div className="p-8 text-center space-y-3">
              <LogIn className="w-10 h-10 mx-auto opacity-60" style={{ color: `hsl(${ACCENT})` }} />
              <p className="text-sm text-foreground font-medium">{t('journal_login_required')}</p>
              <p className="text-xs text-muted-foreground">{t('journal_login_desc')}</p>
              <Button onClick={() => navigate('/auth')} className="mt-2">
                <LogIn className="w-4 h-4 mr-2" /> {t('drawer_login')}
              </Button>
            </div>
          </ToolCard>
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Header />
      <main className="container py-3 max-w-lg mx-auto px-3 space-y-4">
        {/* Navigation */}
        <div className="flex items-center gap-3">
          <Link to="/tools" className="w-8 h-8 rounded-xl flex items-center justify-center" style={{
            background: `linear-gradient(135deg, hsl(${ACCENT} / 0.2), hsl(${ACCENT} / 0.08))`,
            border: `1px solid hsl(${ACCENT} / 0.25)`,
          }}>
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </Link>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" style={{ color: `hsl(${ACCENT})` }} />
            <h1 className="text-lg font-bold text-foreground">{t('journal_title')}</h1>
          </div>
        </div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-4 gap-2"
        >
          {[
            { label: t('journal_total_trades'), value: stats.total, icon: BarChart3, color: ACCENT },
            { label: t('journal_wins'), value: stats.wins, icon: TrendingUp, color: ACCENT_GREEN },
            { label: t('journal_losses'), value: stats.losses, icon: TrendingDown, color: ACCENT_ROSE },
            { label: t('journal_win_rate'), value: `${stats.winRate}%`, icon: Target, color: ACCENT_AMBER },
          ].map((s, i) => (
            <ToolCard key={s.label} color={s.color}>
              <div className="p-3 text-center">
                <s.icon className="w-4 h-4 mx-auto mb-1" style={{ color: `hsl(${s.color})` }} />
                <p className="text-lg font-bold" style={{ color: `hsl(${s.color})` }}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            </ToolCard>
          ))}
        </motion.div>

        {/* Total Pips */}
        <ToolCard color={ACCENT}>
          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" style={{ color: `hsl(${ACCENT})` }} />
              <span className="text-sm font-medium text-foreground">{t('journal_total_pips')}</span>
            </div>
            <span className={cn(
              'text-lg font-bold tabular-nums',
            )} style={{
              color: parseFloat(stats.totalPips) >= 0 ? `hsl(${ACCENT_GREEN})` : `hsl(${ACCENT_ROSE})`,
            }}>
              {parseFloat(stats.totalPips) >= 0 ? '+' : ''}{stats.totalPips}
            </span>
          </div>
        </ToolCard>

        {/* Performance Charts */}
        {entries.length >= 2 && (() => {
          const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
          let cumPips = 0;
          const equityData = sorted.map(e => {
            const p = parseFloat(e.pips) || 0;
            cumPips += e.result === 'loss' ? -Math.abs(p) : p;
            return { date: e.date, pips: parseFloat(cumPips.toFixed(1)) };
          });

          const pairMap: Record<string, number> = {};
          entries.forEach(e => { pairMap[e.pair] = (pairMap[e.pair] || 0) + 1; });
          const pairData = Object.entries(pairMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
          const pieColors = [`hsl(${ACCENT})`, '#34d399', '#f59e0b', '#f87171', '#a78bfa', '#38bdf8', '#fb923c', '#e879f9'];

          const weekMap: Record<string, number> = {};
          sorted.forEach(e => {
            const p = parseFloat(e.pips) || 0;
            const w = format(startOfWeek(parseISO(e.date), { weekStartsOn: 1 }), 'dd MMM', { locale: dateLocale });
            weekMap[w] = (weekMap[w] || 0) + (e.result === 'loss' ? -Math.abs(p) : p);
          });
          const weekData = Object.entries(weekMap).map(([week, pips]) => ({ week, pips: parseFloat(pips.toFixed(1)) }));

          return (
            <div className="space-y-4">
              {/* Equity Curve */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.08 }}>
                <ToolCard color={ACCENT}>
                  <div className="p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" style={{ color: `hsl(${ACCENT})` }} /> Curva de Equity (Pips)
                    </h3>
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={equityData}>
                          <defs>
                            <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={`hsl(${ACCENT})`} stopOpacity={0.3} />
                              <stop offset="100%" stopColor={`hsl(${ACCENT})`} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={35} />
                          <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11, color: 'hsl(var(--foreground))' }} />
                          <Area type="monotone" dataKey="pips" stroke={`hsl(${ACCENT})`} fill="url(#eqGrad)" strokeWidth={2} dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </ToolCard>
              </motion.div>

              <div className="grid grid-cols-2 gap-3">
                {/* Pair Distribution */}
                <ToolCard color="270 60% 55%">
                  <div className="p-4 space-y-2">
                    <h3 className="text-[11px] font-semibold text-foreground">{t('tj_pair_distribution')}</h3>
                    <div className="h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pairData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={25} outerRadius={48} paddingAngle={2} strokeWidth={0}>
                            {pairData.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 10, color: 'hsl(var(--foreground))' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                      {pairData.slice(0, 4).map((p, i) => (
                        <span key={p.name} className="text-[9px] text-muted-foreground flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: pieColors[i % pieColors.length] }} />
                          {p.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </ToolCard>

                {/* Weekly Pips */}
                <ToolCard color={ACCENT_AMBER}>
                  <div className="p-4 space-y-2">
                    <h3 className="text-[11px] font-semibold text-foreground">Pips/Semana</h3>
                    <div className="h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weekData}>
                          <XAxis dataKey="week" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={28} />
                          <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 10, color: 'hsl(var(--foreground))' }} />
                          <Bar dataKey="pips" radius={[3, 3, 0, 0]}>
                            {weekData.map((d, i) => <Cell key={i} fill={d.pips >= 0 ? `hsl(${ACCENT_GREEN})` : `hsl(${ACCENT_ROSE})`} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </ToolCard>
              </div>
            </div>
          );
        })()}

        <Button
          onClick={() => { if (showForm) { resetForm(); } setShowForm(!showForm); }}
          className="w-full rounded-xl"
          variant={showForm ? 'secondary' : 'default'}
          style={!showForm ? {
            background: `linear-gradient(135deg, hsl(${ACCENT}), hsl(${ACCENT} / 0.8))`,
            boxShadow: `0 4px 12px hsl(${ACCENT} / 0.3)`,
          } : undefined}
        >
          <Plus className="w-4 h-4 mr-2" />
          {showForm ? t('journal_cancel') : t('journal_new_trade')}
        </Button>

        {/* New Trade Form */}
        {showForm && (
          <ToolCard color={ACCENT}>
            <div className="p-4 space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4" style={{ color: `hsl(${ACCENT})` }} />
                {t('journal_new_trade')}
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t('journal_date')}</Label>
                  <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-secondary border-border text-foreground" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t('journal_pair')}</Label>
                  <Select value={pair} onValueChange={setPair}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>{PAIRS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t('journal_action')}</Label>
                  <div className="flex gap-1">
                    {(['BUY', 'SELL'] as const).map(a => (
                      <button
                        key={a}
                        onClick={() => setAction(a)}
                        className={cn(
                          'flex-1 py-2 rounded-md text-xs font-semibold transition-colors',
                          action === a
                            ? a === 'BUY' ? 'text-foreground' : 'text-foreground'
                            : 'text-muted-foreground'
                        )}
                        style={action === a ? {
                          background: a === 'BUY' ? `hsl(${ACCENT_GREEN} / 0.15)` : `hsl(${ACCENT_ROSE} / 0.15)`,
                          border: `1px solid ${a === 'BUY' ? `hsl(${ACCENT_GREEN} / 0.3)` : `hsl(${ACCENT_ROSE} / 0.3)`}`,
                          color: a === 'BUY' ? `hsl(${ACCENT_GREEN})` : `hsl(${ACCENT_ROSE})`,
                        } : {
                          background: 'hsl(var(--secondary))',
                          border: '1px solid hsl(var(--border))',
                        }}
                      >{a}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t('journal_lot_size')}</Label>
                  <Input type="number" step="0.01" value={lotSize} onChange={e => setLotSize(e.target.value)} className="bg-secondary border-border text-foreground" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t('journal_entry_price')}</Label>
                  <Input type="number" step="0.00001" value={entryPrice} onChange={e => setEntryPrice(e.target.value)} placeholder="1.08500" className="bg-secondary border-border text-foreground" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t('journal_exit_price')}</Label>
                  <Input type="number" step="0.00001" value={exitPrice} onChange={e => setExitPrice(e.target.value)} placeholder="1.09000" className="bg-secondary border-border text-foreground" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Stop Loss</Label>
                  <Input type="number" step="0.00001" value={stopLoss} onChange={e => setStopLoss(e.target.value)} placeholder="1.08200" className="bg-secondary border-border text-foreground" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Take Profit</Label>
                  <Input type="number" step="0.00001" value={takeProfit} onChange={e => setTakeProfit(e.target.value)} placeholder="1.09200" className="bg-secondary border-border text-foreground" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t('journal_result')}</Label>
                  <Select value={result} onValueChange={v => setResult(v as TradeEntry['result'])}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="win">✅ {t('journal_win')}</SelectItem>
                      <SelectItem value="loss">❌ {t('journal_loss')}</SelectItem>
                      <SelectItem value="breakeven">➖ {t('journal_breakeven')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Pips ±</Label>
                  <Input type="number" step="0.1" value={pips} onChange={e => setPips(e.target.value)} placeholder="25" className="bg-secondary border-border text-foreground" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t('journal_notes')}</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="" className="bg-secondary border-border text-foreground min-h-[60px]" />
              </div>

              <Button onClick={handleSave} className="w-full" disabled={!entryPrice || !exitPrice || saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : editingId ? <Pencil className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                {editingId ? t('journal_update_trade') : t('journal_save_trade')}
              </Button>
            </div>
          </ToolCard>
        )}

        {/* ─── Achievements Progress Widget ─── */}
        {userId && (() => {
          const nextAchievements = ACHIEVEMENTS
            .filter(a => !unlockedCodes.includes(a.code) && (a.category === 'journal_entries' || a.category === 'trades_count' || a.category === 'trading_days'))
            .sort((a, b) => achievementGetProgress(b) - achievementGetProgress(a))
            .slice(0, 3);

          if (nextAchievements.length === 0) return null;

          return (
            <div className="rounded-xl overflow-hidden" style={{
              background: 'linear-gradient(165deg, hsl(270 70% 60% / 0.06) 0%, hsl(var(--card)) 40%, hsl(var(--background)) 100%)',
              border: '1px solid hsl(270 70% 60% / 0.12)',
            }}>
              <div className="absolute top-0 inset-x-0 h-[2px]" style={{
                background: 'linear-gradient(90deg, transparent, hsl(270 70% 60% / 0.4), transparent)',
              }} />
              <div className="p-3">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5" style={{ color: 'hsl(45 90% 55%)' }} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Próximos Logros</span>
                  </div>
                  <Link to="/achievements" className="text-[10px] font-bold" style={{ color: 'hsl(45 90% 55%)' }}>
                    Ver todos →
                  </Link>
                </div>
                <div className="space-y-2">
                  {nextAchievements.map(a => {
                    const pct = Math.round(achievementGetProgress(a) * 100);
                    return (
                      <div key={a.code} className="flex items-center gap-2">
                        <span className="text-sm">{a.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-semibold text-foreground truncate">{a.name}</p>
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'hsl(270 70% 60% / 0.1)' }}>
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'hsl(270 70% 60%)' }} />
                            </div>
                            <span className="text-[9px] font-bold tabular-nums text-muted-foreground">{pct}%</span>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'hsl(270 70% 60% / 0.1)', color: 'hsl(270 70% 60%)' }}>+{a.xp} XP</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Trade History */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" style={{ color: `hsl(${ACCENT})` }} />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('journal_history')}</span>
          </div>

          {/* Period Tabs */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1 flex-1">
              {([
                { key: 'all' as const, label: 'Todos' },
                { key: 'week' as const, label: 'Semana' },
                { key: 'month' as const, label: 'Mes' },
              ]).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => { setFilterPeriod(tab.key); setPeriodAnchor(new Date()); }}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95',
                    filterPeriod === tab.key
                      ? 'text-foreground shadow-lg'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  )}
                  style={filterPeriod === tab.key ? {
                    background: `linear-gradient(135deg, hsl(${ACCENT} / 0.25), hsl(${ACCENT} / 0.1))`,
                    border: `1px solid hsl(${ACCENT} / 0.3)`,
                    boxShadow: `0 2px 8px hsl(${ACCENT} / 0.2)`,
                  } : { border: '1px solid transparent' }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Period Navigation */}
            {filterPeriod !== 'all' && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPeriodAnchor(prev => filterPeriod === 'week' ? subWeeks(prev, 1) : subMonths(prev, 1))}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-secondary/50 transition-colors"
                  style={{ border: `1px solid hsl(${ACCENT} / 0.2)` }}
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <span className="text-[10px] font-medium text-muted-foreground tabular-nums min-w-[80px] text-center">
                  {periodRange && filterPeriod === 'week'
                    ? `${format(periodRange.start, 'dd MMM', { locale: dateLocale })} – ${format(periodRange.end, 'dd MMM', { locale: dateLocale })}`
                    : periodRange ? format(periodAnchor, 'MMMM yyyy', { locale: dateLocale }) : ''}
                </span>
                <button
                  onClick={() => setPeriodAnchor(prev => filterPeriod === 'week' ? addWeeks(prev, 1) : addMonths(prev, 1))}
                  disabled={filterPeriod === 'week' ? addWeeks(periodAnchor, 1) > new Date() : addMonths(periodAnchor, 1) > new Date()}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-secondary/50 transition-colors disabled:opacity-30"
                  style={{ border: `1px solid hsl(${ACCENT} / 0.2)` }}
                >
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            )}
          </div>

          {/* Period Stats Summary */}
          {filterPeriod !== 'all' && filteredEntries.length > 0 && (() => {
            const wins = filteredEntries.filter(e => e.result === 'win').length;
            const total = filteredEntries.length;
            const pipsSum = filteredEntries.reduce((s, e) => {
              const p = parseFloat(e.pips) || 0;
              return s + (e.result === 'loss' ? -Math.abs(p) : p);
            }, 0);
            return (
              <div className="flex gap-2">
                {[
                  { label: 'Trades', value: total, color: ACCENT },
                  { label: 'Win Rate', value: `${total > 0 ? ((wins / total) * 100).toFixed(0) : 0}%`, color: ACCENT_GREEN },
                  { label: 'Pips', value: `${pipsSum >= 0 ? '+' : ''}${pipsSum.toFixed(1)}`, color: pipsSum >= 0 ? ACCENT_GREEN : ACCENT_ROSE },
                ].map(s => (
                  <div key={s.label} className="flex-1 rounded-lg p-2 text-center" style={{
                    background: `linear-gradient(165deg, hsl(${s.color} / 0.1), hsl(${s.color} / 0.03))`,
                    border: `1px solid hsl(${s.color} / 0.15)`,
                  }}>
                    <p className="text-sm font-bold tabular-nums" style={{ color: `hsl(${s.color})` }}>{s.value}</p>
                    <p className="text-[9px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Filters */}
          {entries.length > 0 && (
            <JournalFilters
              entries={entries}
              filterPair={filterPair}
              setFilterPair={setFilterPair}
              filterResult={filterResult}
              setFilterResult={setFilterResult}
            />
          )}

          {entries.length === 0 ? (
            <ToolCard color={ACCENT}>
              <div className="p-8 text-center">
                <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-sm text-muted-foreground">{t('journal_no_trades')}</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Comienza registrando tu primera operación</p>
              </div>
            </ToolCard>
          ) : (
            <>
              {filteredEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No hay operaciones con estos filtros</p>
              ) : (
                <JournalSignalsList
                  entries={filteredEntries}
                  onEdit={startEdit}
                  onDelete={handleDelete}
                  dateLocale={dateLocale}
                />
              )}
            </>
          )}
        </div>
      </main>
    </PageShell>
  );
}

/* ─── Journal card list ─── */

function getCurrencyFlags(pair: string) {
  return pair.split('/').map(c => getSymbolVisual(c).flag || '🏳️').join(' ');
}

interface JournalSignalsListProps {
  entries: TradeEntry[];
  onEdit: (e: TradeEntry) => void;
  onDelete: (id: string) => void;
  dateLocale: any;
}

function JournalSignalsList({ entries, onEdit, onDelete, dateLocale }: JournalSignalsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      {entries.map((entry, i) => {
        const pipsNum = parseFloat(entry.pips) || 0;
        const isWin = entry.result === 'win';
        const isLoss = entry.result === 'loss';
        const percentage = entry.takeProfit && entry.entryPrice
          ? Math.min(Math.round((Math.abs(pipsNum) / (Math.abs(parseFloat(entry.takeProfit) - parseFloat(entry.entryPrice)) * (entry.pair.includes('JPY') ? 100 : 10000))) * 100), 100)
          : isWin ? 100 : Math.min(Math.abs(pipsNum), 100);

        const entryColor = isWin ? ACCENT_GREEN : isLoss ? ACCENT_ROSE : ACCENT;

        return (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <ToolCard
              color={entryColor}
              className={cn(
                'cursor-pointer transition-all duration-200',
                expandedId === entry.id && 'ring-1'
              )}
            >
              <div className="p-3" onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}>
                <div className="flex items-center justify-between">
                  {/* Left: Flag + Pair */}
                  <div className="flex items-center gap-2">
                    <div className="text-xl">{getCurrencyFlags(entry.pair)}</div>
                    <div>
                      <div className="text-xs font-bold text-foreground">{entry.pair}</div>
                      <div className="text-[10px] font-bold" style={{
                        color: entry.action === 'BUY' ? `hsl(${ACCENT_GREEN})` : `hsl(${ACCENT_ROSE})`,
                      }}>
                        {entry.action}
                      </div>
                    </div>
                  </div>

                  {/* Center: Pips */}
                  <div className="text-center">
                    <div className="text-sm font-bold tabular-nums" style={{
                      color: isWin ? `hsl(${ACCENT_GREEN})` : isLoss ? `hsl(${ACCENT_ROSE})` : 'hsl(var(--muted-foreground))',
                    }}>
                      {isLoss ? '-' : '+'}{entry.pips}p
                    </div>
                    <div className="text-[10px] text-muted-foreground">{entry.date}</div>
                  </div>

                  {/* Right: Status ring */}
                  <div className="flex items-center gap-2">
                    <div className="relative w-10 h-10">
                      <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 40 40">
                        <circle cx="20" cy="20" r="16" fill="none" stroke="hsl(var(--muted)/0.3)" strokeWidth="3" />
                        <circle
                          cx="20" cy="20" r="16" fill="none"
                          stroke={isWin ? `hsl(${ACCENT_GREEN})` : isLoss ? `hsl(${ACCENT_ROSE})` : 'hsl(var(--muted-foreground))'}
                          strokeWidth="3" strokeLinecap="round"
                          strokeDasharray={`${(percentage / 100) * 100.5} 100.5`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[9px] font-bold tabular-nums" style={{
                          color: isWin ? `hsl(${ACCENT_GREEN})` : isLoss ? `hsl(${ACCENT_ROSE})` : 'hsl(var(--muted-foreground))',
                        }}>
                          {percentage}%
                        </span>
                      </div>
                    </div>

                    {isWin ? (
                      <CheckCircle2 className="w-4 h-4" style={{ color: `hsl(${ACCENT_GREEN})` }} />
                    ) : isLoss ? (
                      <XCircle className="w-4 h-4" style={{ color: `hsl(${ACCENT_ROSE})` }} />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-muted-foreground" />
                    )}

                    <ChevronDown className={cn(
                      'w-3 h-3 text-muted-foreground transition-transform',
                      expandedId === entry.id && 'rotate-180'
                    )} />
                  </div>
                </div>
              </div>
            </ToolCard>

            <AnimatePresence>
              {expandedId === entry.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mt-1 relative rounded-2xl overflow-hidden" style={{
                    background: `linear-gradient(165deg, hsl(${ACCENT} / 0.12) 0%, hsl(var(--card)) 40%, hsl(var(--background)) 100%)`,
                    border: `1px solid hsl(${ACCENT} / 0.25)`,
                  }}>
                    <div className="absolute top-0 inset-x-0 h-[2px]" style={{
                      background: `linear-gradient(90deg, transparent, hsl(${ACCENT} / 0.7), transparent)`,
                    }} />
                    <div className="relative">
                      {/* Chart */}
                      <JournalMiniChart entry={entry} />

                      {/* Info panels */}
                      <div className="grid grid-cols-2 gap-px mx-3 mb-3 rounded-xl overflow-hidden" style={{
                        background: `hsl(${ACCENT} / 0.1)`,
                        border: `1px solid hsl(${ACCENT} / 0.15)`,
                      }}>
                        {/* TIEMPO */}
                        <div className="p-3 space-y-3" style={{ background: 'hsl(var(--card) / 0.6)' }}>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Tiempo</span>
                          </div>
                          <div className="grid grid-cols-2 gap-y-2.5">
                            <div>
                              <p className="text-[9px] text-muted-foreground/70">Señal</p>
                              <p className="text-[11px] font-bold tabular-nums" style={{ color: `hsl(${ACCENT_AMBER})` }}>
                                {entry.signalArrivedAt ? format(new Date(entry.signalArrivedAt), 'hh:mm a') : '--:--'}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] text-muted-foreground/70">Final</p>
                              <p className="text-[11px] font-bold tabular-nums" style={{ color: `hsl(${ACCENT_GREEN})` }}>
                                {entry.completedAt ? format(new Date(entry.completedAt), 'hh:mm a') : '--:--'}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] text-muted-foreground/70">Ejecución</p>
                              <p className="text-[11px] font-bold tabular-nums" style={{ color: `hsl(${ACCENT})` }}>
                                {entry.executedAt ? format(new Date(entry.executedAt), 'hh:mm a') : '--:--'}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] text-muted-foreground/70">Duración</p>
                              <p className="text-[11px] font-bold text-foreground tabular-nums">
                                {(() => {
                                  if (!entry.executedAt || !entry.completedAt) return '--:--';
                                  const diff = new Date(entry.completedAt).getTime() - new Date(entry.executedAt).getTime();
                                  const hrs = Math.floor(diff / 3600000);
                                  const mins = Math.floor((diff % 3600000) / 60000);
                                  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
                                })()}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* PRECIOS */}
                        <div className="p-3 space-y-3" style={{ background: 'hsl(var(--card) / 0.6)' }}>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <DollarSign className="w-3 h-3" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Precios</span>
                          </div>
                          <div className="grid grid-cols-2 gap-y-2.5">
                            <div>
                              <p className="text-[9px] text-muted-foreground/70">Entrada</p>
                              <p className="text-[11px] font-bold tabular-nums" style={{ color: `hsl(${ACCENT})` }}>{formatPrice(parseFloat(entry.entryPrice), entry.pair)}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-muted-foreground/70">Salida</p>
                              <p className="text-[11px] font-bold tabular-nums" style={{ color: `hsl(${ACCENT_AMBER})` }}>{formatPrice(parseFloat(entry.exitPrice), entry.pair)}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-muted-foreground/70">TP</p>
                              <p className="text-[11px] font-bold tabular-nums" style={{ color: `hsl(${ACCENT_GREEN})` }}>{entry.takeProfit ? formatPrice(parseFloat(entry.takeProfit), entry.pair) : '--'}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-muted-foreground/70">SL</p>
                              <p className="text-[11px] font-bold tabular-nums" style={{ color: `hsl(${ACCENT_ROSE})` }}>{entry.stopLoss ? formatPrice(parseFloat(entry.stopLoss), entry.pair) : '--'}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-[9px] text-muted-foreground/70">Pips</p>
                              <p className="text-[11px] font-bold tabular-nums" style={{
                                color: isWin ? `hsl(${ACCENT_GREEN})` : isLoss ? `hsl(${ACCENT_ROSE})` : `hsl(${ACCENT_AMBER})`,
                              }}>
                                {isLoss ? '-' : '+'}{entry.pips}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      {entry.notes && (
                        <p className="text-[10px] text-muted-foreground/70 italic px-3 pb-2">"{entry.notes}"</p>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 px-3 pb-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-8 text-xs"
                          style={{ borderColor: `hsl(${ACCENT} / 0.2)` }}
                          onClick={(e) => { e.stopPropagation(); onEdit(entry); }}
                        >
                          <Pencil className="w-3 h-3 mr-1" /> Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          style={{ borderColor: `hsl(${ACCENT_ROSE} / 0.2)`, color: `hsl(${ACCENT_ROSE})` }}
                          onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ─── Mini chart for journal detail view ─── */
function generateJournalChartData(entry: TradeEntry) {
  const ep = parseFloat(entry.entryPrice);
  const ex = parseFloat(entry.exitPrice);
  const tp = entry.takeProfit ? parseFloat(entry.takeProfit) : ex;
  const sl = entry.stopLoss ? parseFloat(entry.stopLoss) : ep;
  const range = Math.max(Math.abs(tp - sl), Math.abs(ex - ep)) || ep * 0.001;
  const isWin = entry.result === 'win';
  const data = [];
  const steps = 30;

  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;
    const trend = ep + (ex - ep) * progress;
    const noise = (Math.sin(i * 1.7) * 0.3 + Math.cos(i * 2.3) * 0.2) * range * 0.15;
    const price = trend + noise;
    
    const baseDate = entry.executedAt ? new Date(entry.executedAt) : new Date(entry.date);
    const time = new Date(baseDate.getTime() + i * 15 * 60000);
    data.push({
      time: `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`,
      price: parseFloat(price.toFixed(6)),
    });
  }
  return data;
}

function JournalMiniChart({ entry }: { entry: TradeEntry }) {
  const ep = parseFloat(entry.entryPrice);
  const ex = parseFloat(entry.exitPrice);
  const tp = entry.takeProfit ? parseFloat(entry.takeProfit) : null;
  const sl = entry.stopLoss ? parseFloat(entry.stopLoss) : null;
  const isWin = entry.result === 'win';
  const isLoss = entry.result === 'loss';
  const chartData = useMemo(() => generateJournalChartData(entry), [entry.id]);

  const prices = [ep, ex, ...(tp ? [tp] : []), ...(sl ? [sl] : [])];
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const pad = (maxP - minP) * 0.2 || ep * 0.001;

  const lineColor = isWin ? `hsl(${ACCENT_GREEN})` : isLoss ? `hsl(${ACCENT_ROSE})` : 'hsl(var(--muted-foreground))';

  return (
    <div className="h-48 px-1 pt-2 pb-1">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 50, left: 35, bottom: 4 }}>
          <defs>
            <linearGradient id={`jcGrad-${entry.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity={0.35} />
              <stop offset="100%" stopColor={lineColor} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="time"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
            axisLine={false} tickLine={false}
            interval={7}
          />
          <YAxis
            domain={[minP - pad, maxP + pad]}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
            axisLine={false} tickLine={false}
            orientation="right"
            tickFormatter={(v) => formatPrice(v, entry.pair)}
            width={52}
          />
          {tp && (
            <ReferenceLine y={tp} stroke={`hsl(${ACCENT_GREEN})`} strokeDasharray="6 3" strokeOpacity={0.8} label={{ value: 'TP', position: 'insideTopLeft', fill: `hsl(${ACCENT_GREEN})`, fontSize: 8, fontWeight: 600 }} />
          )}
          <ReferenceLine y={ep} stroke={`hsl(${ACCENT})`} strokeDasharray="4 4" strokeOpacity={0.6} label={{ value: 'Entry', position: 'insideTopLeft', fill: `hsl(${ACCENT})`, fontSize: 8, fontWeight: 600 }} />
          {sl && (
            <ReferenceLine y={sl} stroke={`hsl(${ACCENT_ROSE})`} strokeDasharray="6 3" strokeOpacity={0.8} label={{ value: 'SL', position: 'insideBottomLeft', fill: `hsl(${ACCENT_ROSE})`, fontSize: 8, fontWeight: 600 }} />
          )}
          <ReferenceLine y={ex} stroke={`hsl(${ACCENT_AMBER})`} strokeDasharray="3 2" strokeOpacity={0.9} label={{ value: 'Close', position: 'insideTopLeft', fill: `hsl(${ACCENT_AMBER})`, fontSize: 8, fontWeight: 600 }} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const price = payload[0].value as number;
              const levels = [
                ...(tp ? [{ label: 'TP', value: tp, color: `hsl(${ACCENT_GREEN})` }] : []),
                { label: 'Entry', value: ep, color: `hsl(${ACCENT})` },
                { label: 'Close', value: ex, color: `hsl(${ACCENT_AMBER})` },
                ...(sl ? [{ label: 'SL', value: sl, color: `hsl(${ACCENT_ROSE})` }] : []),
              ];
              return (
                <div className="rounded-lg border border-border/50 bg-background/95 backdrop-blur-md px-2.5 py-2 shadow-xl text-[10px] space-y-1">
                  <div className="font-semibold text-foreground tabular-nums">
                    {payload[0].payload.time} — {formatPrice(price, entry.pair)}
                  </div>
                  <div className="space-y-0.5">
                    {levels.map(l => (
                      <div key={l.label} className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-1">
                          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: l.color }} />
                          <span className="text-muted-foreground">{l.label}</span>
                        </span>
                        <span className="tabular-nums font-medium" style={{ color: l.color }}>{formatPrice(l.value, entry.pair)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }}
            cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeOpacity: 0.3, strokeDasharray: '3 3' }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={lineColor}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#jcGrad-${entry.id})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Filters ─── */
interface JournalFiltersProps {
  entries: TradeEntry[];
  filterPair: string;
  setFilterPair: (v: string) => void;
  filterResult: string;
  setFilterResult: (v: string) => void;
}

function JournalFilters({ entries, filterPair, setFilterPair, filterResult, setFilterResult }: JournalFiltersProps) {
  const uniquePairs = useMemo(() => {
    const set = new Set(entries.map(e => e.pair));
    return Array.from(set).sort();
  }, [entries]);

  const resultOptions = [
    { value: 'all', label: 'Todos', color: ACCENT },
    { value: 'win', label: 'Win', color: ACCENT_GREEN },
    { value: 'loss', label: 'Loss', color: ACCENT_ROSE },
    { value: 'breakeven', label: 'BE', color: ACCENT },
  ];

  return (
    <div className="flex gap-2">
      <Select value={filterPair} onValueChange={setFilterPair}>
        <SelectTrigger className="h-8 text-xs bg-secondary border-border flex-1">
          <SelectValue placeholder="Par" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los pares</SelectItem>
          {uniquePairs.map(p => (
            <SelectItem key={p} value={p}>{p}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex rounded-xl overflow-hidden" style={{ border: `1px solid hsl(${ACCENT} / 0.2)` }}>
        {resultOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilterResult(opt.value)}
            className="px-2.5 py-1.5 text-[10px] font-bold transition-colors"
            style={{
              background: filterResult === opt.value ? `hsl(${opt.color} / 0.15)` : 'hsl(var(--secondary))',
              color: filterResult === opt.value ? `hsl(${opt.color})` : 'hsl(var(--muted-foreground))',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
