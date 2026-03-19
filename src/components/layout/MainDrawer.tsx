import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { isLegendaryAvatar, LEGENDARY_RING_CLASS } from '@/lib/legendaryAvatar';
import { usePrefetch } from '@/hooks/usePrefetch';
import { useNewNewsCount } from '@/hooks/useNewNewsCount';
import { useNewsCache } from '@/hooks/useNewsCache';
import { useTranslation } from '@/i18n/LanguageContext';
import {
  User as UserIcon, FileText, Gift, Link2, Shield, BookOpen,
  TrendingUp, BarChart3, MessageCircle, Info, LogOut, LogIn,
  Bell, Palette, Globe, Cloud, Download, Brain, Newspaper, Archive, Wallet, ShieldAlert
} from 'lucide-react';
import { LanguageQuickSelect } from './LanguageQuickSelect';
import { Sheet, SheetContent, SheetHeader } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface MainDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MainDrawer({ open, onOpenChange }: MainDrawerProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { onMouseEnter, onTouchStart } = usePrefetch();
  const { newCount: newsCount } = useNewNewsCount();
  const { getAllCachedNews } = useNewsCache();
  const savedNewsCount = getAllCachedNews().length;
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const { t, language } = useTranslation();
  const drawerSide = language === 'ar' ? 'right' : 'left';
  

  const menuSections = [
    {
      title: t('drawer_cat_trading'),
      items: [
        { icon: Brain, label: t('drawer_ai_center'), href: '/ai-center' },
        { icon: TrendingUp, label: t('drawer_earnings'), href: '/performance' },
        { icon: Wallet, label: t('nav_portfolio'), href: '/portfolio' },
        { icon: BarChart3, label: t('drawer_stock_market'), href: '/stocks' },
      ],
    },
    {
      title: t('drawer_cat_broker'),
      items: [
        { icon: Link2, label: t('drawer_link_broker'), href: '/link-broker' },
        { icon: BarChart3, label: t('drawer_broker_score'), href: '/broker-rating' },
      ],
    },
    {
      title: t('drawer_cat_learn'),
      items: [
        { icon: BookOpen, label: t('drawer_courses_tutorials'), href: '/courses' },
        { icon: MessageCircle, label: t('drawer_community'), href: '/forum' },
      ],
    },
    {
      title: t('drawer_cat_account'),
      items: [
        { icon: UserIcon, label: t('drawer_profile_settings'), href: '/settings' },
        { icon: FileText, label: t('drawer_subscriptions'), href: '/subscriptions' },
        { icon: Shield, label: t('drawer_security'), href: '/settings/security' },
        { icon: Gift, label: t('drawer_referral_bonus'), href: '/referrals' },
      ],
    },
    {
      title: t('drawer_preferences'),
      items: [
        { icon: Bell, label: t('drawer_notifications'), href: '/settings/notifications' },
        { icon: Palette, label: t('drawer_appearance'), href: '/settings/appearance' },
        { icon: Download, label: t('drawer_install_app'), href: '/install' },
      ],
    },
    {
      title: t('drawer_cat_help'),
      items: [
        { icon: MessageCircle, label: t('drawer_contact_support'), href: '/support' },
        { icon: Info, label: t('drawer_about_us'), href: '/about' },
      ],
    },
  ];

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: t('drawer_session_closed'), description: t('drawer_session_closed_desc') });
    onOpenChange(false);
    navigate('/');
  };

  const getInitials = () => {
    if (!user?.email) return 'U';
    return user.email.substring(0, 2).toUpperCase();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={drawerSide} className="w-80 p-0 bg-background border-border">
        <SheetHeader className="p-6 pb-4">
          {user ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-16 w-16 border-2 border-primary">
                <AvatarImage src="/placeholder.svg" alt="Usuario" />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <h2 className="text-lg font-bold text-foreground">{t('drawer_welcome')}</h2>
                <p className="text-sm font-medium text-primary truncate max-w-[150px]">
                  {user.email}
                </p>
                <Badge variant="outline" className="mt-1 border-primary text-primary flex items-center gap-1">
                  <Cloud className="w-3 h-3" />
                  {t('drawer_synced')}
                </Badge>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <h2 className="text-lg font-bold text-foreground">{t('drawer_welcome')}</h2>
                <p className="text-sm text-muted-foreground">{t('drawer_login_sync')}</p>
              </div>
              <Button onClick={() => { onOpenChange(false); navigate('/auth'); }} className="w-full bg-primary">
                <LogIn className="w-4 h-4 mr-2" />
                {t('drawer_login')}
              </Button>
            </div>
          )}
        </SheetHeader>

        <div className="flex items-center justify-between px-6 py-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('drawer_language_tz')}</span>
          <LanguageQuickSelect />
        </div>

        <Separator className="bg-border" />

        <nav className="flex flex-col p-4 gap-1 max-h-[calc(100vh-300px)] overflow-y-auto">
          {menuSections.map((section, sIdx) => (
            <div key={section.title}>
              {sIdx > 0 && <Separator className="my-2 bg-border" />}
              <p className="px-4 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {section.title}
              </p>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                const showNewsBadge = item.href === '/news' && newsCount > 0 && !isActive;
                const showSavedBadge = item.href === '/news/saved' && savedNewsCount > 0;

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => onOpenChange(false)}
                    onMouseEnter={onMouseEnter(item.href)}
                    onTouchStart={onTouchStart(item.href)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                      isActive
                        ? 'bg-primary/10 text-primary border-l-4 border-primary'
                        : 'text-foreground hover:bg-secondary'
                    )}
                  >
                    <div className="relative">
                      <Icon className="w-5 h-5" />
                      {showNewsBadge && (
                        <span className="absolute -top-1 -right-1.5 min-w-[14px] h-3.5 px-1 flex items-center justify-center text-[9px] font-bold bg-destructive text-destructive-foreground rounded-full">
                          {newsCount > 99 ? '99+' : newsCount}
                        </span>
                      )}
                      {showSavedBadge && (
                        <span className="absolute -top-1 -right-1.5 min-w-[14px] h-3.5 px-1 flex items-center justify-center text-[9px] font-bold bg-primary text-primary-foreground rounded-full">
                          {savedNewsCount > 99 ? '99+' : savedNewsCount}
                        </span>
                      )}
                    </div>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-background">
          {user ? (
            <button
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
              {t('drawer_logout')}
            </button>
          ) : (
            <button
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
              onClick={() => { onOpenChange(false); navigate('/auth'); }}
            >
              <LogIn className="w-5 h-5" />
              {t('drawer_login')}
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
