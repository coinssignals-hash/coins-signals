import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import {
  Loader2, Flag, ShieldBan, CheckCircle, XCircle, AlertTriangle,
  RefreshCw, Search, Eye, Ban, Clock, Users
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Report {
  id: string;
  message_id: string | null;
  dm_id: string | null;
  reporter_id: string;
  reason: string;
  status: string;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

interface UserBan {
  id: string;
  user_id: string;
  banned_by: string;
  reason: string | null;
  banned_until: string | null;
  is_permanent: boolean | null;
  created_at: string;
}

interface ProfileMap {
  [key: string]: { first_name: string | null; last_name: string | null };
}

export function AdminModerationTab() {
  const [reports, setReports] = useState<Report[]>([]);
  const [bans, setBans] = useState<UserBan[]>([]);
  const [profiles, setProfiles] = useState<ProfileMap>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Ban dialog
  const [banDialog, setBanDialog] = useState(false);
  const [banUserId, setBanUserId] = useState('');
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState('7d');
  const [banLoading, setBanLoading] = useState(false);

  // Detail dialog
  const [detailReport, setDetailReport] = useState<Report | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [reportsRes, bansRes, profilesRes] = await Promise.all([
      supabase.from('forum_reports').select('*').order('created_at', { ascending: false }),
      supabase.from('forum_user_bans').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, first_name, last_name'),
    ]);

    if (reportsRes.data) setReports(reportsRes.data);
    if (bansRes.data) setBans(bansRes.data);
    if (profilesRes.data) {
      const map: ProfileMap = {};
      profilesRes.data.forEach(p => { map[p.id] = { first_name: p.first_name, last_name: p.last_name }; });
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const userName = (id: string) => {
    const p = profiles[id];
    if (!p) return id.slice(0, 8) + '...';
    return (p.first_name || p.last_name) ? `${p.first_name || ''} ${p.last_name || ''}`.trim() : id.slice(0, 8) + '...';
  };

  const handleResolve = async (reportId: string, action: 'resolved' | 'dismissed') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('forum_reports').update({
      status: action,
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    }).eq('id', reportId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: action === 'resolved' ? 'Reporte resuelto' : 'Reporte descartado' });
      fetchData();
    }
  };

  const handleBan = async () => {
    if (!banUserId.trim()) return;
    setBanLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBanLoading(false); return; }

    let banned_until: string | null = null;
    let is_permanent = false;

    if (banDuration === 'permanent') {
      is_permanent = true;
    } else {
      const days = banDuration === '1d' ? 1 : banDuration === '7d' ? 7 : banDuration === '30d' ? 30 : 7;
      const d = new Date();
      d.setDate(d.getDate() + days);
      banned_until = d.toISOString();
    }

    const { error } = await supabase.from('forum_user_bans').insert({
      user_id: banUserId.trim(),
      banned_by: user.id,
      reason: banReason || null,
      banned_until,
      is_permanent,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Usuario baneado exitosamente' });
      setBanDialog(false);
      setBanUserId('');
      setBanReason('');
      fetchData();
    }
    setBanLoading(false);
  };

  const handleUnban = async (banId: string) => {
    const { error } = await supabase.from('forum_user_bans').delete().eq('id', banId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Ban eliminado' });
      fetchData();
    }
  };

  const filteredReports = reports.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return r.reason.toLowerCase().includes(s) || r.reporter_id.includes(s) || r.id.includes(s);
    }
    return true;
  });

  const pendingCount = reports.filter(r => r.status === 'pending').length;
  const activeBans = bans.filter(b => b.is_permanent || (b.banned_until && new Date(b.banned_until) > new Date()));

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 bg-card border-border text-center">
          <Flag className="h-5 w-5 mx-auto text-amber-400 mb-1" />
          <p className="text-lg font-bold text-foreground">{reports.length}</p>
          <p className="text-[10px] text-muted-foreground">Total Reportes</p>
        </Card>
        <Card className="p-3 bg-card border-border text-center">
          <AlertTriangle className="h-5 w-5 mx-auto text-orange-400 mb-1" />
          <p className="text-lg font-bold text-foreground">{pendingCount}</p>
          <p className="text-[10px] text-muted-foreground">Pendientes</p>
        </Card>
        <Card className="p-3 bg-card border-border text-center">
          <ShieldBan className="h-5 w-5 mx-auto text-red-400 mb-1" />
          <p className="text-lg font-bold text-foreground">{activeBans.length}</p>
          <p className="text-[10px] text-muted-foreground">Bans Activos</p>
        </Card>
        <Card className="p-3 bg-card border-border text-center">
          <CheckCircle className="h-5 w-5 mx-auto text-emerald-400 mb-1" />
          <p className="text-lg font-bold text-foreground">{reports.filter(r => r.status === 'resolved').length}</p>
          <p className="text-[10px] text-muted-foreground">Resueltos</p>
        </Card>
      </div>

      <Tabs defaultValue="reports" className="space-y-4">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="reports" className="text-xs">
            <Flag className="h-3.5 w-3.5 mr-1.5" /> Reportes {pendingCount > 0 && <Badge variant="destructive" className="ml-1.5 text-[9px] px-1.5">{pendingCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="bans" className="text-xs">
            <ShieldBan className="h-3.5 w-3.5 mr-1.5" /> Baneos
          </TabsTrigger>
        </TabsList>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar reporte..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px] bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="resolved">Resueltos</SelectItem>
                <SelectItem value="dismissed">Descartados</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchData}><RefreshCw className="h-4 w-4" /></Button>
          </div>

          <Card className="bg-card border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-xs">Reportado por</TableHead>
                  <TableHead className="text-xs">Razón</TableHead>
                  <TableHead className="text-xs">Estado</TableHead>
                  <TableHead className="text-xs">Fecha</TableHead>
                  <TableHead className="text-xs">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map(report => (
                  <TableRow key={report.id} className="border-border">
                    <TableCell className="py-2 text-xs text-foreground">{userName(report.reporter_id)}</TableCell>
                    <TableCell className="py-2 text-xs text-muted-foreground max-w-[200px] truncate">{report.reason}</TableCell>
                    <TableCell className="py-2">
                      <Badge
                        variant={report.status === 'pending' ? 'destructive' : report.status === 'resolved' ? 'default' : 'secondary'}
                        className="text-[10px]"
                      >
                        {report.status === 'pending' ? 'Pendiente' : report.status === 'resolved' ? 'Resuelto' : 'Descartado'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2 text-[10px] text-muted-foreground">
                      {format(new Date(report.created_at), 'dd MMM HH:mm', { locale: es })}
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setDetailReport(report)}>
                          <Eye className="h-3 w-3 mr-1" /> Ver
                        </Button>
                        {report.status === 'pending' && (
                          <>
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-emerald-400 hover:text-emerald-300" onClick={() => handleResolve(report.id, 'resolved')}>
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground" onClick={() => handleResolve(report.id, 'dismissed')}>
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
            {filteredReports.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No se encontraron reportes</p>}
          </Card>
        </TabsContent>

        {/* Bans Tab */}
        <TabsContent value="bans" className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">{activeBans.length} ban(es) activos</p>
            <Button size="sm" className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 h-8 text-xs" onClick={() => setBanDialog(true)}>
              <Ban className="h-3.5 w-3.5 mr-1.5" /> Banear Usuario
            </Button>
          </div>

          <Card className="bg-card border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-xs">Usuario</TableHead>
                  <TableHead className="text-xs">Razón</TableHead>
                  <TableHead className="text-xs">Duración</TableHead>
                  <TableHead className="text-xs">Baneado por</TableHead>
                  <TableHead className="text-xs">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bans.map(ban => {
                  const isActive = ban.is_permanent || (ban.banned_until && new Date(ban.banned_until) > new Date());
                  return (
                    <TableRow key={ban.id} className="border-border">
                      <TableCell className="py-2 text-xs text-foreground">{userName(ban.user_id)}</TableCell>
                      <TableCell className="py-2 text-xs text-muted-foreground max-w-[200px] truncate">{ban.reason || '—'}</TableCell>
                      <TableCell className="py-2">
                        {ban.is_permanent ? (
                          <Badge variant="destructive" className="text-[10px]">Permanente</Badge>
                        ) : ban.banned_until ? (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(ban.banned_until), 'dd MMM yyyy', { locale: es })}
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="py-2 text-xs text-muted-foreground">{userName(ban.banned_by)}</TableCell>
                      <TableCell className="py-2">
                        {isActive && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-amber-400 hover:text-amber-300" onClick={() => handleUnban(ban.id)}>
                            Desbanear
                          </Button>
                        )}
                        {!isActive && <Badge variant="secondary" className="text-[10px]">Expirado</Badge>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {bans.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No hay baneos registrados</p>}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Report Detail Dialog */}
      <Dialog open={!!detailReport} onOpenChange={o => { if (!o) setDetailReport(null); }}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Detalle del Reporte</DialogTitle>
          </DialogHeader>
          {detailReport && (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase mb-0.5">Reportado por</p>
                <p className="text-foreground">{userName(detailReport.reporter_id)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase mb-0.5">Tipo</p>
                <p className="text-foreground">{detailReport.message_id ? 'Mensaje del foro' : detailReport.dm_id ? 'Mensaje directo' : 'Desconocido'}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase mb-0.5">Razón</p>
                <p className="text-foreground">{detailReport.reason}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase mb-0.5">Estado</p>
                <Badge variant={detailReport.status === 'pending' ? 'destructive' : 'default'} className="text-[10px]">
                  {detailReport.status}
                </Badge>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase mb-0.5">Fecha</p>
                <p className="text-foreground">{format(new Date(detailReport.created_at), "dd MMM yyyy 'a las' HH:mm", { locale: es })}</p>
              </div>
              {detailReport.status === 'pending' && (
                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="flex-1" onClick={() => { handleResolve(detailReport.id, 'resolved'); setDetailReport(null); }}>
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Resolver
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => { handleResolve(detailReport.id, 'dismissed'); setDetailReport(null); }}>
                    <XCircle className="h-3.5 w-3.5 mr-1.5" /> Descartar
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Ban User Dialog */}
      <Dialog open={banDialog} onOpenChange={setBanDialog}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground">Banear Usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase">ID del usuario</label>
              <Input value={banUserId} onChange={e => setBanUserId(e.target.value)} placeholder="UUID del usuario" className="bg-background border-border mt-1" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase">Razón</label>
              <Textarea value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="Motivo del baneo..." className="bg-background border-border mt-1 resize-none" rows={3} />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase">Duración</label>
              <Select value={banDuration} onValueChange={setBanDuration}>
                <SelectTrigger className="bg-background border-border mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">1 día</SelectItem>
                  <SelectItem value="7d">7 días</SelectItem>
                  <SelectItem value="30d">30 días</SelectItem>
                  <SelectItem value="permanent">Permanente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleBan} disabled={banLoading || !banUserId.trim()} className="w-full bg-red-500 hover:bg-red-600 text-white">
              {banLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Ban className="h-4 w-4 mr-2" /> Confirmar Baneo</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
