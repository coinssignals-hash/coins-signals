import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SUBSCRIPTION_TIERS } from '@/config/subscriptionTiers';

export interface SubscriptionState {
  subscribed: boolean;
  productId: string | null;
  priceId: string | null;
  subscriptionEnd: string | null;
  tier: string | null;
  loading: boolean;
  onTrial: boolean;
  trialEndsAt: string | null;
  trialDaysLeft: number;
}

export function useSubscription() {
  const [state, setState] = useState<SubscriptionState>({
    subscribed: false,
    productId: null,
    priceId: null,
    subscriptionEnd: null,
    tier: null,
    loading: true,
    onTrial: false,
    trialEndsAt: null,
    trialDaysLeft: 0,
  });

  const checkSubscription = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setState(prev => ({ ...prev, subscribed: false, tier: null, loading: false, onTrial: false, trialDaysLeft: 0 }));
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;

      // Determine tier from product_id
      let tier: string | null = null;
      if (data?.product_id) {
        const found = Object.entries(SUBSCRIPTION_TIERS).find(
          ([, t]) => t.product_id === data.product_id
        );
        tier = found ? found[0] : null;
      }

      // If on trial with no paid tier, grant premium access
      if (data?.on_trial && !tier) {
        tier = 'premium';
      }

      setState({
        subscribed: data?.subscribed ?? false,
        productId: data?.product_id ?? null,
        priceId: data?.price_id ?? null,
        subscriptionEnd: data?.subscription_end ?? null,
        tier,
        loading: false,
        onTrial: data?.on_trial ?? false,
        trialEndsAt: data?.trial_ends_at ?? null,
        trialDaysLeft: data?.trial_days_left ?? 0,
      });
    } catch (err) {
      console.error('Error checking subscription:', err);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    checkSubscription();

    const interval = setInterval(checkSubscription, 60000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkSubscription();
    });

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, [checkSubscription]);

  const startCheckout = useCallback(async (priceId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = '/auth';
      return;
    }

    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { priceId },
    });

    if (error) throw error;
    if (data?.url) {
      window.open(data.url, '_blank');
    }
  }, []);

  const openPortal = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('customer-portal');
    if (error) throw error;
    if (data?.url) {
      window.open(data.url, '_blank');
    }
  }, []);

  return { ...state, checkSubscription, startCheckout, openPortal };
}
