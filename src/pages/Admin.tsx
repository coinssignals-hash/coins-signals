import { useState, useEffect } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ShieldAlert, LogIn, LogOut, Menu, Search } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminDashboardTab } from '@/components/admin/AdminDashboardTab';
import { AdminUsersTab } from '@/components/admin/AdminUsersTab';
import { AdminSignalsTab } from '@/components/admin/AdminSignalsTab';
import { AdminAnalyticsTab } from '@/components/admin/AdminAnalyticsTab';
import { AdminTablesTabV2 } from '@/components/admin/AdminTablesTabV2';
import { AdminAuditTab } from '@/components/admin/AdminAuditTab';
import { AdminDocumentsTab } from '@/components/admin/AdminDocumentsTab';
import { AdminGlobalSearch } from '@/components/admin/AdminGlobalSearch';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const TAB_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  users: 'Gestión de Usuarios',
  signals: 'Señales de Trading',
  analytics: 'Métricas y Analíticas',
  tables: 'Explorador de Base de Datos',
  audit: 'Registros de Auditoría',
  documents: 'Documentos de Usuarios',
};

export default function Admin() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

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

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <AdminDashboardTab />;
      case 'users': return <AdminUsersTab />;
      case 'signals': return <AdminSignalsTab />;
      case 'analytics': return <AdminAnalyticsTab />;
      case 'tables': return <AdminTablesTabV2 />;
      case 'audit': return <AdminAuditTab />;
      case 'documents': return <AdminDocumentsTab />;
      default: return <AdminDashboardTab />;
    }
  };

  // Full-screen login / access denied states
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#08080d] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#08080d] text-white flex items-center justify-center">
        <div className="w-full max-w-xs space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
              <ShieldAlert className="h-8 w-8 text-amber-400" />
            </div>
            <h1 className="text-xl font-bold">Admin Panel</h1>
            <p className="text-sm text-white/30">Ingresa con tu cuenta de administrador</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-3">
            <Input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-amber-500/50" />
            <Input placeholder="Contraseña" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-amber-500/50" />
            <Button type="submit" disabled={loginLoading} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold">
              {loginLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><LogIn className="h-4 w-4 mr-2" /> Ingresar</>}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#08080d] text-white flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <ShieldAlert className="h-10 w-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold">Acceso Denegado</h1>
        <p className="text-white/40 max-w-md text-sm">Tu cuenta no tiene permisos de administrador o moderador.</p>
        <Button variant="outline" onClick={handleLogout} className="border-white/15 text-white/60 hover:bg-white/5">
          Cerrar sesión
        </Button>
      </div>
    );
  }

  // Main admin layout with sidebar
  return (
    <div className="min-h-screen bg-[#08080d] text-white font-sans">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <AdminSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile overlay sidebar */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-56">
            <AdminSidebar
              activeTab={activeTab}
              onTabChange={(tab) => { setActiveTab(tab); setMobileMenuOpen(false); }}
              collapsed={false}
              onToggleCollapse={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Content area */}
      <div className={cn('transition-all duration-300', sidebarCollapsed ? 'md:ml-16' : 'md:ml-56')}>
        {/* Top bar */}
        <header className="sticky top-0 z-40 h-14 border-b border-white/5 bg-[#08080d]/95 backdrop-blur flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-white/50 hover:text-white hover:bg-white/5 h-8 w-8"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-sm font-semibold text-white/70">{TAB_TITLES[activeTab] || 'Dashboard'}</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Global search trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 h-8 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/30 hover:text-white/50 hover:bg-white/[0.06] transition-colors text-xs"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Buscar...</span>
              <kbd className="hidden sm:inline text-[9px] bg-white/[0.06] px-1.5 py-0.5 rounded text-white/20 ml-1 font-mono">⌘K</kbd>
            </button>
            <span className="text-[10px] text-white/25 hidden lg:inline font-mono">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white/40 hover:text-white hover:bg-white/5 h-8 text-xs">
              <LogOut className="h-3.5 w-3.5 mr-1" /> Salir
            </Button>
          </div>
        </header>

        {/* Global Search Dialog */}
        <AdminGlobalSearch open={searchOpen} onOpenChange={setSearchOpen} onNavigate={setActiveTab} />

        {/* Main content */}
        <main className="p-4 md:p-6 max-w-6xl">
          {renderTab()}
        </main>
      </div>
    </div>
  );
}
