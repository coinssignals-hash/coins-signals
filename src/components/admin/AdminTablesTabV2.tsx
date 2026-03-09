import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, Database, ChevronLeft, ChevronRight, Eye, Trash2, Plus, Copy } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const TABLES = [
  'profiles', 'trading_signals', 'trading_journal', 'favorite_signals', 'favorite_currencies',
  'favorite_symbols', 'user_roles', 'user_documents', 'user_alert_configs',
  'user_broker_connections', 'account_snapshots', 'orders', 'positions', 'trades',
  'referral_codes', 'referrals', 'course_progress', 'stock_price_alerts',
  'push_subscriptions', 'audit_logs', 'ai_analysis_cache', 'news_ai_analysis_cache',
  'market_data_cache', 'brokers', 'signal_ai_analysis_history',
] as const;

type TableName = typeof TABLES[number];

export function AdminTablesTabV2() {
  const [selectedTable, setSelectedTable] = useState<TableName>('profiles');
  const [rows, setRows] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [search, setSearch] = useState('');
  const pageSize = 20;

  const fetchTable = async (table: TableName, p: number = 0) => {
    setLoading(true);
    const from = p * pageSize;
    const to = from + pageSize - 1;

    const { data, count: total } = await supabase
      .from(table)
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('created_at' as any, { ascending: false });

    if (data && data.length > 0) {
      setColumns(Object.keys(data[0]));
      setRows(data);
    } else {
      setColumns([]);
      setRows([]);
    }
    setCount(total || 0);
    setLoading(false);
  };

  useEffect(() => {
    setPage(0);
    setSearch('');
    fetchTable(selectedTable, 0);
  }, [selectedTable]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchTable(selectedTable, newPage);
  };

  const handleDeleteRow = async (row: any) => {
    if (!row.id) {
      toast({ title: 'Error', description: 'Esta fila no tiene campo id', variant: 'destructive' });
      return;
    }
    const confirmed = window.confirm(`¿Eliminar registro ${row.id.slice(0, 8)}...?`);
    if (!confirmed) return;

    const { error } = await supabase.from(selectedTable).delete().eq('id', row.id);
    if (error) {
      toast({ title: 'Error al eliminar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Registro eliminado' });
      fetchTable(selectedTable, page);
    }
  };

  const handleCopyJson = (row: any) => {
    navigator.clipboard.writeText(JSON.stringify(row, null, 2));
    toast({ title: 'JSON copiado al portapapeles' });
  };

  const totalPages = Math.ceil(count / pageSize);

  const formatCell = (value: any): string => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? '✓' : '✗';
    if (typeof value === 'object') return JSON.stringify(value).slice(0, 50) + '…';
    if (typeof value === 'string' && value.length > 35) return value.slice(0, 35) + '…';
    return String(value);
  };

  const filteredRows = search
    ? rows.filter(r => JSON.stringify(r).toLowerCase().includes(search.toLowerCase()))
    : rows;

  return (
    <div className="space-y-4">
      {/* Table selector + search */}
      <div className="flex gap-2 items-center">
        <Database className="h-4 w-4 text-amber-400 shrink-0" />
        <Select value={selectedTable} onValueChange={v => setSelectedTable(v as TableName)}>
          <SelectTrigger className="flex-1 bg-white/5 border-white/10 text-xs text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {TABLES.map(t => (
              <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => fetchTable(selectedTable, page)} className="border-white/10 text-white/50 hover:bg-white/5">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Search within results */}
      <Input
        placeholder="Filtrar en resultados..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="bg-white/5 border-white/10 text-white placeholder:text-white/20 text-xs"
      />

      <p className="text-xs text-white/25">
        {count} registros en <span className="font-mono text-amber-400/80">{selectedTable}</span>
        {totalPages > 1 && ` · Pág ${page + 1}/${totalPages}`}
      </p>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-amber-400" /></div>
      ) : (
        <Card className="bg-[#0f0f18] border-white/5 overflow-hidden">
          <ScrollArea className="w-full">
            <div className="min-w-[700px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5">
                    {columns.slice(0, 5).map(col => (
                      <TableHead key={col} className="text-[10px] font-mono text-white/30 whitespace-nowrap">{col}</TableHead>
                    ))}
                    {columns.length > 5 && <TableHead className="text-[10px] text-white/20">+{columns.length - 5}</TableHead>}
                    <TableHead className="text-[10px] text-white/30 w-20">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((row, i) => (
                    <TableRow key={i} className="border-white/5 hover:bg-white/[0.02]">
                      {columns.slice(0, 5).map(col => (
                        <TableCell key={col} className="py-1.5 text-[10px] font-mono text-white/60 whitespace-nowrap max-w-[120px] truncate">
                          {formatCell(row[col])}
                        </TableCell>
                      ))}
                      {columns.length > 5 && <TableCell className="py-1.5 text-[10px] text-white/15">…</TableCell>}
                      <TableCell className="py-1.5">
                        <div className="flex gap-0.5">
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-white/30 hover:text-white" onClick={() => setSelectedRow(row)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-white/30 hover:text-amber-400" onClick={() => handleCopyJson(row)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-white/30 hover:text-red-400" onClick={() => handleDeleteRow(row)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
          {filteredRows.length === 0 && <p className="text-center text-sm text-white/15 py-8">Sin datos</p>}
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => handlePageChange(page - 1)} className="border-white/10 text-white/50">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-white/25">{page + 1} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => handlePageChange(page + 1)} className="border-white/10 text-white/50">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Row detail dialog */}
      <Dialog open={!!selectedRow} onOpenChange={() => setSelectedRow(null)}>
        <DialogContent className="bg-[#0f0f18] border-white/10 max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-white text-sm font-mono">{selectedTable} — Detalle</DialogTitle>
          </DialogHeader>
          {selectedRow && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-2">
                {Object.entries(selectedRow).map(([key, value]) => (
                  <div key={key} className="flex gap-2 text-xs border-b border-white/5 pb-2">
                    <span className="text-white/30 font-mono w-36 shrink-0 truncate">{key}</span>
                    <span className="text-white/70 font-mono break-all">
                      {value === null ? <span className="text-white/15">null</span> : typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
