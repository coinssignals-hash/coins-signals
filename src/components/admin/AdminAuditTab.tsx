import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Search, RefreshCw, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  user_id: string | null;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

export function AdminAuditTab() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0);
  const pageSize = 25;

  const fetchLogs = async (p = 0) => {
    setLoading(true);
    let query = supabase
      .from('audit_logs')
      .select('id, action, resource_type, resource_id, user_id, success, error_message, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(p * pageSize, (p + 1) * pageSize - 1);

    if (filter === 'success') query = query.eq('success', true);
    if (filter === 'error') query = query.eq('success', false);

    const { data, count: total } = await query;
    setLogs((data || []) as AuditLog[]);
    setCount(total || 0);
    setLoading(false);
  };

  useEffect(() => { setPage(0); fetchLogs(0); }, [filter]);

  const totalPages = Math.ceil(count / pageSize);

  const filtered = logs.filter(l => {
    if (!search) return true;
    const s = search.toLowerCase();
    return l.action.toLowerCase().includes(s) || l.resource_type.toLowerCase().includes(s) || (l.user_id?.includes(s) ?? false);
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <Input
            placeholder="Buscar acción, recurso..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/25"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-28 bg-white/5 border-white/10 text-xs text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="success">Exitosos</SelectItem>
            <SelectItem value="error">Errores</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => fetchLogs(page)} className="border-white/10 text-white/50 hover:bg-white/5">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-xs text-white/30">{count} registros {totalPages > 1 && `• Página ${page + 1} de ${totalPages}`}</p>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-amber-400" /></div>
      ) : (
        <Card className="bg-[#0f0f18] border-white/5 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5">
                <TableHead className="text-[10px] text-white/40">Fecha</TableHead>
                <TableHead className="text-[10px] text-white/40">Acción</TableHead>
                <TableHead className="text-[10px] text-white/40">Recurso</TableHead>
                <TableHead className="text-[10px] text-white/40">Estado</TableHead>
                <TableHead className="text-[10px] text-white/40">Usuario</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(log => (
                <TableRow key={log.id} className="border-white/5 hover:bg-white/[0.02]">
                  <TableCell className="py-2 text-[10px] text-white/50 font-mono">{format(new Date(log.created_at), 'dd/MM HH:mm:ss')}</TableCell>
                  <TableCell className="py-2 text-xs text-white/70 font-medium">{log.action}</TableCell>
                  <TableCell className="py-2 text-[10px] text-white/40">{log.resource_type}</TableCell>
                  <TableCell className="py-2">
                    {log.success
                      ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                      : <XCircle className="h-3.5 w-3.5 text-red-400" />}
                  </TableCell>
                  <TableCell className="py-2 text-[10px] text-white/30 font-mono">{log.user_id?.slice(0, 8) || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && <p className="text-center text-sm text-white/20 py-8">Sin registros</p>}
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => { setPage(page - 1); fetchLogs(page - 1); }} className="border-white/10 text-white/50">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-white/30">{page + 1} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => { setPage(page + 1); fetchLogs(page + 1); }} className="border-white/10 text-white/50">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
