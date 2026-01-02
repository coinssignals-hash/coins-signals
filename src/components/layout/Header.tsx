import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { TrendingUp, Newspaper, Star, BarChart3, Menu, Search, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { MainDrawer } from './MainDrawer';
import { usePrefetch } from '@/hooks/usePrefetch';

const navItems = [
  { icon: BarChart3, label: 'Markets', href: '/markets' },
  { icon: Newspaper, label: 'News', href: '/' },
  { icon: TrendingUp, label: 'Ideas', href: '/ideas' },
  { icon: Star, label: 'Watchlist', href: '/watchlist' },
];

export function Header() {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { onMouseEnter, onTouchStart } = usePrefetch();
  
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
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onMouseEnter={onMouseEnter(item.href)}
                  onTouchStart={onTouchStart(item.href)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  )}
                >
                  <Icon className="w-4 h-4" />
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
