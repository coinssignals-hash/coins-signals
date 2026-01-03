import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, Newspaper, Brain, Menu, Search, Bell, 
  ChevronDown, GraduationCap, Building2, BarChart3, 
  Gift, MessageCircle, Info, Wallet 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect } from 'react';
import { MainDrawer } from './MainDrawer';
import { usePrefetch } from '@/hooks/usePrefetch';
import { useNewNewsCount } from '@/hooks/useNewNewsCount';

const navItems = [
  { icon: Brain, label: 'Ideas', href: '/', badgeType: null },
  { icon: Wallet, label: 'Portfolio', href: '/portfolio', badgeType: null },
  { icon: Newspaper, label: 'Noticias', href: '/news', badgeType: 'news' },
  { icon: TrendingUp, label: 'Señales', href: '/signals', badgeType: 'signals' },
];

const moreNavItems = [
  { icon: GraduationCap, label: 'Cursos', href: '/courses' },
  { icon: Building2, label: 'Brokers', href: '/broker' },
  { icon: BarChart3, label: 'Rendimientos', href: '/performance' },
  { icon: Gift, label: 'Referidos', href: '/referrals' },
  { icon: MessageCircle, label: 'Soporte', href: '/support' },
  { icon: Info, label: 'Sobre Nosotros', href: '/about' },
];

export function Header() {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const { onMouseEnter, onTouchStart } = usePrefetch();
  const { newCount: newsCount } = useNewNewsCount();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setMoreMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setMoreMenuOpen(false);
  }, [location.pathname]);
  
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

            {/* More Dropdown */}
            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  moreMenuOpen
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                Más
                <ChevronDown className={cn(
                  'w-4 h-4 transition-transform duration-300 ease-out',
                  moreMenuOpen && 'rotate-180'
                )} />
              </button>

              {/* Dropdown Menu */}
              <div 
                className={cn(
                  'absolute top-full right-0 mt-2 w-56 z-50 bg-popover border border-border rounded-xl shadow-xl overflow-hidden',
                  'transition-all duration-200 ease-out origin-top-right',
                  moreMenuOpen 
                    ? 'opacity-100 scale-100 translate-y-0' 
                    : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                )}
              >
                <div className="py-2">
                  {moreNavItems.map((item, index) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href;
                    
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onMouseEnter={onMouseEnter(item.href)}
                        onClick={() => setMoreMenuOpen(false)}
                        className={cn(
                          'group flex items-center gap-3 px-4 py-2.5 text-sm font-medium',
                          'transition-all duration-150 ease-out',
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-foreground hover:bg-secondary hover:pl-5'
                        )}
                        style={{ 
                          transitionDelay: moreMenuOpen ? `${index * 30}ms` : '0ms' 
                        }}
                      >
                        <Icon className={cn(
                          'w-4 h-4 transition-transform duration-200',
                          'group-hover:scale-110'
                        )} />
                        <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
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
