import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GlowCard } from '@/components/ui/glow-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Gift, Copy, Users, DollarSign, Share2, ArrowLeft,
  Trophy, Clock, CheckCircle2, CalendarPlus, Sparkles, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useReferrals } from '@/hooks/useReferrals';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/i18n/LanguageContext';


export default function Referrals() {
  const { isAuthenticated } = useAuth();
  const { code, stats, loading, referralLink, refresh } = useReferrals();
  const { t } = useTranslation();

  const copyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    toast.success(t('ref_link_copied'));
  };

  const shareLink = async () => {
    if (!referralLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('ref_join_title'),
          text: t('ref_join_text'),
          url: referralLink,
        });
      } catch {
        copyLink();
      }
    } else {
      copyLink();
    }
  };

  if (!isAuthenticated) {
    return (
      <PageShell>
        <Header />
        <main className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <Gift className="w-16 h-16 text-primary/40 mb-4" />
          <h2 className="text-lg font-bold text-foreground mb-2">{t('ref_login_title')}</h2>
          <p className="text-sm text-muted-foreground mb-6 text-center">
            {t('ref_login_desc')}
          </p>
          <Link to="/auth">
            <Button className="bg-primary text-primary-foreground">{t('ref_login_btn')}</Button>
          </Link>
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Header />

      <main className="py-6 px-4 space-y-5">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/settings">
              <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
            </Link>
            <h1 className="text-xl font-bold text-foreground">{t('ref_title')}</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={refresh} className="h-8 w-8">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
        </div>

        {/* Hero Card */}
        <GlowCard>
          <CardContent className="p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 mx-auto mb-4 flex items-center justify-center border border-accent/20">
              <Gift className="w-7 h-7 text-accent" />
            </div>
            <h2 className="text-2xl font-extrabold text-foreground mb-1">
              {t('ref_earn_up_to')} <span className="text-accent">$25</span>
            </h2>
            <p className="text-sm text-primary font-semibold mb-1">
              {t('ref_free_days')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('ref_per_friend')}
            </p>
          </CardContent>
        </GlowCard>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))
          ) : (
            <>
              <StatCard
                icon={Users} label={t('ref_total_referrals')}
                value={stats?.total ?? 0} color="text-primary" bg="bg-primary/10"
              />
              <StatCard
                icon={CheckCircle2} label={t('ref_completed')}
                value={stats?.completed ?? 0} color="text-green-400" bg="bg-green-400/10"
              />
              <StatCard
                icon={DollarSign} label={t('ref_earned')}
                value={`$${stats?.totalEarned ?? 0}`} color="text-accent" bg="bg-accent/10"
              />
              <StatCard
                icon={CalendarPlus} label={t('ref_extra_days')}
                value={stats?.totalDays ?? 0} color="text-blue-400" bg="bg-blue-400/10"
              />
            </>
          )}
        </div>

        {/* Referral Link */}
        <GlowCard>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-primary flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              {t('ref_your_link')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <>
                <div className="flex gap-2">
                  <Input
                    value={referralLink || t('ref_generating')}
                    readOnly
                    className="bg-secondary border-border text-xs font-mono"
                  />
                  <Button onClick={copyLink} variant="outline" size="icon" disabled={!referralLink}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                {code && (
                  <p className="text-center text-xs text-muted-foreground">
                    {t('ref_your_code')} <span className="font-bold text-foreground tracking-wider">{code}</span>
                  </p>
                )}
                <Button
                  onClick={shareLink}
                  disabled={!referralLink}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  {t('ref_share_invitation')}
                </Button>
              </>
            )}
          </CardContent>
        </GlowCard>

        {/* How It Works */}
        <GlowCard>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-primary">{t('ref_how_it_works')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Step
              icon={Share2} iconBg="bg-primary/15" iconColor="text-primary"
              title={t('ref_step1_title')}
              desc={t('ref_step1_desc')}
              step={1}
            />
            <Step
              icon={Users} iconBg="bg-primary/15" iconColor="text-primary"
              title={t('ref_step2_title')}
              desc={t('ref_step2_desc')}
              step={2}
            />
            <Step
              icon={Trophy} iconBg="bg-accent/15" iconColor="text-accent"
              title={t('ref_step3_title')}
              desc={t('ref_step3_desc')}
              step={3}
            />
          </CardContent>
        </GlowCard>

        {/* Referral History */}
        <ReferralHistory loading={loading} stats={stats} t={t} />
      </main>
    </PageShell>
  );
}

function ReferralHistory({ loading, stats, t }: { loading: boolean; stats: any; t: (k: string) => string }) {
  return (
    <GlowCard>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-primary flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {t('ref_history')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : !stats?.referrals?.length ? (
          <div className="text-center py-8">
            <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {t('ref_no_referrals')}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {stats.referrals.map((r: any) => (
              <div
                key={r.id}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg',
                  r.status === 'completed' ? 'bg-green-500/5 border border-green-500/15' : 'bg-secondary'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center',
                    r.status === 'completed' ? 'bg-green-500/15' : 'bg-muted-foreground/10'
                  )}>
                    {r.status === 'completed'
                      ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                      : <Clock className="w-4 h-4 text-muted-foreground" />
                    }
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString()}
                    </p>
                    <p className={cn(
                      'text-xs font-medium',
                      r.status === 'completed' ? 'text-green-400' : 'text-muted-foreground'
                    )}>
                      {r.status === 'completed' ? t('ref_status_completed') : t('ref_status_pending')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">${r.reward_amount}</p>
                  <p className="text-[10px] text-muted-foreground">+{r.reward_days} {t('ref_days_suffix')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </GlowCard>
  );
}

function StatCard({ icon: Icon, label, value, color, bg }: {
  icon: any; label: string; value: string | number; color: string; bg: string;
}) {
  return (
    <GlowCard>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', bg)}>
          <Icon className={cn('w-5 h-5', color)} />
        </div>
        <div>
          <p className="text-lg font-bold text-foreground">{value}</p>
          <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
        </div>
      </CardContent>
    </GlowCard>
  );
}

function Step({ icon: Icon, iconBg, iconColor, title, desc, step }: {
  icon: any; iconBg: string; iconColor: string; title: string; desc: string; step: number;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', iconBg)}>
          <Icon className={cn('w-4 h-4', iconColor)} />
        </div>
        {step < 3 && <div className="w-px h-full bg-border mt-1" />}
      </div>
      <div className="pb-4">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}
