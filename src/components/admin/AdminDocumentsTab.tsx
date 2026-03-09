import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Loader2, Search, RefreshCw, FileText, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface UserDocument {
  id: string;
  user_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  status: string;
  review_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export function AdminDocumentsTab() {
  const [docs, setDocs] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDoc, setSelectedDoc] = useState<UserDocument | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const fetchDocs = async () => {
    setLoading(true);
    let query = supabase.from('user_documents').select('*').order('created_at', { ascending: false });
    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    const { data } = await query;
    setDocs((data || []) as UserDocument[]);
    setLoading(false);
  };

  useEffect(() => { fetchDocs(); }, [statusFilter]);

  const handleReview = async (docId: string, newStatus: string) => {
    // Note: admin can't update user_documents via RLS directly.
    // This would need an edge function or RLS policy update for admin.
    toast({ title: 'Acción requerida', description: 'Se necesita una función backend para actualizar documentos como admin.' });
  };

  const pendingCount = docs.filter(d => d.status === 'pending').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-emerald-500/15 text-emerald-400 border-0 text-[10px]">Aprobado</Badge>;
      case 'rejected': return <Badge className="bg-red-500/15 text-red-400 border-0 text-[10px]">Rechazado</Badge>;
      default: return <Badge className="bg-amber-500/15 text-amber-400 border-0 text-[10px]">Pendiente</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-[#0f0f18] border-white/5 p-3 text-center">
          <FileText className="h-5 w-5 mx-auto text-blue-400 mb-1" />
          <p className="text-lg font-bold text-white">{docs.length}</p>
          <p className="text-[10px] text-white/30">Total</p>
        </Card>
        <Card className="bg-[#0f0f18] border-white/5 p-3 text-center">
          <Clock className="h-5 w-5 mx-auto text-amber-400 mb-1" />
          <p className="text-lg font-bold text-white">{pendingCount}</p>
          <p className="text-[10px] text-white/30">Pendientes</p>
        </Card>
        <Card className="bg-[#0f0f18] border-white/5 p-3 text-center">
          <CheckCircle className="h-5 w-5 mx-auto text-emerald-400 mb-1" />
          <p className="text-lg font-bold text-white">{docs.filter(d => d.status === 'approved').length}</p>
          <p className="text-[10px] text-white/30">Aprobados</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 bg-white/5 border-white/10 text-xs text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="approved">Aprobados</SelectItem>
            <SelectItem value="rejected">Rechazados</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={fetchDocs} className="border-white/10 text-white/50 hover:bg-white/5">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-amber-400" /></div>
      ) : (
        <Card className="bg-[#0f0f18] border-white/5 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5">
                <TableHead className="text-[10px] text-white/40">Archivo</TableHead>
                <TableHead className="text-[10px] text-white/40">Tipo</TableHead>
                <TableHead className="text-[10px] text-white/40">Estado</TableHead>
                <TableHead className="text-[10px] text-white/40">Fecha</TableHead>
                <TableHead className="text-[10px] text-white/40">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map(doc => (
                <TableRow key={doc.id} className="border-white/5 hover:bg-white/[0.02]">
                  <TableCell className="py-2">
                    <p className="text-xs text-white/70 font-medium truncate max-w-[150px]">{doc.file_name}</p>
                    <p className="text-[10px] text-white/25">{(doc.file_size / 1024).toFixed(0)} KB</p>
                  </TableCell>
                  <TableCell className="py-2 text-xs text-white/50">{doc.document_type}</TableCell>
                  <TableCell className="py-2">{getStatusBadge(doc.status)}</TableCell>
                  <TableCell className="py-2 text-[10px] text-white/30 font-mono">{format(new Date(doc.created_at), 'dd/MM HH:mm')}</TableCell>
                  <TableCell className="py-2">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-white/40 hover:text-white" onClick={() => setSelectedDoc(doc)}>
                      <Eye className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {docs.length === 0 && <p className="text-center text-sm text-white/20 py-8">Sin documentos</p>}
        </Card>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
        <DialogContent className="bg-[#0f0f18] border-white/10 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white text-sm">Detalle del Documento</DialogTitle>
          </DialogHeader>
          {selectedDoc && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><p className="text-white/30 text-xs">Archivo</p><p className="text-white/80 text-xs truncate">{selectedDoc.file_name}</p></div>
                <div><p className="text-white/30 text-xs">Tipo</p><p className="text-white/80 text-xs">{selectedDoc.document_type}</p></div>
                <div><p className="text-white/30 text-xs">MIME</p><p className="text-white/80 text-xs">{selectedDoc.mime_type}</p></div>
                <div><p className="text-white/30 text-xs">Estado</p>{getStatusBadge(selectedDoc.status)}</div>
              </div>
              <div><p className="text-white/30 text-xs">Usuario</p><p className="text-white/50 text-[10px] font-mono">{selectedDoc.user_id}</p></div>
              {selectedDoc.review_notes && (
                <div><p className="text-white/30 text-xs">Notas</p><p className="text-white/60 text-xs bg-white/5 rounded p-2">{selectedDoc.review_notes}</p></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
