import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Newspaper, Settings, TrendingUp, Wallet, BarChart2, Brain } from 'lucide-react';
import { useNewSignalsCount } from '@/hooks/useNewSignalsCount';
import { useNewNewsCount } from '@/hooks/useNewNewsCount';
import { usePrefetch } from '@/hooks/usePrefetch';
import { useEffect } from 'react';
import { useTranslation } from '@/i18n/LanguageContext';

export function BottomNav() {
  const location = useLocation();
  const { newCount: signalsCount, markAsSeen: markSignalsSeen } = useNewSignalsCount();
  const { newCount: newsCount, markAsSeen: markNewsSeen } = useNewNewsCount();
  const { onMouseEnter, onTouchStart } = usePrefetch();
  const { t } = useTranslation();

  const navItems = [
    { icon: BarChart2, label: t('nav_ideas'), href: '/', badgeType: null },
    { icon: TrendingUp, label: t('nav_signals'), href: '/signals', badgeType: 'signals' },
    { icon: Brain, label: 'IA', href: '/ai-center', badgeType: null },
    { icon: Newspaper, label: t('nav_news'), href: '/news', badgeType: 'news' },
    { icon: Settings, label: t('nav_settings'), href: '/settings', badgeType: null },
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[hsl(222,45%,7%)]/95 backdrop-blur-sm border-t border-primary/20">
      <div className="flex items-center justify-around h-16">
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
                'flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium transition-colors relative',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div className="relative">
                <Icon className={cn('w-5 h-5', isActive && 'text-primary')} />
                {showBadge && (
                  <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full animate-pulse">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
