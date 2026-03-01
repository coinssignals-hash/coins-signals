import { Link, useLocation } from 'react-router-dom';
import logoImg from '@/assets/logo.svg';
import { cn } from '@/lib/utils';
import {
  TrendingUp, Newspaper, Menu, Search, Bell,
  BarChart3, Wallet, BarChart2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { MainDrawer } from './MainDrawer';
import { usePrefetch } from '@/hooks/usePrefetch';
import { useNewNewsCount } from '@/hooks/useNewNewsCount';
import { useTranslation } from '@/i18n/LanguageContext';
import { NotificationToggle } from '@/components/notifications/NotificationToggle';

export function Header() {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { onMouseEnter, onTouchStart } = usePrefetch();
  const { newCount: newsCount } = useNewNewsCount();
  const { t } = useTranslation();

  const navItems = [
    { icon: TrendingUp, label: t('nav_signals'), href: '/signals', badgeType: 'signals' },
    { icon: BarChart2, label: t('nav_ideas'), href: '/', badgeType: null },
    { icon: Newspaper, label: t('nav_news'), href: '/news', badgeType: 'news' },
    { icon: Wallet, label: t('nav_portfolio'), href: '/portfolio', badgeType: null },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-[hsl(222,45%,7%)]">
        {/* Top row: hamburger + text logo + circular logo + icons */}
        <div className="flex items-center justify-between px-3 py-2">
          {/* Left: hamburger + "Coins Signals" text */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(true)} className="text-muted-foreground">
              <Menu className="w-7 h-7" />
            </Button>
            <span className="text-lg font-bold tracking-wide hidden xs:inline">
              <span className="text-[hsl(0,70%,40%)]">C</span>
              <span className="text-[hsl(210,80%,55%)]">o</span>
              <span className="text-[hsl(210,80%,55%)]">i</span>
              <span className="text-[hsl(210,80%,55%)]">n</span>
              <span className="text-[hsl(210,80%,55%)]">s</span>
              {' '}
              <span className="text-[hsl(0,70%,45%)]">S</span>
              <span className="text-[hsl(210,60%,50%)]">i</span>
              <span className="text-[hsl(210,60%,50%)]">g</span>
              <span className="text-[hsl(210,60%,50%)]">n</span>
              <span className="text-[hsl(210,60%,50%)]">a</span>
              <span className="text-[hsl(210,60%,50%)]">l</span>
              <span className="text-[hsl(210,60%,50%)]">s</span>
            </span>
          </div>

          {/* Center: circular logo */}
          <Link to="/" className="flex items-center" onMouseEnter={onMouseEnter('/')}>
            <img src={logoImg} alt="Coins Signals" className="h-16 w-auto" />
          </Link>

          {/* Right: search + bell + analysis icons */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Search className="w-5 h-5" />
            </Button>
            <NotificationToggle />
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <BarChart3 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Gradient divider line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-[hsl(217,91%,50%)] via-[hsl(217,91%,60%)] to-[hsl(0,70%,40%)]" />

        {/* Navigation tabs row */}
        <nav className="flex items-center justify-center gap-6 px-4 py-2.5">
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
                  'flex items-center gap-1.5 text-base font-medium transition-colors relative',
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <span>{item.label}</span>
                {showBadge && (
                  <span className="absolute -top-1 -right-3 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full animate-pulse">
                    {newsCount > 99 ? '99+' : newsCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </header>

      <MainDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  );
}
