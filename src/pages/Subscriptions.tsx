import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/button';
import { Shield, ArrowLeft, Settings2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlanCarousel } from '@/components/subscriptions/PlanCarousel';
import { useSubscription } from '@/hooks/useSubscription';
import { SUBSCRIPTION_TIERS } from '@/config/subscriptionTiers';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n/LanguageContext';

function getPlans(t: (key: string) => string) {
  return [
    {
      id: 'basico' as const,
      name: t('sub_plan_basico'),
      subtitle: t('sub_plan_basico_subtitle'),
      description: t('sub_plan_basico_desc'),
      priceMonthly: 30,
      priceWeekly: 10,
      color: 'from-yellow-500/20 to-yellow-600/10',
      borderColor: 'border-yellow-500/50',
      badgeColor: 'bg-yellow-500 text-black',
      features: [
        t('sub_feat_main_signals'),
        t('sub_feat_10_signals'),
        t('sub_feat_history'),
        t('sub_feat_education'),
        t('sub_feat_price_alerts'),
        t('sub_feat_broker_recs'),
        t('sub_feat_trading_recs'),
        t('sub_feat_support_247'),
      ],
    },
    {
      id: 'plus' as const,
      name: t('sub_plan_plus'),
      subtitle: t('sub_plan_plus_subtitle'),
      description: t('sub_plan_plus_desc'),
      priceMonthly: 35,
      priceWeekly: 12,
      color: 'from-primary/30 to-primary/10',
      borderColor: 'border-primary',
      badgeColor: 'bg-primary text-primary-foreground',
      featured: true,
      features: [
        t('sub_feat_all_signals'),
        t('sub_feat_20_signals'),
        t('sub_feat_history'),
        t('sub_feat_education'),
        t('sub_feat_unlimited_alerts'),
        t('sub_feat_broker_recs'),
        t('sub_feat_trading_recs'),
        t('sub_feat_support_247'),
        t('sub_feat_ai_analysis'),
        t('sub_feat_strategy'),
        t('sub_feat_tools'),
      ],
    },
    {
      id: 'premium' as const,
      name: t('sub_plan_premium'),
      subtitle: t('sub_plan_premium_subtitle'),
      description: t('sub_plan_premium_desc'),
      priceMonthly: 40,
      priceWeekly: 15,
      color: 'from-blue-500/20 to-blue-600/10',
      borderColor: 'border-blue-500/50',
      badgeColor: 'bg-blue-500 text-white',
      features: [
        t('sub_feat_all_signals'),
        t('sub_feat_unlimited_signals'),
        t('sub_feat_history'),
        t('sub_feat_education'),
        t('sub_feat_unlimited_alerts'),
        t('sub_feat_broker_recs'),
        t('sub_feat_trading_recs'),
        t('sub_feat_support_247'),
        t('sub_feat_ai_analysis'),
        t('sub_feat_strategy'),
        t('sub_feat_tools'),
        t('sub_feat_signal_trader'),
        t('sub_feat_broker_connection'),
        t('sub_feat_multi_broker'),
        t('sub_feat_all_in_one'),
      ],
    },
  ];
}

export default function Subscriptions() {
  const { t } = useTranslation();
  const [billingPeriod, setBillingPeriod] = useState<'weekly' | 'monthly'>('monthly');
  const [searchParams] = useSearchParams();
  const { subscribed, tier, subscriptionEnd, loading, startCheckout, openPortal, checkSubscription, onTrial, trialDaysLeft } = useSubscription();
  const plans = getPlans(t);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success(t('sub_success'));
      checkSubscription();
    } else if (searchParams.get('canceled') === 'true') {
      toast.info(t('sub_canceled'));
    }
  }, [searchParams, checkSubscription, t]);

  const handleSubscribe = async (planId: string) => {
    try {
      const tierConfig = SUBSCRIPTION_TIERS[planId as keyof typeof SUBSCRIPTION_TIERS];
      if (!tierConfig) return;
      const priceId = billingPeriod === 'monthly' ? tierConfig.monthly_price_id : tierConfig.weekly_price_id;
      await startCheckout(priceId);
    } catch (err) {
      toast.error(t('sub_checkout_error'));
      console.error(err);
    }
  };

  return (
    <PageShell>
      <Header />
      <main className="py-6">
        <div className="flex items-center justify-between mb-6 px-4">
          <div className="flex items-center gap-4">
            <Link to="/"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
          </div>
          <div className="flex items-center gap-2">
            {subscribed && (
              <Button variant="outline" size="sm" onClick={openPortal} className="text-xs gap-1.5 border-primary/40 text-primary">
                <Settings2 className="w-3.5 h-3.5" />{t('sub_manage')}
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={checkSubscription} className="h-8 w-8">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {onTrial && (
          <div className="mx-4 mb-4 p-4 rounded-xl bg-gradient-to-r from-amber-500/15 to-orange-500/10 border border-amber-500/30 text-center space-y-1">
            <p className="text-sm font-bold text-amber-400">{t('trial_active')}</p>
            <p className="text-xs text-amber-300/80">
              {t('trial_full_access')}{' '}
              <span className="font-bold text-amber-200">
                {t('trial_days_left').replace('{count}', String(trialDaysLeft)).replace('{unit}', trialDaysLeft === 1 ? 'día' : 'días')}
              </span>
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">{t('trial_subscribe_before')}</p>
          </div>
        )}

        {subscribed && !onTrial && tier && (
          <div className="mx-4 mb-4 p-3 rounded-lg bg-primary/10 border border-primary/30 text-center">
            <p className="text-sm text-primary font-medium">
              {t('sub_active_plan')}: <span className="font-bold capitalize">{tier}</span>
              {subscriptionEnd && (
                <span className="text-muted-foreground ml-2">
                  · {t('sub_renews_on')} {new Date(subscriptionEnd).toLocaleDateString('es-ES')}
                </span>
              )}
            </p>
          </div>
        )}

        <div className="text-center mb-6 px-4">
          <h1 className="text-xl md:text-2xl font-bold text-foreground mb-2">{t('sub_title')}</h1>
          <p className="text-lg text-primary font-semibold mb-1">{t('sub_subtitle')}</p>
          <p className="text-sm text-muted-foreground">{t('sub_choose_plan')}</p>
        </div>

        <div className="flex justify-center mb-6 px-4">
          <div className="inline-flex rounded-lg bg-secondary p-1">
            <button
              onClick={() => setBillingPeriod('weekly')}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                billingPeriod === 'weekly' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t('sub_weekly')}
            </button>
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                billingPeriod === 'monthly' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t('sub_monthly')}
            </button>
          </div>
        </div>

        <PlanCarousel plans={plans} billingPeriod={billingPeriod} activeTier={tier} onSubscribe={handleSubscribe} />

        <div className="text-center space-y-4 mt-8 px-4">
          <p className="text-sm text-muted-foreground">
            {t('sub_no_contracts')}{' '}
            <span className="text-foreground font-medium">{t('sub_cancel_anytime')}</span>
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-4 h-4 text-primary" />
            <span>{t('sub_secure_payment')}</span>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
