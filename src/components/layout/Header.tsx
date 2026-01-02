import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { TrendingUp, Newspaper, Brain, Menu, Search, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { MainDrawer } from './MainDrawer';
import { usePrefetch } from '@/hooks/usePrefetch';
import { useNewNewsCount } from '@/hooks/useNewNewsCount';

const navItems = [
  { icon: Brain, label: 'Ideas', href: '/', badgeType: null },
  { icon: Newspaper, label: 'Noticias', href: '/news', badgeType: 'news' },
  { icon: TrendingUp, label: 'Señales', href: '/signals', badgeType: 'signals' },
];

export function Header() {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { onMouseEnter, onTouchStart } = usePrefetch();
  const { newCount: newsCount } = useNewNewsCount();
  
  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          {/* Menu Button */}
          <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>

          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-1"
            onMouseEnter={onMouseEnter('/')}
          >
            <span className="text-xl font-bold text-primary">Coins</span>
            <span className="text-xl font-bold text-accent">$ignals</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              const showBadge = item.badgeType === 'news' && newsCount > 0 && !isActive;
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onMouseEnter={onMouseEnter(item.href)}
                  onTouchStart={onTouchStart(item.href)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors relative',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  )}
                >
                  <div className="relative">
                    <Icon className="w-4 h-4" />
                    {showBadge && (
                      <span className="absolute -top-1 -right-1.5 min-w-[14px] h-3.5 px-0.5 flex items-center justify-center text-[9px] font-bold bg-destructive text-destructive-foreground rounded-full">
                        {newsCount > 99 ? '99+' : newsCount}
                      </span>
                    )}
                  </div>
                  {item.label}
                </Link>
              );
            })}
          </nav>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Search className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <MainDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  );
}
