import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserRole } from '@/hooks/useUserRole';
import { Loader2, Users, TrendingUp, BarChart3, Database, ShieldAlert } from 'lucide-react';
import { AdminUsersTab } from '@/components/admin/AdminUsersTab';
import { AdminSignalsTab } from '@/components/admin/AdminSignalsTab';
import { AdminAnalyticsTab } from '@/components/admin/AdminAnalyticsTab';
import { AdminTablesTab } from '@/components/admin/AdminTablesTab';

export default function Admin() {
  const { isAdmin, loading } = useUserRole();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');

  // Also allow moderator - we check via has_role for 'admin' or 'moderator'
  // For now useUserRole checks admin; we'll extend below

  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageShell>
    );
  }

  if (!isAdmin) {
    return (
      <PageShell>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center px-4">
          <ShieldAlert className="h-16 w-16 text-destructive" />
          <h1 className="text-2xl font-bold text-foreground">Acceso Denegado</h1>
          <p className="text-muted-foreground max-w-md">
            Solo administradores y moderadores pueden acceder a este panel.
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="px-4 py-6 space-y-4 pb-24">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <ShieldAlert className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Panel de Administración</h1>
            <p className="text-xs text-muted-foreground">Gestión completa de la plataforma</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4 bg-card border border-border">
            <TabsTrigger value="users" className="text-xs gap-1">
              <Users className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Usuarios</span>
            </TabsTrigger>
            <TabsTrigger value="signals" className="text-xs gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Señales</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs gap-1">
              <BarChart3 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Métricas</span>
            </TabsTrigger>
            <TabsTrigger value="tables" className="text-xs gap-1">
              <Database className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">BD</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4">
            <AdminUsersTab />
          </TabsContent>
          <TabsContent value="signals" className="mt-4">
            <AdminSignalsTab />
          </TabsContent>
          <TabsContent value="analytics" className="mt-4">
            <AdminAnalyticsTab />
          </TabsContent>
          <TabsContent value="tables" className="mt-4">
            <AdminTablesTab />
          </TabsContent>
        </Tabs>
      </div>
    </PageShell>
  );
}
