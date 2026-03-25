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
  User as UserIcon, FileText, Gift, Link2, Shield, BookOpen, Trophy,
  TrendingUp, BarChart3, MessageCircle, Info, LogOut, LogIn,
  Bell, BellOff, Palette, Globe, Cloud, Download, Brain, Newspaper, Archive, Wallet, ShieldAlert, RefreshCw, Route, Gamepad2, CandlestickChart, Target, LineChart, HeartPulse, Blocks, BellRing, GraduationCap, Crown, Copy, Medal
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
  const [profile, setProfile] = useState<{ alias: string | null; avatar_url: string | null; signal_alerts_enabled?: boolean | null } | null>(null);
  const { t, language } = useTranslation();
  const drawerSide = language === 'ar' ? 'right' : 'left';

  const menuSections = [
    {
      title: t('drawer_cat_trading'),
      color: '160 84% 39%',
      items: [
        { icon: Brain, label: t('drawer_ai_center'), href: '/ai-center' },
        { icon: TrendingUp, label: t('drawer_earnings'), href: '/performance' },
        { icon: Wallet, label: t('nav_portfolio'), href: '/portfolio' },
        { icon: BarChart3, label: t('drawer_stock_market'), href: '/stocks' },
      ],
    },
    {
      title: t('drawer_cat_broker'),
      color: '38 92% 50%',
      items: [
        { icon: Link2, label: t('drawer_link_broker'), href: '/link-broker' },
        { icon: BarChart3, label: t('drawer_broker_score'), href: '/broker-rating' },
      ],
    },
    {
      title: t('drawer_cat_training') || 'Entrenamiento',
      color: '142 70% 45%',
      items: [
        { icon: Gamepad2, label: t('drawer_paper_trading') || 'Paper Trading', href: '/tools/paper-trading' },
        { icon: CandlestickChart, label: t('drawer_candle_replay') || 'Candle Replay', href: '/tools/candle-replay' },
        { icon: Target, label: t('drawer_daily_challenges') || 'Retos Diarios', href: '/tools/daily-challenges' },
        
      ],
    },
    {
      title: t('drawer_cat_strategy') || 'Estrategias & IA',
      color: '280 80% 55%',
      items: [
        { icon: Blocks, label: t('drawer_strategy_builder') || 'Constructor de Estrategias', href: '/tools/strategy-builder' },
        { icon: BellRing, label: t('drawer_smart_alerts') || 'Alertas Inteligentes', href: '/tools/smart-alerts' },
        { icon: GraduationCap, label: t('drawer_ai_coach') || 'Coach IA', href: '/tools/ai-coach' },
      ],
    },
    {
      title: t('drawer_cat_social') || 'Social & Competencias',
      color: '30 90% 50%',
      items: [
        { icon: Crown, label: t('drawer_leaderboard') || 'Leaderboard', href: '/leaderboard' },
        { icon: Copy, label: t('drawer_copy_trading') || 'Copy Trading', href: '/copy-trading' },
        { icon: Medal, label: t('drawer_competitions') || 'Competencias', href: '/competitions' },
      ],
    },
    {
      title: t('drawer_cat_learn'),
      color: '217 91% 60%',
      items: [
        { icon: BookOpen, label: t('drawer_courses_tutorials'), href: '/courses' },
        { icon: Route, label: t('drawer_learning_paths') || 'Rutas de Aprendizaje', href: '/learning-paths' },
        { icon: BookOpen, label: t('drawer_glossary') || 'Glosario', href: '/glossary' },
        { icon: Trophy, label: t('drawer_certifications') || 'Certificaciones', href: '/certifications' },
        { icon: MessageCircle, label: t('drawer_community'), href: '/forum' },
      ],
    },
    {
      title: t('drawer_cat_account'),
      color: '280 70% 55%',
      items: [
        { icon: UserIcon, label: t('drawer_profile_settings'), href: '/settings' },
        { icon: Trophy, label: 'Logros', href: '/achievements' },
        { icon: FileText, label: t('drawer_subscriptions'), href: '/subscriptions' },
        { icon: Shield, label: t('drawer_security'), href: '/settings/security' },
        { icon: Gift, label: t('drawer_referral_bonus'), href: '/referrals' },
      ],
    },
    {
      title: t('drawer_preferences'),
      color: '200 80% 55%',
      items: [
        { icon: Bell, label: t('drawer_notifications'), href: '/settings/notifications' },
        { icon: Palette, label: t('drawer_appearance'), href: '/settings/appearance' },
        { icon: Download, label: t('drawer_install_app'), href: '/install' },
        { icon: RefreshCw, label: t('drawer_update_app') || 'Actualizar App', href: '#update-app' },
      ],
    },
    {
      title: t('drawer_cat_help'),
      color: '0 72% 51%',
      items: [
        { icon: MessageCircle, label: t('drawer_contact_support'), href: '/support' },
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

  useEffect(() => {
    if (!user?.id || !open) return;
    supabase
      .from('profiles')
      .select('alias, avatar_url, signal_alerts_enabled')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data);
      });
  }, [user?.id, open]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: t('drawer_session_closed'), description: t('drawer_session_closed_desc') });
    onOpenChange(false);
    navigate('/');
  };

  const handleForceUpdate = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(r => r.unregister()));
      }
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      toast({ title: t('drawer_update_success') || '✅ App actualizada', description: t('drawer_update_success_desc') || 'Caché limpiada. Recargando...' });
      onOpenChange(false);
      setTimeout(() => window.location.reload(), 800);
    } catch {
      window.location.reload();
    }
  };

  const getInitials = () => {
    if (!user?.email) return 'U';
    return user.email.substring(0, 2).toUpperCase();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={drawerSide}
        className="w-80 p-0 border-r border-white/[0.06] bg-[#08080d] overflow-hidden flex flex-col"
      >
        {/* ── Header with glow line ── */}
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
          <SheetHeader className="p-5 pb-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className={cn(
                    "h-14 w-14 border-2 border-amber-500/30 ring-2 ring-amber-500/10",
                    profile?.avatar_url && isLegendaryAvatar(profile.avatar_url) && LEGENDARY_RING_CLASS
                  )}>
                    <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.alias || 'Avatar'} />
                    <AvatarFallback className="bg-amber-500/10 text-amber-400 text-lg font-bold">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  {profile?.avatar_url && isLegendaryAvatar(profile.avatar_url) && (
                    <span className="absolute -bottom-0.5 -right-0.5 text-sm">👑</span>
                  )}
                </div>
                <div className="flex flex-col items-start min-w-0">
                  <h2 className="text-base font-bold text-white truncate max-w-[160px]">
                    {profile?.alias || t('drawer_welcome')}
                  </h2>
                  <p className="text-[11px] text-white/30 truncate max-w-[160px] font-mono">
                    {user.email}
                  </p>
                  <Badge className="mt-1.5 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] px-2 py-0 h-5 flex items-center gap-1">
                    <Cloud className="w-3 h-3" />
                    {t('drawer_synced')}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-2">
                <div className="w-14 h-14 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                  <UserIcon className="w-7 h-7 text-white/30" />
                </div>
                <div className="text-center">
                  <h2 className="text-base font-bold text-white">{t('drawer_welcome')}</h2>
                  <p className="text-xs text-white/30 mt-0.5">{t('drawer_login_sync')}</p>
                </div>
                <Button
                  onClick={() => { onOpenChange(false); navigate('/auth'); }}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold h-9 text-sm"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  {t('drawer_login')}
                </Button>
              </div>
            )}
          </SheetHeader>
        </div>

        {/* ── Language & notifications strip ── */}
        <div className="flex items-center justify-between px-5 py-2 bg-white/[0.02] border-y border-white/[0.04]">
          <span className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">{t('drawer_language_tz')}</span>
          <div className="flex items-center gap-1">
            {user && (
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-7 w-7 rounded-md", profile?.signal_alerts_enabled ? 'text-amber-400 bg-amber-500/10' : 'text-white/25 hover:text-white/40')}
                onClick={async () => {
                  const newVal = !profile?.signal_alerts_enabled;
                  await supabase.from('profiles').update({ signal_alerts_enabled: newVal }).eq('id', user.id);
                  setProfile(prev => prev ? { ...prev, signal_alerts_enabled: newVal } : prev);
                  toast({ title: newVal ? t('drawer_notifications') + ' ON' : t('drawer_notifications') + ' OFF' });
                }}
              >
                {profile?.signal_alerts_enabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
              </Button>
            )}
            <LanguageQuickSelect />
          </div>
        </div>

        {/* ── Scrollable nav ── */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-hide pb-20">
          {menuSections.map((section, sIdx) => (
            <div key={section.title}>
              {sIdx > 0 && <div className="h-px mx-3 my-2 bg-white/[0.04]" />}
              <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: `hsl(${section.color} / 0.6)` }}>
                {section.title}
              </p>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                const showNewsBadge = item.href === '/news' && newsCount > 0 && !isActive;
                const showSavedBadge = item.href === '/news/saved' && savedNewsCount > 0;

                  return item.href === '#update-app' ? (
                    <button
                      key={item.href}
                      onClick={() => { onOpenChange(false); handleForceUpdate(); }}
                      className={cn(
                        'group flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all relative w-full text-left',
                        'text-white/50 hover:text-white/80 hover:bg-white/[0.03]'
                      )}
                    >
                      <div className="relative flex items-center justify-center w-5">
                        <Icon className="w-[18px] h-[18px] transition-colors group-hover:text-white/60" />
                      </div>
                      {item.label}
                    </button>
                  ) : (
                    <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => onOpenChange(false)}
                    onMouseEnter={onMouseEnter(item.href)}
                    onTouchStart={onTouchStart(item.href)}
                    className={cn(
                      'group flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all relative',
                      isActive
                        ? 'text-white'
                        : 'text-white/50 hover:text-white/80 hover:bg-white/[0.03]'
                    )}
                    style={isActive ? {
                      background: `linear-gradient(135deg, hsl(${section.color} / 0.12), hsl(${section.color} / 0.04))`,
                      borderLeft: `3px solid hsl(${section.color})`,
                    } : undefined}
                  >
                    <div className="relative flex items-center justify-center w-5">
                      <Icon className={cn(
                        "w-[18px] h-[18px] transition-colors",
                        isActive ? '' : 'group-hover:text-white/60'
                      )} style={isActive ? { color: `hsl(${section.color})` } : undefined} />
                      {showNewsBadge && (
                        <span className="absolute -top-1 -right-1.5 min-w-[14px] h-3.5 px-1 flex items-center justify-center text-[9px] font-bold bg-red-500 text-white rounded-full">
                          {newsCount > 99 ? '99+' : newsCount}
                        </span>
                      )}
                      {showSavedBadge && (
                        <span className="absolute -top-1 -right-1.5 min-w-[14px] h-3.5 px-1 flex items-center justify-center text-[9px] font-bold bg-amber-500 text-black rounded-full">
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

        {/* ── Bottom action ── */}
        <div className="shrink-0 border-t border-white/[0.06] bg-[#08080d] p-3">
          {user ? (
            <button
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              {t('drawer_logout')}
            </button>
          ) : (
            <button
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-amber-400 hover:bg-amber-500/10 transition-colors"
              onClick={() => { onOpenChange(false); navigate('/auth'); }}
            >
              <LogIn className="w-4 h-4" />
              {t('drawer_login')}
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
