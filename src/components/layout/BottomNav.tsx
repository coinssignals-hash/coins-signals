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
    { icon: BarChart3, label: t('nav_tools') || 'Tools', href: '/tools', badgeType: null },
    
    
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-[56px]">
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
                'nav-link-compact flex flex-col items-center gap-0.5 min-w-[48px] min-h-[44px] justify-center px-2 py-1 text-[9px] font-medium transition-all duration-300 relative active:scale-90',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {/* Active indicator pill */}
              {isActive && (
                <span className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full bg-primary shadow-[0_0_8px_2px_hsl(var(--primary)/0.6)]" />
              )}
              <div className={cn(
                'relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300',
                isActive && 'bg-primary/15 shadow-[0_0_12px_2px_hsl(var(--primary)/0.2)]'
              )}>
                <Icon className={cn(
                  'w-[20px] h-[20px] transition-all duration-300',
                  isActive && 'text-primary drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)] scale-110'
                )} />
                {showBadge && (
                  <span className="absolute -top-1 -right-1.5 min-w-[13px] h-3 px-0.5 flex items-center justify-center text-[8px] font-bold bg-destructive text-destructive-foreground rounded-full animate-pulse">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </div>
              <span className={cn(
                'leading-none transition-all duration-300',
                isActive && 'font-semibold text-primary'
              )}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
