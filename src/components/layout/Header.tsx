import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
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
            <span className="text-xl font-extrabold tracking-wider hidden xs:inline" style={{ textShadow: '0 0 12px hsl(217 91% 60% / 0.4)' }}>
              <span className="bg-gradient-to-r from-[hsl(217,91%,65%)] to-[hsl(200,80%,55%)] bg-clip-text text-transparent">Coins</span>
              {' '}
              <span className="bg-gradient-to-r from-[hsl(38,95%,55%)] to-[hsl(0,70%,50%)] bg-clip-text text-transparent">Signals</span>
            </span>
          </div>

          {/* Center: circular logo — bigger */}
          <Link to="/" className="flex items-center" onMouseEnter={onMouseEnter('/')}>
            <img src={logoImg} alt="Coins Signals" className="h-20 w-auto" />
          </Link>

          {/* Right: search + bell + analysis icons — brighter */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="text-foreground/80 hover:text-primary">
              <Search className="w-5 h-5" />
            </Button>
            <NotificationToggle />
            <Button variant="ghost" size="icon" className="text-foreground/80 hover:text-primary">
              <BarChart3 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Gradient divider line — gold to blue */}
        <div className="h-[2px] w-full bg-gradient-to-r from-[hsl(38,95%,50%)] via-[hsl(217,91%,60%)] to-[hsl(280,60%,50%)]" />

        {/* Navigation tabs row — bigger text */}
        <nav className="flex items-center justify-center gap-2 px-3 py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            const showBadge = item.badgeType === 'news' && newsCount > 0 && !isActive;

            return (
              <Link
                key={item.href}
                to={item.href}
                onMouseEnter={onMouseEnter(item.href)}
                onTouchStart={onTouchStart(item.href)}
                className={cn(
                  'relative px-4 py-1.5 text-base font-semibold rounded-full transition-colors',
                  isActive
                    ? 'text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-full bg-primary shadow-[0_0_14px_hsl(217_91%_60%/0.5)]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
                {showBadge && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full animate-pulse z-20">
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
