import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Activity, Newspaper, GraduationCap, Building2, Settings } from 'lucide-react';

const navItems = [
  { icon: Activity, label: 'Señales', href: '/' },
  { icon: Newspaper, label: 'Noticias', href: '/news' },
  { icon: GraduationCap, label: 'Cursos', href: '/courses' },
  { icon: Building2, label: 'Brokers', href: '/broker' },
  { icon: Settings, label: 'Ajustes', href: '/settings' },
];

export function BottomNav() {
  const location = useLocation();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive && 'text-primary')} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
