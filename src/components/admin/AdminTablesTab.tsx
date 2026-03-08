import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, RefreshCw, Database, ChevronLeft, ChevronRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const TABLES = [
  'profiles',
  'trading_signals',
  'trading_journal',
  'favorite_signals',
  'favorite_currencies',
  'favorite_symbols',
  'user_roles',
  'user_documents',
  'user_alert_configs',
  'user_broker_connections',
  'account_snapshots',
  'orders',
  'positions',
  'trades',
  'referral_codes',
  'referrals',
  'course_progress',
  'stock_price_alerts',
  'push_subscriptions',
  'audit_logs',
  'ai_analysis_cache',
  'news_ai_analysis_cache',
  'market_data_cache',
  'brokers',
] as const;

type TableName = typeof TABLES[number];

export function AdminTablesTab() {
  const [selectedTable, setSelectedTable] = useState<TableName>('profiles');
  const [rows, setRows] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
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
    fetchTable(selectedTable, 0);
  }, [selectedTable]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchTable(selectedTable, newPage);
  };

  const totalPages = Math.ceil(count / pageSize);

  const formatCell = (value: any): string => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'object') return JSON.stringify(value).slice(0, 60) + '...';
    if (typeof value === 'string' && value.length > 40) return value.slice(0, 40) + '...';
    return String(value);
  };

  return (
    <div className="space-y-4">
      {/* Table selector */}
      <div className="flex gap-2 items-center">
        <Database className="h-4 w-4 text-primary" />
        <Select value={selectedTable} onValueChange={v => setSelectedTable(v as TableName)}>
          <SelectTrigger className="flex-1 bg-card border-border text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {TABLES.map(t => (
              <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => fetchTable(selectedTable, page)}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Count */}
      <p className="text-xs text-muted-foreground">
        {count} registros en <span className="font-mono text-primary">{selectedTable}</span>
        {totalPages > 1 && ` • Página ${page + 1} de ${totalPages}`}
      </p>

      {/* Data Table */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <Card className="bg-card border-border overflow-hidden">
          <ScrollArea className="w-full">
            <div className="min-w-[600px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    {columns.slice(0, 6).map(col => (
                      <TableHead key={col} className="text-[10px] font-mono whitespace-nowrap">{col}</TableHead>
                    ))}
                    {columns.length > 6 && <TableHead className="text-[10px]">+{columns.length - 6} más</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, i) => (
                    <TableRow key={i} className="border-border">
                      {columns.slice(0, 6).map(col => (
                        <TableCell key={col} className="py-1.5 text-[10px] font-mono text-foreground whitespace-nowrap max-w-[120px] truncate">
                          {formatCell(row[col])}
                        </TableCell>
                      ))}
                      {columns.length > 6 && <TableCell className="py-1.5 text-[10px] text-muted-foreground">...</TableCell>}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
          {rows.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">Tabla vacía</p>}
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => handlePageChange(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground">{page + 1} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => handlePageChange(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
