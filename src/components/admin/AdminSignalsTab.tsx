import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Loader2, Search, TrendingUp, TrendingDown, RefreshCw, Eye, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';

interface Signal {
  id: string;
  currency_pair: string;
  action: string;
  entry_price: number;
  take_profit: number;
  stop_loss: number;
  status: string;
  probability: number;
  trend: string;
  closed_result: string | null;
  created_at: string;
  notes: string | null;
}

export function AdminSignalsTab() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);

  const fetchSignals = async () => {
    setLoading(true);
    let query = supabase.from('trading_signals').select('*').order('created_at', { ascending: false }).limit(100);
    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    const { data } = await query;
    if (data) setSignals(data);
    setLoading(false);
  };

  useEffect(() => { fetchSignals(); }, [statusFilter]);

  const handleCloseSignal = async (id: string, result: string) => {
    await supabase.from('trading_signals').update({ status: 'closed', closed_result: result }).eq('id', id);
    toast({ title: 'Señal cerrada', description: `Resultado: ${result}` });
    fetchSignals();
  };

  const filtered = signals.filter(s => {
    if (!search) return true;
    return s.currency_pair.toLowerCase().includes(search.toLowerCase());
  });

  const activeCount = signals.filter(s => s.status === 'active' || s.status === 'pending').length;
  const closedCount = signals.filter(s => s.status === 'closed').length;
  const winCount = signals.filter(s => s.closed_result === 'tp' || s.closed_result === 'TP').length;

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 bg-card border-border text-center">
          <TrendingUp className="h-5 w-5 mx-auto text-primary mb-1" />
          <p className="text-lg font-bold text-foreground">{signals.length}</p>
          <p className="text-[10px] text-muted-foreground">Total</p>
        </Card>
        <Card className="p-3 bg-card border-border text-center">
          <Clock className="h-5 w-5 mx-auto text-chart-4 mb-1" />
          <p className="text-lg font-bold text-foreground">{activeCount}</p>
          <p className="text-[10px] text-muted-foreground">Activas</p>
        </Card>
        <Card className="p-3 bg-card border-border text-center">
          <CheckCircle className="h-5 w-5 mx-auto text-chart-2 mb-1" />
          <p className="text-lg font-bold text-foreground">{winCount}</p>
          <p className="text-[10px] text-muted-foreground">Ganadas</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar par..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-28 bg-card border-border text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="active">Activas</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="closed">Cerradas</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={fetchSignals}><RefreshCw className="h-4 w-4" /></Button>
      </div>

      {/* Signals Table */}
      <Card className="bg-card border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="text-xs">Par</TableHead>
              <TableHead className="text-xs">Acción</TableHead>
              <TableHead className="text-xs">Estado</TableHead>
              <TableHead className="text-xs">Prob.</TableHead>
              <TableHead className="text-xs">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(signal => (
              <TableRow key={signal.id} className="border-border">
                <TableCell className="py-2">
                  <p className="text-xs font-medium text-foreground">{signal.currency_pair}</p>
                  <p className="text-[10px] text-muted-foreground">{format(new Date(signal.created_at), 'dd/MM HH:mm')}</p>
                </TableCell>
                <TableCell className="py-2">
                  <Badge variant={signal.action === 'BUY' ? 'default' : 'destructive'} className="text-[10px]">
                    {signal.action === 'BUY' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    {signal.action}
                  </Badge>
                </TableCell>
                <TableCell className="py-2">
                  <Badge variant={signal.status === 'closed' ? 'secondary' : 'outline'} className="text-[10px]">
                    {signal.status}
                    {signal.closed_result && ` (${signal.closed_result})`}
                  </Badge>
                </TableCell>
                <TableCell className="py-2 text-xs text-muted-foreground">{signal.probability}%</TableCell>
                <TableCell className="py-2">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedSignal(signal)}>
                      <Eye className="h-3 w-3" />
                    </Button>
                    {signal.status !== 'closed' && (
                      <>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-chart-2" onClick={() => handleCloseSignal(signal.id, 'tp')}>
                          <CheckCircle className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleCloseSignal(signal.id, 'sl')}>
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Detail dialog */}
      <Dialog open={!!selectedSignal} onOpenChange={() => setSelectedSignal(null)}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground">{selectedSignal?.currency_pair}</DialogTitle>
          </DialogHeader>
          {selectedSignal && (
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><p className="text-muted-foreground text-xs">Entrada</p><p className="font-mono text-foreground">{selectedSignal.entry_price}</p></div>
                <div><p className="text-muted-foreground text-xs">Take Profit</p><p className="font-mono text-chart-2">{selectedSignal.take_profit}</p></div>
                <div><p className="text-muted-foreground text-xs">Stop Loss</p><p className="font-mono text-destructive">{selectedSignal.stop_loss}</p></div>
                <div><p className="text-muted-foreground text-xs">Probabilidad</p><p className="font-mono text-foreground">{selectedSignal.probability}%</p></div>
              </div>
              {selectedSignal.notes && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Notas</p>
                  <p className="text-xs text-foreground bg-background rounded p-2 max-h-32 overflow-y-auto">{selectedSignal.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
