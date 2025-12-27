import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { TrendingUp, Newspaper, Star, BarChart3, MoreHorizontal } from 'lucide-react';

const navItems = [
  { icon: BarChart3, label: 'Markets', href: '/markets' },
  { icon: Newspaper, label: 'News', href: '/' },
  { icon: TrendingUp, label: 'Ideas', href: '/ideas' },
  { icon: Star, label: 'Watchlist', href: '/watchlist' },
  { icon: MoreHorizontal, label: 'More', href: '/more' },
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
