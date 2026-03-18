import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import logoImg from '@/assets/g174-2.svg';
import { cn } from '@/lib/utils';
import {
  TrendingUp, Newspaper, Menu, BookOpen, Bell,
  BarChart3, Wallet, BarChart2, Clock, Users, Briefcase } from
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
            <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(true)} className="text-foreground h-12 w-12">
              <Menu className="w-8 h-8" strokeWidth={2.5} />
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

          {/* Right: Community + Portfolio icons */}
          <div className="flex items-center gap-1">
            <Link to="/forum" className="p-2 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors active:scale-95" onMouseEnter={onMouseEnter('/forum')}>
              <Users className="w-5 h-5 text-primary" />
            </Link>
            <Link to="/portfolio" className="p-2 rounded-xl bg-accent/10 hover:bg-accent/20 transition-colors active:scale-95" onMouseEnter={onMouseEnter('/portfolio')}>
              <Briefcase className="w-5 h-5 text-accent" />
            </Link>
          </div>
        </div>

        {/* Gradient divider */}
        <div className="h-[1px] w-full bg-gradient-to-r from-accent via-primary to-[hsl(280,60%,50%)]" />

        {/* Secondary row: quick action icons — evenly distributed */}
        <div className="grid grid-cols-5 gap-2 w-full px-3 py-2">
          <Link to="/tools/trading-journal" className="flex flex-col items-center gap-1 active:scale-95 transition-all">
            <div className="flex items-center justify-center h-8 w-full rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
              <BookOpen className="w-[18px] h-[18px]" />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground leading-none">{t('journal')}</span>
          </Link>
          <Link to="/tools" className="flex flex-col items-center gap-1 active:scale-95 transition-all">
            <div className="flex items-center justify-center h-8 w-full rounded-xl bg-accent/10 text-accent hover:bg-accent/20 transition-colors">
              <BarChart3 className="w-[18px] h-[18px]" />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground leading-none">{t('nav_tools') || 'Herramientas'}</span>
          </Link>
          <Link to="/tools/market-sessions" className="flex flex-col items-center gap-1 active:scale-95 transition-all">
            <div className="flex items-center justify-center h-8 w-full rounded-xl bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors">
              <Clock className="w-[18px] h-[18px]" />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground leading-none">Sessions</span>
          </Link>
          <div className="flex flex-col items-center gap-1 active:scale-95 transition-all">
            <div className="flex items-center justify-center h-8 w-full rounded-xl bg-green-500/10 hover:bg-green-500/20 transition-colors">
              <NotificationToggle />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground leading-none">{t('alerts')}</span>
          </div>
          <div className="flex flex-col items-center gap-1 active:scale-95 transition-all">
            <div className="flex items-center justify-center h-8 w-full rounded-xl bg-secondary/50 text-foreground/80 hover:bg-secondary transition-colors">
              <LanguageQuickSelect />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground leading-none">{t('language')}</span>
          </div>
        </div>

        {/* Navigation tabs — scrollable on small screens */}
        <div className="flex items-center gap-1 px-3 py-2 overflow-x-auto scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            const badgeCount = item.badgeType === 'news' ? newsCount : 0;
            const showBadge = item.badgeType === 'news' && badgeCount > 0 && !isActive;

            return (
              <Link
                key={item.href}
                to={item.href}
                onMouseEnter={onMouseEnter(item.href)}
                onTouchStart={onTouchStart(item.href)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
                {showBadge && (
                  <span className="min-w-[16px] h-4 px-1 flex items-center justify-center text-[9px] font-bold bg-destructive text-destructive-foreground rounded-full">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

      </header>

      <MainDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>);

}