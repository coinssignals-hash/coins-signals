import { ReactNode } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { useUserRole } from '@/hooks/useUserRole';
import { SubscriptionPaywall } from '@/components/subscriptions/SubscriptionPaywall';
import { Loader2 } from 'lucide-react';

interface SubscriptionGateProps {
  children: ReactNode;
  /** Minimum tier required. If not set, any active subscription works. */
  requiredTier?: 'basico' | 'plus' | 'premium';
  /** Feature name shown in the paywall */
  featureName?: string;
}

const TIER_LEVEL: Record<string, number> = {
  basico: 1,
  plus: 2,
  premium: 3,
};

export function SubscriptionGate({ children, requiredTier, featureName }: SubscriptionGateProps) {
  const { subscribed, tier, loading, onTrial } = useSubscription();
  const { isAdmin } = useUserRole();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Trial users get full premium access
  if (onTrial) {
    return <>{children}</>;
  }

  if (!subscribed) {
    return <SubscriptionPaywall featureName={featureName} reason="no_subscription" />;
  }

  if (requiredTier && tier) {
    const userLevel = TIER_LEVEL[tier] ?? 0;
    const requiredLevel = TIER_LEVEL[requiredTier] ?? 0;
    if (userLevel < requiredLevel) {
      return (
        <SubscriptionPaywall
          featureName={featureName}
          reason="upgrade_required"
          currentTier={tier}
          requiredTier={requiredTier}
        />
      );
    }
  }

  return <>{children}</>;
}
