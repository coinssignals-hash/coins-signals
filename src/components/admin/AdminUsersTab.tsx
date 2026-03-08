import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Loader2, Search, UserPlus, Shield, Users, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  country: string | null;
  trading_mode: string | null;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: 'admin' | 'moderator' | 'user';
}

export function AdminUsersTab() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleDialog, setRoleDialog] = useState<{ open: boolean; userId: string; currentRole: string }>({ open: false, userId: '', currentRole: '' });
  const [selectedRole, setSelectedRole] = useState<string>('user');

  const fetchData = async () => {
    setLoading(true);
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from('profiles').select('id, first_name, last_name, avatar_url, country, trading_mode, created_at').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('user_id, role'),
    ]);

    if (profilesRes.data) setProfiles(profilesRes.data);
    if (rolesRes.data) setRoles(rolesRes.data as UserRole[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const getUserRole = (userId: string) => {
    const found = roles.find(r => r.user_id === userId);
    return found?.role || 'user';
  };

  const handleAssignRole = async () => {
    const { userId } = roleDialog;
    const existingRole = roles.find(r => r.user_id === userId);

    if (selectedRole === 'user' && existingRole) {
      await supabase.from('user_roles').delete().eq('user_id', userId);
    } else if (existingRole) {
      await supabase.from('user_roles').update({ role: selectedRole as any }).eq('user_id', userId);
    } else {
      await supabase.from('user_roles').insert({ user_id: userId, role: selectedRole as any });
    }

    toast({ title: 'Rol actualizado', description: `Rol cambiado a ${selectedRole}` });
    setRoleDialog({ open: false, userId: '', currentRole: '' });
    fetchData();
  };

  const filtered = profiles.filter(p => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (p.first_name?.toLowerCase().includes(s) || p.last_name?.toLowerCase().includes(s) || p.id.includes(s) || p.country?.toLowerCase().includes(s));
  });

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 bg-card border-border text-center">
          <Users className="h-5 w-5 mx-auto text-primary mb-1" />
          <p className="text-lg font-bold text-foreground">{profiles.length}</p>
          <p className="text-[10px] text-muted-foreground">Total Usuarios</p>
        </Card>
        <Card className="p-3 bg-card border-border text-center">
          <Shield className="h-5 w-5 mx-auto text-accent mb-1" />
          <p className="text-lg font-bold text-foreground">{roles.filter(r => r.role === 'admin').length}</p>
          <p className="text-[10px] text-muted-foreground">Admins</p>
        </Card>
        <Card className="p-3 bg-card border-border text-center">
          <UserPlus className="h-5 w-5 mx-auto text-chart-2 mb-1" />
          <p className="text-lg font-bold text-foreground">{roles.filter(r => r.role === 'moderator').length}</p>
          <p className="text-[10px] text-muted-foreground">Moderadores</p>
        </Card>
      </div>

      {/* Search + Refresh */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar usuario..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
        </div>
        <Button variant="outline" size="icon" onClick={fetchData}><RefreshCw className="h-4 w-4" /></Button>
      </div>

      {/* Users Table */}
      <Card className="bg-card border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="text-xs">Usuario</TableHead>
              <TableHead className="text-xs">País</TableHead>
              <TableHead className="text-xs">Rol</TableHead>
              <TableHead className="text-xs">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(user => {
              const role = getUserRole(user.id);
              return (
                <TableRow key={user.id} className="border-border">
                  <TableCell className="py-2">
                    <div>
                      <p className="text-xs font-medium text-foreground">
                        {user.first_name || user.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Sin nombre'}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{user.id.slice(0, 8)}...</p>
                    </div>
                  </TableCell>
                  <TableCell className="py-2 text-xs text-muted-foreground">{user.country || '—'}</TableCell>
                  <TableCell className="py-2">
                    <Badge variant={role === 'admin' ? 'default' : role === 'moderator' ? 'secondary' : 'outline'} className="text-[10px]">
                      {role}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2">
                    <Dialog open={roleDialog.open && roleDialog.userId === user.id} onOpenChange={o => setRoleDialog(o ? { open: true, userId: user.id, currentRole: role } : { open: false, userId: '', currentRole: '' })}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => { setSelectedRole(role); setRoleDialog({ open: true, userId: user.id, currentRole: role }); }}>
                          <Shield className="h-3 w-3 mr-1" /> Rol
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card border-border">
                        <DialogHeader>
                          <DialogTitle className="text-foreground">Asignar Rol</DialogTitle>
                        </DialogHeader>
                        <p className="text-sm text-muted-foreground mb-3">
                          Usuario: {user.first_name || user.id.slice(0, 8)}
                        </p>
                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                          <SelectTrigger className="bg-background border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="moderator">Moderator</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button onClick={handleAssignRole} className="w-full mt-3">Guardar Rol</Button>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No se encontraron usuarios</p>}
      </Card>
    </div>
  );
}
