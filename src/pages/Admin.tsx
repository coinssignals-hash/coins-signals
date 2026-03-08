import { useState, useEffect } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Users, TrendingUp, BarChart3, Database, ShieldAlert, LogIn, LogOut } from 'lucide-react';
import { AdminUsersTab } from '@/components/admin/AdminUsersTab';
import { AdminSignalsTab } from '@/components/admin/AdminSignalsTab';
import { AdminAnalyticsTab } from '@/components/admin/AdminAnalyticsTab';
import { AdminTablesTab } from '@/components/admin/AdminTablesTab';
import { toast } from '@/hooks/use-toast';

export default function Admin() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [activeTab, setActiveTab] = useState('users');
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    setLoginLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: 'Sesión cerrada' });
  };

  const isLoading = authLoading || roleLoading;

  // Standalone dark page — no PageShell, no Header, no BottomNav
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-amber-400" />
          <span className="text-sm font-bold tracking-wide text-amber-400">ADMIN PANEL</span>
        </div>
        {user && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/50 hidden sm:inline">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white/60 hover:text-white hover:bg-white/10 h-8 text-xs">
              <LogOut className="h-3.5 w-3.5 mr-1" /> Salir
            </Button>
          </div>
        )}
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
          </div>
        ) : !user ? (
          /* Login form */
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="w-full max-w-xs space-y-6">
              <div className="text-center space-y-2">
                <ShieldAlert className="h-12 w-12 mx-auto text-amber-400" />
                <h1 className="text-xl font-bold">Admin Login</h1>
                <p className="text-sm text-white/40">Ingresa con tu cuenta de administrador</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-3">
                <Input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
                <Input placeholder="Contraseña" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
                <Button type="submit" disabled={loginLoading} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold">
                  {loginLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><LogIn className="h-4 w-4 mr-2" /> Ingresar</>}
                </Button>
              </form>
            </div>
          </div>
        ) : !isAdmin ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
            <ShieldAlert className="h-16 w-16 text-red-500" />
            <h1 className="text-2xl font-bold">Acceso Denegado</h1>
            <p className="text-white/50 max-w-md text-sm">Tu cuenta no tiene permisos de administrador o moderador.</p>
            <Button variant="outline" onClick={handleLogout} className="border-white/20 text-white/70 hover:bg-white/10">
              Cerrar sesión
            </Button>
          </div>
        ) : (
          /* Admin content */
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-4 bg-white/5 border border-white/10">
                <TabsTrigger value="users" className="text-xs gap-1 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                  <Users className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Usuarios</span>
                </TabsTrigger>
                <TabsTrigger value="signals" className="text-xs gap-1 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Señales</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="text-xs gap-1 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                  <BarChart3 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Métricas</span>
                </TabsTrigger>
                <TabsTrigger value="tables" className="text-xs gap-1 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                  <Database className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">BD</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="mt-4"><AdminUsersTab /></TabsContent>
              <TabsContent value="signals" className="mt-4"><AdminSignalsTab /></TabsContent>
              <TabsContent value="analytics" className="mt-4"><AdminAnalyticsTab /></TabsContent>
              <TabsContent value="tables" className="mt-4"><AdminTablesTab /></TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
}