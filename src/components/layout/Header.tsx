import { Link, useLocation } from 'react-router-dom';
import logoImg from '@/assets/logo.svg';
import { cn } from '@/lib/utils';
import {
  TrendingUp, Newspaper, Menu, Search, Bell,
  ChevronDown, GraduationCap, Building2, BarChart3,
  Gift, MessageCircle, Info, Wallet, BarChart2 } from
'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect } from 'react';
import { MainDrawer } from './MainDrawer';
import { usePrefetch } from '@/hooks/usePrefetch';
import { useNewNewsCount } from '@/hooks/useNewNewsCount';
import { useTranslation } from '@/i18n/LanguageContext';

export function Header() {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const { onMouseEnter, onTouchStart } = usePrefetch();
  const { newCount: newsCount } = useNewNewsCount();
  const { t } = useTranslation();

  const navItems = [
  { icon: BarChart2, label: t('nav_ideas'), href: '/', badgeType: null },
  { icon: Wallet, label: t('nav_portfolio'), href: '/portfolio', badgeType: null },
  { icon: Newspaper, label: t('nav_news'), href: '/news', badgeType: 'news' },
  { icon: TrendingUp, label: t('nav_signals'), href: '/signals', badgeType: 'signals' }];


  const moreNavItems = [
  { icon: GraduationCap, label: t('nav_courses'), href: '/courses' },
  { icon: Building2, label: t('nav_brokers'), href: '/broker' },
  { icon: BarChart3, label: t('nav_performance'), href: '/performance' },
  { icon: Gift, label: t('nav_referrals'), href: '/referrals' },
  { icon: MessageCircle, label: t('nav_support'), href: '/support' },
  { icon: Info, label: t('nav_about'), href: '/about' }];


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
      <header className="sticky top-0 z-50 w-full border-b border-primary/20 bg-[hsl(222,45%,7%)]/95 backdrop-blur-sm">
        <div className="container flex h-14 items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>

          <Link to="/" className="flex items-center" onMouseEnter={onMouseEnter('/')}>
            <img src={logoImg} alt="Coins Signals" className="h-20 w-auto" />
          </Link>
          
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
                    'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {showBadge && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full animate-pulse">
                      {newsCount > 99 ? '99+' : newsCount}
                    </span>
                  )}
                </Link>
              );
            })}

          </nav>
          
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
    </>);

}