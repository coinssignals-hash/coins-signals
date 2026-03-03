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
    { icon: BarChart3, label: 'Acciones', href: '/stocks', badgeType: null },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-card/95 backdrop-blur-md safe-top">
        {/* Top row: compact for mobile */}
        <div className="flex items-center justify-between px-2 py-1.5">
          {/* Left: hamburger + brand */}
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(true)} className="text-muted-foreground h-9 w-9">
              <Menu className="w-5 h-5" />
            </Button>
            <span className="text-sm font-extrabold tracking-wider hidden xs:inline">
              <span className="bg-gradient-to-r from-primary to-[hsl(200,80%,55%)] bg-clip-text text-transparent">Coins</span>
              {' '}
              <span className="bg-gradient-to-r from-accent to-destructive bg-clip-text text-transparent">Signals</span>
            </span>
          </div>

          {/* Center: logo — sized for mobile */}
          <Link to="/" className="flex items-center" onMouseEnter={onMouseEnter('/')}>
            <img src={logoImg} alt="Coins Signals" className="h-12 w-auto" />
          </Link>

          {/* Right: compact icons */}
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="text-foreground/80 hover:text-primary h-9 w-9">
              <Search className="w-4 h-4" />
            </Button>
            <NotificationToggle />
            <Button variant="ghost" size="icon" className="text-foreground/80 hover:text-primary h-9 w-9">
              <BarChart3 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Gradient divider */}
        <div className="h-[1.5px] w-full bg-gradient-to-r from-accent via-primary to-[hsl(280,60%,50%)]" />

        {/* Navigation tabs — scrollable on small screens */}
        <nav className="flex items-center overflow-x-auto scrollbar-hide gap-1 px-2 py-1.5">
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
                  'relative px-3 py-1.5 text-xs font-semibold rounded-full transition-colors whitespace-nowrap flex-shrink-0 active:scale-95',
                  isActive
                    ? 'text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-full bg-primary shadow-[0_0_10px_hsl(217_91%_60%/0.4)]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
                {showBadge && (
                  <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-0.5 flex items-center justify-center text-[9px] font-bold bg-destructive text-destructive-foreground rounded-full animate-pulse z-20">
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
