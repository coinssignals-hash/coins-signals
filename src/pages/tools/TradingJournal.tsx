import { useState, useMemo, useEffect, useCallback } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
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
  Loader2, LogIn, Pencil, Clock, Play, CheckCircle2, XCircle, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSymbolVisual } from '@/components/analysis/symbolVisuals';
import { format, startOfWeek, parseISO } from 'date-fns';
import { useDateLocale } from '@/hooks/useDateLocale';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, ReferenceLine, CartesianGrid } from 'recharts';
import { formatPrice } from '@/lib/utils';
import { useTranslation } from '@/i18n/LanguageContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';

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
  const [entries, setEntries] = useState<TradeEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

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
        <main className="container py-6 space-y-5">
          <div className="flex items-center gap-3">
            <Link to="/tools" className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </Link>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-bold text-foreground">{t('journal_title')}</h1>
            </div>
          </div>
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center space-y-3">
              <LogIn className="w-10 h-10 text-primary mx-auto opacity-60" />
              <p className="text-sm text-foreground font-medium">{t('journal_login_required')}</p>
              <p className="text-xs text-muted-foreground">{t('journal_login_desc')}</p>
              <Button onClick={() => navigate('/auth')} className="mt-2">
                <LogIn className="w-4 h-4 mr-2" /> {t('drawer_login')}
              </Button>
            </CardContent>
          </Card>
        </main>
      </PageShell>
    );
  }

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
            <BookOpen className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground">{t('journal_title')}</h1>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: t('journal_total_trades'), value: stats.total, icon: BarChart3, color: 'text-primary' },
            { label: t('journal_wins'), value: stats.wins, icon: TrendingUp, color: 'text-emerald-400' },
            { label: t('journal_losses'), value: stats.losses, icon: TrendingDown, color: 'text-rose-400' },
            { label: t('journal_win_rate'), value: `${stats.winRate}%`, icon: Target, color: 'text-amber-400' },
          ].map(s => (
            <Card key={s.label} className="bg-card border-border">
              <CardContent className="p-3 text-center">
                <s.icon className={cn('w-4 h-4 mx-auto mb-1', s.color)} />
                <p className={cn('text-lg font-bold', s.color)}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Total Pips */}
        <Card className="bg-card border-border">
          <CardContent className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">{t('journal_total_pips')}</span>
            </div>
            <span className={cn(
              'text-lg font-bold tabular-nums',
              parseFloat(stats.totalPips) >= 0 ? 'text-emerald-400' : 'text-rose-400'
            )}>
              {parseFloat(stats.totalPips) >= 0 ? '+' : ''}{stats.totalPips}
            </span>
          </CardContent>
        </Card>

        {/* Performance Charts */}
        {entries.length >= 2 && (() => {
          // Equity curve: cumulative pips over time (sorted by date asc)
          const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
          let cumPips = 0;
          const equityData = sorted.map(e => {
            const p = parseFloat(e.pips) || 0;
            cumPips += e.result === 'loss' ? -Math.abs(p) : p;
            return { date: e.date, pips: parseFloat(cumPips.toFixed(1)) };
          });

          // Pair distribution
          const pairMap: Record<string, number> = {};
          entries.forEach(e => { pairMap[e.pair] = (pairMap[e.pair] || 0) + 1; });
          const pairData = Object.entries(pairMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
          const pieColors = ['hsl(var(--primary))', '#34d399', '#f59e0b', '#f87171', '#a78bfa', '#38bdf8', '#fb923c', '#e879f9'];

          // Weekly pips
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
              <Card className="bg-card border-border">
                <CardContent className="p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" /> Curva de Equity (Pips)
                  </h3>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={equityData}>
                        <defs>
                          <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={35} />
                        <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11, color: 'hsl(var(--foreground))' }} />
                        <Area type="monotone" dataKey="pips" stroke="hsl(var(--primary))" fill="url(#eqGrad)" strokeWidth={2} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-3">
                {/* Pair Distribution */}
                <Card className="bg-card border-border">
                  <CardContent className="p-4 space-y-2">
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
                  </CardContent>
                </Card>

                {/* Weekly Pips */}
                <Card className="bg-card border-border">
                  <CardContent className="p-4 space-y-2">
                    <h3 className="text-[11px] font-semibold text-foreground">Pips/Semana</h3>
                    <div className="h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weekData}>
                          <XAxis dataKey="week" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={28} />
                          <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 10, color: 'hsl(var(--foreground))' }} />
                          <Bar dataKey="pips" radius={[3, 3, 0, 0]}>
                            {weekData.map((d, i) => <Cell key={i} fill={d.pips >= 0 ? '#34d399' : '#f87171'} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          );
        })()}

        <Button
          onClick={() => { if (showForm) { resetForm(); } setShowForm(!showForm); }}
          className="w-full"
          variant={showForm ? 'secondary' : 'default'}
        >
          <Plus className="w-4 h-4 mr-2" />
          {showForm ? t('journal_cancel') : t('journal_new_trade')}
        </Button>

        {/* New Trade Form */}
        {showForm && (
          <Card className="bg-card border-border">
            <CardContent className="p-4 space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
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
                            ? a === 'BUY' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-secondary text-muted-foreground border border-border'
                        )}
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
            </CardContent>
          </Card>
        )}

        {/* Trade History */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            {t('journal_history')}
          </h3>

          {entries.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-sm text-muted-foreground">{t('journal_no_trades')}</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Comienza registrando tu primera operación</p>
              </CardContent>
            </Card>
          ) : (
            <JournalSignalsList
              entries={entries}
              onEdit={startEdit}
              onDelete={handleDelete}
              dateLocale={dateLocale}
            />
          )}
        </div>
      </main>
    </PageShell>
  );
}

