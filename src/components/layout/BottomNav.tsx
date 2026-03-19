import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Newspaper, TrendingUp, Wallet, BarChart2, BarChart3, Brain, CandlestickChart, ShieldAlert } from 'lucide-react';
import { useNewSignalsCount } from '@/hooks/useNewSignalsCount';
import { useNewNewsCount } from '@/hooks/useNewNewsCount';
import { usePrefetch } from '@/hooks/usePrefetch';
import { useEffect } from 'react';
import { useTranslation } from '@/i18n/LanguageContext';
import { useUserRole } from '@/hooks/useUserRole';

export function BottomNav() {
  const location = useLocation();
  const { newCount: signalsCount, markAsSeen: markSignalsSeen } = useNewSignalsCount();
  const { newCount: newsCount, markAsSeen: markNewsSeen } = useNewNewsCount();
  const { onMouseEnter, onTouchStart } = usePrefetch();
  const { t } = useTranslation();
  const { isAdmin } = useUserRole();

  const navItems = [
    { icon: BarChart2, label: t('nav_analysis'), href: '/', badgeType: null },
    { icon: TrendingUp, label: t('nav_signals'), href: '/signals', badgeType: 'signals' },
    { icon: Brain, label: t('nav_ai'), href: '/ai-center', badgeType: null },
    { icon: Newspaper, label: t('nav_news'), href: '/news', badgeType: 'news' },
    { icon: CandlestickChart, label: t('nav_stocks'), href: '/stocks', badgeType: null },
    
  ];

  useEffect(() => {
    if (location.pathname === '/signals') markSignalsSeen();
    if (location.pathname === '/news') markNewsSeen();
  }, [location.pathname, markSignalsSeen, markNewsSeen]);

  const getBadgeCount = (badgeType: string | null) => {
    if (badgeType === 'signals') return signalsCount;
    if (badgeType === 'news') return newsCount;
    return 0;
  };
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-md border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-[52px]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          const badgeCount = getBadgeCount(item.badgeType);
          const showBadge = badgeCount > 0 && !isActive;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              onMouseEnter={onMouseEnter(item.href)}
              onTouchStart={onTouchStart(item.href)}
              className={cn(
                'nav-link-compact flex flex-col items-center gap-0.5 min-w-[44px] min-h-[40px] justify-center px-1.5 py-0.5 text-[9px] font-medium transition-colors relative active:scale-95',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div className="relative">
                <Icon className={cn('w-[22px] h-[22px]', isActive && 'text-primary')} />
                {showBadge && (
                  <span className="absolute -top-1 -right-1.5 min-w-[13px] h-3 px-0.5 flex items-center justify-center text-[8px] font-bold bg-destructive text-destructive-foreground rounded-full animate-pulse">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </div>
              <span className="leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
