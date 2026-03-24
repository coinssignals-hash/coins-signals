import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { GlowSection } from '@/components/ui/glow-section';
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

const ACCENT = '38 95% 55%';

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
      try { await navigator.share({ title: t('ref_join_title'), text: t('ref_join_text'), url: referralLink }); } catch { copyLink(); }
    } else { copyLink(); }
  };

  if (!isAuthenticated) {
    return (
      <PageShell>
        <Header />
        <main className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{
            background: `linear-gradient(165deg, hsl(${ACCENT} / 0.2), hsl(${ACCENT} / 0.05))`,
            border: `1px solid hsl(${ACCENT} / 0.2)`,
          }}>
            <Gift className="w-8 h-8" style={{ color: `hsl(${ACCENT})` }} />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">{t('ref_login_title')}</h2>
          <p className="text-sm text-muted-foreground mb-6 text-center">{t('ref_login_desc')}</p>
          <Link to="/auth">
            <button className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white" style={{
              background: `linear-gradient(165deg, hsl(${ACCENT}), hsl(${ACCENT} / 0.8))`,
              boxShadow: `0 0 15px hsl(${ACCENT} / 0.3)`,
            }}>{t('ref_login_btn')}</button>
          </Link>
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Header />

      {/* ── Premium Hero Header ── */}
      <div className="relative overflow-hidden" style={{
        background: `linear-gradient(165deg, hsl(${ACCENT} / 0.15) 0%, hsl(var(--background)) 50%)`,
      }}>
        <div className="absolute top-0 inset-x-0 h-[2px]" style={{
          background: `linear-gradient(90deg, transparent, hsl(${ACCENT} / 0.8), transparent)`,
        }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-32 rounded-full opacity-20 pointer-events-none" style={{
          background: `radial-gradient(circle, hsl(${ACCENT} / 0.4), transparent 70%)`,
        }} />
        <div className="relative px-4 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/settings" className="p-2 rounded-xl transition-all active:scale-95" style={{
                background: 'hsl(var(--muted) / 0.5)', backdropFilter: 'blur(8px)', border: `1px solid hsl(${ACCENT} / 0.15)`,
              }}>
                <ArrowLeft className="w-4 h-4 text-foreground" />
              </Link>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{
                background: `linear-gradient(165deg, hsl(${ACCENT} / 0.25), hsl(${ACCENT} / 0.08))`,
                border: `1px solid hsl(${ACCENT} / 0.3)`, boxShadow: `0 0 20px hsl(${ACCENT} / 0.15)`,
              }}>
                <Gift className="w-5 h-5" style={{ color: `hsl(${ACCENT})` }} />
              </div>
              <h1 className="text-lg font-bold text-foreground">{t('ref_title')}</h1>
            </div>
            <button onClick={refresh} className="p-2 rounded-xl transition-all active:scale-95" style={{
              background: 'hsl(var(--muted) / 0.3)', border: `1px solid hsl(${ACCENT} / 0.1)`,
            }}>
              <RefreshCw className={cn("w-4 h-4 text-muted-foreground", loading && "animate-spin")} />
            </button>
          </div>
        </div>
      </div>

      <main className="px-4 py-4 space-y-4">
        {/* Hero Card */}
        <GlowSection color={ACCENT}>
          <div className="p-6 text-center">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{
              background: `linear-gradient(165deg, hsl(${ACCENT} / 0.2), hsl(${ACCENT} / 0.05))`,
              border: `1px solid hsl(${ACCENT} / 0.25)`, boxShadow: `0 0 25px hsl(${ACCENT} / 0.15)`,
            }}>
              <Gift className="w-7 h-7" style={{ color: `hsl(${ACCENT})` }} />
            </div>
            <h2 className="text-2xl font-extrabold text-foreground mb-1">
              {t('ref_earn_up_to')} <span style={{ color: `hsl(${ACCENT})` }}>$25</span>
            </h2>
            <p className="text-sm font-semibold" style={{ color: `hsl(${ACCENT})` }}>{t('ref_free_days')}</p>
            <p className="text-xs text-muted-foreground">{t('ref_per_friend')}</p>
          </div>
        </GlowSection>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (<Skeleton key={i} className="h-20 rounded-xl" />))
          ) : (
            <>
              <StatCard icon={Users} label={t('ref_total_referrals')} value={stats?.total ?? 0} color="210 70% 55%" />
              <StatCard icon={CheckCircle2} label={t('ref_completed')} value={stats?.completed ?? 0} color="142 71% 45%" />
              <StatCard icon={DollarSign} label={t('ref_earned')} value={`$${stats?.totalEarned ?? 0}`} color={ACCENT} />
              <StatCard icon={CalendarPlus} label={t('ref_extra_days')} value={stats?.totalDays ?? 0} color="217 91% 60%" />
            </>
          )}
        </div>

        {/* Referral Link */}
        <GlowSection color={ACCENT}>
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: `hsl(${ACCENT})` }} />
              <span className="text-sm font-semibold text-foreground">{t('ref_your_link')}</span>
            </div>
            {loading ? (<Skeleton className="h-10 w-full" />) : (
              <>
                <div className="flex gap-2">
                  <Input value={referralLink || t('ref_generating')} readOnly className="bg-background/50 border-white/10 text-xs font-mono" />
                  <button onClick={copyLink} disabled={!referralLink} className="px-3 rounded-xl transition-all active:scale-95 disabled:opacity-40" style={{
                    border: `1px solid hsl(${ACCENT} / 0.3)`,
                  }}>
                    <Copy className="w-4 h-4" style={{ color: `hsl(${ACCENT})` }} />
                  </button>
                </div>
                {code && (
                  <p className="text-center text-xs text-muted-foreground">
                    {t('ref_your_code')} <span className="font-bold text-foreground tracking-wider">{code}</span>
                  </p>
                )}
                <button onClick={shareLink} disabled={!referralLink} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.97] disabled:opacity-40 flex items-center justify-center gap-2" style={{
                  background: `linear-gradient(165deg, hsl(${ACCENT}), hsl(${ACCENT} / 0.8))`,
                  boxShadow: `0 0 15px hsl(${ACCENT} / 0.25)`,
                }}>
                  <Share2 className="w-4 h-4" />{t('ref_share_invitation')}
                </button>
              </>
            )}
          </div>
        </GlowSection>

        {/* How It Works */}
        <GlowSection color={ACCENT}>
          <div className="p-4 space-y-4">
            <span className="text-sm font-semibold text-foreground">{t('ref_how_it_works')}</span>
            <Step icon={Share2} color={ACCENT} title={t('ref_step1_title')} desc={t('ref_step1_desc')} step={1} />
            <Step icon={Users} color={ACCENT} title={t('ref_step2_title')} desc={t('ref_step2_desc')} step={2} />
            <Step icon={Trophy} color={ACCENT} title={t('ref_step3_title')} desc={t('ref_step3_desc')} step={3} />
          </div>
        </GlowSection>

        {/* Referral History */}
        <ReferralHistory loading={loading} stats={stats} t={t} />
      </main>
    </PageShell>
  );
}