/* ─── Journal card list matching Performance > SignalsList style ─── */

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

        return (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card
              className={cn(
                'bg-card border-border cursor-pointer transition-all duration-200',
                expandedId === entry.id && 'ring-1 ring-primary/30'
              )}
              onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  {/* Left: Flag + Pair */}
                  <div className="flex items-center gap-2">
                    <div className="text-xl">{getCurrencyFlags(entry.pair)}</div>
                    <div>
                      <div className="text-xs font-bold text-foreground">{entry.pair}</div>
                      <div className={cn(
                        'text-[10px] font-bold',
                        entry.action === 'BUY' ? 'text-emerald-400' : 'text-rose-400'
                      )}>
                        {entry.action}
                      </div>
                    </div>
                  </div>

                  {/* Center: Pips */}
                  <div className="text-center">
                    <div className={cn(
                      'text-sm font-bold tabular-nums',
                      isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-muted-foreground'
                    )}>
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
                          stroke={isWin ? 'hsl(150, 60%, 50%)' : isLoss ? 'hsl(0, 60%, 50%)' : 'hsl(var(--muted-foreground))'}
                          strokeWidth="3" strokeLinecap="round"
                          strokeDasharray={`${(percentage / 100) * 100.5} 100.5`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={cn(
                          'text-[9px] font-bold tabular-nums',
                          isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-muted-foreground'
                        )}>
                          {percentage}%
                        </span>
                      </div>
                    </div>

                    {isWin ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : isLoss ? (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-muted-foreground" />
                    )}

                    <ChevronDown className={cn(
                      'w-3 h-3 text-muted-foreground transition-transform',
                      expandedId === entry.id && 'rotate-180'
                    )} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <AnimatePresence>
              {expandedId === entry.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="mt-1 bg-card border-border">
                    <CardContent className="p-4 space-y-3">
                      {/* Price details */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Entry</p>
                          <p className="text-xs font-bold text-foreground tabular-nums">{entry.entryPrice}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Exit</p>
                          <p className="text-xs font-bold text-foreground tabular-nums">{entry.exitPrice}</p>
                        </div>
                        {entry.stopLoss && (
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Stop Loss</p>
                            <p className="text-xs font-bold text-rose-400 tabular-nums">{entry.stopLoss}</p>
                          </div>
                        )}
                        {entry.takeProfit && (
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Take Profit</p>
                            <p className="text-xs font-bold text-emerald-400 tabular-nums">{entry.takeProfit}</p>
                          </div>
                        )}
                      </div>

                      {/* Lot size */}
                      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                        <span>{entry.lotSize} lotes</span>
                        <span className={cn(
                          'font-bold text-xs',
                          isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-muted-foreground'
                        )}>
                          {isLoss ? '-' : '+'}{entry.pips} pips
                        </span>
                      </div>

                      {/* Timestamps */}
                      {(entry.signalArrivedAt || entry.executedAt || entry.completedAt) && (
                        <div className="flex flex-wrap gap-x-3 gap-y-1 pt-2 border-t border-border">
                          {entry.signalArrivedAt && (
                            <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5 text-primary/70" />
                              Señal: {format(new Date(entry.signalArrivedAt), 'dd/MM HH:mm', { locale: dateLocale })}
                            </span>
                          )}
                          {entry.executedAt && (
                            <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                              <Play className="w-2.5 h-2.5 text-emerald-400/70" />
                              Ejec: {format(new Date(entry.executedAt), 'dd/MM HH:mm', { locale: dateLocale })}
                            </span>
                          )}
                          {entry.completedAt && (
                            <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5 text-amber-400/70" />
                              Cierre: {format(new Date(entry.completedAt), 'dd/MM HH:mm', { locale: dateLocale })}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Notes */}
                      {entry.notes && (
                        <p className="text-[10px] text-muted-foreground/70 italic border-t border-border pt-2">"{entry.notes}"</p>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t border-border">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-8 text-xs"
                          onClick={(e) => { e.stopPropagation(); onEdit(entry); }}
                        >
                          <Pencil className="w-3 h-3 mr-1" /> Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs text-destructive hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
