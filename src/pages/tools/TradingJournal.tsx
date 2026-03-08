import { useState, useMemo } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, BookOpen, Plus, Trash2, TrendingUp, TrendingDown,
  Calendar, DollarSign, Target, ShieldAlert, FileText, BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
}

const PAIRS = [
  'EUR/USD','GBP/USD','USD/JPY','USD/CHF','AUD/USD','NZD/USD',
  'USD/CAD','EUR/GBP','EUR/JPY','GBP/JPY','XAU/USD',
];

const STORAGE_KEY = 'trading-journal-entries';

function loadEntries(): TradeEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveEntries(entries: TradeEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export default function TradingJournal() {
  const [entries, setEntries] = useState<TradeEntry[]>(loadEntries);
  const [showForm, setShowForm] = useState(false);

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

  function handleAdd() {
    const entry: TradeEntry = {
      id: crypto.randomUUID(),
      date, pair, action, entryPrice, exitPrice, lotSize,
      stopLoss, takeProfit, result, pips, notes,
    };
    const updated = [entry, ...entries];
    setEntries(updated);
    saveEntries(updated);
    resetForm();
    setShowForm(false);
  }

  function handleDelete(id: string) {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    saveEntries(updated);
  }

  function resetForm() {
    setEntryPrice(''); setExitPrice(''); setStopLoss('');
    setTakeProfit(''); setPips(''); setNotes('');
    setResult('win'); setLotSize('0.1');
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
            <h1 className="text-lg font-bold text-foreground">Diario de Trading</h1>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Trades', value: stats.total, icon: BarChart3, color: 'text-primary' },
            { label: 'Ganadas', value: stats.wins, icon: TrendingUp, color: 'text-emerald-400' },
            { label: 'Perdidas', value: stats.losses, icon: TrendingDown, color: 'text-rose-400' },
            { label: 'Win Rate', value: `${stats.winRate}%`, icon: Target, color: 'text-amber-400' },
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
              <span className="text-sm font-medium text-foreground">Pips Totales</span>
            </div>
            <span className={cn(
              'text-lg font-bold tabular-nums',
              parseFloat(stats.totalPips) >= 0 ? 'text-emerald-400' : 'text-rose-400'
            )}>
              {parseFloat(stats.totalPips) >= 0 ? '+' : ''}{stats.totalPips}
            </span>
          </CardContent>
        </Card>

        {/* Add Button */}
        <Button
          onClick={() => setShowForm(!showForm)}
          className="w-full"
          variant={showForm ? 'secondary' : 'default'}
        >
          <Plus className="w-4 h-4 mr-2" />
          {showForm ? 'Cancelar' : 'Registrar Operación'}
        </Button>

        {/* New Trade Form */}
        {showForm && (
          <Card className="bg-card border-border">
            <CardContent className="p-4 space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Nueva Operación
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Fecha</Label>
                  <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-secondary border-border text-foreground" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Par</Label>
                  <Select value={pair} onValueChange={setPair}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>{PAIRS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Dirección</Label>
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
                  <Label className="text-xs text-muted-foreground">Lotes</Label>
                  <Input type="number" step="0.01" value={lotSize} onChange={e => setLotSize(e.target.value)} className="bg-secondary border-border text-foreground" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Precio Entrada</Label>
                  <Input type="number" step="0.00001" value={entryPrice} onChange={e => setEntryPrice(e.target.value)} placeholder="1.08500" className="bg-secondary border-border text-foreground" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Precio Salida</Label>
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
                  <Label className="text-xs text-muted-foreground">Resultado</Label>
                  <Select value={result} onValueChange={v => setResult(v as TradeEntry['result'])}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="win">✅ Ganada</SelectItem>
                      <SelectItem value="loss">❌ Perdida</SelectItem>
                      <SelectItem value="breakeven">➖ Breakeven</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Pips ±</Label>
                  <Input type="number" step="0.1" value={pips} onChange={e => setPips(e.target.value)} placeholder="25" className="bg-secondary border-border text-foreground" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Notas</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="¿Qué aprendiste de esta operación?" className="bg-secondary border-border text-foreground min-h-[60px]" />
              </div>

              <Button onClick={handleAdd} className="w-full" disabled={!entryPrice || !exitPrice}>
                <Plus className="w-4 h-4 mr-2" />
                Guardar Operación
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Trade History */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Historial de Operaciones
          </h3>

          {entries.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-sm text-muted-foreground">No hay operaciones registradas</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Comienza registrando tu primera operación</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                {entries.map((entry, i) => (
                  <div
                    key={entry.id}
                    className={cn(
                      'p-3 flex items-start gap-3',
                      i !== entries.length - 1 && 'border-b border-border'
                    )}
                  >
                    {/* Result indicator */}
                    <div className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                      entry.result === 'win' ? 'bg-emerald-500/15' :
                      entry.result === 'loss' ? 'bg-rose-500/15' : 'bg-muted'
                    )}>
                      {entry.result === 'win' ? <TrendingUp className="w-4 h-4 text-emerald-400" /> :
                       entry.result === 'loss' ? <TrendingDown className="w-4 h-4 text-rose-400" /> :
                       <ShieldAlert className="w-4 h-4 text-muted-foreground" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">{entry.pair}</span>
                          <span className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded font-semibold',
                            entry.action === 'BUY' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                          )}>{entry.action}</span>
                        </div>
                        <button onClick={() => handleDelete(entry.id)} className="text-muted-foreground hover:text-rose-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-muted-foreground">{entry.date}</span>
                        <span className="text-[10px] text-muted-foreground">{entry.lotSize} lotes</span>
                        <span className={cn(
                          'text-xs font-bold tabular-nums',
                          entry.result === 'win' ? 'text-emerald-400' :
                          entry.result === 'loss' ? 'text-rose-400' : 'text-muted-foreground'
                        )}>
                          {entry.result === 'loss' ? '-' : '+'}{entry.pips} pips
                        </span>
                      </div>

                      <div className="text-[10px] text-muted-foreground mt-1">
                        E: {entry.entryPrice} → S: {entry.exitPrice}
                        {entry.stopLoss && <span className="ml-2">SL: {entry.stopLoss}</span>}
                        {entry.takeProfit && <span className="ml-2">TP: {entry.takeProfit}</span>}
                      </div>

                      {entry.notes && (
                        <p className="text-[10px] text-muted-foreground/70 mt-1 italic line-clamp-2">"{entry.notes}"</p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </PageShell>
  );
}
