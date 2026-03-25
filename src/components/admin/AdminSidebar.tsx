import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  BarChart3,
  Database,
  FileText,
  ScrollText,
  Bell,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ShieldBan,
  PlusCircle,
  Activity,
  HeartPulse,
  Vote,
  Gift,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export interface AdminTab {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

const ADMIN_TABS: AdminTab[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Usuarios', icon: Users },
  { id: 'signals', label: 'Señales', icon: TrendingUp },
  { id: 'create-signal', label: 'Crear Señal', icon: PlusCircle },
  { id: 'notifications', label: 'Notificaciones', icon: Bell },
  { id: 'analytics', label: 'Métricas', icon: BarChart3 },
  { id: 'api-usage', label: 'Consumo APIs/IA', icon: Activity },
  { id: 'health-check', label: 'Health Check', icon: HeartPulse },
  { id: 'tables', label: 'Base de Datos', icon: Database },
  { id: 'moderation', label: 'Moderación', icon: ShieldBan },
  { id: 'audit', label: 'Auditoría', icon: ScrollText },
  { id: 'documents', label: 'Documentos', icon: FileText },
  { id: 'forum-suggestions', label: 'Sugerencias Foro', icon: Vote },
  { id: 'referrals', label: 'Referidos', icon: Gift },
  { id: 'support', label: 'Soporte IA', icon: HeartPulse },
];

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  badges?: Record<string, number>;
}

export function AdminSidebar({ activeTab, onTabChange, collapsed, onToggleCollapse, badges = {} }: AdminSidebarProps) {
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-50 h-screen border-r border-amber-500/10 bg-[#08080d] transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo area */}
      <div className="flex items-center gap-2 px-4 h-14 border-b border-amber-500/10 shrink-0">
        <ShieldAlert className="h-6 w-6 text-amber-400 shrink-0" />
        {!collapsed && (
          <span className="text-sm font-bold tracking-widest text-amber-400 uppercase whitespace-nowrap">
            Admin
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {ADMIN_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const badgeCount = badges[tab.id];
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'group w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-amber-500/15 text-amber-400 shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              )}
              title={collapsed ? tab.label : undefined}
            >
              <tab.icon className={cn('h-4.5 w-4.5 shrink-0', isActive ? 'text-amber-400' : 'text-white/40 group-hover:text-white/70')} />
              {!collapsed && (
                <span className="truncate">{tab.label}</span>
              )}
              {!collapsed && badgeCount !== undefined && badgeCount > 0 && (
                <span className="ml-auto text-[10px] font-bold bg-amber-500/20 text-amber-400 rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                  {badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="shrink-0 border-t border-amber-500/10 p-2">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors text-xs"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /> <span>Colapsar</span></>}
        </button>
      </div>
    </aside>
  );
}
