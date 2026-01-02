import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Newspaper, GraduationCap, Building2, Settings, Brain, TrendingUp } from 'lucide-react';
import { useNewSignalsCount } from '@/hooks/useNewSignalsCount';
import { usePrefetch } from '@/hooks/usePrefetch';
import { useEffect } from 'react';

const navItems = [
  { icon: Brain, label: 'Markets', href: '/' },
  { icon: TrendingUp, label: 'Señales', href: '/signals', showBadge: true },
  { icon: Newspaper, label: 'Noticias', href: '/news' },
  { icon: GraduationCap, label: 'Cursos', href: '/courses' },
  { icon: Building2, label: 'Brokers', href: '/broker' },
  { icon: Settings, label: 'Ajustes', href: '/settings' },
];

export function BottomNav() {
  const location = useLocation();
  const { newCount, markAsSeen } = useNewSignalsCount();
  const { onMouseEnter, onTouchStart } = usePrefetch();

  // Mark signals as seen when visiting the signals page
  useEffect(() => {
    if (location.pathname === '/signals') {
      markAsSeen();
    }
  }, [location.pathname, markAsSeen]);
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          const showBadge = item.showBadge && newCount > 0 && !isActive;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              onMouseEnter={onMouseEnter(item.href)}
              onTouchStart={onTouchStart(item.href)}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium transition-colors relative',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <div className="relative">
                <Icon className={cn('w-5 h-5', isActive && 'text-primary')} />
                {showBadge && (
                  <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full animate-pulse">
                    {newCount > 99 ? '99+' : newCount}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