function ReferralHistory({ loading, stats, t }: { loading: boolean; stats: any; t: (k: string) => string }) {
  return (
    <GlowSection color={ACCENT}>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4" style={{ color: `hsl(${ACCENT})` }} />
          <span className="text-sm font-semibold text-foreground">{t('ref_history')}</span>
        </div>
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => (<Skeleton key={i} className="h-16 rounded-lg" />))}</div>
        ) : !stats?.referrals?.length ? (
          <div className="text-center py-8">
            <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{t('ref_no_referrals')}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {stats.referrals.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-xl" style={{
                background: r.status === 'completed' ? 'hsl(142 71% 45% / 0.05)' : `hsl(${ACCENT} / 0.04)`,
                border: `1px solid ${r.status === 'completed' ? 'hsl(142 71% 45% / 0.15)' : `hsl(${ACCENT} / 0.1)`}`,
              }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{
                    background: r.status === 'completed' ? 'hsl(142 71% 45% / 0.15)' : 'hsl(var(--muted) / 0.3)',
                  }}>
                    {r.status === 'completed' ? <CheckCircle2 className="w-4 h-4" style={{ color: 'hsl(142 71% 45%)' }} /> : <Clock className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                    <p className={cn('text-xs font-medium', r.status === 'completed' ? '' : 'text-muted-foreground')} style={{ color: r.status === 'completed' ? 'hsl(142 71% 45%)' : undefined }}>
                      {r.status === 'completed' ? t('ref_status_completed') : t('ref_status_pending')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: `hsl(${ACCENT})` }}>${r.reward_amount}</p>
                  <p className="text-[10px] text-muted-foreground">+{r.reward_days} {t('ref_days_suffix')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </GlowSection>
  );
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: any; label: string; value: string | number; color: string;
}) {
  return (
    <GlowSection color={color}>
      <div className="p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{
          background: `linear-gradient(165deg, hsl(${color} / 0.2), hsl(${color} / 0.05))`,
          border: `1px solid hsl(${color} / 0.2)`,
        }}>
          <Icon className="w-4 h-4" style={{ color: `hsl(${color})` }} />
        </div>
        <div>
          <p className="text-lg font-bold text-foreground">{value}</p>
          <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
        </div>
      </div>
    </GlowSection>
  );
}

function Step({ icon: Icon, color, title, desc, step }: {
  icon: any; color: string; title: string; desc: string; step: number;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{
          background: `hsl(${color} / 0.12)`, border: `1px solid hsl(${color} / 0.2)`,
        }}>
          <Icon className="w-4 h-4" style={{ color: `hsl(${color})` }} />
        </div>
        {step < 3 && <div className="w-px h-full mt-1" style={{ background: `hsl(${color} / 0.15)` }} />}
      </div>
      <div className="pb-4">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}
