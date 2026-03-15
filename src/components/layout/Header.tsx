import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import logoImg from '@/assets/g174-2.svg';
import { cn } from '@/lib/utils';
import {
  TrendingUp, Newspaper, Menu, BookOpen, Bell,
  BarChart3, Wallet, BarChart2 } from
'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { MainDrawer } from './MainDrawer';
import { usePrefetch } from '@/hooks/usePrefetch';
import { useNewNewsCount } from '@/hooks/useNewNewsCount';
import { useTranslation } from '@/i18n/LanguageContext';
import { NotificationToggle } from '@/components/notifications/NotificationToggle';
import { LanguageQuickSelect } from './LanguageQuickSelect';

export function Header() {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { onMouseEnter, onTouchStart } = usePrefetch();
  const { newCount: newsCount } = useNewNewsCount();
  const { t } = useTranslation();

  const navItems = [
  { icon: TrendingUp, label: t('nav_signals'), href: '/signals', badgeType: 'signals' },
  { icon: BarChart2, label: t('nav_analysis'), href: '/', badgeType: null },
  { icon: Newspaper, label: t('nav_news'), href: '/news', badgeType: 'news' },
  { icon: Wallet, label: t('nav_portfolio'), href: '/portfolio', badgeType: null },
  { icon: BarChart3, label: t('nav_stocks'), href: '/stocks', badgeType: null }];


  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-card/95 backdrop-blur-md safe-top">
        {/* Top row: compact for mobile */}
        <div className="flex items-center justify-between px-3 py-2.5">
          {/* Left: hamburger + brand */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(true)} className="text-muted-foreground h-10 w-10">
              <Menu className="w-9 h-9" />
            </Button>
            <span className="text-base font-extrabold tracking-wider hidden xs:inline">
              <span className="bg-gradient-to-r from-primary to-[hsl(200,80%,55%)] bg-clip-text text-transparent">Coins</span>
              {' '}
              <span className="bg-gradient-to-r from-accent to-destructive bg-clip-text text-transparent">Signals</span>
            </span>
          </div>

          {/* Center: logo */}
          <Link to="/" className="flex items-center" onMouseEnter={onMouseEnter('/')}>
            <img src={logoImg} alt="Coins Signals" className="h-16 w-auto" />
          </Link>

          {/* Right: placeholder for balance */}
          <div className="w-10" />
        </div>

        {/* Secondary row: quick action icons */}
        <div className="flex items-center justify-center gap-4 px-3 pb-2">
          <Link to="/tools/trading-journal" className="flex flex-col items-center gap-0.5">
            <Button variant="ghost" size="icon" className="text-foreground/80 hover:text-primary h-8 w-8">
              <BookOpen className="w-4 h-4" />
            </Button>
            <span className="text-[10px] text-muted-foreground leading-none">{t('journal')}</span>
          </Link>
          <Link to="/tools" className="flex flex-col items-center gap-0.5">
            <Button variant="ghost" size="icon" className="text-foreground/80 hover:text-primary h-8 w-8">
              <BarChart3 className="w-4 h-4" />
            </Button>
            <span className="text-[10px] text-muted-foreground leading-none">{t('nav_tools') || 'Herramientas'}</span>
          </Link>
          <div className="flex flex-col items-center gap-0.5">
            <NotificationToggle />
            <span className="text-[10px] text-muted-foreground leading-none">{t('alerts')}</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <LanguageQuickSelect />
            <span className="text-[10px] text-muted-foreground leading-none">{t('language')}</span>
          </div>
        </div>

        {/* Gradient divider */}
        <div className="h-[1px] w-full bg-gradient-to-r from-accent via-primary to-[hsl(280,60%,50%)]" />

        {/* Navigation tabs — scrollable on small screens */}
        

































        
      </header>

      <MainDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>);

}